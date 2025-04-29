import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const HomePage = () => (
  <Container maxWidth="md">
    <Box mt={6} textAlign="center">
      <Typography variant="h3" gutterBottom>Welcome to MEDPlat</Typography>
      <Typography variant="h6" color="textSecondary">
        AI-Enabled Medical Dashboard Platform
      </Typography>
      <Typography variant="body1" mt={2}>
        Use the navigation bar to chat with the AI, upload your data, or view interactive dashboards.
      </Typography>
    </Box>
    <Box mt={8}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1 }}>
        Why Choose MEDPlat?
      </Typography>
      <Box display="flex" flexWrap="wrap" justifyContent="center" gap={4} mt={4}>
        <FeatureCard
          icon="dashboard"
          title="Dynamic Dashboards"
          description="Create, customize, and view multiple interactive charts—no coding required. Drag, drop, and personalize your analytics!"
        />
        <FeatureCard
          icon="psychology"
          title="AI-Powered Insights"
          description="Get instant summaries, anomaly alerts, and trend forecasts. Let AI highlight what matters most in your data."
        />
        <FeatureCard
          icon="chat"
          title="Natural Language Queries"
          description="Ask questions like 'Show weekly admissions in Ward X' and generate charts automatically."
        />
        <FeatureCard
          icon="person_search"
          title="Personalized KPIs"
          description="See recommendations tailored to your role and usage—doctors, managers, and admins get relevant metrics instantly."
        />
        <FeatureCard
          icon="cloud_upload"
          title="Seamless Data Uploads"
          description="Drag-and-drop CSV/JSON files or connect to live data sources. MEDPlat adapts to your workflow."
        />
        <FeatureCard
          icon="security"
          title="Secure & Role-Based"
          description="Your data is protected. Role-based access ensures everyone sees only what they should."
        />
      </Box>
    </Box>
  </Container>
);

// FeatureCard component for visual appeal
import { Paper, Avatar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChatIcon from '@mui/icons-material/Chat';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';

const iconMap = {
  dashboard: <DashboardIcon fontSize="large" color="primary" />,
  psychology: <PsychologyIcon fontSize="large" color="secondary" />,
  chat: <ChatIcon fontSize="large" color="success" />,
  person_search: <PersonSearchIcon fontSize="large" color="info" />,
  cloud_upload: <CloudUploadIcon fontSize="large" color="warning" />,
  security: <SecurityIcon fontSize="large" color="error" />,
};

function FeatureCard({ icon, title, description }) {
  return (
    <Paper elevation={6} sx={{ p: 3, width: 270, textAlign: 'center', borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-6px)', boxShadow: 10 } }}>
      <Avatar sx={{ bgcolor: 'white', mx: 'auto', mb: 1, width: 56, height: 56 }}>
        {iconMap[icon]}
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
      <Typography variant="body2" color="textSecondary">{description}</Typography>
    </Paper>
  );
}

export default HomePage;
