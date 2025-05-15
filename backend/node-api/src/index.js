import express from 'express';
import Dashboard from './dashboardModel.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import { parse as csvParse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import aiRouter from './ai.js';
import { PythonShell } from 'python-shell';
import os from 'os';
dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medplat';
let db;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    console.log('MongoDB connected');
    db = client.connection.db; // Assign db globally
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Mongoose schema for uploaded data
const UploadedDataSchema = new mongoose.Schema({}, { strict: false });
const UploadedData = mongoose.model('UploadedData', UploadedDataSchema, 'uploaded_data');

// User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema, 'users');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Welcome to the MedPlat API');
}
);
// RBAC middleware (sample)
function rbac(role) {
  return (req, res, next) => {
    // In production, check JWT or session for user role
    if (!req.headers['x-role'] || req.headers['x-role'] !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
// Middleware to extract user from token (stub; replace with real JWT parsing in production)
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  // In production, verify JWT and extract username
  // For now, just decode as plain username for demo
  req.username = token; // WARNING: This is insecure! Replace with JWT verify in production.
  next();
}

// DASHBOARD ENDPOINTS
// Get all dashboards for current user
app.get('/api/dashboards', authMiddleware, async (req, res) => {
  try {
    const dashboards = await Dashboard.find({ user: req.username });
    res.json({ dashboards });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboards', details: err.message });
  }
});
// Save or update a dashboard
app.post('/api/dashboards', authMiddleware, async (req, res) => {
  const { id, name, widgets } = req.body;
  if (!name || !Array.isArray(widgets)) return res.status(400).json({ error: 'Name and widgets required' });
  try {
    let dashboard;
    if (id) {
      dashboard = await Dashboard.findOneAndUpdate(
        { _id: id, user: req.username },
        { name, widgets },
        { new: true }
      );
    } else {
      dashboard = await Dashboard.create({ user: req.username, name, widgets });
    }
    res.json({ dashboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save dashboard', details: err.message });
  }
});
// Delete a dashboard
app.delete('/api/dashboards/:id', authMiddleware, async (req, res) => {
  try {
    await Dashboard.deleteOne({ _id: req.params.id, user: req.username });
    res.json({ status: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete dashboard', details: err.message });
  }
});

// GET /api/me - get current user profile
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { username: user.username, email: user.email || '', role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

//for login
app.post('/token', async (req, res) => {
  console.log('Request headers:', req.headers); // Debugging log
  console.log('Request body:', req.body); // Debugging log
  const { username, password } = req.body;
  try {
    const user = await db.collection('users').findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = `demo-token-${user.role}`;
    res.json({ status: 'success', token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ detail: 'Username, password, and role are required.' });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ detail: 'Username already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed, role });
    res.json({ status: 'registered' });
  } catch (err) {
    res.status(500).json({ detail: 'Registration failed', error: err.message });
  }
});

// Users
app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Admin', role: 'admin' }, { id: 2, name: 'Doctor', role: 'doctor' }]);
});

// Dashboards
app.get('/api/dashboards', (req, res) => {
  res.json([{ id: 1, name: 'Ward X Dashboard', widgets: [] }]);
});
app.post('/api/dashboards', rbac('admin'), (req, res) => {
  // Save dashboard config
  res.json({ status: 'created' });
});

// Data source management
app.get('/api/datasources', rbac('admin'), (req, res) => {
  res.json([{ id: 1, type: 'csv', name: 'Admissions' }]);
});

// CSV Upload
app.post('/api/upload', rbac('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  let records = [];
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    if (ext === 'csv') {
      const csv = fileBuffer.toString();
      records = csvParse(csv, { columns: true, skip_empty_lines: true });
    } else if (ext === 'json') {
      records = JSON.parse(fileBuffer.toString());
      if (!Array.isArray(records)) records = [records];
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    if (records.length === 0) return res.status(400).json({ error: 'No data found in file' });
    const result = await UploadedData.insertMany(records);
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.json({ status: 'uploaded', inserted_count: result.length });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process file', details: err.message });
  }
});

// Data fetch (stub)
app.get('/api/data', async (req, res) => {
  try {
    const docs = await UploadedData.find({}).limit(1000);
    res.json({ data: docs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
});


app.use('/api/ai', aiRouter);

app.get('/suggest-kpis', (req, res) => {
  res.json({ message: 'This is a placeholder response for suggest-kpis.' });
});

  app.get('/api/me', async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

  try {
    console.log('Received token:', token); // Debugging log
    console.log('Token format:', token); // Debugging log
    if (!token.includes(' ')) {
      console.error('Invalid token format:', token); // Debugging log
      return res.status(400).json({ error: 'Invalid token format' });
    }
    const username = token.split(' ')[1]; // Simplified token logic
    console.log('Extracted username after split:', username); // Debugging log
    console.log('Extracted username after split:', username); // Debugging log
    console.log('Extracted username:', username); // Debugging log
    console.log('Querying database for username:', username); // Debugging log
    const user = await db.collection('users').findOne({ username });
    console.log('Database query result:', user); // Debugging log
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

const PORT = process.env.PORT || 8000;
app.post('/anomaly', async (req, res) => {
  // Functional anomaly detection
  // Expects: { field: 'admissions', threshold: 2 (optional) }
  const { field, threshold } = req.body;
  if (!field) return res.status(400).json({ error: 'Missing field parameter' });
  try {
    const records = await UploadedData.find({});
    const values = records.map(r => Number(r[field])).filter(v => !isNaN(v));
    if (values.length === 0) return res.status(404).json({ error: `No numeric data for field '${field}'` });
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stddev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    const thresh = typeof threshold === 'number' && threshold > 0 ? threshold : 2;
    const anomalies = records.filter(r => {
      const v = Number(r[field]);
      return !isNaN(v) && Math.abs(v - mean) > thresh * stddev;
    });
    res.json({
      field,
      mean,
      stddev,
      threshold: thresh,
      anomaly_count: anomalies.length,
      anomalies
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to detect anomalies', details: err.message });
  }
});


// User Management API for Admins
app.get('/api/user-management', rbac('admin'), (req, res) => {
    res.json({ message: 'Welcome to the User Management page. Admin access only.' });
});


app.post('/forecast', async (req, res) => {
  // Expects: { field: 'admissions', periods: 7, freq: 'D' }
  const { field, periods = 7, freq = 'D' } = req.body;
  console.log('[Forecast] Request body:', req.body);
  if (!field) return res.status(400).json({ error: 'Missing field parameter' });
  try {
    const records = await UploadedData.find({});
    // Prepare data for Prophet: columns ds (date), y (value)
    const rows = records
      .map(r => ({ ds: r.date || r.ds, y: Number(r[field]) }))
      .filter(r => r.ds && !isNaN(r.y));
    console.log(`[Forecast] Number of rows for Prophet: ${rows.length}`);
    if (rows.length < 2) {
      console.error('[Forecast] Not enough data for forecasting.');
      return res.status(400).json({ error: 'Not enough data for forecasting' });
    }
    // Write to temp CSV
    const tmp = os.tmpdir();
    const csvPath = `${tmp}/prophet_input_${Date.now()}.csv`;
    const outPath = `${tmp}/prophet_output_${Date.now()}.csv`;
    const csvContent = 'ds,y\n' + rows.map(r => `${r.ds},${r.y}`).join('\n');
    try {
      fs.writeFileSync(csvPath, csvContent);
    } catch (fileErr) {
      console.error('[Forecast] Failed to write CSV:', fileErr);
      return res.status(500).json({ error: 'Failed to write CSV', details: fileErr.message });
    }
    // Prepare Python script
    const script = `import sys\nimport pandas as pd\nfrom prophet import Prophet\ninput_path = sys.argv[1]\nout_path = sys.argv[2]\nperiods = int(sys.argv[3])\nfreq = sys.argv[4]\ndf = pd.read_csv(input_path)\nm = Prophet()\nm.fit(df)\nfuture = m.make_future_dataframe(periods=periods, freq=freq)\nforecast = m.predict(future)\nforecast[['ds','yhat','yhat_lower','yhat_upper']].to_csv(out_path, index=False)\n`;
    const scriptPath = `${tmp}/run_prophet_${Date.now()}.py`;
    try {
      fs.writeFileSync(scriptPath, script);
    } catch (fileErr) {
      console.error('[Forecast] Failed to write Python script:', fileErr);
      return res.status(500).json({ error: 'Failed to write Python script', details: fileErr.message });
    }
    // Run PythonShell
    PythonShell.run(scriptPath, { args: [csvPath, outPath, String(periods), freq], pythonOptions: ['-u'] }, (err) => {
      if (err) {
        console.error('[Forecast] PythonShell error:', err);
        return res.status(500).json({ error: 'Forecasting failed', details: err.message });
      }
      try {
        let outCsv;
        try {
          outCsv = fs.readFileSync(outPath, 'utf-8');
        } catch (readErr) {
          console.error('[Forecast] Failed to read forecast output:', readErr);
          return res.status(500).json({ error: 'Could not read forecast output', details: readErr.message });
        }
        const lines = outCsv.trim().split('\n');
        const header = lines[0].split(',');
        const result = lines.slice(1).map(line => {
          const vals = line.split(',');
          const obj = {};
          header.forEach((h, i) => { obj[h] = isNaN(Number(vals[i])) ? vals[i] : Number(vals[i]); });
          return obj;
        });
        res.json({ field, periods, freq, forecast: result });
      } catch (e) {
        res.status(500).json({ error: 'Could not read forecast output', details: e.message });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run forecast', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Node API running on port ${PORT}`);
});

// Add NLP endpoint
app.post('/api/ai/nlp', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ reply: 'Query is required.' });
  }

  const axios = require('axios');
  const { MongoClient } = require('mongodb');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const MONGO_URI = process.env.MONGO_URI;
  const MONGO_DB = process.env.MONGO_DB;
  const MONGO_COLLECTION = process.env.MONGO_COLLECTION;

  try {
    // Send query to Gemini API
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY,
      { query },
      { headers: { Authorization: `Bearer ${GEMINI_API_KEY}` } }
    );

    // Connect to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLLECTION);

    // Fetch relevant data from MongoDB
    const data = await collection.find({}).toArray();

    // Combine Gemini response with MongoDB data
    const reply = `Gemini says: ${geminiResponse.data.reply}. Based on our data: ${JSON.stringify(data)}`;

    res.json({ reply });

    await client.close();
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ reply: 'An error occurred while processing your query.' });
  }
});

// Endpoint to fetch all users

// Endpoint to change a user's password
app.post('/api/change-password', (req, res) => {
  const token = req.headers['authorization'];
  console.log('Received token:', token); // Debugging log
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required' });
  }
  try {
    console.log('Updating password for user:', username); // Debugging log
    const hashedPassword = bcrypt.hashSync(newPassword, 10); // Ensure bcrypt is imported
    const result = db.collection('users').updateOne({ username }, { $set: { password: hashedPassword } });
    console.log('Update result:', result); // Debugging log
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Endpoint to update user roles
app.post('/api/users/set-role', async (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }
  if (role === 'admin') {
    return res.status(403).json({ error: 'Cannot assign admin role' });
  }
  try {
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot change role of an admin' });
    }
    await db.collection('users').updateOne({ username }, { $set: { role } });
    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});
