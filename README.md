# Voice Actor Graph Visualization

An interactive web application that visualizes relationships between voice actors and the characters they've voiced in games. The application uses a bipartite graph to show these connections, with voice actors on one side and characters on the other.

## Features
- Interactive bipartite graph visualization using Cytoscape.js
- React frontend for smooth user interaction
- Flask backend with SQLite database
- RESTful API for data access

## Project Structure
```
voice-actor-graph/
├── backend/           # Flask backend
│   ├── app.py        # Main Flask application
│   ├── database.py   # Database models and setup
│   └── data/         # SQLite database and initial data
├── frontend/         # React frontend
│   ├── src/         # Source code
│   └── public/      # Static files
└── README.md        # This file
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the Flask server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Technologies Used
- Frontend:
  - React
  - Cytoscape.js
  - Material-UI
- Backend:
  - Flask
  - SQLite
  - SQLAlchemy 