export function getSystemdConfig() {
  return `[Unit]
  Description=squid-nebula
  Wants=basic.target
  After=basic.target network-online.target
  Before=sshd.service
  StartLimitIntervalSec=0

  [Service]
  SyslogIdentifier=squid-nebula
  ExecReload=/bin/kill -HUP $MAINPID
  ExecStart=/usr/local/bin/nebula -config /etc/squid/nebula/config.yml
  Restart=always
  RestartSec=10

  [Install]
  WantedBy=multi-user.target`
}
