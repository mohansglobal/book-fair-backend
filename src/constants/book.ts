export const BOOK_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  OUT_OF_STOCK: "out of stock",
  DRAFT: "draft",
} as const;

export type BookStatus = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS];

export const BOOK_STATUS_VALUES = Object.values(BOOK_STATUS) as [
  BookStatus,
  ...BookStatus[]
];
