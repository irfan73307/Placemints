const express = require('express');
const {
  getAdminStats,
  getStudents,
  getStudentDetails,
  getAdminsList,
  addAdmin,
  toggleAdminStatus,
  transferPrimaryAdmin,
  deleteAdmin,
  exportStudentsData,
} = require('../controllers/adminController');
const { requireAdmin, requirePrimaryAdmin } = require('../middleware/auth');

const router = express.Router();

// General Admin Protected Routes
router.get('/stats', requireAdmin, getAdminStats);
router.get('/students', requireAdmin, getStudents);
router.get('/students/export', requireAdmin, exportStudentsData);
router.get('/students/:id', requireAdmin, getStudentDetails);
router.get('/manage', requireAdmin, getAdminsList);

// Primary Admin Only Management Routes
router.post('/manage/add', requireAdmin, addAdmin);
router.patch('/manage/:id/toggle', requireAdmin, toggleAdminStatus);
router.post('/manage/transfer', requirePrimaryAdmin, transferPrimaryAdmin);
router.delete('/manage/:id', requirePrimaryAdmin, deleteAdmin);

module.exports = router;
