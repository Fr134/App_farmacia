import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import reportsRouter from "./routes/reports";
import uploadRouter from "./routes/upload";
import { errorHandler } from "./middleware/error-handler";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/upload", uploadRouter);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
