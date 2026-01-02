import { z } from "zod";

export const taskCreateSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(120, "Title is too long"),
  description: z.string().trim().max(1000, "Description is too long").default(""),
  completed: z.boolean().default(false)
});

export const taskUpdateSchema = taskCreateSchema;

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
