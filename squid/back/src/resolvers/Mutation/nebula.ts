import { nebula } from '../../nebula'
import { NebulaInstallInput } from '../../nebula/types'

const installNebula = (root:unknown, { isLighthouse, lighthouse, version }:NebulaInstallInput) => {
  return nebula.install({ isLighthouse, lighthouse, version })
}