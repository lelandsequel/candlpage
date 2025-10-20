module.exports = {
  apps: [
    {
      name: "python-api",
      script: "python3",
      args: "-m uvicorn python_api:app --host 0.0.0.0 --port 5057",
      cwd: "/Users/sokpyeon/candlpage",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      error_file: "logs/python_api_error.log",
      out_file: "logs/python_api_out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M"
    },
    {
      name: "express-backend",
      script: "server.js",
      cwd: "/Users/sokpyeon/candlpage",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      error_file: "logs/express_error.log",
      out_file: "logs/express_out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "300M"
    },
    {
      name: "react-frontend",
      script: "npm",
      args: "run dev",
      cwd: "/Users/sokpyeon/candlpage",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      error_file: "logs/react_error.log",
      out_file: "logs/react_out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M"
    }
  ],
  
  deploy: {
    production: {
      user: "sokpyeon",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-repo/candlpage.git",
      path: "/var/www/candlpage",
      "post-deploy": "npm install && pip install -r requirements.txt && pm2 reload ecosystem.config.js --env production"
    }
  }
};
