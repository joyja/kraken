import { Roster, RosterEntry, User } from '@prisma/client';
import { alarmHandler } from './alarm';
import { prisma } from './prisma';
import { rosterHandler } from './roster';

export async function voiceCall({
	message,
	to,
	rosterId
}: {
	message: string;
	to: string;
	rosterId: string;
}) {
	const seagullUrl = process.env.MANTLE_SEAGULL_URL;
	const res = await fetch(`${seagullUrl}/make-call`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			to,
			message,
			mantleId: process.env.MANTLE_ID || 'dev',
			rosterId
		})
	});
	if (!res.ok) {
		const errorText = await res.text();
		console.error('Error from server:', errorText);
		// Handle error, maybe show a notification to the user
	}
}

export async function sendSMS({
	message,
	to,
	rosterId
}: {
	message: string;
	to: string;
	rosterId: string;
}) {
	const seagullUrl = process.env.MANTLE_SEAGULL_URL;
	const res = await fetch(`${seagullUrl}/send-sms`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			to,
			message,
			mantleId: process.env.MANTLE_ID || 'dev',
			rosterId
		})
	});
	if (!res.ok) {
		const errorText = await res.text();
		console.error('Error from server:', errorText);
		// Handle error, maybe show a notification to the user
	}
}

class Notifier {
	public rosterId: string;
	private entry = 0;
	private roster?: Roster & { users: Partial<RosterEntry & { user: User }>[] };
	private terminated = false;
	constructor(rosterId: string) {
		this.rosterId = rosterId;
		this.start();
	}
	async start() {
		const roster = await prisma.roster.findUnique({
			where: { id: this.rosterId },
			include: {
				users: {
					include: {
						user: true
					}
				}
			}
		});
		if (roster) {
			this.roster = roster;
		} else {
			throw Error(`Roster with id ${this.rosterId} not found`);
		}
		this.next();
	}
	async notify() {
		const entry = this.roster!.users[this.entry];
		const alarms = await alarmHandler.getUnack();
		const message = alarms.reduce((acc, alarm) => {
			return `${acc} ${alarm.name} is ${alarm.active ? 'active' : 'cleared'} and ${alarm.acknowledged ? 'acknowledged' : 'unacknowledged'}.`;
		}, '');
		if (entry) {
			const { user } = entry;
			if (user) {
				if (entry.sms && user.phone) {
					await sendSMS({
						message: message,
						to: user.phone,
						rosterId: this.rosterId
					});
				}
				if (entry.phone && user.phone) {
					await voiceCall({
						message,
						to: user.phone,
						rosterId: this.rosterId
					});
				}
				if (entry.email && user.email) {
					// TODO
				}
			}
		}
		setTimeout(async () => {
			if (!this.terminated) {
				await this.next();
			}
		}, this.roster!.timeBetweenRetries);
	}
	async next() {
		if (this.entry >= this.roster!.users.length) {
			this.entry = 0;
		}

		await this.notify();

		this.entry++;
	}
	terminate() {
		this.terminated = true;
	}
}

export class NotificationHandler {
	private interval: NodeJS.Timeout;
	private notifiers: Notifier[] = [];
	constructor() {
		this.interval = setInterval(async () => {
			const active = await rosterHandler.getActiveRosters();
			active.forEach((roster) => {
				const notifier = this.notifiers.find((notifier) => notifier.rosterId === roster!.id);
				if (!notifier) {
					this.notifiers.push(new Notifier(roster!.id));
				}
			});
			this.notifiers.forEach((notifier) => {
				const roster = active.find((roster) => roster!.id === notifier.rosterId);
				if (!roster) {
					notifier.terminate();
				}
			});
			this.notifiers = this.notifiers.filter((notifier) => {
				const roster = active.find((roster) => roster!.id === notifier.rosterId);
				return roster !== undefined;
			});
		}, 2500);
	}
}
