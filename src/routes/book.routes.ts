import { Router } from "express";
import {
  createBookController,
  getBooksController,
  getBookByIdController,
  getBookBySlugController,
} from "../controllers/book.controller.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import {
  createBookSchema,
  bookIdParamSchema,
  bookSlugParamSchema,
  bookQuerySchema,
} from "../validation/book.validation.js";

const router = Router();

// Create a new book (Supports Bearer token, session cookie, or createdBy in body)
router.post(
  "/",
  optionalAuth,
  validateRequest({ body: createBookSchema }),
  createBookController
);

// Get list of books with search, filters, and pagination
router.get(
  "/",
  validateRequest({ query: bookQuerySchema }),
  getBooksController
);

// Get single book by slug
router.get(
  "/slug/:slug",
  validateRequest({ params: bookSlugParamSchema }),
  getBookBySlugController
);

// Get single book by ObjectId
router.get(
  "/:id",
  validateRequest({ params: bookIdParamSchema }),
  getBookByIdController
);

export default router;
