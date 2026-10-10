# MEMORA — Event & Memory Calendar
> *"Every Date Has a Story."*

MEMORA is an aesthetic, scrapbook-style calendar application where users can record memories for any date, attach photos, write heartfelt captions, and revisit their moments through a monthly interactive calendar, polaroid photo gallery, and upcoming events dashboard.

---

## Architecture Overview (Phase 1)

This project follows a clean **MERN** architecture with separate `client` and `server` applications:

```text
Event Manager Calender/
├── .gitignore                    # Root Git ignore
├── README.md                     # Comprehensive documentation & setup guide
├── server/                       # Backend (Node.js + Express + Mongoose ES Modules)
│   ├── .env                      # Local environment configuration
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Server Git ignore
│   ├── package.json              # Server dependencies and scripts
│   ├── package-lock.json
│   └── src/
│       ├── config/
│       │   └── db.js             # Resilient MongoDB connection handler
│       ├── middleware/
│       │   └── errorMiddleware.js# Standardized 404 and global error handler
│       └── server.js             # Express application entry, CORS, health check
└── client/                       # Frontend (React 18 + Vite + JavaScript)
    ├── .env                      # Client local environment configuration
    ├── .env.example              # Client environment variables template
    ├── .gitignore                # Client Git ignore
    ├── index.html                # HTML entry with scrapbook typography
    ├── package.json              # Client dependencies and scripts
    ├── package-lock.json
    ├── vite.config.js            # Vite bundler configuration
    └── src/
        ├── api/
        │   └── axiosClient.js    # Axios client with baseURL and token interceptor
        ├── styles/
        │   ├── variables.css     # Scrapbook color palette & shadow variables
        │   └── global.css        # Global CSS resets and aesthetic typography
        ├── App.css               # Setup & health check styles
        ├── App.jsx               # Phase 1 diagnostic & connectivity UI
        └── main.jsx              # React DOM render entry
```

---

## Tech Stack (Phase 1 Foundations)

- **Backend**:
  - Node.js (`v24.x`)
  - Express.js (`4.21.x`) with JavaScript ES Modules (`"type": "module"`)
  - Mongoose (`8.9.x`) for MongoDB ODM
  - CORS, Dotenv, Bcryptjs, Jsonwebtoken, Multer, Cloudinary
  - Nodemon for hot-reloading development
- **Frontend**:
  - React 18 + Vite (`6.x`)
  - Axios for HTTP communication
  - `date-fns` for future calendar date manipulations
  - `lucide-react` for UI icons
  - Custom Vanilla CSS with CSS Custom Properties (Scrapbook theme: lavender, blush pink, warm cream, muted purple)

---

## Prerequisites

- **Node.js**: v18+ (tested on Node v24.4.1)
- **npm**: v9+ (tested on npm 11.7.0)
- **MongoDB**: A running local MongoDB Community Server (default on `localhost:27017`) OR a free cloud cluster on MongoDB Atlas.

---

## Environment Setup

### 1. Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:

```env
PORT=5000
NODE_ENV=development

# Option A: Local MongoDB (Default)
MONGO_URI=mongodb://127.0.0.1:27017/memora_db

# Option B: MongoDB Atlas (Alternative cloud connection)
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/memora_db?retryWrites=true&w=majority

# Auth & Uploads (Used in subsequent phases)
JWT_SECRET=memora_super_secret_jwt_key_2026_dev_secure
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend Origin for CORS
CLIENT_URL=http://localhost:5173
```

### 2. Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Applications

### Starting Backend Independently

```powershell
cd "d:\all projects\Event Manager Calender\server"
npm run dev
```
- Server starts at: `http://localhost:5000`
- Production mode command: `npm start`

### Starting Frontend Independently

```powershell
cd "d:\all projects\Event Manager Calender\client"
npm run dev
```
- Client starts at: `http://localhost:5173`
- Production build command: `npm run build`
- Production preview: `npm run preview`

---

## Verification & Available Health Checks

1. **Backend Health Check (`GET /api/health`)**:
   - URL: `http://localhost:5000/api/health`
   - Response:
     ```json
     {
       "success": true,
       "message": "MEMORA API is healthy and operational.",
       "tagline": "Every Date Has a Story.",
       "timestamp": "2026-10-10T08:58:45.000Z",
       "environment": "development"
     }
     ```
2. **MongoDB Connection**:
   - On server launch, console displays: `[Database] MongoDB Connected: 127.0.0.1` (or your Atlas host).
   - If MongoDB is inactive, the connection handler logs a clear diagnostic warning without crashing the Express process.
3. **Frontend Connectivity Card**:
   - Opening `http://localhost:5173` immediately performs a live diagnostic ping to `http://localhost:5000/api/health` using `axiosClient` and confirms bidirectional CORS connectivity.
