import { Pool } from 'pg';
import db from '../config/database';

export interface EmailLog {
  id: number;
  recipient_email: string;
  subject: string;
  template_name?: string;
  status: 'sent' | 'failed' | 'pending';
  message_id?: string;
  error_message?: string;
  sent_at?: Date;
  created_at: Date;
}

export interface EmailLogInput {
  recipient_email: string;
  subject: string;
  template_name?: string;
  status: 'sent' | 'failed' | 'pending';
  message_id?: string;
  error_message?: string;
}

export class EmailLogModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        template_name VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        message_id VARCHAR(255),
        error_message TEXT,
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Email logs table created or already exists');
    } catch (error) {
      console.error('Error creating email logs table:', error);
      throw error;
    }
  }

  async create(emailLogData: EmailLogInput): Promise<EmailLog> {
    const { recipient_email, subject, template_name, status, message_id, error_message } = emailLogData;
    
    const query = `
      INSERT INTO email_logs (recipient_email, subject, template_name, status, message_id, error_message, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    try {
      const sent_at = status === 'sent' ? new Date() : null;
      const values = [recipient_email, subject, template_name || null, status, message_id || null, error_message || null, sent_at];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating email log:', error);
      throw error;
    }
  }

  async updateStatus(id: number, status: 'sent' | 'failed', messageId?: string, errorMessage?: string): Promise<boolean> {
    const query = `
      UPDATE email_logs
      SET status = $1, message_id = $2, error_message = $3, sent_at = $4
      WHERE id = $5
      RETURNING id
    `;
    
    try {
      const sent_at = status === 'sent' ? new Date() : null;
      const result = await this.pool.query(query, [status, messageId || null, errorMessage || null, sent_at, id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error updating email log status:', error);
      throw error;
    }
  }

  async findByRecipient(recipientEmail: string, limit: number = 50): Promise<EmailLog[]> {
    const query = `
      SELECT * FROM email_logs 
      WHERE recipient_email = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    try {
      const result = await this.pool.query(query, [recipientEmail, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error finding email logs by recipient:', error);
      throw error;
    }
  }

  async getEmailStats(days: number = 7): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(DISTINCT recipient_email) as unique_recipients
      FROM email_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `;
    
    try {
      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting email stats:', error);
      throw error;
    }
  }

  async cleanupOldLogs(days: number = 90): Promise<number> {
    const query = `
      DELETE FROM email_logs 
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;
    
    try {
      const result = await this.pool.query(query);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up old email logs:', error);
      throw error;
    }
  }
}

export default new EmailLogModel();
