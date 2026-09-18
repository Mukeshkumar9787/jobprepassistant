# Production Deployment Guide 🚀

This document details how to deploy the **AI Interview Prep Kit** platform to cloud providers (Vercel, Render, MongoDB Atlas, and Docker).

---

## 🛠️ Architecture & Deployment Overview

```
                           +--------------------------------+
                           |  Next.js 15 Frontend (Vercel) |
                           +---------------+----------------+
                                           | HTTP / SSE
                                           v
                           +--------------------------------+
                           |   Express.js API (Render/Docker)|
                           +-------+----------------+-------+
                                   |                |
                                   v                v
                        +------------------+  +-------------------+
                        | MongoDB Atlas DB |  |  Gemini AI API    |
                        +------------------+  +-------------------+
```

---

## Option 1: One-Command Docker Compose (Local or VPS)

To spin up MongoDB, Express API, and Next.js frontend together:

```bash
# 1. Clone repository
git clone <repository-url>
cd jobprepassistant

# 2. Set environment variables
export GEMINI_API_KEY="your_gemini_api_key"
export JWT_SECRET="your_production_jwt_secret"

# 3. Build & start all containers
docker compose up -d --build
```

Access points:
- **Frontend UI**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **MongoDB**: mongodb://localhost:27017

---

## Option 2: Managed Cloud Deployment (Vercel + Render + MongoDB Atlas)

### 1. Database: MongoDB Atlas Setup
1. Create a free/paid cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and record password.
3. Under **Network Access**, add `0.0.0.0/0` (or specific cloud provider IPs).
4. Copy your Connection String (`mongodb+srv://<user>:<password>@cluster.mongodb.net/jobprep?retryWrites=true&w=majority`).

---

### 2. Backend API: Render.com
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `.` (monorepo root)
   - **Build Command**: `npm install && npm run build --workspace=@jobprep/shared && npm run build --workspace=@jobprep/api`
   - **Start Command**: `node apps/api/dist/index.js`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3001`
   - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
   - `JWT_SECRET`: `<random-secret-key>`
   - `GEMINI_API_KEY`: `<your-gemini-api-key>`
5. Deploy service and copy your API domain (e.g., `https://prepkit-api.onrender.com`).

---

### 3. Frontend: Vercel Setup
1. Import project into [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to `Next.js`.
4. Configure Build Settings:
   - **Build Command**: `cd ../.. && npm run build --workspace=@jobprep/shared && npm run build --workspace=@jobprep/web`
   - **Output Directory**: `.next`
5. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://prepkit-api.onrender.com/api`
6. Deploy project.

---

## 🔒 Production Environment Variables Checklist

| Variable Name | Required | Description | Example / Note |
|---|---|---|---|
| `PORT` | Yes | API server port | `3001` |
| `NODE_ENV` | Yes | Environment mode | `production` |
| `MONGODB_URI` | Yes | MongoDB Connection string | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `JWT_SECRET` | Yes | Secret key for signing JWTs | High-entropy string (min 32 chars) |
| `JWT_EXPIRES_IN` | Optional | JWT duration | `7d` |
| `GEMINI_API_KEY` | Yes | Google Generative AI API Key | From Google AI Studio |
| `GEMINI_MODEL` | Optional | LLM model selection | `gemini-2.5-flash` |
| `NEXT_PUBLIC_API_URL` | Yes (Web) | Public API base URL for frontend | `https://api.yourdomain.com/api` |
