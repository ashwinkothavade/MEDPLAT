import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, MenuItem } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const roles = ['user', 'doctor', 'analyst', 'admin'];

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    try {
      await axios.post('http://localhost:8000/register', { username, password, role });
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Typography variant="h5" gutterBottom>Register</Typography>
        <TextField label="Username" fullWidth margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
        <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
        <TextField select label="Role" fullWidth margin="normal" value={role} onChange={e => setRole(e.target.value)}>
          {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleRegister}>Register</Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/login')}>Back to Login</Button>
      </Box>
    </Container>
  );
};

export default RegisterPage;
