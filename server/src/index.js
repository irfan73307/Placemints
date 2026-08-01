const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/companies');
const questionRoutes = require('./routes/questions');
const libraryRoutes = require('./routes/library');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/users', userRoutes);
app.use('/api', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Placemints API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Placemints API Server running on http://0.0.0.0:${PORT}`);
});
