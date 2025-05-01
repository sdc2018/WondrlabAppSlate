import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';

// Import services
import userService from '../services/userService';
import clientService, { Client, ClientInput } from '../services/clientService';
import serviceService, { Service } from '../services/serviceService';

// Industries for dropdown
const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Entertainment',
  'Food & Beverage'
];

// Status options
const statusOptions = ['active', 'inactive', 'prospect'];

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accountOwners, setAccountOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingAccountOwners, setLoadingAccountOwners] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    account_owner_id: 0,
    services_used: [] as number[],
    crm_link: '',
    notes: '',
    status: 'active'
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch clients, services, and account owners when component mounts
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingServices(true);
        setLoadingAccountOwners(true);
        
        // Fetch clients
      try {
          const response = await clientService.getAllClients();
          
          // Log the response for debugging
          console.log('Clients API response:', response);
          
          // Ensure we have an array of clients
          let data: Client[] = [];
          
          if (Array.isArray(response)) {
            // If response is already an array, use it directly
            data = response;
          } else if (response && typeof response === 'object') {
            // If response is an object with a data property that's an array
            const responseObj = response as any;
            if (responseObj.data && Array.isArray(responseObj.data)) {
              data = responseObj.data;
            }
          }
          
          setClients(data);
          setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
        
        // Fetch services
        try {
          const response = await serviceService.getAllServices();
          
          // Log the response for debugging
          console.log('Services API response:', response);
          
          // Ensure we have an array of services
          let servicesData: Service[] = [];
          
          if (Array.isArray(response)) {
            // If response is already an array, use it directly
            servicesData = response;
          } else if (response && typeof response === 'object') {
            // If response is an object with a data property that's an array
            const responseObj = response as any;
            if (responseObj.data && Array.isArray(responseObj.data)) {
              servicesData = responseObj.data;
            }
          }
          
          setServices(servicesData);
        } catch (err) {
          console.error('Error fetching services:', err);
        } finally {
          setLoadingServices(false);
        }
        
        // Fetch account owners (sales users)
        try {
          const salesUsers = await userService.getSalesUsers();
          setAccountOwners(salesUsers);
        } catch (err) {
          console.error('Error fetching account owners:', err);
        } finally {
          setLoadingAccountOwners(false);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An error occurred while loading data.');
        setLoading(false);
        setLoadingServices(false);
        setLoadingAccountOwners(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (client: Client | null = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        name: client.name,
        industry: client.industry,
        contact_name: client.contact_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address || '',
        account_owner_id: client.account_owner_id,
        services_used: client.services_used,
        crm_link: client.crm_link || '',
        notes: client.notes || '',
        status: client.status
      });
    } else {
      setCurrentClient(null);
      setFormData({
        name: '',
        industry: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        account_owner_id: 0,
        services_used: [],
        crm_link: '',
        notes: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClient(null);
    setError(null);
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    const numericFields = ['account_owner_id'];
    const fieldValue = numericFields.includes(name) ? parseInt(value, 10) : value;
    
    setFormData({
      ...formData,
      [name]: fieldValue
    });
  };

  // Handle services multi-select
  const handleServicesChange = (_event: React.SyntheticEvent, value: Service[]) => {
    setFormData({
      ...formData,
      services_used: value.map(service => service.id)
    });
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.industry || !formData.account_owner_id) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting client with data:', formData);
      
      if (currentClient) {
        // Update existing client - store the response
        const updatedClient = await clientService.updateClient(currentClient.id, formData);
        console.log('Client updated successfully:', updatedClient);
        
        // Update the client in the local state immediately
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === currentClient.id ? { ...client, ...updatedClient } : client
          )
        );
        
        // Then refresh the full list to ensure consistency
        const updatedClients = await clientService.getAllClients();
        setClients(updatedClients);
      } else {
        // Add new client
        const newClient = await clientService.createClient(formData as ClientInput);
        console.log('Client created successfully:', newClient);
        
        // Refresh client list
        const updatedClients = await clientService.getAllClients();
        setClients(updatedClients);
      }
      
      // Close the dialog after state updates are complete
      setTimeout(() => {
        setOpenDialog(false);
        setCurrentClient(null);
      }, 100);
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }
    
    try {
      await clientService.deleteClient(id);
      
      // Update local state
      setClients(clients.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'prospect':
        return 'info';
      default:
        return 'default';
    }
  };

  // Helper function to get account owner name
  const getAccountOwnerName = (ownerId: number) => {
    const owner = accountOwners.find(o => o.id === ownerId);
    return owner ? owner.username : 'Unknown';
  };

  // Helper function to get service names for a client
  const getServiceNames = (serviceIds: number[]) => {
    return services
      .filter(service => serviceIds.includes(service.id))
      .map(service => service.name);
  };

  if (loading || loadingServices || loadingAccountOwners) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Clients</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Client
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {clients.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No clients found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the "Add Client" button to create your first client.
          </Typography>
        </Paper>
      ) : (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Account Owner</TableCell>
              <TableCell>Services Used</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BusinessIcon color="primary" fontSize="small" />
                    <div>
                      <Typography variant="body1">{client.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {client.contact_name}
                      </Typography>
                    </div>
                  </Stack>
                </TableCell>
                <TableCell>{client.industry}</TableCell>
                <TableCell>{getAccountOwnerName(client.account_owner_id)}</TableCell>
                <TableCell>
                  {client.services_used.length > 0 
                    ? getServiceNames(client.services_used).join(', ')
                    : <Typography variant="caption" color="text.secondary">No services</Typography>}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={client.status} 
                    color={getStatusColor(client.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(client)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(client.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Add/Edit Client Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Client Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Industry</InputLabel>
              <Select
                name="industry"
                value={formData.industry}
                label="Industry"
                onChange={handleSelectChange}
              >
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="Contact Name"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Contact Email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Contact Phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={2}
              value={formData.address}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Account Owner</InputLabel>
              <Select
                name="account_owner_id"
                value={formData.account_owner_id.toString()}
                label="Account Owner"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    account_owner_id: parseInt(e.target.value, 10)
                  });
                }}
              >
                <MenuItem value="0">Select Account Owner</MenuItem>
                {accountOwners.map((owner) => (
                  <MenuItem key={owner.id} value={owner.id.toString()}>{owner.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                multiple
                options={services}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={services.filter(service => formData.services_used.includes(service.id))}
                onChange={handleServicesChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Services Used"
                    placeholder="Select services"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({option.business_unit})
                    </Typography>
                  </li>
                )}
              />
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="CRM Link"
              name="crm_link"
              value={formData.crm_link}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              name="notes"
              value={formData.notes}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : currentClient ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clients;