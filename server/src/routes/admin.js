const express = require('express');
const { getStudents, getStudentDetails, exportStudentsData } = require('../controllers/adminController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/students', optionalAuth, getStudents);
router.get('/students/export', optionalAuth, exportStudentsData);
router.get('/students/:id', optionalAuth, getStudentDetails);

module.exports = router;
