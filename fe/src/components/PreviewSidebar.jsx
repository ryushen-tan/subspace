import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const PreviewSidebar = ({ selectedBackground, onSelectBackground }) => {
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // List images from public folder
    // In a real app, you'd have an API endpoint for this
    // For now, we'll use a hardcoded list or try to fetch from a known endpoint
    const loadBackgrounds = async () => {
      try {
        // Try to get list from API or use known images
        // For now, we'll scan common image files in public
        const commonImages = [
          'grass background.jpg',
          'IMG_0179.jpg',
          // Add more as needed
        ];
        
        // Filter to only existing images
        const existingImages = [];
        for (const img of commonImages) {
          try {
            const response = await fetch(`/${img}`, { method: 'HEAD' });
            if (response.ok) {
              existingImages.push(img);
            }
          } catch {
            // Image doesn't exist, skip
          }
        }
        
        setBackgrounds(existingImages);
      } catch (error) {
        console.error('Error loading backgrounds:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBackgrounds();
  }, []);

  return (
    <div className="w-64 border-r border-white/10 bg-neutral-900/50 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Background Images</h3>
      
      {loading ? (
        <div className="text-gray-400 text-sm">Loading backgrounds...</div>
      ) : backgrounds.length === 0 ? (
        <div className="text-gray-400 text-sm">No backgrounds found</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {backgrounds.map((bg) => (
            <button
              key={bg}
              onClick={() => onSelectBackground(bg)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                selectedBackground === bg
                  ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <img
                src={`/${bg}`}
                alt={bg}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {selectedBackground === bg && (
                <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-indigo-400" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                {bg}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewSidebar;
