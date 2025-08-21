import { BotContext } from '~/shared/context';
import { Scenes } from 'telegraf';
import { RegistrationForm } from '~/shared/types/registration';
import z from 'zod';
import { CHECK_SCENE } from './check-scene';

export const emailSchema = z
  .email();

export const EMAIL_SCENE = 'EMAIL_SCENE';
export const emailScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(EMAIL_SCENE);

emailScene.enter(async (ctx) => {
  return ctx.replyWithHTML('Введите вашу электронную почту:');
});

emailScene.on('text', async (ctx) => {
  const result = emailSchema.safeParse(ctx.message.text);
  if (!result.success) {
    return ctx.replyWithHTML('Введите почту в правильном формате:');
  }
  ctx.scene.session.state.email = result.data;
  return ctx.scene.enter(CHECK_SCENE, ctx.scene.session.state);
});
