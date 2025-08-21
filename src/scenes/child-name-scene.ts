import { BotContext } from '~/shared/context';
import { Scenes } from 'telegraf';
import { varcharSchema } from '~/shared/validation';
import { CHILD_AGE_SCENE } from './child-age-scene';

export const CHILD_NAME_SCENE = 'CHILD_NAME_SCENE';
export const childNameScene = new Scenes.BaseScene<BotContext>(CHILD_NAME_SCENE);

childNameScene.enter(async (ctx) => {
  return ctx.replyWithHTML('Введите имя ребенка:');
});

childNameScene.on('text', async (ctx) => {
  const result = varcharSchema.safeParse(ctx.message.text);
  if (!result.success) {
    return ctx.replyWithHTML('Введите имя ребенка в правильном формате:');
  }
  ctx.scene.session.state.childName = result.data;
  return ctx.scene.enter(CHILD_AGE_SCENE, ctx.scene.session.state);
});
