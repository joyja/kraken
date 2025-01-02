import { type Roster, type RosterEntry, type User } from '@prisma/client'
import { alarmHandler } from './alarm.js'
import { prisma } from './prisma.js'
import { rosterHandler } from './roster.js'

export async function voiceCall({
  message,
  to,
  rosterId,
}: {
  message: string
  to: string
  rosterId: string
}): Promise<void> {
  const seagullUrl = process.env.MANTLE_SEAGULL_URL
  const res = await fetch(`${seagullUrl}/make-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      message,
      mantleId: process.env.MANTLE_ID ?? 'dev',
      rosterId,
    }),
  })
  if (!res.ok) {
    const errorText = await res.text()
    console.error('Error from server:', errorText)
    // Handle error, maybe show a notification to the user
  }
}

export async function sendSMS({
  message,
  to,
  rosterId,
}: {
  message: string
  to: string
  rosterId: string
}): Promise<void> {
  const seagullUrl = process.env.MANTLE_SEAGULL_URL
  const res = await fetch(`${seagullUrl}/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      message,
      mantleId: process.env.MANTLE_ID ?? 'dev',
      rosterId,
    }),
  })
  if (!res.ok) {
    const errorText = await res.text()
    console.error('Error from server:', errorText)
    // Handle error, maybe show a notification to the user
  }
}

class Notifier {
  public rosterId: string
  private entry = 0
  private roster?: Roster & {
    users: Array<Partial<RosterEntry & { user: User }>>
  }
  private terminated = false
  constructor(rosterId: string) {
    this.rosterId = rosterId
    void this.start()
  }

  async start(): Promise<void> {
    const roster = await prisma.roster.findUnique({
      where: { id: this.rosterId },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    })
    if (roster !== null && roster !== undefined) {
      this.roster = roster
    } else {
      throw Error(`Roster with id ${this.rosterId} not found`)
    }
    void this.next()
  }

  async notify(): Promise<void> {
    const entry = this.roster?.users[this.entry]
    const alarms = await alarmHandler.getUnack()
    const message = alarms.reduce((acc, alarm) => {
      return `${acc} ${alarm.name} is ${alarm.active ? 'active' : 'cleared'} and ${alarm.acknowledged ? 'acknowledged' : 'unacknowledged'}.`
    }, '')
    if (entry !== undefined && entry !== null) {
      const { user } = entry
      if (user !== undefined && user !== null) {
        if (
          entry.sms !== undefined &&
          entry.sms &&
          user.phone !== null &&
          user.phone !== undefined
        ) {
          await sendSMS({
            message,
            to: user.phone,
            rosterId: this.rosterId,
          })
        }
        if (entry.phone !== undefined && user.phone !== null) {
          await voiceCall({
            message,
            to: user.phone,
            rosterId: this.rosterId,
          })
        }
        if (
          entry.email !== null &&
          entry.email !== undefined &&
          user.email !== undefined
        ) {
          // TODO
        }
      }
    }
    setTimeout(
      () => {
        if (!this.terminated) {
          void this.next()
        }
      },
      this.roster?.timeBetweenRetries != null
        ? this.roster.timeBetweenRetries
        : 10000,
    )
  }

  async next(): Promise<void> {
    if (this.roster != null && this.entry >= this.roster?.users.length) {
      this.entry = 0
    }

    await this.notify()

    this.entry++
  }

  terminate(): void {
    this.terminated = true
  }
}

export class NotificationHandler {
  private readonly interval: NodeJS.Timeout
  private notifiers: Notifier[] = []
  constructor() {
    this.interval = setInterval(() => {
      void (async () => {
        const active = await rosterHandler.getActiveRosters()
        active.forEach((roster) => {
          const notifier = this.notifiers.find(
            (notifier) => notifier.rosterId === roster?.id,
          )
          if (notifier == null && roster?.id != null) {
            this.notifiers.push(new Notifier(roster.id))
          }
        })
        this.notifiers.forEach((notifier) => {
          const roster = active.find(
            (roster) => roster?.id === notifier.rosterId,
          )
          if (roster == null) {
            notifier.terminate()
          }
        })
        this.notifiers = this.notifiers.filter((notifier) => {
          const roster = active.find(
            (roster) => roster?.id === notifier.rosterId,
          )
          return roster !== undefined
        })
      })()
    }, 2500)
  }
}

export const notificationHandler = new NotificationHandler()
