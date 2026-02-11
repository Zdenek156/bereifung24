const fs = require('fs')

const config = `module.exports = {
  apps: [{
    name: 'bereifung24',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/bereifung24',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/bereifung24-error.log',
    out_file: '/var/log/bereifung24-out.log',
    log_file: '/var/log/bereifung24-combined.log',
    time: true,
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      GOCARDLESS_ACCESS_TOKEN: 'live_uVjdjN_9krkMp_XQ3Qkh8P5b14AwS4nC44LYYPS9',
      GOCARDLESS_ENVIRONMENT: 'live',
      GOCARDLESS_WEBHOOK_SECRET: 'z6bfSre5Hb4QIrTLmTxlEOfHzZTLEnIFs6X1FG2N',
      ENCRYPTION_KEY: '62702847386113122ad65f9b4355f34033b6f12aef214f85c9ab8a5e92292c56'
    }
  }]
}`

fs.writeFileSync('ecosystem.config.js', config)
console.log('✅ ecosystem.config.js updated with ENCRYPTION_KEY')
