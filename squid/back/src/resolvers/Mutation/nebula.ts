import { nebula } from '../../nebula'
import { NebulaInstallInput } from '../../nebula/types'

const installNebula = (root:unknown, { isLighthouse, lighthouseNebulaIp, lighthousePublicEndpoint, version }:NebulaInstallInput) => {
  return nebula.install({ isLighthouse, lighthouseNebulaIp, lighthousePublicEndpoint, version })
}