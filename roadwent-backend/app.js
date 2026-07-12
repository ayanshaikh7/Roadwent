// backend/app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const connectDB = require('./config/db');
const MongoStore = require('connect-mongo');

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const estimatorRoutes = require('./routes/estimators');
const estimateRoutes = require('./routes/estimates');

// Connect to MongoDB
connectDB();

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configure CORS for dev/prod
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session setup allows Passport to store user info between requests
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
// Trust proxy for secure cookies on platforms like Render/Heroku/Vercel
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport configuration
require('./config/passport');

// Health check endpoint (non-breaking)
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// --- Routes ---
// Auth routes (login, register, etc.)
app.use('/auth', authRoutes);
// Report routes
app.use('/api/reports', reportRoutes);
// Estimator routes
app.use('/api/estimators', estimatorRoutes);
// Estimate routes
app.use('/api/estimates', estimateRoutes);

// 1. The route to start the Google login process
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. The callback route that Google redirects to after login
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
  (req, res) => {
    // Successful authentication, redirect to the frontend estimator page.
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    res.redirect(`${origin}/project-details`);
  }
);

// Optional explicit failure route to send users back to frontend login page
app.get('/auth/google/failure', (_req, res) => {
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  res.redirect(`${origin}/login`);
});

// 3. A simple route to check if the user is logged in
app.get('/api/current_user', (req, res) => {
  res.send(req.user);
});

// Alias for frontend compatibility
app.get('/auth/current-user', (req, res) => {
  res.send({ user: req.user || null });
});

// 4. Logout route
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    res.redirect(`${origin}/`);
  });
});

// Export the Express app (Vercel serverless will use this as the handler)
module.exports = app;
