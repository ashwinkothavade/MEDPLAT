import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper } from '@mui/material';
import axios from 'axios';
import DataSummary from './DataSummary';

const ChatbotPage = () => {
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
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom>Chatbot</Typography>
        <Paper style={{ minHeight: 300, padding: 16, marginBottom: 16 }}>
          {messages.map((msg, idx) => (
            <Box key={idx} textAlign={msg.from === 'user' ? 'right' : 'left'}>
              <Typography color={msg.from === 'user' ? 'primary' : 'secondary'}>
                <b>{msg.from === 'user' ? 'You' : 'Bot'}:</b> {msg.text}
              </Typography>
            </Box>
          ))}
          {loading && <Typography color="textSecondary">Bot is typing...</Typography>}
        </Paper>
        <Box display="flex" gap={2}>
          <TextField
            value={input}
            onChange={e => setInput(e.target.value)}
            fullWidth
            placeholder="Type your message..."
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <Button variant="contained" onClick={handleSend} disabled={loading}>Send</Button>
        </Box>
        <DataSummary />
      </Box>
    </Container>
  );
};

export default ChatbotPage;
