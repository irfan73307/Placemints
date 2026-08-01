const express = require('express');
const { getCompanies, getCompanyById } = require('../controllers/companyController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getCompanies);
router.get('/:id', optionalAuth, getCompanyById);

module.exports = router;
