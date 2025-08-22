import React, { useState, useMemo } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const formattedCode = useMemo(() => {
    if (!code || typeof code !== 'string') return '';
    // Try to pretty-print if it's a JSON string.
    try {
        const trimmedCode = code.trim();
        if (trimmedCode.startsWith('{') || trimmedCode.startsWith('[')) {
            const json = JSON.parse(code);
            return JSON.stringify(json, null, 2);
        }
    } catch (e) {
        // It might be an incomplete JSON stream or not JSON at all.
        // Fallback to returning the original code.
    }
    return code;
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-lg relative border border-gray-700">
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
        <code>
            {formattedCode}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        aria-label="Copy code"
      >
        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default CodeBlock;