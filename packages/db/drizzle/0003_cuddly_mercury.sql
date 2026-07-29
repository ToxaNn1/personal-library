CREATE TABLE "shelf_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shelf_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"book_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shelf_items_user_book_unique" UNIQUE("user_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shelves_user_name_unique" UNIQUE("user_id","name"),
	CONSTRAINT "shelves_id_user_unique" UNIQUE("id","user_id")
);
--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_shelf_fk" FOREIGN KEY ("shelf_id","user_id") REFERENCES "public"."shelves"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shelf_items_shelf_idx" ON "shelf_items" USING btree ("shelf_id");--> statement-breakpoint
CREATE INDEX "shelf_items_book_idx" ON "shelf_items" USING btree ("book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shelves_user_kind_unique" ON "shelves" USING btree ("user_id","kind") WHERE "shelves"."kind" <> 'custom';--> statement-breakpoint
CREATE INDEX "shelves_user_idx" ON "shelves" USING btree ("user_id");