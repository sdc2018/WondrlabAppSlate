// import api from './api';
// import { AxiosResponse } from 'axios';
import { User } from './authService';

// Extended user interface with additional fields if needed
export interface UserWithDetails extends User {
  // Add any additional fields that might be returned by the API
  // but not included in the basic User interface
}

const userService = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll simulate an API call with mock data since the endpoint might not exist yet
      
      // Uncomment this when the endpoint is available:
      // const response: AxiosResponse<User[]> = await api.get('/users');
      // return response.data;
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      // Mock users data - updated to match actual database IDs (31-44)
      const mockUsers: User[] = [
        { id: 31, username: 'admin', email: 'admin@wondrlab.com', role: 'admin' },
        { id: 32, username: 'sales1', email: 'sales1@wondrlab.com', role: 'sales' },
        { id: 33, username: 'sales2', email: 'sales2@wondrlab.com', role: 'sales' },
        { id: 34, username: 'sales3', email: 'sales3@wondrlab.com', role: 'sales' },
        { id: 35, username: 'sales4', email: 'sales4@wondrlab.com', role: 'sales' },
        { id: 36, username: 'sales5', email: 'sales5@wondrlab.com', role: 'sales' },
        { id: 37, username: 'buhead_creative', email: 'buhead_creative@wondrlab.com', role: 'bu_head' },
        { id: 38, username: 'buhead_digitalmarketing', email: 'buhead_digitalmarketing@wondrlab.com', role: 'bu_head' },
        { id: 39, username: 'buhead_contentproduction', email: 'buhead_contentproduction@wondrlab.com', role: 'bu_head' },
        { id: 40, username: 'buhead_mediaplanning', email: 'buhead_mediaplanning@wondrlab.com', role: 'bu_head' },
        { id: 41, username: 'buhead_strategy', email: 'buhead_strategy@wondrlab.com', role: 'bu_head' },
        { id: 42, username: 'manager1', email: 'manager1@wondrlab.com', role: 'senior_management' },
        { id: 43, username: 'manager2', email: 'manager2@wondrlab.com', role: 'senior_management' },
        { id: 44, username: 'manager3', email: 'manager3@wondrlab.com', role: 'senior_management' }
      ];
      
      return mockUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: number): Promise<User> => {
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll get all users and find the one with the matching ID
      
      // Uncomment this when the endpoint is available:
      // const response: AxiosResponse<User> = await api.get(`/users/${id}`);
      // return response.data;
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      const users = await userService.getAllUsers();
      const user = users.find(user => user.id === id);
      
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      return user;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (role: string): Promise<User[]> => {
    try {
      // In a real implementation, this would call a backend endpoint with a role parameter
      // For now, we'll get all users and filter them
      
      const users = await userService.getAllUsers();
      return users.filter(user => user.role === role);
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  },

  /**
   * Get sales users (account owners)
   * Convenience method for getting users with 'sales' role
   */
  getSalesUsers: async (): Promise<User[]> => {
    return userService.getUsersByRole('sales');
  }
};

export default userService;