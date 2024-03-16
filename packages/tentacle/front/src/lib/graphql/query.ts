export const changes = `
  query Changes {
    changes {
      timestamp
      path
      event
    }
  }
`

export const plc = `
  query Plc {
    tPlc {
      running
    }
  }
`

export const values = `
  query Values {
    values {
      path
      value
      datatype
    }
  }
`

export const variables = `
  query Variables {
    variables {
      name
      description
      datatype
      initialValue
      persistent
      decimals
      changeEvents {
        inLastMinute
        inLastHour
        inLastDay
      }
      children{
        name
        description
        datatype
        initialValue
        persistent
        decimals
      }
      source {
        name
        type
        rate
        params {
          register
        }
      }
    }
  }
`

export const config  = `
  query Configuration {
    configuration {
      tasks {
        name
        description
        scanRate
        program
      }
      mqtt {
        name
        description
        config {
          serverUrl
        }
      }
      modbus {
        name
        description
        config {
          host
          port
        }
      }
      opcua {
        name
        description
        config {
          host
          port
        }
      }
    }
  }
`

export const metrics = `
  query Metrics {
    metrics {
      task
      functionExecutionTime,
      intervalExecutionTime,
      totalScanTime
    }
  }
`

export const programs = `
  query Programs {
    programs
  }
`

export const classes = `
  query Classes {
    tClasses
  }
`

export const program = `
  query Program ($name:String!) {
    program(name: $name)
  }
`

export const aClass = `
  query Class ($name:String!) {
    class(name: $name)
  }
`