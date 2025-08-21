import { BotContext } from '~/shared/context';
import { Scenes } from 'telegraf';
import { varcharSchema } from '~/shared/validation';
import { CHILD_NAME_SCENE } from './child-name-scene';
import { RegistrationForm } from '~/shared/types/registration';

export const PARENT_NAME_SCENE = 'PARENT_NAME_SCENE';
export const parentNameScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(PARENT_NAME_SCENE);

parentNameScene.enter(async (ctx) => {
  console.log(ctx.session.state)
  console.log(ctx.scene.session.state)
  return ctx.replyWithHTML('Введите ваше ФИО:');
});

parentNameScene.on('text', async (ctx) => {
   const result = varcharSchema.safeParse(ctx.message.text);
    if (!result.success) {
      return ctx.replyWithHTML('Введите ваше ФИО в правильном формате:');
    }
    ctx.scene.session.state.parentName = result.data;
    return ctx.scene.enter(CHILD_NAME_SCENE, ctx.scene.session.state);
});
