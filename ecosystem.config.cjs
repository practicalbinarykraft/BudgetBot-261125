module.exports = {
  apps: [{
    name: "budgetbot",
    script: "dist/index.js",
    cwd: "/root/BudgetBot",
    env: {
      DATABASE_URL: "postgresql://neondb_owner:npg_Ih7NnWf2rAvE@ep-fancy-sea-ahwdfdjc-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",
      SESSION_SECRET: "7e8f8f99d29ad4c4d2464f7054f57821d912fa8e84f9110d041864c48814d704",
      ENCRYPTION_KEY: "J9QPe1LBR1dy/HYgdS1b1dQsqmsY5wybqV7yinx/wVQ=",
      PORT: 5000,
      NODE_ENV: "production",
      SECURE_COOKIES: "false"
    }
  }]
};
