import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../state/useAgentStore';
import { Move3D, RotateCw, Maximize2 } from 'lucide-react';

const TransformControls = ({ objectId }) => {
  const objects = useAgentStore((state) => state.objects);
  const rotateObject = useAgentStore((state) => state.rotateObject);
  const scaleObject = useAgentStore((state) => state.scaleObject);
  const setObjectPosition = useAgentStore((state) => state.setObjectPosition);

  const object = objects.find((o) => o.id === objectId);
  
  // Calculate center position
  const [position, setPosition] = useState([0, 0, 0]);

  useEffect(() => {
    if (object?.mesh?.vertices?.length) {
      const verts = object.mesh.vertices;
      const centerX = verts.reduce((sum, v) => sum + v.p[0], 0) / verts.length;
      const centerY = verts.reduce((sum, v) => sum + v.p[1], 0) / verts.length;
      const centerZ = verts.reduce((sum, v) => sum + v.p[2], 0) / verts.length;
      setPosition([centerX, centerY, centerZ]);
    }
  }, [object?.mesh?.vertices]);

  const [rotation, setRotation] = useState([0, 0, 0]);
  const [scalePercentage, setScalePercentage] = useState(100);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (object?.transform?.rotation) {
      setRotation(object.transform.rotation);
    }
    if (object?.transform?.scale) {
      setScalePercentage(object.transform.scale);
    }
  }, [object?.id, object?.transform?.rotation, object?.transform?.scale]);

  // Sync scale percentage when object changes
  useEffect(() => {
    if (object) {
      setScalePercentage(object.scalePercentage || 100);
    }
  }, [object?.id, object?.scalePercentage]);

  const handlePositionChange = (axis, value) => {
    const newPos = [...position];
    newPos[axis] = parseFloat(value) || 0;
    setPosition(newPos);
    setObjectPosition(objectId, newPos);
  };

  const handleRotationChange = (axis, value) => {
    const newRot = [...rotation];
    newRot[axis] = parseFloat(value) || 0;
    setRotation(newRot);
    rotateObject(objectId, newRot);
  };

  const handleScaleChange = (value) => {
    const percentage = parseFloat(value) || 100;
    setScalePercentage(percentage);
    scaleObject(objectId, percentage);
  };

  const axisLabels = ['X', 'Y', 'Z'];
  const axisColors = {
    0: 'text-red-400',
    1: 'text-green-400',
    2: 'text-blue-400',
  };

  return (
    <div className="space-y-3">
      {/* Position Section */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'position' ? null : 'position')}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-neutral-800/50 transition-colors"
        >
          <Move3D className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-300">Position</span>
          <span className={`ml-auto text-xs text-gray-500 transition-transform ${expandedSection === 'position' ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {expandedSection === 'position' && (
          <div className="px-3 py-2 space-y-2 border-t border-white/5">
            {[0, 1, 2].map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <label className={`w-6 text-xs font-semibold ${axisColors[axis]}`}>
                  {axisLabels[axis]}
                </label>
                <input
                  type="number"
                  value={position[axis]?.toFixed(2) || 0}
                  onChange={(e) => handlePositionChange(axis, e.target.value)}
                  className="flex-1 bg-neutral-800 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500/50"
                  step="0.1"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rotation Section */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'rotation' ? null : 'rotation')}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-neutral-800/50 transition-colors"
        >
          <RotateCw className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-300">Rotation (°)</span>
          <span className={`ml-auto text-xs text-gray-500 transition-transform ${expandedSection === 'rotation' ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {expandedSection === 'rotation' && (
          <div className="px-3 py-2 space-y-2 border-t border-white/5">
            {[0, 1, 2].map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <label className={`w-6 text-xs font-semibold ${axisColors[axis]}`}>
                  {axisLabels[axis]}
                </label>
                <input
                  type="number"
                  value={rotation[axis]?.toFixed(1) || 0}
                  onChange={(e) => handleRotationChange(axis, e.target.value)}
                  className="flex-1 bg-neutral-800 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-orange-500/50"
                  step="1"
                  min="0"
                  max="360"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scale Section */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'scale' ? null : 'scale')}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-neutral-800/50 transition-colors"
        >
          <Maximize2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-300">Scale</span>
          <span className={`ml-auto text-xs text-gray-500 transition-transform ${expandedSection === 'scale' ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {expandedSection === 'scale' && (
          <div className="px-3 py-2 space-y-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={scalePercentage.toFixed(0)}
                onChange={(e) => handleScaleChange(e.target.value)}
                className="flex-1 bg-neutral-800 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
                step="1"
                min="1"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="1"
              value={scalePercentage}
              onChange={(e) => handleScaleChange(e.target.value)}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="text-xs text-gray-500 text-center">Original size: 100%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformControls;
