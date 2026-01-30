import React from 'react';

const MarkdownLink = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#ffb6c1] hover:text-[#ffb6c1]/80 underline cursor-pointer transition-colors"
    >
      {children}
    </a>
  );
};

export default MarkdownLink;
