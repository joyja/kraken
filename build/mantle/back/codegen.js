"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    schema: './src/schema.graphql',
    generates: {
        './src/resolvers/types.ts': {
            plugins: ['typescript', 'typescript-resolvers'],
        },
    },
};
exports.default = config;
