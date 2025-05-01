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
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Import services
import taskService, { Task, TaskInput, TaskWithDetails } from '../services/taskService';
import opportunityService from '../services/opportunityService';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

// Status options
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
];

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskWithDetails | null>(null);
  const [formData, setFormData] = useState<Partial<TaskInput>>({
    name: '',
    opportunity_id: 0,
    assigned_user_id: 0,
    due_date: '',
    status: 'pending',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // 'all', 'my', 'overdue'

  // Fetch tasks based on filter
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        let data;
        
        // Fetch tasks based on filter
        if (filter === 'my' && user) {
          data = await taskService.getTasksByAssignedUser(user.id);
        } else if (filter === 'overdue') {
          data = await taskService.getOverdueTasks();
        } else {
          data = await taskService.getAllTasks();
        }
        
        // Enhance task data with related information if needed
        const enhancedTasks = await Promise.all(data.map(async (task: Task) => {
          try {
            // If we already have details, return as is
            if ('opportunity_name' in task) {
              return task as TaskWithDetails;
            }
            
            // Otherwise, fetch related data
            const opportunity = await opportunityService.getOpportunityById(task.opportunity_id);
            const assignedUser = await userService.getUserById(task.assigned_user_id);
            
            return {
              ...task,
              opportunity_name: opportunity.name,
              client_name: 'Unknown', // Would need to fetch client details
              service_name: 'Unknown', // Would need to fetch service details
              assigned_user_name: assignedUser.username,
              business_unit: 'Unknown' // Would need to fetch business unit
            } as TaskWithDetails;
          } catch (err) {
            console.error('Error enhancing task data:', err);
            // Return with default values if enhancement fails
            return {
              ...task,
              opportunity_name: 'Unknown',
              client_name: 'Unknown',
              service_name: 'Unknown',
              assigned_user_name: 'Unknown',
              business_unit: 'Unknown'
            } as TaskWithDetails;
          }
        }));
        
        setTasks(enhancedTasks);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [filter, user]);

  // Fetch opportunities for dropdown
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const data = await opportunityService.getAllOpportunities();
        
        // Enhance with client and service names if needed
        const enhancedOpportunities = await Promise.all(data.map(async (opportunity) => {
          try {
            return {
              ...opportunity,
              client_name: 'Unknown', // Would need to fetch client details
              service_name: 'Unknown'  // Would need to fetch service details
            };
          } catch (err) {
            return {
              ...opportunity,
              client_name: 'Unknown',
              service_name: 'Unknown'
            };
          }
        }));
        
        setOpportunities(enhancedOpportunities);
      } catch (err) {
        console.error('Error fetching opportunities:', err);
      }
    };

    fetchOpportunities();
  }, []);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleOpenDialog = (task: TaskWithDetails | null = null) => {
    if (task) {
      setCurrentTask(task);
      setFormData({
        name: task.name,
        opportunity_id: task.opportunity_id,
        assigned_user_id: task.assigned_user_id,
        due_date: task.due_date.split('T')[0], // Format date for input field
        status: task.status,
        description: task.description
      });
    } else {
      setCurrentTask(null);
      setFormData({
        name: '',
        opportunity_id: 0,
        assigned_user_id: 0,
        due_date: '',
        status: 'pending',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTask(null);
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
    setFormData({
      ...formData,
      [name]: name === 'opportunity_id' || name === 'assigned_user_id' 
        ? parseInt(value, 10) 
        : value
    });
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.opportunity_id || !formData.assigned_user_id || !formData.due_date || !formData.status) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      if (currentTask) {
        // Update existing task
        await taskService.updateTask(currentTask.id, formData);
      } else {
        // Create new task
        await taskService.createTask(formData as TaskInput);
      }
      
      // Refresh task list based on current filter
      const fetchUpdatedTasks = async () => {
        let data;
        
        if (filter === 'my' && user) {
          data = await taskService.getTasksByAssignedUser(user.id);
        } else if (filter === 'overdue') {
          data = await taskService.getOverdueTasks();
        } else {
          data = await taskService.getAllTasks();
        }
        
        // Enhance task data with related information
        const enhancedTasks = await Promise.all(data.map(async (task: Task) => {
          try {
            // If we already have details, return as is
            if ('opportunity_name' in task) {
              return task as TaskWithDetails;
      }
      
            // Otherwise, fetch related data
            const opportunity = await opportunityService.getOpportunityById(task.opportunity_id);
            const assignedUser = await userService.getUserById(task.assigned_user_id);
            
            return {
              ...task,
              opportunity_name: opportunity.name,
              client_name: 'Unknown',
              service_name: 'Unknown',
              assigned_user_name: assignedUser.username,
              business_unit: 'Unknown'
            } as TaskWithDetails;
          } catch (err) {
            console.error('Error enhancing task data:', err);
            return {
              ...task,
              opportunity_name: 'Unknown',
              client_name: 'Unknown',
              service_name: 'Unknown',
              assigned_user_name: 'Unknown',
              business_unit: 'Unknown'
            } as TaskWithDetails;
          }
        }));
        
        setTasks(enhancedTasks);
      };
      
      await fetchUpdatedTasks();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      setLoading(true);
      await taskService.deleteTask(id);
      
      // Update local state
      setTasks(tasks.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const isTaskOverdue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return taskDueDate < today && taskDueDate.getTime() !== today.getTime();
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Task
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant={filter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilter('all')}
        >
          All Tasks
        </Button>
        <Button 
          variant={filter === 'my' ? 'contained' : 'outlined'}
          onClick={() => setFilter('my')}
        >
          My Tasks
        </Button>
        <Button 
          variant={filter === 'overdue' ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setFilter('overdue')}
        >
          Overdue Tasks
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
              <TableCell>Task</TableCell>
              <TableCell>Opportunity</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No tasks found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue = isTaskOverdue(task.due_date) && task.status !== 'completed';
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AssignmentIcon color="primary" fontSize="small" />
                        <Typography variant="body1">{task.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`Client: ${task.client_name} | Service: ${task.service_name}`}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <TrendingUpIcon fontSize="small" />
                          <Typography variant="body2">{task.opportunity_name}</Typography>
                        </Stack>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">{task.assigned_user_name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EventIcon fontSize="small" color={isOverdue ? "error" : "inherit"} />
                        <Typography 
                          variant="body2" 
                          color={isOverdue ? "error" : "inherit"}
                          sx={{ fontWeight: isOverdue ? 'bold' : 'normal' }}
                        >
                          {new Date(task.due_date).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusOptions.find(s => s.value === task.status)?.label || task.status} 
                        color={getStatusColor(task.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDialog(task)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(task.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Task Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Opportunity</InputLabel>
              <Select
                name="opportunity_id"
                value={formData.opportunity_id ? formData.opportunity_id.toString() : '0'}
                label="Opportunity"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    opportunity_id: parseInt(e.target.value, 10)
                  });
                }}
              >
                <MenuItem value="0">Select Opportunity</MenuItem>
                {opportunities.map((opportunity) => (
                  <MenuItem key={opportunity.id} value={opportunity.id.toString()}>
                    {opportunity.name} ({opportunity.client_name || 'Unknown Client'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Assigned To</InputLabel>
              <Select
                name="assigned_user_id"
                value={formData.assigned_user_id ? formData.assigned_user_id.toString() : '0'}
                label="Assigned To"
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
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status || 'pending'}
                label="Status"
                onChange={handleSelectChange}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : currentTask ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;