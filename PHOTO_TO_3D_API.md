# Photo to 3D API Specification

## Overview

The Photo to 3D feature provides REST and WebSocket APIs for converting photographs of physical objects into 3D models using Google Gemini Vision AI.

## REST Endpoints

### POST /agent/upload-photo

Upload a photo and generate a 3D model.

#### Request

```
POST http://localhost:8000/agent/upload-photo
Content-Type: multipart/form-data

Parameters:
  - file: Image file (required)
    - Accepted formats: jpg, jpeg, png, gif, webp
    - Max size: No explicit limit (limited by server config)
  
  - paper_size: Query parameter (required)
    - Values: "letter" or "a4"
    - Default: "letter" (if not provided, defaults to letter)
  
  - session_id: Query parameter (optional)
    - Session ID to link the uploaded model to an existing workspace
    - If provided, updates the session's mesh state
```

#### cURL Example

```bash
# With Letter paper size
curl -X POST \
  'http://localhost:8000/agent/upload-photo?paper_size=letter' \
  -F 'file=@photo.jpg'

# With A4 paper size and session ID
curl -X POST \
  'http://localhost:8000/agent/upload-photo?paper_size=a4&session_id=abc123' \
  -F 'file=@photo.png'
```

#### Response (Success)

```json
{
  "success": true,
  "analysis": {
    "object_name": "Coffee Mug",
    "description": "A cylindrical ceramic coffee mug with handle",
    "estimated_dimensions": {
      "width_percent": 25.5,
      "depth_percent": 28.3,
      "height_percent": 35.2
    },
    "shape_type": "cylinder",
    "key_features": [
      "Handle attachment",
      "Cylindrical body",
      "Flat bottom"
    ],
    "surface_characteristics": "Smooth ceramic surface",
    "suggested_primitives": [
      {
        "type": "cylinder",
        "dimensions": {"x": 2.5, "y": 2.8, "z": 3.5},
        "position": {"x": 0, "y": 0, "z": 0},
        "description": "Main body"
      }
    ],
    "construction_notes": "Simple cylindrical representation with handle suggested",
    "paper_size": "letter",
    "paper_dimensions": {
      "width": 215.9,
      "height": 279.4,
      "name": "US Letter"
    }
  },
  "mesh": {
    "vertices": [
      {"id": "1", "p": [-1.275, -1.415, -1.75]},
      {"id": "2", "p": [1.275, -1.415, -1.75]},
      ...
    ],
    "faces": [
      ["1", "2", "3", "4"],
      ...
    ],
    "edges": [
      ["1", "2"],
      ["2", "3"],
      ...
    ],
    "scale_factor": 1.0
  },
  "message": "Successfully created 3D model from photo"
}
```

#### Response (Error - Invalid Format)

```json
HTTP/1.1 400 Bad Request
{
  "detail": "Only image files are allowed: .jpg, .jpeg, .png, .gif, .webp"
}
```

#### Response (Error - Invalid Paper Size)

```json
HTTP/1.1 400 Bad Request
{
  "detail": "paper_size must be 'letter' or 'a4'"
}
```

#### Response (Error - Processing Failed)

```json
HTTP/1.1 500 Internal Server Error
{
  "detail": "Failed to process image: [error details]"
}
```

## Data Models

### Analysis Response

The Gemini Vision analysis returns the following structure:

```typescript
interface AnalysisResponse {
  object_name: string;              // Identified object name
  description: string;              // Detailed description
  estimated_dimensions: {
    width_percent: number;           // 0-100
    depth_percent: number;           // 0-100
    height_percent: number;          // 0-100
  };
  shape_type: 'cube' | 'cylinder' | 'sphere' | 'cone' | 'rectangular_prism' | 'complex';
  key_features: string[];            // List of notable features
  surface_characteristics: string;   // Texture/finish description
  suggested_primitives: Primitive[]; // Component shapes
  construction_notes: string;        // Additional guidance
  paper_size: string;                // 'letter' or 'a4'
  paper_dimensions: {
    width: number;                   // mm
    height: number;                  // mm
    name: string;                    // Display name
  };
}

interface Primitive {
  type: string;                      // Shape type
  dimensions: {x: number, y: number, z: number};
  position: {x: number, y: number, z: number};
  description: string;
}
```

### Mesh Response

The generated 3D mesh follows the standard mesh format:

