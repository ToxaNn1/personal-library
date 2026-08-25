CREATE INDEX "books_author_idx" ON "books" USING btree ("author");--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "books_search_idx" ON "books" USING gin (to_tsvector('simple', "title"));