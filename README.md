# AI-Enabled Dashboard Builder (MEDPlat)

This project is a modular, AI-powered dashboard builder for the MEDPlat platform. It enables non-technical users to create, customize, and analyze dashboards with live data, AI insights, and natural language queries.

## Features
- Drag-and-drop dashboard builder
- Dynamic chart rendering (Chart.js/Plotly)
- NLP-based chart and KPI generation
- AI-powered anomaly detection, forecasting, and summaries
- Data source agnostic (SQL, API, CSV)
- Role-based access control (RBAC)
- Modular, scalable backend (Node.js + Python FastAPI)
- Real-time data visualization
- Custom widget creation
- Data export capabilities

## Project Goals

### Medical Data Management
- Create a centralized platform for medical data collection and analysis
- Support various medical data formats (CSV, JSON, Excel)
- Implement secure data storage and access controls
- Enable real-time data synchronization

### AI-Powered Analytics
- Provide natural language processing capabilities for queries
- Implement predictive analytics for care
- Enable anomaly detection in data patterns
- Generate automated reports and insights

### User Experience
- Create an intuitive interface for professionals
- Enable drag-and-drop dashboard creation
- Provide customizable visualization options
- Support mobile-responsive design

### Security and Compliance
- Implement role-based access control (RBAC)
- Implement secure authentication and authorization
- Protect privacy and data integrity

### Scalability and Performance
- Design for handling large datasets
- Implement efficient data processing algorithms
- Support real-time data updates
- Ensure fast response times for critical operations

## Implementation Details

### Architecture
- Microservices-based architecture for scalability
- Separate services for data processing, AI, and frontend
- RESTful API design for backend services
- WebSocket implementation for real-time updates

### Data Flow
1. Data Ingestion
   - Multiple data source connectors
   - Automated data validation
   - Error handling and logging

2. Data Processing
   - Real-time data transformation
   - Batch processing for historical data
   - Data quality checks

3. AI/ML Pipeline
   - NLP model for medical queries
   - Anomaly detection algorithms
   - Forecasting models
   - Automated report generation

4. Frontend Integration
   - React-based component architecture
   - State management with Redux
   - Responsive UI components
   - Real-time update handling

### Security Implementation
1. Authentication
   - JWT-based token system
   - Password hashing with bcrypt
   - Session management

2. Authorization
   - Role-based access control
   - Permission management
   - Audit logging

3. Data Protection
   - End-to-end encryption
   - Regular backups
   - Data validation
   - Input sanitization

### Performance Optimization
1. Database
   - Index optimization
   - Query optimization
   - Caching strategy

2. API
   - Rate limiting
   - Request validation
   - Response compression
   - Error handling

3. Frontend
   - Code splitting
   - Lazy loading
   - Performance monitoring
   - Resource optimization

## Tech Stack
- Frontend: React, Chart.js/Plotly
- Backend: Node.js (Express), Python (FastAPI)
- AI/NLP: OpenAI API, Prophet, scikit-learn
- Database: MongoDB
- Authentication: JWT
- File Handling: Multer

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- MongoDB
- npm (Node Package Manager)
- pip (Python Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MEDPlat.git
   cd MEDPlat
   ```

2. Install backend dependencies:
   ```bash
   # Install Node.js dependencies
   cd backend/node-api
   npm install
   
   # Install Python dependencies
   cd ../ai-service
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Update the environment variables as needed

5. Start MongoDB:
   ```bash
   mongod
   ```

6. Start the backend services:
   ```bash
   # Start Node.js API
   cd backend/node-api
   npm start
   
   # Start AI Service (in a new terminal)
   cd ../ai-service
   uvicorn main:app --reload
   ```

7. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

## Directory Structure
```
MEDPlAT/
├── backend/
│   ├── node-api/         # Node.js API for data, RBAC, dashboards
│   │   ├── src/          # Source code
│   │   ├── config/       # Configuration files
│   │   └── models/       # Database models
│   └── ai-service/       # Python FastAPI for AI/NLP
│       ├── src/          # Source code
│       └── models/       # AI models
├── frontend/             # React app
│   ├── public/           # Static files
│   └── src/              # React components and code
├── docs/                 # Documentation
└── README.md
```

## Configuration

### Backend Configuration

1. Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/medplat
   PORT=8000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_key
   ```

### Frontend Configuration

1. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_AI_URL=http://localhost:8001
   ```

## Usage

### Medical Data Management

1. Upload medical data:
   - Navigate to the Upload page
   - Select your CSV or JSON file
   - Click Upload

2. View dashboards:
   - Navigate to the Dashboard page
   - Use drag-and-drop to add widgets
   - Configure widget settings
   - Save dashboard layout

### AI Features

1. Chatbot:
   - Ask natural language questions
   - Get AI-powered insights
   - Generate visualizations

2. Data Analysis:
   - Automatic anomaly detection
   - Trend forecasting
   - Pattern recognition

## Security

- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Protected data storage
- CORS configuration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