```typescript
interface Mesh {
  vertices: Vertex[];
  faces: string[][];        // Array of face vertex IDs
  edges: [string, string][]; // Array of edge vertex ID pairs
  scale_factor: number;      // Scaling applied
}

interface Vertex {
  id: string;
  p: [number, number, number]; // x, y, z coordinates
}
```

## Paper Size Reference

### US Letter
- **Width**: 215.9 mm (8.5")
- **Height**: 279.4 mm (11")
- **Aspect Ratio**: 1:1.294
- **Common Usage**: North America

### A4
- **Width**: 210 mm
- **Height**: 297 mm
- **Aspect Ratio**: 1:1.414
- **Common Usage**: International standard

## Scaling Logic

The system converts image analysis to 3D coordinates using this formula:

```
1. Estimated % × Paper Dimension (mm) = Object Dimension (mm)
   Example: 25% width × 215.9mm = 53.975mm

2. Object Dimension (mm) × 0.1 = 3D Unit Dimension
   (0.1 scale factor = 1 unit ≈ 10mm in workspace)
   
3. Minimum dimension enforced: 0.1 units
```

## Shape Generation

### Rectangular Prism
- Vertices: 8
- Faces: 6
- Edges: 12
- Used for: Box-like objects

### Cylinder
- Vertices: 2 × N + 2 (where N is segment count, default 8)
- Faces: N + 2
- Edges: 3N
- Used for: Tubular, can-like objects

### Sphere
- Vertices: 12 (icosahedron-based)
- Faces: 20
- Edges: 30
- Used for: Round objects

### Cone
- Vertices: N + 1 (where N is base segments, default 8)
- Faces: N + 1
- Edges: 2N
- Used for: Pointed objects

### Composite
- Multiple primitives combined
- Used for: Complex or multi-part objects

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful upload and model generation
- **400 Bad Request**: 
  - Invalid file format
  - Invalid paper size
  - Missing required parameters
- **500 Internal Server Error**:
  - Gemini API failure
  - Image analysis failure
  - Mesh generation error

### Error Response Format

```json
{
  "detail": "Description of the error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding:
- Per-session upload limits
- Per-IP request throttling
- Daily quota per user

## Security Considerations

1. **File Validation**: Only image formats are accepted
2. **File Size**: Should implement max file size limits
3. **Temporary Storage**: Files are deleted after processing
4. **API Key Security**: Gemini API key should be in environment variables
5. **CORS**: Currently allows all origins - should be restricted in production

## WebSocket Integration

When using the Photo to 3D tool through the agent system:

```json
{
  "type": "tool_use",
  "tool_name": "photo_to_3d",
  "arguments": {
    "image_path": "/path/to/image.jpg",
    "paper_size": "letter"
  }
}
```

## Performance Metrics

Typical response times:
- Image validation: < 100ms
- Gemini Vision analysis: 10-30 seconds
- Mesh generation: < 500ms
- Total: 10-35 seconds

Factors affecting speed:
- Network latency
- Gemini API load
- Image complexity
- Session state updates

## Integration Example (JavaScript)

```javascript
// Using the agentApi client
const response = await agentApi.uploadPhotoFile(
  fileObject,        // File from input
  'letter',          // Paper size
  sessionId          // Optional session ID
);

if (response.success) {
  console.log('Generated model:', response.mesh);
  console.log('Analysis:', response.analysis);
}
```

## Integration Example (Python)

```python
import requests

response = requests.post(
    'http://localhost:8000/agent/upload-photo',
    params={
        'paper_size': 'a4',
        'session_id': 'abc123'
    },
    files={
        'file': open('object.jpg', 'rb')
    }
)

if response.status_code == 200:
    data = response.json()
    mesh = data['mesh']
    analysis = data['analysis']
```

## Limitations

1. **Single object per image**: Only analyzes one main object
2. **Paper visibility**: Entire paper must be visible for accurate scaling
3. **Lighting**: Works best with good, even lighting
4. **Complexity**: Complex shapes approximated using primitives
5. **Accuracy**: Approximate dimensions, not photogrammetry-level accuracy

## Future Enhancements

- [ ] Batch processing multiple images
- [ ] Real-time camera input instead of file upload
- [ ] Fine-grained shape adjustment interface
- [ ] Multiple object detection in single image
- [ ] Mesh refinement/subdivision options
- [ ] Direct export to STL/STEP after generation
- [ ] Comparison with existing models
