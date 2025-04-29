import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Chart from './Chart';

const initialWidgets = [];

function DashboardBuilder({ onNLPQuery }) {
  const [widgets, setWidgets] = useState(initialWidgets);

  const handleAddWidget = () => {
    setWidgets([...widgets, { id: `widget-${Date.now()}`, type: 'bar', data: null }]);
  };

  const handleRemoveWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(widgets);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setWidgets(reordered);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h5" flexGrow={1}>Dashboard Builder</Typography>
        <Button startIcon={<AddIcon />} onClick={handleAddWidget} variant="contained">Add Widget</Button>
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-droppable" direction="horizontal">
          {(provided) => (
            <Grid container spacing={2} ref={provided.innerRef} {...provided.droppableProps}>
              {widgets.map((widget, idx) => (
                <Draggable key={widget.id} draggableId={widget.id} index={idx}>
                  {(provided) => (
                    <Grid item xs={12} md={6} lg={4} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <Paper sx={{ p: 2, position: 'relative' }}>
                        <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => handleRemoveWidget(widget.id)}><DeleteIcon /></IconButton>
                        <Chart type={widget.type} data={widget.data} />
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

export default DashboardBuilder;
