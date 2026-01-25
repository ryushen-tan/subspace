import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function ZoomDisplay() {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const handleZoomUpdate = (event) => {
      setZoom(event.detail);
    };
    
    window.addEventListener('cameraZoomUpdate', handleZoomUpdate);
    return () => {
      window.removeEventListener('cameraZoomUpdate', handleZoomUpdate);
    };
  }, []);

  const handleZoomIn = () => {
    const event = new CustomEvent('zoomControl', { detail: 'in' });
    window.dispatchEvent(event);
  };

  const handleZoomOut = () => {
    const event = new CustomEvent('zoomControl', { detail: 'out' });
    window.dispatchEvent(event);
  };

  const formatZoom = (val) => {
    return `${Math.round(val)}%`;
  };

  return (
    <div className="fixed bottom-20 right-4 bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 z-20 flex items-center gap-2 shadow-2xl">
      <button
        onClick={handleZoomOut}
        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="text-sm font-mono text-gray-200 min-w-[50px] text-center">
        {formatZoom(zoom)}
      </div>
      <button
        onClick={handleZoomIn}
        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
