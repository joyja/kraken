export const groups = `
query groups {
  groups {
    nodes {
      metrics {
        id
        history {
          timestamp
          value
        }
        type
        updatedOn
        updatesLastMinute
        updatesLastHour
        updatesLastDay
        value
      }
      unbornDevices {
        id
        updatedOn
        metrics {
          id
          value
          updatedOn
          updatesLastMinute
          updatesLastHour
          updatesLastDay
          type
          history {
            timestamp
            value
          }
        }
      }
      devices {
        id
        updatedOn
        metrics {
          id
          value
          updatedOn
          updatesLastMinute
          updatesLastHour
          updatesLastDay
          type
          history {
            timestamp
            value
          }
        }
      }
      id
      updatedOn
    }
    id
    updatedOn
    unbornNodes {
      id
      updatedOn
      unbornDevices {
        id
        metrics {
          id
          type
          updatesLastMinute
          updatesLastHour
          updatesLastDay
          updatedOn
          value
          history {
            timestamp
            value
          }
        }
        updatedOn
      }
      devices {
        id
        updatedOn
        metrics {
          id
          history {
            timestamp
            value
          }
          type
          updatedOn
          updatesLastMinute
          updatesLastHour
          updatesLastDay
          value
        }
      }
    }
  }
}
`

export const history = `
  query History (
    $metrics: [MetricHistoryEntry!]!
    $start: Date!
    $end: Date!
  ) {
    history(input: {
      metrics: $metrics, 
      start: $start, 
      end: $end
    }) {
      groupId
      nodeId
      deviceId
      metricId
      history {
        timestamp
        value
      }
    }
  }
`

export const alarmHistory = `
query {
  alarmHistory(input:{}) {
    alarm {
      id
      name
      priority
    }
    active
    acknowledged
    timestamp
  }
}
`
