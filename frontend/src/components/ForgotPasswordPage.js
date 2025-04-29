import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setSuccess(null);
    setError(null);
    setLoading(true);
    try {
      // Endpoint should trigger an email with reset instructions or OTP
      await axios.post('http://localhost:8000/api/forgot-password', { email });
      setSuccess('If an account with this email exists, a password reset link has been sent.');
    } catch (e) {
      setError('Failed to send reset instructions.');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Typography variant="h5" gutterBottom>Forgot Password</Typography>
        <Typography variant="body2" color="textSecondary" mb={2}>
          Enter your email address. If an account exists, you will receive a password reset link.
        </Typography>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
