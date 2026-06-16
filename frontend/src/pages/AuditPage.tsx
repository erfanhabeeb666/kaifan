import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/endpoints';
import dayjs from 'dayjs';

const actionColors: Record<string, string> = {
  LOGIN: '#3B82F6', LOGOUT: '#94A3B8', CALL_CONNECTED: '#22C55E',
  CALL_COMPLETED: '#0284C7', CALL_MISSED: '#DC2626', CALL_QUEUED: '#D97706',
  EMPLOYEE_STATUS_CHANGED: '#8B5CF6', EMPLOYEE_CREATED: '#22C55E',
  QUEUE_ENTRY_ADDED: '#F97316', QUEUE_ENTRY_REMOVED: '#DC2626',
  QUEUE_DEQUEUED: '#22C55E', QUEUE_ENTRY_ABANDONED: '#DC2626',
  EMPLOYEE_DEACTIVATED: '#94A3B8',
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
      <Typography variant="h4" sx={{ mb: 0.5, fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' } }}>Audit Logs</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 3 } }}>System activity trail</Typography>
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 3 }}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5, borderRadius: 1 }} />)}</Box>
          ) : (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 550 }}>
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
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2">{dayjs(log.timestamp).format('MMM D, HH:mm:ss')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{log.username}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            sx={{
                              background: `${actionColors[log.action] || '#94A3B8'}12`,
                              color: actionColors[log.action] || '#94A3B8',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Typography variant="body2">{log.details}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.content || data.content.length === 0) && (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><Typography variant="body2" color="text.secondary">No audit logs found</Typography></TableCell></TableRow>
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
