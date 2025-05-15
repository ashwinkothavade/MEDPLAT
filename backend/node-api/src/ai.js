import express from 'express';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// NLP endpoint
import mongoose from 'mongoose';

router.post('/nlp', async (req, res) => {
  const { query } = req.body;
  const UploadedData = mongoose.connection.model('UploadedData', new mongoose.Schema({}, { strict: false }), 'uploaded_data');
  if (typeof query !== 'string') {
    return res.json({ reply: 'Please enter a valid question.', chartData: null });
  }
  const q = query.toLowerCase();
  try {
    const sample = await UploadedData.findOne();
    if (!sample) return res.json({ reply: 'No uploaded data available.', chartData: null });
    const keys = Object.keys(sample.toObject()).filter(k => k !== '_id' && k !== '__v');
    // Detect numeric and categorical fields
    const docs = await UploadedData.find({}).limit(1000); // limit for perf
    const numericFields = keys.filter(k => docs.some(d => typeof d[k] === 'number' || (!isNaN(Number(d[k])) && d[k] !== null)));
    const categoricalFields = keys.filter(k => !numericFields.includes(k));
    // Helper: find best field match for a keyword
    function findField(keyword) {
      return keys.find(k => k.toLowerCase().includes(keyword));
    }
    // Helper: list all fields
    if (q.includes('fields') || q.includes('columns')) {
      return res.json({ reply: `Available fields: ${keys.join(', ')}`, chartData: null });
    }
    // Try to match aggregation type
    let aggType = null;
    if (q.match(/total|sum/)) aggType = 'sum';
    else if (q.match(/average|mean/)) aggType = 'avg';
    else if (q.match(/minimum|min/)) aggType = 'min';
    else if (q.match(/maximum|max/)) aggType = 'max';
    // Try to match group by
    let groupMatch = q.match(/by ([a-z0-9_]+)/);
    let groupField = groupMatch ? findField(groupMatch[1]) : null;
    // Try to match field
    let field = null;
    for (let k of keys) {
      if (q.includes(k.toLowerCase())) { field = k; break; }
    }
    // If user asks about a specific field
    if (!field && aggType) {
      // Try to find first numeric field
      field = numericFields[0];
    }
    if (!field && groupField) {
      // Try to find first numeric field for aggregation
      field = numericFields[0];
    }
    if (!field && (q.includes('data') || q.includes('record'))) {
      return res.json({ reply: `Available fields: ${keys.join(', ')}`, chartData: null });
    }
    // If no field found, fallback
    if (!field) {
      return res.json({ reply: `Sorry, I could not understand your question. Available fields: ${keys.join(', ')}`, chartData: null });
    }
    // Aggregation logic
    let reply = '';
    let chartData = null;
    if (aggType && field) {
      let vals = docs.map(d => Number(d[field])).filter(v => !isNaN(v));
      if (vals.length === 0) return res.json({ reply: `No numeric data found for field '${field}'.`, chartData: null });
      if (aggType === 'sum') reply = `Sum of ${field}: ${vals.reduce((a,b)=>a+b,0)}`;
      if (aggType === 'avg') reply = `Average of ${field}: ${(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)}`;
      if (aggType === 'min') reply = `Minimum of ${field}: ${Math.min(...vals)}`;
      if (aggType === 'max') reply = `Maximum of ${field}: ${Math.max(...vals)}`;
      return res.json({ reply, chartData: null });
    }
    // Group by logic
    if (groupField && field) {
      let groupMap = {};
      docs.forEach(d => {
        const groupVal = d[groupField] || 'Unknown';
        const val = Number(d[field]);
        if (!isNaN(val)) {
          groupMap[groupVal] = (groupMap[groupVal] || 0) + val;
        }
      });
      const labels = Object.keys(groupMap);
      const values = labels.map(l => groupMap[l]);
      chartData = {
        labels,
        datasets: [{ label: `${field} by ${groupField}`, data: values, backgroundColor: '#1976d2' }]
      };
      reply = `Grouped ${field} by ${groupField}: ${labels.map((l,i)=>l+': '+values[i]).join(', ')}`;
      return res.json({ reply, chartData });
    }
    // If only field is found, show some stats
    if (field && numericFields.includes(field)) {
      let vals = docs.map(d => Number(d[field])).filter(v => !isNaN(v));
      if (vals.length === 0) return res.json({ reply: `No numeric data found for field '${field}'.`, chartData: null });
      const sum = vals.reduce((a,b)=>a+b,0);
      const avg = (sum/vals.length).toFixed(2);
      reply = `Field '${field}': sum=${sum}, avg=${avg}, min=${Math.min(...vals)}, max=${Math.max(...vals)}`;
      return res.json({ reply, chartData: null });
    }
    // Otherwise, fallback
    return res.json({ reply: `Sorry, I could not answer your question. Available fields: ${keys.join(', ')}`, chartData: null });
  } catch (err) {
    return res.status(500).json({ reply: 'Error analyzing uploaded data.', chartData: null, error: err.message });
  }
});

// Anomaly detection stub
router.post('/anomaly', (req, res) => {
  res.json({ anomaly: false });
});

// Forecast stub
router.post('/forecast', (req, res) => {
  res.json({ forecast: [] });
});

export default router;
