import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import serviceService, { Service, ServiceInput } from '../services/serviceService';
import businessUnitService, { BusinessUnit } from '../services/businessUnitService';

// Pricing models for dropdown
const pricingModels = [
  'Fixed Price',
  'Hourly Rate',
  'Retainer',
  'Project-based',
  'Commission',
  'Value-based'
];

// Status options
const statusOptions = ['active', 'inactive', 'deprecated'];

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceInput>({
    name: '',
    description: '',
    business_unit: '',
    pricing_model: '',
    pricing_details: '',
    applicable_industries: [],
    client_role: '',
    status: 'active'
  });
  const [error, setError] = useState<string | null>(null);

  // Convert array to comma-separated string for form input
  const [industriesString, setIndustriesString] = useState('');

  useEffect(() => {
    fetchServices();
    fetchBusinessUnits();
  }, []);

  // Fetch business units from API
  const fetchBusinessUnits = async () => {
    try {
      const data = await businessUnitService.getAllBusinessUnits();
      console.log('Business Units API response:', data);
      
      // Ensure we have an array of business units
      let businessUnitsData: BusinessUnit[] = [];
      
      if (Array.isArray(data)) {
        businessUnitsData = data;
      } else if (data && typeof data === 'object') {
        // If response is an object with a data property
        const responseObj = data as any;
        if (responseObj.data && Array.isArray(responseObj.data)) {
          businessUnitsData = responseObj.data;
        }
      }
      
      setBusinessUnits(businessUnitsData);
    } catch (err) {
      console.error('Error fetching business units:', err);
      // Don't set error state here to avoid overriding service errors
    }
  };

  // Fetch services from API
    const fetchServices = async () => {
      try {
      setLoading(true);
      const response = await serviceService.getAllServices();
      
      // Log the response for debugging
      console.log('Services API response:', response);
      
      // Check if response is an array, otherwise handle appropriately
      let data: Service[] = [];
      if (Array.isArray(response)) {
          data = response;
        } else if (response && typeof response === 'object') {
          // If response is an object that might have a data property
          const responseObj = response as Record<string, any>;
          if (responseObj.data && Array.isArray(responseObj.data)) {
            data = responseObj.data as Service[];
          }
        }
      
      setServices(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  const handleOpenDialog = async (serviceId?: number) => {
    // Reset form
    setIndustriesString('');
    
    if (serviceId) {
      try {
        setLoading(true);
        const service = await serviceService.getServiceById(serviceId);
      setCurrentService(service);
        
        // Convert industries array to comma-separated string for the form
        const industriesStr = service.applicable_industries.join(', ');
        setIndustriesString(industriesStr);
        
      setFormData({
        name: service.name,
        description: service.description,
        business_unit: service.business_unit,
        pricing_model: service.pricing_model,
          pricing_details: service.pricing_details || '',
          applicable_industries: service.applicable_industries,
        client_role: service.client_role,
        status: service.status
      });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      // New service
      setCurrentService(null);
      setFormData({
        name: '',
        description: '',
        business_unit: '',
        pricing_model: '',
        pricing_details: '',
        applicable_industries: [],
        client_role: '',
        status: 'active'
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentService(null);
    setError(null);
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'applicable_industries') {
      setIndustriesString(value);
    } else {
    setFormData({
      ...formData,
      [name]: value
    });
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.business_unit || !formData.pricing_model) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Convert comma-separated industries string to array
      const industriesArray = industriesString
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);
      
      // Prepare data for API
      const serviceData: ServiceInput = {
        ...formData,
        applicable_industries: industriesArray
      };
      
      if (currentService) {
        // Update existing service
        const updatedService = await serviceService.updateService(currentService.id, serviceData);
        setServices(services.map(s => s.id === currentService.id ? updatedService : s));
      } else {
        // Create new service
        const newService = await serviceService.createService(serviceData);
        setServices([...services, newService]);
      }
      
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Failed to save service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      setLoading(true);
      await serviceService.deleteService(id);
      setServices(services.filter(s => s.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setLoading(true);
      const updatedService = await serviceService.changeServiceStatus(id, newStatus);
      setServices(services.map(s => s.id === id ? updatedService : s));
      setError(null);
    } catch (err) {
      console.error('Error changing service status:', err);
      setError('Failed to update service status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && services.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Services</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Service
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Business Unit</TableCell>
              <TableCell>Pricing Model</TableCell>
              <TableCell>Industries</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No services found. Create your first service by clicking "Add Service".
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.business_unit}</TableCell>
                <TableCell>
                  {service.pricing_model}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {service.pricing_details}
                  </Typography>
                </TableCell>
                <TableCell>
                  {service.applicable_industries.length > 2 
                    ? `${service.applicable_industries.slice(0, 2).join(', ')} +${service.applicable_industries.length - 2} more`
                    : service.applicable_industries.join(', ')}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={service.status} 
                    color={getStatusColor(service.status) as any}
                    size="small"
                      onClick={() => {
                        const newStatus = service.status === 'active' ? 'inactive' : 'active';
                        handleStatusChange(service.id, newStatus);
                      }}
                  />
                </TableCell>
                <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(service.id)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(service.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Service Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle>{currentService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Service Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Business Unit</InputLabel>
              <Select
                name="business_unit"
                value={formData.business_unit}
                label="Business Unit"
                onChange={handleSelectChange}
              >
                {businessUnits.map((unit) => (
                  <MenuItem key={unit.id} value={unit.name}>{unit.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Pricing Model</InputLabel>
              <Select
                name="pricing_model"
                value={formData.pricing_model}
                label="Pricing Model"
                onChange={handleSelectChange}
              >
                {pricingModels.map((model) => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="Pricing Details"
              name="pricing_details"
              value={formData.pricing_details}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Applicable Industries (comma-separated)"
              name="applicable_industries"
                value={industriesString}
              onChange={handleInputChange}
              helperText="Enter industries separated by commas (e.g., Retail, Technology, Finance)"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Client Role"
              name="client_role"
              value={formData.client_role}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleSelectChange}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting || loading}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              currentService ? 'Update' : 'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Services;