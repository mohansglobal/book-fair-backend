import { Request, Response } from "express";
import {
  createBookService,
  getBooksService,
  getBookByIdService,
  getBookBySlugService,
} from "../services/book.service.js";
import {
  CreateBookInput,
  BookQueryInput,
} from "../validation/book.validation.js";
import { apiResponse } from "../utils/api-response.js";
import { HTTP_STATUS } from "../constants/http-status.js";

/**
 * Controller to create a new book.
 */
export const createBookController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: CreateBookInput = req.body;
  const book = await createBookService(input, req.user?.userId);

  apiResponse(res, HTTP_STATUS.CREATED, "Book created successfully", book);
};

/**
 * Controller to get books with pagination, search, and filtering.
 */
export const getBooksController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = req.query as unknown as BookQueryInput;
  const result = await getBooksService(query);

  apiResponse(res, HTTP_STATUS.OK, "Books retrieved successfully", result);
};

/**
 * Controller to get a book by its MongoDB ObjectId.
 */
export const getBookByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;
  const book = await getBookByIdService(id);

  apiResponse(res, HTTP_STATUS.OK, "Book retrieved successfully", book);
};

/**
 * Controller to get a book by its unique slug.
 */
export const getBookBySlugController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const slug = req.params.slug as string;
  const book = await getBookBySlugService(slug);

  apiResponse(res, HTTP_STATUS.OK, "Book retrieved successfully", book);
};
