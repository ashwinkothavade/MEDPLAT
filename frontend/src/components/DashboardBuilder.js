import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Chart from './Chart';
import axios from 'axios';

const initialDashboards = [
  { id: 'dashboard-1', name: 'Dashboard 1', widgets: [] },
  { id: 'dashboard-2', name: 'Dashboard 2', widgets: [] },
  { id: 'dashboard-3', name: 'Dashboard 3', widgets: [] },
  { id: 'dashboard-4', name: 'Dashboard 4', widgets: [] },
];

function DashboardBuilder({ onNLPQuery }) {
  const [dashboards, setDashboards] = useState(initialDashboards);
  const [activeDashboardId, setActiveDashboardId] = useState('dashboard-1');

  const handleAddWidget = (type = 'bar') => {
      if (type === 'forecast') {
          fetchForecastData().then(forecastData => {
              setDashboards(dashboards.map(dashboard =>
                  dashboard.id === activeDashboardId
                      ? { ...dashboard, widgets: [...dashboard.widgets, { id: `widget-${Date.now()}`, type: 'forecast', data: forecastData }] }
                      : dashboard
              ));
          });
      } else {
          setDashboards(dashboards.map(dashboard =>
              dashboard.id === activeDashboardId
                  ? { ...dashboard, widgets: [...dashboard.widgets, { id: `widget-${Date.now()}`, type: 'bar', data: null }] }
                  : dashboard
          ));
      }
  };

  const handleRemoveWidget = (id) => {
    setDashboards(dashboards.map(dashboard =>
      dashboard.id === activeDashboardId
        ? { ...dashboard, widgets: dashboard.widgets.filter(w => w.id !== id) }
        : dashboard
    ));
  };
  
  const handleSwitchDashboard = (id) => {
    setActiveDashboardId(id);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setDashboards(dashboards.map(dashboard =>
      dashboard.id === activeDashboardId
        ? {
            ...dashboard,
            widgets: (() => {
              const reordered = Array.from(dashboard.widgets);
              const [removed] = reordered.splice(result.source.index, 1);
              reordered.splice(result.destination.index, 0, removed);
              return reordered;
            })(),
          }
        : dashboard
    ));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        {dashboards.map(dashboard => (
          <Button
            key={dashboard.id}
            variant={dashboard.id === activeDashboardId ? 'contained' : 'outlined'}
            onClick={() => handleSwitchDashboard(dashboard.id)}
            sx={{ mr: 1 }}
          >
            {dashboard.name}
          </Button>
        ))}
      </Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h5" flexGrow={1}>Dashboard Builder</Typography>
        <Button startIcon={<AddIcon />} onClick={handleAddWidget} variant="contained">Add Widget</Button>
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-droppable" direction="horizontal">
          {(provided) => (
            <Grid container spacing={2} ref={provided.innerRef} {...provided.droppableProps}>
              {dashboards.find(d => d.id === activeDashboardId)?.widgets.map((widget, idx) => (
                <Draggable key={widget.id} draggableId={widget.id} index={idx}>
                  {(provided) => (
                    <Grid item xs={12} md={6} lg={4} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <Paper sx={{ p: 2, position: 'relative' }}>
                        <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => handleRemoveWidget(widget.id)}><DeleteIcon /></IconButton>
                        {widget.type === 'forecast' ? (
                            <Box>
                                <Typography variant="h6">Forecast Data</Typography>
                                <Typography>{widget.data && widget.data.forecast ? widget.data.forecast.join(', ') : 'Loading...'}</Typography>
                            </Box>
                        ) : (
                            <Chart type={widget.type} data={widget.data} />
                        )}
                      </Paper>
                    </Grid>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Grid>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
}

async function fetchForecastData() {
    try {
        const response = await axios.post('/forecast');
        return response.data;
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        return null;
    }
}

export default DashboardBuilder;
