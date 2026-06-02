import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Queue as QueueIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Logout as LogoutIcon,
  Restaurant as RestaurantIcon,
  ContactPhone as ContactPhoneIcon,
  ShoppingBag as OrdersIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useWebSocket } from '../hooks/useWebSocket';

const DRAWER_WIDTH = 280;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/calls', label: 'Call History', icon: <HistoryIcon /> },
  { path: '/queue', label: 'Queue', icon: <QueueIcon /> },
  { path: '/employees', label: 'Employees', icon: <PeopleIcon /> },
  { path: '/customers', label: 'Customers', icon: <ContactPhoneIcon /> },
  { path: '/orders', label: 'PetPooja Orders', icon: <OrdersIcon /> },
  { path: '/audit', label: 'Audit Logs', icon: <SecurityIcon />, adminOnly: true },
];

export default function Layout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName, role, logout } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const isAdmin = role === 'ROLE_ADMIN';

  // Activate WebSocket connection
  useWebSocket();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background:
              mode === 'dark'
                ? 'linear-gradient(180deg, #0F1629 0%, #111827 100%)'
                : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          },
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
            }}
          >
            <RestaurantIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
              Kaifan
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.05em' }}
            >
              CALL CENTER
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mx: 2, opacity: 0.5 }} />

        {/* Navigation */}
        <List sx={{ px: 2, py: 2, flex: 1 }}>
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '14px',
                    mb: 0.5,
                    px: 2,
                    py: 1.3,
                    transition: 'all 0.2s ease',
                    ...(isActive
                      ? {
                          background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(255,107,157,0.1) 100%)',
                          '& .MuiListItemIcon-root': {
                            color: theme.palette.primary.main,
                          },
                          '& .MuiListItemText-primary': {
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                          },
                        }
                      : {
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.06),
                          },
                        }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        borderRadius: 2,
                        background: 'linear-gradient(180deg, #6C63FF, #FF6B9D)',
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
        </List>

        {/* User Profile */}
        <Box
          sx={{
            p: 2,
            mx: 2,
            mb: 2,
            borderRadius: '16px',
            background: alpha(theme.palette.primary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              {fullName?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {isAdmin ? 'Administrator' : 'Employee'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton size="small" onClick={toggleMode} sx={{ flex: 1 }}>
                {mode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={handleLogout} sx={{ flex: 1, color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
