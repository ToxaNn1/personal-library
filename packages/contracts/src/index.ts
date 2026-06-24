import { oc } from "@orpc/contract";
import { z } from "zod";

export const BookSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author: z.string(),
  year: z.number().int().nullable(),
});

export type Book = z.infer<typeof BookSchema>;

export const CreateBookInput = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(200),
  year: z.number().int().min(0).max(9999).nullable().optional(),
});

export const contract = {
  hello: oc.input(z.object({ name: z.string().min(1) })).output(z.object({ message: z.string() })),

  listBooks: oc.output(z.array(BookSchema)),

  createBook: oc.input(CreateBookInput).output(BookSchema),

  deleteBook: oc
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() })),
};

export type Contract = typeof contract;
