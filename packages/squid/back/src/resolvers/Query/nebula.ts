import { nebula } from "../../nebula/index.js" 

export const nebulaStatus = () => {
  return {
    state: nebula.getState(),
  }
}