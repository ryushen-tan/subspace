# Photo to 3D Model Feature

This feature allows users to upload a photo of a physical object placed on a piece of paper (US Letter or A4) and automatically generate a 3D model of the object using Gemini Vision AI.

## Overview

The system uses the paper size as a reference to determine the object's actual dimensions, then leverages Gemini Vision to analyze the photo and create a scaled 3D model.

## Components

### Backend

#### 1. **PhotoTo3DService** (`be/services/photo_to_3d.py`)
   - Main service class that handles photo analysis and 3D model generation
   - **Key Methods:**
     - `analyze_photo(image_path, paper_size)`: Analyzes a photo using Gemini Vision
     - `generate_mesh_from_analysis(analysis)`: Creates a 3D mesh from the analysis
   
   - **Mesh Generation Methods:**
     - `_create_rectangular_prism()`: Creates box-shaped models
     - `_create_cylinder()`: Creates cylindrical models
     - `_create_sphere()`: Creates spherical models
     - `_create_cone()`: Creates cone-shaped models
     - `_create_composite_mesh()`: Creates complex models from multiple primitives

#### 2. **PhotoTo3DTool** (`be/tools/photo.py`)
   - Tool class that integrates with the agent system
   - Registered in the tool registry for use by the AI agent
   - Parameters:
     - `image_path`: Path to the uploaded image
     - `paper_size`: Either "letter" or "a4"

#### 3. **API Endpoint** (`be/routers/agent.py`)
   - **Route:** `POST /agent/upload-photo`
   - **Parameters:**
     - `file`: Image file (jpg, jpeg, png, gif, webp)
     - `paper_size`: "letter" or "a4" (query parameter)
     - `session_id`: Optional session ID to link to existing workspace
   
   - **Response:**
     ```json
     {
       "success": true,
       "analysis": {
         "object_name": "string",
         "description": "string",
         "estimated_dimensions": {
           "width_percent": number,
           "depth_percent": number,
           "height_percent": number
         },
         "shape_type": "cube|cylinder|sphere|cone|complex",
         "key_features": ["string"],
         "surface_characteristics": "string",
         "suggested_primitives": [...]
       },
       "mesh": {
         "vertices": [...],
         "faces": [...],
         "edges": [...],
         "scale_factor": number
       }
     }
     ```

### Frontend

#### 1. **PhotoUploadModal** (`fe/src/components/PhotoUploadModal.jsx`)
   - Modal dialog for uploading photos
   - **Features:**
     - Drag-and-drop file upload
     - Paper size selection (Letter/A4)
     - Image preview before upload
     - Instructions for users
     - Error handling and feedback
   
   - **Props:**
     - `isOpen`: Boolean to control modal visibility
     - `onClose`: Callback when modal closes
     - `sessionId`: Current session ID for linking models

#### 2. **Updated API Client** (`fe/src/services/agentApi.js`)
   - New method: `uploadPhotoFile(file, paperSize, sessionId)`
   - Handles file upload with paper size parameter

#### 3. **Zustand Store** (`fe/src/state/useAgentStore.js`)
   - New action: `uploadPhotoFile(file, paperSize)`
   - Handles photo upload, mesh generation, and state updates
   - Integrates generated model into workspace

#### 4. **UI Components**
   - **WorkspaceToolbar**: Added camera icon button for photo upload
   - **Editor**: Integrated PhotoUploadModal
   - **Scene**: Passes photo click handler down to toolbar
   - **WorkspaceBottomBar**: Routes photo click event
   - **LeftControlPanel**: Ready to receive photo click callback

## Usage

### User Flow

1. User clicks the camera icon in the toolbar (Photo to 3D)
2. PhotoUploadModal opens
3. User selects paper size (Letter or A4)
4. User uploads an image (drag-drop or browse)
5. Image preview is displayed
6. User clicks "Upload & Generate"
7. Backend analyzes the image with Gemini Vision
8. 3D mesh is generated based on the analysis
9. Model appears in the 3D workspace

### Paper Size Reference

- **US Letter**: 8.5" × 11" (215.9mm × 279.4mm)
- **A4**: 210mm × 297mm

The paper size is used by Gemini to estimate the object's dimensions as percentages of the paper, which are then converted to actual millimeters and scaled for the 3D workspace.

## Gemini Vision Prompt

The system sends a structured prompt to Gemini asking for:
1. Object identification
2. Dimension estimates (as percentages of paper size)
3. Shape classification
4. Key features and surface characteristics
5. Suggested 3D primitive components

The response is expected in JSON format for reliable parsing and model generation.

## Mesh Generation Logic

### Scale Conversion
- Paper dimensions (mm) × estimated percentages = Object dimensions (mm)
- Object dimensions (mm) × 0.1 scale factor = 3D workspace units

### Shape Types Supported
- **Cube/Rectangular Prism**: 8 vertices, 6 faces
- **Cylinder**: Base + top circles with segments
- **Sphere**: Icosahedron-based low-poly sphere
- **Cone**: Base circle + apex point
- **Complex**: Composite of multiple primitives

## Error Handling

- Invalid file format: Returns 400 with error message
- Invalid paper size: Returns 400 with error message
- Gemini API failure: Returns 500 with API error details
- JSON parsing error: Returns 500 with parsing error details

## Testing

To test the feature:

1. **Start the backend server:**
   ```bash
   cd be
   python main.py
   ```

2. **Start the frontend dev server:**
   ```bash
   cd fe
   npm run dev
   ```

3. **Test the photo upload:**
   - Click the camera icon in the toolbar
   - Select paper size (Letter or A4)
   - Upload a photo of an object on paper
   - Verify the generated 3D model appears in the workspace

## Future Enhancements

- Support for multiple objects in a single photo
- More shape primitives (torus, rectangular tubes, etc.)
- Refinement options (smooth, subdivide, simplify)
- Export generated models to STL/STEP format
- Training data for common object types
- Real-time camera capture instead of file upload
