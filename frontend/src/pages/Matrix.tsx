import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableContainer, 
  TableHead, 
  TableBody,
  TableRow, 
  TableCell,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useNavigate } from 'react-router-dom';

// Services
import opportunityService, { MatrixData, Opportunity, OpportunityInput } from '../services/opportunityService';
import userService from '../services/userService';
import { User } from '../services/authService';

// Status options
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' }
];

// Priority options
const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const Matrix: React.FC = () => {
  const navigate = useNavigate();
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ clientId: number; serviceId: number } | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  // Form data for creating new opportunities
  const [formData, setFormData] = useState<OpportunityInput>({
    name: '',
    client_id: 0,
    service_id: 0,
    assigned_user_id: 0,
    status: 'new',
    priority: 'medium',
    estimated_value: 0,
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    // Fetch matrix data from API
    const fetchMatrixData = async () => {
      try {
        setLoading(true);
        // Get matrix data from the API
        const data = await opportunityService.getMatrixData();
        setMatrixData(data);
        
        // Get all opportunities for additional details
        const allOpportunities = await opportunityService.getAllOpportunities();
        setOpportunities(allOpportunities);
        
        // Get all users for the assigned user dropdown
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching matrix data:', err);
        setError('Failed to load matrix data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, []);

  const handleCellClick = (clientId: number, serviceId: number) => {
    // Check if there's an opportunity for this client-service combination
    const cell = matrixData?.matrix[clientId]?.[serviceId];
    
    if (cell && cell.status === 'opportunity' && cell.opportunity_id) {
      // Find the opportunity details
      const opportunity = opportunities.find(o => o.id === cell.opportunity_id);
      if (opportunity) {
        setSelectedOpportunity(opportunity);
        setOpenDetailsDialog(true);
        return;
      }
    }
    
    // If there's no opportunity, open the create dialog
    setSelectedCell({ clientId, serviceId });
    
    // Initialize form data with the selected client and service
    setFormData({
      name: '',
      client_id: clientId,
      service_id: serviceId,
      assigned_user_id: 0,
      status: 'new',
      priority: 'medium',
      estimated_value: 0,
      due_date: '',
      notes: ''
    });
    
    setOpenCreateDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedOpportunity(null);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setSelectedCell(null);
    setError(null);
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'estimated_value' ? Number(value) : value
    });
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'estimated_value' ? Number(value) : value
    });
  };

  const handleCreateOpportunity = async () => {
    // Validate form data
    if (!formData.name || !formData.client_id || !formData.service_id || !formData.assigned_user_id || !formData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Create new opportunity directly from the matrix
      const newOpportunity = await opportunityService.createOpportunity(formData);
      console.log('Opportunity created successfully:', newOpportunity);
      
      // Add the new opportunity to the local state
      setOpportunities([...opportunities, newOpportunity]);
      
      // Update the matrix data to reflect the new opportunity
      if (matrixData && selectedCell) {
        const updatedMatrix = { ...matrixData };
        
        // Ensure the matrix object has the client_id key
        if (!updatedMatrix.matrix[selectedCell.clientId]) {
          updatedMatrix.matrix[selectedCell.clientId] = {};
        }
        
        // Update the cell to show it now has an opportunity
        updatedMatrix.matrix[selectedCell.clientId][selectedCell.serviceId] = {
          status: 'opportunity',
          opportunity_id: newOpportunity.id
        };
        
        setMatrixData(updatedMatrix);
      }
      
      // Close the dialog
    handleCloseCreateDialog();
    } catch (err) {
      console.error('Error creating opportunity:', err);
      setError('Failed to create opportunity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCellStyle = (clientId: number, serviceId: number) => {
    const cell = matrixData?.matrix[clientId]?.[serviceId];
    
    if (!cell) {
      return {
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#e0e0e0',
        }
      };
    }
    
    if (cell.status === 'active') {
      return {
        backgroundColor: '#e8f5e9', // Light green
        cursor: 'default'
      };
    }
    
    if (cell.status === 'opportunity') {
      return {
        backgroundColor: '#fff8e1', // Light amber
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#ffecb3',
        }
      };
    }
    
    return {
      backgroundColor: '#f5f5f5',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#e0e0e0',
      }
    };
  };

  const getCellContent = (clientId: number, serviceId: number) => {
    const cell = matrixData?.matrix[clientId]?.[serviceId];
    
    if (!cell) {
      return (
        <Tooltip title="Create opportunity">
          <AddIcon color="disabled" fontSize="small" />
        </Tooltip>
      );
    }
    
    if (cell.status === 'active') {
      return (
        <Tooltip title="Active service">
          <CheckCircleIcon color="success" fontSize="small" />
        </Tooltip>
      );
    }
    
    if (cell.status === 'opportunity') {
      const opportunity = opportunities.find(o => o.id === cell.opportunity_id);
      return (
        <Tooltip title={`Opportunity: ${opportunity?.name || 'Unknown'}`}>
          <PendingIcon color="warning" fontSize="small" />
        </Tooltip>
      );
    }
    
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusChip = (status: string) => {
    let color;
    let label = status;
    
    // Find the status option to get the label
    const statusOption = statusOptions.find(s => s.value === status);
    if (statusOption) {
      label = statusOption.label;
    }
    
    // Determine color based on status
    switch (status) {
      case 'new':
        color = 'info';
        break;
      case 'in_progress':
        color = 'primary';
        break;
      case 'qualified':
        color = 'secondary';
        break;
      case 'proposal':
      case 'negotiation':
        color = 'warning';
        break;
      case 'won':
        color = 'success';
        break;
      case 'lost':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={label} color={color as any} size="small" />;
  };

  if (loading && !matrixData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Cross-Sell Opportunity Matrix</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Legend</Typography>
        <Stack direction="row" spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#e8f5e9', mr: 1 }} />
            <Typography variant="body2">Active Service</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#fff8e1', mr: 1 }} />
            <Typography variant="body2">Existing Opportunity</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#f5f5f5', mr: 1 }} />
            <Typography variant="body2">Potential Opportunity</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                {matrixData?.services.map(service => (
                  <TableCell key={service.id} align="center">
                    <Tooltip title={service.business_unit}>
                      <Typography variant="body2" noWrap>
                        {service.name}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {matrixData?.clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {client.name}
                    </Typography>
                  </TableCell>
                  {matrixData.services.map(service => (
                    <TableCell 
                      key={service.id} 
                      align="center"
                      onClick={() => handleCellClick(client.id, service.id)}
                      sx={getCellStyle(client.id, service.id)}
                    >
                      {getCellContent(client.id, service.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Opportunity Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">
              Opportunity Details
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedOpportunity && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedOpportunity.name}</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                      <Typography variant="body1">
                        {matrixData?.clients.find(c => c.id === selectedOpportunity.client_id)?.name}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Service</Typography>
                      <Typography variant="body1">
                        {(() => {
                          const service = matrixData?.services.find(s => s.id === selectedOpportunity.service_id);
                          return service ? `${service.name} (${service.business_unit})` : 'Unknown';
                        })()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1">
                        {users.find(u => u.id === selectedOpportunity.assigned_user_id)?.username || `ID: ${selectedOpportunity.assigned_user_id}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      {getStatusChip(selectedOpportunity.status)}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Estimated Value</Typography>
                      <Typography variant="body1">{formatCurrency(selectedOpportunity.estimated_value)}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                      <Typography variant="body1">
                        {new Date(selectedOpportunity.due_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
                
              <Box sx={{ width: '100%', mt: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{selectedOpportunity.notes}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedOpportunity) {
                navigate(`/opportunities`, { 
                  state: { 
                    editId: selectedOpportunity.id 
                  } 
                });
              }
              handleCloseDetailsDialog();
            }}
          >
            Edit Opportunity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Opportunity Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle>Create New Opportunity</DialogTitle>
        <DialogContent>
          {selectedCell && (
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Opportunity Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Client</InputLabel>
                <Select
                  name="client_id"
                  value={formData.client_id ? formData.client_id.toString() : '0'}
                  label="Client"
                  disabled // Disabled because it's pre-selected from the matrix
                >
                  {matrixData?.clients.map((client) => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Service</InputLabel>
                <Select
                  name="service_id"
                  value={formData.service_id ? formData.service_id.toString() : '0'}
                  label="Service"
                  disabled // Disabled because it's pre-selected from the matrix
                >
                  {matrixData?.services.map((service) => (
                    <MenuItem key={service.id} value={service.id.toString()}>
                      {service.name} ({service.business_unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Assigned User</InputLabel>
                <Select
                  name="assigned_user_id"
                  value={formData.assigned_user_id ? formData.assigned_user_id.toString() : '0'}
                  label="Assigned User"
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      assigned_user_id: parseInt(e.target.value, 10)
                    });
                  }}
                >
                  <MenuItem value="0">Select User</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.username} ({user.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleSelectChange}
                >
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ position: 'relative', mt: 2, mb: 1 }}>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    left: 14, 
                    top: 14, 
                    zIndex: 1,
                    color: 'action.active'
                  }}
                >
                  <AttachMoneyIcon fontSize="small" />
                </Box>
                <TextField
                  fullWidth
                  label="Estimated Value"
                  name="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={handleInputChange}
                  sx={{ 
                    '& input': { paddingLeft: '28px' }
                  }}
                />
              </Box>
              
              <TextField
                margin="normal"
                required
                fullWidth
                label="Due Date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleInputChange}
                sx={{ 
                  '& input': { paddingLeft: '10px' },
                  '& label': { transform: 'translate(14px, -9px) scale(0.75)' } 
                }}
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
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateOpportunity}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Opportunity'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Matrix;