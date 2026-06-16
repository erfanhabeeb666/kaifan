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
  Tooltip,
  Pagination,
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
  Restaurant as RestaurantIcon,
  Visibility as ViewIcon,
  LocalShipping as DeliveryIcon,
  ShoppingBag as OrdersIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboard, createCustomer, getPetpoojaOrders } from '../api/endpoints';
import { useDashboardStore } from '../stores/dashboardStore';
import CallPopup from '../components/CallPopup';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { EmployeeStatus, CallLogResponse } from '../types';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

const statusColors: Record<EmployeeStatus, string> = {
  AVAILABLE: '#22C55E',
  BUSY: '#EF4444',
  OFFLINE: '#94A3B8',
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
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.12)}`,
          borderColor: alpha(color, 0.2),
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1, fontSize: '1.5rem' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: color,
              '& .MuiSvgIcon-root': { fontSize: 20 },
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
  const [callPopupOpen, setCallPopupOpen] = useState(false);
  const [callPopupCall, setCallPopupCall] = useState<CallLogResponse | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);

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

  // Fetch PetPooja orders for the dashboard
  const { data: petpoojaOrdersData } = useQuery({
    queryKey: ['petpoojaOrders', ordersPage],
    queryFn: async () => {
      const res = await getPetpoojaOrders({ page: ordersPage - 1, size: 5 });
      return res.data.data;
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (data) {
      setDashboard(data);
    }
  }, [data, setDashboard]);

  // Auto-open call popup when a call gets connected
  useEffect(() => {
    if (dashboard?.activeCall && dashboard.activeCall.status === 'CONNECTED') {
      setCallPopupCall(dashboard.activeCall);
      setCallPopupOpen(true);
    }
  }, [dashboard?.activeCall?.callSid, dashboard?.activeCall?.status]);

  const d = dashboard;

  if (isLoading && !d) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={110} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const analytics = d?.analytics;
  const ppOrders = petpoojaOrdersData?.content || [];
  const ppTotalPages = petpoojaOrdersData?.totalPages || 1;

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 }, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, display: { xs: 'none', sm: 'block' } }}>
            Real-time call center overview
          </Typography>
        </Box>
        <Chip
          label="● Live"
          size="small"
          sx={{
            background: alpha('#22C55E', 0.1),
            color: '#22C55E',
            fontWeight: 700,
            fontSize: '0.72rem',
            animation: 'pulse 2s infinite',
          }}
        />
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Calls Today"
            value={analytics?.callsToday ?? 0}
            icon={<PhoneIcon />}
            color="#0EA5E9"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="This Week"
            value={analytics?.callsThisWeek ?? 0}
            icon={<TrendingUpIcon />}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Answered"
            value={analytics?.answeredCalls ?? 0}
            icon={<PhoneCallbackIcon />}
            color="#22C55E"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Missed"
            value={analytics?.missedCalls ?? 0}
            icon={<PhoneMissedIcon />}
            color="#EF4444"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Wait"
            value={formatDuration(analytics?.averageWaitTimeSeconds ? Math.round(analytics.averageWaitTimeSeconds) : null)}
            icon={<TimerIcon />}
            color="#F59E0B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Longest Wait"
            value={formatDuration(analytics?.longestWaitTimeSeconds)}
            icon={<AccessTimeIcon />}
            color="#F97316"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Duration"
            value={formatDuration(analytics?.averageCallDurationSeconds ? Math.round(analytics.averageCallDurationSeconds) : null)}
            icon={<PhoneIcon />}
            color="#8B5CF6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Queue Length"
            value={analytics?.currentQueueLength ?? 0}
            icon={<QueueIcon />}
            color="#EC4899"
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {/* Active Call */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                <PhoneIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} /> Active Call
              </Typography>
              {d?.activeCall ? (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: alpha(theme.palette.success.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
                      {d.activeCall.callerNumber}
                    </Typography>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => d?.activeCall && handleOpenDialog(d.activeCall.callerNumber, d.activeCall.customerName)}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  {d.activeCall.customerName ? (
                    <Typography variant="body2" color="primary" fontWeight={600} sx={{ mt: 0.5 }}>
                      {d.activeCall.customerName}
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, cursor: 'pointer', textDecoration: 'underline', display: 'inline-block' }}
                      onClick={() => d?.activeCall && handleOpenDialog(d.activeCall.callerNumber)}
                    >
                      Add customer name
                    </Typography>
                  )}
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={d.activeCall.status}
                      size="small"
                      sx={{
                        background: alpha(theme.palette.success.main, 0.12),
                        color: theme.palette.success.main,
                        fontWeight: 700,
                      }}
                    />
                    <Tooltip title="View customer details & orders">
                      <Chip
                        icon={<ViewIcon sx={{ fontSize: 14 }} />}
                        label="View Details"
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => {
                          setCallPopupCall(d?.activeCall || null);
                          setCallPopupOpen(true);
                        }}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      />
                    </Tooltip>
                  </Box>
                  {d.activeCall.employeeName && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Handled by: {d.activeCall.employeeName}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: 'block' }}>
                    Connected: {dayjs(d.activeCall.answerTime || d.activeCall.startTime).fromNow()}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2.5,
                    background: alpha(theme.palette.text.secondary, 0.02),
                    border: `1px dashed ${theme.palette.divider}`,
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.2, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No active calls</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Queue */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                  <QueueIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} /> Call Queue
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
                    borderRadius: 2.5,
                    background: alpha(theme.palette.text.secondary, 0.02),
                    border: `1px dashed ${theme.palette.divider}`,
                  }}
                >
                  <QueueIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.2, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Queue is empty</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* PetPooja Recent Orders */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                  <OrdersIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} /> PetPooja Orders
                </Typography>
                <Chip
                  label={`${petpoojaOrdersData?.totalElements ?? 0} total`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              {ppOrders.length > 0 ? (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ppOrders.map((order) => (
                          <TableRow key={order.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                #{order.petpoojaOrderId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {order.customerName || order.customerPhone}
                              </Typography>
                              {order.customerName && (
                                <Typography variant="caption" color="text.secondary">
                                  {order.customerPhone}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>
                              {order.items && order.items.length > 0 ? (
                                <Box>
                                  {order.items.slice(0, 2).map((item, idx) => (
                                    <Typography key={idx} variant="caption" display="block" noWrap>
                                      {item.quantity}× {item.name}
                                    </Typography>
                                  ))}
                                  {order.items.length > 2 && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{order.items.length - 2} more
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {order.orderType && (
                                <Chip
                                  icon={order.orderType.toLowerCase().includes('delivery')
                                    ? <DeliveryIcon sx={{ fontSize: 14 }} />
                                    : <RestaurantIcon sx={{ fontSize: 14 }} />}
                                  label={order.orderType}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={order.orderStatus || '—'}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  background: order.orderStatus === 'Delivered' || order.orderStatus === 'Completed'
                                    ? alpha('#22C55E', 0.1)
                                    : alpha('#94A3B8', 0.08),
                                  color: order.orderStatus === 'Delivered' || order.orderStatus === 'Completed'
                                    ? '#22C55E'
                                    : '#94A3B8',
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>
                                ₹{order.totalAmount?.toFixed(0) ?? '0'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {order.orderPlacedAt
                                  ? dayjs(order.orderPlacedAt).format('MMM D, HH:mm')
                                  : '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {ppTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                      <Pagination
                        count={ppTotalPages}
                        page={ordersPage}
                        onChange={(_, val) => setOrdersPage(val)}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2.5,
                    background: alpha(theme.palette.text.secondary, 0.02),
                    border: `1px dashed ${theme.palette.divider}`,
                  }}
                >
                  <OrdersIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.2, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No PetPooja orders yet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Orders from PetPooja will appear here once synced
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Employees */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                <PersonIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} /> Employee Status
              </Typography>
              <Grid container spacing={{ xs: 1, md: 1.5 }}>
                {d?.employees?.map((emp) => (
                  <Grid item xs={12} sm={6} md={4} key={emp.id}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(statusColors[emp.status], 0.12)}`,
                        background: alpha(statusColors[emp.status], 0.03),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: alpha(statusColors[emp.status], 0.25),
                          background: alpha(statusColors[emp.status], 0.05),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: statusColors[emp.status],
                          boxShadow: `0 0 6px ${statusColors[emp.status]}`,
                          flexShrink: 0,
                          ...(emp.status === 'AVAILABLE' && {
                            animation: 'pulse 2s infinite',
                          }),
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={600} fontSize="0.85rem" noWrap>{emp.name}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize="0.72rem">
                          {emp.phoneNumber}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabels[emp.status]}
                        size="small"
                        sx={{
                          background: alpha(statusColors[emp.status], 0.1),
                          color: statusColors[emp.status],
                          fontWeight: 700,
                          fontSize: '0.68rem',
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
                {(!d?.employees || d.employees.length === 0) && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No employees found</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit/Add Customer Name Dialog */}
      <Dialog open={openNameDialog} onClose={() => setOpenNameDialog(false)} fullWidth maxWidth="xs">
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

      {/* Call Popup with Customer Details & Order History */}
      <CallPopup
        open={callPopupOpen}
        onClose={() => setCallPopupOpen(false)}
        activeCall={callPopupCall}
      />
    </Box>
  );
}
