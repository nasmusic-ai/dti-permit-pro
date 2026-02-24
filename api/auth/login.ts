import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const cmd = new GetItemCommand({ TableName: 'Users', Key: { email: { S: email } } });
    const user = await client.send(cmd);

    if (!user.Item || user.Item.password.S !== password)
      return res.status(401).json({ error: 'Invalid email or password' });

    return res.status(200).json({ email: user.Item.email.S, role: user.Item.role.S });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}