FROM node:20.11.0-bookworm AS base

RUN npm i -g pnpm

FROM base AS structure
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
RUN mkdir packages
RUN mkdir packages/coral
RUN mkdir packages/mantle
RUN mkdir packages/mantle/back

FROM base AS dependencies

# Bundle APP files
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./

# Build the coral dependency
COPY ./packages/coral ./packages/coral/

WORKDIR /app/packages/coral
RUN pnpm install
RUN pnpm build

WORKDIR /app
#build the other dependencies
COPY ./packages/mantle/back/package.json ./packages/mantle/back/
RUN pnpm install

FROM structure AS build

WORKDIR /app
COPY ./packages/mantle/back ./packages/mantle/back
COPY --from=dependencies /app/node_modules/ ./node_modules
COPY --from=dependencies /app/packages/coral ./packages/coral/
COPY --from=dependencies /app/packages/mantle/back/node_modules/ ./packages/mantle/back/node_modules

# Install app dependencies
WORKDIR /app/packages/mantle/back
RUN npx prisma generate
RUN pnpm build
RUN pnpm prune --prod

FROM structure AS deploy

WORKDIR /app
COPY ./packages/mantle/back/package.json ./
COPY --from=build /app/node_modules/ ./node_modules
COPY --from=build /app/packages/coral ./packages/coral/
COPY --from=build /app/packages/mantle/back/prisma ./packages/mantle/back/prisma/
COPY --from=build /app/packages/mantle/back/build ./packages/mantle/back/build/
COPY --from=build /app/packages/mantle/back/src/schema.graphql ./packages/mantle/back/src/
COPY --from=build /app/packages/mantle/back/node_modules ./packages/mantle/back/node_modules/

WORKDIR /app/packages/mantle/back

# Expose the listening port of your app
EXPOSE 4000

# Show current folder structure in logs
CMD node ./build/src/index.js

