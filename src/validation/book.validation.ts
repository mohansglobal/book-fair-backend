import { z } from "zod";
import { BOOK_STATUS, BOOK_STATUS_VALUES } from "../constants/book.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Book title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Book slug is required")
    .toLowerCase(),
  description: z
    .string()
    .trim()
    .min(1, "Book description is required"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .default(0)
    .optional(),
  authors: z
    .array(objectIdSchema)
    .min(1, "At least one author is required"),
  publisher: objectIdSchema,
  categories: z
    .array(objectIdSchema)
    .min(1, "At least one category is required"),
  language: z
    .string()
    .trim()
    .default("English")
    .optional(),
  coverImage: z
    .string()
    .trim()
    .default("")
    .optional(),
  isbn: z
    .string()
    .trim()
    .optional(),
  status: z
    .enum(BOOK_STATUS_VALUES)
    .default(BOOK_STATUS.DRAFT)
    .optional(),
  createdBy: objectIdSchema.optional(),
});

export const updateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Book title cannot be empty")
    .optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Book slug cannot be empty")
    .toLowerCase()
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Book description cannot be empty")
    .optional(),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .optional(),
  authors: z
    .array(objectIdSchema)
    .min(1, "At least one author is required")
    .optional(),
  publisher: objectIdSchema.optional(),
  categories: z
    .array(objectIdSchema)
    .min(1, "At least one category is required")
    .optional(),
  language: z
    .string()
    .trim()
    .optional(),
  coverImage: z
    .string()
    .trim()
    .optional(),
  isbn: z
    .string()
    .trim()
    .optional(),
  status: z
    .enum(BOOK_STATUS_VALUES)
    .optional(),
});

export const bookIdParamSchema = z.object({
  id: objectIdSchema,
});

export const bookSlugParamSchema = z.object({
  slug: z.string().trim().min(1, "Book slug is required").toLowerCase(),
});

export const bookQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: objectIdSchema.optional(),
  author: objectIdSchema.optional(),
  publisher: objectIdSchema.optional(),
  status: z.enum(BOOK_STATUS_VALUES).optional(),
  language: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQueryInput = z.infer<typeof bookQuerySchema>;
