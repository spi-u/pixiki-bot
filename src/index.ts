import express from 'express';

import Bot from './bot';
import { logger } from './utils/logger';
import './services/alphacrm';


export let bot: Bot;
const PORT = Number(process.env.PORT) || 3000;

const start = async () => {  
  const token = process.env.BOT_TOKEN;
  if (!token) return logger.error('BOT_TOKEN is required');

  bot = new Bot(token);

  if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_DOMAIN) {
    const app = express();
    app.use(
      await bot.bot.createWebhook({ domain: process.env.WEBHOOK_DOMAIN }),
    );
    app.listen(PORT, () => console.log('Webhook listening on port', PORT));
  }
  bot.init();
};

start();
