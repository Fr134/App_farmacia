import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import reportsRouter from "./routes/reports";
import uploadRouter from "./routes/upload";
import expenseCategoriesRouter from "./routes/expense-categories";
import expensesRouter from "./routes/expenses";
import suppliersRouter from "./routes/suppliers";
import budgetsRouter from "./routes/budgets";
import sivatRouter from "./routes/sivat";
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
app.use(cookieParser());

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/expense-categories", expenseCategoriesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/sivat", sivatRouter);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
