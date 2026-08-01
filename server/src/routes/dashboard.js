const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getDashboardData);

module.exports = router;
