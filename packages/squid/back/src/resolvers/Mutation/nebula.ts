import { nebula } from '../../nebula'
import { NebulaInstallInput } from '../../nebula/types'

const installNebula = (root:unknown, { isLighthouse, lighthouseNebulaIp, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, lighthousePublicEndpoint, name, version, allowReinstall }:NebulaInstallInput) => {
  return nebula.install({ isLighthouse, lighthouseNebulaIp, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, lighthousePublicEndpoint, name, version, allowReinstall })
}