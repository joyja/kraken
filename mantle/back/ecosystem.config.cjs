module.exports = {
  apps: [
    {
      name: 'mantle',
      script: './build/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
