import * as fs from 'fs'
import * as path from 'path'

interface ConstructorOptions {
  filepath?: string
  variables: Record<string, any>
  global: Record<string, any>
  classes: Array<{
    name: string
    variables: Record<string, { persistent: boolean }>
  }>
}

export class Persistence {
  global: Record<string, any>
  variables: Record<string, any>
  classes: ConstructorOptions['classes']
  filepath: string
  data: Record<string, any>

  constructor({
    filepath = path.resolve(process.cwd(), 'runtime/persistence.json'),
    variables,
    global,
    classes,
  }: ConstructorOptions) {
    this.global = global
    this.variables = variables
    this.classes = classes
    this.filepath = filepath

    if (fs.existsSync(filepath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      } catch (error) {
        console.log(error)
        this.data = {}
        void this.writeFile()
      }
    } else {
      this.data = {}
      void this.writeFile()
    }
  }

  load(): void {
    Object.keys(this.global).forEach((key) => {
      if (
        this.global[key]?.constructor != null &&
        this.classes
          .map((fb) => fb.name)
          .includes(this.global[key].constructor.name)
      ) {
        Object.keys(this.global[key].constructor.variables)
          .filter((variableName) => {
            return this.global[key].constructor.variables[variableName]
              .persistent
          })
          .forEach((variableName) => {
            if (key in this.data && variableName in this.data[key]) {
              this.global[key][variableName] = this.data[key][variableName]
            }
          })
      } else {
        if (
          this.variables[key]?.persistent !== null &&
          this.variables[key]?.persistent !== undefined &&
          key in this.data
        ) {
          this.global[key] = this.data[key]
        }
      }
    })
  }

  persist(): void {
    const newData: Record<string, any> = {}
    Object.keys(this.global).forEach((key) => {
      if (
        Boolean(this.global[key]) &&
        this.classes
          .map((fb) => fb.name)
          .includes(this.global[key].constructor.name)
      ) {
        const fbData: Record<string, any> = {}
        Object.keys(this.global[key].constructor.variables)
          .filter((variableName) => {
            return this.global[key].constructor.variables[variableName]
              .persistent
          })
          .forEach((variableName) => {
            fbData[variableName] = this.global[key][variableName]
          })
        newData[key] = fbData
      } else {
        if (
          this.variables[key]?.persistent !== null &&
          this.variables[key]?.persistent !== undefined
        ) {
          newData[key] = this.global[key]
        }
      }
    })
    this.data = newData
    try {
      void this.writeFile()
    } catch (error) {
      console.log(error)
    }
  }

  async writeFile(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      fs.writeFile(
        this.filepath,
        JSON.stringify(this.data, null, 2),
        (error) => {
          if (error !== null && error !== undefined) {
            reject(error)
          } else {
            resolve()
          }
        },
      )
    })
  }
}
