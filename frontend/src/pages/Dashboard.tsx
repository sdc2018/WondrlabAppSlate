import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stack,
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TaskIcon from '@mui/icons-material/Task';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// Mock data for dashboard - will be replaced with actual API calls
const mockStats = {
  clients: { total: 24, active: 18, new: 3 },
  services: { total: 15, active: 12 },
  opportunities: { total: 42, new: 8, inProgress: 15, won: 12, lost: 7 },
  tasks: { total: 36, pending: 14, inProgress: 10, completed: 12, overdue: 5 }
};

const mockRecentOpportunities = [
  { id: 1, name: 'Website Redesign for ABC Corp', client: 'ABC Corporation', status: 'in_progress', value: 75000 },
  { id: 2, name: 'Social Media Campaign', client: 'XYZ Industries', status: 'new', value: 45000 },
  { id: 3, name: 'SEO Optimization', client: 'Global Tech', status: 'won', value: 30000 },
  { id: 4, name: 'Mobile App Development', client: 'Innovate Solutions', status: 'in_progress', value: 120000 },
];

const mockOverdueTasks = [
  { id: 1, name: 'Follow up with client', opportunity: 'Website Redesign for ABC Corp', dueDate: '2023-04-15' },
  { id: 2, name: 'Send proposal', opportunity: 'Mobile App Development', dueDate: '2023-04-18' },
  { id: 3, name: 'Schedule kickoff meeting', opportunity: 'Social Media Campaign', dueDate: '2023-04-20' },
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  // Using the mock data directly to avoid unused setter warnings
  const stats = mockStats;
  const recentOpportunities = mockRecentOpportunities;
  const overdueTasks = mockOverdueTasks;

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // TODO: Replace with actual API calls
    // fetchDashboardStats();
    // fetchRecentOpportunities();
    // fetchOverdueTasks();

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <HourglassEmptyIcon color="info" />;
      case 'in_progress':
        return <HourglassEmptyIcon color="primary" />;
      case 'won':
        return <CheckCircleIcon color="success" />;
      case 'lost':
        return <PriorityHighIcon color="error" />;
      default:
        return <HourglassEmptyIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }} useFlexGap flexWrap="wrap">
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BusinessIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Clients</Typography>
            </Box>
            <Typography variant="h4">{stats.clients.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.clients.active} active, {stats.clients.new} new this month
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CategoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Services</Typography>
            </Box>
            <Typography variant="h4">{stats.services.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.services.active} active services
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Opportunities</Typography>
            </Box>
            <Typography variant="h4">{stats.opportunities.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.opportunities.new} new, {stats.opportunities.inProgress} in progress
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TaskIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Tasks</Typography>
            </Box>
            <Typography variant="h4">{stats.tasks.total}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ color: stats.tasks.overdue > 0 ? 'error.main' : 'text.secondary' }}>
              {stats.tasks.overdue} overdue tasks
            </Typography>
          </Paper>
        </Box>
      </Stack>
      
      {/* Recent Opportunities and Overdue Tasks */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} useFlexGap>
        <Box sx={{ flex: { xs: '1 1 100%', md: '7 7 calc(58.33% - 12px)' } }}>
          <Card>
            <CardHeader title="Recent Opportunities" />
            <Divider />
            <CardContent>
              <List>
                {recentOpportunities.map((opportunity) => (
                  <React.Fragment key={opportunity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(opportunity.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={opportunity.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {opportunity.client}
                            </Typography>
                            {' — $'}
                            {opportunity.value.toLocaleString()}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
        
        {/* Overdue Tasks */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '5 5 calc(41.67% - 12px)' } }}>
          <Card>
            <CardHeader 
              title="Overdue Tasks" 
              sx={{ color: 'error.main' }}
              avatar={<PriorityHighIcon color="error" />}
            />
            <Divider />
            <CardContent>
              <List>
                {overdueTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemIcon>
                        <TaskIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {task.opportunity}
                            </Typography>
                            {' — Due: '}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default Dashboard;