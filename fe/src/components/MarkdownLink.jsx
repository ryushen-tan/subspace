import React from 'react';

const MarkdownLink = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors"
    >
      {children}
    </a>
  );
};

export default MarkdownLink;
