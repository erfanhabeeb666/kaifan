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
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import { Delete as DeleteIcon, Block as BlockIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, getAllQueueEntries, removeFromQueue, markAbandoned } from '../api/endpoints';
import { useAuthStore } from '../stores/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';
import { useState } from 'react';

dayjs.extend(relativeTime);

export default function QueuePage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const isAdmin = role === 'ROLE_ADMIN';
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: number; action: string }>({
    open: false,
    id: 0,
    action: '',
  });

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['queue'],
    queryFn: async () => {
      const res = await getAllQueueEntries();
      return res.data.data;
    },
    refetchInterval: 5000,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Caller removed from queue');
    },
    onError: () => toast.error('Failed to remove caller'),
  });

  const abandonMutation = useMutation({
    mutationFn: markAbandoned,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Caller marked as abandoned');
    },
    onError: () => toast.error('Failed to mark as abandoned'),
  });

  const handleConfirm = () => {
    if (confirmDialog.action === 'remove') {
      removeMutation.mutate(confirmDialog.id);
    } else {
      abandonMutation.mutate(confirmDialog.id);
    }
    setConfirmDialog({ open: false, id: 0, action: '' });
  };

  const statusColor: Record<string, { bg: string; text: string }> = {
    WAITING: { bg: 'rgba(245, 158, 11, 0.08)', text: '#D97706' },
    CONNECTED: { bg: 'rgba(34, 197, 94, 0.08)', text: '#16A34A' },
    COMPLETED: { bg: 'rgba(14, 165, 233, 0.08)', text: '#0284C7' },
    ABANDONED: { bg: 'rgba(239, 68, 68, 0.08)', text: '#DC2626' },
  };

  return (
    <Box className="animate-fade-in">
      <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>Queue Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 3 } }}>
        Monitor and manage the call queue
      </Typography>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 3 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 550 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Position</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Queued At</TableCell>
                    <TableCell>Wait Time</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queueData?.map((entry) => {
                    const colors = statusColor[entry.status] || statusColor.WAITING;
                    return (
                      <TableRow key={entry.id} hover>
                        <TableCell>
                          {entry.status === 'WAITING' ? (
                            <Chip label={`#${entry.queuePosition}`} size="small" color="warning" />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{entry.callerNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{dayjs(entry.queuedAt).format('HH:mm:ss')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {entry.waitTimeSeconds
                              ? `${Math.floor(entry.waitTimeSeconds / 60)}m ${entry.waitTimeSeconds % 60}s`
                              : entry.status === 'WAITING'
                              ? dayjs(entry.queuedAt).fromNow(true)
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.status}
                            size="small"
                            sx={{ background: colors.bg, color: colors.text, fontWeight: 700 }}
                          />
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            {entry.status === 'WAITING' && (
                              <>
                                <Tooltip title="Mark Abandoned">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setConfirmDialog({ open: true, id: entry.id, action: 'abandon' })
                                    }
                                    sx={{ color: 'warning.main' }}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setConfirmDialog({ open: true, id: entry.id, action: 'remove' })
                                    }
                                    sx={{ color: 'error.main' }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {(!queueData || queueData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">Queue is empty</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, id: 0, action: '' })}
        PaperProps={{ sx: { maxWidth: 400 } }}
      >
        <DialogTitle>
          {confirmDialog.action === 'remove' ? 'Remove Caller' : 'Mark as Abandoned'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDialog.action === 'remove'
              ? 'Are you sure you want to remove this caller from the queue?'
              : 'Are you sure you want to mark this caller as abandoned?'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDialog({ open: false, id: 0, action: '' })}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
