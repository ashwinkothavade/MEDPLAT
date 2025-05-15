import React, { useContext, useState } from 'react';
import { Container, Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { UserContext } from '../UserContext';
import axios from 'axios';

import { useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

const ProfilePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [successEdit, setSuccessEdit] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user profile if missing but token exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user && localStorage.getItem('token')) {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:8000/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data.user);
          setEmail(res.data.user.email || '');
        } catch (e) {
          setError('Could not load profile. Please login again.');
        }
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user, setUser]);

  const handleSaveChanges = async () => {
    setSuccessEdit(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/update-profile', { email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser({ ...user, email });
      setSuccessEdit('Profile updated successfully!');
    } catch (e) {
      setSuccessEdit('Could not update profile.');
    }
  };
  
  const handleChangePassword = async () => {
    setSuccess(null); setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/change-password', { username: user.username, newPassword: password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Password changed successfully!');
      setPassword('');
    } catch (e) {
      setError('Could not change password.');
    }
  };

  if (loading) return (
    <Container maxWidth="sm"><Box mt={5} textAlign="center"><CircularProgress /></Box></Container>
  );
  if (!user) return (
    <Container maxWidth="sm"><Box mt={5} textAlign="center"><Typography>No user data. Please login.</Typography></Box></Container>
  );

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5">User Profile</Typography>
          <Typography mt={2}><b>Username:</b> {user.username}</Typography>
          <Typography><b>Role:</b> {user.role}</Typography>
          <Box mt={3} mb={3}>
            <Typography variant="subtitle1">Edit Profile</Typography>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              sx={{ mt: 1 }}
            />
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleSaveChanges}>Save Changes</Button>
            {successEdit && <Alert severity="success" sx={{ mt: 2 }}>{successEdit}</Alert>}
          </Box>
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
