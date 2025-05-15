import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

const DataSummary = () => {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:8000/api/data');
      const data = res.data.data;
      if (!Array.isArray(data) || data.length === 0) {
        setSummary('No data available.');
      } else {
        // Generate a simple summary: field names, number of records, and numeric field stats
        const fields = Object.keys(data[0]);
        let summaryText = `Total records: ${data.length}\nFields: ${fields.join(', ')}\n`;
        // Identify numeric fields
        const numericFields = fields.filter(f => data.every(d => !isNaN(Number(d[f])) || d[f] === null || d[f] === undefined));
        // Identify non-numeric fields (excluding id/_id)
        const nonNumericFields = fields.filter(f => !numericFields.includes(f) && f !== 'id' && f !== '_id');
        fields.forEach(f => {
          const nums = data.map(d => Number(d[f])).filter(v => !isNaN(v));
          if (nums.length > 0) {
            const min = Math.min(...nums);
            const max = Math.max(...nums);
            const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
            summaryText += `\nField '${f}': min=${min}, max=${max}, avg=${avg}`;
          }
        });
        // Group by non-numeric, non-id fields
        nonNumericFields.forEach(f => {
          const groups = {};
          data.forEach(d => {
            const val = d[f] || 'Unknown';
            groups[val] = (groups[val] || 0) + 1;
          });
          summaryText += `\nField '${f}' group distribution:`;
          Object.entries(groups).forEach(([val, count]) => {
            summaryText += `\n  ${val}: ${count}`;
          });
        });
        // Group by month for date/datetime fields
        const dateField = fields.find(f => f.toLowerCase().includes('date'));
        if (dateField) {
          const monthGroups = {};
          data.forEach(d => {
            const dt = d[dateField] ? new Date(d[dateField]) : null;
            if (dt && !isNaN(dt)) {
              const month = dt.toLocaleString('default', { month: 'short', year: 'numeric' });
              monthGroups[month] = (monthGroups[month] || 0) + 1;
            }
          });
          summaryText += `\n\nRecords by Month (${dateField}):`;
          Object.entries(monthGroups).forEach(([month, count]) => {
            summaryText += `\n  ${month}: ${count}`;
          });
        }
        setSummary(summaryText);
      }
    } catch (e) {
      setError('Failed to fetch data summary.');
    }
    setLoading(false);
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      <Button variant="outlined" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleOpen}>
        Show Data Summary
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Data Summary</DialogTitle>
        <DialogContent>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {summary && <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{summary}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataSummary;
