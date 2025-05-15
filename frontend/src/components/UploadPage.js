import React, { useState } from 'react';
import { Container, Typography, Box, Button, Paper, Alert, TextField } from '@mui/material';
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


  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom>Upload Data (CSV/JSON or API)</Typography>
        {/* API Upload Option */}
        <Paper sx={{ p: 3, mb: 3, border: '1px solid #aaa', background: '#f9f9fc' }} elevation={3}>
          <Typography variant="h6" sx={{ mb: 1 }}>Upload Data from API Endpoint</Typography>
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
              <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto', background: '#fff' }}>
                <pre style={{ margin: 0, fontSize: 13 }}>{JSON.stringify(apiPreview, null, 2)}</pre>
              </Paper>
            </Box>
          )}
          {result && <Alert severity="success" sx={{ mt: 2 }}>API Upload Success: {result.inserted_count} records added.</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
        <Box my={2}><hr style={{ border: 0, borderTop: '1px solid #ddd' }} /></Box>
        {/* File Upload Option */}
        <Paper
          sx={{ p: 2, mb: 2, border: '2px dashed #aaa', textAlign: 'center', cursor: 'pointer', background: file ? '#f3f6fa' : 'inherit' }}
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
          <Typography variant="body1" sx={{ mb: 1 }}>
            {file ? `Selected: ${file.name}` : 'Drag and drop a CSV or JSON file here, or click to select.'}
          </Typography>
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
