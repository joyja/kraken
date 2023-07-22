import { nebula } from "../../nebula" 

export const nebulaStatus = () => {
  return {
    state: nebula.getState(),
  }
}