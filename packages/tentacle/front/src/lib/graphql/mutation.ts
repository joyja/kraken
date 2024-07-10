export const setValue = `
  mutation SetValue (
    $variablePath: String!
    $value: String!
  ) {
    setValue(
      variablePath: $variablePath
      value: $value
    ) {
      path
      value
      datatype
    }
  }
`

export const runFunction = `
  mutation RunFunction (
    $functionPath: String!
    $args: String
  ) {
    runFunction(
      functionPath: $functionPath
      args: $args
    )
  }
`

export const startPLC = `
  mutation StartPlc {
    startPlc {
      running
    }
  }
`

export const stopPLC = `
  mutation StopPlc {
    stopPlc {
      running
    }
  }
`

export const restartPLC = `
  mutation RestartPlc {
    restartPlc {
      running
    }
  }
`
