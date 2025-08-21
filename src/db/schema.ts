import { bigint, boolean, integer, json, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { RegistrationForm, RegistrationType } from "~/shared/types/registration";

export const usersTable = pgTable("users", {
  tgId: bigint({ mode: 'number' }).notNull().primaryKey(),
  tgUsername: varchar({ length: 255 }),
  tgFirstName: varchar({ length: 255 }).notNull(),
  tgLastName: varchar({ length: 255 }),

  isAdmin: boolean().notNull().default(false),
  started: boolean().notNull().default(false),
  isBanned: boolean().notNull().default(false),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;

export const sessionsTable = pgTable("sessions", {
  key: varchar({ length: 255 }).notNull().unique(),
  data: json().notNull(),
});
export type Session = typeof sessionsTable.$inferSelect;
export type SessionInsert = typeof sessionsTable.$inferInsert;


export const registrationTypeEnum = pgEnum("registration_type", RegistrationType);

export const registrationsTable = pgTable("registrations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tgId: bigint({ mode: 'number' }).notNull(),

  type: registrationTypeEnum().notNull(),
  data: json().$type<RegistrationForm>(),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export type Registration = typeof registrationsTable.$inferSelect;
export type RegistrationInsert = typeof registrationsTable.$inferInsert;
