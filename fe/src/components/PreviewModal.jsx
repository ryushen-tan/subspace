import React, { useState } from 'react';
import { X, Download, Camera } from 'lucide-react';
import PreviewSidebar from './PreviewSidebar';
import PreviewScene from './PreviewScene';
import { useAgentStore } from '../state/useAgentStore';

const PreviewModal = ({ isOpen, onClose }) => {
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { mesh } = useAgentStore();

  const handleClose = () => {
    setSelectedBackground(null);
    setCapturedImage(null);
    setIsCapturing(false);
    onClose();
  };

  const handleCapture = (dataURL) => {
    setCapturedImage(dataURL);
    setIsCapturing(false);
  };

  const handleSave = () => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = 'preview.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualCapture = () => {
    setIsCapturing(true);
    // The scene will auto-capture after rendering
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[95vw] h-[95vh] bg-neutral-950 border border-white/10 rounded-xl overflow-hidden flex">
        {/* Sidebar */}
        <PreviewSidebar
          selectedBackground={selectedBackground}
          onSelectBackground={setSelectedBackground}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Preview Generator</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {selectedBackground && mesh ? (
              <div className="w-full h-full relative">
                <PreviewScene 
                  backgroundUrl={selectedBackground.startsWith('glb:') ? selectedBackground : `/${selectedBackground}`}
                  onCapture={handleCapture}
                  shouldCapture={isCapturing}
                />
              </div>
            ) : capturedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Select a background to see the 3D model preview</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <div className="text-sm text-gray-400">
              {selectedBackground 
                ? `Selected: ${selectedBackground.startsWith('glb:') 
                    ? selectedBackground.replace('glb:', '') 
                    : selectedBackground.split('/').pop()}` 
                : 'No background selected'}
            </div>
            <div className="flex gap-2">
              {selectedBackground && mesh && !capturedImage && (
                <button
                  onClick={handleManualCapture}
                  disabled={isCapturing}
                  className="px-4 py-2 bg-[#ffb6c1]/90 hover:bg-[#ffb6c1] text-neutral-950 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Capture Preview
                </button>
              )}
              {capturedImage && (
                <>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Save Image
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
