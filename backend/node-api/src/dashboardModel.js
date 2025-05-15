import mongoose from 'mongoose';

const WidgetSchema = new mongoose.Schema({
  id: String,
  type: String,
  config: Object,
});

const DashboardSchema = new mongoose.Schema({
  user: { type: String, required: true }, // username or userId
  name: { type: String, required: true },
  widgets: [WidgetSchema],
});

const Dashboard = mongoose.model('Dashboard', DashboardSchema, 'dashboards');

export default Dashboard;
