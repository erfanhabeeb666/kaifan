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
  useMediaQuery,
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
  Dining as DineInIcon,
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
  'Accepted': { bg: 'rgba(34, 197, 94, 0.08)', text: '#16A34A' },
  'Preparing': { bg: 'rgba(245, 158, 11, 0.08)', text: '#D97706' },
  'Ready': { bg: 'rgba(59, 130, 246, 0.08)', text: '#2563EB' },
  'Delivered': { bg: 'rgba(14, 165, 233, 0.08)', text: '#0284C7' },
  'Cancelled': { bg: 'rgba(239, 68, 68, 0.08)', text: '#DC2626' },
  'Completed': { bg: 'rgba(34, 197, 94, 0.08)', text: '#16A34A' },
};

function getStatusColor(status: string | null) {
  if (!status) return { bg: 'rgba(148,163,184,0.08)', text: '#94A3B8' };
  return orderStatusColors[status] || { bg: 'rgba(148,163,184,0.08)', text: '#94A3B8' };
}

export default function CallPopup({ open, onClose, activeCall }: CallPopupProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: '16px' },
          border: { xs: 'none', sm: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` },
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0C4A6E 0%, #0E7490 100%)'
            : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
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
              width: 46,
              height: 46,
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PhoneIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
              {activeCall?.customerName || d?.name || 'Incoming Call'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' }}>
              {phone} • Connected {activeCall?.answerTime ? dayjs(activeCall.answerTime).fromNow() : 'now'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
          </Box>
        ) : (
          <Box>
            {/* Customer Info Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
                gap: { xs: 1, sm: 1.5 },
                p: { xs: 2, sm: 2.5 },
                pb: 2,
              }}
            >
              {/* Total Orders */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha('#0EA5E9', 0.06),
                  border: `1px solid ${alpha('#0EA5E9', 0.1)}`,
                  textAlign: 'center',
                }}
              >
                <OrdersIcon sx={{ color: '#0EA5E9', fontSize: 22, mb: 0.3 }} />
                <Typography variant="h6" fontWeight={800} color="#0EA5E9" fontSize="1.2rem">
                  {d?.totalOrders ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.68rem">
                  Total Orders
                </Typography>
              </Box>

              {/* Total Spent */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha('#22C55E', 0.06),
                  border: `1px solid ${alpha('#22C55E', 0.1)}`,
                  textAlign: 'center',
                }}
              >
                <RupeeIcon sx={{ color: '#22C55E', fontSize: 22, mb: 0.3 }} />
                <Typography variant="h6" fontWeight={800} color="#22C55E" fontSize="1.2rem">
                  ₹{d?.totalSpent?.toFixed(0) ?? '0'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.68rem">
                  Total Spent
                </Typography>
              </Box>

              {/* Customer Since */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha('#F59E0B', 0.06),
                  border: `1px solid ${alpha('#F59E0B', 0.1)}`,
                  textAlign: 'center',
                }}
              >
                <ScheduleIcon sx={{ color: '#F59E0B', fontSize: 22, mb: 0.3 }} />
                <Typography variant="body2" fontWeight={700} color="#D97706" fontSize="0.85rem">
                  {d?.customerSince ? dayjs(d.customerSince).fromNow(true) : 'New'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.68rem">
                  Customer Since
                </Typography>
              </Box>

              {/* Handled By */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha('#8B5CF6', 0.06),
                  border: `1px solid ${alpha('#8B5CF6', 0.1)}`,
                  textAlign: 'center',
                }}
              >
                <PersonIcon sx={{ color: '#8B5CF6', fontSize: 22, mb: 0.3 }} />
                <Typography variant="body2" fontWeight={700} color="#8B5CF6" noWrap fontSize="0.85rem">
                  {activeCall?.employeeName || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.68rem">
                  Handled By
                </Typography>
              </Box>
            </Box>

            {/* Delivery Address */}
            <Box sx={{ px: 2.5, pb: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.08)}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <LocationIcon sx={{ color: theme.palette.info.main, mt: 0.2, fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" fontSize="0.78rem">
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
                        <EditIcon sx={{ fontSize: 14 }} />
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
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => saveAddressMutation.mutate(addressInput)}
                          disabled={saveAddressMutation.isPending}
                          sx={{ minWidth: 56, fontSize: '0.75rem' }}
                        >
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditingAddress(false)} sx={{ minWidth: 56, fontSize: '0.75rem' }}>
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color={d?.deliveryAddress ? 'text.primary' : 'text.secondary'} fontSize="0.82rem">
                      {d?.deliveryAddress || 'No address on file — click edit to add'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Past Orders Header */}
            <Box sx={{ px: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={700} fontSize="0.95rem">
                  Past Orders
                </Typography>
                <Chip
                  label={`${d?.recentOrders?.length ?? 0} orders`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600, fontSize: '0.68rem' }}
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
              <TableContainer sx={{ maxHeight: 320 }}>
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
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
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
                                sx={{ fontSize: '0.68rem' }}
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
                                fontSize: '0.68rem',
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
                  mx: 2.5,
                  mb: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.text.secondary, 0.02),
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <OrdersIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.2, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No order history found</Typography>
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
