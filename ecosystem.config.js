module.exports = {
  apps: [{
    name: 'bereifung24',
    script: './start-with-env.sh',
    cwd: '/var/www/bereifung24',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
