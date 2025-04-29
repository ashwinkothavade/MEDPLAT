import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import { parse as csvParse } from 'csv-parse/sync';
import fs from 'fs';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medplat';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

import aiRouter from './ai.js';

app.use('/api/ai', aiRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Node API running on port ${PORT}`);
});
