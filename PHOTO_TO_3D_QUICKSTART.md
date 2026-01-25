# Photo to 3D Model - Quick Start Guide

## What You Can Do Now

Upload a photo of a physical object placed on **US Letter** or **A4** paper, and the system will automatically:
1. **Analyze the photo** using Google Gemini Vision AI
2. **Determine object dimensions** using the paper size as reference
3. **Generate a 3D model** that matches the analyzed object
4. **Insert the model** directly into your workspace

## How to Use

### Step 1: Prepare Your Photo
- Place your object on a piece of US Letter or A4 sized paper
- Take a clear photo from above (bird's eye view)
- Ensure the entire paper is visible in the frame
- Good lighting helps with better analysis

### Step 2: Open the Upload Modal
- Click the **camera icon** (📷) in the toolbar
- The "Convert Photo to 3D Model" modal will open

### Step 3: Select Paper Size
- Choose the paper size used in your photo
  - **US Letter**: 8.5" × 11" (Standard for North America)
  - **A4**: 210mm × 297mm (International standard)

### Step 4: Upload Your Photo
- Drag and drop an image, OR
- Click the upload area to browse files
- Supported formats: JPG, JPEG, PNG, GIF, WebP
- Image preview will appear after selection

### Step 5: Generate the Model
- Click "Upload & Generate"
- Wait for processing (typically 10-30 seconds)
- The 3D model will appear in your workspace once complete

## Example Use Cases

### Product Design
- Take a photo of a sketch or physical prototype on paper
- Get a 3D model to further refine in the workspace

### Reverse Engineering
- Photograph existing objects placed on paper
- Generate initial 3D models from photos

### Quick Prototyping
- Sketch an idea on paper and photograph it
- Convert sketches into 3D models instantly

## What Happens Behind the Scenes

1. **Photo Upload**: Your image is sent to the backend
2. **Gemini Analysis**: Google Gemini Vision analyzes:
   - What the object is
   - Estimated dimensions (as % of paper size)
   - Shape classification (cube, cylinder, sphere, etc.)
   - Key features and details
3. **Scaling**: Paper size is used to calculate real-world dimensions
4. **3D Generation**: A mesh is created based on the analysis
5. **Workspace Integration**: Model is added to your current workspace

## Mesh Quality & Limitations

- **Generated models are simplified** (low-poly) for easy editing
- **Best for basic shapes** (cubes, cylinders, spheres, cones)
- **Complex geometries** are approximated using primitive shapes
- You can refine the model further in the workspace after generation

## Tips for Best Results

✅ **DO:**
- Use clear, well-lit photos
- Photograph from directly above (perpendicular to paper)
- Include the entire paper in the frame
- Use standard paper sizes (Letter or A4)
- Clean, simple objects work best

❌ **DON'T:**
- Photograph at an angle
- Use non-standard paper sizes
- Upload blurry or poorly lit images
- Include multiple objects in one photo
- Use very complex shapes

## Troubleshooting

### "Failed to upload image" error
- Check file format (must be JPG, PNG, GIF, or WebP)
- Try a different image
- Ensure backend server is running

### Model doesn't appear
- Refresh the page
- Check browser console for errors
- Try with a different image

### Model looks incorrect
- Try different paper size setting
- Take a clearer photo of the object
- Ensure object is fully visible on the paper

### Processing takes too long
- Normal processing time is 10-30 seconds
- Check internet connection
- Ensure backend is running properly

## Technical Details

- **Max file size**: Limited by browser/server settings
- **Processing location**: Server-side using Google Gemini Vision API
- **No data storage**: Uploaded images are deleted after processing
- **Real-time feedback**: Loading indicator shows progress

## Next Steps

After generating a model from your photo, you can:

1. **Edit in workspace**: Use the transform controls to adjust position, rotation, and scale
2. **Refine geometry**: Add or remove vertices and faces
3. **Export**: Save your model as OBJ or STEP file
4. **Share**: Export and share with team members

## Need Help?

- Check the main documentation: `PHOTO_TO_3D_FEATURE.md`
- Review error messages for specific guidance
- Ensure you have a valid Google API key configured
