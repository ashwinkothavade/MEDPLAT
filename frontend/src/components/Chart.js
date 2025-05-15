import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Typography } from '@mui/material';
import 'chart.js/auto';

function Chart({ type, data }) {
  if (!data) {
    return <Typography variant="body2" color="textSecondary">No data configured yet.</Typography>;
  }
  if (type === 'bar') return <Bar data={data} />;
  if (type === 'line') return <Line data={data} />;
  if (type === 'pie') return <Pie data={data} />;
  return <Typography variant="body2">Unknown chart type</Typography>;
}

export default Chart;
