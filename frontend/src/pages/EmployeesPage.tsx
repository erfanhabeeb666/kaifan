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
  AVAILABLE: '#10B981', BUSY: '#EF4444', OFFLINE: '#64748B',
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">Employees</Typography>
          <Typography variant="body2" color="text.secondary">Manage call center employees</Typography>
        </Box>
        {isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>Add Employee</Button>}
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>{Array.from({ length: 3 }).map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      ) : (
        <Grid container spacing={3}>
          {employees?.map((emp) => (
            <Grid item xs={12} sm={6} md={4} key={emp.id}>
              <Card sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 28px ${alpha(statusColors[emp.status], 0.15)}` }, opacity: emp.active ? 1 : 0.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: statusColors[emp.status], boxShadow: `0 0 8px ${statusColors[emp.status]}`, ...(emp.status === 'AVAILABLE' && { animation: 'pulse 2s infinite' }) }} />
                      <Typography variant="h6" fontWeight={700}>{emp.name}</Typography>
                    </Box>
                    {isAdmin && emp.active && <Tooltip title="Deactivate"><IconButton size="small" onClick={() => deactMut.mutate(emp.id)} sx={{ color: 'error.main' }}><PersonOffIcon fontSize="small" /></IconButton></Tooltip>}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>📞 {emp.phoneNumber}</Typography>
                  <Chip label={emp.status} size="small" sx={{ background: alpha(statusColors[emp.status], 0.15), color: statusColors[emp.status], fontWeight: 700, mb: 2 }} />
                  {!emp.active && <Chip label="INACTIVE" size="small" sx={{ ml: 1, mb: 2 }} />}
                  {emp.active && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {(['AVAILABLE', 'BUSY', 'OFFLINE'] as EmployeeStatus[]).map((st) => (
                        <Button key={st} size="small" variant={emp.status === st ? 'contained' : 'outlined'} onClick={() => statusMut.mutate({ id: emp.id, status: st })} disabled={emp.status === st} sx={{ flex: 1, fontSize: '0.7rem', py: 0.5, borderRadius: '10px' }}>{st}</Button>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {(!employees || employees.length === 0) && <Grid item xs={12}><Box sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">No employees found</Typography></Box></Grid>}
        </Grid>
      )}

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}>
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
