import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardPage from './DashboardPage';

const defaultGraphConfig = {
  xField: '',
  yField: '',
  chartType: 'bar',
  interval: 'none',
};

const MultiGraphDashboard = () => {
  const [graphs, setGraphs] = useState([
    { id: 1, config: { ...defaultGraphConfig } },
  ]);
  const [nextId, setNextId] = useState(2);

  const addGraph = () => {
    setGraphs([...graphs, { id: nextId, config: { ...defaultGraphConfig } }]);
    setNextId(nextId + 1);
  };

  const removeGraph = (id) => {
    setGraphs(graphs.filter(g => g.id !== id));
  };

  // Pass config and setConfig to DashboardPage for each graph
  const updateGraphConfig = (id, newConfig) => {
    setGraphs(graphs.map(g => g.id === id ? { ...g, config: newConfig } : g));
  };

  return (
    <Box mt={4}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>Multi-Graph Dashboard</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={addGraph}>
          Add Graph
        </Button>
      </Box>
      <Grid container spacing={3}>
        {graphs.map(({ id, config }) => (
          <Grid item xs={12} md={6} key={id}>
            <Paper sx={{ p: 2, position: 'relative' }} elevation={4}>
              <IconButton
                aria-label="delete"
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removeGraph(id)}
                disabled={graphs.length === 1}
              >
                <DeleteIcon />
              </IconButton>
              <DashboardPage
                externalConfig={config}
                setExternalConfig={newConfig => updateGraphConfig(id, newConfig)}
                hideTitle
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MultiGraphDashboard;
