import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const HomePage = () => (
  <Container maxWidth="md">
    <Box mt={6} textAlign="center">
      <Typography variant="h3" gutterBottom>Welcome to MEDPlat</Typography>
      <Typography variant="h6" color="textSecondary">
        AI-Enabled Medical Dashboard Platform
      </Typography>
      <Typography variant="body1" mt={2}>
        Use the navigation bar to chat with the AI, upload your data, or view interactive dashboards.
      </Typography>
    </Box>
  </Container>
);

export default HomePage;
