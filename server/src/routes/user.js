const express = require('express');
const { getSavedCompanies, toggleSaveCompany, updateProfile, changePassword } = require('../controllers/userController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me/saved', requireAuth, getSavedCompanies);
router.post('/me/saved/:companyId', requireAuth, toggleSaveCompany);
router.patch('/me', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;
