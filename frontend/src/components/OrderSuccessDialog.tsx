import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { CheckCircleOutline as SuccessIcon } from '@mui/icons-material';
import { CallCenterOrderResponse } from '../types';

interface OrderSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  order: CallCenterOrderResponse | null;
}

export const OrderSuccessDialog: React.FC<OrderSuccessDialogProps> = ({ open, onClose, order }) => {
  if (!order) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { m: { xs: 2, sm: 3 } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <SuccessIcon color="success" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Order Placed Successfully!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Order Ref: {order.orderId}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary">
            Petpooja Order ID:
          </Typography>
          <Chip
            label={order.petpoojaOrderId || 'N/A'}
            color={order.petpoojaOrderId ? 'primary' : 'default'}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary">
            POS Status:
          </Typography>
          <Chip
            label={order.orderStatus}
            color={
              order.orderStatus === 'ACCEPTED'
                ? 'success'
                : order.orderStatus === 'PENDING'
                ? 'warning'
                : 'error'
            }
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Items Summary
        </Typography>
        <List disablePadding>
          {order.items.map((item) => (
            <ListItem key={item.id} sx={{ py: 0.5, px: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight="medium">
                    {item.itemName} x {item.quantity}
                  </Typography>
                }
                secondary={
                  item.variationName ? `Portion: ${item.variationName}` : undefined
                }
              />
              <Typography variant="body2" fontWeight="bold">
                ₹{item.finalPrice}
              </Typography>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
          <Typography variant="body2">₹{order.subtotal}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" color="text.secondary">Taxes:</Typography>
          <Typography variant="body2">₹{order.taxAmount}</Typography>
        </Box>
        {order.deliveryCharges > 0 && (
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">Delivery Charges:</Typography>
            <Typography variant="body2">₹{order.deliveryCharges}</Typography>
          </Box>
        )}
        {order.discountAmount > 0 && (
          <Box display="flex" justifyContent="space-between" mb={0.5} color="error.main">
            <Typography variant="body2">Discount:</Typography>
            <Typography variant="body2">-₹{order.discountAmount}</Typography>
          </Box>
        )}
        <Divider sx={{ my: 1 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight="bold">Grand Total:</Typography>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
            ₹{order.totalAmount}
          </Typography>
        </Box>

        {order.deliveryAddress && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Delivery Address:
            </Typography>
            <Typography variant="body2">{order.deliveryAddress}</Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" fullWidth onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
