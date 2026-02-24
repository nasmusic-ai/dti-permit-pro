import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    // Check if user exists
    const getCmd = new GetItemCommand({ TableName: 'Users', Key: { email: { S: email } } });
    const existing = await client.send(getCmd);
    if (existing.Item) return res.status(409).json({ error: 'User already exists' });

    // Create new user
    const putCmd = new PutItemCommand({
      TableName: 'Users',
      Item: {
        email: { S: email },
        password: { S: password }, // Use bcrypt in production
        role: { S: role || 'user' },
        createdAt: { S: new Date().toISOString() },
      },
    });
    await client.send(putCmd);

    return res.status(201).json({ email, role: role || 'user' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}