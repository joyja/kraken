module.exports = {
  apps: [
    {
      name: 'mantle-demo',
      script: './build/index.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}