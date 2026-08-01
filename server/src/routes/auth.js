const express = require('express');
const { register, login, loginWithGoogle, getCurrentUser } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
