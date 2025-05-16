import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, IconButton, Fade } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1500 }}>
          <IconButton color="primary" size="large" onClick={() => setOpen(true)} sx={{ boxShadow: 3, bgcolor: 'white' }}>
            <ChatIcon fontSize="large" />
          </IconButton>
        </Box>
      )}
      {/* Chat Widget */}
      <Fade in={open} unmountOnExit>
        <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1600, width: 340, maxWidth: '90vw' }}>
          <Paper elevation={6} sx={{ borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 420 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'primary.main', color: 'white', px: 2, py: 1 }}>
              <ChatIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Chatbot</Typography>
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ flex: 1, px: 2, py: 1, overflowY: 'auto', bgcolor: '#f4f7fa' }}>
              {messages.map((msg, idx) => (
                <Box key={idx} textAlign={msg.from === 'user' ? 'right' : 'left'} my={0.5}>
                  <Typography color={msg.from === 'user' ? 'primary' : 'secondary'}>
                    <b>{msg.from === 'user' ? 'You' : 'Bot'}:</b> {msg.text}
                  </Typography>
                </Box>
              ))}
              {loading && <Typography color="textSecondary">Bot is typing...</Typography>}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, p: 1, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
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
          </Paper>
        </Box>
      </Fade>
    </>
  );
};

export default ChatbotWidget;
