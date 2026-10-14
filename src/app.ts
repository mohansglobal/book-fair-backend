import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { apiResponse } from "./utils/api-response.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get("/health", (_req, res) => {
  apiResponse(res, 200, "API is healthy");
});

// Authentication & User routes
app.use("/api/v1/auth", authRouter);

// 404 Handler for unmatched routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
