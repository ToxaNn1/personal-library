CREATE TABLE "reading_goals" (
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"target_books" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_goals_user_id_year_pk" PRIMARY KEY("user_id","year"),
	CONSTRAINT "reading_goals_target_positive" CHECK ("reading_goals"."target_books" > 0)
);
--> statement-breakpoint
ALTER TABLE "reading_goals" ADD CONSTRAINT "reading_goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;