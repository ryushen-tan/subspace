import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, ArrowRight } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';
import BackgroundScene from '../components/BackgroundScene';

const CreateProject = () => {
  const navigate = useNavigate();
  const setProjectName = useAgentStore((state) => state.setProjectName);
  const [projectName, setLocalProjectName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    
    if (!trimmedName) {
      setError('Project name is required');
      return;
    }

    // Set project name in zustand store
    setProjectName(trimmedName);
    
    // Navigate to editor
    navigate('/edit');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-white font-sans">
      <BackgroundScene />
      
      {/* Overlay Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 mb-4">
              <Folder className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-gray-400">Give your project a name to get started</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setLocalProjectName(e.target.value);
                  setError('');
                }}
                required
                autoFocus
                className="w-full px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="My Awesome Project"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Create Project
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Cancel Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateProject;
