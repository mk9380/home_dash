module.exports = {
  apps: [
    {
      name: 'home-dashboard-server',
      cwd: './server',
      script: 'src/index.js',
      watch: false,
      restart_delay: 3000,
      max_restarts: 10
    }
  ]
}
