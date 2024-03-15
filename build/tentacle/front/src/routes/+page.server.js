import { sendRequest } from "$lib/graphql/request";
import * as query from "$lib/graphql/query";
import * as mutation from "$lib/graphql/mutation";
export const actions = {
    stopPLC() {
        const context = 'stopPLC';
        let message = 'PLC Stopped!';
        let messageType = 'success';
        sendRequest({
            query: mutation.stopPLC
        })
            .then(res => res.data?.stopPLC)
            .catch(error => {
            messageType = 'error';
            message = error.message;
        });
        return {
            context,
            message,
            type: messageType
        };
    },
    startPLC() {
        const context = 'startPLC';
        let message = 'PLC Started!';
        let messageType = 'success';
        sendRequest({
            query: mutation.startPLC
        })
            .then(res => res.data?.startPLC)
            .catch(error => {
            messageType = 'error';
            message = error.message;
        });
        return {
            context,
            message,
            type: messageType
        };
    },
    restartPLC() {
        const context = 'restart';
        let message = 'PLC Restarted!';
        let messageType = 'success';
        sendRequest({
            query: mutation.restartPLC
        })
            .then(res => res.data?.restartPLC)
            .catch(error => {
            messageType = 'error';
            message = error.message;
        });
        return {
            context,
            message,
            type: messageType
        };
    },
    async getCode({ request }) {
        const data = await request.formData();
        const name = data.get('name');
        const visible = data.get('set-visibility') === 'true';
        const context = 'getCode';
        let messageType;
        let message;
        const program = await sendRequest({
            query: query.program,
            variables: {
                name
            }
        })
            .then(res => res.data?.program)
            .catch(error => {
            messageType = 'error';
            message = error.message;
        });
        if (message) {
            return {
                context,
                message,
                type: messageType,
            };
        }
        else {
            return {
                context,
                name,
                program,
                visible
            };
        }
    }
};
export async function load({ parent, url }) {
    let message = (await parent()).message;
    const changes = await sendRequest({
        query: query.changes
    })
        .then(res => res.data?.changes)
        .catch(error => {
        message = error.message;
    });
    const config = await sendRequest({
        query: query.config
    })
        .then(res => res.data?.configuration)
        .catch(error => {
        message = error.message;
    });
    const programs = await sendRequest({
        query: query.programs
    })
        .then((res) => res.data?.programs)
        .catch(error => {
        message = error.message;
    });
    const classes = await sendRequest({
        query: query.classes
    })
        .then(res => res.data?.tClasses)
        .catch(error => {
        message = error.message;
    });
    const varValues = await sendRequest({
        query: query.values
    })
        .then(res => res.data?.values)
        .catch(error => {
        message = error.message;
    });
    const metrics = await sendRequest({
        query: query.metrics
    })
        .then(res => res.data?.metrics)
        .catch(error => {
        message = error.message;
    });
    const variables = await sendRequest({
        query: query.variables
    })
        .then(res => {
        return res.data?.variables.map((variable) => {
            const atomicTypes = ['string', 'boolean', 'number'];
            const contextParams = {};
            if (atomicTypes.includes(variable.datatype)) {
                const value = varValues.find((value) => value.path === variable.name);
                if (value) {
                    if (value.datatype === 'string' && value.value.includes('function')) {
                        contextParams.datatype = 'function';
                        contextParams.argumentCount = parseInt(value.value.replace('function', ''));
                    }
                    else {
                        contextParams.datatype = value.datatype;
                        contextParams.value = value.value;
                    }
                }
                contextParams.path = value.path;
            }
            else {
                const children = variable.children.map((child) => {
                    const value = varValues.find((value) => value.path === `${variable.name}.${child.name}`).value;
                    return {
                        ...child,
                        value
                    };
                });
                const values = varValues
                    .filter((value) => value.path.split('.')[0] === variable.name)
                    .map((value) => {
                    const child = children.find((child) => child.name === value.path.split('.').slice(1).join('.'));
                    return {
                        name: value.path.split('.').slice(1).join('.'),
                        path: value.path,
                        datatype: child?.datatype ? child.datatype : value.datatype,
                        value: value.value,
                        ...child
                    };
                });
                contextParams.values = values;
            }
            return {
                ...variable,
                ...contextParams,
            };
        });
    })
        .catch(error => {
        message = error.message;
    });
    const codeserverHost = process.env.TENTACLE_CODESERVER_HOST || url.hostname;
    const codeserverProtocol = process.env.TENTACLE_CODESERVER_PROTOCOL || 'http';
    const codeserverPort = process.env.TENTACLE_CODESERVER_PORT || 8080;
    const codeserverUrl = process.env.TENTACLE_CODESERVER_URL || '/';
    const codeserverEndpoint = `${codeserverProtocol}://${codeserverHost}:${codeserverPort}${codeserverUrl}`;
    return {
        changes,
        config,
        programs,
        classes,
        metrics,
        variables,
        message,
        mqtt: [],
        opcua: [],
        modbus: [],
        codeserverEndpoint
    };
}
