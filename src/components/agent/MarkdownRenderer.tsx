'use client';

import React, { Suspense, lazy, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load the heavy syntax highlighter - saves ~800KB from initial bundle
const LazySyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter/dist/esm/prism').then(mod => ({
    default: mod.default,
  }))
);

// Lazy load the theme
const lazyOneDark = import('react-syntax-highlighter/dist/esm/styles/prism').then(mod => mod.oneDark);

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Simple fallback code block while syntax highlighter loads
function FallbackCodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <pre style={{
      background: '#1e1e2e',
      padding: '1rem',
      borderRadius: '0.5rem',
      overflow: 'auto',
      fontSize: '0.8rem',
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      color: '#e2e8f0',
      margin: 0,
    }}>
      <code>{code}</code>
    </pre>
  );
}

// Memoized syntax highlighter wrapper
const SyntaxHighlighterWrapper = React.memo(function SyntaxHighlighterWrapper({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [theme, setTheme] = React.useState<any>(null);

  React.useEffect(() => {
    lazyOneDark.then(t => setTheme(t));
  }, []);

  if (!theme) {
    return <FallbackCodeBlock code={code} language={language} />;
  }

  return (
    <Suspense fallback={<FallbackCodeBlock code={code} language={language} />}>
      <LazySyntaxHighlighter
        style={theme}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.8rem',
          padding: language ? '1.75rem 1rem 1rem' : '1rem',
        }}
      >
        {code}
      </LazySyntaxHighlighter>
    </Suspense>
  );
});

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [copiedBlock, setCopiedBlock] = React.useState<string | null>(null);

  const handleCopy = React.useCallback((code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(blockId);
    setTimeout(() => setCopiedBlock(null), 2000);
  }, []);

  // Check if content has markdown links or special action links
  const hasPreviewLink = useMemo(() =>
    content.includes('View Live Preview') || content.includes('View Full Test Report'),
    [content]
  );

  // Memoize the markdown components to avoid re-creating on each render
  const components = useMemo(() => ({
    h1: ({ children }: any) => <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem', color: '#f1f5f9' }}>{children}</h1>,
    h2: ({ children }: any) => <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.875rem', marginBottom: '0.5rem', color: '#f1f5f9' }}>{children}</h2>,
    h3: ({ children }: any) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.375rem', color: '#e2e8f0' }}>{children}</h3>,
    h4: ({ children }: any) => <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', marginBottom: '0.25rem', color: '#e2e8f0' }}>{children}</h4>,
    p: ({ children }: any) => <p style={{ marginBottom: '0.5rem', color: '#cbd5e1' }}>{children}</p>,
    ul: ({ children }: any) => <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.5rem', listStyleType: 'disc' }}>{children}</ul>,
    ol: ({ children }: any) => <ol style={{ paddingLeft: '1.25rem', marginBottom: '0.5rem', listStyleType: 'decimal' }}>{children}</ol>,
    li: ({ children }: any) => <li style={{ marginBottom: '0.25rem', color: '#cbd5e1' }}>{children}</li>,
    strong: ({ children }: any) => <strong style={{ fontWeight: 600, color: '#f1f5f9' }}>{children}</strong>,
    em: ({ children }: any) => <em style={{ fontStyle: 'italic', color: '#94a3b8' }}>{children}</em>,
    code: ({ className: cn, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(cn || '');
      const isInline = !match && !cn;
      if (isInline) {
        return (
          <code
            style={{ background: '#334155', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontFamily: "'Fira Code', monospace", color: '#14b8a6' }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return <code className={cn} {...props}>{children}</code>;
    },
    pre: ({ children }: any) => {
      const codeElement = children as React.ReactElement<any>;
      const cn = codeElement?.props?.className || '';
      const match = /language-(\w+)/.exec(cn);
      const language = match ? match[1] : '';
      const code = String(codeElement?.props?.children || '').replace(/\n$/, '');
      const blockId = `block-${code.substring(0, 20).replace(/\s/g, '')}`;

      return (
        <div style={{ position: 'relative', margin: '0.5rem 0', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {language && (
            <div style={{
              position: 'absolute', top: '0.375rem', left: '0.75rem',
              fontSize: '0.65rem', color: '#64748b', zIndex: 10,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {language}
            </div>
          )}
          <button
            onClick={() => handleCopy(code, blockId)}
            style={{
              position: 'absolute', top: '0.375rem', right: '0.375rem',
              background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569',
              borderRadius: '0.375rem', padding: '0.25rem', cursor: 'pointer',
              zIndex: 10, color: copiedBlock === blockId ? '#10B981' : '#94a3b8',
              display: 'flex', alignItems: 'center',
            }}
            title="Copy code"
          >
            {copiedBlock === blockId ? <Check style={{ width: '0.875rem', height: '0.875rem' }} /> : <Copy style={{ width: '0.875rem', height: '0.875rem' }} />}
          </button>
          <SyntaxHighlighterWrapper code={code} language={language} />
        </div>
      );
    },
    a: ({ href, children }: any) => {
      const isPreview = href?.includes('mode=preview') || String(children).includes('Preview');
      const isDownload = href?.includes('mode=zip') || href?.includes('mode=html') || String(children).includes('Download');

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isPreview ? '#14b8a6' : isDownload ? '#06b6d4' : '#3b82f6',
            textDecoration: 'none', fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.125rem 0.375rem', borderRadius: '0.25rem',
            background: isPreview ? 'rgba(20, 184, 166, 0.1)' : isDownload ? 'rgba(6, 182, 212, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${isPreview ? 'rgba(20, 184, 166, 0.3)' : isDownload ? 'rgba(6, 182, 212, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            transition: 'background 0.15s ease',
          }}
        >
          {isPreview && <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />}
          {isDownload && <Download style={{ width: '0.75rem', height: '0.75rem' }} />}
          {children}
        </a>
      );
    },
    hr: () => <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '0.75rem 0' }} />,
    blockquote: ({ children }: any) => (
      <blockquote style={{ borderLeft: '3px solid #14b8a6', paddingLeft: '0.75rem', margin: '0.5rem 0', color: '#94a3b8' }}>
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th style={{ padding: '0.5rem', border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontWeight: 600, textAlign: 'left' }}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td style={{ padding: '0.5rem', border: '1px solid #334155', color: '#cbd5e1' }}>
        {children}
      </td>
    ),
  }), [copiedBlock, handleCopy]);

  return (
    <div className={`markdown-content ${className || ''}`} style={{
      fontSize: '0.875rem',
      lineHeight: '1.6',
      wordBreak: 'break-word',
    }}>
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>

      {/* Preview iframe for website builds */}
      {hasPreviewLink && content.includes('projectId=') && (
        <div style={{ marginTop: '0.75rem' }}>
          <PreviewFrame content={content} />
        </div>
      )}
    </div>
  );
});

const PreviewFrame = React.memo(function PreviewFrame({ content }: { content: string }) {
  const [showPreview, setShowPreview] = React.useState(false);

  const previewMatch = React.useMemo(() => content.match(/\[View Live Preview\]\(([^)]+)\)/), [content]);
  const projectIdMatch = React.useMemo(() => content.match(/projectId=([^&'\s]+)/), [content]);

  if (!previewMatch && !projectIdMatch) return null;

  const previewUrl = previewMatch
    ? previewMatch[1]
    : projectIdMatch
      ? `/api/agents/download?projectId=${projectIdMatch[1]}&file=index.html&mode=preview`
      : null;

  if (!previewUrl) return null;

  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowPreview(!showPreview)}
        style={{
          borderColor: 'rgba(20, 184, 166, 0.3)',
          color: '#14b8a6',
          background: 'rgba(20, 184, 166, 0.05)',
          fontSize: '0.75rem',
        }}
      >
        <ExternalLink style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.375rem' }} />
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </Button>
      {showPreview && (
        <div style={{
          marginTop: '0.5rem', borderRadius: '0.5rem', overflow: 'hidden',
          border: '1px solid #334155', background: '#0f172a',
        }}>
          <div style={{
            padding: '0.375rem 0.75rem', background: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#10B981' }} />
            </div>
            <div style={{
              flex: 1, background: '#0f172a', borderRadius: '0.25rem',
              padding: '0.125rem 0.5rem', fontSize: '0.65rem', color: '#64748b',
            }}>
              {previewUrl}
            </div>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: '#64748b', fontSize: '0.65rem' }}>
              Open ↗
            </a>
          </div>
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '400px', border: 'none', background: 'white' }}
            sandbox="allow-scripts allow-same-origin"
            title="Website Preview"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
});
