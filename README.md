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

## Tech Stack
- Frontend: React, Chart.js/Plotly
- Backend: Node.js (Express), Python (FastAPI)
- AI/NLP: OpenAI API, Prophet, scikit-learn

## Getting Started
See `frontend/README.md`, `backend/node-api/README.md`, and `backend/ai-service/README.md` for setup instructions.

## Directory Structure
```
MEDPlAT/
├── backend/
│   ├── node-api/         # Node.js API for data, RBAC, dashboards
│   └── ai-service/       # Python FastAPI for AI/NLP
├── frontend/             # React app
├── README.md
```
