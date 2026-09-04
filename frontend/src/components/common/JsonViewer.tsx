import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Code } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
  defaultExpanded?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'Raw JSON Payload',
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #334155',
        overflow: 'hidden',
        fontSize: '0.8rem',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: expanded ? '1px solid #334155' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Code size={16} color="#38bdf8" />
          <span>{title}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
          }}
          title="Copy JSON"
        >
          {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {expanded && (
        <pre
          style={{
            padding: '14px',
            color: '#f8fafc',
            overflowX: 'auto',
            maxHeight: '380px',
            lineHeight: 1.4,
            fontSize: '0.78rem',
          }}
        >
          <code>{jsonString}</code>
        </pre>
      )}
    </div>
  );
};
