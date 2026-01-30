import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';

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
      setSelectedFile(null);
      setPreview(null);
      setPaperSize('letter');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer" onClick={onClose}>
      <div className="relative w-[95vw] max-w-xl bg-neutral-950 border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Photo to 3D Model</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Paper Size Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Paper Size</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="letter"
                  checked={paperSize === 'letter'}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-gray-300">US Letter (8.5" × 11")</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="a4"
                  checked={paperSize === 'a4'}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-gray-300">A4 (210mm × 297mm)</span>
              </label>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-indigo-500/50 bg-indigo-500/5'
                : 'border-white/20 bg-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Preview" className="max-w-full max-h-64 mx-auto rounded-lg" />
                <p className="text-xs text-gray-400">{selectedFile.name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Camera className="w-12 h-12 text-indigo-400" />
                </div>
                <p className="text-gray-200 font-medium">Drag and drop or click to upload</p>
                <p className="text-sm text-gray-400">JPG, PNG, GIF, WebP</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-indigo-300">Instructions:</p>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Place your object on the paper</li>
              <li>• Take a clear, well-lit photo from above</li>
              <li>• Ensure the entire paper is visible</li>
              <li>• Paper size is used to determine object dimensions</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <span className="text-red-400 text-lg">⚠️</span>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-white/10 bg-neutral-900/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Upload & Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
