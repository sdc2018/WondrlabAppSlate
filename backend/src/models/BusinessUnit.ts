import { Pool } from 'pg';
import db from '../config/database';

/**
 * Business Unit Status Enum
 */
export enum BusinessUnitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

/**
 * Business Unit Interface
 */
export interface BusinessUnit {
  id: number;
  name: string;
  description: string;
  status: BusinessUnitStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Business Unit Input Interface for creation/updates
 */
export interface BusinessUnitInput {
  name: string;
  description: string;
  status: BusinessUnitStatus;
}

/**
 * Business Unit Model Class
 */
class BusinessUnitModel {
  private pool: Pool;

  constructor() {
    this.pool = db;
  }

  /**
   * Create the business units table if it doesn't exist
   */
  async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS business_units (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.pool.query(query);
      console.log('Business units table created or already exists');
    } catch (error) {
      console.error('Error creating business units table:', error);
      throw error;
    }
  }

  /**
   * Create a new business unit
   */
  async create(businessUnitData: BusinessUnitInput): Promise<BusinessUnit> {
    const query = `
      INSERT INTO business_units (
        name, description, status
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [
      businessUnitData.name,
      businessUnitData.description,
      businessUnitData.status
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating business unit:', error);
      throw error;
    }
  }

  /**
   * Find a business unit by ID
   */
  async findById(id: number): Promise<BusinessUnit | null> {
    const query = 'SELECT * FROM business_units WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding business unit by ID:', error);
      throw error;
    }
  }

  /**
   * Find a business unit by name
   */
  async findByName(name: string): Promise<BusinessUnit | null> {
    const query = 'SELECT * FROM business_units WHERE name = $1';
    
    try {
      const result = await this.pool.query(query, [name]);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding business unit by name:', error);
      throw error;
    }
  }

  /**
   * Get all business units
   */
  async findAll(): Promise<BusinessUnit[]> {
    const query = 'SELECT * FROM business_units ORDER BY name';
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all business units:', error);
      throw error;
    }
  }

  /**
   * Get all active business units
   */
  async findActive(): Promise<BusinessUnit[]> {
    const query = 'SELECT * FROM business_units WHERE status = $1 ORDER BY name';
    
    try {
      const result = await this.pool.query(query, [BusinessUnitStatus.ACTIVE]);
      return result.rows;
    } catch (error) {
      console.error('Error finding active business units:', error);
      throw error;
    }
  }

  /**
   * Update a business unit
   */
  async update(id: number, businessUnitData: Partial<BusinessUnitInput>): Promise<BusinessUnit | null> {
    // Build the dynamic query based on provided fields
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that is provided
    Object.keys(businessUnitData).forEach(key => {
      if (businessUnitData[key as keyof Partial<BusinessUnitInput>] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(businessUnitData[key as keyof Partial<BusinessUnitInput>]);
        paramIndex++;
      }
    });
    
    // Add updated_at
    setFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // If no fields to update, return null
    if (setFields.length === 1) {
      return null;
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE business_units
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating business unit:', error);
      throw error;
    }
  }

  /**
   * Delete a business unit
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM business_units WHERE id = $1 RETURNING *';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting business unit:', error);
      throw error;
    }
  }
}

// Export an instance of the model
export default new BusinessUnitModel();
