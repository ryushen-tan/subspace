import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownLink from './MarkdownLink';

const MarkdownContent = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: MarkdownLink,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
          code: ({ inline, children }) => 
            inline ? (
              <code className="px-1.5 py-0.5 bg-white/10 rounded text-indigo-300 font-mono text-xs">{children}</code>
            ) : (
              <code className="block p-2 bg-white/10 rounded text-indigo-300 font-mono text-xs whitespace-pre-wrap overflow-x-auto">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="bg-white/5 rounded p-2 overflow-x-auto my-2">
              {children}
            </pre>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-gray-300">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold text-white mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500/50 pl-3 my-2 text-gray-400 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
