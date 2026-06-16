import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, alpha, useTheme, Skeleton, Tooltip,
} from '@mui/material';
import { Add as AddIcon, PersonOff as PersonOffIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, createEmployee, updateEmployeeStatus, deactivateEmployee } from '../api/endpoints';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import type { EmployeeResponse, EmployeeStatus } from '../types';

const statusColors: Record<EmployeeStatus, string> = {
  AVAILABLE: '#22C55E', BUSY: '#EF4444', OFFLINE: '#94A3B8',
};

export default function EmployeesPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore().role === 'ROLE_ADMIN';
  const [createDialog, setCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await getEmployees()).data.data,
  });

  const createMut = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee created'); setCreateDialog(false); setNewName(''); setNewPhone(''); },
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: EmployeeStatus }) => updateEmployeeStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Status updated'); },
  });
  const deactMut = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee deactivated'); },
  });

  return (
    <Box className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 }, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>Employees</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>Manage call center employees</Typography>
        </Box>
        {isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)} size={undefined}>Add Employee</Button>}
      </Box>

      {isLoading ? (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>{Array.from({ length: 3 }).map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} /></Grid>)}</Grid>
      ) : (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {employees?.map((emp) => (
            <Grid item xs={12} sm={6} md={4} key={emp.id}>
              <Card sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(statusColors[emp.status], 0.1)}`,
                  borderColor: alpha(statusColors[emp.status], 0.2),
                },
                opacity: emp.active ? 1 : 0.5,
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: statusColors[emp.status],
                        boxShadow: `0 0 6px ${statusColors[emp.status]}`,
                        ...(emp.status === 'AVAILABLE' && { animation: 'pulse 2s infinite' }),
                      }} />
                      <Typography variant="h6" fontWeight={700} fontSize="1rem">{emp.name}</Typography>
                    </Box>
                    {isAdmin && emp.active && (
                      <Tooltip title="Deactivate">
                        <IconButton size="small" onClick={() => deactMut.mutate(emp.id)} sx={{ color: 'error.main' }}>
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                    📞 {emp.phoneNumber}
                  </Typography>
                  <Chip
                    label={emp.status}
                    size="small"
                    sx={{
                      background: alpha(statusColors[emp.status], 0.1),
                      color: statusColors[emp.status],
                      fontWeight: 700,
                      mb: 1.5,
                    }}
                  />
                  {!emp.active && <Chip label="INACTIVE" size="small" sx={{ ml: 1, mb: 1.5 }} />}
                  {emp.active && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {(['AVAILABLE', 'BUSY', 'OFFLINE'] as EmployeeStatus[]).map((st) => (
                        <Button
                          key={st}
                          size="small"
                          variant={emp.status === st ? 'contained' : 'outlined'}
                          onClick={() => statusMut.mutate({ id: emp.id, status: st })}
                          disabled={emp.status === st}
                          sx={{
                            flex: 1,
                            fontSize: '0.68rem',
                            py: 0.4,
                            borderRadius: '8px',
                            fontWeight: 600,
                          }}
                        >
                          {st}
                        </Button>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {(!employees || employees.length === 0) && (
            <Grid item xs={12}>
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No employees found</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} PaperProps={{ sx: { minWidth: 400 } }}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <TextField id="emp-name" fullWidth label="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} sx={{ mt: 2, mb: 2 }} />
          <TextField id="emp-phone" fullWidth label="Phone Number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+919876543210" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMut.mutate({ name: newName, phoneNumber: newPhone })} disabled={!newName || !newPhone}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
