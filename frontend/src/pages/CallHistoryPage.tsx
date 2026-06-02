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
import { PhoneCallback as PhoneCallbackIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCallHistory, initiateCallback, createCustomer } from '../api/endpoints';
import dayjs from 'dayjs';
import type { CallStatus } from '../types';
import toast from 'react-hot-toast';

const callStatusColors: Record<CallStatus, { bg: string; text: string }> = {
  INCOMING: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  QUEUED: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
  CONNECTED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
  COMPLETED: { bg: 'rgba(108, 99, 255, 0.1)', text: '#6C63FF' },
  MISSED: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  ABANDONED: { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748B' },
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
      <Typography variant="h4" sx={{ mb: 1 }}>Call History</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        View and filter all incoming calls
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                id="filter-phone"
                fullWidth
                size="small"
                label="Phone Number"
                value={callerNumber}
                onChange={(e) => { setCallerNumber(e.target.value); setPage(0); }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                <Skeleton key={i} height={50} sx={{ mb: 1, borderRadius: 2 }} />
              ))}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>Call SID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.content?.map((call) => {
                      const colors = callStatusColors[call.status];
                      return (
                        <TableRow key={call.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
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
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {call.callSid}
                            </Typography>
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
                          <TableCell>{call.employeeName || '—'}</TableCell>
                          <TableCell>
                            {dayjs(call.startTime).format('MMM D, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            {call.endTime ? dayjs(call.endTime).format('MMM D, HH:mm:ss') : '—'}
                          </TableCell>
                          <TableCell>
                            {call.durationSeconds
                              ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`
                              : '—'}
                          </TableCell>
                          <TableCell align="right">
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {data?.content?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No call records found</Typography>
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
