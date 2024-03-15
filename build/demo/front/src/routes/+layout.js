/** @type {import('./$types').LayoutLoad} */
export const load = async ({ data, url: { pathname } }) => {
    return { pathname };
};
