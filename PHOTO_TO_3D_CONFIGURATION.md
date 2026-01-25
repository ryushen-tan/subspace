# Photo to 3D Configuration Guide

This guide helps you configure the Photo to 3D feature for your environment.

## 1. Environment Setup

### Backend Environment Variables

Create a `.env` file in the `be/` directory or set these in your shell:

```bash
# Required
export GEMINI_API_KEY="your-gemini-api-key-here"

# Optional (has defaults)
export GEMINI_MODEL="gemini-2.0-flash-exp"
export BACKEND_PORT="8000"
export BACKEND_HOST="0.0.0.0"
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new project or select existing
4. Copy the API key
5. Set as `GEMINI_API_KEY` environment variable

### Frontend Configuration

No environment variables needed for frontend. It automatically connects to `http://localhost:8000`.

To change backend URL, edit `fe/src/services/agentApi.js`:
```javascript
const WS_URL = 'ws://localhost:8000/agent/ws';
// Change to your backend URL
```

## 2. Dependencies Installation

### Backend

```bash
cd be
pip install -r requirements.txt
```

Ensure you have:
- Python 3.8 or higher
- pip package manager

### Frontend

```bash
cd fe
npm install
```

Ensure you have:
- Node.js 16 or higher
- npm or yarn

## 3. Running the Feature

### Start Backend Server

```bash
cd be
export GEMINI_API_KEY="your-key-here"  # Set your API key
python main.py
```

Expected output:
```
INFO:     Started server process [12345]
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Start Frontend Dev Server

```bash
cd fe
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Access the Application

Open http://localhost:5173 in your browser

## 4. Verify Installation

### Backend Check
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### API Check
```bash
curl http://localhost:8000/
# Should return: {"status": "ok", "service": "3D Design Agent"}
```

### Feature Check
1. Open http://localhost:5173
2. Look for camera icon (📷) in toolbar
3. Click it - PhotoUploadModal should open
4. You should see paper size options and upload area

## 5. Configuration Options

### Backend Configuration

Edit `be/config/settings.py`:

```python
class Settings:
    # Gemini API Configuration
    gemini_api_key: str = os.getenv("GEMINI_API_KEY")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    openrouter_max_tokens: int = 2048
    
    # Server Configuration
    backend_port: int = int(os.getenv("BACKEND_PORT", 8000))
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
```

### Paper Size Configuration

Edit `be/services/photo_to_3d.py`:

```python
PAPER_SIZES = {
    "letter": {"width": 215.9, "height": 279.4, "name": "US Letter"},
    "a4": {"width": 210, "height": 297, "name": "A4"},
}

# Add custom sizes:
# "tabloid": {"width": 279.4, "height": 431.8, "name": "Tabloid"}
```

### Mesh Generation Configuration

Edit `be/services/photo_to_3d.py`:

```python
# Cylinder segments (higher = smoother but more vertices)
segments = 8  # Change to 12 or 16 for smoother cylinders

# Scale factor (0.1 = 1 unit ≈ 10mm)
scale = 0.1  # Change as needed

# Minimum dimension (prevents too-small models)
min_size = 0.1  # Adjust if needed
```

## 6. Advanced Configuration

### CORS Configuration (Production)

Edit `be/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

Add to `be/main.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/agent/upload-photo")
@limiter.limit("5/minute")
async def upload_photo(...):
    # Limit to 5 uploads per minute per IP
```

### File Size Limits

Edit `be/routers/agent.py`:

```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MIN_FILE_SIZE = 100 * 1024  # 100KB

if file.size > MAX_FILE_SIZE:
    raise HTTPException(400, "File too large")
