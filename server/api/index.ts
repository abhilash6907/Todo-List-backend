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
  try {
    await connectDB();
    // Pass request to Express app
    app(req as any, res as any);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
