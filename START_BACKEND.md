# How to Start the Backend Server

## Quick Start

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if using one)
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Verify Backend is Running

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

You can verify by visiting:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health (if endpoint exists)

## Common Issues

1. **Port 8000 already in use**: 
   - Find and kill the process: `lsof -ti:8000 | xargs kill` (macOS/Linux)
   - Or use a different port: `--port 8001`

2. **Missing dependencies**:
   - Make sure you've installed all requirements: `pip install -r requirements.txt`

3. **Virtual environment not activated**:
   - Make sure you've activated your virtual environment before starting

