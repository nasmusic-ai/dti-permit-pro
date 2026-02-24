# DTI Business Registration Portal - AWS Deployment Guide

This document outlines the architecture, deployment instructions, and code snippets for deploying the DTI Business Registration Portal to a fully serverless AWS environment.

## 1. Architecture Overview

The application is designed to be fully cloud-hosted and serverless, utilizing the following AWS services:

- **Frontend Hosting:** AWS Amplify (or Vercel) for hosting the React SPA.
- **Authentication:** Amazon Cognito for User and Admin registration/login.
- **API Layer:** Amazon API Gateway to route HTTP requests to Lambda functions.
- **Compute:** AWS Lambda for backend logic (Node.js).
- **Database:** Amazon DynamoDB for NoSQL data storage (Users, Applications).
- **Storage:** Amazon S3 for secure document uploads (IDs, Lease Contracts, Clearances).
- **Notifications:** Amazon SNS / SES for SMS and Email status updates.
- **Document Generation:** AWS Lambda (using `pdf-lib` or `puppeteer-core`) to generate PDF permits.

---

## 2. Folder Structure (AWS Serverless Application Model - SAM)

If you are using AWS SAM or Serverless Framework, your repository should look like this:

```text
/dti-business-portal
âââ /frontend                 # React/Vite application (The code built in this project)
â   âââ /src
â   âââ package.json
â   âââ vite.config.ts
âââ /backend                  # AWS Serverless Backend
â   âââ /functions
â   â   âââ /createApplication
â   â   â   âââ index.js
â   â   â   âââ package.json
â   â   âââ /updateStatus
â   â   â   âââ index.js
â   â   âââ /generatePdf
â   â   â   âââ index.js
â   â   âââ /getPresignedUrl  # For S3 uploads
â   â       âââ index.js
â   âââ template.yaml         # AWS SAM Template (Infrastructure as Code)
âââ AWS_DEPLOYMENT.md         # This file
```

---

## 3. AWS Configuration & Setup

### A. Amazon Cognito (Authentication)
1. Go to the AWS Cognito Console.
2. Create a **User Pool** named `dti-business-users`.
3. Configure sign-in options to use **Email**.
4. Create two App Clients: one for the Web App (Users) and one for the CMS (Admins).
5. Add custom attributes if necessary (e.g., `custom:role` to distinguish admins from regular users).

### B. Amazon DynamoDB (Database)
Create the following tables:
1. **Table Name:** `Applications`
   - **Partition Key:** `userId` (String)
   - **Sort Key:** `applicationId` (String)
   - **Global Secondary Index (GSI):** `status-index` (Partition Key: `status`, Sort Key: `createdAt`) for the Admin Dashboard to quickly query pending applications.

### C. Amazon S3 (Document Storage)
1. Create an S3 bucket named `dti-business-documents-[your-account-id]`.
2. **Block Public Access** (Keep it private).
3. Configure CORS to allow PUT requests from your frontend domain (Amplify/Vercel URL).
4. Use a Lambda function to generate **Pre-signed URLs** so the frontend can upload files directly to S3 securely.

---

## 4. Backend Code Snippets (AWS Lambda)

### Lambda: Generate S3 Pre-signed URL for Uploads
*This allows the frontend to upload files directly to S3 without passing them through API Gateway.*

```javascript
// backend/functions/getPresignedUrl/index.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ signatureVersion: 'v4' });

exports.handler = async (event) => {
  const { fileName, fileType, userId } = JSON.parse(event.body);
  const bucketName = process.env.BUCKET_NAME;
  const key = `uploads/${userId}/${Date.now()}-${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: 300, // URL expires in 5 minutes
    ContentType: fileType,
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ uploadUrl, key }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
```

### Lambda: Create Application (DynamoDB)

```javascript
// backend/functions/createApplication/index.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const data = JSON.parse(event.body);
  const applicationId = uuidv4();
  
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      userId: data.userId,
      applicationId: applicationId,
      ownerName: data.ownerName,
      businessName: data.businessName,
      businessType: data.businessType,
      address: data.address,
      documents: data.documentKeys, // Array of S3 keys
      status: 'Pending',
      createdAt: new Date().toISOString()
    }
  };

  try {
    await dynamodb.put(params).promise();
    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ applicationId, status: 'Pending' })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
```

### Lambda: Update Status & Send Notification (SES)

```javascript
// backend/functions/updateStatus/index.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

exports.handler = async (event) => {
  const { userId, applicationId, status, ownerEmail } = JSON.parse(event.body);

  const params = {
    TableName: process.env.TABLE_NAME,
    Key: { userId, applicationId },
    UpdateExpression: "set #status = :s",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":s": status },
    ReturnValues: "UPDATED_NEW"
  };

  try {
    await dynamodb.update(params).promise();

    // Send Email Notification
    const emailParams = {
      Destination: { ToAddresses: [ownerEmail] },
      Message: {
        Body: { Text: { Data: `Your DTI Business Application status is now: ${status}` } },
        Subject: { Data: "DTI Application Status Update" }
      },
      Source: "noreply@dti-portal.gov.ph"
    };
    await ses.sendEmail(emailParams).promise();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, status })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
```

---

## 5. Deployment Instructions

### Frontend (AWS Amplify)
1. Push your React/Vite code to a GitHub repository.
2. Go to the **AWS Amplify Console**.
3. Click **New app** -> **Host web app**.
4. Connect your GitHub repository and select the branch.
5. Amplify will automatically detect the Vite build settings (`npm run build`, output dir: `dist`).
6. Add Environment Variables in the Amplify console (e.g., `VITE_API_GATEWAY_URL`, `VITE_COGNITO_CLIENT_ID`).
7. Click **Save and deploy**.

### Backend (AWS SAM)
1. Install the AWS SAM CLI.
2. Navigate to the `/backend` directory.
3. Run `sam build`.
4. Run `sam deploy --guided`.
5. Follow the prompts to provision the API Gateway, Lambda functions, DynamoDB tables, and S3 buckets.
6. Note the output **API Gateway Endpoint URL** and update your frontend environment variables.

---

## 6. Secure Payment Integration Note
For integrating GCash, PayMaya, or Credit Cards, you should use a payment gateway provider like **PayMongo** or **Xendit** (popular in the Philippines).
1. The frontend calls a Lambda function to create a Payment Intent.
2. The Lambda function securely calls the PayMongo/Xendit API using a secret key stored in **AWS Secrets Manager**.
3. The Lambda returns a checkout URL to the frontend.
4. The user pays, and the payment gateway sends a Webhook to an API Gateway endpoint to update the application status in DynamoDB.
