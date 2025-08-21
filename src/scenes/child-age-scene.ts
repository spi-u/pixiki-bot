import { BotContext } from '~/shared/context';
import { Scenes } from 'telegraf';
import { RegistrationForm } from '~/shared/types/registration';
import z from 'zod';
import { PHONE_SCENE } from './phone-scene';

export const ageSchema = z
  .coerce.number()
  .min(1)
  .max(120);

export const CHILD_AGE_SCENE = 'CHILD_AGE_SCENE';
export const childAgeScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(CHILD_AGE_SCENE);

childAgeScene.enter(async (ctx) => {
  return ctx.replyWithHTML('Введите возраст ребенка:');
});

childAgeScene.on('text', async (ctx) => {
  const result = ageSchema.safeParse(ctx.message.text);
  if (!result.success) {
    return ctx.replyWithHTML('Введите возраст в правильном формате:');
  }
  ctx.scene.session.state.childAge = result.data;
  return ctx.scene.enter(PHONE_SCENE, ctx.scene.session.state);
});
