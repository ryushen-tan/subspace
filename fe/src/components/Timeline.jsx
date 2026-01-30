import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Edit2 } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';

const Timeline = () => {
  const Motion = motion;
  const { timelineSteps, currentStepIndex, scrubToStep, sendMessage } = useAgentStore();
  const [isDragging, setIsDragging] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editInput, setEditInput] = useState('');
  const timelineRef = useRef(null);

  const handleScrub = useCallback((clientX) => {
    if (!timelineRef.current || timelineSteps.length === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const stepIndex = Math.round(percentage * (timelineSteps.length - 1));
    scrubToStep(stepIndex);
  }, [scrubToStep, timelineSteps.length]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleScrub(e.clientX);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      handleScrub(e.clientX);
    }
  }, [handleScrub, isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleStepClick = (index) => {
    if (timelineSteps.length === 0) return;
    scrubToStep(index);
  };

  const handlePrevStep = () => {
    if (timelineSteps.length === 0 || currentStepIndex <= 0) return;
    scrubToStep(currentStepIndex - 1);
  };

  const handleNextStep = () => {
    if (timelineSteps.length === 0 || currentStepIndex >= timelineSteps.length - 1) return;
    scrubToStep(currentStepIndex + 1);
  };

  const handleEditPrompt = () => {
    if (timelineSteps.length === 0) return;
    const currentStep = timelineSteps[currentStepIndex];
    const lastMessage = currentStep?.messages?.[currentStep.messages.length - 1];
    if (lastMessage?.role === 'user') {
      setEditInput(lastMessage.content);
    } else {
      setEditInput('');
    }
    setShowEditPrompt(true);
  };

  const handleSubmitEdit = () => {
    if (editInput.trim()) {
      sendMessage(editInput);
      setShowEditPrompt(false);
      setEditInput('');
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Always show timeline, even when empty
  const progress = timelineSteps.length > 1 
    ? (currentStepIndex / (timelineSteps.length - 1)) * 100 
    : 0;
  
  const stepCount = timelineSteps.length || 0;
  const currentStep = currentStepIndex + 1 || 0;

  return (
    <>
      <Motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-6 left-[150px] right-80 bg-neutral-950/40 backdrop-blur-md border border-white/10 rounded-lg shadow-xl z-20"
      >
        <div className="px-3 py-2 flex items-center gap-3">
          {/* Compact Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handlePrevStep}
              disabled={stepCount === 0 || currentStepIndex <= 0}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-3 h-3" />
            </button>
            
            <button
              onClick={handleNextStep}
              disabled={stepCount === 0 || currentStepIndex >= timelineSteps.length - 1}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-3 h-3" />
            </button>

            <span className="text-[10px] text-gray-500 ml-1 min-w-[60px]">
              {currentStep} / {stepCount}
            </span>
          </div>

          {/* Slim Progress Bar */}
          <div className="flex-1 relative group">
            <div
              ref={timelineRef}
              onMouseDown={handleMouseDown}
              className="relative h-1 bg-white/10 rounded-full cursor-pointer overflow-visible hover:h-1.5 transition-all"
            >
              {/* Progress Fill */}
              <Motion.div
                className="absolute top-0 left-0 h-full bg-[#ffb6c1] rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />

              {/* Scrubber Handle */}
              <Motion.div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, marginLeft: '-5px' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />

              {/* Step Markers (subtle) */}
              {timelineSteps.length > 0 && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {timelineSteps.map((step, index) => {
                    const position = timelineSteps.length > 1 
                      ? (index / (timelineSteps.length - 1)) * 100 
                      : 50;

                    return (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepClick(index);
                        }}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full hover:scale-150 transition-transform group/marker cursor-pointer"
                        style={{ left: `${position}%` }}
                      >
                        {/* Tooltip on marker hover */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 transition-opacity bg-neutral-900 border border-white/20 rounded px-2 py-0.5 text-[10px] text-white whitespace-nowrap pointer-events-none">
                          {step.name || `Step ${index + 1}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Current Step Name */}
          <div className="text-[10px] text-gray-400 max-w-[120px] truncate flex-shrink-0">
            {timelineSteps.length > 0 && timelineSteps[currentStepIndex]?.name ? timelineSteps[currentStepIndex].name : ''}
          </div>

          {/* Edit Button */}
          <button
            onClick={handleEditPrompt}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#ffb6c1]/20 text-gray-400 hover:text-[#ffb6c1] transition-colors text-[10px] flex-shrink-0 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      </Motion.div>

      {/* Edit Prompt Modal */}
      {showEditPrompt && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowEditPrompt(false)}
        >
          <Motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-[600px] shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Edit Prompt</h3>
            <textarea
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              placeholder="Enter your modified prompt..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#ffb6c1]/50 focus:ring-2 focus:ring-[#ffb6c1]/20"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitEdit();
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEditPrompt(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                className="px-4 py-2 rounded-lg bg-[#ffb6c1]/90 hover:bg-[#ffb6c1] text-neutral-950 transition-colors cursor-pointer"
              >
                Send
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </>
  );
};

export default Timeline;
