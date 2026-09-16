const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const authController = require('../controllers/authController');
const menuController = require('../controllers/menuController');
const tableController = require('../controllers/tableController');
const orderController = require('../controllers/orderController');
const billController = require('../controllers/billController');
const settingsController = require('../controllers/settingsController');
const feedbackController = require('../controllers/feedbackController');
const analyticsController = require('../controllers/analyticsController');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/demo-login', authController.quickDemoLogin);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/change-password', requireAuth, authController.changePassword);
router.get('/auth/me', requireAuth, authController.getMe);
router.get('/auth/staff', requireAuth, requireRole('MANAGER'), authController.getStaffList);
router.patch('/auth/staff/:id', requireAuth, requireRole('MANAGER'), authController.updateStaff);
router.post('/auth/staff/:id/pay', requireAuth, requireRole('MANAGER'), authController.payStaff);
router.get('/auth/staff/:id/payments', requireAuth, requireRole('MANAGER'), authController.getStaffPayments);

// --- Settings Routes (Admin editable tax & service charge) ---
router.get('/settings', settingsController.getSettings);
router.put('/settings', requireAuth, requireRole('MANAGER'), settingsController.updateSettings);

// --- Menu & Category Routes ---
router.get('/categories', menuController.getCategories);
router.post('/categories', requireAuth, requireRole('MANAGER'), menuController.createCategory);
router.put('/categories/:id', requireAuth, requireRole('MANAGER'), menuController.updateCategory);
router.delete('/categories/:id', requireAuth, requireRole('MANAGER'), menuController.deleteCategory);

router.get('/menu', menuController.getMenuItems);
router.get('/menu/:id', menuController.getMenuItemById);
router.post('/menu', requireAuth, requireRole('MANAGER'), menuController.createMenuItem);
router.put('/menu/:id', requireAuth, requireRole('MANAGER'), menuController.updateMenuItem);
router.patch('/menu/:id/toggle', requireAuth, requireRole('MANAGER'), menuController.toggleAvailability);
router.delete('/menu/:id', requireAuth, requireRole('MANAGER'), menuController.deleteMenuItem);

// --- Table Routes ---
router.get('/tables', tableController.getTables);
router.post('/tables', requireAuth, requireRole('MANAGER'), tableController.createTable);
router.put('/tables/:id', requireAuth, requireRole('MANAGER'), tableController.updateTable);
router.patch('/tables/:id/status', tableController.updateTableStatus); // Waiters and Cashiers can toggle table status
router.delete('/tables/:id', requireAuth, requireRole('MANAGER'), tableController.deleteTable);

// --- Order Routes ---
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.post('/orders', orderController.createOrder); // Guest customers and waiters can create orders
router.patch('/orders/:id/status', orderController.updateOrderStatus);

// --- Billing, Payment & Thermal Receipt Routes ---
router.get('/bills', billController.getBills);
router.post('/bills', billController.generateBill);
router.post('/bills/:billId/pay', billController.processPayment);
router.get('/bills/:billId/receipt', billController.getThermalReceipt);

// --- Feedback & Reviews ---
router.get('/feedback', feedbackController.getFeedbacks);
router.post('/feedback', feedbackController.submitFeedback);

// --- Sales & Analytics ---
router.get('/analytics/dashboard', analyticsController.getDashboardMetrics);

module.exports = router;
