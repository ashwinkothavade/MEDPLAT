import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

function NLPQueryInput({ onSubmit }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
      setQuery('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} mb={2} display="flex" gap={2}>
      <TextField
        label="Ask a question (e.g. 'Show weekly case load in Ward X')"
        value={query}
        onChange={e => setQuery(e.target.value)}
        fullWidth
      />
      <Button type="submit" variant="contained">Ask</Button>
    </Box>
  );
}

export default NLPQueryInput;
