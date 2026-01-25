import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers, Pencil, Trash2, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';
import { motion } from 'framer-motion';

const LeftControlPanel = () => {
  const Motion = motion;
  const objects = useAgentStore((state) => state.objects);
  const activeObjectId = useAgentStore((state) => state.activeObjectId);
  const setActiveObject = useAgentStore((state) => state.setActiveObject);
  const toggleObjectVisibility = useAgentStore((state) => state.toggleObjectVisibility);
  const renameObject = useAgentStore((state) => state.renameObject);
  const deleteObject = useAgentStore((state) => state.deleteObject);
  const updateObjectColor = useAgentStore((state) => state.updateObjectColor);

  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [hexValues, setHexValues] = useState({});
  const [colorPickerOpen, setColorPickerOpen] = useState(null); // Track which object's color picker is open

  useEffect(() => {
    // Sync local hex cache when objects list changes
    const next = {};
    objects.forEach((obj) => {
      next[obj.id] = obj.color || '#4F46E5';
    });
    setHexValues(next);
  }, [objects]);

  const hslToHex = (h, s, l) => {
    // h:0-360, s/l:0-100
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to255 = (x) => Math.round(255 * x)
      .toString(16)
      .padStart(2, '0');
    return `#${to255(f(0))}${to255(f(8))}${to255(f(4))}`.toUpperCase();
  };

  const hexToHsl = (hex) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
    const num = parseInt(c, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s; const l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  };

  const handleColorDrag = (e, object) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const h = (x / rect.width) * 360;
    const l = 70 - (y / rect.height) * 30; // 70 -> 40 range
    const hex = hslToHex(h, 85, l);
    setHexValues((prev) => ({ ...prev, [object.id]: hex }));
    updateObjectColor(object.id, hex);
  };

  const handleHexInput = (val, object) => {
    const normalized = val.startsWith('#') ? val : `#${val}`;
    if (/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(normalized)) {
      const clean = normalized.toUpperCase();
      setHexValues((prev) => ({ ...prev, [object.id]: clean }));
      updateObjectColor(object.id, clean);
    }
  };
  const [isOpen, setIsOpen] = useState(true);

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <Motion.div
      initial={{ height: 48, width: 48 }}
      animate={{ 
        height: isOpen ? 700 : 48,
        width: isOpen ? 320 : 48
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute top-4 left-4 bg-neutral-950/95 backdrop-blur-md border border-white/10 flex flex-col z-10 overflow-hidden shadow-2xl rounded-2xl ${isOpen ? '' : 'items-center justify-center'}`}
    >
      {isOpen ? (
        <>
          {/* Top Bar with Toggle */}
          <div className="relative flex items-center border-b border-white/5 justify-between px-3 py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="font-medium text-gray-200 text-sm truncate">Controls</span>
            </div>
            <button
              onClick={togglePanel}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none bg-transparent flex-shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={togglePanel}
          className="w-full h-full flex items-center justify-center p-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <>
          {/* Content Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-6">
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
            {objects.map((object) => {
              const color = hexValues[object.id] || object.color || '#4f46e5';
              const { h, l } = hexToHsl(color);
              const markerX = `${(h / 360) * 100}%`;
              const markerY = `${((70 - l) / 30) * 100}%`;

              return (
                <div
                  key={object.id}
                  className={`p-3 bg-neutral-900/50 border rounded-lg transition-colors cursor-pointer ${
                    object.id === activeObjectId ? 'border-indigo-500/60 bg-neutral-900' : 'border-white/5 hover:bg-neutral-900'
                  }`}
                  onClick={() => setActiveObject(object.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Color square */}
                      <button
                        className="w-6 h-6 rounded border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer flex-shrink-0"
                        style={{ background: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorPickerOpen(colorPickerOpen === object.id ? null : object.id);
                        }}
                        aria-label="Pick color"
                        title="Pick color"
                      />
                      
                      {editingId === object.id ? (
                        <input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={() => {
                            renameObject(object.id, draftName.trim() || object.name);
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameObject(object.id, draftName.trim() || object.name);
                              setEditingId(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setDraftName(object.name);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-neutral-800 border border-white/10 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                        />
                      ) : (
                        <span className="text-sm text-gray-300 truncate" title={object.name}>{object.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-200 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(object.id);
                          setDraftName(object.name);
                        }}
                        aria-label="Rename object"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteObject(object.id);
                        }}
                        aria-label="Delete object"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-gray-200 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleObjectVisibility(object.id);
                        }}
                        aria-label={object.visible ? 'Hide object' : 'Show object'}
                      >
                        {object.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Color picker popup */}
                  {colorPickerOpen === object.id && (
                    <div className="mt-2 p-3 bg-neutral-800/95 border border-white/20 rounded-lg space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Color Picker</span>
                        <button
                          className="text-gray-400 hover:text-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorPickerOpen(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <div
                        className="relative h-32 rounded-md cursor-crosshair overflow-hidden border border-white/10"
                        onMouseDown={(e) => handleColorDrag(e, object)}
                        onMouseMove={(e) => { if (e.buttons === 1) handleColorDrag(e, object); }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: 'linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)',
                        }}
                      >
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0))' }} />
                        <div
                          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg"
                          style={{ left: markerX, top: markerY, transform: 'translate(-50%, -50%)', background: color }}
                          aria-hidden
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded border border-white/10 flex-shrink-0" style={{ background: color }} />
                        <input
                          type="text"
                          value={hexValues[object.id] || color}
                          onChange={(e) => setHexValues((prev) => ({ ...prev, [object.id]: e.target.value }))}
                          onBlur={(e) => handleHexInput(e.target.value, object)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleHexInput(e.currentTarget.value, object);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-neutral-900 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 font-mono"
                          placeholder="#4F46E5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
            </div>
          </div>
        </>
      )}
    </Motion.div>
  );
};

export default LeftControlPanel;
