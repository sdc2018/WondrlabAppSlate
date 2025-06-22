import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: any;
  html?: string;
  text?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templatesPath: string;
  private isEnabled: boolean;
  private fromAddress: string;
  private fromName: string;
  private replyTo: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/emails');
    this.isEnabled = process.env.EMAIL_ENABLED === 'true';
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@company.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'WondrlabApp';
    this.replyTo = process.env.EMAIL_REPLY_TO || 'support@company.com';
    
    if (this.isEnabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter(): void {
    try {
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };

      this.transporter = nodemailer.createTransport(config);
      
      // Verify connection
      this.transporter?.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
        } else {
          console.log('Email service is ready to send emails');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  private compileTemplate(templateContent: string, data: any): string {
    try {
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      console.error('Failed to compile email template:', error);
      throw new Error('Email template compilation failed');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('Email service is disabled, skipping email send');
      return false;
    }

    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      let htmlContent = options.html || '';
      
      // If template is specified, load and compile it
      if (options.template) {
        const templateContent = await this.loadTemplate(options.template);
        htmlContent = this.compileTemplate(templateContent, options.data || {});
      }

      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        replyTo: this.replyTo,
        subject: options.subject,
        html: htmlContent,
        text: options.text || ''
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (process.env.EMAIL_DEBUG === 'true') {
        console.log('Email sent successfully:', result.messageId);
      }
      
      // Log email send
      await this.logEmail(options, result.messageId, 'sent');
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      await this.logEmail(options, null, 'failed', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  private async logEmail(options: EmailOptions, messageId: string | null, status: string, error?: string): Promise<void> {
    try {
      const EmailLogModel = (await import('../models/EmailLog')).default;
      
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      for (const recipient of recipients) {
        await EmailLogModel.create({
          recipient_email: recipient,
          subject: options.subject,
          template_name: options.template || undefined,
          status: status as 'sent' | 'failed' | 'pending',
          message_id: messageId || undefined,
          error_message: error || undefined
        });
      }
    } catch (logError) {
      console.error('Failed to log email:', logError);
    }
  }

  // Check if user can receive this type of email
  async canSendToUser(userId: number, emailType: string): Promise<boolean> {
    try {
      const EmailPreferencesModel = (await import('../models/EmailPreferences')).default;
      return await EmailPreferencesModel.canSendEmail(userId, emailType);
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return true; // Default to true if preferences check fails
    }
  }

  // Convenience methods for common email types
  async sendTaskAssignmentEmail(assignedUserEmail: string, taskData: any, userId?: number): Promise<boolean> {
    if (userId && !(await this.canSendToUser(userId, 'task_assignment'))) {
      console.log(`User ${userId} has disabled task assignment emails`);
      return false;
    }

    return this.sendEmail({
      to: assignedUserEmail,
      subject: `New Task Assigned: ${taskData.name}`,
      template: 'task-assignment',
      data: taskData
    });
  }

  async sendTaskOverdueEmail(assignedUserEmail: string, taskData: any, userId?: number): Promise<boolean> {
    if (userId && !(await this.canSendToUser(userId, 'task_overdue'))) {
      console.log(`User ${userId} has disabled task overdue emails`);
      return false;
    }

    return this.sendEmail({
      to: assignedUserEmail,
      subject: `Task Overdue: ${taskData.name}`,
      template: 'task-overdue',
      data: taskData
    });
  }

  async sendTaskEscalationEmail(buHeadEmail: string, taskData: any, userId?: number): Promise<boolean> {
    if (userId && !(await this.canSendToUser(userId, 'task_escalation'))) {
      console.log(`User ${userId} has disabled task escalation emails`);
      return false;
    }

    return this.sendEmail({
      to: buHeadEmail,
      subject: `Task Escalation: ${taskData.name}`,
      template: 'task-escalation',
      data: taskData
    });
  }

  async sendOpportunityWonEmail(recipients: string[], opportunityData: any, userIds?: number[]): Promise<boolean> {
    // Filter recipients based on preferences if user IDs are provided
    if (userIds && userIds.length === recipients.length) {
      const filteredRecipients: string[] = [];
      for (let i = 0; i < recipients.length; i++) {
        if (await this.canSendToUser(userIds[i], 'opportunity_won')) {
          filteredRecipients.push(recipients[i]);
        }
      }
      
      if (filteredRecipients.length === 0) {
        console.log('All users have disabled opportunity won emails');
        return false;
      }
      
      recipients = filteredRecipients;
    }

    return this.sendEmail({
      to: recipients,
      subject: `Opportunity Won: ${opportunityData.name}`,
      template: 'opportunity-won',
      data: opportunityData
    });
  }

  async sendDailyDigestEmail(recipientEmail: string, digestData: any, userId?: number): Promise<boolean> {
    if (userId && !(await this.canSendToUser(userId, 'daily_digest'))) {
      console.log(`User ${userId} has disabled daily digest emails`);
      return false;
    }

    return this.sendEmail({
      to: recipientEmail,
      subject: 'Daily Digest - WondrlabApp',
      template: 'daily-digest',
      data: digestData
    });
  }

  // Test email functionality
  async sendTestEmail(to: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'WondrlabApp Email Service Test',
      html: '<h1>Email Service Working!</h1><p>This is a test email from WondrlabApp.</p>',
      text: 'Email Service Working! This is a test email from WondrlabApp.'
    });
  }
}

export default new EmailService();