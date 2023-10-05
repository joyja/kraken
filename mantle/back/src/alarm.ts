import type { Pool } from 'pg'
import { SparkplugMetric } from './mqtt'
import { Log } from './log'
import { pool } from './database'
import { AlarmCondition, CreateAlarm, UpdateAlarm } from './resolvers/types'

const log = new Log('Alarm')

interface AlarmConstructorOptions {
  alarms: Alarms
  id:string
  name:string
  enabled:boolean
  priority:string
  condition:AlarmCondition
  groupId:string
  nodeId:string
  deviceId:string
  metricId:string
  acknowledged:boolean
  active:boolean
}

class Alarms {
  private pool:Pool
  public history?:AlarmHistory
  public alarms: Alarm[] = []
  private tableName = process.env.MANTLE_ALARM_TABLENAME || 'alarm'
  static async initializeAlarm(pool:Pool) {
    const alarm = new Alarms(pool)
    await alarm.createTableIfNotExists()
    alarm.history = await AlarmHistory.initializeAlarmHistory(pool)
    await alarm.getAlarms()
    return alarm
  }
  constructor(pool:Pool) {
    this.pool = pool
  }
  private async createTableIfNotExists() {
    let sql = `CREATE TABLE IF NOT EXISTS "${this.tableName}" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "name" TEXT,
      "enabled" BOOLEAN,
      "priority" TEXT,
      "condition" JSON,
      "group_id" TEXT,
      "node_id" TEXT,
      "device_id" TEXT,
      "metric_id" TEXT,
      "active" BOOLEAN,
      "acknowledged" BOOLEAN,
      "retired" BOOLEAN,
    )`
    await this.pool.query(sql)
  }
  private async getAlarms() {
    this.alarms = []
    const sql = `SELECT * FROM ${this.tableName} WHERE retired=`
    const { rows } = await this.pool.query(sql)
    for (const row of rows) {
      const alarm = new Alarm({
        alarms: this,
        id: row.id,
        name: row.name,
        enabled: row.enabled,
        priority: row.priority,
        condition: row.condition,
        groupId: row.group_id,
        nodeId: row.node_id,
        deviceId: row.device_id,
        metricId: row.metric_id,
        acknowledged: row.acknowledged,
        active: row.active
      })
      this.alarms.push(alarm)
    }
  }
  public async updateAlarm(alarm:Alarm) {
    const sql = `UPDATE ${this.tableName} SET name=$1,enabled=$2,priority=$3,condition=$4,group_id=$5,node_id=$6,device_id=$7,metric_id=$8 WHERE id=$9`
    const values = [alarm.name, alarm.enabled, alarm.priority, alarm.condition, alarm.groupId, alarm.nodeId, alarm.deviceId, alarm.metricId, alarm.id]
    await this.pool.query(sql, values)
    await this.getAlarms()
  }
  public async createAlarm(input:CreateAlarm) {
    const sql = `INSERT INTO ${this.tableName} (name,enabled,priority,condition,group_id,node_id,device_id,metric_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`
    const values = [input.name, input.enabled, input.priority, input.condition, input.groupId, input.nodeId, input.deviceId, input.metricId]
    const rows = await this.pool.query(sql, values)
    await this.getAlarms()
    return this.getAlarm(rows.rows[0].id)
  }
  public async deleteAlarm(alarm:Alarm) {
    const sql = `UPDATE ${this.tableName} SET retired=1 WHERE id=$1`
    const values = [alarm.id]
    await this.pool.query(sql, values)
    await this.getAlarms()
    return alarm
  }
  getAlarm(id:string) {
    return this.alarms.find(alarm => alarm.id === id)
  }
}

