import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Box, CssBaseline, IconButton, Avatar, Tooltip, useTheme, createTheme, ThemeProvider, Switch
} from '@mui/material';
import { enhancedThemeOptions, lightPalette, darkPalette } from './themeEnhancements';
import './globalEnhancements.css';
import { deepPurple, teal, pink } from '@mui/material/colors';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import HomePage from './components/HomePage';
import ChatbotPage from './components/ChatbotPage';
import UploadPage from './components/UploadPage';
import DashboardPage from './components/DashboardPage';
import DashboardManager from './components/DashboardManager';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import UserManagementPage from './components/UserManagementPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import { UserProvider, UserContext } from './UserContext';

function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    setAuth(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    window.location.href = '/login';
  };

  // Theme toggle state
  const [mode, setMode] = useState('light');
  const paletteMode = mode === 'dark' ? darkPalette : lightPalette;

  // Set body[data-theme] for CSS variables
  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
  }, [mode]);
  const muiTheme = createTheme({
    ...enhancedThemeOptions,
    palette: {
      ...enhancedThemeOptions.palette,
      mode,
      ...paletteMode,
    },
  });

  // Avatar color by role
  const roleColor = (role) => {
    switch(role) {
      case 'admin': return pink[500];
      case 'doctor': return teal[500];
      case 'analyst': return deepPurple[500];
      default: return '#888';
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', fontFamily: 'Poppins, Roboto, Arial, sans-serif', bgcolor: 'background.default', color: 'text.primary', transition: 'background 0.3s, color 0.3s' }}>
        <UserProvider>
          <Router>
          <UserContext.Consumer>
            {({ user }) => (
              <>
                {console.log('User data in App.js:', user)} {/* Debugging log */}
              {/* Removed duplicate fragment */}
                <AppBar position="sticky" color="primary" elevation={3} sx={{ mb: 2 }}>
                  <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
                      MEDPlat
                    </Typography>
                    <Button color="inherit" component={Link} to="/">Home</Button>
                    <Button color="inherit" component={Link} to="/chatbot">Chatbot</Button>
                    <Button color="inherit" component={Link} to="/upload">Upload Data</Button>
                    <Button color="inherit" component={Link} to="/dashboard-manager">Dashboard</Button>
                    {auth && (
                      <>
                        <Button color="inherit" component={Link} to="/profile">Profile</Button>
                        {user && user.role === 'admin' && (
                          <Button color="inherit" component={Link} to="/users">User Management</Button>
                        )}
                        <Tooltip title={user?.role || 'Unknown'} placement="bottom">
                          <Avatar sx={{ bgcolor: roleColor(user?.role), mx: 1, width: 32, height: 32, fontSize: 16 }}>
                            {user?.role ? user.role.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                        </Tooltip>
                        <Typography sx={{ mr: 2, fontWeight: 500 }}>{user?.username || 'Guest'}</Typography>
                      </>
                    )}
                    <IconButton sx={{ ml: 1 }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
                      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    {!auth && <Button color="inherit" component={Link} to="/login">Login</Button>}
                    {!auth && <Button color="inherit" component={Link} to="/register">Register</Button>}
                    {auth && <Button color="inherit" onClick={handleLogout}>Logout</Button>}
                  </Toolbar>
                </AppBar>
                <Container maxWidth="xl" sx={{ minHeight: '80vh', p: { xs: 1, sm: 2, md: 3 } }}>
                  <Box mt={3}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/chatbot" element={<ChatbotPage />} />
                      <Route path="/upload" element={<UploadPage />} />
                      <Route path="/dashboard" element={<DashboardManager />} />
<Route path="/dashboard-manager" element={<DashboardManager />} />
                      <Route path="/login" element={<LoginPage setAuth={setAuth} />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/users" element={<UserManagementPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    </Routes>
                  </Box>
                </Container>
              </>
            )}
          </UserContext.Consumer>
        </Router>
      </UserProvider>
      </Box>
    </ThemeProvider>
  );
}

export default App;
