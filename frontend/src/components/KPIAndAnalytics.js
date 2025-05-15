import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
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
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [periods, setPeriods] = useState(5);

  useEffect(() => {
    // Fetch available fields for forecasting
    const fetchFields = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/data', { headers: getAuthHeader() });
        if (res.data.data && res.data.data.length > 0) {
          const sample = res.data.data[0];
          const numericFields = Object.keys(sample).filter(k => typeof sample[k] === 'number' || (!isNaN(Number(sample[k])) && sample[k] !== '' && sample[k] !== null));
          setFields(numericFields);
          setSelectedField(numericFields[0] || '');
        }
      } catch (e) {
        setFields([]);
        setSelectedField('');
      }
    };
    fetchFields();
  }, []);

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
    setForecast(null);
    if (!selectedField) {
      setError('Please select a field to forecast.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:8000/forecast', { field: selectedField, periods: periods }, {
        headers: getAuthHeader(),
      });
      console.log('Forecast response:', res.data);
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
        <span style={{ marginRight: 8 }} />
        <span>
          <label style={{ marginRight: 8 }}>
            Field:
            <select value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ marginLeft: 4, marginRight: 12 }}>
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label style={{ marginRight: 8 }}>
            Periods:
            <input type="number" min={1} max={30} value={periods} onChange={e => setPeriods(Number(e.target.value))} style={{ width: 60, marginLeft: 4 }} />
          </label>
          <Button variant="outlined" onClick={fetchForecast} disabled={!selectedField}>Run Forecast</Button>
        </span>
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
          <Typography variant="subtitle1">Forecast Result for <b>{forecast.field}</b> (next {forecast.periods}):</Typography>
          {forecast.forecast && forecast.forecast.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Prediction</TableCell>
                    <TableCell>Lower</TableCell>
                    <TableCell>Upper</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forecast.forecast.slice(-periods).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.ds}</TableCell>
                      <TableCell>{row.yhat}</TableCell>
                      <TableCell>{row.yhat_lower}</TableCell>
                      <TableCell>{row.yhat_upper}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No forecast data available.</Alert>
          )}
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Paper>
  );
};

export default KPIAndAnalytics;
