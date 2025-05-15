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

const MultiGraphDashboard = ({ dashboardId, widgets, setWidgets }) => {
  // Ensure every widget has a well-formed config (fallback to defaultGraphConfig)
  function sanitizeWidgets(widgets) {
    return widgets.map(w => ({
      ...w,
      config: {
        ...defaultGraphConfig,
        ...(w.config || {})
      }
    }));
  }
  const safeWidgets = sanitizeWidgets(widgets);
  // widgets: [{ id, config }], setWidgets: fn(newArray)
  // Generate nextId based on max id in widgets
  const getNextId = () => (widgets.length > 0 ? Math.max(...widgets.map(w => w.id || 0)) + 1 : 1);

  const addGraph = () => {
    const nextId = getNextId();
    setWidgets([...widgets, { id: nextId, config: { ...defaultGraphConfig } }]);
  };

  const removeGraph = (id) => {
    if (widgets.length === 1) return;
    setWidgets(widgets.filter(g => g.id !== id));
  };

  const updateGraphConfig = (id, newConfig) => {
    setWidgets(widgets.map(g => g.id === id ? { ...g, config: newConfig } : g));
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
        {safeWidgets.map(({ id, config }) => (
          <Grid item xs={12} md={6} key={id}>
            <Paper sx={{ p: 2, position: 'relative' }} elevation={4}>
              <IconButton
                aria-label="delete"
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removeGraph(id)}
                disabled={safeWidgets.length === 1}
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
