import { eq } from 'drizzle-orm';
import { db } from '~/db/connection';
import { sessionsTable } from '~/db/schema';
import { BotContext } from '~/shared/context';
import { middlewareFn } from '~/shared/types/middleware';
import { getSessionKey } from '~/utils/session';

export function sessionDbMiddleware(): middlewareFn<BotContext> {
  return async function (ctx, next) {
    const key = await getSessionKey(ctx);
    if (!key) {
      return next();
    }

    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.key, key));

    let sessionData = session?.data || {};

    Object.defineProperty(ctx, 'session', {
      get: function () {
        return sessionData;
      },
      set: function (newValue) {
        sessionData = Object.assign({}, newValue);
      },
    });

    await next();

    if (session) {
      await db.update(sessionsTable).set({
        data: sessionData,
      }).where(eq(sessionsTable.key, key));
    } else {
      await db.insert(sessionsTable).values({
        key,
        data: sessionData,
      });
    }
  };
}
