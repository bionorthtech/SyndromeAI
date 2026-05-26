import React, { useState } from "react";
import {
  FileText,
  FolderOpen,
  Search,
  FileEdit,
  ChevronRight,
  Maximize2,
  X,
  Folder,
  FileCode,
  Terminal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { getClaudeSyntaxTheme } from "@/lib/claudeSyntaxTheme";
import { useTheme } from "@/hooks";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

const getLanguage = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", rs: "rust", go: "go", java: "java", cpp: "cpp",
    c: "c", cs: "csharp", php: "php", rb: "ruby", swift: "swift",
    kt: "kotlin", scala: "scala", sh: "bash", bash: "bash", zsh: "bash",
    yaml: "yaml", yml: "yaml", json: "json", xml: "xml", html: "html",
    css: "css", scss: "scss", sass: "sass", less: "less", sql: "sql",
    md: "markdown", toml: "ini", ini: "ini", dockerfile: "dockerfile",
    makefile: "makefile"
  };
  return languageMap[ext || ""] || "text";
};

export const LSWidget: React.FC<{ path: string; result?: any }> = ({ path, result }) => {
  if (result) {
    let resultContent = '';
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

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="text-sm">Directory contents for:</span>
          <code className="text-sm font-mono bg-background px-2 py-0.5 rounded">
            {path}
          </code>
        </div>
        {resultContent && <LSResultWidget content={resultContent} />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      <FolderOpen className="h-4 w-4 text-primary" />
      <span className="text-sm">Listing directory:</span>
      <code className="text-sm font-mono bg-background px-2 py-0.5 rounded">
        {path}
      </code>
      {!result && (
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export const LSResultWidget: React.FC<{ content: string }> = ({ content }) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const parseDirectoryTree = (rawContent: string) => {
    const lines = rawContent.split('\n');
    const entries: Array<{
      path: string;
      name: string;
      type: 'file' | 'directory';
      level: number;
    }> = [];

    let currentPath: string[] = [];

    for (const line of lines) {
      if (line.startsWith('NOTE:')) break;
      if (!line.trim()) continue;

      const indent = line.match(/^(\s*)/)?.[1] || '';
      const level = Math.floor(indent.length / 2);

      const entryMatch = line.match(/^\s*-\s+(.+?)(\/$)?$/);
      if (!entryMatch) continue;

      const fullName = entryMatch[1];
      const isDirectory = line.trim().endsWith('/');
      const name = isDirectory ? fullName : fullName;

      currentPath = currentPath.slice(0, level);
      currentPath.push(name);

      entries.push({
        path: currentPath.join('/'),
        name,
        type: isDirectory ? 'directory' : 'file',
        level,
      });
    }

    return entries;
  };

  const entries = parseDirectoryTree(content);

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getChildren = (parentPath: string, parentLevel: number) => {
    return entries.filter(e => {
      if (e.level !== parentLevel + 1) return false;
      const parentParts = parentPath.split('/').filter(Boolean);
      const entryParts = e.path.split('/').filter(Boolean);

      if (entryParts.length !== parentParts.length + 1) return false;

      for (let i = 0; i < parentParts.length; i++) {
        if (parentParts[i] !== entryParts[i]) return false;
      }

      return true;
    });
  };

  const renderEntry = (entry: typeof entries[0], isRoot = false) => {
    const hasChildren = entry.type === 'directory' &&
      entries.some(e => e.path.startsWith(entry.path + '/') && e.level === entry.level + 1);
    const isExpanded = expandedDirs.has(entry.path) || isRoot;

    const getIcon = () => {
      if (entry.type === 'directory') {
        return isExpanded ?
          <FolderOpen className="h-3.5 w-3.5 text-blue-500" /> :
          <Folder className="h-3.5 w-3.5 text-blue-500" />;
      }

      const ext = entry.name.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'rs': return <FileCode className="h-3.5 w-3.5 text-orange-500" />;
        case 'toml': case 'yaml': case 'yml': case 'json':
          return <FileText className="h-3.5 w-3.5 text-yellow-500" />;
        case 'md': return <FileText className="h-3.5 w-3.5 text-blue-400" />;
        case 'js': case 'jsx': case 'ts': case 'tsx':
          return <FileCode className="h-3.5 w-3.5 text-yellow-400" />;
        case 'py': return <FileCode className="h-3.5 w-3.5 text-blue-500" />;
        case 'go': return <FileCode className="h-3.5 w-3.5 text-cyan-500" />;
        case 'sh': case 'bash': return <Terminal className="h-3.5 w-3.5 text-green-500" />;
        default: return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
      }
    };

    return (
      <div key={entry.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 transition-colors cursor-pointer",
            !isRoot && "ml-4"
          )}
          onClick={() => entry.type === 'directory' && hasChildren && toggleDirectory(entry.path)}
        >
          {entry.type === 'directory' && hasChildren && (
            <ChevronRight className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )} />
          )}
          {(!hasChildren || entry.type !== 'directory') && (
            <div className="w-3" />
          )}
          {getIcon()}
          <span className="text-sm font-mono">{entry.name}</span>
        </div>

        {entry.type === 'directory' && hasChildren && isExpanded && (
          <div className="ml-2">
            {getChildren(entry.path, entry.level).map(child => renderEntry(child))}
          </div>
        )}
      </div>
    );
  };

  const rootEntries = entries.filter(e => e.level === 0);

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="space-y-1">
        {rootEntries.map(entry => renderEntry(entry, true))}
      </div>
    </div>
  );
};

