import { EthernetIP } from 'st-ethernet-ip'
import { UnconnectedSend } from 'st-ethernet-ip/dist/enip/cip'
import { describe, it, expect } from 'vitest'

describe('Ethernet/IP', () => {
  it('Controller', async () => {
    const eip = new EthernetIP.ENIP()
    eip.connect('192.168.20.24')
    expect(eip.state).toBe(true)
  })
})
