import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  alpha,
  useTheme,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  Button,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  ShoppingBag as OrdersIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CurrencyRupee as RupeeIcon,
  Sync as SyncIcon,
  Edit as EditIcon,
  Restaurant as RestaurantIcon,
  LocalShipping as DeliveryIcon,
  DineIn as DineInIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomerDetail, syncPetpoojaOrders, createCustomer } from '../api/endpoints';
import type { CustomerDetailResponse, CallLogResponse } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

interface CallPopupProps {
  open: boolean;
  onClose: () => void;
  activeCall: CallLogResponse | null;
}

const orderStatusColors: Record<string, { bg: string; text: string }> = {
  'Accepted': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
  'Preparing': { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
  'Ready': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  'Delivered': { bg: 'rgba(108, 99, 255, 0.15)', text: '#6C63FF' },
  'Cancelled': { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  'Completed': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
};

function getStatusColor(status: string | null) {
  if (!status) return { bg: 'rgba(100,116,139,0.1)', text: '#64748B' };
  return orderStatusColors[status] || { bg: 'rgba(100,116,139,0.1)', text: '#64748B' };
}

export default function CallPopup({ open, onClose, activeCall }: CallPopupProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const phone = activeCall?.callerNumber || '';
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  const { data: customerDetail, isLoading } = useQuery({
    queryKey: ['customerDetail', phone],
    queryFn: async () => {
      const res = await getCustomerDetail(phone);
      return res.data.data;
    },
    enabled: open && !!phone,
    staleTime: 5000,
  });

  const syncMutation = useMutation({
    mutationFn: () => syncPetpoojaOrders(phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', phone] });
      toast.success('Orders synced from PetPooja');
    },
    onError: () => {
      toast.error('Failed to sync orders');
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: (address: string) =>
      createCustomer({ phoneNumber: phone, deliveryAddress: address }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', phone] });
      toast.success('Delivery address saved');
      setEditingAddress(false);
    },
    onError: () => {
      toast.error('Failed to save address');
    },
  });

  useEffect(() => {
    if (customerDetail?.deliveryAddress) {
      setAddressInput(customerDetail.deliveryAddress);
    }
  }, [customerDetail?.deliveryAddress]);

  const d = customerDetail;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.3)}`,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite',
            }}
          >
            <PhoneIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              {activeCall?.customerName || d?.name || 'Incoming Call'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {phone} • Connected {activeCall?.answerTime ? dayjs(activeCall.answerTime).fromNow() : 'now'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3, mb: 2 }} />
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          </Box>
        ) : (
          <Box>
            {/* Customer Info Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' },
                gap: 2,
                p: 3,
                pb: 2,
              }}
            >
              {/* Total Orders */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: alpha('#6C63FF', 0.08),
                  border: `1px solid ${alpha('#6C63FF', 0.15)}`,
                  textAlign: 'center',
                }}
              >
                <OrdersIcon sx={{ color: '#6C63FF', mb: 0.5 }} />
                <Typography variant="h5" fontWeight={800} color="#6C63FF">
                  {d?.totalOrders ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Orders
                </Typography>
              </Box>

              {/* Total Spent */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: alpha('#10B981', 0.08),
                  border: `1px solid ${alpha('#10B981', 0.15)}`,
                  textAlign: 'center',
                }}
              >
                <RupeeIcon sx={{ color: '#10B981', mb: 0.5 }} />
                <Typography variant="h5" fontWeight={800} color="#10B981">
                  ₹{d?.totalSpent?.toFixed(0) ?? '0'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Spent
                </Typography>
              </Box>

              {/* Customer Since */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: alpha('#F59E0B', 0.08),
                  border: `1px solid ${alpha('#F59E0B', 0.15)}`,
                  textAlign: 'center',
                }}
              >
                <ScheduleIcon sx={{ color: '#F59E0B', mb: 0.5 }} />
                <Typography variant="body2" fontWeight={700} color="#F59E0B">
                  {d?.customerSince ? dayjs(d.customerSince).fromNow(true) : 'New'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customer Since
                </Typography>
              </Box>

              {/* Handled By */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: alpha('#EC4899', 0.08),
                  border: `1px solid ${alpha('#EC4899', 0.15)}`,
                  textAlign: 'center',
                }}
              >
                <PersonIcon sx={{ color: '#EC4899', mb: 0.5 }} />
                <Typography variant="body2" fontWeight={700} color="#EC4899" noWrap>
                  {activeCall?.employeeName || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Handled By
                </Typography>
              </Box>
            </Box>

            {/* Delivery Address */}
            <Box sx={{ px: 3, pb: 2 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  background: alpha(theme.palette.info.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <LocationIcon sx={{ color: theme.palette.info.main, mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      Delivery Address
                    </Typography>
                    {!editingAddress && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAddressInput(d?.deliveryAddress || '');
                          setEditingAddress(true);
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>
                  {editingAddress ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Enter delivery address..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => saveAddressMutation.mutate(addressInput)}
                          disabled={saveAddressMutation.isPending}
                          sx={{ minWidth: 60 }}
                        >
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditingAddress(false)} sx={{ minWidth: 60 }}>
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color={d?.deliveryAddress ? 'text.primary' : 'text.secondary'}>
                      {d?.deliveryAddress || 'No address on file — click edit to add'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Past Orders Header */}
            <Box sx={{ px: 3, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700}>
                  Past Orders
                </Typography>
                <Chip
                  label={`${d?.recentOrders?.length ?? 0} orders`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Tooltip title="Sync orders from PetPooja">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                >
                  <SyncIcon
                    fontSize="small"
                    sx={{
                      animation: syncMutation.isPending ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Orders Table */}
            {d?.recentOrders && d.recentOrders.length > 0 ? (
              <TableContainer sx={{ maxHeight: 350 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {d.recentOrders.map((order) => {
                      const sc = getStatusColor(order.orderStatus);
                      return (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              #{order.petpoojaOrderId}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            {order.items && order.items.length > 0 ? (
                              <Box>
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <Typography key={idx} variant="caption" display="block" noWrap>
                                    {item.quantity}× {item.name}
                                  </Typography>
                                ))}
                                {order.items.length > 3 && (
                                  <Typography variant="caption" color="text.secondary">
                                    +{order.items.length - 3} more items
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
                              label={order.orderStatus || 'Unknown'}
                              size="small"
                              sx={{
                                background: sc.bg,
                                color: sc.text,
                                fontWeight: 700,
                                fontSize: '0.7rem',
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
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  mx: 3,
                  mb: 3,
                  borderRadius: 3,
                  background: alpha(theme.palette.text.secondary, 0.03),
                }}
              >
                <OrdersIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography color="text.secondary">No order history found</Typography>
                <Typography variant="caption" color="text.secondary">
                  Orders will appear here once synced from PetPooja
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
