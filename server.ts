import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* =========================
   DynamoDB Configuration
========================= */

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("❌ AWS credentials missing in Vercel environment variables");
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE!;
const APPLICATIONS_TABLE = process.env.APPLICATIONS_TABLE!;

/* =========================
   Start Server
========================= */

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  /* =========================
     AUTH REGISTER
  ========================= */
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if user exists
      const existingUser = await docClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { email },
        })
      );

      if (existingUser.Item) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await docClient.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: {
            email,
            password: hashedPassword,
            role: role || "user",
            createdAt: new Date().toISOString(),
          },
        })
      );

      res.json({ email, role: role || "user" });
    } catch (err: any) {
      console.error("Register Error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  /* =========================
     AUTH LOGIN
  ========================= */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await docClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { email },
        })
      );

      const user = result.Item;

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        email: user.email,
        role: user.role,
      });
    } catch (err: any) {
      console.error("Login Error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /* =========================
     GET APPLICATIONS
  ========================= */
  app.get("/api/applications", async (req, res) => {
    try {
      const result = await docClient.send(
        new ScanCommand({
          TableName: APPLICATIONS_TABLE,
        })
      );

      const apps = result.Items || [];

      apps.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      res.json(apps);
    } catch (err: any) {
      console.error("Fetch Applications Error:", err);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  /* =========================
     CREATE APPLICATION
  ========================= */
  app.post("/api/applications", async (req, res) => {
    try {
      const { userId, ownerName, businessName, businessType, address } =
        req.body;

      const id = uuidv4();

      await docClient.send(
        new PutCommand({
          TableName: APPLICATIONS_TABLE,
          Item: {
            id,
            userId,
            ownerName,
            businessName,
            businessType,
            address,
            status: "Pending",
            createdAt: new Date().toISOString(),
          },
        })
      );

      res.json({ id, status: "Pending" });
    } catch (err: any) {
      console.error("Create Application Error:", err);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  /* =========================
     UPDATE APPLICATION STATUS
  ========================= */
  app.put("/api/applications/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await docClient.send(
        new UpdateCommand({
          TableName: APPLICATIONS_TABLE,
          Key: { id },
          UpdateExpression: "set #status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": status,
          },
        })
      );

      res.json({ success: true });
    } catch (err: any) {
      console.error("Update Application Status Error:", err);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  /* =========================
     VITE MIDDLEWARE
  ========================= */
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();