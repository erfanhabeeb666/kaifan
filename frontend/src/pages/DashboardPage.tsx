import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  alpha,
  useTheme,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneCallback as PhoneCallbackIcon,
  PhoneMissed as PhoneMissedIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Queue as QueueIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboard, createCustomer } from '../api/endpoints';
import { useDashboardStore } from '../stores/dashboardStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { EmployeeStatus } from '../types';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

const statusColors: Record<EmployeeStatus, string> = {
  AVAILABLE: '#10B981',
  BUSY: '#EF4444',
  OFFLINE: '#64748B',
};

const statusLabels: Record<EmployeeStatus, string> = {
  AVAILABLE: 'Available',
  BUSY: 'On Call',
  OFFLINE: 'Offline',
};

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, gradient, subtitle }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const { dashboard, setDashboard } = useDashboardStore();
  const queryClient = useQueryClient();
  const [openNameDialog, setOpenNameDialog] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');

  const saveCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
      toast.success('Customer name saved!');
      setOpenNameDialog(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save customer name');
    },
  });

  const handleOpenDialog = (phone: string, currentName?: string | null) => {
    setSelectedPhone(phone);
    setCustomerNameInput(currentName || '');
    setOpenNameDialog(true);
  };

  const handleSaveName = () => {
    saveCustomerMutation.mutate({
      phoneNumber: selectedPhone,
      name: customerNameInput.trim() || undefined,
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await getDashboard();
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (data) {
      setDashboard(data);
    }
  }, [data, setDashboard]);

  const d = dashboard;

  if (isLoading && !d) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4 }}>Dashboard</Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const analytics = d?.analytics;

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time call center monitoring
          </Typography>
        </Box>
        <Chip
          label="● Live"
          size="small"
          sx={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontWeight: 700,
            animation: 'pulse 2s infinite',
          }}
        />
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Calls Today"
            value={analytics?.callsToday ?? 0}
            icon={<PhoneIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #6C63FF, #8B84FF)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Week"
            value={analytics?.callsThisWeek ?? 0}
            icon={<TrendingUpIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #3B82F6, #60A5FA)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Answered"
            value={analytics?.answeredCalls ?? 0}
            icon={<PhoneCallbackIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #10B981, #34D399)"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Missed"
            value={analytics?.missedCalls ?? 0}
            icon={<PhoneMissedIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #EF4444, #F87171)"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Wait"
            value={formatDuration(analytics?.averageWaitTimeSeconds ? Math.round(analytics.averageWaitTimeSeconds) : null)}
            icon={<TimerIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #F59E0B, #FBBF24)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Longest Wait"
            value={formatDuration(analytics?.longestWaitTimeSeconds)}
            icon={<AccessTimeIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #F97316, #FB923C)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Duration"
            value={formatDuration(analytics?.averageCallDurationSeconds ? Math.round(analytics.averageCallDurationSeconds) : null)}
            icon={<PhoneIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #8B5CF6, #A78BFA)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Queue Length"
            value={analytics?.currentQueueLength ?? 0}
            icon={<QueueIcon sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #EC4899, #F472B6)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Call */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="primary" /> Active Call
              </Typography>
              {d?.activeCall ? (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: alpha(theme.palette.success.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                      {d.activeCall.callerNumber}
                    </Typography>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => d?.activeCall && handleOpenDialog(d.activeCall.callerNumber, d.activeCall.customerName)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {d.activeCall.customerName ? (
                    <Typography variant="subtitle1" color="primary" fontWeight={600} sx={{ mt: 0.5 }}>
                      👤 {d.activeCall.customerName}
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, cursor: 'pointer', textDecoration: 'underline', display: 'inline-block' }}
                      onClick={() => d?.activeCall && handleOpenDialog(d.activeCall.callerNumber)}
                    >
                      Add customer name
                    </Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={d.activeCall.status}
                      size="small"
                      sx={{
                        background: alpha(theme.palette.success.main, 0.15),
                        color: theme.palette.success.main,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  {d.activeCall.employeeName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Handled by: {d.activeCall.employeeName}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Connected: {dayjs(d.activeCall.answerTime || d.activeCall.startTime).fromNow()}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: alpha(theme.palette.text.secondary, 0.03),
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">No active calls</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Queue */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QueueIcon color="primary" /> Call Queue
                </Typography>
                <Chip
                  label={`${d?.queueEntries?.length || 0} waiting`}
                  size="small"
                  color={d?.queueEntries?.length ? 'warning' : 'default'}
                  variant="outlined"
                />
              </Box>
              {d?.queueEntries && d.queueEntries.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Phone Number</TableCell>
                        <TableCell>Wait Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {d.queueEntries.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell>
                            <Chip label={entry.queuePosition} size="small" />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography fontWeight={600} variant="body2">{entry.callerNumber}</Typography>
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => handleOpenDialog(entry.callerNumber, entry.customerName)}
                                sx={{ p: 0.25 }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                            {entry.customerName ? (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {entry.customerName}
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{ cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }}
                                onClick={() => handleOpenDialog(entry.callerNumber)}
                              >
                                Add name
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{dayjs(entry.queuedAt).fromNow(true)}</TableCell>
                          <TableCell>
                            <Chip
                              label={entry.status}
                              size="small"
                              color={entry.status === 'WAITING' ? 'warning' : 'success'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: alpha(theme.palette.text.secondary, 0.03),
                  }}
                >
                  <QueueIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography color="text.secondary">Queue is empty</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Employees */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" /> Employee Status
              </Typography>
              <Grid container spacing={2}>
                {d?.employees?.map((emp) => (
                  <Grid item xs={12} sm={6} md={4} key={emp.id}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: `1px solid ${alpha(statusColors[emp.status], 0.2)}`,
                        background: alpha(statusColors[emp.status], 0.05),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: alpha(statusColors[emp.status], 0.4),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: statusColors[emp.status],
                          boxShadow: `0 0 8px ${statusColors[emp.status]}`,
                          ...(emp.status === 'AVAILABLE' && {
                            animation: 'pulse 2s infinite',
                          }),
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>{emp.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.phoneNumber}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabels[emp.status]}
                        size="small"
                        sx={{
                          background: alpha(statusColors[emp.status], 0.15),
                          color: statusColors[emp.status],
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
                {(!d?.employees || d.employees.length === 0) && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No employees found</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit/Add Customer Name Dialog */}
      <Dialog open={openNameDialog} onClose={() => setOpenNameDialog(false)}>
        <DialogTitle>Save Customer Name</DialogTitle>
        <DialogContent sx={{ pt: 1, minWidth: 320 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a name for caller number: <strong>{selectedPhone}</strong>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Customer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={customerNameInput}
            onChange={(e) => setCustomerNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenNameDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveName}
            variant="contained"
            disabled={saveCustomerMutation.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