```

## 7. Logging Configuration

### Backend Logging

Edit `be/main.py`:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

### Frontend Logging

Edit `fe/src/components/PhotoUploadModal.jsx`:

```javascript
// Add debug logging
console.log('Upload started:', selectedFile.name);
console.log('Paper size:', paperSize);
```

## 8. Database (if needed)

Currently, the Photo to 3D feature doesn't use a database. Models are generated on-the-fly.

To add persistence:

```python
# Add to be/models/
class PhotoModel(Base):
    id: int = Column(Integer, primary_key=True)
    filename: str = Column(String)
    analysis: JSON = Column(JSON)
    mesh_data: JSON = Column(JSON)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
```

## 9. Docker Configuration (Optional)

### Backend Dockerfile

```dockerfile
FROM python:3.10
WORKDIR /app
COPY be/requirements.txt .
RUN pip install -r requirements.txt
COPY be/ .
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
CMD ["python", "main.py"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18
WORKDIR /app
COPY fe/package.json .
RUN npm install
COPY fe/ .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### Docker Compose

```yaml
version: '3'
services:
  backend:
    build: ./be
    ports:
      - "8000:8000"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
  
  frontend:
    build: ./fe
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

## 10. Troubleshooting Configuration Issues

### Python ImportError
```
ModuleNotFoundError: No module named 'google'
```
**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Gemini API Key Error
```
ValueError: API key not found
```
**Solution**: Set environment variable
```bash
export GEMINI_API_KEY="your-key-here"
```

### Port Already in Use
```
OSError: [Errno 48] Address already in use
```
**Solution**: Change port or kill existing process
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
export BACKEND_PORT=8001
```

### Frontend Won't Connect
```
Failed to connect to server
```
**Solution**: Verify backend is running and accessible
```bash
curl http://localhost:8000/health
# If fails, backend isn't running
```

### CORS Error
```
Cross-Origin Request Blocked
```
**Solution**: Configure CORS (see Advanced Configuration)

## 11. Performance Optimization

### Image Compression

```python
# In PhotoTo3DService
from PIL import Image

def compress_image(image_path):
    img = Image.open(image_path)
    img.thumbnail((1024, 1024))  # Max 1024x1024
    img.save(image_path, quality=85)
```

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def analyze_photo(image_path, paper_size):
    # Results cached for identical inputs
    pass
```

### Async Processing

```python
import asyncio

async def process_photo(file):
    # Run Gemini API call in thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, gemini.analyze, file)
    return result
```

## 12. Security Checklist

- [ ] API key not committed to git (use .env or secrets manager)
- [ ] CORS properly configured
- [ ] File upload size limits set
- [ ] File type validation enabled
- [ ] Rate limiting implemented
- [ ] Input validation on both client and server
- [ ] HTTPS enabled in production
- [ ] Error messages don't expose sensitive info
- [ ] Temporary files cleaned up
- [ ] Logging doesn't contain sensitive data

## 13. Performance Checklist

- [ ] Images compressed before upload
- [ ] Mesh generation is efficient
- [ ] No unnecessary re-renders
- [ ] Loading states show feedback
- [ ] Error handling is fast
- [ ] Memory cleanup after processing
- [ ] Database queries optimized (if applicable)
- [ ] API responses are quick

## 14. Support Resources

- **Google Gemini API**: https://ai.google.dev/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Zustand**: https://github.com/pmndrs/zustand

## 15. Configuration Summary

| Setting | Default | Purpose | Change |
|---------|---------|---------|--------|
| GEMINI_API_KEY | None | API authentication | Required |
| GEMINI_MODEL | gemini-2.0-flash-exp | Vision model | Optional |
| BACKEND_PORT | 8000 | Server port | Optional |
| BACKEND_HOST | 0.0.0.0 | Server host | Optional |
| Paper Sizes | Letter, A4 | Available formats | Optional |
| Cylinder Segments | 8 | Smoothness | Optional |
| Scale Factor | 0.1 | Unit scaling | Optional |

---

**Configuration Complete!** Your Photo to 3D feature is ready to use. 🎉

Start the servers and test the feature following the "Running the Feature" section above.
