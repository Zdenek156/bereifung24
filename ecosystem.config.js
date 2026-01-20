module.exports = {
  apps: [{
    name: 'bereifung24',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/bereifung24-error.log',
    out_file: '/var/log/bereifung24-out.log',
    log_file: '/var/log/bereifung24.log',
    time: true,
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      GOCARDLESS_ACCESS_TOKEN: 'live_uVjdjN_9krkMp_XQ3Qkh8P5b14AwS4nC44LYYPS9',
      GOCARDLESS_ENVIRONMENT: 'live',
      GOCARDLESS_WEBHOOK_SECRET: 'z6bfSre5Hb4QIrTLmTxlEOfHzZTLEnIFs6X1FG2N'
    }
  }]
}
