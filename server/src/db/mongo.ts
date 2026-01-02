import { MongoClient } from "mongodb";
import type { Collection } from "mongodb";

type TaskDbDocument = {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserDbDocument = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

let client: MongoClient | null = null;

export async function connectToMongo(): Promise<MongoClient> {
  if (client) return client;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Create server/.env and set MONGODB_URI=your_connection_string"
    );
  }

  // Workaround for Node.js SSL issues with MongoDB Atlas on Windows
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  
  console.log("Connecting to MongoDB...");
  await client.connect();
  console.log("✅ Connected to MongoDB successfully!");

  const dbName = process.env.MONGODB_DB ?? "todo";
  const db = client.db(dbName);

  const tasks = db.collection<TaskDbDocument>("tasks");
  await tasks.createIndex({ id: 1 }, { unique: true });
  await tasks.createIndex({ userId: 1, createdAt: -1 });

  const users = db.collection<UserDbDocument>("users");
  await users.createIndex({ email: 1 }, { unique: true });

  return client;
}

export async function getTasksCollection(): Promise<Collection<TaskDbDocument>> {
  await connectToMongo();

  const dbName = process.env.MONGODB_DB ?? "todo";
  const db = client!.db(dbName);
  return db.collection<TaskDbDocument>("tasks");
}

export async function getUsersCollection(): Promise<Collection<UserDbDocument>> {
  await connectToMongo();

  const dbName = process.env.MONGODB_DB ?? "todo";
  const db = client!.db(dbName);
  return db.collection<UserDbDocument>("users");
}
