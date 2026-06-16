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
  useMediaQuery,
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
  ContactPhone as ContactPhoneIcon,
  ShoppingBag as OrdersIcon,
  Headset as HeadsetIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useWebSocket } from '../hooks/useWebSocket';

const DRAWER_WIDTH = 264;

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName, role, logout } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const isAdmin = role === 'ROLE_ADMIN';
  const [mobileOpen, setMobileOpen] = useState(false);

  // Activate WebSocket connection
  useWebSocket();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  // Get current page title for the mobile app bar
  const currentPageTitle = navItems.find((item) => item.path === location.pathname)?.label || 'Kaifan';

  const drawerContent = (
    <>
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #0EA5E9, #0284C7)'
              : 'linear-gradient(135deg, #0284C7, #0369A1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HeadsetIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Kaifan
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Call Center
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2.5, opacity: 0.6 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: '10px',
                  mb: 0.3,
                  px: 1.5,
                  py: 1,
                  minHeight: 42,
                  transition: 'all 0.15s ease',
                  ...(isActive
                    ? {
                        background: alpha(theme.palette.primary.main, 0.1),
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
                          background: alpha(theme.palette.primary.main, 0.04),
                        },
                      }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? theme.palette.primary.main : 'text.secondary',
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      background: theme.palette.primary.main,
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
          p: 1.5,
          mx: 1.5,
          mb: 1.5,
          borderRadius: '12px',
          background: mode === 'dark'
            ? 'rgba(14, 165, 233, 0.04)'
            : 'rgba(2, 132, 199, 0.03)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: mode === 'dark'
                ? 'linear-gradient(135deg, #0EA5E9, #0284C7)'
                : 'linear-gradient(135deg, #0284C7, #0369A1)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {fullName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} fontSize="0.82rem" noWrap>
              {fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.68rem" noWrap>
              {isAdmin ? 'Administrator' : 'Employee'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton
              size="small"
              onClick={toggleMode}
              sx={{ flex: 1, borderRadius: '8px', py: 0.6 }}
            >
              {mode === 'dark' ? <LightIcon sx={{ fontSize: 18 }} /> : <DarkIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ flex: 1, borderRadius: '8px', py: 0.6, color: 'error.main' }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            background: mode === 'dark' ? '#0D1321' : '#FFFFFF',
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56 }, px: { xs: 1.5, sm: 2 } }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #0EA5E9, #0284C7)'
                  : 'linear-gradient(135deg, #0284C7, #0369A1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <HeadsetIcon sx={{ color: '#fff', fontSize: 16 }} />
            </Box>
            <Typography variant="h6" noWrap sx={{ flex: 1, fontSize: '0.95rem', fontWeight: 600 }}>
              {currentPageTitle}
            </Typography>
            <IconButton size="small" onClick={toggleMode} sx={{ mr: 0.5 }}>
              {mode === 'dark' ? <LightIcon sx={{ fontSize: 20 }} /> : <DarkIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar — Permanent on desktop, temporary on mobile */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: mode === 'dark' ? '#0D1321' : '#FFFFFF',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: mode === 'dark' ? '#0D1321' : '#FFFFFF',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, md: 3 },
          mt: isMobile ? '56px' : 0,
          minHeight: '100vh',
          overflow: 'auto',
          background: theme.palette.background.default,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
