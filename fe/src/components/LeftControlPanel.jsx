import React from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';

const LeftControlPanel = () => {
  const objects = useAgentStore((state) => state.objects);
  const toggleObjectVisibility = useAgentStore((state) => state.toggleObjectVisibility);

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

        {/* Objects Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <Layers className="w-4 h-4" />
            <span>Objects</span>
          </div>
          <div className="space-y-2">
            {objects.length === 0 && (
              <div className="p-3 text-sm text-gray-500 bg-neutral-900/50 border border-white/5 rounded-lg">
                No objects yet. Upload a STEP/STL file or let the agent generate geometry.
              </div>
            )}
            {objects.map((object) => (
              <div
                key={object.id}
                className="flex items-center justify-between p-2 bg-neutral-900/50 border border-white/5 rounded-lg hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-gray-300 truncate" title={object.name}>{object.name}</span>
                </div>
                <button
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-200 transition-colors"
                  onClick={() => toggleObjectVisibility(object.id)}
                  aria-label={object.visible ? 'Hide object' : 'Show object'}
                >
                  {object.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftControlPanel;
