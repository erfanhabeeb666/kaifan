import { createTheme, type PaletteMode } from '@mui/material';

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            primary: { main: '#6C63FF', light: '#8B84FF', dark: '#4A42E0' },
            secondary: { main: '#FF6B9D', light: '#FF8FB8', dark: '#E04D7F' },
            background: {
              default: '#0A0E1A',
              paper: '#111827',
            },
            success: { main: '#10B981' },
            warning: { main: '#F59E0B' },
            error: { main: '#EF4444' },
            info: { main: '#3B82F6' },
            text: {
              primary: '#F1F5F9',
              secondary: '#94A3B8',
            },
            divider: 'rgba(148, 163, 184, 0.12)',
          }
        : {
            primary: { main: '#6C63FF', light: '#8B84FF', dark: '#4A42E0' },
            secondary: { main: '#FF6B9D', light: '#FF8FB8', dark: '#E04D7F' },
            background: {
              default: '#F8FAFC',
              paper: '#FFFFFF',
            },
            success: { main: '#10B981' },
            warning: { main: '#F59E0B' },
            error: { main: '#EF4444' },
            info: { main: '#3B82F6' },
            text: {
              primary: '#1E293B',
              secondary: '#64748B',
            },
            divider: 'rgba(0, 0, 0, 0.08)',
          }),
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      body2: { lineHeight: 1.6 },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '10px 24px',
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #6C63FF 0%, #8B84FF 100%)',
            boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5A52E0 0%, #7B74FF 100%)',
              boxShadow: '0 6px 20px rgba(108, 99, 255, 0.5)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.08)' : '1px solid rgba(0,0,0,0.05)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
          },
        },
      },
    },
  });
