import { SparkplugMetric } from '../mqtt';
import { spdata } from '../mqtt';
import addMinutes from 'date-fns/addMinutes';

export async function history(parent: SparkplugMetric) {
	const end = new Date();
	const start = addMinutes(end, -15);
	const history = await spdata.history?.getHistory({
		metric: parent,
		start,
		end
	});
	return history?.map((row: any) => {
		return {
			timestamp: row.timestamp,
			value: `${row.intValue || row.floatValue || row.stringValue || row.boolValue}`
		};
	});
}

export function value(parent: SparkplugMetric) {
	return parent.value?.toString ? parent.value.toString() : parent.value;
}
