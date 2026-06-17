import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  Grid,
  alpha,
  useTheme,
  Skeleton,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { PhoneCallback as PhoneCallbackIcon, Edit as EditIcon, ShoppingCart as CartIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCallHistory, initiateCallback, createCustomer } from '../api/endpoints';
import dayjs from 'dayjs';
import type { CallStatus, CallCenterOrderResponse } from '../types';
import toast from 'react-hot-toast';
import { NewOrderDrawer } from '../components/NewOrderDrawer';
import { OrderSuccessDialog } from '../components/OrderSuccessDialog';

const callStatusColors: Record<CallStatus, { bg: string; text: string }> = {
  INCOMING: { bg: 'rgba(59, 130, 246, 0.08)', text: '#3B82F6' },
  QUEUED: { bg: 'rgba(245, 158, 11, 0.08)', text: '#D97706' },
  CONNECTED: { bg: 'rgba(34, 197, 94, 0.08)', text: '#16A34A' },
  COMPLETED: { bg: 'rgba(14, 165, 233, 0.08)', text: '#0284C7' },
  MISSED: { bg: 'rgba(239, 68, 68, 0.08)', text: '#DC2626' },
  ABANDONED: { bg: 'rgba(148, 163, 184, 0.08)', text: '#64748B' },
};

import api from '../api/axios';

const AudioPlayer = ({ callId }: { callId: number }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/calls/${callId}/recording`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setBlobUrl(url);
    } catch (e) {
      toast.error('Failed to load recording');
    } finally {
      setLoading(false);
    }
  };

  if (blobUrl) {
    return <audio controls src={blobUrl} style={{ height: '30px', width: '180px' }} autoPlay />;
  }

  return (
    <Button size="small" onClick={handleLoad} disabled={loading} variant="outlined" sx={{ textTransform: 'none', height: '30px' }}>
      {loading ? 'Loading...' : 'Load Recording'}
    </Button>
  );
};

export default function CallHistoryPage() {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [callerNumber, setCallerNumber] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const queryClient = useQueryClient();

  const [openNameDialog, setOpenNameDialog] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');

  const [newOrderDrawerOpen, setNewOrderDrawerOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<CallCenterOrderResponse | null>(null);
  const [activeOrderPhone, setActiveOrderPhone] = useState('');
  const [activeOrderName, setActiveOrderName] = useState('');

  const handleOpenOrderDrawer = (phone: string, name?: string | null) => {
    setActiveOrderPhone(phone);
    setActiveOrderName(name || '');
    setNewOrderDrawerOpen(true);
  };

  const saveCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
    queryKey: ['callHistory', page, size, callerNumber, statusFilter],
    queryFn: async () => {
      const res = await getCallHistory({
        page,
        size,
        callerNumber: callerNumber || undefined,
        status: (statusFilter as CallStatus) || undefined,
      });
      return res.data.data;
    },
  });

  const callbackMutation = useMutation({
    mutationFn: initiateCallback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
      toast.success('Callback call initiated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to initiate callback');
    },
  });

  const handleCallback = (id: number) => {
    callbackMutation.mutate(id);
  };

  return (
    <Box className="animate-fade-in">
      <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>Call History</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 3 } }}>
        View and filter all incoming calls
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                id="filter-phone"
                fullWidth
                size="small"
                label="Phone Number"
                value={callerNumber}
                onChange={(e) => { setCallerNumber(e.target.value); setPage(0); }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                id="filter-status"
                fullWidth
                size="small"
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="INCOMING">Incoming</MenuItem>
                <MenuItem value="QUEUED">Queued</MenuItem>
                <MenuItem value="CONNECTED">Connected</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="MISSED">Missed</MenuItem>
                <MenuItem value="ABANDONED">Abandoned</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Recording</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.content?.map((call) => {
                      const colors = callStatusColors[call.status];
                      return (
                        <TableRow key={call.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography fontWeight={600} variant="body2">{call.callerNumber}</Typography>
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => handleOpenDialog(call.callerNumber, call.customerName)}
                                sx={{ p: 0.25 }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                            {call.customerName ? (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {call.customerName}
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{ cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }}
                                onClick={() => handleOpenDialog(call.callerNumber)}
                              >
                                Add name
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={call.status}
                              size="small"
                              sx={{
                                background: colors.bg,
                                color: colors.text,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{call.employeeName || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {call.durationSeconds
                                ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {call.recordingUrl ? (
                              <AudioPlayer callId={call.id} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title="Create New Order">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenOrderDrawer(call.callerNumber, call.customerName)}
                                >
                                  <CartIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {(call.status === 'MISSED' || call.status === 'ABANDONED') && (
                                <Tooltip title="Call Back">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleCallback(call.id)}
                                    disabled={callbackMutation.isPending}
                                  >
                                    <PhoneCallbackIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {data?.content?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">No call records found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={data?.totalElements ?? 0}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={size}
                onRowsPerPageChange={(e) => {
                  setSize(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

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

      <NewOrderDrawer
        open={newOrderDrawerOpen}
        onClose={() => setNewOrderDrawerOpen(false)}
        customerPhone={activeOrderPhone}
        initialCustomerName={activeOrderName}
        onSuccess={(order) => {
          setPlacedOrder(order);
          setSuccessDialogOpen(true);
        }}
      />

      <OrderSuccessDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        order={placedOrder}
      />
    </Box>
  );
}
