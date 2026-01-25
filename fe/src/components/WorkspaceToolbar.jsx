import React, { useRef } from 'react';
import { RotateCw, Plus, Ruler, Move, Upload, Download, Eye, Camera } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';

const WorkspaceToolbar = ({ onPreviewClick, onRotateClick, onPhotoClick }) => {
  const uploadStepFile = useAgentStore((state) => state.uploadStepFile);
  const uploadStlFile = useAgentStore((state) => state.uploadStlFile);
  const sessionId = useAgentStore((state) => state.sessionId);
  const mesh = useAgentStore((state) => state.mesh);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.stl')) {
        await uploadStlFile(file);
      } else if (file.name.toLowerCase().endsWith('.step') || file.name.toLowerCase().endsWith('.stp')) {
        await uploadStepFile(file);
      }
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleExport = async () => {
    if (!sessionId || !mesh) {
      alert('No mesh to export');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/agent/${sessionId}/mesh/obj`);
      const data = await response.json();
      const blob = new Blob([data.obj], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model.obj';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export mesh');
    }
  };

  const tools = [
    { id: 'rotate', icon: RotateCw, label: 'Auto Rotate', onClick: onRotateClick },
    { id: 'add-vector', icon: Plus, label: 'add vector' },
    { id: 'dimension', icon: Ruler, label: 'dimension tool' },
    { id: 'move', icon: Move, label: 'move tool' },
    { id: 'export', icon: Download, label: 'Export OBJ', onClick: handleExport },
    { id: 'import', icon: Upload, label: 'Import STEP/STL', onClick: handleUploadClick },
    { id: 'photo', icon: Camera, label: 'Photo to 3D', onClick: onPhotoClick },
    { id: 'preview', icon: Eye, label: 'preview', onClick: onPreviewClick, highlight: true },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".step,.stp,.stl"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 z-10 flex items-center gap-2 shadow-2xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isPreview = tool.id === 'preview';
          return (
            <button
              key={tool.id}
              onClick={tool.onClick || undefined}
              className={`${isPreview ? 'px-4 py-2' : 'p-2'} rounded-lg transition-colors group relative cursor-pointer ${
                tool.highlight
                  ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 hover:text-indigo-300'
                  : 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
              }`}
              title={tool.label}
            >
              {isPreview ? (
                <span className="text-sm font-medium hover:cursor-pointer">Preview</span>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              {!isPreview && (
                <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-neutral-900 text-xs text-gray-300 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                  {tool.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default WorkspaceToolbar;
