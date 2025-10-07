import { BotContext } from '~/shared/context';
import { Markup, Scenes } from 'telegraf';
import { RegistrationForm, RegistrationType } from '~/shared/types/registration';
import { COURSES, MANAGE_CHAT_ID } from '~/shared/constants';
import { alphacrmService } from '~/services/alphacrm';
import { registrationsTable } from '~/db/schema';
import { db } from '~/db/connection';
import * as moment from 'moment';

export const SCHEDULE_SCENE = 'SCHEDULE_SCENE';
export const scheduleScene = new Scenes.BaseScene<BotContext<RegistrationForm>>(SCHEDULE_SCENE);

enum CallbackAction {
  REFRESH = 'refresh',
}

scheduleScene.enter(async (ctx) => {
  console.log(ctx.scene.session.state);
  const course = COURSES.find(course => course.code === ctx.scene.session.state.courseCode)!;
  const availableLessons = alphacrmService.getAvailableLessonsBySubjectIds(course.subjectIds).slice(0, 5);
  if (availableLessons.length === 0) {
    return ctx.replyWithHTML('К сожалению, пробных уроков по данному курсу пока нет. Мы обязательно сообщим, когда они появятся 😢', Markup.inlineKeyboard([
      [Markup.button.callback('Обновить', CallbackAction.REFRESH)],
    ]));
  }
  return ctx.replyWithHTML('Выберите, в какое время вам будет удобнее посетить пробный урок', Markup.inlineKeyboard(availableLessons.map(lesson => [
    Markup.button.callback(`${moment(new Date(lesson.time_from)).format('DD.MM.YYYY HH:mm')}`, `lesson:${lesson.id}`),
  ])));
});

scheduleScene.action(CallbackAction.REFRESH, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessageOrClearReplyMarkup();
  return ctx.scene.enter(SCHEDULE_SCENE, ctx.scene.session.state);
});

scheduleScene.action(/^lesson:([0-9]+)$/, async (ctx) => {
  const lessonId = ctx.match[1];
  ctx.scene.session.state.selectedLessonId = Number(lessonId);
  
  await ctx.answerCbQuery();
  await ctx.deleteMessageOrClearReplyMarkup();
  const { message_id } = await ctx.reply('Подождите, идет запись...')

  const course = COURSES.find(course => course.code === ctx.scene.session.state.courseCode)!;
  
  const state = ctx.scene.session.state as Required<RegistrationForm>; 
  const lesson = await alphacrmService.getLessonById(state.selectedLessonId);
  if (!lesson) {
    await ctx.telegram.editMessageText(ctx.from.id, message_id, undefined, 'К сожалению, пробного урока по данному курсу на это время пока нет 😢');
    return ctx.scene.enter(SCHEDULE_SCENE, ctx.scene.session.state);
  }

  // const customer = await alphacrmService.createCustomer({
  //   name: state.childName,
  //   phone: `${state.parentPhone} (${state.parentName})`,
  //   note: `Возраст: ${state.childAge} лет. Хотят записаться на пробный урок по курсу ${course.name} на ${moment(new Date(lesson.time_from)).format('DD.MM.YYYY в HH:mm')}`
  // })
  // await alphacrmService.addCustomerToLesson(state.selectedLessonId, customer.id)

  await ctx.telegram.sendMessage(
    MANAGE_CHAT_ID, 
    `🟡 Хотят записаться на пробный урок по <b>${course.name}</b> на <b>${moment(new Date(lesson.time_from)).format('DD.MM.YYYY в HH:mm')}</b>

<i>Родитель:</i> <code>${state.parentName}</code>
<i>Ребенок:</i> <code>${state.childName}, ${state.childAge} лет</code>
<i>Номер телефона:</i> <code>${state.parentPhone}</code>
`,
    {
      parse_mode: 'HTML',
    }
  )

  await db.insert(registrationsTable).values({
    tgId: ctx.from.id,
    type: RegistrationType.TRIAL_LESSON,
    data: {
      ...ctx.scene.session.state,
      type: RegistrationType.TRIAL_LESSON,
      selectedLessonTime: lesson.time_from,
      // customerId: customer.id,
    },
  })

  await ctx.telegram.editMessageText(ctx.from.id, message_id, undefined, `🎉 Вы записаны на пробный урок на ${moment(new Date(lesson.time_from)).format('DD.MM.YYYY в HH:mm')}! В ближайшее время с вами свяжется наш администратор для подтверждения записи`, { parse_mode: 'HTML'});
  return ctx.scene.leave();
});