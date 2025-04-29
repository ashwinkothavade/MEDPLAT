import React, { useState } from 'react';
import { Container, Typography, Box, Button, Paper, Alert } from '@mui/material';
import axios from 'axios';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:8000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-role': 'admin',
        },
      });
      setResult(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
      setResult(null);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom>Upload Data (CSV/JSON)</Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <input type="file" accept=".csv,.json" onChange={handleFileChange} />
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleUpload} disabled={!file}>
            Upload
          </Button>
        </Paper>
        {result && <Alert severity="success">Inserted {result.inserted_count} records!</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </Container>
  );
};

export default UploadPage;
