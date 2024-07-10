import { writable } from 'svelte/store'
import { nanoid } from 'nanoid'

export interface NotificationInput {
  type: string
  message: string
}

export interface Notification {
  id: string
  type: string
  message: string
}

const initializer: Notification[] = []

export const notifications = writable(initializer)

export function addNotification(notification: NotificationInput) {
  const id = nanoid()
  notifications.update((notifications) => [
    ...notifications,
    {
      id,
      ...notification
    }
  ])
  setTimeout(() => {
    notifications.update((notifications) =>
      notifications.filter((n) => n.id !== id)
    )
  }, 5000)
}
