module.exports = {
  apps: [
    {
      name: 'bizidashboard-jobs',
      script: 'bun',
      args: 'src/jobs/standalone.ts',
      cwd: '/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
      },
      // pm2 will start the collection job immediately on boot
      // and analytics aggregation 2 minutes later
      //
      // Required env vars:
      //   DATABASE_URL    PostgreSQL connection string
      //   REDIS_URL       Redis connection string
      //   ENABLE_INTERNAL_JOBS=1  Must be "1" to enable cron
      //   GBFS_URL        GBFS discovery endpoint (per city)
      //   CITY            City/schema name
    },
  ],
};
