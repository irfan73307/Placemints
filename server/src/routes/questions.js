const express = require('express');
const { toggleLike, createQuestion } = require('../controllers/questionController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createQuestion);
router.post('/:id/like', requireAuth, toggleLike);

module.exports = router;
