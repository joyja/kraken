import { Controller } from 'st-ethernet-ip'
// import { Log } from './log'

// const log = new Log('Ethernet/IP')

interface EthernetIPConstructorOptions {
  host: string
  port?: number
  interval?: number // Scan rate for tags (in ms)
}

// export class EthernetIP {
//   private readonly host: string;
//   private readonly port: number;
//   private readonly plc: typeof Controller;
//   private readonly interval: number;
//   private connected: boolean = false;

//   constructor({ host, port = 44818, interval = 1000 }: EthernetIPConstructorOptions) {
//     this.host = host;
//     this.port = port;
//     this.interval = interval;

//     this.plc = new Controller();
//   }

//   async connect(): Promise<void> {
//     try {
//       await this.plc.connect(this.host, this.port);
//       this.connected = true;

//       log.info(`Connected to Ethernet/IP device at ${this.host}:${this.port}`);
//     } catch (error:any) {
//       log.error(`Failed to connect to Ethernet/IP device: ${error.message}`);
//       this.connected = false;
//     }
//   }

//   async disconnect(): Promise<void> {
//     try {
//       await this.plc.disconnect();
//       this.connected = false;
//       log.info(`Disconnected from Ethernet/IP device at ${this.host}:${this.port}`);
//     } catch (error:any) {
//       log.error(`Failed to disconnect from Ethernet/IP device: ${error.message}`);
//     }
//   }

//   async readTag(tagName: string): Promise<any> {
//     if (!this.connected) {
//       log.error("Not connected to the Ethernet/IP device.");
//       return;
//     }

//     try {
//       const tag = await this.plc.readTag(tagName);
//       return tag.value;
//     } catch (error:any) {
//       log.error(`Failed to read tag ${tagName}: ${error.message}`);
//     }
//   }

//   async writeTag(tagName: string, value: any, type?: string): Promise<void> {
//     if (!this.connected) {
//       log.error("Not connected to the Ethernet/IP device.");
//       return;
//     }

//     try {
//       await this.plc.writeTag(tagName, value, type);
//       log.info(`Written value ${value} to tag ${tagName}`);
//     } catch (error:any) {
//       log.error(`Failed to write to tag ${tagName}: ${error.message}`);
//     }
//   }

//   addTags(...tags: string[]): void {
//     this.plc.subscribe(...tags);
//     this.plc.scan(this.interval);
//   }

//   async getTagValue(tagName: string): Promise<any> {
//     const tag = this.plc.using(tagName);
//     if (tag !== null && tag !== undefined) {
//       log.error(`Tag ${tagName} not found.`);
//       return;
//     }
//     return tag.value;
//   }
// }
