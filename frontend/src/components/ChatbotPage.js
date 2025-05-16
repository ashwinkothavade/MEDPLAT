import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Collapse, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Divider, useTheme } from '@mui/material';
import axios from 'axios';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Custom aggregation controls
  const [groupByField, setGroupByField] = useState('');
  const [selectedNumericFields, setSelectedNumericFields] = useState([]);
  const [selectedAggs, setSelectedAggs] = useState(['count','mean','min','max','std']);
  const [groupByFilter, setGroupByFilter] = useState('');

  // Compute fields for controls and aggregation map
  const nonNumericFields = dataSummary ? dataSummary.fields.filter(f => dataSummary.sample.every(row => isNaN(Number(row[f])) || row[f] === '' || row[f] === null || row[f] === undefined)) : [];
  const numericFields = dataSummary ? dataSummary.fields.filter(f => dataSummary.sample.some(row => !isNaN(Number(row[f])) && row[f] !== '' && row[f] !== null && row[f] !== undefined)) : [];

  // Main aggregation map for custom controls
  const customGroupMap = React.useMemo(() => {
    if (!dataSummary || !groupByField || !selectedNumericFields.length) return {};
    const map = {};
    dataSummary.sample.forEach(row => {
      const groupVal = row[groupByField] || 'N/A';
      if (!map[groupVal]) map[groupVal] = {};
      selectedNumericFields.forEach(numField => {
        const val = Number(row[numField]);
        if (!isNaN(val)) {
          if (!map[groupVal][numField]) map[groupVal][numField] = [];
          map[groupVal][numField].push(val);
        }
      });
    });
    return map;
  }, [dataSummary, groupByField, selectedNumericFields]);

  // Initialize controls when dataSummary loads
  React.useEffect(() => {
    if (dataSummary) {
      const nonNum = dataSummary.fields.filter(f => dataSummary.sample.every(row => isNaN(Number(row[f])) || row[f] === '' || row[f] === null || row[f] === undefined));
      const num = dataSummary.fields.filter(f => dataSummary.sample.some(row => !isNaN(Number(row[f])) && row[f] !== '' && row[f] !== null && row[f] !== undefined));
      setGroupByField(nonNum[0] || '');
      setSelectedNumericFields(num);
      setSelectedAggs(['count','mean','min','max','std']);
      setGroupByFilter('');
    }
  }, [dataSummary]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/ai/nlp', { query: input });
      setMessages((prev) => [...prev, { from: 'bot', text: res.data.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Error: Could not get response.' }]);
    }
    setInput('');
    setLoading(false);
  };

  const handleDataSummary = async () => {
    setSummaryError(null);
    setSummaryOpen(true);
    try {
      const res = await axios.get('http://localhost:8000/api/data');
      if (res.data && Array.isArray(res.data.data)) {
        const fields = res.data.data.length > 0 ? Object.keys(res.data.data[0]) : [];
        setDataSummary({
          count: res.data.data.length,
          fields,
          sample: res.data.data.slice(0, 3),
        });
      } else {
        setDataSummary(null);
        setSummaryError('No data available.');
      }
    } catch (error) {
      setDataSummary(null);
      setSummaryError('Failed to fetch data summary.');
    }
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', my: 4 }}>
      <Paper elevation={3} sx={{ p: 2, bgcolor: isDark ? 'background.paper' : '#fff', color: isDark ? 'text.primary' : 'inherit' }}>
        <Typography variant="h5" gutterBottom sx={{ color: isDark ? 'primary.light' : 'primary.main' }}>Chatbot</Typography>
        <Box sx={{ minHeight: 300, mb: 2, bgcolor: isDark ? 'background.default' : '#f4f7fa', p: 2, borderRadius: 2 }}>
          {messages.map((msg, idx) => (
            <Box key={idx} textAlign={msg.from === 'user' ? 'right' : 'left'} my={0.5}>
              <Typography color={msg.from === 'user' ? (isDark ? 'primary.light' : 'primary.main') : (isDark ? 'secondary.light' : 'secondary.main')}>
                <b>{msg.from === 'user' ? 'You' : 'Bot'}:</b> {msg.text}
              </Typography>
            </Box>
          ))}
          {loading && <Typography color="textSecondary">Bot is typing...</Typography>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            value={input}
            onChange={e => setInput(e.target.value)}
            fullWidth
            placeholder="Type your message..."
            size="small"
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <Button variant="contained" onClick={handleSend} disabled={loading || !input.trim()}>Send</Button>
        </Box>
        <Button variant="outlined" fullWidth onClick={handleDataSummary} sx={{ mt: 2, mb: 1 }}>
          Show Data Summary
        </Button>
        <Collapse in={summaryOpen}>
          {summaryError && <Alert severity="error">{summaryError}</Alert>}
          {dataSummary && (
            <Paper elevation={1} sx={{ mt: 2, bgcolor: isDark ? 'background.default' : '#f7fafc', color: isDark ? 'text.primary' : 'inherit', p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: isDark ? 'primary.light' : 'primary.main', fontWeight: 700, letterSpacing: 1 }}>Data Summary</Typography>
              <Divider sx={{ mb: 2, bgcolor: isDark ? 'divider' : undefined }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mr: 2 }}>Total Records:</Typography>
                <Typography variant="body1">{dataSummary.count}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {/* Numeric Field Stats */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'secondary.main' }}>Numeric Field Statistics</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ mb: 2, bgcolor: isDark ? 'background.paper' : '#fff' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? 'grey.900' : '#e3e6ea' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: isDark ? 'primary.light' : 'inherit' }}>Field</TableCell>
                      <TableCell sx={{ color: isDark ? 'primary.light' : 'inherit' }}>Min</TableCell>
                      <TableCell sx={{ color: isDark ? 'primary.light' : 'inherit' }}>Max</TableCell>
                      <TableCell sx={{ color: isDark ? 'primary.light' : 'inherit' }}>Mean</TableCell>
                      <TableCell sx={{ color: isDark ? 'primary.light' : 'inherit' }}>Std Dev</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataSummary.fields.filter(field => dataSummary.sample.some(row => !isNaN(Number(row[field])) && row[field] !== '' && row[field] !== null && row[field] !== undefined)).map(field => {
                      const values = dataSummary.sample.map(row => Number(row[field])).filter(v => !isNaN(v));
                      if (values.length === 0) return null;
                      const min = Math.min(...values);
                      const max = Math.max(...values);
                      const mean = (values.reduce((a,b) => a+b,0)/values.length).toFixed(2);
                      const std = (Math.sqrt(values.reduce((a,b) => a + Math.pow(b-mean,2),0)/values.length)).toFixed(2);
                      return (
                        <TableRow key={field}>
                          <TableCell sx={{ fontWeight: 600 }}>{field}</TableCell>
                          <TableCell>{min}</TableCell>
                          <TableCell>{max}</TableCell>
                          <TableCell>{mean}</TableCell>
                          <TableCell>{std}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ mb: 2 }} />
              {/* Non-numeric Field Group-bys */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'secondary.main' }}>Non-Numeric Field Groupings</Typography>
              {dataSummary.fields.filter(field => dataSummary.sample.every(row => isNaN(Number(row[field])) || row[field] === '' || row[field] === null || row[field] === undefined)).map(field => {
                // Group by value and count
                const groupCounts = {};
                dataSummary.sample.forEach(row => {
                  const val = row[field] || 'N/A';
                  groupCounts[val] = (groupCounts[val] || 0) + 1;
                });
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{`Grouped by ${field}:`}</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ bgcolor: isDark ? 'background.paper' : '#fff' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: isDark ? 'grey.900' : '#e3e6ea' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: isDark ? 'primary.light' : 'inherit' }}>{field}</TableCell>
                            <TableCell sx={{ color: isDark ? 'primary.light' : 'inherit' }}>Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(groupCounts).map(([val, count]) => (
                            <TableRow key={val}>
                              <TableCell>{val}</TableCell>
                              <TableCell>{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
              {/* Customizable Aggregation Controls */}
              <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Advanced Grouped Numeric Aggregations:</Typography>
              {/* Controls: group by, numeric fields, aggregation types, filter */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2">Group by:</Typography>
                  <select value={groupByField} onChange={e => setGroupByField(e.target.value)}>
                    {nonNumericFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <Typography variant="body2">Numeric fields:</Typography>
                  <select multiple value={selectedNumericFields} onChange={e => setSelectedNumericFields(Array.from(e.target.selectedOptions, o => o.value))}>
                    {numericFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <Typography variant="body2">Aggregations:</Typography>
                  <select multiple value={selectedAggs} onChange={e => setSelectedAggs(Array.from(e.target.selectedOptions, o => o.value))}>
                    {['count','mean','min','max','std'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2">Filter {groupByField}:</Typography>
                  <input type="text" placeholder="Type to filter..." value={groupByFilter} onChange={e => setGroupByFilter(e.target.value)} />
                </Box>
              </Box>
              {/* Aggregation Table */}
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: isDark ? 'background.paper' : '#fff' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? 'grey.900' : '#e3e6ea' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: isDark ? 'primary.light' : 'inherit' }}>{groupByField}</TableCell>
                      {selectedNumericFields.flatMap(numField => (
                        selectedAggs.map(agg => (
                          <TableCell key={numField+agg+':field'} sx={{ fontWeight: 600, color: isDark ? 'primary.light' : 'inherit' }}>{numField} ({agg})</TableCell>
                        ))
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(customGroupMap).map(([groupVal, numObj]) => {
                      if (groupByFilter && !groupVal.toLowerCase().includes(groupByFilter.toLowerCase())) return null;
                      return (
                        <TableRow key={groupVal}>
                          <TableCell>{groupVal}</TableCell>
                          {selectedNumericFields.flatMap(numField => (
                            selectedAggs.map(agg => {
                              const vals = numObj[numField] || [];
                              if (vals.length === 0) return <TableCell key={numField+agg+':empty'}>-</TableCell>;
                              switch(agg) {
                                case 'count': return <TableCell key={numField+agg+':val'}>{vals.length}</TableCell>;
                                case 'mean': return <TableCell key={numField+agg+':val'}>{(vals.reduce((a,b) => a+b,0)/vals.length).toFixed(2)}</TableCell>;
                                case 'min': return <TableCell key={numField+agg+':val'}>{Math.min(...vals)}</TableCell>;
                                case 'max': return <TableCell key={numField+agg+':val'}>{Math.max(...vals)}</TableCell>;
                                case 'std': {
                                  const mean = vals.reduce((a,b) => a+b,0)/vals.length;
                                  const std = Math.sqrt(vals.reduce((a,b) => a + Math.pow(b-mean,2),0)/vals.length).toFixed(2);
                                  return <TableCell key={numField+agg+':val'}>{std}</TableCell>;
                                }
                                default: return <TableCell key={numField+agg+':val'}>-</TableCell>;
                              }
                            })
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Collapse>
      </Paper>
    </Box>
  );
};

export default ChatbotPage;
