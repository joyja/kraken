export interface GithubRelease {
  tag_name:string
}

export interface GithubAsset {
  name:string
}

export interface NebulaFirewallRule {
  port:'any' | number
  proto:'any' | 'tcp' | 'udp' | 'icmp'
  host?:string
  group?:string
  groups?:string[]
  cidr?:string
  local_cidr?:string
  ca_name?:string
  ca_sha?:string
}

export interface NebulaConfig {
  pki: {
    ca:string
    cert:string
    key:string
  }
  static_host_map: {
    [nebulaIp:string]:string[]
  }
  lighthouse: {
    am_lighthouse:boolean
    interval:number
    hosts: string[]
  }
  listen: {
    host:string,
    port:number
  }
  punchy: {
    punch:boolean
  }
  relay: {
    am_relay:boolean
    use_relays:boolean
  }
  tun: {
    disabled:boolean
    dev:string
    drop_local_broadcast:boolean
    drop_multicast:boolean
    tx_queue:number
    mtu:number
    routes?:{
      mtu:number,
      route:string
    }[] | null
    unsafe_routes?:{
      route:string
      via:string
      mtu:number
      metric:number
      install:boolean
    }[] | null
  }
  logging: {
    level:string,
    format:string
  }
  firewall: {
    outbound_action:'drop'|'reject'
    inbound_action:'drop'|'reject'
    conntrack: {
      tcp_timeout:string
      udp_timeout:string
      default_timeout:string
    }
    outbound:NebulaFirewallRule[]
    inbound:NebulaFirewallRule[]
  }
}

export interface NebulaConfigInput {
  isLighthouse:boolean
  allowReinstall?:boolean
  lighthouse?: {
    nebulaIp:string
    publicEndpoint:string
  }
}

export interface NebulaInstallInput {
  isLighthouse:boolean
  allowReinstall:boolean
  lighthouseGroupId?:string
  lighthouseNodeId?:string
  lighthouseDeviceId?:string
  lighthouseNebulaIp:string
  lighthousePublicEndpoint:string
  name:string
  nebulaIp?:string
  groups?:string[]
  version:string
}

export interface NebulaCaCertInput {
  name:string
  allowOverwrite:boolean
}

export interface NebulaHostCertInput {
  isOwn:boolean // if true, will generate a host cert for the machine squid is running on
  name:string
  nebulaIp:string
  groups?:string[]
  allowOverwrite:boolean
}

export interface NebulaSendCertInput {
  groupId:string
  nodeId:string
  deviceId:string
  name:string
  nebulaIp:string
  groups?:string[]
}

export interface NebulaReceiveCertInput {
  ca:string,
  cert:string,
  key:string
}