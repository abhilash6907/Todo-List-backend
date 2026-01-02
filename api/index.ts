import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import { connectToMongo } from "../server/src/db/mongo";
import { errorHandler, notFound } from "../server/src/middleware/errors";
import { authRouter } from "../server/src/modules/auth/routes";
import { tasksRouter } from "../server/src/modules/tasks/routes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.get("/", (_req: Request, res: Response) => {
  res.json({ 
    message: "Todo List API",
    status: "running"
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB on cold start
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await connectToMongo();
    isConnected = true;
  }
}

// Serverless function handler
export default async (req: Request, res: Response) => {
  await connectDB();
  return app(req, res);
};
