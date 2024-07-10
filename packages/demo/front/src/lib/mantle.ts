export async function getNodes(): Promise<EdgeNode[]> {
	return await fetch('https://mantle2.jarautomation.io/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
			// Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			query: `
        query EdgeNodes {
          edgeNodes {
            group
            name
            description
            createdOn
            devices {
              name
              description
              createdOn
              metrics {
                name
                description
                datatype
                value
                timestamp
                createdOn
                history {
                  value
                  timestamp
                }
              }
            }
          }
        }
      `
		})
	})
		.then((res) => res.json())
		.then((res) => res.data.edgeNodes);
}
