import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, Layers, Pencil, Trash2, ChevronLeft, ChevronRight, Wrench, Search, Folder, ChevronDown } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';
import { motion } from 'framer-motion';
import TransformControls from './TransformControls';

const LeftControlPanel = ({ onPhotoClick }) => {
  const Motion = motion;
  const objects = useAgentStore((state) => state.objects);
  const activeObjectId = useAgentStore((state) => state.activeObjectId);
  const setActiveObject = useAgentStore((state) => state.setActiveObject);
  const toggleObjectVisibility = useAgentStore((state) => state.toggleObjectVisibility);
  const renameObject = useAgentStore((state) => state.renameObject);
  const deleteObject = useAgentStore((state) => state.deleteObject);
  const updateObjectColor = useAgentStore((state) => state.updateObjectColor);
  const projectName = useAgentStore((state) => state.projectName);
  const projectDescription = useAgentStore((state) => state.projectDescription);
  const setProjectName = useAgentStore((state) => state.setProjectName);
  const setProjectDescription = useAgentStore((state) => state.setProjectDescription);

  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [hexValues, setHexValues] = useState({});
  const [colorPickerOpen, setColorPickerOpen] = useState(null); // Track which object's color picker is open
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [draftProjectName, setDraftProjectName] = useState(projectName);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    // Sync local hex cache when objects list changes
    const next = {};
    objects.forEach((obj) => {
      next[obj.id] = obj.color || '#4F46E5';
    });
    setHexValues(next);
  }, [objects]);

  useEffect(() => {
    // Sync draft project name when project name changes
    if (!editingProjectName) {
      setDraftProjectName(projectName);
    }
  }, [projectName, editingProjectName]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setColorPickerOpen(null);
      }
    };

    if (colorPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [colorPickerOpen]);

  // Close color picker when active object changes
  useEffect(() => {
    setColorPickerOpen(null);
  }, [activeObjectId]);

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

  // Filter objects based on search query
  const filteredObjects = useMemo(() => {
    if (!searchQuery.trim()) return objects;
    const query = searchQuery.toLowerCase().trim();
    return objects.filter(obj => 
      obj.name.toLowerCase().includes(query)
    );
  }, [objects, searchQuery]);

  return (
    <Motion.div
      initial={{ height: 48, width: 48 }}
      animate={{ 
        height: isOpen ? 720 : 48,
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
              <Folder className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              {editingProjectName ? (
                <input
                  autoFocus
                  value={draftProjectName}
                  onChange={(e) => setDraftProjectName(e.target.value)}
                  onBlur={() => {
                    setProjectName(draftProjectName.trim() || 'Untitled Project');
                    setEditingProjectName(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setProjectName(draftProjectName.trim() || 'Untitled Project');
                      setEditingProjectName(false);
                    }
                    if (e.key === 'Escape') {
                      setDraftProjectName(projectName);
                      setEditingProjectName(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-neutral-800 border border-white/10 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                />
              ) : (
                <span 
                  className="font-medium text-gray-200 text-sm truncate cursor-pointer hover:text-indigo-400 transition-colors"
                  onClick={() => {
                    setDraftProjectName(projectName);
                    setEditingProjectName(true);
                  }}
                  title="Click to edit project name"
                >
                  {projectName}
                </span>
              )}
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
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <>
          {/* Content Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-2 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search objects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900/50 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-neutral-900 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-6">

        {/* Objects Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <Layers className="w-4 h-4" />
            <span>Objects {searchQuery && `(${filteredObjects.length}/${objects.length})`}</span>
          </div>
          <div className="space-y-2">
            {objects.length === 0 && (
              <div className="p-3 text-sm text-gray-500 bg-neutral-900/50 border border-white/5 rounded-lg">
                No objects yet. Upload a STEP/STL file or let the agent generate geometry.
              </div>
            )}
            {searchQuery && filteredObjects.length === 0 && objects.length > 0 && (
              <div className="p-3 text-sm text-gray-500 bg-neutral-900/50 border border-white/5 rounded-lg">
                No objects match "{searchQuery}"
              </div>
            )}
            {filteredObjects.map((object) => {
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
                    <div ref={colorPickerRef} className="mt-2 p-3 bg-neutral-800/95 border border-white/20 rounded-lg space-y-2">
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

                  {/* Transform Controls - show when object is selected */}
                  {object.id === activeObjectId && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <TransformControls objectId={object.id} />
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
