import React, { useState, useMemo, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormControl,
  FormLabel,
  CircularProgress,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMenu, syncMenu, createCallCenterOrder } from '../api/endpoints';
import { MenuItemDto, VariationDto, AddonGroupDto, AddonItemDto, CreateOrderRequest, OrderItemRequest } from '../types';

interface NewOrderDrawerProps {
  open: boolean;
  onClose: () => void;
  customerPhone: string;
  initialCustomerName?: string;
  initialAddress?: string;
  onSuccess?: (order: any) => void;
}

interface CartItem {
  id: string; // itemKey: itemId + (variationId || '') + sortedAddonIds
  menuItem: MenuItemDto;
  quantity: number;
  variation?: VariationDto;
  selectedAddons: AddonItemDto[];
  itemNotes?: string;
}

export const NewOrderDrawer: React.FC<NewOrderDrawerProps> = ({
  open,
  onClose,
  customerPhone,
  initialCustomerName = '',
  initialAddress = '',
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Customer & Order States
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [deliveryAddress, setDeliveryAddress] = useState(initialAddress);
  const [orderType, setOrderType] = useState('H'); // H = Home Delivery, P = Takeaway/Parcel, D = Dine In
  const [paymentType, setPaymentType] = useState('COD');
  const [packingCharges, setPackingCharges] = useState<number>(0);
  const [deliveryCharges, setDeliveryCharges] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [preorderDate, setPreorderDate] = useState('');
  const [preorderTime, setPreorderTime] = useState('');
  const [notes, setNotes] = useState('');

  // Cart & Menu Browser States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Variation / Addon Dialog State
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemDto | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<VariationDto | null>(null);
  const [tempSelectedAddons, setTempSelectedAddons] = useState<AddonItemDto[]>([]);
  const [itemNoteInput, setItemNoteInput] = useState('');

  // Reset values when phone or initial values change
  useEffect(() => {
    setCustomerName(initialCustomerName);
    setDeliveryAddress(initialAddress);
    setCart([]);
    setNotes('');
    setDiscountAmount(0);
    setPackingCharges(0);
    setDeliveryCharges(orderType === 'H' ? 30 : 0);
  }, [customerPhone, initialCustomerName, initialAddress, open]);

  // Adjust delivery charges based on order type
  useEffect(() => {
    setDeliveryCharges(orderType === 'H' ? 30 : 0);
  }, [orderType]);

  // Fetch Menu using React Query
  const { data: menuDataResponse, isLoading: isMenuLoading, refetch: refetchMenu } = useQuery({
    queryKey: ['menuData'],
    queryFn: async () => {
      const res = await getMenu();
      return res.data.data;
    },
    enabled: open,
  });

  // Manual Menu Sync Mutation
  const syncMenuMutation = useMutation({
    mutationFn: syncMenu,
    onSuccess: () => {
      refetchMenu();
    },
  });

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: createCallCenterOrder,
    onSuccess: (res) => {
      if (onSuccess && res.data.data) {
        onSuccess(res.data.data);
      }
      onClose();
    },
  });

  const categories = menuDataResponse?.categories || [];
  const items = menuDataResponse?.items || [];
  const variations = menuDataResponse?.variations || [];
  const addonGroups = menuDataResponse?.addonGroups || [];
  const addonItems = menuDataResponse?.addonItems || [];
  const itemAddonMappings = menuDataResponse?.itemAddonMappings || [];

  // Filter items by category & search query (local search)
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.itemName.toLowerCase().includes(q) ||
          (item.itemDescription && item.itemDescription.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, selectedCategory, searchQuery]);

  // Find variations for a specific item
  const getVariationsForItem = (itemId: string) => {
    return variations.filter((v) => v.itemId === itemId && v.inStock);
  };

  // Find addon groups allowed for an item
  const getAddonGroupsForItem = (itemId: string) => {
    const allowedGroupIds = itemAddonMappings
      .filter((m) => m.itemId === itemId)
      .map((m) => m.addonGroupId);
    return addonGroups.filter((g) => allowedGroupIds.includes(g.addonGroupId));
  };

  const handleAddItemClick = (item: MenuItemDto) => {
    const itemVars = getVariationsForItem(item.itemId);
    const itemAddonGroups = getAddonGroupsForItem(item.itemId);

    if (itemVars.length > 0 || item.itemAllowAddon === 1) {
      // Show variation / addon choice dialog
      setActiveMenuItem(item);
      setSelectedVariation(itemVars.length > 0 ? itemVars[0] : null);
      setTempSelectedAddons([]);
      setItemNoteInput('');
      setAddonDialogOpen(true);
    } else {
      // Add directly
      addToCartDirect(item);
    }
  };

  const addToCartDirect = (item: MenuItemDto) => {
    const id = item.itemId;
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === id);
      if (existing) {
        return prevCart.map((ci) => (ci.id === id ? { ...ci, quantity: ci.quantity + 1 } : ci));
      } else {
        return [...prevCart, { id, menuItem: item, quantity: 1, selectedAddons: [] }];
      }
    });
  };

  const handleConfirmAddon = () => {
    if (!activeMenuItem) return;

    // Generate unique key for cart item based on item id + variation + sorted addon ids
    const addonIds = tempSelectedAddons.map((a) => a.addonItemId).sort().join(',');
    const varId = selectedVariation ? selectedVariation.variationId : '';
    const id = `${activeMenuItem.itemId}-${varId}-${addonIds}`;

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [
          ...prevCart,
          {
            id,
            menuItem: activeMenuItem,
            quantity: 1,
            variation: selectedVariation || undefined,
            selectedAddons: [...tempSelectedAddons],
            itemNotes: itemNoteInput.trim() || undefined,
          },
        ];
      }
    });

    setAddonDialogOpen(false);
    setActiveMenuItem(null);
  };

  const handleQuantityChange = (id: string, amount: number) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.id === id) {
            const newQty = ci.quantity + amount;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter((ci): ci is CartItem => ci !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((total, ci) => {
      const basePrice = ci.variation ? ci.variation.price : ci.menuItem.price;
      const addonsPrice = ci.selectedAddons.reduce((sum, a) => sum + a.price, 0);
      return total + (basePrice + addonsPrice) * ci.quantity;
    }, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return cart.reduce((total, ci) => {
      const basePrice = ci.variation ? ci.variation.price : ci.menuItem.price;
      const addonsPrice = ci.selectedAddons.reduce((sum, a) => sum + a.price, 0);
      const itemPriceTotal = (basePrice + addonsPrice) * ci.quantity;
      const taxRate = ci.menuItem.itemTax || 5;
      return total + (itemPriceTotal * taxRate) / 100;
    }, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    const total = subtotal + packingCharges + deliveryCharges + taxAmount - discountAmount;
    return total > 0 ? total : 0;
  }, [subtotal, packingCharges, deliveryCharges, taxAmount, discountAmount]);

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add at least one item.');
      return;
    }

    const orderItemsPayload: OrderItemRequest[] = cart.map((ci) => ({
      petpoojaItemId: ci.menuItem.itemId,
      itemName: ci.menuItem.itemName,
      quantity: ci.quantity,
      price: ci.menuItem.price,
      variationId: ci.variation?.variationId,
      variationName: ci.variation?.variationName,
      variationPrice: ci.variation?.price,
      addons: ci.selectedAddons.map((a) => ({
        addonId: a.addonItemId,
        addonName: a.addonItemName,
        price: a.price,
      })),
      itemNotes: ci.itemNotes,
    }));

    const orderRequest: CreateOrderRequest = {
      customerPhone,
      customerName: customerName || undefined,
      deliveryAddress: orderType === 'H' ? deliveryAddress : undefined,
      orderType,
      paymentType,
      items: orderItemsPayload,
      packingCharges,
      deliveryCharges,
      discountAmount,
      preorderDate: preorderDate || undefined,
      preorderTime: preorderTime || undefined,
      notes,
    };

    createOrderMutation.mutate(orderRequest);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', md: '85vw' }, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CartIcon />
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              New Call Center Order
            </Typography>
            <Chip
              label={customerPhone}
              color="secondary"
              size="small"
              sx={{ ml: 1, fontWeight: 'bold' }}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => syncMenuMutation.mutate()}
              disabled={syncMenuMutation.isPending}
              startIcon={
                syncMenuMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SyncIcon />
                )
              }
            >
              Sync Menu
            </Button>
            <IconButton color="inherit" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content Container */}
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left: Menu Browser */}
          <Box
            sx={{
              flex: 3,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRight: { xs: 'none', md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {/* Search Bar */}
            <TextField
              placeholder="Search dishes or description..."
              variant="outlined"
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Category Navigation */}
            {isMenuLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs
                    value={selectedCategory}
                    onChange={(_, val) => setSelectedCategory(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="All Categories" value="ALL" />
                    {categories.map((cat) => (
                      <Tab
                        key={cat.categoryId}
                        label={cat.categoryName}
                        value={cat.categoryId}
                      />
                    ))}
                  </Tabs>
                </Box>

                {/* Items List */}
                <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                  <Grid container spacing={2}>
                    {filteredItems.map((item) => {
                      const hasVars = getVariationsForItem(item.itemId).length > 0;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                          <Card
                            sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 3,
                              },
                            }}
                          >
                            <CardContent sx={{ pb: 1 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="start">
                                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                  {item.itemName}
                                </Typography>
                                <Chip
                                  label={item.itemType === 'veg' ? 'VEG' : 'NON-VEG'}
                                  color={item.itemType === 'veg' ? 'success' : 'error'}
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  height: 32,
                                  my: 1,
                                }}
                              >
                                {item.itemDescription || 'No description available.'}
                              </Typography>
                              <Typography variant="h6" color="primary.main" fontWeight="bold">
                                ₹{item.price}
                                {hasVars && (
                                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                    (varies)
                                  </Typography>
                                )}
                              </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0 }}>
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                onClick={() => handleAddItemClick(item)}
                                startIcon={<AddIcon />}
                                disabled={!item.inStock}
                              >
                                {item.inStock ? 'Add Item' : 'Out of Stock'}
                              </Button>
                            </Box>
                          </Card>
                        </Grid>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                          <Typography color="text.secondary">No items found matching criteria.</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </>
            )}
          </Box>

          {/* Right: Customer Info + Cart + Totals */}
          <Box
            sx={{
              flex: 2,
              p: 2,
              bgcolor: 'grey.50',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Customer Details Form */}
            <Typography variant="subtitle2" fontWeight="bold" mb={1} color="text.secondary">
              Customer Details
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  label="Name"
                  fullWidth
                  size="small"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  size="small"
                  disabled
                  value={customerPhone}
                />
              </Grid>
              {orderType === 'H' && (
                <Grid item xs={12}>
                  <TextField
                    label="Delivery Address"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </Grid>
              )}
            </Grid>

            {/* Order Settings */}
            <Typography variant="subtitle2" fontWeight="bold" mb={1} color="text.secondary">
              Order Type & Payment
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip
                label="Home Delivery"
                clickable
                color={orderType === 'H' ? 'primary' : 'default'}
                onClick={() => setOrderType('H')}
              />
              <Chip
                label="Takeaway/Parcel"
                clickable
                color={orderType === 'P' ? 'primary' : 'default'}
                onClick={() => setOrderType('P')}
              />
              <Chip
                label="Dine In"
                clickable
                color={orderType === 'D' ? 'primary' : 'default'}
                onClick={() => setOrderType('D')}
              />
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Payment Mode"
                  fullWidth
                  size="small"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="COD">COD</option>
                  <option value="ONLINE">Online (UPI/Card)</option>
                  <option value="CARD">Card POS</option>
                  <option value="CREDIT">Credit</option>
                  <option value="OTHER">Other</option>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Discount (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pre-order Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={preorderDate}
                  onChange={(e) => setPreorderDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pre-order Time"
                  type="time"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={preorderTime}
                  onChange={(e) => setPreorderTime(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Cart/Selected Items */}
            <Typography variant="subtitle2" fontWeight="bold" mb={1} color="text.secondary">
              Selected Items ({cart.length})
            </Typography>
            <Box
              sx={{
                flex: 1,
                minHeight: 150,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                mb: 2,
                overflowY: 'auto',
              }}
            >
              <List disablePadding>
                {cart.map((ci) => {
                  const basePrice = ci.variation ? ci.variation.price : ci.menuItem.price;
                  const addonsPrice = ci.selectedAddons.reduce((sum, a) => sum + a.price, 0);
                  const itemTotal = (basePrice + addonsPrice) * ci.quantity;

                  return (
                    <React.Fragment key={ci.id}>
                      <ListItem sx={{ py: 1, px: 2 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight="bold">
                              {ci.menuItem.itemName}
                              {ci.variation && (
                                <Chip
                                  label={ci.variation.variationName}
                                  size="small"
                                  sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                                />
                              )}
                            </Typography>
                          }
                          secondary={
                            <Box component="span">
                              {ci.selectedAddons.length > 0 && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  + {ci.selectedAddons.map((a) => a.addonItemName).join(', ')}
                                </Typography>
                              )}
                              {ci.itemNotes && (
                                <Typography variant="caption" display="block" color="warning.main" sx={{ fontStyle: 'italic' }}>
                                  Note: {ci.itemNotes}
                                </Typography>
                              )}
                              <Typography variant="caption" color="primary.main" fontWeight="bold">
                                ₹{basePrice + addonsPrice} each
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box display="flex" alignItems="center" border="1px solid" borderColor="divider" borderRadius={1}>
                            <IconButton size="small" onClick={() => handleQuantityChange(ci.id, -1)}>
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ px: 1, minWidth: 20, textAlign: 'center' }} variant="body2">
                              {ci.quantity}
                            </Typography>
                            <IconButton size="small" onClick={() => handleQuantityChange(ci.id, 1)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="subtitle2" sx={{ minWidth: 60, textAlign: 'right', fontWeight: 'bold' }}>
                            ₹{itemTotal}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(ci.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
                {cart.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Cart is empty.</Typography>
                  </Box>
                )}
              </List>
            </Box>

            {/* General Notes */}
            <TextField
              label="Order Notes / Kitchen Instructions"
              fullWidth
              size="small"
              multiline
              rows={1.5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Price Calculations */}
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', mb: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" fontWeight="bold">₹{subtotal.toFixed(2)}</Typography>
              </Box>
              {orderType === 'H' && (
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Delivery Charges</Typography>
                  <Typography variant="body2" fontWeight="bold">₹{deliveryCharges.toFixed(2)}</Typography>
                </Box>
              )}
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Taxes (GST)</Typography>
                <Typography variant="body2" fontWeight="bold">₹{taxAmount.toFixed(2)}</Typography>
              </Box>
              {discountAmount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={0.5} color="error.main">
                  <Typography variant="body2">Discount</Typography>
                  <Typography variant="body2" fontWeight="bold">-₹{discountAmount.toFixed(2)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight="bold">Total Amount</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                  ₹{grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Submit Buttons */}
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled={cart.length === 0 || createOrderMutation.isPending}
                onClick={handlePlaceOrder}
              >
                {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Variation & Addon Selection Dialog */}
      <Dialog open={addonDialogOpen} onClose={() => setAddonDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Customize {activeMenuItem?.itemName}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 1 }}>
          {activeMenuItem && (
            <>
              {/* Variations */}
              {getVariationsForItem(activeMenuItem.itemId).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.85rem' }}>
                    Select Portion / Size
                  </FormLabel>
                  <RadioGroup
                    value={selectedVariation?.variationId || ''}
                    onChange={(e) => {
                      const selected = getVariationsForItem(activeMenuItem.itemId).find(
                        (v) => v.variationId === e.target.value
                      );
                      if (selected) setSelectedVariation(selected);
                    }}
                  >
                    {getVariationsForItem(activeMenuItem.itemId).map((v) => (
                      <FormControlLabel
                        key={v.variationId}
                        value={v.variationId}
                        control={<Radio size="small" />}
                        label={`${v.variationName} (₹${v.price})`}
                      />
                    ))}
                  </RadioGroup>
                </Box>
              )}

              {/* Addons */}
              {getAddonGroupsForItem(activeMenuItem.itemId).map((group) => {
                const groupAddons = addonItems.filter(
                  (ai) => ai.addonGroupId === group.addonGroupId && ai.inStock
                );
                if (groupAddons.length === 0) return null;

                return (
                  <Box key={group.addonGroupId} sx={{ mb: 2 }}>
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.85rem' }}>
                      {group.addonGroupName} (Min: {group.minQuantity}, Max: {group.maxQuantity})
                    </FormLabel>
                    {groupAddons.map((addon) => {
                      const isChecked = tempSelectedAddons.some(
                        (a) => a.addonItemId === addon.addonItemId
                      );
                      return (
                        <FormControlLabel
                          key={addon.addonItemId}
                          control={
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Validate max quantity
                                  const count = tempSelectedAddons.filter(
                                    (a) => a.addonGroupId === group.addonGroupId
                                  ).length;
                                  if (group.maxQuantity > 0 && count >= group.maxQuantity) {
                                    alert(`You can select a maximum of ${group.maxQuantity} addons from ${group.addonGroupName}`);
                                    return;
                                  }
                                  setTempSelectedAddons([...tempSelectedAddons, addon]);
                                } else {
                                  setTempSelectedAddons(
                                    tempSelectedAddons.filter((a) => a.addonItemId !== addon.addonItemId)
                                  );
                                }
                              }}
                            />
                          }
                          label={`${addon.addonItemName} (+₹${addon.price})`}
                        />
                      );
                    })}
                  </Box>
                );
              })}

              {/* Item Specific Notes */}
              <TextField
                label="Special instructions for this item"
                fullWidth
                size="small"
                variant="outlined"
                value={itemNoteInput}
                onChange={(e) => setItemNoteInput(e.target.value)}
                placeholder="e.g. Extra spicy, no onion"
                sx={{ mt: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddonDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmAddon}>
            Add to Order
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};
