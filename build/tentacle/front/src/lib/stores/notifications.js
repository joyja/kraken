import { writable } from 'svelte/store';
import { nanoid } from 'nanoid';
const initializer = [];
export const notifications = writable(initializer);
export function addNotification(notification) {
    const id = nanoid();
    notifications.update((notifications) => [
        ...notifications,
        {
            id,
            ...notification
        }
    ]);
    setTimeout(() => {
        notifications.update((notifications) => notifications.filter((n) => n.id !== id));
    }, 5000);
}
