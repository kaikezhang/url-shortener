/**
 * PM2 Ecosystem Configuration
 * Production-ready process management configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env staging
 */

module.exports = {
  apps: [
    {
      name: 'url-shortener',
      script: './dist/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing

      // Environment-specific configurations
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Memory management
      max_memory_restart: '500M', // Restart if memory exceeds 500MB

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced features
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Monitoring
      instance_var: 'INSTANCE_ID',

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/url-shortener.git',
      path: '/var/www/url-shortener',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/url-shortener.git',
      path: '/var/www/url-shortener-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
