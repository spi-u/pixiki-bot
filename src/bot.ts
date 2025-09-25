import { Markup, Scenes, Telegraf, Telegram } from 'telegraf';

import {
  authMiddleware,
  sessionDbMiddleware,
  logMiddleware,
} from './middlewares';
import { BotContext } from './shared/context';
import { logger } from './utils/logger';
import { initBot } from './init-bot';
import { childNameScene } from './scenes/child-name-scene';
import { parentNameScene } from './scenes';
import { emailScene } from './scenes/email-scene';
import { phoneScene } from './scenes/phone-scene';
import { childAgeScene } from './scenes/child-age-scene';
import { checkScene } from './scenes/check-scene';
import { scheduleScene } from './scenes/shedule-scene';

const RELOAD_CALLBACK_ACTION = 'reload_scene';

class Bot {
  bot: Telegraf<BotContext>;
  telegram: Telegram;
  stage: Scenes.Stage<any>;

  constructor(token: string) {
    this.bot = new Telegraf<BotContext>(token);
    this.telegram = this.bot.telegram;

    this.stage = new Scenes.Stage<any>([
      childNameScene,
      parentNameScene,
      emailScene,
      phoneScene,
      childAgeScene,
      checkScene,
      scheduleScene,
    ]);
  }

  init() {
    this.bot.use(sessionDbMiddleware());
    this.bot.use(authMiddleware());
    this.bot.use(async (ctx: BotContext, next: () => void) => {
      ctx.deleteMessageOrClearReplyMarkup = async () => {
        try {
          await ctx.deleteMessage();
        } catch (e) {
          console.log(e);
          await ctx.editMessageReplyMarkup(undefined);
        }
      };
      return next();
    });
    this.stage.use(logMiddleware());

    this.bot.use(async (ctx, next) => {
      if (ctx.message && 'text' in ctx.message) {
        if (['/start'].includes(ctx.message.text) && ctx.session.__scenes?.current) {
          ctx.session.__scenes.current = undefined;
        }
      }
      return next();
    })

    this.bot.use(this.stage.middleware());
    
    initBot(this.bot);

    this.bot.on('pre_checkout_query', async (ctx) => {
      return ctx.answerPreCheckoutQuery(true);
    });

    this.bot.catch(async (err, ctx) => {
      logger.error(err);

      try {
        if (ctx.session.__scenes && ctx.session.__scenes.current) {
          await ctx.sendMessage(
            'Возникла непредвиденная ошибка',
            Markup.inlineKeyboard([
              Markup.button.callback('Перезагрузить', RELOAD_CALLBACK_ACTION),
            ]),
          );
        } else {
          await ctx.sendMessage('Возникла непредвиденная ошибка');
        }
      } catch (e) {
        logger.error(`Bot error: ${e}`);
      }
    });

    this.bot.action(RELOAD_CALLBACK_ACTION, async (ctx) => {
      if (ctx.session.__scenes && ctx.session.__scenes.current) {
        await ctx.deleteMessageOrClearReplyMarkup();
        return ctx.scene.enter(ctx.session.__scenes.current, ctx.scene?.session?.state);
      }
    });

    this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Начать' },
      { command: 'registrations', description: 'Мои записи' },
    ]);

    this.bot
      .launch({
        ...(process.env.WEBHOOK_DOMAIN && {
          webhook: {
            domain: process.env.WEBHOOK_DOMAIN,
          },
        }),
      })
      .catch((e) => {
        logger.error('Starting bot error:', e);
      });
  }
}

export default Bot;