class Alarm {
  public alarms:Alarms
  public id:string
  public name:string
  public enabled:boolean
  public priority:string
  public condition:AlarmCondition
  public groupId:string
  public nodeId:string
  public deviceId:string
  public metricId:string
  public acknowledged:boolean
  public active:boolean
  constructor({ alarms, id, name, enabled, priority, condition, groupId, nodeId, deviceId, metricId, acknowledged, active}:AlarmConstructorOptions) {
    this.alarms = alarms
    this.id = id
    this.name = name
    this.enabled = enabled
    this.priority = priority
    this.condition = condition
    this.groupId = groupId
    this.nodeId = nodeId
    this.deviceId = deviceId
    this.metricId = metricId
    this.acknowledged = acknowledged
    this.active = active
  }
  evaluate(metric:SparkplugMetric) {
    const value = metric.value
    if (this.condition.mode === 'EQUAL') {
      return value === this.condition.setpoint
    } else if (this.condition.mode === 'NOT_EQUAL') {
      return value !== this.condition.setpoint
    } else if (this.condition.mode === 'ABOVE_SETPOINT') {
      if (typeof value === 'number') {
        return this.condition.inclusive ? value >= this.condition.setpoint! : value > this.condition.setpoint!
      } else {
        throw Error('Cannot evaluate Above Setpoint condition on non-numeric value')
      }
    } else if (this.condition.mode === 'BELOW_SETPOINT') {
      if (typeof value === 'number') {
        return this.condition.inclusive ? value <= this.condition.setpoint! : value < this.condition.setpoint!
      } else {
        throw Error('Cannot evaluate Below Setpoint condition on non-numeric value')
      }
    } else if (this.condition.mode === 'BETWEEN_SETPOINTS') {
      if (typeof value === 'number') {
        const low = this.condition.inclusiveLow ? value <= this.condition.setpointLow! : value < this.condition.setpointLow!
        const high = this.condition.inclusiveHigh ? value >= this.condition.setpointHigh! : value > this.condition.setpointHigh!
        return !low && !high
      } else {
        throw Error('Cannot evaluate Between Setpoints condition on non-numeric value')
      }
    } else if (this.condition.mode === 'OUTSIDE_SETPOINTS') {
      if (typeof value === 'number') {
        const low = this.condition.inclusiveLow ? value <= this.condition.setpointLow! : value < this.condition.setpointLow!
        const high = this.condition.inclusiveHigh ? value >= this.condition.setpointHigh! : value > this.condition.setpointHigh!
        return low || high
      } else {
        throw Error('Cannot evaluate Outside Setpoints condition on non-numeric value')
      }
    } else {
      throw Error('Unknown condition mode')
    }
  }
  async evaluateAndLog(metric:SparkplugMetric) {
    const result = this.evaluate(metric)
    if (result !== this.active) {
      await this.alarms.history!.log(this, result)
    }
    this.active = result
    return result
  }
  async acknowledgeAndLog() {
    if (!this.acknowledged) {
      this.acknowledged = true
      await this.alarms.updateAlarm(this)
      await this.alarms.history!.log(this, this.active)
    }
  }
  async delete() {
    await this.alarms.deleteAlarm(this)
  }
  async update({ name, enabled, priority, condition, groupId, nodeId, deviceId, metricId }:UpdateAlarm) {
    if (name) {
      this.name = name
    }
    if (enabled) {
      this.enabled = enabled
    }
    if (priority) {
      this.priority = priority
    }
    if (condition) {
      this.condition = condition
    }
    if (groupId) {
      this.groupId = groupId
    }
    if (nodeId) {
      this.nodeId = nodeId
    }
    if (deviceId) {
      this.deviceId = deviceId
    }
    if (metricId) {
      this.metricId = metricId
    }
    await this.alarms.updateAlarm(this)
  }
}

class AlarmHistory {
  private pool:Pool
  private tableName = process.env.MANTLE_ALARM_HISTORY_TABLENAME || 'alarm_history'
  private alarmTableName = process.env.MANTLE_ALARM_TABLENAME || 'alarm'
  static async initializeAlarmHistory(pool:Pool) {
    const alarmHistory = new AlarmHistory(pool)
    await alarmHistory.createTableIfNotExists()
    return alarmHistory
  }
  constructor(pool:Pool) {
    this.pool = pool
  }
  private async createTableIfNotExists() {
    let sql = `CREATE TABLE IF NOT EXISTS "${this.tableName}" (
      "alarm_id" UUID REFERENCES ${this.alarmTableName}(id)
      "timestamp" TIMESTAMPZ,
      "acknowledged" BOOLEAN,
      "active" BOOLEAN,
    )`
    await this.pool.query(sql)
    sql = `SELECT create_hypertable('${this.tableName}','timestamp',if_not_exists => TRUE)`
    await this.pool.query(sql)
  }
  public async log(alarm:Alarm, result:boolean) {
    const sql = `INSERT INTO ${this.tableName} (alarm_id,timestamp,acknowledged,active) VALUES ($1,$2,$3,$4,$5)`
    const values = [alarm.id, new Date(), alarm.acknowledged, result]
    this.pool.query(sql, values)
  }
}

export const alarms = new Alarms(pool)