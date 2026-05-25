module.exports = {
  apps: [
    {
      name: "e-posyandu",
      script: "start.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      watch: false,
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
    },
  ],
}
