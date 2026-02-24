import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch applications by userId
      const cmd = new QueryCommand({
        TableName: 'Applications',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': { S: userId },
        },
      });
      const data = await client.send(cmd);
      return res.status(200).json(data.Items || []);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Missing application data' });
      }

      const id = uuidv4(); // unique application id
      const putCmd = new PutItemCommand({
        TableName: 'Applications',
        Item: {
          id: { S: id },
          userId: { S: userId },
          data: { S: JSON.stringify(body) },
          createdAt: { S: new Date().toISOString() },
        },
      });
      await client.send(putCmd);
      return res.status(201).json({ id, ...body });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}