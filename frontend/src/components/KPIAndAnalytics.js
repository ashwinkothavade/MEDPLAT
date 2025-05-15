import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import axios from 'axios';
import Chart from './Chart';

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

  const [anomalyThreshold, setAnomalyThreshold] = useState(2);
  const fetchAnomaly = async () => {
    setError(null);
    setAnomaly(null);
    if (!selectedField) {
      setError('Please select a field for anomaly detection.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:8000/anomaly', { field: selectedField, threshold: anomalyThreshold }, {
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
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="subtitle2">Anomaly Detection:</Typography>
          <label>
            Field:
            <select value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ marginLeft: 4, marginRight: 12 }}>
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label>
            Threshold:
            <input type="number" min={0.1} max={10} step={0.1} value={anomalyThreshold} onChange={e => setAnomalyThreshold(Number(e.target.value))} style={{ width: 60, marginLeft: 4 }} />
          </label>
          <Button variant="outlined" onClick={fetchAnomaly} disabled={!selectedField}>Run Anomaly Detection</Button>
        </Box>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="subtitle2">Forecast:</Typography>
          <label>
            Field:
            <select value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ marginLeft: 4, marginRight: 12 }}>
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label>
            Periods:
            <input type="number" min={1} max={30} value={periods} onChange={e => setPeriods(Number(e.target.value))} style={{ width: 60, marginLeft: 4 }} />
          </label>
          <Button variant="outlined" onClick={fetchForecast} disabled={!selectedField}>Run Forecast</Button>
        </Box>
      </Box>
      {anomaly && (
        <Box mt={2}>
          <Typography variant="subtitle1">Anomaly Detection Result for <b>{anomaly.field}</b>:</Typography>
          <Typography variant="body2">Mean: {anomaly.mean}, Stddev: {anomaly.stddev}, Threshold: {anomaly.threshold}</Typography>
          <Typography variant="body2">Anomaly Count: {anomaly.anomaly_count}</Typography>
          {anomaly.anomaly_count > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 250 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(anomaly.anomalies[0] || {}).map((col, idx) => (
                      <TableCell key={idx}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {anomaly.anomalies.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(row).map((val, i) => (
                        <TableCell key={i}>{val}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>No anomalies detected.</Alert>
          )}
        </Box>
      )}
      {forecast && (
        <Box mt={2}>
          <Typography variant="subtitle1">Forecast Result for <b>{forecast.field}</b> (next {forecast.periods}):</Typography>
          {forecast.forecast && forecast.forecast.length > 0 ? (
            <>
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
              {/* Forecast Chart */}
              <Box mt={4}>
                <Typography variant="subtitle2" gutterBottom>Forecast Chart</Typography>
                {/* Prepare chart data */}
                {(() => {
                  const labels = forecast.forecast.map(row => row.ds);
                  const yhat = forecast.forecast.map(row => row.yhat);
                  const lower = forecast.forecast.map(row => row.yhat_lower);
                  const upper = forecast.forecast.map(row => row.yhat_upper);
                  const chartData = {
                    labels,
                    datasets: [
                      {
                        label: 'Prediction',
                        data: yhat,
                        fill: false,
                        borderColor: '#1976d2',
                        backgroundColor: '#1976d2',
                        tension: 0.2,
                        pointRadius: 0,
                        borderWidth: 2,
                        order: 1,
                      },
                      {
                        label: 'Upper Bound',
                        data: upper,
                        fill: false,
                        borderColor: 'rgba(30,144,255,0.0)',
                        backgroundColor: 'rgba(30,144,255,0.0)',
                        pointRadius: 0,
                        borderWidth: 0,
                        type: 'line',
                        order: 0,
                        hidden: true,
                      },
                      {
                        label: 'Lower Bound',
                        data: lower,
                        fill: '-1',
                        borderColor: 'rgba(30,144,255,0.0)',
                        backgroundColor: 'rgba(30,144,255,0.10)',
                        pointRadius: 0,
                        borderWidth: 0,
                        type: 'line',
                        order: 0,
                      },
                    ],
                  };
                  const chartOptions = {
                    responsive: true,
                    plugins: {
                      legend: { display: true },
                      tooltip: { mode: 'index', intersect: false },
                    },
                    interaction: { mode: 'nearest', axis: 'x', intersect: false },
                    scales: {
                      x: { title: { display: true, text: 'Date' } },
                      y: { title: { display: true, text: 'Value' } }
                    },
                  };
                  return (
                    <Box sx={{ maxWidth: 700 }}>
                      <Chart type="line" data={chartData} options={chartOptions} />
                    </Box>
                  );
                })()}
              </Box>
            </>
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
