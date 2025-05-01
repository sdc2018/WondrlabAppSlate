import { Request, Response } from 'express';
import BusinessUnitModel, { BusinessUnit, BusinessUnitInput, BusinessUnitStatus } from '../models/BusinessUnit';

/**
 * Business Unit Controller Class
 */
class BusinessUnitController {
  /**
   * Create a new business unit
   */
  async createBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, status } = req.body;

      // Validate required fields
      if (!name || !description) {
        res.status(400).json({ message: 'Name and description are required' });
        return;
      }

      // Check if business unit with the same name already exists
      const existingBusinessUnit = await BusinessUnitModel.findByName(name);
      if (existingBusinessUnit) {
        res.status(409).json({ message: 'Business unit with this name already exists' });
        return;
      }

      // Create business unit with status or default to ACTIVE
      const businessUnitData: BusinessUnitInput = {
        name,
        description,
        status: status || BusinessUnitStatus.ACTIVE
      };

      const businessUnit = await BusinessUnitModel.create(businessUnitData);
      
      res.status(201).json({
        message: 'Business unit created successfully',
        businessUnit
      });
    } catch (error) {
      console.error('Error creating business unit:', error);
      res.status(500).json({ message: 'Server error during business unit creation' });
    }
  }

  /**
   * Get all business units
   */
  async getAllBusinessUnits(req: Request, res: Response): Promise<void> {
    try {
      // Check for status filter
      const { status } = req.query;
      
      let businessUnits: BusinessUnit[];
      
      if (status === 'active') {
        businessUnits = await BusinessUnitModel.findActive();
      } else {
        businessUnits = await BusinessUnitModel.findAll();
      }
      
      res.status(200).json(businessUnits);
    } catch (error) {
      console.error('Error getting business units:', error);
      res.status(500).json({ message: 'Server error while retrieving business units' });
    }
  }

  /**
   * Get business unit by ID
   */
  async getBusinessUnitById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ message: 'Valid business unit ID is required' });
        return;
      }
      
      const businessUnit = await BusinessUnitModel.findById(Number(id));
      
      if (!businessUnit) {
        res.status(404).json({ message: 'Business unit not found' });
        return;
      }
      
      res.status(200).json(businessUnit);
    } catch (error) {
      console.error(`Error getting business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Server error while retrieving business unit' });
    }
  }

  /**
   * Update business unit
   */
  async updateBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ message: 'Valid business unit ID is required' });
        return;
      }
      
      // Check if business unit exists
      const existingBusinessUnit = await BusinessUnitModel.findById(Number(id));
      if (!existingBusinessUnit) {
        res.status(404).json({ message: 'Business unit not found' });
        return;
      }
      
      // Check if there's another business unit with the same name
      if (name && name !== existingBusinessUnit.name) {
        const duplicateBusinessUnit = await BusinessUnitModel.findByName(name);
        if (duplicateBusinessUnit) {
          res.status(409).json({ message: 'Another business unit with this name already exists' });
          return;
        }
      }
      
      // Update business unit
      const businessUnitData: Partial<BusinessUnitInput> = {};
      if (name) businessUnitData.name = name;
      if (description) businessUnitData.description = description;
      if (status) businessUnitData.status = status;
      
      const updatedBusinessUnit = await BusinessUnitModel.update(Number(id), businessUnitData);
      
      if (!updatedBusinessUnit) {
        res.status(400).json({ message: 'No fields to update or update failed' });
        return;
      }
      
      res.status(200).json({
        message: 'Business unit updated successfully',
        businessUnit: updatedBusinessUnit
      });
    } catch (error) {
      console.error(`Error updating business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Server error while updating business unit' });
    }
  }

  /**
   * Delete business unit
   */
  async deleteBusinessUnit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ message: 'Valid business unit ID is required' });
        return;
      }
      
      // Check if business unit exists
      const existingBusinessUnit = await BusinessUnitModel.findById(Number(id));
      if (!existingBusinessUnit) {
        res.status(404).json({ message: 'Business unit not found' });
        return;
      }
      
      // Delete business unit
      const deleted = await BusinessUnitModel.delete(Number(id));
      
      if (!deleted) {
        res.status(500).json({ message: 'Failed to delete business unit' });
        return;
      }
      
      res.status(200).json({
        message: 'Business unit deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Server error while deleting business unit' });
    }
  }

  /**
   * Change business unit status
   */
  async changeBusinessUnitStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate ID
      if (!id || isNaN(Number(id))) {
        res.status(400).json({ message: 'Valid business unit ID is required' });
        return;
      }
      
      // Validate status
      if (!status || !Object.values(BusinessUnitStatus).includes(status as BusinessUnitStatus)) {
        res.status(400).json({ message: 'Valid status is required (active or inactive)' });
        return;
      }
      
      // Check if business unit exists
      const existingBusinessUnit = await BusinessUnitModel.findById(Number(id));
      if (!existingBusinessUnit) {
        res.status(404).json({ message: 'Business unit not found' });
        return;
      }
      
      // Update status
      const updatedBusinessUnit = await BusinessUnitModel.update(Number(id), { status: status as BusinessUnitStatus });
      
      if (!updatedBusinessUnit) {
        res.status(400).json({ message: 'Status update failed' });
        return;
      }
      
      res.status(200).json({
        message: 'Business unit status updated successfully',
        businessUnit: updatedBusinessUnit
      });
    } catch (error) {
      console.error(`Error changing status for business unit with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Server error while changing business unit status' });
    }
  }
}

// Export controller instance
export default new BusinessUnitController();
