module.exports = {
  apps: [
    {
      name: 'mantle',
      script: './build/src/index.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
