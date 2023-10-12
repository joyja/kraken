import { Modbus } from './modbus'

export class PLC {
  public modbus:{[key:string]:Modbus}
  constructor() {
    this.modbus = {}
  }
}