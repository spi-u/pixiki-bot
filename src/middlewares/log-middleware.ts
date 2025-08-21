import { BotContext } from '~/shared/context';
import { middlewareFn } from '~/shared/types/middleware';
import { logger } from '~/utils/logger';

export function logMiddleware(): middlewareFn<BotContext> {
  return async function (ctx, next) {
    try {
      const message = buildLogMessage(ctx);
      if (message) {
        logger.info(message);
      }
      await next();
    } catch (error) {
      logger.error(
        `Error in log middleware: ${error instanceof Error ? error.message : String(error)}`,
      );
      await next();
    }
  };
}

function buildLogMessage(ctx: BotContext): string {
  const messageParts: string[] = [];

  const userInfo = getUserInfo(ctx);
  if (userInfo) messageParts.push(userInfo);

  const sceneInfo = getSceneInfo(ctx);
  if (sceneInfo) messageParts.push(sceneInfo);

  const interactionInfo = getInteractionInfo(ctx);
  if (interactionInfo) messageParts.push(interactionInfo);

  return messageParts.join(' ');
}

function getUserInfo(ctx: BotContext): string {
  if (!ctx.user) return '';

  const { tgFirstName, tgLastName, tgUsername } = ctx.user;
  return `${tgFirstName || ''} ${tgLastName || ''} (${tgUsername || 'unknown'}) -`;
}

function getSceneInfo(ctx: BotContext): string {
  if (!ctx.scene?.current) return '';

  return `(${ctx.scene.current.id})`;
}

function getInteractionInfo(ctx: BotContext): string {
  if (!ctx.update) return '';

  // Check for callback query
  // @ts-ignore
  if (ctx.update.callback_query?.data) {
    // @ts-ignore
    return `event - ${ctx.update.callback_query.data}`;
  }

  // Check for message text
  // @ts-ignore
  if (ctx.update.message?.text) {
    // @ts-ignore
    return `type - ${ctx.update.message.text}`;
  }

  // Check for payment
  // @ts-ignore
  if (ctx.update.message?.successful_payment) {
    // @ts-ignore
    const payment = ctx.update.message.successful_payment;
    return `successful payment ${payment.total_amount} ${payment.currency} ${payment.telegram_payment_charge_id} ${payment.provider_payment_charge_id}`;
  }

  return '';
}
