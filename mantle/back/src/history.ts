import { type Pool } from 'pg'
import { SparkplugMetric } from './mqtt'
import { Log } from './log'

const log = new Log('history')

export class History {
  private pool:Pool
  private tableName = process.env.MANTLE_HISTORY_TABLENAME || 'history'
  private constructor(pool:Pool) {
    this.pool = pool
  }
  static async initializeHistory(pool:Pool) {
    const history = new History(pool)
    await history.createTableIfNotExists()
    return history
  }
  private async createTableIfNotExists() {
    let sql = `CREATE TABLE IF NOT EXISTS "${this.tableName}" (
      "group_id" TEXT,
      "node_id" TEXT,
      "device_id" TEXT,
      "metric_id" TEXT,
      "int_value" INTEGER,
      "float_value" FLOAT,
      "string_value" TEXT,
      "bool_value" BOOLEAN,
      "timestamp" TIMESTAMPTZ
    )`
    await this.pool.query(sql)
    sql = `SELECT create_hypertable('${this.tableName}','timestamp',if_not_exists => TRUE)`
    await this.pool.query(sql)
  }
  async log(metric:SparkplugMetric) {
    let valueColumn = metric.type.startsWith('Int') ? 'int_value' : metric.type === 'Float' ? 'float_value' : metric.type === 'String' ? 'string_value' : metric.type === 'Boolean' ? 'bool_value' : null
    let value = metric.value
    if (valueColumn && value) {
      let sql = `INSERT INTO "${this.tableName}" ("group_id", "node_id", "device_id", "metric_id", "${valueColumn}", timestamp) VALUES ($1, $2, $3, $4, $5, $6)`
      let params = [metric.groupId, metric.nodeId, metric.deviceId, metric.id, value, metric.updatedOn]
      this.pool.query(sql, params)
    } else {
      log.info(`Received metric with invalid value (${ JSON.stringify(value,null,2)}) or value type (${ metric.type }), not logging.`)
    }
  }
  async getHistory({ metric, start, end }:{ metric:SparkplugMetric, start:Date, end:Date }) {
    let sql = `SELECT * FROM "${this.tableName}" WHERE "group_id" = $1 AND "node_id" = $2 AND "device_id" = $3 AND "metric_id" = $4 AND "timestamp" >= $5 AND "timestamp" <= $6 ORDER BY "timestamp" ASC`
    let params = [metric.groupId, metric.nodeId, metric.deviceId, metric.id, start, end]
    let result = await this.pool.query(sql, params)
    return result.rows
  }
}