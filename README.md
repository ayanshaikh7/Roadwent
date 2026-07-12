# Roadwent

**Roadwent** is a full-stack web application for preparing **road & civil construction cost estimates** based on a government **Schedule of Rates (SSR)** sheet. Users select work items from the SSR, enter quantities, optionally override rates, and generate a professional, itemized estimate report — complete with grand totals expressed in the Indian numbering system (Lakh/Crore) and export to **PDF** and **Excel**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Backend setup](#2-backend-setup)
  - [3. Frontend setup](#3-frontend-setup)
  - [4. Run the app](#4-run-the-app)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Application Flow](#application-flow)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

- 📊 **SSR-driven estimator** — loads a Schedule of Rates spreadsheet (`ssr_sheet.xlsx`), grouped and searchable by work item.
- ✏️ **Editable rates** — use the official SSR rate or override with a custom rate per item; selections are tracked.
- 🧮 **Automatic totals** — line totals and a grand total, with the amount rendered in words using the **Indian numbering system** (Rupees, Lakh, Crore, Paise).
- 👤 **Authentication** — email/password (local) and **Google OAuth 2.0** via Passport, with session persistence.
- 💾 **Save & manage reports** — persist estimates as reports (draft / submitted / approved / rejected) tied to the logged-in user.
- 📄 **Export** — download professional reports as **PDF** (jsPDF + autotable) and **Excel** (SheetJS/xlsx).
- 🔒 **Protected routes** — estimator and report pages require authentication.
- 🎨 **Responsive UI** — React + Tailwind CSS, with light/dark theme context and toast notifications.

---

## Tech Stack

### Frontend (`roadwent-frontend`)
| Concern | Technology |
| --- | --- |
| Framework | React 19 (Create React App / `react-scripts`) |
| Routing | React Router DOM 7 |
| HTTP client | Axios (with credentials for session cookies) |
| Styling | Tailwind CSS |
| Spreadsheet parsing | SheetJS (`xlsx`) |
| PDF generation | jsPDF + jsPDF-AutoTable |
| Testing | React Testing Library / Jest |

### Backend (`roadwent-backend`)
| Concern | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | Passport (Local + Google OAuth 2.0) |
| Sessions | express-session + connect-mongo (MongoDB session store) |
| Password hashing | bcryptjs |
| Config | dotenv |
| CORS | cors |

---

## Project Structure

```
Roadwent/
├── roadwent-backend/            # Express + MongoDB API
│   ├── app.js                   # Express app (used by Vercel serverless)
│   ├── server.js                # Local dev entrypoint (app.listen)
│   ├── config/
│   │   ├── db.js                # Mongoose connection
│   │   └── passport.js          # Local + Google strategies
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Estimate.js
│   │   ├── Estimator.js
│   │   └── Report.js
│   ├── routes/                  # Express routers
│   │   ├── auth.js              # /auth
│   │   ├── estimates.js         # /api/estimates
│   │   ├── estimators.js        # /api/estimators
│   │   └── reports.js           # /api/reports
│   ├── .env.example
│   └── vercel.json              # Vercel serverless config
│
└── roadwent-frontend/           # React SPA
    ├── public/
    │   └── data/ssr_sheet.xlsx  # Schedule of Rates source data
    └── src/
        ├── App.js               # Routes & layout
        ├── pages/               # Home, Login, Signup, ProjectDetails,
        │                        # ClientDetails, Estimator, Report, Help, Contact
        ├── Components/          # Navbar, ProtectedRoute, ProfessionalReportView
        ├── Context/             # AuthContext, ThemeContext
        └── services/            # estimatorService, reportService (Axios)
```

> **Note:** `server.js` is used for local development; `app.js` exports the Express app for Vercel's serverless deployment. Keep environment/CORS logic consistent between the two.

---

## Architecture Overview

```
┌─────────────────────┐        cookies / JSON        ┌──────────────────────┐
│   React SPA (CRA)   │  ─────────────────────────▶  │   Express API        │
│   localhost:3000    │  ◀─────────────────────────  │   localhost:5001     │
│   Axios (withCreds) │                               │   Passport sessions  │
└─────────────────────┘                               └──────────┬───────────┘
        │                                                        │
        │ reads SSR sheet from /public/data/ssr_sheet.xlsx       │ Mongoose
        ▼                                                        ▼
   in-browser xlsx parsing                                ┌────────────────┐
   + PDF/Excel export                                     │    MongoDB     │
                                                          │ users, reports │
                                                          │   sessions     │
                                                          └────────────────┘
```

---

## Prerequisites

- **Node.js** ≥ 18 and npm
- **MongoDB** — a local instance or a MongoDB Atlas connection string
- (Optional) **Google Cloud OAuth credentials** if you want Google sign-in

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url> Roadwent
cd Roadwent
```

### 2. Backend setup

```bash
cd roadwent-backend
npm install
cp .env.example .env      # then fill in the values (see below)
```

Edit `roadwent-backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/roadwent
SESSION_SECRET=replace-with-a-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NODE_ENV=development
# Optional overrides
# PORT=5001
# FRONTEND_ORIGIN=http://localhost:3000
```

### 3. Frontend setup

```bash
cd ../roadwent-frontend
npm install
```

By default the frontend talks to `http://localhost:5001`. To point it elsewhere, create `roadwent-frontend/.env`:

```env
REACT_APP_API_BASE=http://localhost:5001
```

### 4. Run the app

Open **two terminals**:

**Terminal 1 — backend**
```bash
cd roadwent-backend
npm run dev        # nodemon (auto-reload)   — or:  npm start
```
> Backend runs at **http://localhost:5001**

**Terminal 2 — frontend**
```bash
cd roadwent-frontend
npm start
```
> Frontend runs at **http://localhost:3000** and opens automatically.

---

## Environment Variables

### Backend (`roadwent-backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string (also used for the session store) |
| `SESSION_SECRET` | ✅ | Secret used to sign the session cookie |
| `GOOGLE_CLIENT_ID` | For Google login | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | For Google login | Google OAuth 2.0 client secret |
| `NODE_ENV` | — | `development` or `production` (enables secure cross-site cookies + `trust proxy` in prod) |
| `PORT` | — | Backend port (default `5001`) |
| `FRONTEND_ORIGIN` | — | Allowed CORS origin / OAuth redirect target (default `http://localhost:3000`) |

### Frontend (`roadwent-frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `REACT_APP_API_BASE` | — | Base URL of the backend API (default `http://localhost:5001`) |

> Google OAuth callback URL to register in the Google Cloud console: `<backend-url>/auth/google/callback` (e.g. `http://localhost:5001/auth/google/callback`).

---

## Available Scripts

### Backend
| Command | Description |
| --- | --- |
| `npm start` | Start the server with Node (`server.js`) |
| `npm run dev` | Start with nodemon (auto-reload on changes) |

### Frontend
| Command | Description |
| --- | --- |
| `npm start` | Run the CRA dev server |
| `npm run build` | Production build to `build/` |
| `npm test` | Run tests in watch mode |

---

## Application Flow

1. **Home** (`/`) → user lands on the marketing/landing page.
2. **Sign up / Log in** (`/signup`, `/login`) → local email+password or Google OAuth.
3. **Project details** (`/project-details`) → capture project metadata.
4. **Client details** (`/client-details`) → capture client information.
5. **Estimator** (`/estimator`, protected) → the SSR sheet loads; search/select items, enter quantities, adjust rates, and the grand total is computed (with an amount-in-words rendering).
6. **Report** (`/report`, protected) → view the professional report, save it to the backend, and export to PDF/Excel.
7. **Help / Contact** (`/help`, `/contact`) → supporting pages.

---

## API Reference

Base URL: `http://localhost:5001`

### Auth (`/auth`)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a new user (name, email, password) |
| POST | `/auth/login` | Public | Log in with email + password |
| GET | `/auth/current-user` | Session | Get the currently logged-in user |
| GET | `/auth/logout` | Session | Log out |
| GET | `/auth/google` | Public | Begin Google OAuth flow |
| GET | `/auth/google/callback` | — | Google OAuth callback (redirects to frontend) |

### Reports (`/api/reports`) — all require authentication
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/reports` | List the current user's reports |
| GET | `/api/reports/:id` | Get a report by ID |
| POST | `/api/reports` | Create a report |
| PUT | `/api/reports/:id` | Update a report |
| DELETE | `/api/reports/:id` | Delete a report |

### Estimators (`/api/estimators`) & Estimates (`/api/estimates`) — require authentication
Standard CRUD endpoints for stored estimator/estimate records (see `routes/estimators.js` and `routes/estimates.js`).

### Health
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Health check (`{ ok: true }`) |

---

## Data Models

- **User** — `name`, `email` (unique), `password` (bcrypt-hashed), `googleId`, `createdAt`. Includes a `comparePassword` method.
- **Report** — `title`, `description`, `user`, `projectName`, `estimatedCost`, `estimatedTime`, `status`, plus full report content (`projectDetails`, `clientDetails`, `items`, `searchResults`, `inputData`, `editableRates`, `rateSelection`, `grandTotalCost`, `grandTotalInWords`).
- **Estimate** — `title`, `user`, `projectName`, `estimatedCost`, `estimatedTime`, `details`, `status`.
- **Estimator** — road-specific fields: `projectName`, `clientName`, `roadType`, `roadLength`, `roadWidth`, `materials`, `laborCost`, `equipmentCost`, `totalCost`, `estimatedTime`, `notes`.

`status` values across models: `draft` | `submitted` | `approved` | `rejected`.

---

## Deployment

The backend ships with a `vercel.json` that routes all traffic through `app.js` as a Vercel serverless function.

Checklist for production:

- Set `NODE_ENV=production` (enables secure, `SameSite=None` cookies and `trust proxy`).
- Configure all backend environment variables in your hosting provider.
- Set `FRONTEND_ORIGIN` to your deployed frontend URL (required for CORS + cookie auth to work cross-site).
- Update the Google OAuth **Authorized redirect URI** to `<backend-url>/auth/google/callback`.
- Build the frontend (`npm run build`) and deploy the static `build/` output; set `REACT_APP_API_BASE` to the deployed backend URL at build time.

> Because auth relies on cross-site session cookies, the backend and frontend must both be served over **HTTPS** in production, and `FRONTEND_ORIGIN` must exactly match the frontend origin.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `MongoDB connection error` on startup | `MONGODB_URI` missing/invalid, or MongoDB not running |
| Logged in but requests return `401` | Cookies not being sent — ensure Axios uses `withCredentials` (it does by default here) and `FRONTEND_ORIGIN` matches the frontend origin exactly |
| CORS errors in the browser | `FRONTEND_ORIGIN` doesn't match the frontend URL |
| Google login redirect fails | Callback URL not registered in Google Cloud, or `GOOGLE_CLIENT_ID`/`SECRET` missing |
| SSR sheet not loading | Confirm `roadwent-frontend/public/data/ssr_sheet.xlsx` exists |
| Cookies rejected in production | Ensure HTTPS and `NODE_ENV=production` on the backend |

---

## License

This project is currently unlicensed / proprietary. Add a `LICENSE` file if you intend to open-source it.
