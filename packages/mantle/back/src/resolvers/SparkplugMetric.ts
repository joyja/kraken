import { type SparkplugMetric , spdata } from '../mqtt.js'
import { addMinutes } from 'date-fns'
import { type MetricHistoryEntry } from './types.js'

export async function history(parent: SparkplugMetric): Promise<MetricHistoryEntry[]> {
	const end = new Date()
	const start = addMinutes(end, -15)
	const history = await spdata.history?.getHistory({
		metric: parent,
		start,
		end
	})
	return history?.map((row: any) => {
		return {
			...row,
			timestamp: row.timestamp,
			value: `${row.intValue ?? row.floatValue ?? row.stringValue ?? row.boolValue}`
		}
	})
}

export function value(parent: SparkplugMetric):string {
	return parent.value?.toString != null ? parent.value.toString() : parent.value
}
