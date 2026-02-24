import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    // ===============================
    // GET - Fetch user applications
    // ===============================
    if (req.method === 'GET') {
      const command = new QueryCommand({
        TableName: 'Applications',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': { S: userId },
        },
      });

      const data = await client.send(command);

      const items =
        data.Items?.map((item) => ({
          id: item.id?.S,
          userId: item.userId?.S,
          data: item.data?.S ? JSON.parse(item.data.S) : null,
          status: item.status?.S,
          createdAt: item.createdAt?.S,
        })) || [];

      return res.status(200).json(items);
    }

    // ===============================
    // POST - Create new application
    // ===============================
    if (req.method === 'POST') {
      const body = req.body;

      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Missing application data' });
      }

      const id = uuidv4();

      const command = new PutItemCommand({
        TableName: 'Applications',
        Item: {
          userId: { S: userId }, // Partition Key
          id: { S: id },         // Sort Key
          data: { S: JSON.stringify(body) },
          status: { S: 'pending' },
          createdAt: { S: new Date().toISOString() },
        },
      });

      await client.send(command);

      return res.status(201).json({
        id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('DynamoDB Error:', error);
    return res.status(500).json({ error: error.message });
  }
}