export const ReadWidget: React.FC<{ filePath: string; result?: any }> = ({ filePath, result }) => {
  if (result) {
    let resultContent = '';
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

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm">File content:</span>
          <code className="text-sm font-mono bg-background px-2 py-0.5 rounded flex-1 truncate">
            {filePath}
          </code>
        </div>
        {resultContent && <ReadResultWidget content={resultContent} filePath={filePath} />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      <FileText className="h-4 w-4 text-primary" />
      <span className="text-sm">Reading file:</span>
      <code className="text-sm font-mono bg-background px-2 py-0.5 rounded flex-1 truncate">
        {filePath}
      </code>
      {!result && (
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export const ReadResultWidget: React.FC<{ content: string; filePath?: string }> = ({ content, filePath }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const getLanguageForFile = (path?: string) => {
    if (!path) return "text";
    return getLanguage(path);
  };

  const parseContent = (rawContent: string) => {
    const lines = rawContent.split('\n');
    const codeLines: string[] = [];
    let minLineNumber = Infinity;

    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    if (nonEmptyLines.length === 0) {
      return { codeContent: rawContent, startLineNumber: 1 };
    }
    const parsableLines = nonEmptyLines.filter(line => /^\s*\d+→/.test(line)).length;
    const isLikelyNumbered = (parsableLines / nonEmptyLines.length) > 0.5;

    if (!isLikelyNumbered) {
      return { codeContent: rawContent, startLineNumber: 1 };
    }

    for (const line of lines) {
      const trimmedLine = line.trimStart();
      const match = trimmedLine.match(/^(\d+)→(.*)$/);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        if (minLineNumber === Infinity) {
          minLineNumber = lineNum;
        }
        codeLines.push(match[2]);
      } else if (line.trim() === '') {
        codeLines.push('');
      } else {
        codeLines.push('');
      }
    }

    while (codeLines.length > 0 && codeLines[codeLines.length - 1] === '') {
      codeLines.pop();
    }

    return {
      codeContent: codeLines.join('\n'),
      startLineNumber: minLineNumber === Infinity ? 1 : minLineNumber
    };
  };

  const language = getLanguageForFile(filePath);
  const { codeContent, startLineNumber } = parseContent(content);
  const lineCount = content.split('\n').filter(line => line.trim()).length;
  const isLargeFile = lineCount > 20;

  return (
    <div className="rounded-lg overflow-hidden border bg-background w-full">
      <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {filePath || "File content"}
          </span>
          {isLargeFile && (
            <span className="text-xs text-muted-foreground">
              ({lineCount} lines)
            </span>
          )}
        </div>
        {isLargeFile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>

      {(!isLargeFile || isExpanded) && (
        <div className="relative overflow-x-auto">
          <SyntaxHighlighter
            language={language}
            style={syntaxTheme}
            showLineNumbers
            startingLineNumber={startLineNumber}
            wrapLongLines={false}
            customStyle={{
              margin: 0,
              background: 'transparent',
              lineHeight: '1.6'
            }}
            codeTagProps={{
              style: {
                fontSize: '0.75rem'
              }
            }}
            lineNumberStyle={{
              minWidth: "3.5rem",
              paddingRight: "1rem",
              textAlign: "right",
              opacity: 0.5,
            }}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      )}

      {isLargeFile && !isExpanded && (
        <div className="px-4 py-3 text-xs text-muted-foreground text-center bg-muted/30">
          Click "Expand" to view the full file
        </div>
      )}
    </div>
  );
};

export const GlobWidget: React.FC<{ pattern: string; result?: any }> = ({ pattern, result }) => {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <Search className="h-4 w-4 text-primary" />
        <span className="text-sm">Searching for pattern:</span>
        <code className="text-sm font-mono bg-background px-2 py-0.5 rounded">
          {pattern}
        </code>
        {!result && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Searching...</span>
          </div>
        )}
      </div>

      {result && (
        <div className={cn(
          "p-3 rounded-md border text-xs font-mono whitespace-pre-wrap overflow-x-auto",
          isError
            ? "border-red-500/20 bg-red-500/5 text-red-400"
            : "border-green-500/20 bg-green-500/5 text-green-300"
        )}>
          {resultContent || (isError ? "Search failed" : "No matches found")}
        </div>
      )}
    </div>
  );
};

export const WriteWidget: React.FC<{ filePath: string; content: string; result?: any }> = ({ filePath, content, result: _result }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const language = getLanguage(filePath);
  const isLargeContent = content.length > 1000;
  const displayContent = isLargeContent ? content.substring(0, 1000) + "\n..." : content;

  const MaximizedView = () => {
    if (!isMaximized) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMaximized(false)}
        />
        <div className="relative w-[90vw] h-[90vh] max-w-7xl bg-background rounded-lg border shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b bg-background flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground">{filePath}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMaximized(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <SyntaxHighlighter
              language={language}
              style={syntaxTheme}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: 'transparent',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                height: '100%'
              }}
              showLineNumbers
            >
              {content}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const CodePreview = ({ codeContent, truncated }: { codeContent: string; truncated: boolean }) => (
    <div
      className="rounded-lg border bg-background overflow-hidden w-full"
      style={{
        height: truncated ? '440px' : 'auto',
        maxHeight: truncated ? '440px' : undefined,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="px-4 py-2 border-b bg-background flex items-center justify-between sticky top-0 z-10">
        <span className="text-xs font-mono text-muted-foreground">Preview</span>
        {isLargeContent && truncated && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              Truncated to 1000 chars
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMaximized(true)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-auto flex-1">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.75rem',
            lineHeight: '1.5',
            overflowX: 'auto'
          }}
          wrapLongLines={false}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <FileEdit className="h-4 w-4 text-primary" />
        <span className="text-sm">Writing to file:</span>
        <code className="text-sm font-mono bg-background px-2 py-0.5 rounded flex-1 truncate">
          {filePath}
        </code>
      </div>
      <CodePreview codeContent={displayContent} truncated={true} />
      <MaximizedView />
    </div>
  );
};

export const GrepWidget: React.FC<{
  pattern: string;
  include?: string;
  path?: string;
  exclude?: string;
  result?: any;
}> = ({ pattern, include, path, exclude, result }) => {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const parseGrepResults = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const results: Array<{
      file: string;
      lineNumber: number;
      content: string;
    }> = [];

    lines.forEach(line => {
      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (match) {
        results.push({
          file: match[1],
          lineNumber: parseInt(match[2], 10),
          content: match[3]
        });
      }
    });

    return results;
  };

  const grepResults = result && !isError ? parseGrepResults(resultContent) : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <Search className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium">Searching with grep</span>
        {!result && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Searching...</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
        <div className="grid gap-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-1.5 min-w-[80px]">
              <FileText className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Pattern</span>
            </div>
            <code className="flex-1 font-mono text-sm bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md text-emerald-600 dark:text-emerald-400">
              {pattern}
            </code>
          </div>

          {path && (
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1.5 min-w-[80px]">
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Path</span>
              </div>
              <code className="flex-1 font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                {path}
              </code>
            </div>
          )}

          {(include || exclude) && (
            <div className="flex gap-4">
              {include && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">Include</span>
                  </div>
                  <code className="font-mono text-xs bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-green-600 dark:text-green-400">
                    {include}
                  </code>
                </div>
              )}

              {exclude && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <X className="h-3 w-3 text-red-500" />
                    <span className="text-xs font-medium text-muted-foreground">Exclude</span>
                  </div>
                  <code className="font-mono text-xs bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-red-600 dark:text-red-400">
                    {exclude}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-2">
          {isError ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <ChevronUp className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="text-sm text-red-600 dark:text-red-400">
                {resultContent || "Search failed"}
              </div>
            </div>
          ) : grepResults.length > 0 ? (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <span>{grepResults.length} matches found</span>
              </button>

              {isExpanded && (
                <div className="rounded-lg border bg-background overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    {grepResults.map((match, idx) => {
                      const fileName = match.file.split('/').pop() || match.file;
                      const dirPath = match.file.substring(0, match.file.lastIndexOf('/'));

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-start gap-3 p-3 border-b border-border hover:bg-muted/50 transition-colors",
                            idx === grepResults.length - 1 && "border-b-0"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-[60px]">
                            <FileText className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-mono text-emerald-400">
                              {match.lineNumber}
                            </span>
                          </div>

                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-400 truncate">
                                {fileName}
                              </span>
                              {dirPath && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {dirPath}
                                </span>
                              )}
                            </div>
                            <code className="text-xs font-mono text-zinc-300 block whitespace-pre-wrap break-all">
                              {match.content.trim()}
                            </code>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <FileText className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm text-amber-600 dark:text-amber-400">
                No matches found for the given pattern.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
