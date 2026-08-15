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
  bulkAddQuestions,
} = require('../controllers/adminController');
const {
  getAdminCompanies,
  getAdminCompanyById,
  createAdminCompany,
  updateAdminCompany,
  deleteAdminCompany,
  verifyCompanyWebsite,
  scrapeCompanyOfficial,
  verifyUrlStandalone,
  deleteCompanyQuestion,
  checkCompanyExists,
  previewOfficialRefresh,
  applyOfficialRefresh,
} = require('../controllers/adminCompanyController');
const { requireAdmin, requirePrimaryAdmin } = require('../middleware/auth');

const router = express.Router();

// General Admin Routes (Accessible to ALL authenticated Admins)
router.get('/stats', requireAdmin, getAdminStats);
router.get('/students', requireAdmin, getStudents);
router.get('/students/export', requireAdmin, exportStudentsData);
router.get('/students/:id', requireAdmin, getStudentDetails);
router.delete('/students/:id', requireAdmin, deleteStudent);
router.get('/manage', requireAdmin, getAdminsList);

router.get('/companies', requireAdmin, getAdminCompanies);
router.get('/companies/stats', requireAdmin, getAdminStats);
router.get('/companies/check-exists', requireAdmin, checkCompanyExists);
router.post('/companies', requireAdmin, createAdminCompany);
router.post('/companies/verify-url', requireAdmin, verifyUrlStandalone);
router.post('/companies/preview-official-refresh', requireAdmin, previewOfficialRefresh);
router.post('/companies/apply-official-refresh', requireAdmin, applyOfficialRefresh);
router.delete('/companies/questions/:questionId', requireAdmin, deleteCompanyQuestion);

// Company + Question Bulk Upload
router.post('/companies/bulk-questions', requireAdmin, bulkAddQuestions);

// Single Company Management (CRUD + Scraping + Verification + Re-verification)
router.get('/companies/:id', requireAdmin, getAdminCompanyById);
router.put('/companies/:id', requireAdmin, updateAdminCompany);
router.patch('/companies/:id', requireAdmin, updateAdminCompany);
router.delete('/companies/:id', requireAdmin, deleteAdminCompany);
router.post('/companies/:id/verify-website', requireAdmin, verifyCompanyWebsite);
router.post('/companies/:id/scrape-official', requireAdmin, scrapeCompanyOfficial);
router.post('/companies/:id/preview-official-refresh', requireAdmin, previewOfficialRefresh);
router.post('/companies/:id/apply-official-refresh', requireAdmin, applyOfficialRefresh);

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
