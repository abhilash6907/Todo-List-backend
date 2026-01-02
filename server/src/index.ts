import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import { connectToMongo } from "./db/mongo";
import { errorHandler, notFound } from "./middleware/errors";
import { authRouter } from "./modules/auth/routes";
import { tasksRouter } from "./modules/tasks/routes";
import path from "path";

// Load .env from the server directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("🔧 Environment check:");
console.log("- CWD:", process.cwd());
console.log("- MONGODB_URI:", process.env.MONGODB_URI?.substring(0, 30) + "...");
console.log("- EMAIL_USER:", process.env.EMAIL_USER);
console.log("- EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false
  })
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 5174);

async function start() {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((e: unknown) => {
  console.error("Failed to start server", e);
  process.exit(1);
});
