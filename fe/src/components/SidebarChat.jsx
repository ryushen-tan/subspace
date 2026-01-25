import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Send, MessageSquare, CheckCircle2, Circle, Loader2, Upload, Download, Wrench, Check, Command } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';
import ControlsOverlay from './ControlsOverlay';
import MarkdownContent from './MarkdownContent';

const COMMANDS = [
  { name: '/inspect-mesh', description: 'View mesh stats and structure info' },
  { name: '/verify', description: 'Validate mesh for errors' },
  { name: '/render', description: 'Generate a preview render' },
  { name: '/finalize', description: 'Finalize the model for export' },
];

const SidebarChat = ({ isOpen, setIsOpen }) => {
  const Motion = motion;
  const [input, setInput] = useState('');
  const [selectedCommandIdx, setSelectedCommandIdx] = useState(0);
  const messagesEndRef = useRef(null);
  
  const {
    isConnected,
    isLoading,
    todo,
    messages,
    toolCalls,
    finalized,
    sessionId,
    mesh,
    connect,
    sendMessage,
    uploadStepFile,
    uploadStlFile
  } = useAgentStore();

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [connect, isConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const filteredCommands = useMemo(() => {
    if (!input.startsWith('/')) return [];
    const query = input.toLowerCase();
    return COMMANDS.filter(cmd => cmd.name.toLowerCase().startsWith(query));
  }, [input]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setSelectedCommandIdx(0);
  };

  const handleKeyDown = (e) => {
    if (filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIdx(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (filteredCommands[selectedCommandIdx]) {
          e.preventDefault();
          setInput(filteredCommands[selectedCommandIdx].name + ' ');
        }
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.stl')) {
        await uploadStlFile(file);
      } else {
        await uploadStepFile(file);
      }
    }
  };

  const handleDownload = async () => {
    if (!sessionId || !mesh) {
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
      console.error('Download error:', error);
    }
  };

  return (
    <Motion.div
      initial={{ height: 48, width: 48 }}
      animate={{ 
        height: isOpen ? 700 : 48,
        width: isOpen ? 350 : 48
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute top-4 right-4 bg-neutral-950/95 backdrop-blur-md border border-white/10 flex flex-col z-10 overflow-hidden shadow-2xl rounded-2xl ${isOpen ? '' : 'items-center justify-center'}`}
    >
      {isOpen ? (
        <>
          {/* Top Bar with Controls Overlay */}
          <div className="relative flex items-center border-b border-white/5 justify-between px-3 py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="font-medium text-gray-200 text-sm truncate">Assistant</span>
              {isConnected && <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5">
              <ControlsOverlay />
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none bg-transparent flex-shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <button
          onClick={toggleSidebar}
          className="w-full h-full flex items-center justify-center p-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <>
          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Scrollable Messages */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3">
          {/* Messages */}
          <AnimatePresence>
            {messages.length === 0 && todo.length === 0 ? (
              <Motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">Describe what you want to create...</p>
              </Motion.div>
            ) : (
              messages.map((msg, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/20 text-gray-200 ml-4'
                      : 'bg-white/5 text-gray-300 mr-4'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownContent content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </Motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Tool Calls */}
          {toolCalls.length > 0 && (
            <div className="space-y-1">
              {toolCalls.map((tool, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-500 bg-white/5 rounded-lg px-2 py-1.5">
                  <Wrench className={`w-3 h-3 mt-0.5 flex-shrink-0 ${tool.success ? 'text-blue-400' : 'text-red-400'}`} />
                  <div className="min-w-0">
                    <span className="font-medium text-gray-400">{tool.name}</span>
                    <p className="text-gray-600 truncate">{tool.result}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Status */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Working...</span>
            </div>
          )}
          {finalized && !isLoading && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <Check className="w-4 h-4" />
              <span>Completed</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Todo List */}
        {todo.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5 bg-neutral-900/50">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">Tasks</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {todo.map((task, i) => (
                <div key={i} className={`flex items-start gap-2 text-sm ${task.done ? 'text-gray-500' : 'text-gray-300'}`}>
                  {task.done ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className={task.done ? 'line-through' : ''}>{task.text || task}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5 bg-transparent space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium text-gray-300 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Upload .STEP/.STL</span>
              <input
                type="file"
                accept=".step,.stp,.stl"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <div
              onClick={mesh ? handleDownload : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium text-gray-300 transition-colors ${
                mesh ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Download .OBJ</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            {/* Command Autocomplete Popup */}
            <AnimatePresence>
              {filteredCommands.length > 0 && (
                <Motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl"
                >
                  {filteredCommands.map((cmd, i) => (
                    <div
                      key={cmd.name}
                      onClick={() => setInput(cmd.name + ' ')}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        i === selectedCommandIdx ? 'bg-indigo-600/30' : 'hover:bg-white/5'
                      }`}
                    >
                      <Command className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-200">{cmd.name}</div>
                        <div className="text-xs text-gray-500 truncate">{cmd.description}</div>
                      </div>
                    </div>
                  ))}
                </Motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type / for commands..."
                disabled={isLoading}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-0 disabled:scale-90 transform duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
          </div>
        </>
      )}
    </Motion.div>
  );
};

export default SidebarChat;
