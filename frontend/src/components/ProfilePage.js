import React, { useContext, useState } from 'react';
import { Container, Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { UserContext } from '../UserContext';
import axios from 'axios';

const ProfilePage = () => {
  const { user } = useContext(UserContext);
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChangePassword = async () => {
    setSuccess(null); setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8001/change-password', { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Password changed successfully!');
      setPassword('');
    } catch (e) {
      setError('Could not change password.');
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5">User Profile</Typography>
          <Typography mt={2}><b>Username:</b> {user.username}</Typography>
          <Typography><b>Role:</b> {user.role}</Typography>
          <Box mt={3}>
            <Typography variant="subtitle1">Change Password</Typography>
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              sx={{ mt: 1 }}
            />
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleChangePassword}>Change Password</Button>
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfilePage;
