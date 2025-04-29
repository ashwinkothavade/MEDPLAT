// Custom theme enhancements for MEDPlat UI
import { deepPurple, teal, pink, grey } from '@mui/material/colors';

export const enhancedThemeOptions = {
  palette: {
    primary: deepPurple,
    secondary: teal,
    error: pink,
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'IBM Plex Sans, Poppins, Roboto, Arial, sans-serif',
    h3: {
      fontWeight: 800,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.2px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 2px 12px rgba(76, 81, 255, 0.10)',
          padding: '10px 28px',
          fontWeight: 700,
          fontSize: '1.08rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 32px rgba(76, 81, 255, 0.09)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
};

export const lightPalette = {
  background: {
    default: '#f4f6fb',
    paper: '#fff',
  },
  text: {
    primary: '#21243d',
    secondary: grey[700],
  },
};

export const darkPalette = {
  background: {
    default: '#181A20',
    paper: '#23272F',
  },
  text: {
    primary: '#fff',
    secondary: '#b0b0b0',
  },
};
