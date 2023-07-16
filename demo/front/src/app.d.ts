// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			nodes: { devices:{ metrics: { name:string, value: number | string }[] }[] }[]
		}
		// interface Platform {}
	}
}

export {};
