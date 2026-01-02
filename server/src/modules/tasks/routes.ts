import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { ApiError } from "../../middleware/errors";
import { requireAuth } from "../shared/authMiddleware";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  type TaskSort,
  updateTask
} from "./taskStore";
import { taskCreateSchema, taskUpdateSchema } from "../../validators/taskValidators";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}

tasksRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sort = (req.query.sort === "oldest" ? "oldest" : "latest") as TaskSort;
    res.json(await listTasks(userId(req), sort));
  } catch (e) {
    next(e);
  }
});

tasksRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await getTask(userId(req), req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.json(task);
  } catch (e) {
    next(e);
  }
});

tasksRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ApiError(400, "Invalid request body", parsed.error));
    return;
  }

  try {
    const created = await createTask(userId(req), parsed.data);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

tasksRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ApiError(400, "Invalid request body", parsed.error));
    return;
  }

  try {
    const updated = await updateTask(userId(req), req.params.id, parsed.data);
    if (!updated) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

tasksRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await deleteTask(userId(req), req.params.id);
    if (!ok) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
