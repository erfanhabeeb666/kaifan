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
  Chip,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  Skeleton,
  Pagination,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Sync as SyncIcon,
  ShoppingBag as OrdersIcon,
  Visibility as ViewIcon,
  Restaurant as RestaurantIcon,
  LocalShipping as DeliveryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPetpoojaOrders, getOrdersByPhone, syncPetpoojaOrders } from '../api/endpoints';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import type { PetpoojaOrderResponse } from '../types';

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

export default function PetpoojaOrdersPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PetpoojaOrderResponse | null>(null);
  const size = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['petpoojaOrdersPage', page, phoneSearch],
    queryFn: async () => {
      if (phoneSearch.trim()) {
        const res = await getOrdersByPhone(phoneSearch.trim());
        return { content: res.data.data, totalPages: 1, totalElements: res.data.data.length };
      }
      const res = await getPetpoojaOrders({ page: page - 1, size });
      return res.data.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => {
      if (!phoneSearch.trim()) {
        return Promise.reject(new Error('Enter a phone number to sync'));
      }
      return syncPetpoojaOrders(phoneSearch.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petpoojaOrdersPage'] });
      toast.success('Orders synced from PetPooja');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to sync orders');
    },
  });

  const orders = data?.content || [];
  const totalPages = data?.totalPages || 1;

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: { xs: 2, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.3, fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>PetPooja Orders</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            View and manage orders fetched from PetPooja
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            placeholder="Phone number..."
            size="small"
            value={phoneSearch}
            onChange={(e) => {
              setPhoneSearch(e.target.value);
              setPage(1);
            }}
            sx={{ width: { xs: '100%', sm: 200 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title={phoneSearch ? 'Sync orders from PetPooja' : 'Enter phone number first'}>
            <span>
              <Button
                variant="contained"
                startIcon={
                  <SyncIcon
                    sx={{
                      fontSize: 18,
                      animation: syncMutation.isPending ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                }
                onClick={() => syncMutation.mutate()}
                disabled={!phoneSearch.trim() || syncMutation.isPending}
                size="small"
                sx={{ py: 1, whiteSpace: 'nowrap' }}
              >
                Sync
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

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
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">View</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => {
                      const sc = getStatusColor(order.orderStatus);
                      return (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              #{order.petpoojaOrderId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {order.customerName || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.customerPhone}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
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
                            {order.orderType ? (
                              <Chip
                                icon={
                                  order.orderType.toLowerCase().includes('delivery')
                                    ? <DeliveryIcon sx={{ fontSize: 14 }} />
                                    : <RestaurantIcon sx={{ fontSize: 14 }} />
                                }
                                label={order.orderType}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.72rem' }}
                              />
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={order.orderStatus || '—'}
                              size="small"
                              sx={{
                                background: sc.bg,
                                color: sc.text,
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {order.paymentMode || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              ₹{order.totalAmount?.toFixed(0) ?? '0'}
                            </Typography>
                            {(order.discountAmount ?? 0) > 0 && (
                              <Typography variant="caption" color="success.main" display="block">
                                -₹{order.discountAmount?.toFixed(0)} off
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {order.orderPlacedAt
                                ? dayjs(order.orderPlacedAt).format('MMM D, HH:mm')
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View order details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                          <OrdersIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.2, mb: 1, display: 'block', mx: 'auto' }} />
                          <Typography variant="body2" color="text.secondary">
                            {phoneSearch
                              ? `No orders found for ${phoneSearch}`
                              : 'No PetPooja orders yet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sync orders using a customer phone number
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {!phoneSearch && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, val) => setPage(val)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} fontSize="1rem">
                  Order #{selectedOrder.petpoojaOrderId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedOrder.orderPlacedAt
                    ? dayjs(selectedOrder.orderPlacedAt).format('ddd, MMM D YYYY, h:mm A')
                    : '—'}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedOrder(null)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {/* Customer info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Customer</Typography>
                <Typography fontWeight={600} fontSize="0.9rem">
                  {selectedOrder.customerName || 'Unknown'} • {selectedOrder.customerPhone}
                </Typography>
              </Box>

              {/* Delivery Address */}
              {selectedOrder.deliveryAddress && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Delivery Address</Typography>
                  <Typography variant="body2">{selectedOrder.deliveryAddress}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Order Items */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Items</Typography>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <Box>
                  {selectedOrder.items.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: idx < selectedOrder.items.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600} fontSize="0.85rem">
                          {item.quantity}× {item.name}
                        </Typography>
                        {item.variant && (
                          <Typography variant="caption" color="text.secondary">
                            {item.variant}
                          </Typography>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            + {item.addons.join(', ')}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No items data</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Pricing Summary */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {(selectedOrder.discountAmount ?? 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="success.main">Discount</Typography>
                    <Typography variant="body2" color="success.main">-₹{selectedOrder.discountAmount?.toFixed(0)}</Typography>
                  </Box>
                )}
                {(selectedOrder.taxAmount ?? 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tax</Typography>
                    <Typography variant="body2">₹{selectedOrder.taxAmount?.toFixed(0)}</Typography>
                  </Box>
                )}
                {(selectedOrder.deliveryCharge ?? 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Delivery</Typography>
                    <Typography variant="body2">₹{selectedOrder.deliveryCharge?.toFixed(0)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: `2px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>₹{selectedOrder.totalAmount?.toFixed(0) ?? '0'}</Typography>
                </Box>
              </Box>

              {/* Meta info */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {selectedOrder.orderType && (
                  <Chip
                    icon={selectedOrder.orderType.toLowerCase().includes('delivery') ? <DeliveryIcon /> : <RestaurantIcon />}
                    label={selectedOrder.orderType}
                    size="small"
                    variant="outlined"
                  />
                )}
                {selectedOrder.orderStatus && (
                  <Chip
                    label={selectedOrder.orderStatus}
                    size="small"
                    sx={{
                      ...getStatusColor(selectedOrder.orderStatus),
                      background: getStatusColor(selectedOrder.orderStatus).bg,
                      color: getStatusColor(selectedOrder.orderStatus).text,
                      fontWeight: 700,
                    }}
                  />
                )}
                {selectedOrder.paymentMode && (
                  <Chip label={selectedOrder.paymentMode} size="small" variant="outlined" />
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
