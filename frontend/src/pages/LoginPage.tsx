import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  alpha,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Headset as HeadsetIcon,
  LockOutlined as LockIcon,
  PersonOutline as PersonIcon,
} from '@mui/icons-material';
import { login as loginApi } from '../api/endpoints';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      const data = res.data.data;
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        employeeId: data.employeeId,
      });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background grid pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(14, 165, 233, 0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Soft glow accent */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
          top: -150,
          right: -100,
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
          bottom: -100,
          left: -100,
          filter: 'blur(40px)',
        }}
      />

      <Card
        sx={{
          width: 400,
          maxWidth: '92vw',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(148, 163, 184, 0.06)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        <CardContent sx={{ p: 4.5 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
              }}
            >
              <HeadsetIcon sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" color="white" fontWeight={700} letterSpacing="-0.02em">
              Kaifan
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
              Call Queue Management System
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              id="login-username"
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#64748B', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              autoFocus
            />
            <TextField
              id="login-password"
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#64748B', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              id="login-submit"
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.4,
                fontSize: '0.9rem',
                borderRadius: '10px',
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="#475569">
              Demo: admin / admin123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
