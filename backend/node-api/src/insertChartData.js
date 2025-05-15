import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medplat';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const ChartDataSchema = new mongoose.Schema({
  label: String,
  value: Number,
});

const ChartData = mongoose.model('ChartData', ChartDataSchema, 'chart_data');

const sampleData = [
  { label: 'January', value: 120 },
  { label: 'February', value: 150 },
  { label: 'March', value: 180 },
  { label: 'April', value: 200 },
  { label: 'May', value: 170 },
];

ChartData.insertMany(sampleData)
  .then(() => {
    console.log('Sample chart data inserted successfully');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error inserting chart data:', err);
    mongoose.connection.close();
  });