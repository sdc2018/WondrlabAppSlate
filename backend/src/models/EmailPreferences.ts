import { Pool } from 'pg';
import db from '../config/database';

export interface EmailPreferences {
  id: number;
  user_id: number;
  task_assignments: boolean;
  task_overdue: boolean;
  task_escalations: boolean;
  opportunity_updates: boolean;
  opportunity_won: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
  digest_time: string; // Time in HH:MM format
  created_at: Date;
  updated_at: Date;
}

export interface EmailPreferencesInput {
  user_id: number;
  task_assignments?: boolean;
  task_overdue?: boolean;
  task_escalations?: boolean;
  opportunity_updates?: boolean;
  opportunity_won?: boolean;
  daily_digest?: boolean;
  weekly_digest?: boolean;
  email_frequency?: 'immediate' | 'daily' | 'weekly' | 'disabled';
  digest_time?: string;
}

export class EmailPreferencesModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS email_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_assignments BOOLEAN DEFAULT TRUE,
        task_overdue BOOLEAN DEFAULT TRUE,
        task_escalations BOOLEAN DEFAULT TRUE,
        opportunity_updates BOOLEAN DEFAULT TRUE,
        opportunity_won BOOLEAN DEFAULT TRUE,
        daily_digest BOOLEAN DEFAULT TRUE,
        weekly_digest BOOLEAN DEFAULT FALSE,
        email_frequency VARCHAR(20) DEFAULT 'immediate',
        digest_time VARCHAR(5) DEFAULT '08:00',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Email preferences table created or already exists');
    } catch (error) {
      console.error('Error creating email preferences table:', error);
      throw error;
    }
  }

  async create(preferencesData: EmailPreferencesInput): Promise<EmailPreferences> {
    const {
      user_id,
      task_assignments = true,
      task_overdue = true,
      task_escalations = true,
      opportunity_updates = true,
      opportunity_won = true,
      daily_digest = true,
      weekly_digest = false,
      email_frequency = 'immediate',
      digest_time = '08:00'
    } = preferencesData;
    
    const query = `
      INSERT INTO email_preferences (
        user_id, task_assignments, task_overdue, task_escalations,
        opportunity_updates, opportunity_won, daily_digest, weekly_digest,
        email_frequency, digest_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        task_assignments = EXCLUDED.task_assignments,
        task_overdue = EXCLUDED.task_overdue,
        task_escalations = EXCLUDED.task_escalations,
        opportunity_updates = EXCLUDED.opportunity_updates,
        opportunity_won = EXCLUDED.opportunity_won,
        daily_digest = EXCLUDED.daily_digest,
        weekly_digest = EXCLUDED.weekly_digest,
        email_frequency = EXCLUDED.email_frequency,
        digest_time = EXCLUDED.digest_time,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    try {
      const values = [
        user_id, task_assignments, task_overdue, task_escalations,
        opportunity_updates, opportunity_won, daily_digest, weekly_digest,
        email_frequency, digest_time
      ];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating email preferences:', error);
      throw error;
    }
  }

  async findByUserId(userId: number): Promise<EmailPreferences | null> {
    const query = 'SELECT * FROM email_preferences WHERE user_id = $1';
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding email preferences by user ID:', error);
      throw error;
    }
  }

  async update(userId: number, preferencesData: Partial<EmailPreferencesInput>): Promise<EmailPreferences | null> {
    const allowedFields = [
      'task_assignments', 'task_overdue', 'task_escalations',
      'opportunity_updates', 'opportunity_won', 'daily_digest',
      'weekly_digest', 'email_frequency', 'digest_time'
    ];
    
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    Object.keys(preferencesData).forEach(key => {
      if (allowedFields.includes(key) && preferencesData[key as keyof Partial<EmailPreferencesInput>] !== undefined) {
        updates.push(`${key} = $${valueIndex}`);
        values.push(preferencesData[key as keyof Partial<EmailPreferencesInput>]);
        valueIndex++;
      }
    });

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return null;
    }

    const query = `
      UPDATE email_preferences
      SET ${updates.join(', ')}
      WHERE user_id = $${valueIndex}
      RETURNING *
    `;
    
    values.push(userId);
    
    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating email preferences:', error);
      throw error;
    }
  }

  async getUsersForDigest(digestType: 'daily' | 'weekly', time: string): Promise<number[]> {
    const column = digestType === 'daily' ? 'daily_digest' : 'weekly_digest';
    const query = `
      SELECT user_id FROM email_preferences 
      WHERE ${column} = TRUE 
      AND digest_time = $1 
      AND email_frequency != 'disabled'
    `;
    
    try {
      const result = await this.pool.query(query, [time]);
      return result.rows.map(row => row.user_id);
    } catch (error) {
      console.error(`Error getting users for ${digestType} digest:`, error);
      throw error;
    }
  }

  async canSendEmail(userId: number, emailType: string): Promise<boolean> {
    try {
      const preferences = await this.findByUserId(userId);
      
      if (!preferences || preferences.email_frequency === 'disabled') {
        return false;
      }

      // Check specific email type preferences
      switch (emailType) {
        case 'task_assignment':
          return preferences.task_assignments;
        case 'task_overdue':
          return preferences.task_overdue;
        case 'task_escalation':
          return preferences.task_escalations;
        case 'opportunity_update':
          return preferences.opportunity_updates;
        case 'opportunity_won':
          return preferences.opportunity_won;
        case 'daily_digest':
          return preferences.daily_digest;
        case 'weekly_digest':
          return preferences.weekly_digest;
        default:
          return true; // Default to true for unknown types
      }
    } catch (error) {
      console.error('Error checking email permissions:', error);
      return false; // Default to false on error
    }
  }
}

export default new EmailPreferencesModel();
