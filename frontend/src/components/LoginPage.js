import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const res = await axios.post('http://localhost:8000/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      setAuth(true);
      navigate('/');
    } catch (e) {
      setError('Invalid username or password');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <TextField label="Username" fullWidth margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <Alert severity="error">{error}</Alert>}
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleLogin}>Login</Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/register')}>Register</Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/forgot-password')}>Forgot Password?</Button>
      </Box>
    </Container>
  );
};

export default LoginPage;
