FROM node:20.11.0-bookworm AS base

RUN npm i -g pnpm

FROM base AS structure
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
RUN mkdir packages
RUN mkdir packages/salt
RUN mkdir packages/coral
RUN mkdir packages/mantle
RUN mkdir packages/mantle/front

FROM base AS dependencies

# Bundle APP files
WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./

# Build the coral dependency
COPY ./packages/coral ./packages/coral/
WORKDIR /app/packages/coral
RUN pnpm install
RUN pnpm build

# Build the salt dependency
COPY ./packages/salt ./packages/salt/
WORKDIR /app/packages/salt
RUN pnpm install
RUN pnpm build

WORKDIR /app
#build the other dependencies
COPY ./packages/mantle/front/package.json ./packages/mantle/front/
RUN pnpm install

FROM structure AS build

WORKDIR /app
COPY ./packages/mantle/front ./packages/mantle/front
COPY --from=dependencies /app/node_modules/ ./node_modules
COPY --from=dependencies /app/packages/coral ./packages/coral/
COPY --from=dependencies /app/packages/mantle/front/node_modules/ ./packages/mantle/front/node_modules

# Install app dependencies
WORKDIR /app/packages/mantle/front
RUN npx prisma generate
RUN pnpm build
RUN pnpm prune --prod

FROM structure AS deploy

WORKDIR /app
COPY ./packages/mantle/front/package.json ./
COPY --from=build /app/node_modules/ ./node_modules
COPY --from=build /app/packages/salt ./packages/salt/
COPY --from=build /app/packages/coral ./packages/coral/
COPY --from=build /app/packages/mantle/front/build ./packages/mantle/front/build/
COPY --from=build /app/packages/mantle/front/.svelte-kit ./packages/mantle/front/.svelte-kit/
COPY --from=build /app/packages/mantle/front/node_modules ./packages/mantle/front/node_modules/

WORKDIR /app/packages/mantle/front

# Expose the listening port of your app
EXPOSE 3001

# Show current folder structure in logs
CMD node ./build/src/index.js

