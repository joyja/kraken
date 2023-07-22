pnpm install
pnpm build
pnpm prune --prod
pm2 startOrRestart ecosystem.config.cjs
pm2 save