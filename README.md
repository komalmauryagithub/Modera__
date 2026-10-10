# MEMORA — Event & Memory Calendar
> *"Every Date Has a Story."*

MEMORA is an aesthetic, scrapbook-style calendar web application where users can create events for any date, attach photos, write captions, and revisit their memories through an interactive monthly calendar, polaroid photo gallery, and upcoming events timeline dashboard.

---

## Architecture & Technology Stack

```text
Event Manager Calender/
├── .gitignore                          # Root Git ignore (secrets & build outputs)
├── README.md                           # Master Architecture, Setup & Deployment Guide
├── server/                             # Backend API (Node.js + Express ES Modules)
│   ├── .env.example                    # Backend environment configuration template
│   ├── .gitignore                      # Server Git ignore
│   ├── package.json                    # Server scripts and dependencies
│   ├── package-lock.json               # Locked dependency tree
│   ├── test_regression_master.js       # 39-assertion master automated test suite
│   └── src/
│       ├── config/
│       │   ├── db.js                   # Mongoose resilient database connector
│       │   └── cloudinary.js           # Cloudinary SDK credentials configuration
│       ├── controllers/
│       │   ├── authController.js       # Register, Login, Me profile controller
│       │   └── eventController.js      # CRUD, range, month, upcoming, and search logic
│       ├── middleware/
│       │   ├── authMiddleware.js       # Reusable JWT Bearer protection middleware
│       │   ├── errorMiddleware.js      # Standardized 404 & global error formatters
│       │   ├── rateLimiter.js          # IP rate limiter for auth endpoints
│       │   └── uploadMiddleware.js     # Multer memory storage & MIME validator (5MB)
│       ├── models/
│       │   ├── User.js                 # User Mongoose model with bcrypt pre-save hook
│       │   └── Event.js                # Event Mongoose model with owner ID & YYYY-MM-DD
│       ├── routes/
│       │   ├── authRoutes.js           # /api/auth routes
│       │   └── eventRoutes.js          # /api/events routes
│       ├── utils/
│       │   ├── cloudinaryHelper.js     # Memory buffer stream upload & safe destroy
│       │   ├── dateValidator.js        # Strict YYYY-MM-DD calendar date validator
│       │   └── generateToken.js        # Signed JWT utility
│       └── server.js                   # Express application entry, CORS & static handler
└── client/                             # Frontend (React 18 + Vite + JavaScript)
    ├── .env.example                    # Frontend environment configuration template
    ├── .gitignore                      # Client Git ignore
    ├── index.html                      # HTML entry with scrapbook Google fonts
    ├── package.json                    # Client scripts and dependencies
    ├── package-lock.json               # Locked dependency tree
    ├── vite.config.js                  # Vite bundler configuration
    ├── test_calendar_math.js           # Leap years & calendar matrix test suite
    └── src/
        ├── api/
        │   ├── axiosClient.js          # Axios client with Bearer interceptor & timeout
        │   ├── authApi.js              # Auth API calls
        │   └── eventApi.js             # Event CRUD and filter API calls
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx          # Reusable styled button with loader
        │   │   ├── Input.jsx           # Reusable input with password visibility toggle
        │   │   ├── Loader.jsx          # Scrapbook spinner component
        │   │   ├── ErrorMessage.jsx    # Dismissible alert banner
        │   │   ├── EmptyState.jsx      # Scrapbook empty state illustration
        │   │   ├── FilterBar.jsx       # Real-time search, category & date filter bar
        │   │   ├── ProtectedRoute.jsx  # Route guard with session preservation
        │   │   └── PublicRoute.jsx     # Guest-only route guard
        │   ├── layout/
        │   │   └── Navbar.jsx          # Responsive scrapbook nav with mobile drawer
        │   ├── calendar/
        │   │   ├── CalendarHeader.jsx  # Month title, Prev/Next, Today, New Event
        │   │   ├── CalendarGrid.jsx    # 7-column weekday matrix (date-fns)
        │   │   └── CalendarDayCell.jsx # Individual day cell with event chips & badges
        │   ├── events/
        │   │   └── EventModal.jsx      # View/Create/Edit polaroid modal with upload
        │   └── gallery/
        │       └── PolaroidCard.jsx    # Tilted scrapbook polaroid cards
        ├── context/
        │   └── AuthContext.jsx         # Context provider for user state & session sync
        ├── pages/
        │   ├── LoginPage.jsx           # Sign in page
        │   ├── RegisterPage.jsx        # Sign up page
        │   ├── CalendarPage.jsx        # Interactive monthly calendar
        │   ├── GalleryPage.jsx         # Visual polaroid memory gallery
        │   └── UpcomingPage.jsx        # Chronological timeline dashboard
        └── styles/
            ├── variables.css           # Scrapbook pastel palette & polaroid shadows
            ├── global.css              # Global styles, :focus-visible indicators
            ├── common.css              # Reusable component styles
            ├── navbar.css              # Navbar styles
            ├── auth.css                # Authentication card styles
            ├── calendar.css            # Monthly calendar & modal styles
            ├── gallery.css             # Polaroid grid & filter styles
            └── upcoming.css            # Upcoming timeline & countdown styles
```

