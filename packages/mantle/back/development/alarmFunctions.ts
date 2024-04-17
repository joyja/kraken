import { type SparkplugGroup } from '../src/mqtt.js'

export function testEval({ groups }: { groups: SparkplugGroup[] }): boolean {
  const group = groups.find((group) => group.id === 'Development')
  const metric = group
    ?.getNode('edge1')
    ?.getDevice('tentacleplc')
    ?.getMetric('temperature')
  return metric?.value > 100
}
