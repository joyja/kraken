"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const log_1 = require("./log");
const log = new log_1.Log('history');
class History {
    constructor(pool) {
        this.pool = pool;
    }
    static initializeHistory(pool) {
        return __awaiter(this, void 0, void 0, function* () {
            const history = new History(pool);
            yield history.createTableIfNotExists();
            return history;
        });
    }
    createTableIfNotExists() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `CREATE TABLE IF NOT EXISTS "history" (
      "group_id" TEXT,
      "node_id" TEXT,
      "device_id" TEXT,
      "metric_id" TEXT,
      "int_value" INTEGER,
      "float_value" FLOAT,
      "string_value" TEXT,
      "bool_value" BOOLEAN,
      "timestamp" TIMESTAMPTZ
    )`;
            yield this.pool.query(sql);
            sql = `SELECT create_hypertable('history','timestamp',if_not_exists => TRUE)`;
            yield this.pool.query(sql);
        });
    }
    log(metric) {
        return __awaiter(this, void 0, void 0, function* () {
            let valueColumn = metric.type.startsWith('Int') ? 'int_value' : metric.type === 'Float' ? 'float_value' : metric.type === 'String' ? 'string_value' : metric.type === 'Boolean' ? 'bool_value' : null;
            let value = metric.value;
            if (valueColumn && value) {
                let sql = `INSERT INTO history ("group_id", "node_id", "device_id", "metric_id", "${valueColumn}", timestamp) VALUES ($1, $2, $3, $4, $5, $6)`;
                let params = [metric.groupId, metric.nodeId, metric.deviceId, metric.id, value, metric.updatedOn];
                this.pool.query(sql, params);
            }
            else {
                log.info(`Received metric with invalid value (${JSON.stringify(value, null, 2)}) or value type (${metric.type}), not logging.`);
            }
        });
    }
    getHistory({ metric, start, end }) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `SELECT * FROM history WHERE "group_id" = $1 AND "node_id" = $2 AND "device_id" = $3 AND "metric_id" = $4 AND "timestamp" >= $5 AND "timestamp" <= $6 ORDER BY "timestamp" ASC`;
            let params = [metric.groupId, metric.nodeId, metric.deviceId, metric.id, start, end];
            let result = yield this.pool.query(sql, params);
            return result.rows;
        });
    }
}
exports.History = History;
