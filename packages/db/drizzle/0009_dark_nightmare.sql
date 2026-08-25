DROP INDEX "books_created_at_idx";--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");