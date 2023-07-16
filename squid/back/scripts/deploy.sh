pnpm install
pnpm build
pnpm prune --prod
pm2 start ecosystem.config.cjs