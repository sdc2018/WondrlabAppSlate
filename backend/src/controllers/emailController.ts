import { Request, Response } from 'express';
import EmailService from '../services/emailService';
import EmailPreferencesModel from '../models/EmailPreferences';
import EmailLogModel from '../models/EmailLog';
import { UserRole } from '../models/User';

export class EmailController {
  // Send test email
  async sendTestEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { email } = req.body;
      const testEmail = email || 'test@example.com';

      if (!testEmail) {
        res.status(400).json({ message: 'Email address is required' });
        return;
      }

      const success = await EmailService.sendTestEmail(testEmail);
      
      if (success) {
        res.status(200).json({ 
          message: 'Test email sent successfully',
          email: testEmail
        });
      } else {
        res.status(500).json({ message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Server error while sending test email' });
    }
  }

  // Get user email preferences
  async getEmailPreferences(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const preferences = await EmailPreferencesModel.findByUserId(req.user.userId);
      
      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = await EmailPreferencesModel.create({
          user_id: req.user.userId
        });
        res.status(200).json(defaultPreferences);
      } else {
        res.status(200).json(preferences);
      }
    } catch (error) {
      console.error('Error getting email preferences:', error);
      res.status(500).json({ message: 'Server error while retrieving email preferences' });
    }
  }

  // Update user email preferences
  async updateEmailPreferences(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const preferencesData = req.body;
      const updatedPreferences = await EmailPreferencesModel.update(req.user.userId, preferencesData);
      
      if (updatedPreferences) {
        res.status(200).json(updatedPreferences);
      } else {
        res.status(404).json({ message: 'Email preferences not found' });
      }
    } catch (error) {
      console.error('Error updating email preferences:', error);
      res.status(500).json({ message: 'Server error while updating email preferences' });
    }
  }

  // Get email logs (admin only)
  async getEmailLogs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      if (req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Admin access required' });
        return;
      }

      const { email, limit } = req.query;
      let logs;

      if (email) {
        logs = await EmailLogModel.findByRecipient(email as string, parseInt(limit as string) || 50);
      } else {
        // Get general email stats
        const stats = await EmailLogModel.getEmailStats();
        res.status(200).json(stats);
        return;
      }

      res.status(200).json(logs);
    } catch (error) {
      console.error('Error getting email logs:', error);
      res.status(500).json({ message: 'Server error while retrieving email logs' });
    }
  }

  // Get email statistics (admin only)
  async getEmailStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      if (req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Admin access required' });
        return;
      }

      const { days } = req.query;
      const stats = await EmailLogModel.getEmailStats(parseInt(days as string) || 7);
      
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting email statistics:', error);
      res.status(500).json({ message: 'Server error while retrieving email statistics' });
    }
  }
}

export default new EmailController();
