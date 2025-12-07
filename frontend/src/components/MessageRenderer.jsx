import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ inline, className, children, ...props }) {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (inline) {
        return (
            <code className="bg-dark-700 text-primary-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="relative group my-4">
            {/* Language badge and copy button */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-dark-950 border-b border-dark-700 rounded-t-lg">
                <span className="text-xs text-gray-500 font-medium uppercase">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy code</span>
                        </>
                    )}
                </button>
            </div>

            <SyntaxHighlighter
                style={oneDark}
                language={language || 'text'}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: '3rem 1rem 1rem 1rem',
                    borderRadius: '0.5rem',
                    background: '#0d1117',
                    fontSize: '0.875rem',
                }}
                {...props}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

function MessageRenderer({ content }) {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code: CodeBlock,
                    // Custom link handling
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 underline"
                        >
                            {children}
                        </a>
                    ),
                    // Custom table styling
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="w-full border-collapse">
                                {children}
                            </table>
                        </div>
                    ),
                    // Custom blockquote
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary-500 pl-4 py-2 my-4 italic bg-dark-800/50 rounded-r">
                            {children}
                        </blockquote>
                    ),
                    // Custom image handling
                    img: ({ src, alt }) => (
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full h-auto rounded-lg my-4"
                            loading="lazy"
                        />
                    ),
                    // Custom list styling
                    ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-4 space-y-2">
                            {children}
                        </ol>
                    ),
                    // Custom paragraph
                    p: ({ children }) => (
                        <p className="mb-4 last:mb-0 leading-relaxed">
                            {children}
                        </p>
                    ),
                    // Custom headings
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4 text-white">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mt-5 mb-3 text-white border-b border-dark-700 pb-2">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2 text-white">
                            {children}
                        </h3>
                    ),
                    // Horizontal rule
                    hr: () => (
                        <hr className="border-dark-600 my-6" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default MessageRenderer;
