import React, { useState } from 'react';
import { Container, Typography, Box, Button, Paper, Alert, TextField, useTheme } from '@mui/material';
import axios from 'axios';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiPreview, setApiPreview] = useState(null);

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

  // Upload data from API
  // Fetch preview and upload data from API
  const handleApiUpload = async () => {
    if (!apiUrl.trim()) return;
    setApiLoading(true);
    setResult(null);
    setError(null);
    setApiPreview(null);
    try {
      // Fetch data from the provided API
      const apiRes = await axios.get(apiUrl);
      // Show preview (first 5 records)
      if (Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        setApiPreview(apiRes.data.slice(0, 5));
      } else if (typeof apiRes.data === 'object') {
        setApiPreview([apiRes.data]);
      } else {
        setApiPreview(null);
      }
      // Send data to backend for upload
      const res = await axios.post('http://localhost:8000/api/upload-api', { data: apiRes.data }, {
        headers: { 'Content-Type': 'application/json', 'x-role': 'admin' },
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'API upload failed');
    }
    setApiLoading(false);
  };


  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom sx={{ color: isDark ? 'primary.light' : 'primary.main' }}>Upload Data (CSV/JSON or API)</Typography>
        {/* API Upload Option */}
        <Paper sx={{ p: 3, mb: 3, border: isDark ? '1px solid #333' : '1px solid #aaa', bgcolor: isDark ? 'background.paper' : '#f9f9fc', color: isDark ? 'text.primary' : 'inherit' }} elevation={3}>
          <Typography variant="h6" sx={{ mb: 1, color: isDark ? 'primary.light' : 'inherit' }}>Upload Data from API Endpoint</Typography>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              label="API URL"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://api.example.com/data"
              disabled={apiLoading}
            />
            <Button variant="contained" onClick={handleApiUpload} disabled={apiLoading}>
              {apiLoading ? 'Uploading...' : 'Upload from API'}
            </Button>
          </Box>
          {apiLoading && <Typography color="textSecondary">Fetching and uploading data...</Typography>}
          {apiPreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Preview (first 5 records):</Typography>
              <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto', bgcolor: isDark ? 'background.paper' : '#fff', color: isDark ? 'text.primary' : 'inherit' }}>
                <pre style={{ margin: 0, fontSize: 13 }}>{JSON.stringify(apiPreview, null, 2)}</pre>
              </Paper>
            </Box>
          )}
          {result && <Alert severity="success" sx={{ mt: 2, bgcolor: isDark ? 'success.dark' : 'success.light' }}>API Upload Success: {result.inserted_count} records added.</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2, bgcolor: isDark ? 'error.dark' : 'error.light' }}>{error}</Alert>}
        </Paper>
        <Box my={2}><hr style={{ border: 0, borderTop: '1px solid #ddd' }} /></Box>
        {/* File Upload Option */}
        <Paper
          sx={{ p: 2, mb: 2, border: isDark ? '2px dashed #333' : '2px dashed #aaa', textAlign: 'center', cursor: 'pointer', bgcolor: file ? (isDark ? 'grey.900' : '#f3f6fa') : (isDark ? 'background.paper' : 'inherit'), color: isDark ? 'text.primary' : 'inherit' }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              setFile(e.dataTransfer.files[0]);
              setResult(null);
              setError(null);
            }
          }}
          onClick={() => document.getElementById('hidden-upload-input').click()}
        >
          <input
            id="hidden-upload-input"
            type="file"
            accept=".csv,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Typography variant="body1" sx={{ mb: 1, color: isDark ? 'primary.light' : 'inherit' }}>
            {file ? `Selected: ${file.name}` : 'Drag and drop a CSV or JSON file here, or click to select.'}
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleUpload} disabled={!file}>
            Upload
          </Button>
        </Paper>
        {result && <Alert severity="success" sx={{ bgcolor: isDark ? 'success.dark' : 'success.light' }}>Inserted {result.inserted_count} records!</Alert>}
        {error && <Alert severity="error" sx={{ bgcolor: isDark ? 'error.dark' : 'error.light' }}>{error}</Alert>}
      </Box>
    </Container>
  );
};

export default UploadPage;
