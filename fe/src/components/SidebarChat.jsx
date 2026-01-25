import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Send, MessageSquare, CheckCircle2, Circle, Loader2, Upload, Download, Wrench, Check, Command, Mic, MicOff } from 'lucide-react';
import { useAgentStore } from '../state/useAgentStore';
import ControlsOverlay from './ControlsOverlay';
import MarkdownContent from './MarkdownContent';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

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
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { isRecording, startRecording, stopRecording, cancelRecording, getAudioArrayBuffer } = useVoiceRecorder();
  
  const {
    isConnected,
    isLoading,
    todo,
    messages,
    toolCalls,
    finalized,
    sessionId,
    mesh,
    objects,
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

  const filteredMentions = useMemo(() => {
    if (!showMentions) return [];
    const query = mentionQuery.toLowerCase();
    return objects.filter(obj => 
      obj.name.toLowerCase().includes(query)
    );
  }, [showMentions, mentionQuery, objects]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setSelectedCommandIdx(0);
    
    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      // Only show if @ is at start or preceded by whitespace, and followed by word chars or empty
      const beforeAt = value.slice(0, lastAtIndex);
      if ((beforeAt === '' || /\s$/.test(beforeAt)) && /^\w*$/.test(afterAt)) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setSelectedMentionIdx(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx(i => Math.min(i + 1, filteredMentions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (filteredMentions[selectedMentionIdx]) {
          e.preventDefault();
          const obj = filteredMentions[selectedMentionIdx];
          const lastAtIndex = input.lastIndexOf('@');
          const beforeAt = input.slice(0, lastAtIndex);
          const afterMention = input.slice(lastAtIndex + 1 + mentionQuery.length);
          setInput(beforeAt + '@' + obj.name + ' ' + afterMention);
          setShowMentions(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
      }
    } else if (filteredCommands.length > 0) {
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

  const transcribeAudio = async (audioBlob) => {
    if (!audioBlob) return null;
    
    setIsTranscribing(true);
    
    try {
      console.log('[Transcription] Audio blob info:', {
        type: audioBlob.type,
        size: audioBlob.size,
      });
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model_id', 'scribe_v2');
      
      console.log('[Transcription] Sending request to ElevenLabs...');
      
      const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY,
        },
        body: formData,
      });
      
      console.log('[Transcription] Response status:', response.status);
      console.log('[Transcription] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Transcription] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: { message: errorText } };
        }
        console.error('[Transcription] Parsed error data:', errorData);
        throw new Error(errorData.detail?.message || errorData.message || errorText || 'Transcription failed');
      }
      
      const data = await response.json();
      console.log('[Transcription] Success response:', data);
      return data.text || '';
    } catch (error) {
      console.error('[Transcription] Full error:', error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVoiceStart = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('[Voice] Starting recording...');
    try {
      await startRecording();
    } catch (error) {
      console.error('[Voice] Failed to start recording:', error);
    }
  };

  const handleVoiceEnd = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isRecording) {
      return;
    }

    console.log('[Voice] Stopping recording and processing audio...');
    try {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        console.log(`[Voice] Recorded audio size: ${audioBlob.size} bytes`);
        const transcription = await transcribeAudio(audioBlob);
        if (transcription) {
          console.log('[Voice] Transcription successful, updating input.');
          setInput(prev => prev + transcription);
        } else {
          console.warn('[Voice] Transcription returned empty text.');
        }
      } else {
        console.warn('[Voice] No audio blob captured.');
      }
    } catch (error) {
      console.error('[Voice] Error handling voice input:', error);
      cancelRecording();
    }
  };

  const handleVoiceCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isRecording) {
      return;
    }

    console.log('[Voice] Recording cancelled by user.');
    cancelRecording();
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
        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 custom-scrollbar">
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
            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
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
              
              {/* Mention Autocomplete Popup */}
              {filteredMentions.length > 0 && (
                <Motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto custom-scrollbar"
                >
                  {filteredMentions.map((obj, i) => (
                    <div
                      key={obj.id}
                      onClick={() => {
                        const lastAtIndex = input.lastIndexOf('@');
                        const beforeAt = input.slice(0, lastAtIndex);
                        const afterMention = input.slice(lastAtIndex + 1 + mentionQuery.length);
                        setInput(beforeAt + '@' + obj.name + ' ' + afterMention);
                        setShowMentions(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        i === selectedMentionIdx ? 'bg-indigo-600/30' : 'hover:bg-white/5'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: obj.color || '#4F46E5' }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-200">{obj.name}</div>
                        <div className="text-xs text-gray-500 truncate">Object</div>
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
                placeholder="Type / for commands or @ for objects..."
                disabled={isLoading || isRecording || isTranscribing}
                className={`w-full bg-neutral-900 border border-white/10 rounded-xl pl-24 pr-12 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner disabled:opacity-50 ${isRecording ? 'border-red-500/50' : ''}`}
              />
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute left-16 flex items-center gap-1.5 px-2 py-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400 font-medium">Recording...</span>
                </div>
              )}
              {/* Mic button */}
              <button
                type="button"
                onMouseDown={handleVoiceStart}
                onMouseUp={handleVoiceEnd}
                onTouchStart={handleVoiceStart}
                onTouchEnd={handleVoiceEnd}
                disabled={isLoading || isTranscribing}
                className={`absolute left-2 p-1.5 rounded-lg transition-colors transform duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  isRecording 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                }`}
                title={isRecording ? 'Release to stop recording' : 'Hold to record'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {/* Send button - show when not recording or transcribing */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isRecording}
                className={`absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-0 disabled:scale-90 transform duration-200 cursor-pointer disabled:cursor-not-allowed ${
                  isRecording ? 'opacity-0' : ''
                }`}
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
