import React, { useState, useRef } from 'react';
import { agentApi } from '../services/agentApi';
import { useAgentStore } from '../state/useAgentStore';
import './PhotoUploadModal.css';

export const PhotoUploadModal = ({ isOpen, onClose, sessionId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [paperSize, setPaperSize] = useState('letter');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const uploadPhotoFile = useAgentStore((state) => state.uploadPhotoFile);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await uploadPhotoFile(selectedFile, paperSize);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="photo-upload-modal-overlay" onClick={onClose}>
      <div className="photo-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="photo-upload-header">
          <h2>Convert Photo to 3D Model</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="photo-upload-body">
          {/* Paper Size Selection */}
          <div className="paper-size-section">
            <label className="section-label">Paper Size:</label>
            <div className="paper-size-options">
              <label className="radio-option">
                <input
                  type="radio"
                  value="letter"
                  checked={paperSize === 'letter'}
                  onChange={(e) => setPaperSize(e.target.value)}
                />
                <span>US Letter (8.5" × 11")</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="a4"
                  checked={paperSize === 'a4'}
                  onChange={(e) => setPaperSize(e.target.value)}
                />
                <span>A4 (210mm × 297mm)</span>
              </label>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`upload-area ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
                <p className="preview-filename">{selectedFile.name}</p>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📸</div>
                <p className="upload-text">Drag and drop an image here</p>
                <p className="upload-subtext">or click to browse</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Instructions */}
          <div className="instructions">
            <h4>Instructions:</h4>
            <ul>
              <li>Place your object on a piece of paper</li>
              <li>Take a clear, well-lit photo from above</li>
              <li>Make sure the entire paper is visible in the frame</li>
              <li>The AI will use the paper size to determine object dimensions</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="photo-upload-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? 'Processing...' : 'Upload & Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};
