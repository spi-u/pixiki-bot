import { BotContext } from '~/shared/context';
import { Scenes } from 'telegraf';
import { RegistrationForm } from '~/shared/types/registration';
import { phone } from 'phone';
import { EMAIL_SCENE } from './email-scene';

export const PHONE_SCENE = 'PHONE_SCENE';
export const phoneScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(PHONE_SCENE);

phoneScene.enter(async (ctx) => {
  return ctx.replyWithHTML('Введите ваш телефон:');
});

phoneScene.on('text', async (ctx) => {
  const result = phone(ctx.message.text);
  if (!result.isValid) {
    return ctx.replyWithHTML('Введите телефон в правильном формате:');
  }
  ctx.scene.session.state.parentPhone = result.phoneNumber;
  return ctx.scene.enter(EMAIL_SCENE, ctx.scene.session.state);
});
