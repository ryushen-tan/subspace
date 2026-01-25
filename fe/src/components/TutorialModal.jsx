import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mouse, Keyboard, Move3D, RotateCw, X } from 'lucide-react';

const TutorialModal = ({ isOpen, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const duration = 3000; // 3 seconds
    const interval = 16; // ~60fps
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onClose();
          }, 100);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const controls = [
    { icon: Mouse, label: 'Orbit', action: 'Left mouse drag', color: 'text-blue-400' },
    { icon: Move3D, label: 'Pan', action: 'Middle mouse / Shift + drag', color: 'text-green-400' },
    { icon: Mouse, label: 'Zoom', action: 'Scroll wheel / Pinch', color: 'text-purple-400' },
    { icon: Mouse, label: 'Select Point', action: 'Left click on sphere', color: 'text-yellow-400' },
    { icon: Move3D, label: 'Axis Move', action: 'Gizmo handles (X/Y/Z)', color: 'text-red-400' },
    { icon: Keyboard, label: 'Auto-Rotate', action: 'Press R', color: 'text-indigo-400' },
    { icon: Keyboard, label: 'Undo', action: 'Ctrl/Cmd + Z', color: 'text-cyan-400' },
    { icon: Keyboard, label: 'Redo', action: 'Ctrl/Cmd + Shift + Z', color: 'text-pink-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-[600px] bg-neutral-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-1">Welcome to Subspace</h2>
            <p className="text-sm text-gray-400">Learn the basic controls to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {controls.map((control, index) => {
              const Icon = control.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-neutral-900/50 border border-white/5 rounded-lg hover:bg-neutral-900 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-white/5 ${control.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white mb-0.5">{control.label}</div>
                    <div className="text-xs text-gray-400">{control.action}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-6">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {progress < 100 ? 'Loading...' : 'Complete!'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TutorialModal;
