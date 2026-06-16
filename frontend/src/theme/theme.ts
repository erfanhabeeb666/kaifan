import { createTheme, type PaletteMode } from '@mui/material';

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            primary: { main: '#0EA5E9', light: '#38BDF8', dark: '#0284C7' },
            secondary: { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
            background: {
              default: '#0B1120',
              paper: '#111827',
            },
            success: { main: '#22C55E' },
            warning: { main: '#F59E0B' },
            error: { main: '#EF4444' },
            info: { main: '#3B82F6' },
            text: {
              primary: '#F1F5F9',
              secondary: '#94A3B8',
            },
            divider: 'rgba(148, 163, 184, 0.08)',
          }
        : {
            primary: { main: '#0284C7', light: '#0EA5E9', dark: '#0369A1' },
            secondary: { main: '#7C3AED', light: '#8B5CF6', dark: '#6D28D9' },
            background: {
              default: '#F8FAFC',
              paper: '#FFFFFF',
            },
            success: { main: '#16A34A' },
            warning: { main: '#D97706' },
            error: { main: '#DC2626' },
            info: { main: '#2563EB' },
            text: {
              primary: '#0F172A',
              secondary: '#64748B',
            },
            divider: 'rgba(15, 23, 42, 0.06)',
          }),
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.025em', fontSize: '1.75rem' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.6, fontSize: '0.875rem' },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
            padding: '8px 20px',
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)'
              : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            '&:hover': {
              background: mode === 'dark'
                ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
                : 'linear-gradient(135deg, #0369A1 0%, #075985 100%)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: mode === 'dark'
              ? '1px solid rgba(148, 163, 184, 0.06)'
              : '1px solid rgba(15, 23, 42, 0.06)',
            backgroundImage: 'none',
            boxShadow: mode === 'dark'
              ? '0 1px 3px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
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
            borderRadius: 6,
            height: 26,
            fontSize: '0.75rem',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: mode === 'dark'
              ? '1px solid rgba(148, 163, 184, 0.06)'
              : '1px solid rgba(15, 23, 42, 0.05)',
            padding: '12px 16px',
            fontSize: '0.85rem',
          },
          head: {
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            color: mode === 'dark' ? '#64748B' : '#94A3B8',
            background: mode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.8)',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? 'rgba(14, 165, 233, 0.04) !important'
                : 'rgba(2, 132, 199, 0.02) !important',
            },
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
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              fontSize: '0.875rem',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 25px 50px rgba(0, 0, 0, 0.5)'
              : '0 25px 50px rgba(15, 23, 42, 0.12)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 500,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          },
        },
      },
    },
  });
