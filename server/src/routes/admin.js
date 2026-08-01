const express = require('express');
const {
  getAdminStats,
  getStudents,
  getStudentDetails,
  deleteStudent,
  getAdminsList,
  addAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  changePrimaryAdminPassword,
  changePrimaryAdminEmail,
  transferPrimaryAdmin,
  deleteAdmin,
  exportStudentsData,
  refreshCompanyLogo,
  setCustomCompanyLogo,
  removeCustomCompanyLogo,
} = require('../controllers/adminController');
const { requireAdmin, requirePrimaryAdmin } = require('../middleware/auth');

const router = express.Router();

// General Admin Routes (Accessible to ALL authenticated Admins)
router.get('/stats', requireAdmin, getAdminStats);
router.get('/students', requireAdmin, getStudents);
router.get('/students/export', requireAdmin, exportStudentsData);
router.get('/students/:id', requireAdmin, getStudentDetails);
router.delete('/students/:id', requireAdmin, deleteStudent);
router.get('/manage', requireAdmin, getAdminsList);

// Admin Company Logo Management Endpoints
router.post('/companies/:id/refresh-logo', requireAdmin, refreshCompanyLogo);
router.patch('/companies/:id/custom-logo', requireAdmin, setCustomCompanyLogo);
router.delete('/companies/:id/custom-logo', requireAdmin, removeCustomCompanyLogo);

// Primary Admin Only Management Routes (Strictly enforced backend RBAC)
router.post('/manage/add', requirePrimaryAdmin, addAdmin);
router.patch('/manage/:id/toggle', requirePrimaryAdmin, toggleAdminStatus);
router.post('/manage/:id/reset-password', requirePrimaryAdmin, resetAdminPassword);
router.post('/manage/change-password', requirePrimaryAdmin, changePrimaryAdminPassword);
router.post('/manage/change-email', requirePrimaryAdmin, changePrimaryAdminEmail);
router.post('/manage/transfer', requirePrimaryAdmin, transferPrimaryAdmin);
router.delete('/manage/:id', requirePrimaryAdmin, deleteAdmin);

module.exports = router;
