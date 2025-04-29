import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const KPIAndAnalytics = () => {
  const [kpis, setKpis] = useState([]);
  const [anomaly, setAnomaly] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await axios.get('http://localhost:8000/suggest-kpis', {
          headers: getAuthHeader(),
        });
        setKpis(res.data.kpis || []);
      } catch (e) {
        setKpis([]);
      }
    };
    fetchKPIs();
  }, []);

  const fetchAnomaly = async () => {
    setError(null);
    try {
      const res = await axios.post('http://localhost:8000/anomaly', {}, {
        headers: getAuthHeader(),
      });
      setAnomaly(res.data);
    } catch (e) {
      setError('Could not fetch anomaly results.');
    }
  };

  const fetchForecast = async () => {
    setError(null);
    try {
      const res = await axios.post('http://localhost:8000/forecast', {}, {
        headers: getAuthHeader(),
      });
      setForecast(res.data);
    } catch (e) {
      setError('Could not fetch forecast results.');
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Personalized KPI Suggestions</Typography>
      {kpis.length > 0 ? (
        <ul>
          {kpis.map((k, i) => <li key={i}>{k}</li>)}
        </ul>
      ) : (
        <Typography>No suggestions available.</Typography>
      )}
      <Box mt={2}>
        <Button variant="outlined" sx={{ mr: 2 }} onClick={fetchAnomaly}>Run Anomaly Detection</Button>
        <Button variant="outlined" onClick={fetchForecast}>Run Forecast</Button>
      </Box>
      {anomaly && (
        <Box mt={2}>
          <Typography variant="subtitle1">Anomaly Detection Result:</Typography>
          {anomaly.anomaly ? (
            <Alert severity="warning">Anomalies found: {JSON.stringify(anomaly.anomalies)}</Alert>
          ) : (
            <Alert severity="success">No anomalies detected.</Alert>
          )}
        </Box>
      )}
      {forecast && (
        <Box mt={2}>
          <Typography variant="subtitle1">Forecast Result ({forecast.field}):</Typography>
          <Alert severity="info">Next 5 values: {forecast.forecast.join(', ')}</Alert>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
};

export default KPIAndAnalytics;
