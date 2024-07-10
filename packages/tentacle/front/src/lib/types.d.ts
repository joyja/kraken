interface Program {
	visible: boolean
	name: string
	code: string
}

interface TClass {
	visible: boolean
	name: string
}

interface Task {
	name: string
}

interface Metric {
	name: string
	task: string
}
