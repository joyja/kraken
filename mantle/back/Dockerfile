FROM keymetrics/pm2:18-buster AS base

RUN npm i -g pnpm

FROM base AS dependencies

# Bundle APP files
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

FROM base AS build

WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules

# Install app dependencies
RUN pnpm build
RUN pnpm prune --prod

FROM base AS deploy

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY ecosystem.config.cjs ./
COPY --from=build /app/build ./build/
COPY --from=build /app/node_modules ./node_modules

# Expose the listening port of your app
EXPOSE 4000

# Show current folder structure in logs
CMD pm2-runtime start ecosystem.config.cjs

