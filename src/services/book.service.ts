import { Book, type IBook } from "../models/book.model.js";
import { BOOK_STATUS } from "../constants/book.js";
import {
  CreateBookInput,
  BookQueryInput,
} from "../validation/book.validation.js";
import { AppError } from "../utils/app-error.js";
import { HTTP_STATUS } from "../constants/http-status.js";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetBooksResult {
  books: unknown[];
  pagination: PaginationMeta;
}

/**
 * Creates a new book document in the database.
 * Explicitly validates that the slug is unique and assigns createdBy.
 */
export const createBookService = async (
  input: CreateBookInput,
  authenticatedUserId?: string
): Promise<IBook> => {
  const createdBy = input.createdBy || authenticatedUserId;

  if (!createdBy) {
    throw new AppError(
      "Created by user ID is required. Please provide createdBy or authenticate.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const existingBook = await Book.findOne({ slug: input.slug });
  if (existingBook) {
    throw new AppError(
      `A book with slug '${input.slug}' already exists`,
      HTTP_STATUS.CONFLICT
    );
  }

  const book = await Book.create({
    title: input.title,
    slug: input.slug,
    description: input.description,
    price: input.price ?? 0,
    authors: input.authors,
    publisher: input.publisher,
    categories: input.categories,
    language: input.language || "English",
    coverImage: input.coverImage || "",
    isbn: input.isbn || undefined,
    status: input.status || BOOK_STATUS.DRAFT,
    createdBy,
  });

  return book;
};

/**
 * Retrieves books with pagination, search, and filtering options.
 */
export const getBooksService = async (
  query: BookQueryInput
): Promise<GetBooksResult> => {
  const filter: Record<string, unknown> = {};
  
  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.categories = query.category;
  }

  if (query.author) {
    filter.authors = query.author;
  }

  if (query.publisher) {
    filter.publisher = query.publisher;
  }
  
  if (query.language) {
    filter.language = query.language;
  }

  if (query.search) {
    const escapedSearch = query.search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    filter.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, Math.min(100, query.limit || 10));
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    Book.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Book.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    books,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Retrieves a single book by its MongoDB ObjectId.
 */
export const getBookByIdService = async (id: string): Promise<unknown> => {
  const book = await Book.findById(id).select("-__v").lean();

  if (!book) {
    throw new AppError("Book not found", HTTP_STATUS.NOT_FOUND);
  }

  return book;
};

/**
 * Retrieves a single book by its unique slug identifier.
 */
export const getBookBySlugService = async (slug: string): Promise<unknown> => {
  const book = await Book.findOne({ slug: slug.toLowerCase() })
    .select("-__v")
    .lean();

  if (!book) {
    throw new AppError("Book not found", HTTP_STATUS.NOT_FOUND);
  }

  return book;
};