---

## Production Deployment Guide

MEMORA can be deployed either with a **Decoupled Architecture** (recommended) or as a **Unified Service**:

### Option A: Decoupled Deployment (Recommended)
1. **Database**: MongoDB Atlas free M0 cluster.
2. **Backend**: Render / Railway / Fly.io (Node.js web service).
3. **Frontend**: Vercel / Netlify (Static SPA).

### Option B: Unified Full-Stack (Render / Railway / Docker)
The Express server in `server/src/server.js` automatically serves the compiled `client/dist` directory if present.

---

### Step-by-Step Deployment Instructions

#### 1. Database Setup (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user (e.g., `memora_admin`) with password.
3. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect** > **Drivers** > copy connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/memora_db?retryWrites=true&w=majority
   ```

#### 2. Photo Storage Setup (Cloudinary)
1. Sign up for a free account on [Cloudinary](https://cloudinary.com/).
2. From the dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.

#### 3. Backend Deployment (e.g. Render / Railway)
1. Connect your Git repository.
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node src/server.js` (or `npm start`)
5. Configure Environment Variables in the hosting dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default if injected by host)
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.../memora_db?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generated-random-32-char-secret-key>`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLOUDINARY_CLOUD_NAME`: `<your_cloud_name>`
   - `CLOUDINARY_API_KEY`: `<your_api_key>`
   - `CLOUDINARY_API_SECRET`: `<your_api_secret>`
   - `CLIENT_URL`: `https://your-memora-frontend.vercel.app` (comma-separated if multiple domains)

#### 4. Frontend Deployment (e.g. Vercel / Netlify)
1. Connect your Git repository.
2. Set **Root Directory**: `client`
3. Set **Framework Preset**: `Vite`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Configure Environment Variable:
   - `VITE_API_URL`: `https://your-memora-backend.onrender.com/api`

---

## Health Checks & Smoke Testing

### 1. Backend Health Check
- **URL**: `https://<backend-domain>/api/health`
- **Expected Status**: `200 OK`
- **Expected Response**:
  ```json
  {
    "success": true,
    "message": "MEMORA API is healthy and operational.",
    "tagline": "Every Date Has a Story.",
    "timestamp": "2026-10-10T...",
    "environment": "production"
  }
  ```

### 2. Frontend Smoke Test
1. Visit `https://<frontend-domain>/`.
2. App redirects unauthenticated visitor to `/login`.
3. Click "Create an Account" (`/register`), enter name, valid email, password, and sign up.
4. App automatically stores JWT, restores session, and loads `/` with the active Monthly Calendar.
5. Click any date on the calendar, add an event with title, caption, category, and an image.
6. Verify event card renders in calendar day cell.
7. Click "Gallery" in navigation: verify event card appears in tilted polaroid layout.
8. Click "Upcoming" in navigation: verify future event shows countdown badge.
9. Click "Logout": verifies token purging and redirect back to `/login`.

---

## Security & Reliability Architecture

- **Zero Secret Exposure**: `.env` files are ignored in Git. Frontend code uses only `VITE_API_URL`.
- **Password Protection**: Passwords hashed with bcrypt (salt rounds = 10) and stripped automatically via `toJSON` transform and query projections.
- **Rate Limiting**: `express-rate-limit` guards authentication routes (`POST /api/auth/register`, `POST /api/auth/login`) with `app.set('trust proxy', 1)`.
- **Upload Constraints**: Multer validates mimetypes (`image/jpeg`, `image/png`, `image/webp`) and enforces a 5MB maximum file size.
- **Cross-User Isolation**: Every database query and mutation strictly scopes by `user: req.user._id`.
- **ReDoS Protection**: Search queries escape special regex characters before evaluation.

---

## Rollback Guidance

If an issue occurs after deploying a new release:
1. **Frontend Rollback**:
   In Vercel or Netlify dashboard, navigate to **Deployments** > locate the previously passing deployment > click **Instant Rollback / Promote to Production**.
2. **Backend Rollback**:
   In Render or Railway dashboard, navigate to **Deployments** > select the previous successful commit deployment > click **Rollback**.
3. **Database Safeguard**:
   MongoDB Atlas maintains continuous cloud backups. Point-in-time restores are available via the Atlas dashboard under **Backup** > **Restore**.

---

## Local Development Commands

### Start Backend
```powershell
cd "d:\all projects\Event Manager Calender\server"
npm run dev
```

### Start Frontend
```powershell
cd "d:\all projects\Event Manager Calender\client"
npm run dev
```

### Run Master Regression Test Suite
```powershell
cd "d:\all projects\Event Manager Calender\server"
node -e "import('./src/server.js').then(async () => { const { exec } = await import('child_process'); exec('node test_regression_master.js', (err, stdout) => { console.log(stdout); process.exit(err ? 1 : 0); }); });"
```

### Run Production Build Check
```powershell
cd "d:\all projects\Event Manager Calender\client"
npm run build
```
