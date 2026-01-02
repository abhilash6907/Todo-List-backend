import crypto from "crypto";
import type { Collection } from "mongodb";
import { getTasksCollection } from "../../db/mongo";
import type { Task } from "../../types";

export type TaskSort = "latest" | "oldest";

type TaskDocument = {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function tasks(): Promise<Collection<TaskDocument>> {
  return getTasksCollection() as unknown as Collection<TaskDocument>;
}

function toTask(doc: TaskDocument): Task {
  return {
    id: doc.id,
    userId: doc.userId,
    title: doc.title,
    description: doc.description,
    completed: doc.completed,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

export async function listTasks(userId: string, sort: TaskSort): Promise<Task[]> {
  const collection = await tasks();
  const order = sort === "oldest" ? 1 : -1;

  const docs = await collection
    .find({ userId }, { projection: { _id: 0 } })
    .sort({ createdAt: order })
    .toArray();

  return docs.map(toTask);
}

export async function getTask(userId: string, id: string): Promise<Task | undefined> {
  const collection = await tasks();
  const doc = await collection.findOne({ userId, id }, { projection: { _id: 0 } });
  return doc ? toTask(doc) : undefined;
}

export async function createTask(
  userId: string,
  input: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Task> {
  const collection = await tasks();
  const id = crypto.randomUUID();
  const now = new Date();

  const doc: TaskDocument = {
    id,
    userId,
    title: input.title,
    description: input.description,
    completed: input.completed,
    createdAt: now,
    updatedAt: now
  };

  await collection.insertOne(doc);
  return toTask(doc);
}

export async function updateTask(
  userId: string,
  id: string,
  input: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<Task | undefined> {
  const collection = await tasks();
  const now = new Date();

  const result = await collection.findOneAndUpdate(
    { userId, id },
    {
      $set: {
        title: input.title,
        description: input.description,
        completed: input.completed,
        updatedAt: now
      }
    },
    { returnDocument: "after", projection: { _id: 0 } }
  );

  // Handle both old and new MongoDB driver versions
  const doc = result.value || result;
  return doc && typeof doc === 'object' && 'id' in doc ? toTask(doc as TaskDocument) : undefined;
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const collection = await tasks();
  const res = await collection.deleteOne({ userId, id });
  return res.deletedCount === 1;
}
