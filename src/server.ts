import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });

    const handleGracefulShutdown = async (signal: string) => {
      logger.info({ signal }, "Graceful shutdown initiated...");
      server.close(async () => {
        logger.info("HTTP server closed.");
        try {
          await mongoose.connection.close();
          logger.info("Database disconnected cleanly.");
          process.exit(0);
        } catch (error) {
          logger.error({ error }, "Error during shutdown");
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => void handleGracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => void handleGracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
};

void startServer();
