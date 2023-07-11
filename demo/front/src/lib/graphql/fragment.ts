const edgeNode = `
  fragment EdgeNodeBasic on EdgeNode {
    group
    name
    description
    createdOn
  }
`

const edgeDevice = `
  fragment EdgeDeviceBasic on EdgeDevice {
    name
    description
    createdOn
  }
`

const edgeDeviceMetric = `
  fragment EdgeDeviceMetricBasic on EdgeDeviceMetric {
    name
    description
    datatype
    value
    timestamp
    createdOn
    history {
      timestamp
      value
    }
  }
`

export default {
  edgeNode,
  edgeDevice,
  edgeDeviceMetric,
}