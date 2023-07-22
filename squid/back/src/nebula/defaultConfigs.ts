import type { NebulaConfig, NebulaConfigInput } from './types.d.ts'

export function getDefaultConfig({ isLighthouse, lighthouse }:NebulaConfigInput):NebulaConfig {
  if (isLighthouse || !lighthouse || !lighthouse?.nebulaIp || !lighthouse?.publicEndpoint) {
    throw Error(`Lighthouse config is required when isLighthouse is true. Got: ${JSON.stringify({ isLighthouse, lighthouse }), null, 2}.`)
  }
  return {
    "pki": {
      "ca": "/etc/squid/nebula/ca.crt",
      "cert": "/etc/squid/nebula/host.crt",
      "key": "/etc/squid/nebula/host.key"
    },
    "static_host_map": isLighthouse ? {
      [lighthouse!.nebulaIp]: [lighthouse!.publicEndpoint]
    } : {},
    "lighthouse": {
      "am_lighthouse": isLighthouse,
      "interval": 60,
      "hosts": isLighthouse ? [
        lighthouse?.nebulaIp
      ] : []
    },
    "listen": {
      "host": "0.0.0.0",
      "port": 4242
    },
    "punchy": {
      "punch": true
    },
    "relay": {
      "am_relay": false,
      "use_relays": true
    },
    "tun": {
      "disabled": false,
      "dev": "squid-nebula",
      "drop_local_broadcast": false,
      "drop_multicast": false,
      "tx_queue": 500,
      "mtu": 1300,
      "routes": null,
      "unsafe_routes": null
    },
    "logging": {
      "level": "info",
      "format": "text"
    },
    "firewall": {
      "outbound_action": "drop",
      "inbound_action": "drop",
      "conntrack": {
        "tcp_timeout": "12m",
        "udp_timeout": "3m",
        "default_timeout": "10m"
      },
      "outbound": [
        {
          "port": "any",
          "proto": "any",
          "host": "any"
        }
      ],
      "inbound": [
        {
          "port": "any",
          "proto": "icmp",
          "host": "any"
        }
      ]
    }
  }
}