import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { getTheme } from './theme/theme';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CallHistoryPage from './pages/CallHistoryPage';
import QueuePage from './pages/QueuePage';
import EmployeesPage from './pages/EmployeesPage';
import AuditPage from './pages/AuditPage';
import CustomersPage from './pages/CustomersPage';
import PetpoojaOrdersPage from './pages/PetpoojaOrdersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'ROLE_ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { mode } = useThemeStore();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: mode === 'dark' ? '#1E293B' : '#fff',
              color: mode === 'dark' ? '#F1F5F9' : '#0F172A',
              borderRadius: '10px',
              border: mode === 'dark' ? '1px solid rgba(148,163,184,0.06)' : '1px solid rgba(15,23,42,0.06)',
              boxShadow: mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(15,23,42,0.08)',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, sans-serif',
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="calls" element={<CallHistoryPage />} />
              <Route path="queue" element={<QueuePage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route
                path="audit"
                element={
                  <AdminRoute>
                    <AuditPage />
                  </AdminRoute>
                }
              />
              <Route
                path="customers"
                element={<CustomersPage />}
              />
              <Route
                path="orders"
                element={<PetpoojaOrdersPage />}
              />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
