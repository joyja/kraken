pnpm install
pnpm build
pnpm prune --prod
pm2 startOrRestart --update-env ecosystem.config.cjs
pm2 save