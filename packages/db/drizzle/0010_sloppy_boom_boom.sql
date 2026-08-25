ALTER TABLE "shelves" ADD CONSTRAINT "shelves_id_user_kind_unique" UNIQUE("id","user_id","kind");--> statement-breakpoint
ALTER TABLE "shelf_items" DROP CONSTRAINT "shelf_items_user_book_unique";--> statement-breakpoint
ALTER TABLE "shelf_items" DROP CONSTRAINT "shelf_items_shelf_fk";--> statement-breakpoint
ALTER TABLE "shelf_items" ADD COLUMN "kind" text;--> statement-breakpoint
UPDATE "shelf_items" si SET "kind" = s."kind" FROM "shelves" s WHERE s."id" = si."shelf_id";--> statement-breakpoint
ALTER TABLE "shelf_items" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_shelf_fk" FOREIGN KEY ("shelf_id","user_id","kind") REFERENCES "public"."shelves"("id","user_id","kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shelf_items_user_book_status_unique" ON "shelf_items" USING btree ("user_id","book_id") WHERE "shelf_items"."kind" <> 'custom';--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_user_shelf_book_unique" UNIQUE("user_id","shelf_id","book_id");
