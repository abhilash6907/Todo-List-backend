import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/index';
import { connectToMongo } from '../src/db/mongo';

// MongoDB connection state for serverless
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await connectToMongo();
    isConnected = true;
  }
}

// Serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
  await connectDB();
  return app(req as any, res as any);
};
