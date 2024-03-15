"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationHandler = exports.sendSMS = exports.voiceCall = void 0;
const alarm_1 = require("./alarm");
const prisma_1 = require("./prisma");
const roster_1 = require("./roster");
async function voiceCall({ message, to, rosterId }) {
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
exports.voiceCall = voiceCall;
async function sendSMS({ message, to, rosterId }) {
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
exports.sendSMS = sendSMS;
class Notifier {
    rosterId;
    entry = 0;
    roster;
    terminated = false;
    constructor(rosterId) {
        this.rosterId = rosterId;
        this.start();
    }
    async start() {
        const roster = await prisma_1.prisma.roster.findUnique({
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
        }
        else {
            throw Error(`Roster with id ${this.rosterId} not found`);
        }
        this.next();
    }
    async notify() {
        const entry = this.roster.users[this.entry];
        const alarms = await alarm_1.alarmHandler.getUnack();
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
        }, this.roster.timeBetweenRetries);
    }
    async next() {
        if (this.entry >= this.roster.users.length) {
            this.entry = 0;
        }
        await this.notify();
        this.entry++;
    }
    terminate() {
        this.terminated = true;
    }
}
class NotificationHandler {
    interval;
    notifiers = [];
    constructor() {
        this.interval = setInterval(async () => {
            const active = await roster_1.rosterHandler.getActiveRosters();
            active.forEach((roster) => {
                const notifier = this.notifiers.find((notifier) => notifier.rosterId === roster.id);
                if (!notifier) {
                    this.notifiers.push(new Notifier(roster.id));
                }
            });
            this.notifiers.forEach((notifier) => {
                const roster = active.find((roster) => roster.id === notifier.rosterId);
                if (!roster) {
                    notifier.terminate();
                }
            });
            this.notifiers = this.notifiers.filter((notifier) => {
                const roster = active.find((roster) => roster.id === notifier.rosterId);
                return roster !== undefined;
            });
        }, 2500);
    }
}
exports.NotificationHandler = NotificationHandler;
