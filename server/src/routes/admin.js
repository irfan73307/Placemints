const express = require('express');
const {
  getAdminStats,
  getStudents,
  getStudentDetails,
  getAdminsList,
  addAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  changePrimaryAdminPassword,
  changePrimaryAdminEmail,
  transferPrimaryAdmin,
  deleteAdmin,
  exportStudentsData,
} = require('../controllers/adminController');
const { requireAdmin, requirePrimaryAdmin } = require('../middleware/auth');

const router = express.Router();

// General Admin Routes (Accessible to ALL authenticated Admins)
router.get('/stats', requireAdmin, getAdminStats);
router.get('/students', requireAdmin, getStudents);
router.get('/students/export', requireAdmin, exportStudentsData);
router.get('/students/:id', requireAdmin, getStudentDetails);
router.get('/manage', requireAdmin, getAdminsList);

// Primary Admin Only Management Routes (Strictly enforced backend RBAC)
router.post('/manage/add', requirePrimaryAdmin, addAdmin);
router.patch('/manage/:id/toggle', requirePrimaryAdmin, toggleAdminStatus);
router.post('/manage/:id/reset-password', requirePrimaryAdmin, resetAdminPassword);
router.post('/manage/change-password', requirePrimaryAdmin, changePrimaryAdminPassword);
router.post('/manage/change-email', requirePrimaryAdmin, changePrimaryAdminEmail);
router.post('/manage/transfer', requirePrimaryAdmin, transferPrimaryAdmin);
router.delete('/manage/:id', requirePrimaryAdmin, deleteAdmin);

module.exports = router;
