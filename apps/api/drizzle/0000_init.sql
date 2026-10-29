CREATE TYPE "public"."entry_source" AS ENUM('curated', 'dataset', 'wikipedia', 'override', 'ban', 'home');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('free', 'voa', 'eta', 'evisa', 'visa', 'none', 'home');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" char(3) NOT NULL,
	"country_code" char(2),
	CONSTRAINT "cities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" char(2) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"region" text NOT NULL,
	"cover" varchar(7) NOT NULL,
	"takes_the" boolean DEFAULT false NOT NULL,
	"airport_code" char(3),
	"airport_city" text,
	"near_note" text,
	"season_months" char(12),
	"season_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dataset_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"passport_code" char(2) NOT NULL,
	"destination_code" char(2) NOT NULL,
	"type" "entry_type" NOT NULL,
	"days" integer,
	"ext" integer DEFAULT 0 NOT NULL,
	"fee" text NOT NULL,
	"process" text NOT NULL,
	"note" text NOT NULL,
	"stamp" jsonb NOT NULL,
	"apply" jsonb,
	"form" jsonb,
	"options" jsonb NOT NULL,
	"source" "entry_source" NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_passport_code_destination_code_pk" PRIMARY KEY("passport_code","destination_code")
);
--> statement-breakpoint
CREATE TABLE "season_regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" char(2) NOT NULL,
	"position" smallint NOT NULL,
	"label" text NOT NULL,
	"months" char(12) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_passport_code_countries_code_fk" FOREIGN KEY ("passport_code") REFERENCES "public"."countries"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_destination_code_countries_code_fk" FOREIGN KEY ("destination_code") REFERENCES "public"."countries"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_regions" ADD CONSTRAINT "season_regions_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cities_code_idx" ON "cities" USING btree ("code");--> statement-breakpoint
CREATE INDEX "entries_destination_idx" ON "entries" USING btree ("destination_code");--> statement-breakpoint
CREATE INDEX "entries_passport_type_idx" ON "entries" USING btree ("passport_code","type");--> statement-breakpoint
CREATE INDEX "season_regions_country_idx" ON "season_regions" USING btree ("country_code");