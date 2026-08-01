const express = require('express');
const { getCompanyReviews, postReview } = require('../controllers/reviewController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/companies/:companyId/reviews', optionalAuth, getCompanyReviews);
router.post('/companies/:companyId/reviews', requireAuth, postReview);

module.exports = router;
