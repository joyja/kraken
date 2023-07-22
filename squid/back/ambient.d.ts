interface SystemMetric {
  name: string,
  getter: Function,
  type: 'Float' | 'String'
}