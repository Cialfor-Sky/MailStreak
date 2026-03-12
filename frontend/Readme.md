# React

A modern React-based project utilizing the latest frontend technologies and tools for building responsive web applications.

## Features

- React 18
- Vite
- Redux Toolkit
- TailwindCSS
- React Router v6
- Data visualization with D3.js and Recharts
- Form management with React Hook Form
- Animation with Framer Motion
- Testing with Jest and React Testing Library

## Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

## Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Project Structure

```
react_app/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── styles/         # Global styles and Tailwind configuration
│   ├── App.jsx         # Main application component
│   ├── Routes.jsx      # Application routes
│   └── index.jsx       # Application entry point
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── vite.config.js      # Vite configuration
```

## Adding Routes

To add new routes to the application, update the `Routes.jsx` file:

```jsx
import { useRoutes } from "react-router-dom";
import HomePage from "pages/HomePage";
import AboutPage from "pages/AboutPage";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "/about", element: <AboutPage /> },
    // Add more routes as needed
  ]);

  return element;
};
```

## Styling

This project uses Tailwind CSS for styling. The configuration includes:

- Forms plugin for form styling
- Typography plugin for text styling
- Aspect ratio plugin for responsive elements
- Container queries for component-specific responsive design
- Fluid typography for responsive text
- Animation utilities

## Responsive Design

The app is built with responsive design using Tailwind CSS breakpoints.

## Deployment

Build the application for production:

```bash
npm run build
```

## Backend (MailStreak)

This repo includes a Node.js backend in `backend_py/` that powers authentication, email scanning, progress streaming, and the alerts feed.

**How it works**
1. `POST /auth/login` issues a JWT for the super admin account.
2. Protected endpoints require `Authorization: Bearer <token>`.
3. `POST /scan-email` starts an asynchronous scan and returns a `scan_id`.
4. `GET /scan-email/stream/:scanId` streams progress updates via Server-Sent Events (SSE).
5. `GET /scan-email/:scanId` provides polling-based status if needed.
6. `GET /alerts` returns stored alerts (supports `limit` and `severity` query params).
7. `POST /alerts` allows ingesting alerts into the feed.

**Authentication**
- Super Admin credentials are fixed:
  - Email: `admin@mailstreak`
  - Password: `mailstreak`
- Only this account is accepted unless additional users are added later.
- Passwords are verified via a one-way hash (no plaintext storage).

**OpenAI integration**
- Email content is analyzed server-side with OpenAI.
- The OpenAI API key is never exposed to the frontend.
- Configure the key in `backend_py/.env` (see `backend_py/.env.example`).

**Persistent storage (SQLite)**
- The backend stores scans and alerts in SQLite.
- Default location: `backend_py/data/mailstreak.db`
- Override with `DB_PATH` in `backend_py/.env`.
- Schema source: `backend_py/schema.sql`

**Database schema**
```sql
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  stage TEXT,
  subject TEXT,
  content TEXT,
  metadata_json TEXT,
  result_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  scan_id TEXT,
  severity TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  description TEXT NOT NULL,
  email_id TEXT,
  risk_score INTEGER,
  classification TEXT,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
```

**Run locally**
1. Install backend dependencies:
   ```bash
   cd backend_py
   npm install
   ```
2. Create `backend_py/.env` from `backend_py/.env.example` and set `JWT_SECRET` and `OPENAI_API_KEY`.
3. Start the backend server:
   ```bash
   npm run dev
   ```
4. Start the frontend in another terminal:
   ```bash
   npm start
   ```

The frontend expects the backend at `http://127.0.0.1:8000`.

## Acknowledgments

- Built with Rocket.new
- Powered by React and Vite
- Styled with Tailwind CSS
