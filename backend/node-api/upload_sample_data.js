import mongoose from 'mongoose';
import fs from 'fs';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medplat'; // Update if needed
const UploadedDataSchema = new mongoose.Schema({}, { strict: false });
const UploadedData = mongoose.model('UploadedData', UploadedDataSchema, 'uploaded_data');

async function upload() {
  await mongoose.connect(uri);
  const data = JSON.parse(fs.readFileSync('sample_data.json', 'utf-8'));
  await UploadedData.deleteMany({});
  await UploadedData.insertMany(data);
  console.log('Sample data uploaded!');
  process.exit(0);
}

upload().catch(e => {
  console.error(e);
  process.exit(1);
});
