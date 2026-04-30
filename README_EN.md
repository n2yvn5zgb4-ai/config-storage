# Remote Storage & Subscription Service

English | [简体中文](./README.md)

A companion project for RayBoxUI, providing configuration storage and subscription service based on Cloudflare Workers and KV database.

## Download RayBoxUI
[![Download on the App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/us/app/rayboxui/id6751304782)

## Deployment

Click the button below to deploy to Cloudflare Workers with one click:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jekylor/Remote-Storage-Subscription)

### Configuration Guide

After clicking the deploy button, you will see the Cloudflare Workers configuration page. Please fill in the fields as follows:

#### 1. Account Settings
- **Account** - Select your Cloudflare account (register first if you don't have one)

#### 2. Create KV Namespace
Before deployment, you need to create a KV namespace:

1. Click **Create a namespace**
2. Enter namespace name: `config-storage`

#### 3. Environment Variables

In the **Environment Variables** section of the configuration page, add the following variable:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `SECRET` | `your-secret-key-here` | Secret key for generating and verifying tokens. Use a strong password |

#### 4. Complete Deployment

After filling in all fields, click the **Deploy** button and wait for deployment to complete.

After successful deployment, you will get a Worker URL like:
```
https://config-storage.your-subdomain.workers.dev
```

### Test Deployment

Test the deployment using the health check endpoint:

```bash
# First generate the health check token
# token = SHA256("health-check" + "your-secret-key")

curl "https://config-storage.your-subdomain.workers.dev/?token=<your-health-check-token>"
```

If it returns `{"status":"ok","service":"config-storage"}`, the deployment is successful!

## API Documentation

### Authentication

All endpoints require a valid token.

**Token Generation:**
```
token = SHA256(id + secret)
```

Where:
- `id` is the configuration UUID (health check uses the fixed value `health-check`)
- `secret` is the server-side secret key stored in the `SECRET` environment variable

### 1. Health Check

```
GET /?token={token}
```

Or use Authorization header:
```
GET /
Authorization: Bearer {token}
```

**Note:** Health check uses the fixed ID `health-check` to generate token:
```
token = SHA256("health-check" + secret)
```

**Response (Success):**
```json
{
  "status": "ok",
  "service": "config-storage"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Missing token"
}
```
or
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### 2. Create or Update Configuration

```
POST /api/config
Content-Type: application/json

{
  "uuid": "config-id",
  "token": "sha256-token",
  "name": "Configuration Name",
  "config": { ... }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Configuration created",
  "data": {
    "id": "config-id",
    "name": "Configuration Name",
    "config": { ... },
    "createdAt": "2025-10-20T12:00:00.000Z",
    "updatedAt": "2025-10-20T12:00:00.000Z",
    "subscriptions": []
  }
}
```

### 3. Get Configuration

```
GET /api/config/{uuid}
```

**Response (Success):** Returns the config object directly
```json
{
  // Configuration object content
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Configuration not found"
}
```

### 4. Delete Configuration

```
DELETE /api/config/{uuid}?token={token}
```

Or use Authorization header:
```
DELETE /api/config/{uuid}
Authorization: Bearer {token}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Configuration deleted"
}
```

## Development Guide

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The server will start at `http://127.0.0.1:8787`.

### Run Tests

```bash
npm test
```

### Configure Environment Variables

Edit the `wrangler.jsonc` file to set the `SECRET` environment variable:

```jsonc
{
  "vars": {
    "SECRET": "your-secret-key-here"
  }
}
```

### Create KV Namespace

```bash
npx wrangler kv:namespace create "config-storage"
npx wrangler kv:namespace create "config-storage" --preview
```

### Deploy

```bash
npm run deploy
```

