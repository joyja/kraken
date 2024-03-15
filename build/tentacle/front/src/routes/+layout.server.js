import { sendRequest } from "$lib/graphql/request";
import * as query from "$lib/graphql/query";
export async function load() {
    let message;
    const running = await sendRequest({
        query: query.plc
    })
        .then(res => res.data?.tPlc.running)
        .catch(error => {
        message = error.message;
    });
    return {
        running,
        message
    };
}
