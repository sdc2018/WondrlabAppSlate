import express from 'express';
import emailController from '../controllers/emailController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Email testing
router.post('/test', emailController.sendTestEmail);

// Email preferences
router.get('/preferences', emailController.getEmailPreferences);
router.put('/preferences', emailController.updateEmailPreferences);

// Email logs and statistics (admin only)
router.get('/logs', emailController.getEmailLogs);
router.get('/stats', emailController.getEmailStats);

export default router;
