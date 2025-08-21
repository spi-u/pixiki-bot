import { BotContext } from '~/shared/context';
import { Markup, Scenes } from 'telegraf';
import { RegistrationForm, RegistrationType } from '~/shared/types/registration';
import { PARENT_NAME_SCENE } from './parent-name-scene';
import { alphacrmService } from '~/services/alphacrm';
import { COURSES } from '~/shared/constants';
import { SCHEDULE_SCENE } from './shedule-scene';
import { db } from '~/db/connection';
import { registrationsTable } from '~/db/schema';

export const CHECK_SCENE = 'CHECK_SCENE';
export const checkScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(CHECK_SCENE);

checkScene.enter(async (ctx) => {
  return ctx.replyWithHTML(
    `Проверьте, правильно ли вы ввели данные:

<b>Ваше имя:</b> ${ctx.scene.session.state.parentName}
<b>Имя ребенка:</b> ${ctx.scene.session.state.childName}
<b>Возраст ребенка:</b> ${ctx.scene.session.state.childAge}
<b>Телефон:</b> ${ctx.scene.session.state.parentPhone}
<b>Почта:</b> ${ctx.scene.session.state.email}`, 
  Markup.inlineKeyboard([
    [Markup.button.callback('Верно', 'check_correct')],
    [Markup.button.callback('Неверно, внести изменения', 'check_incorrect')],
  ]));
});

checkScene.action('check_correct', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined);

  if (ctx.scene.session.state.type === RegistrationType.TRIAL_LESSON) {
    return ctx.scene.enter(SCHEDULE_SCENE, ctx.scene.session.state)
  }

  const course = COURSES.find(course => course.code === ctx.scene.session.state.courseCode)!;

  const state = ctx.scene.session.state as Required<RegistrationForm>; 
  
  const customer = await alphacrmService.createCustomer({
    name: state.childName,
    email: `${state.email} (${state.parentName})`,
    phone: `${state.parentPhone} (${state.parentName})`,
    note: `Возраст: ${state.childAge} лет. Хотят записаться на курс ${course.name}`
  })

  await db.insert(registrationsTable).values({
    tgId: ctx.from.id,
    type: RegistrationType.COURSE,
    data: {
      ...ctx.scene.session.state,
      type: RegistrationType.COURSE,
      customerId: customer.id,
    },
  })

  await ctx.replyWithHTML(`🎉 Вы записаны на курс ${course.name}! В ближайшее время с вами свяжется наш администратор для подтверждения записи`);
  return ctx.scene.leave();
});

checkScene.action('check_incorrect', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined);
  return ctx.scene.enter(PARENT_NAME_SCENE, ctx.scene.session.state);
});