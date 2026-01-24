import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Send, MessageSquare } from 'lucide-react';

const SidebarChat = ({ isOpen, setIsOpen }) => {
  const [input, setInput] = useState('');

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('Message sent:', input);
      setInput('');
    }
  };

  return (
    <motion.div
      initial={{ width: 320 }}
      animate={{ width: isOpen ? 320 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-4 right-4 bottom-4 bg-neutral-950/95 backdrop-blur-md border border-white/10 flex flex-col z-10 overflow-hidden shadow-2xl rounded-2xl"
    >
      {/* Header / Toggle Button */}
      <div className={`flex items-center p-4 ${isOpen ? 'justify-between border-b border-white/5' : 'justify-center h-full border-none'}`}>
        {isOpen && (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-gray-200">Assistant</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors focus:outline-none bg-transparent"
        >
          {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Chat Content */}
      <div className={`flex-1 flex flex-col min-w-[320px] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <AnimatePresence>
             {isOpen && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50"
               >
                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-gray-500" />
                 </div>
                 <p className="text-sm text-gray-500">Start a conversation...</p>
               </motion.div>
             )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-transparent">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-0 disabled:scale-90 transform duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default SidebarChat;
