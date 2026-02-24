import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize DynamoDB Client
// In a real AWS environment, credentials would be picked up automatically.
// For local development, you might need to configure AWS credentials.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  // endpoint: "http://localhost:8000" // Uncomment for local DynamoDB
});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || "dti-users";
const APPLICATIONS_TABLE = process.env.APPLICATIONS_TABLE || "dti-applications";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, role } = req.body;
    const id = uuidv4();
    try {
      // Note: In a real app, use Cognito for auth. This is a simplified demo.
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          id,
          email,
          password, // In a real app, hash this!
          role: role || 'user'
        },
        ConditionExpression: "attribute_not_exists(email)" // Basic check, though DynamoDB doesn't natively enforce unique on non-keys easily without a separate table or using email as PK.
      }));
      res.json({ id, email, role: role || 'user' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      // In a real app, use Cognito. Here we scan for simplicity (NOT for production).
      // A better design would use email as the Partition Key.
      const result = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: "email = :email AND password = :password",
        ExpressionAttributeValues: {
          ":email": email,
          ":password": password
        }
      }));

      const user = result.Items?.[0];
      if (user) {
        res.json({ id: user.id, email: user.email, role: user.role });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/applications", async (req, res) => {
    const userId = req.query.userId as string;
    try {
      let apps;
      if (userId) {
        // Query using a GSI on userId, or scan if no GSI (scan used here for simplicity in demo)
        const result = await docClient.send(new ScanCommand({
          TableName: APPLICATIONS_TABLE,
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        }));
        apps = result.Items || [];
      } else {
        const result = await docClient.send(new ScanCommand({
          TableName: APPLICATIONS_TABLE
        }));
        apps = result.Items || [];
      }
      
      // Sort by createdAt descending
      apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(apps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/applications", async (req, res) => {
    const { userId, ownerName, businessName, businessType, address } = req.body;
    const id = uuidv4();
    try {
      await docClient.send(new PutCommand({
        TableName: APPLICATIONS_TABLE,
        Item: {
          id,
          userId,
          ownerName,
          businessName,
          businessType,
          address,
          status: 'Pending',
          createdAt: new Date().toISOString()
        }
      }));
      res.json({ id, status: 'Pending' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/applications/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await docClient.send(new UpdateCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { id },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": status
        }
      }));
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
