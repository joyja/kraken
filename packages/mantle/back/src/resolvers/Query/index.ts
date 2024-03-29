import { prisma } from '../../prisma';
import { spdata } from '../../mqtt';
import { alarmHandler } from '../../alarm';
import { Alarm, HistoryEntry } from '../types';
import { rosterHandler } from '../../roster';
import { userHandler } from '../../user';
import { History } from '../../history';

export function info() {
	return 'Sparkplug B Historian and Alarm Notifier';
}

export function groups(_root: unknown, args: { historyDuration: number }) {
	return spdata.groups;
}

export function alarms(): Promise<Alarm[]> {
	return alarmHandler.getAll();
}

export function users() {
	return userHandler.getAll();
}

export function rosters() {
	return rosterHandler.getAll();
}

export async function history(_root: unknown, args: { input: HistoryEntry }) {
	const history = new History(prisma);
	const { metrics, start, end, interval, samples, raw } = args.input;
	return history.getHistoryBucketed({
		metrics,
		start,
		end,
		interval,
		samples,
		raw
	});
}
