const express = require('express');
const {
  googleLogin,
  googleCallback,
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
  logout,
} = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/authenticate');

const router = express.Router();

router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
