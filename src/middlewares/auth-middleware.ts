import { eq } from 'drizzle-orm';
import { isEqual } from 'lodash';
import { db } from '~/db/connection';
import { usersTable } from '~/db/schema';
import { BotContext } from '~/shared/context';
import { initialBotState } from '~/shared/state';
import { middlewareFn } from '~/shared/types/middleware';
import { logger } from '~/utils/logger';

export function authMiddleware(): middlewareFn<BotContext> {
  return async function (ctx, next) {
    if (!ctx.from) {
      return logger.error('Context field from is required');
    }

    console.log(ctx.chat)

    let [user] = await db.select().from(usersTable).where(eq(usersTable.tgId, ctx.from.id));

    if (!user) {
      const [createdUser] = await db.insert(usersTable).values({
        tgId: ctx.from.id,
        tgUsername: ctx.from.username,
        tgFirstName: ctx.from.first_name,
        tgLastName: ctx.from.last_name,
      }).returning();

      
      user = createdUser;
      ctx.session.state = initialBotState;
    } else {
      const needUpdate =
        isEqual(ctx.from.username, user.tgUsername) ||
        isEqual(ctx.from.first_name, user.tgFirstName) ||
        isEqual(ctx.from.last_name, user.tgLastName);

      if (needUpdate) {
        const [updatedUser] = await db.update(usersTable).set({
          tgUsername: ctx.from.username,
          tgFirstName: ctx.from.first_name,
          tgLastName: ctx.from.last_name,
        }).where(eq(usersTable.tgId, ctx.from.id)).returning();

        user = updatedUser;
      }
    }

    if (user.isBanned) {
      return ctx.reply('Вы были заблокированны');
    }

    ctx.user = user;

    await next();
  };
}
