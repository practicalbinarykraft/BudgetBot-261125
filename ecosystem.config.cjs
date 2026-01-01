module.exports = {
  apps: [{
    name: "budgetbot",
    script: "dist/index.js",
    cwd: "/root/BudgetBot-Improved",
    env: {
      DATABASE_URL: "postgresql://budgetbot:BudgetSecure2025!@5.129.230.171:5432/budgetbot",
      SESSION_SECRET: "7e8f8f99d29ad4c4d2464f7054f57821d912fa8e84f9110d041864c48814d704",
      ENCRYPTION_KEY: "J9QPe1LBR1dy/HYgdS1b1dQsqmsY5wybqV7yinx/wVQ=",
      TELEGRAM_BOT_TOKEN: "8523102122:AAHHzfvxuDJJWMR6XKhFpgSa2sJX2q_ZnFU",
      OPENROUTER_API_KEY: "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",
      PORT: 5000,
      NODE_ENV: "production",
      SECURE_COOKIES: "false"
    }
  }]
};
