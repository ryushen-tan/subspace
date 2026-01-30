import React, { useState, useEffect } from 'react';
import { Check, Image, Box } from 'lucide-react';

const PreviewSidebar = ({ selectedBackground, onSelectBackground }) => {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or '3d'
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

  const glbBackgrounds = ['room_diorama_model.glb'];

  const handleSelect3D = (glbFile) => {
    onSelectBackground(`glb:${glbFile}`);
  };

  const is3DSelected = selectedBackground?.startsWith('glb:');
  const isImageSelected = selectedBackground && !is3DSelected;

  return (
    <div className="w-64 border-r border-white/10 bg-neutral-900/50 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'image'
              ? 'bg-neutral-800 text-white border-b-2 border-[#ffb6c1]'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Image className="w-4 h-4" />
          Image
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === '3d'
              ? 'bg-neutral-800 text-white border-b-2 border-[#ffb6c1]'
              : 'text-gray-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Box className="w-4 h-4" />
          3D
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'image' ? (
          <>
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
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      isImageSelected && selectedBackground === bg
                        ? 'border-[#ffb6c1] ring-2 ring-[#ffb6c1]/50'
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
                    {isImageSelected && selectedBackground === bg && (
                      <div className="absolute inset-0 bg-[#ffb6c1]/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#ffb6c1]" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                      {bg}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">3D Backgrounds</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {glbBackgrounds.map((glb) => {
                const glbKey = `glb:${glb}`;
                const isSelected = is3DSelected && selectedBackground === glbKey;
                
                return (
                  <button
                    key={glb}
                    onClick={() => handleSelect3D(glb)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all bg-neutral-800 flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-[#ffb6c1] ring-2 ring-[#ffb6c1]/50'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Box className="w-12 h-12 text-gray-500" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#ffb6c1]/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#ffb6c1]" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center">
                      {glb.replace('.glb', '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewSidebar;
