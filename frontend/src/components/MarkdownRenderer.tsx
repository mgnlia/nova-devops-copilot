'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Props {
  content: string
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose-nova text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            if (isInline) {
              return (
                <code className="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  background: '#0D1117',
                  border: '1px solid #30363D',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          },
          h2({ children }) {
            return <h2 className="text-base font-bold text-white mt-4 mb-2 border-b border-nova-border pb-1">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-aws-orange mt-3 mb-1.5">{children}</h3>
          },
          p({ children }) {
            return <p className="text-gray-300 mb-2 leading-relaxed text-sm">{children}</p>
          },
          ul({ children }) {
            return <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1 text-sm">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1 text-sm">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },
          strong({ children }) {
            return <strong className="text-white font-semibold">{children}</strong>
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-3">
                <table className="w-full border-collapse text-xs">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="bg-gray-800 text-white font-semibold px-3 py-1.5 text-left border border-nova-border">{children}</th>
          },
          td({ children }) {
            return <td className="text-gray-300 px-3 py-1.5 border border-nova-border">{children}</td>
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-aws-orange pl-3 text-gray-400 italic mb-2 text-sm">{children}</blockquote>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
