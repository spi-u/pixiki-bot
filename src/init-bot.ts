import { Markup, Telegraf } from "telegraf";
import { BotContext } from "./shared/context";
import { COURSES } from "./shared/constants";
import { PARENT_NAME_SCENE } from "./scenes";
import { RegistrationForm, RegistrationType } from "./shared/types/registration";
import { db } from "./db/connection";
import { registrationsTable } from "./db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import * as moment from 'moment'

enum CallbackAction {
  INFO = 'info',
  COURSE_REGISTER = 'course_register',
  TRIAL_LESSON_REGISTER = 'trial_lesson_register',
}

export function initBot(bot: Telegraf<BotContext>) {
  bot.command('start', async (ctx) => {
    return ctx.replyWithHTML(`👋 <b>Здравствуйте!</b>

Рады приветствовать вас в семейном клубе «PixИки»! 🎉
С сентября 2025 года стартуют курсы по программированию, робототехнике, 3D-моделированию и творческим направлениям для детей от 4 до 18 лет.
Выбирайте направление, записывайтесь на <b>бесплатный</b> пробный урок и узнавайте подробнее о курсах!`, 
    Markup.inlineKeyboard([
      [Markup.button.callback('Информация о курсах', CallbackAction.INFO)],
      [Markup.button.callback('Записаться на курс', CallbackAction.COURSE_REGISTER)],
      [Markup.button.callback('Записаться на пробный урок', CallbackAction.TRIAL_LESSON_REGISTER)],
    ]));
  });

  bot.action(CallbackAction.INFO, async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.replyWithHTML(`<b>🤖 Робототехника</b> - создание и управление роботами, развитие логического мышления и моторики
<b>Junior</b> (4–8 лет) — LEGO WeDo 2.0, Scratch, основы 3D-печати.
<b>Smart</b> (9–12 лет) — LEGO Spike Prime, углублённая 3D-печать.

<b>💻 Программирование</b> - погружение в мир инноваций и работа с собственными проектами
<b>Puzzle</b> (7–9 лет) — визуальные языки (Scratch, Minecraft, Kodu), мини-игры.
<b>BaseIt</b> (9–10 лет) — Scratch, Minecraft (MCreator), Roblox Studio, Construct 3.
<b>CodeUp</b> (10–12 лет) — переход к текстовому коду: JavaScript, Python (PyGame).
<b>GameDev</b> (11–16 лет) — 2D/3D игры, чат-боты (Unity, Python, Blender).
<b>WebLab</b> (11–16 лет) — дизайн и создание сайтов (Figma, HTML/CSS, JS, Tilda).

<b>🧩 3D-моделирование и печать</b> - освоение инструментов создания трехмерных объектов, развитие пространственного и аналитического мышления
<b>Start</b> (7–10 лет) — сувениры, игрушки, персонажи.
<b>Core</b> (10–14 лет) — сложные модели: фигурки, элементы экзоскелета.
<b>Complex</b> (12–16 лет) — инженерные проекты, пневматика, олимпиады.

<b>🎵 Музыкальный курс (для малышей с 4 лет)</b> — развитие слуха, ритма и творческого мышления через музыку.

<b>💰 Финансовая грамотность (для детей от 6 до 12 лет)</b> — основы финансовой культуры, понимание.
`, 
    Markup.inlineKeyboard([
      [Markup.button.callback('Записаться на курс', CallbackAction.COURSE_REGISTER)],
      [Markup.button.callback('Записаться на пробный урок', CallbackAction.TRIAL_LESSON_REGISTER)],
    ]));
  });

  bot.action(CallbackAction.COURSE_REGISTER, async (ctx) => {
    await ctx.answerCbQuery();
    
    return ctx.replyWithHTML('Выберите курс для записи', Markup.inlineKeyboard([
      ...COURSES.map((course) => [Markup.button.callback(course.name, `course:${course.code}`)]),
    ]));
  });

  bot.action(/^course:([a-zA-Z0-9]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessageOrClearReplyMarkup();

    const courseCode = ctx.match[1];
    const course = COURSES.find((course) => course.code === courseCode)!;
    
    const courseRegistrations = await db
      .select()
      .from(registrationsTable)
      .where(
        and(
          eq(registrationsTable.tgId, ctx.from.id),
          eq(registrationsTable.type, RegistrationType.COURSE),
        )
      );
    const currentCourseRegistrations = courseRegistrations.filter((registration) => registration.data?.courseCode === course.code);
    if (currentCourseRegistrations.length >= 3) {
      return ctx.replyWithHTML('Вы уже сделали 3 записи на данный курс');
    }

    const initialState: RegistrationForm = {
      type: RegistrationType.COURSE,
      courseCode: course.code,
    }
    return ctx.scene.enter(PARENT_NAME_SCENE, initialState)
  });

  bot.action(CallbackAction.TRIAL_LESSON_REGISTER, async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.replyWithHTML('Выберите на какой пробный урок вы хотите записаться', Markup.inlineKeyboard([
      ...COURSES.map((course) => [Markup.button.callback(course.name, `trial_lesson:${course.code}`)]),
    ]));
  });

  bot.action(/^trial_lesson:([a-zA-Z0-9]+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessageOrClearReplyMarkup();

    const courseCode = ctx.match[1];
    const course = COURSES.find((course) => course.code === courseCode)!;
    console.log(course);
    
    const trialLessonRegistrations = await db
      .select()
      .from(registrationsTable)
      .where(
        and(
          eq(registrationsTable.tgId, ctx.from.id),
          eq(registrationsTable.type, RegistrationType.TRIAL_LESSON),
        )
      );
    const currentTrialLessonRegistrations = trialLessonRegistrations.filter((registration) => registration.data?.courseCode === course.code);
    if (currentTrialLessonRegistrations.length >= 3) {
      return ctx.replyWithHTML('Вы уже сделали 3 записи на пробный урок по данному курсу');
    }
    
    const initialState: RegistrationForm = {
      type: RegistrationType.TRIAL_LESSON,
      courseCode: course.code,
    }
    return ctx.scene.enter(PARENT_NAME_SCENE, initialState)
  });

  bot.command('registrations', async (ctx) => {
    const registrations = await db
      .select()
      .from(registrationsTable)
      .where(
        eq(registrationsTable.tgId, ctx.from.id),
      )
      .orderBy(asc(registrationsTable.createdAt));
    
    if (registrations.length === 0) {
      return ctx.replyWithHTML('У вас пока нет записей на курсы или на пробные уроки', Markup.inlineKeyboard([
        [Markup.button.callback('Записаться на курс', CallbackAction.COURSE_REGISTER)],
        [Markup.button.callback('Записаться на пробный урок', CallbackAction.TRIAL_LESSON_REGISTER)],
      ]));
    }

    return ctx.replyWithHTML(`<i>Ваши текущие записи:</i>

${registrations.map((registration, index) => `<b>${index + 1}. ${registration.type === RegistrationType.COURSE ? `Курс` : `Пробный урок`} «${COURSES.find((course) => course.code === registration.data?.courseCode)?.name}»</b> 
${registration.data?.childName ? `Имя ребенка: <i>${registration.data?.childName}</i>` : ''}
${registration.data?.childAge ? `Возраст ребенка: <i>${registration.data?.childAge}</i>` : ''}
${registration?.data?.type === RegistrationType.TRIAL_LESSON && registration?.data?.selectedLessonTime ? `Время проведения урока: <i>${moment(new Date(registration.data?.selectedLessonTime)).format('DD.MM.YYYY в HH:mm')}</i>` : ''}`).join('\n\n')}`, 
    Markup.inlineKeyboard([
      [Markup.button.callback('Записаться на курс', CallbackAction.COURSE_REGISTER)],
      [Markup.button.callback('Записаться на пробный урок', CallbackAction.TRIAL_LESSON_REGISTER)],
    ]));
  });
}