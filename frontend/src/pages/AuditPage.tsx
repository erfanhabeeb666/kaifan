import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/endpoints';
import dayjs from 'dayjs';

const actionColors: Record<string, string> = {
  LOGIN: '#3B82F6', LOGOUT: '#64748B', CALL_CONNECTED: '#10B981',
  CALL_COMPLETED: '#6C63FF', CALL_MISSED: '#EF4444', CALL_QUEUED: '#F59E0B',
  EMPLOYEE_STATUS_CHANGED: '#8B5CF6', EMPLOYEE_CREATED: '#10B981',
  QUEUE_ENTRY_ADDED: '#F97316', QUEUE_ENTRY_REMOVED: '#EF4444',
  QUEUE_DEQUEUED: '#10B981', QUEUE_ENTRY_ABANDONED: '#EF4444',
  EMPLOYEE_DEACTIVATED: '#64748B',
};

export default function AuditPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, size],
    queryFn: async () => (await getAuditLogs({ page, size })).data.data,
  });

  return (
    <Box className="animate-fade-in">
      <Typography variant="h4" sx={{ mb: 1 }}>Audit Logs</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>System activity trail</Typography>
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 3 }}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.content?.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(log.timestamp).format('MMM D, HH:mm:ss')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{log.username}</TableCell>
                        <TableCell>
                          <Chip label={log.action} size="small" sx={{ background: `${actionColors[log.action] || '#64748B'}20`, color: actionColors[log.action] || '#64748B', fontWeight: 700, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</TableCell>
                      </TableRow>
                    ))}
                    {(!data?.content || data.content.length === 0) && (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No audit logs found</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={data?.totalElements ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={size} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
