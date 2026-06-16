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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
  InputAdornment,
  alpha,
  useTheme,
  Skeleton,
  Pagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  WhatsApp as WhatsAppIcon,
  Group as GroupIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer, updateCustomerName, deleteCustomer } from '../api/endpoints';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

// Dummy initial groups state
const INITIAL_GROUPS = [
  { id: 1, name: 'VIP Customers', description: 'Customers with high priority and frequent orders', count: 12 },
  { id: 2, name: 'Weekend Leads', description: 'Leads generated during weekends', count: 8 },
  { id: 3, name: 'General Support', description: 'Customers who reached out for general inquiries', count: 25 },
];

export default function CustomersPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const size = 10;

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);

  // Selected item states
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; phoneNumber: string; name: string; deliveryAddress?: string } | null>(null);
  const [newCustomer, setNewCustomer] = useState({ phoneNumber: '', name: '', deliveryAddress: '' });
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  
  // Local dummy groups state
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [broadcast, setBroadcast] = useState({ groupId: '', message: '' });
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', searchQuery, page],
    queryFn: async () => {
      const res = await getCustomers({ query: searchQuery || undefined, page: page - 1, size });
      return res.data.data;
    },
  });

  const customersList = data?.content || [];
  const totalPages = data?.totalPages || 1;

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
      setAddDialogOpen(false);
      setNewCustomer({ phoneNumber: '', name: '', deliveryAddress: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, deliveryAddress }: { id: number; name: string; deliveryAddress?: string }) => 
      updateCustomerName(id, { name, deliveryAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated');
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete customer');
    },
  });

  // Action handlers
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.phoneNumber) return;
    createMutation.mutate(newCustomer);
  };

  const handleEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    updateMutation.mutate({ id: selectedCustomer.id, name: editName });
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    deleteMutation.mutate(selectedCustomer.id);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name) return;
    const newId = groups.length + 1;
    setGroups([...groups, { id: newId, name: newGroup.name, description: newGroup.description, count: 0 }]);
    toast.success(`Group "${newGroup.name}" created successfully (Simulated)`);
    setGroupDialogOpen(false);
    setNewGroup({ name: '', description: '' });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcast.groupId || !broadcast.message) return;
    const targetGroup = groups.find((g) => g.id === Number(broadcast.groupId));
    if (!targetGroup) return;

    setIsSendingBroadcast(true);
    setTimeout(() => {
      setIsSendingBroadcast(false);
      setBroadcastDialogOpen(false);
      setBroadcast({ groupId: '', message: '' });
      toast.success(
        `WhatsApp broadcast sent to ${targetGroup.count} customers in "${targetGroup.name}" (Simulated)`,
        { duration: 4000 }
      );
    }, 1500);
  };

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.3, fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>Customer Database</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Manage caller directory and send bulk campaigns
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {activeTab === 0 ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Customer
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<WhatsAppIcon />}
              onClick={() => setBroadcastDialogOpen(true)}
            >
              New Broadcast
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: { xs: 2, md: 3 } }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="Directory" />
          <Tab label="WhatsApp Groups" />
        </Tabs>
      </Box>

      {/* Directory Tab */}
      {activeTab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    placeholder="Search by name or number..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    sx={{ maxWidth: 360, width: '100%' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {isLoading ? (
                  <Box sx={{ p: 3 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />
                    ))}
                  </Box>
                ) : (
                  <>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table sx={{ minWidth: 600 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Phone Number</TableCell>
                            <TableCell>Customer Name</TableCell>
                            <TableCell>Delivery Address</TableCell>
                            <TableCell>Date Registered</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {customersList.map((customer) => (
                            <TableRow key={customer.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{customer.phoneNumber}</Typography>
                              </TableCell>
                              <TableCell>
                                {customer.name ? (
                                  <Chip
                                    label={customer.name}
                                    size="small"
                                    sx={{
                                      background: alpha(theme.palette.primary.main, 0.06),
                                      color: theme.palette.primary.main,
                                      fontWeight: 600,
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Not provided
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                  {customer.deliveryAddress || <Typography variant="body2" component="span" color="text.secondary" sx={{ fontStyle: 'italic' }}>Not provided</Typography>}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{dayjs(customer.createdAt).format('YYYY-MM-DD HH:mm')}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Edit Customer">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setSelectedCustomer({
                                        id: customer.id,
                                        phoneNumber: customer.phoneNumber,
                                        name: customer.name || '',
                                        deliveryAddress: customer.deliveryAddress || '',
                                      });
                                      setEditName(customer.name || '');
                                      setEditAddress(customer.deliveryAddress || '');
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setSelectedCustomer({
                                        id: customer.id,
                                        phoneNumber: customer.phoneNumber,
                                        name: customer.name || '',
                                      });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                          {customersList.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                <Typography variant="body2" color="text.secondary">No customers found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2.5 }}>
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
          </Grid>
        </Grid>
      )}

      {/* WhatsApp Groups Tab */}
      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
            <Card sx={{ flex: 1, border: `1px dashed ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <GroupIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>Create a New Group</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 220, mx: 'auto' }}>
                  Organize your customer base to send targeted broadcasts
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setGroupDialogOpen(true)} size="small">
                  Create Group
                </Button>
              </Box>
            </Card>
          </Grid>

          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id} sx={{ display: 'flex' }}>
              <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{group.name}</Typography>
                    <Chip label={`${group.count}`} size="small" color="secondary" sx={{ fontWeight: 600 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, minHeight: 36, fontSize: '0.82rem' }}>
                    {group.description || 'No description provided'}
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<WhatsAppIcon />}
                    onClick={() => {
                      setBroadcast({ ...broadcast, groupId: String(group.id) });
                      setBroadcastDialogOpen(true);
                    }}
                    sx={{ mt: 'auto' }}
                    size="small"
                  >
                    Send Broadcast
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddCustomer}>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Phone Number"
              placeholder="+919876543210"
              required
              fullWidth
              value={newCustomer.phoneNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
              helperText="Must be international format e.g. +919876543210"
            />
            <TextField
              label="Customer Name"
              placeholder="Optional Name"
              fullWidth
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            />
            <TextField
              label="Delivery Address"
              placeholder="Optional Delivery Address"
              fullWidth
              multiline
              rows={2}
              value={newCustomer.deliveryAddress}
              onChange={(e) => setNewCustomer({ ...newCustomer, deliveryAddress: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" loading={createMutation.isPending}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleEditCustomer}>
          <DialogTitle>Edit Customer Name</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Phone Number"
              disabled
              fullWidth
              value={selectedCustomer?.phoneNumber || ''}
            />
            <TextField
              label="Customer Name"
              required
              fullWidth
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <TextField
              label="Delivery Address"
              fullWidth
              multiline
              rows={2}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" loading={updateMutation.isPending}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete the customer <strong>{selectedCustomer?.name || selectedCustomer?.phoneNumber}</strong>?
            This will permanently remove their records.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteCustomer} loading={deleteMutation.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreateGroup}>
          <DialogTitle>Create Customer Group</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Group Name"
              placeholder="e.g. Premium Clients"
              required
              fullWidth
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <TextField
              label="Description"
              placeholder="Describe the group target audience"
              multiline
              rows={3}
              fullWidth
              value={newGroup.description}
              onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Send Broadcast Dialog */}
      <Dialog open={broadcastDialogOpen} onClose={() => setBroadcastDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSendBroadcast}>
          <DialogTitle>Send WhatsApp Broadcast</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Target Group"
              required
              fullWidth
              value={broadcast.groupId}
              onChange={(e) => setBroadcast({ ...broadcast, groupId: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="">Select Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.count} customers)
                </option>
              ))}
            </TextField>
            <TextField
              label="Broadcast Message"
              placeholder="Type your WhatsApp message template here..."
              required
              multiline
              rows={5}
              fullWidth
              value={broadcast.message}
              onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
              helperText="Variables like {{name}} will be simulated"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBroadcastDialogOpen(false)} disabled={isSendingBroadcast}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              loading={isSendingBroadcast}
              disabled={isSendingBroadcast}
            >
              {isSendingBroadcast ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
