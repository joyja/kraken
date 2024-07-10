import fragment from './fragment';

const edgeNodes = `
  query EdgeNodes {
    edgeNodes {
      ...EdgeNodeBasic
      devices {
        ...EdgeDeviceBasic
        metrics {
          ...EdgeDeviceMetricBasic
        }
      }
    }
  }
  ${fragment.edgeNode}
  ${fragment.edgeDevice}
  ${fragment.edgeDeviceMetric}
`;

export default {
	edgeNodes
};
