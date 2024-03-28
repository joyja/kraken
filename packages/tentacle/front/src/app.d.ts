// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			variables: { value:string }[]
			metrics: { task:string, functionExecutionTime:number, intervalExecutionTime:number, totalScanTime:number }[]
			changes: { timestamp:string, event:string, path:string } []
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
