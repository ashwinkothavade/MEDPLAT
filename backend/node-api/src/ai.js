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
  // Get the uploaded data collection
  const UploadedData = mongoose.connection.model('UploadedData', new mongoose.Schema({}, { strict: false }), 'uploaded_data');

  if (typeof query === 'string' && query.toLowerCase().includes('case load')) {
    // Try to aggregate 'case load' by week if possible
    try {
      // Try to find week and case count fields
      const sample = await UploadedData.findOne();
      if (!sample) return res.json({ chartData: null, summary: 'No uploaded data available.' });
      // Try to auto-detect week and case fields
      const keys = Object.keys(sample.toObject());
      const weekField = keys.find(k => k.toLowerCase().includes('week')) || keys[0];
      const caseField = keys.find(k => k.toLowerCase().includes('case')) || keys[1];
      // Aggregate counts by week
      const docs = await UploadedData.find({});
      const weekMap = {};
      docs.forEach(doc => {
        const week = doc[weekField] || 'Unknown';
        const count = Number(doc[caseField]) || 0;
        weekMap[week] = (weekMap[week] || 0) + count;
      });
      const labels = Object.keys(weekMap);
      const values = labels.map(l => weekMap[l]);
      const chartData = {
        labels,
        datasets: [{ label: 'Cases', data: values, backgroundColor: '#1976d2' }]
      };
      return res.json({ chartData, summary: `Weekly case load summary based on uploaded data.` });
    } catch (err) {
      return res.status(500).json({ chartData: null, summary: 'Error analyzing uploaded data.', error: err.message });
    }
  }
  res.json({ chartData: null, summary: 'No data found for query.' });
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
