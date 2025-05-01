import api from './api';
import { AxiosResponse } from 'axios';

export interface BusinessUnit {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessUnitInput {
  name: string;
  description?: string;
  status: string;
}

const businessUnitService = {
  /**
   * Get all business units
   */
  getAllBusinessUnits: async (): Promise<BusinessUnit[]> => {
    try {
      const response: AxiosResponse<BusinessUnit[]> = await api.get('/admin/business-units');
      return response.data;
    } catch (error) {
      console.error('Error fetching business units:', error);
      throw error;
    }
  },

  /**
   * Get a business unit by ID
   */
  getBusinessUnitById: async (id: number): Promise<BusinessUnit> => {
    try {
      const response: AxiosResponse<BusinessUnit> = await api.get(`/admin/business-units/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching business unit with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new business unit
   */
  createBusinessUnit: async (businessUnitData: BusinessUnitInput): Promise<BusinessUnit> => {
    try {
      const response: AxiosResponse<BusinessUnit> = await api.post('/admin/business-units', businessUnitData);
      return response.data;
    } catch (error) {
      console.error('Error creating business unit:', error);
      throw error;
    }
  },

  /**
   * Update an existing business unit
   */
  updateBusinessUnit: async (id: number, businessUnitData: Partial<BusinessUnitInput>): Promise<BusinessUnit> => {
    try {
      const response: AxiosResponse<BusinessUnit> = await api.put(`/admin/business-units/${id}`, businessUnitData);
      return response.data;
    } catch (error) {
      console.error(`Error updating business unit with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a business unit
   */
  deleteBusinessUnit: async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/business-units/${id}`);
    } catch (error) {
      console.error(`Error deleting business unit with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Change business unit status
   */
  changeBusinessUnitStatus: async (id: number, status: string): Promise<BusinessUnit> => {
    try {
      const response: AxiosResponse<BusinessUnit> = await api.patch(`/admin/business-units/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing business unit status with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get mock business units (for development before backend is ready)
   */
  getMockBusinessUnits: (): BusinessUnit[] => {
    return [
      {
        id: 1,
        name: 'Creative',
        description: 'Creative design and branding services',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Digital Marketing',
        description: 'Digital marketing and advertising services',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Content Production',
        description: 'Content creation and production services',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Media Planning',
        description: 'Media strategy and planning services',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Strategy',
        description: 'Strategic consulting and planning services',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
};

export default businessUnitService;