import React, { useEffect, useState, useContext } from 'react';
import { Container, Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, Button, Alert } from '@mui/material';
import { UserContext } from '../UserContext';
import axios from 'axios';

const roles = ['user', 'doctor', 'analyst', 'admin'];

const UserManagementPage = () => {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data.users);
      } catch (e) {
        setError('Could not fetch users.');
      }
    };
    if (user?.role === 'admin') fetchUsers();
  }, [user]);

  const handleRoleChange = async (username, newRole) => {
    setError(null); setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/users/set-role', { username, role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(u => u.username === username ? { ...u, role: newRole } : u));
      setSuccess(`Role for ${username} updated to ${newRole}`);
    } catch (e) {
      setError('Could not update role.');
    }
  };

  if (!user || user.role !== 'admin') {
    return <Typography variant="h6" color="error" sx={{ mt: 5 }}>Access Denied: Admins Only</Typography>;
  }

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5">User Management</Typography>
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.username}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onChange={e => handleRoleChange(u.username, e.target.value)}
                      disabled={u.role === 'admin'}
                    >
                      {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => handleRoleChange(u.username, u.role)}
                      disabled={u.role === 'admin'}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserManagementPage;
