const express = require('express');
const { getResources, createResource } = require('../controllers/libraryController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getResources);
router.post('/', requireAuth, createResource);

module.exports = router;
