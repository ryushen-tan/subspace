import React from 'react';
import { Home, X, Settings } from 'lucide-react';

const LeftControlPanel = () => {
  const layers = [
    { id: 1, name: 'Layer 1' },
    { id: 2, name: 'Layer 2' },
  ];

  return (
    <div className="absolute top-0 left-0 bottom-0 w-64 bg-neutral-950/95 backdrop-blur-md border-r border-white/10 z-10 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Advance option Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Advance option</h3>
          
          {/* Scale */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Scale</label>
            <div className="space-y-1">
              <input
                type="text"
                defaultValue="1:32"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                placeholder="1:32"
              />
              <p className="text-[10px] text-gray-600 italic">for more precise accurate measurements</p>
            </div>
          </div>

          {/* Rotate */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Rotate</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">X</label>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Y</label>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Z</label>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </div>

          {/* Move */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Move</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                defaultValue="0"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                placeholder="X"
              />
              <input
                type="number"
                defaultValue="0"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                placeholder="Y"
              />
              <input
                type="number"
                defaultValue="0"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                placeholder="Z"
              />
            </div>
          </div>
        </div>

        {/* Layers Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Layers</h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 bg-neutral-900/50 border border-white/5 rounded-lg hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-gray-300">{layer.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors">
                    <Home className="w-4 h-4" />
                  </button>
                  {layer.id === 1 ? (
                    <button className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-300 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftControlPanel;
