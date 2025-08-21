CREATE TYPE "public"."registration_type" AS ENUM('COURSE', 'TRIAL_LESSON');--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "registrations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tgId" bigint NOT NULL,
	"type" "registration_type" NOT NULL,
	"data" json,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"key" varchar(255) NOT NULL,
	"data" json NOT NULL,
	CONSTRAINT "sessions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"tgId" bigint PRIMARY KEY NOT NULL,
	"tgUsername" varchar(255),
	"tgFirstName" varchar(255) NOT NULL,
	"tgLastName" varchar(255),
	"isAdmin" boolean DEFAULT false NOT NULL,
	"started" boolean DEFAULT false NOT NULL,
	"isBanned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
