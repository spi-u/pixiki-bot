import { BotContext } from '~/shared/context';
import { Scenes } from 'telegraf';
import { RegistrationForm, RegistrationType } from '~/shared/types/registration';
import { phone } from 'phone';
import { EMAIL_SCENE } from './email-scene';
import { CHECK_SCENE } from './check-scene';

export const PHONE_SCENE = 'PHONE_SCENE';
export const phoneScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(PHONE_SCENE);

phoneScene.enter(async (ctx) => {
  return ctx.replyWithHTML('Введите ваш номер телефона (<i>начиная с +7</i>):');
});

phoneScene.on('text', async (ctx) => {
  const result = phone(ctx.message.text);
  if (!result.isValid) {
    return ctx.replyWithHTML('Введите номер телефона в правильном формате:');
  }
  ctx.scene.session.state.parentPhone = result.phoneNumber;

  if (ctx.scene.session.state.type === RegistrationType.TRIAL_LESSON) {
    return ctx.scene.enter(CHECK_SCENE, ctx.scene.session.state);
  }
  return ctx.scene.enter(EMAIL_SCENE, ctx.scene.session.state);
});
