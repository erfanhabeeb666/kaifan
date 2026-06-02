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
} from '@mui/material';
import { Visibility, VisibilityOff, Restaurant as RestaurantIcon } from '@mui/icons-material';
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
        background: 'linear-gradient(135deg, #0A0E1A 0%, #111827 40%, #1a1040 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorations */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
          top: -100,
          right: -100,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,157,0.1) 0%, transparent 70%)',
          bottom: -100,
          left: -100,
        }}
      />

      <Card
        sx={{
          width: 420,
          maxWidth: '90vw',
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        <CardContent sx={{ p: 5 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(108, 99, 255, 0.4)',
              }}
            >
              <RestaurantIcon sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" color="white" fontWeight={700}>
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
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                },
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
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
                py: 1.5,
                fontSize: '1rem',
                borderRadius: '14px',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="#64748B">
              Demo credentials: admin / admin123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
