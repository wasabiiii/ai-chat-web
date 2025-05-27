import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      children={content}
      components={{
        code(props) {
          const { inline, className = '', children, ...rest } = props as any;
          const match = /language-(\w+)/.exec(className);
          return !inline && match ? (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...rest}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...rest}>
              {children}
            </code>
          );
        },
      }}
    />
  );
}
