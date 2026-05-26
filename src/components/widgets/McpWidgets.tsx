import React, { useState } from "react";
import {
  Package2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Globe,
  FileText,
  Info,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { getClaudeSyntaxTheme } from "@/lib/claudeSyntaxTheme";
import { useTheme } from "@/hooks";
import { open } from "@tauri-apps/plugin-shell";
import ReactMarkdown from "react-markdown";

export const MCPWidget: React.FC<{
  toolName: string;
  input?: any;
  result?: any;
}> = ({ toolName, input, result: _result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const parts = toolName.split('__');
  const namespace = parts[1] || '';
  const method = parts[2] || '';

  const formatNamespace = (ns: string) =>
    ns.replace(/-/g, ' ').replace(/_/g, ' ')
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const formatMethod = (m: string) =>
    m.replace(/_/g, ' ')
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const hasInput = input && Object.keys(input).length > 0;
  const inputString = hasInput ? JSON.stringify(input, null, 2) : '';
  const isLargeInput = inputString.length > 200;
  const inputTokens = hasInput ? Math.ceil(inputString.length / 4) : 0;

  return (
    <div className="rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b border-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Package2 className="h-4 w-4 text-violet-500" />
              <Sparkles className="h-2.5 w-2.5 text-violet-400 absolute -top-1 -right-1" />
            </div>
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">MCP Tool</span>
          </div>
          {hasInput && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-600 dark:text-violet-400">
                ~{inputTokens} tokens
              </Badge>
              {isLargeInput && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-violet-500 hover:text-violet-600 transition-colors">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-violet-500/70 font-medium uppercase tracking-wider">Service</span>
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{formatNamespace(namespace)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-violet-500/70 font-medium uppercase tracking-wider">Method</span>
            <span className="text-sm text-violet-600 dark:text-violet-400">{formatMethod(method)}</span>
          </div>
        </div>
      </div>

      {hasInput && (
        <div className="px-4 py-3">
          {!isLargeInput || isExpanded ? (
            <SyntaxHighlighter
              language="json"
              style={syntaxTheme}
              customStyle={{ margin: 0, padding: '0.75rem', background: 'transparent', fontSize: '0.75rem' }}
            >
              {inputString}
            </SyntaxHighlighter>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Large input ({inputString.length} chars) — click to expand
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const WebSearchWidget: React.FC<{
  query: string;
  result?: any;
}> = ({ query, result }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const parseSearchResult = (resultContent: string) => {
    const sections: Array<{
      type: 'text' | 'links';
      content: string | Array<{ title: string; url: string }>;
    }> = [];

    const linkSectionRegex = /Links:\s*\[([^\]]*)\]/gs;
    let lastIndex = 0;
    let match;

    while ((match = linkSectionRegex.exec(resultContent)) !== null) {
      if (match.index > lastIndex) {
        const textContent = resultContent.slice(lastIndex, match.index).trim();
        if (textContent) sections.push({ type: 'text', content: textContent });
      }

      const linksText = match[1];
      const links: Array<{ title: string; url: string }> = [];
      const linkRegex = /\{[^}]*title:\s*["']([^"']*)["'][^}]*url:\s*["']([^"']*)["'][^}]*\}/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(linksText)) !== null) {
        links.push({ title: linkMatch[1], url: linkMatch[2] });
      }
      if (links.length > 0) sections.push({ type: 'links', content: links });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < resultContent.length) {
      const remaining = resultContent.slice(lastIndex).trim();
      if (remaining) sections.push({ type: 'text', content: remaining });
    }

    if (sections.length === 0 && resultContent.trim()) {
      sections.push({ type: 'text', content: resultContent });
    }

    return sections;
  };

  let resultContent = '';
  let isError = false;

  if (result) {
    isError = result.is_error || false;
    if (typeof result.content === 'string') {
      resultContent = result.content;
    } else if (result.content && typeof result.content === 'object') {
      if (result.content.text) {
        resultContent = result.content.text;
      } else if (Array.isArray(result.content)) {
        resultContent = result.content
          .map((c: any) => (typeof c === 'string' ? c : c.text || JSON.stringify(c)))
          .join('\n');
      } else {
        resultContent = JSON.stringify(result.content, null, 2);
      }
    }
  }

  const sections = result && !isError ? parseSearchResult(resultContent) : [];

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleLinkClick = async (url: string) => {
    try {
      await open(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
        <Globe className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">Web Search</span>
        {!result && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Searching...</span>
          </div>
        )}
      </div>

      <div className="px-3 py-2 rounded-md bg-muted/30 border">
        <span className="text-xs text-muted-foreground">Query: </span>
        <span className="text-sm font-medium">{query}</span>
      </div>

      {result && (
        <div className="space-y-2">
          {isError ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div className="text-sm text-red-600 dark:text-red-400">{resultContent || "Search failed"}</div>
            </div>
          ) : sections.length > 0 ? (
            sections.map((section, idx) => {
              if (section.type === 'text') {
                const isLong = (section.content as string).length > 300;
                const isExpanded = expandedSections.has(idx);
                const displayText = isLong && !isExpanded
                  ? (section.content as string).slice(0, 300) + '...'
                  : section.content as string;

                return (
                  <div key={idx} className="rounded-md border bg-background/50 p-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown>{displayText}</ReactMarkdown>
                    </div>
                    {isLong && (
                      <button
                        onClick={() => toggleSection(idx)}
                        className="mt-2 text-xs text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show more</>}
                      </button>
                    )}
                  </div>
                );
              }

              const links = section.content as Array<{ title: string; url: string }>;
              return (
                <div key={idx} className="rounded-md border bg-background/50 p-3 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Sources</div>
                  {links.map((link, linkIdx) => (
                    <button
                      key={linkIdx}
                      onClick={() => handleLinkClick(link.url)}
                      className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors group"
                    >
                      <Globe className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-blue-500 group-hover:underline truncate">{link.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Info className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <div className="text-sm text-amber-600 dark:text-amber-400">No results found</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const WebFetchWidget: React.FC<{
  url: string;
  prompt?: string;
  result?: any;
}> = ({ url, prompt, result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  let fetchedContent = '';
  let isLoading = !result;
  let hasError = false;

  if (result) {
    if (typeof result.content === 'string') {
      fetchedContent = result.content;
    } else if (result.content && typeof result.content === 'object') {
      if (result.content.text) {
        fetchedContent = result.content.text;
      } else if (Array.isArray(result.content)) {
        fetchedContent = result.content
          .map((c: any) => (typeof c === 'string' ? c : c.text || JSON.stringify(c)))
          .join('\n');
      } else {
        fetchedContent = JSON.stringify(result.content, null, 2);
      }
    }
    hasError = result.is_error ||
      fetchedContent.toLowerCase().includes('error') ||
      fetchedContent.toLowerCase().includes('failed');
  }

  const maxPreviewLength = 500;
  const isTruncated = fetchedContent.length > maxPreviewLength;
  const previewContent = isTruncated && !showFullContent
    ? fetchedContent.substring(0, maxPreviewLength) + '...'
    : fetchedContent;

  const getDomain = (urlString: string) => {
    try { return new URL(urlString).hostname; } catch { return urlString; }
  };

  const handleUrlClick = async () => {
    try { await open(url); } catch (error) { console.error('Failed to open URL:', error); }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
          <Globe className="h-4 w-4 text-purple-500/70" />
          <span className="text-xs font-medium uppercase tracking-wider text-purple-600/70 dark:text-purple-400/70">Fetching</span>
          <button
            onClick={handleUrlClick}
            className="text-sm text-foreground/80 hover:text-foreground flex-1 truncate text-left hover:underline decoration-purple-500/50"
          >
            {url}
          </button>
        </div>

        {prompt && (
          <div className="ml-6 space-y-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="h-3 w-3" />
              <span>Analysis Prompt</span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {isExpanded && (
              <div className="rounded-lg border bg-muted/30 p-3 ml-4">
                <p className="text-sm text-foreground/90">{prompt}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-2 flex items-center gap-2 text-muted-foreground">
            <div className="animate-pulse flex items-center gap-1">
              <div className="h-1 w-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="h-1 w-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="h-1 w-1 bg-purple-500 rounded-full animate-bounce" />
            </div>
            <span className="text-sm">Fetching content from {getDomain(url)}...</span>
          </div>
        </div>
      ) : fetchedContent ? (
        <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-hidden">
          {hasError ? (
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Failed to fetch content</span>
              </div>
              <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap">{fetchedContent}</pre>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Content from {getDomain(url)}</span>
                </div>
                {isTruncated && (
                  <button
                    onClick={() => setShowFullContent(!showFullContent)}
                    className="text-xs text-purple-500 hover:text-purple-600 transition-colors flex items-center gap-1"
                  >
                    {showFullContent ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show full content</>}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className={cn("rounded-lg bg-muted/30 p-3 overflow-hidden", !showFullContent && isTruncated && "max-h-[300px]")}>
                  <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap">{previewContent}</pre>
                  {!showFullContent && isTruncated && (
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="h-4 w-4" />
              <span className="text-sm">No content returned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
