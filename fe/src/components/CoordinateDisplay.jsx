import { useState, useEffect } from 'react';

export default function CoordinateDisplay() {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handlePositionUpdate = (event) => {
      setPosition(event.detail);
    };
    
    window.addEventListener('cameraPositionUpdate', handlePositionUpdate);
    return () => {
      window.removeEventListener('cameraPositionUpdate', handlePositionUpdate);
    };
  }, []);

  const formatValue = (val) => {
    return val.toFixed(2);
  };

  return (
    <div className="fixed bottom-6 right-4 bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 z-20 flex items-center gap-4 shadow-2xl">
      <div className="flex items-center gap-4 text-sm font-mono">
        <span>
          X <span className="text-red-400">[{formatValue(position.x)}]</span>
        </span>
        <span>
          Y <span className="text-green-400">[{formatValue(position.y)}]</span>
        </span>
        <span>
          Z <span className="text-blue-400">[{formatValue(position.z)}]</span>
        </span>
      </div>
    </div>
  );
}
