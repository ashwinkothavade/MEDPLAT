import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import KPIAndAnalytics from './KPIAndAnalytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const DashboardPage = ({ externalConfig, setExternalConfig, hideTitle }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Use external state if provided (for multi-graph)
  const [xField, setXField] = externalConfig && setExternalConfig
    ? [externalConfig.xField, x => setExternalConfig({ ...externalConfig, xField: x })]
    : useState('');
  const [yField, setYField] = externalConfig && setExternalConfig
    ? [externalConfig.yField, y => setExternalConfig({ ...externalConfig, yField: y })]
    : useState('');
  const [chartType, setChartType] = externalConfig && setExternalConfig
    ? [externalConfig.chartType, t => setExternalConfig({ ...externalConfig, chartType: t })]
    : useState('bar');
  const [interval, setInterval] = externalConfig && setExternalConfig
    ? [externalConfig.interval, i => setExternalConfig({ ...externalConfig, interval: i })]
    : useState('none');
  const [numericFields, setNumericFields] = useState([]);

  // Helper: Check if a field is date-like
  function isDateLike(val) {
    return !isNaN(Date.parse(val));
  }

  // Group data by interval
  function groupByInterval(data, xField, yField, interval) {
    if (!xField || !yField || interval === 'none') return data;
    const grouped = {};
    for (const row of data) {
      const dateVal = row[xField];
      const yVal = Number(row[yField]);
      if (!isDateLike(dateVal) || isNaN(yVal)) continue;
      const d = new Date(dateVal);
      let key = '';
      if (interval === 'yearly') {
        key = d.getFullYear();
      } else if (interval === 'half-yearly') {
        key = `${d.getFullYear()} H${d.getMonth() < 6 ? 1 : 2}`;
      } else if (interval === 'monthly') {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      if (!grouped[key]) grouped[key] = 0;
      grouped[key] += yVal;
    }
    // Convert to array of { x, y }
    return Object.entries(grouped).map(([k, v]) => ({ [xField]: k, [yField]: v }));
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/data');
        setData(res.data.data);
        if (res.data.data.length > 0) {
          // Auto-detect numeric fields
          const sample = res.data.data[0];
          const nums = Object.keys(sample).filter(k => typeof sample[k] === 'number' || (!isNaN(Number(sample[k])) && sample[k] !== '' && sample[k] !== null));
          setNumericFields(nums);
          if (nums.length > 1) {
            setXField(nums[0]);
            setYField(nums[1]);
          } else if (nums.length === 1) {
            setXField(nums[0]);
            setYField(nums[0]);
          }
        }
      } catch (e) {
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!xField || !yField || data.length === 0) return null;
    let displayData = data;
    // If interval is chosen and xField is date-like, group data
    if (interval !== 'none' && data.length > 0 && isDateLike(data[0][xField])) {
      displayData = groupByInterval(data, xField, yField, interval);
    }
    const labels = displayData.map(row => String(row[xField]));
    const values = displayData.map(row => Number(row[yField]));
    if (chartType === 'pie') {
      return {
        labels,
        datasets: [
          {
            label: `${yField}`,
            data: values,
            backgroundColor: [
              '#1976d2', '#ff9800', '#4caf50', '#e91e63', '#9c27b0',
              '#00bcd4', '#ffc107', '#8bc34a', '#f44336', '#607d8b'
            ],
          },
        ],
      };
    }
    return {
      labels,
      datasets: [
        {
          label: `${yField} by ${xField}`,
          data: values,
          backgroundColor: '#1976d2',
          borderColor: '#1976d2',
          fill: chartType === 'line' ? false : true,
        },
      ],
    };
  }, [xField, yField, data, chartType]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: chartType.charAt(0).toUpperCase() + chartType.slice(1) + ' Chart',
      },
    },
  };

  return (
    <Container maxWidth="lg">
      <Box mt={5}>
        {!hideTitle && (
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1, mb: 3, textAlign: 'center' }}>
            Dashboard
          </Typography>
        )}
        {/* Personalized KPI and Analytics for logged-in users */}
        <Box mb={4}>
          {localStorage.getItem('token') && <KPIAndAnalytics />}
        </Box>
        {loading ? (
          <Box textAlign="center"><CircularProgress /></Box>
        ) : data.length === 0 ? (
          <Typography>No data available. Please upload data.</Typography>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            <Box mb={3}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Visualization Controls</Typography>
              <Box mb={2} display="flex" alignItems="center" gap={2}>
                <FormControl>
                  <InputLabel>Chart Type</InputLabel>
                  <Select value={chartType} label="Chart Type" onChange={e => setChartType(e.target.value)}>
                    <MenuItem value="bar">Bar</MenuItem>
                    <MenuItem value="line">Line</MenuItem>
                    <MenuItem value="pie">Pie</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>X</InputLabel>
                  <Select value={xField} label="X" onChange={e => setXField(e.target.value)}>
                    {Object.keys(data[0] || {}).map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>Y</InputLabel>
                  <Select value={yField} label="Y" onChange={e => setYField(e.target.value)}>
                    {Object.keys(data[0] || {}).map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>Time Interval</InputLabel>
                  <Select value={interval} label="Time Interval" onChange={e => setInterval(e.target.value)}>
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="half-yearly">Half-Yearly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
              <Paper sx={{ p: 2, flex: 2, minWidth: 0, mb: { xs: 2, md: 0 }, boxShadow: 4, transition: 'box-shadow 0.3s' }} elevation={4}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Chart Preview</Typography>
                {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
                {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
                {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
              </Paper>

            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default DashboardPage;
