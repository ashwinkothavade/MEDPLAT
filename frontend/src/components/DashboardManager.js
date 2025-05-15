import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MultiGraphDashboard from './MultiGraphDashboard';

// DashboardManager: lets users create, name, select, and remove dashboards (dynamic, not fixed)
const DashboardManager = () => {
  const [dashboards, setDashboards] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch dashboards from backend on mount
  useEffect(() => {
    const fetchDashboards = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/dashboards', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.dashboards && data.dashboards.length > 0) {
          setDashboards(data.dashboards);
          setActiveId(data.dashboards[0]._id);
        } else {
          setDashboards([]);
          setActiveId(null);
        }
      } catch (e) {
        setDashboards([]);
        setActiveId(null);
      }
      setLoading(false);
    };
    fetchDashboards();
  }, []);

  // Save dashboard to backend
  const saveDashboard = async (dashboard) => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/dashboards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: dashboard._id,
        name: dashboard.name,
        widgets: dashboard.widgets || []
      })
    });
    const data = await res.json();
    return data.dashboard;
  };

  // Add new dashboard
  const handleAddDashboard = async () => {
    if (!newName.trim()) return;
    const newDashboard = { name: newName, widgets: [] };
    const saved = await saveDashboard(newDashboard);
    setDashboards([...dashboards, saved]);
    setActiveId(saved._id);
    setNewName('');
    setAddDialog(false);
  };
  // Remove dashboard
  const handleRemoveDashboard = async (id) => {
    if (dashboards.length === 1) return;
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/api/dashboards/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const idx = dashboards.findIndex(d => d._id === id);
    const nextIdx = idx === 0 ? 1 : idx - 1;
    const newDashboards = dashboards.filter(d => d._id !== id);
    setDashboards(newDashboards);
    setActiveId(newDashboards[nextIdx]?._id || null);
  };
  // Rename dashboard
  const handleRename = async (id, name) => {
    const dashboard = dashboards.find(d => d._id === id);
    if (!dashboard) return;
    const updated = { ...dashboard, name };
    const saved = await saveDashboard(updated);
    setDashboards(dashboards.map(d => d._id === id ? saved : d));
  };
  // Save widgets change
  const handleWidgetsChange = async (id, widgets) => {
    const dashboard = dashboards.find(d => d._id === id);
    if (!dashboard) return;
    const updated = { ...dashboard, widgets };
    const saved = await saveDashboard(updated);
    setDashboards(dashboards.map(d => d._id === id ? saved : d));
  };

  // Save dashboard button handler
  const handleSaveDashboard = () => {
    const dashboard = dashboards.find(d => d._id === activeId);
    if (dashboard) {
      handleWidgetsChange(activeId, dashboard.widgets);
    }
  };



  return (
    <Box mt={4}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700 }}>Your Dashboards</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>
          Add Dashboard
        </Button>
        <Button variant="outlined" color="success" sx={{ ml: 2 }} onClick={handleSaveDashboard} disabled={!activeId}>
          Save Dashboard
        </Button>
      </Box>
      <Box display="flex" alignItems="center" mb={2}>
        {loading ? <Typography>Loading dashboards...</Typography> : dashboards.map(d => (
          <Button
            key={d._id}
            variant={d._id === activeId ? 'contained' : 'outlined'}
            onClick={() => setActiveId(d._id)}
            sx={{ mr: 1 }}
            onDoubleClick={() => {
              const newLabel = prompt('Rename dashboard', d.name);
              if (newLabel) handleRename(d._id, newLabel);
            }}
          >
            {d.name}
            {dashboards.length > 1 && (
              <IconButton size="small" sx={{ ml: 1 }} onClick={e => { e.stopPropagation(); handleRemoveDashboard(d._id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Button>
        ))} 
        <Button startIcon={<AddIcon />} onClick={() => setAddDialog(true)} variant="contained" color="success">Add Dashboard</Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        {/* Each dashboard has its own MultiGraphDashboard (graphs are per-dashboard) */}
        {activeId && dashboards.length > 0 && (
          <MultiGraphDashboard
            key={activeId}
            dashboardId={activeId}
            widgets={dashboards.find(d => d._id === activeId)?.widgets || []}
            setWidgets={widgets => handleWidgetsChange(activeId, widgets)}
          />
        )}
      </Paper>
      <Dialog open={addDialog} onClose={() => setAddDialog(false)}>
        <DialogTitle>Add New Dashboard</DialogTitle>
        <DialogContent>
          <TextField label="Dashboard Name" value={newName} onChange={e => setNewName(e.target.value)} fullWidth autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddDashboard} disabled={!newName.trim()}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardManager;
