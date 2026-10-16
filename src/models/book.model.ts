import { Schema, model, Document, Types } from "mongoose";
import {
  BOOK_STATUS,
  type BookStatus,
  BOOK_STATUS_VALUES,
} from "../constants/book.js";

export interface IBook extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  authors: Types.ObjectId[];
  publisher: Types.ObjectId;
  categories: Types.ObjectId[];
  language: string;
  coverImage?: string;
  isbn?: string;
  status: BookStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Book slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Book description is required"],
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    authors: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Author",
        },
      ],
      required: [true, "At least one author is required"],
      validate: {
        validator: (authors: Types.ObjectId[]) =>
          Array.isArray(authors) && authors.length > 0,
        message: "At least one author is required",
      },
    },
    publisher: {
      type: Schema.Types.ObjectId,
      ref: "Publisher",
      required: [true, "Publisher is required"],
      index: true,
    },
    categories: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      required: [true, "At least one category is required"],
      validate: {
        validator: (categories: Types.ObjectId[]) =>
          Array.isArray(categories) && categories.length > 0,
        message: "At least one category is required",
      },
    },
    language: {
      type: String,
      trim: true,
      default: "English",
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },
    isbn: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: BOOK_STATUS_VALUES,
        message: "{VALUE} is not a valid book status",
      },
      default: BOOK_STATUS.DRAFT,
      lowercase: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

bookSchema.index({ authors: 1 });
bookSchema.index({ categories: 1 });
bookSchema.index({ title: "text", description: "text" });

export const Book = model<IBook>("Book", bookSchema);
