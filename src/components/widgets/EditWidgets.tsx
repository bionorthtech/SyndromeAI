import React, { useState } from "react";
import {
  FileEdit,
  GitBranch,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { getClaudeSyntaxTheme } from "@/lib/claudeSyntaxTheme";
import { useTheme } from "@/hooks";
import * as Diff from 'diff';

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

export const EditWidget: React.FC<{
  file_path: string;
  old_string: string;
  new_string: string;
  result?: any;
}> = ({ file_path, old_string, new_string, result: _result }) => {
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const diffResult = Diff.diffLines(old_string || '', new_string || '', {
    newlineIsToken: true,
    ignoreWhitespace: false
  });
  const language = getLanguage(file_path);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <FileEdit className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Applying Edit to:</span>
        <code className="text-sm font-mono bg-background px-2 py-0.5 rounded flex-1 truncate">
          {file_path}
        </code>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden text-xs font-mono">
        <div className="max-h-[440px] overflow-y-auto overflow-x-auto">
          {diffResult.map((part, index) => {
            const partClass = part.added
              ? 'bg-green-950/20'
              : part.removed
              ? 'bg-red-950/20'
              : '';

            if (!part.added && !part.removed && part.count && part.count > 8) {
              return (
                <div key={index} className="px-4 py-1 bg-muted border-y border-border text-center text-muted-foreground text-xs">
                  ... {part.count} unchanged lines ...
                </div>
              );
            }

            const value = part.value.endsWith('\n') ? part.value.slice(0, -1) : part.value;

            return (
              <div key={index} className={cn(partClass, "flex")}>
                <div className="w-8 select-none text-center flex-shrink-0">
                  {part.added ? <span className="text-green-400">+</span> : part.removed ? <span className="text-red-400">-</span> : null}
                </div>
                <div className="flex-1">
                  <SyntaxHighlighter
                    language={language}
                    style={syntaxTheme}
                    PreTag="div"
                    wrapLongLines={false}
                    customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
                    codeTagProps={{ style: { fontSize: '0.75rem', lineHeight: '1.6' } }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const EditResultWidget: React.FC<{ content: string }> = ({ content }) => {
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const lines = content.split('\n');
  let filePath = '';
  const codeLines: { lineNumber: string; code: string }[] = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (line.includes('The file') && line.includes('has been updated')) {
      const match = line.match(/The file (.+) has been updated/);
      if (match) filePath = match[1];
    } else if (/^\s*\d+/.test(line)) {
      inCodeBlock = true;
      const lineMatch = line.match(/^\s*(\d+)\t?(.*)$/);
      if (lineMatch) {
        const [, lineNum, codePart] = lineMatch;
        codeLines.push({ lineNumber: lineNum, code: codePart });
      }
    } else if (inCodeBlock) {
      codeLines.push({ lineNumber: '', code: line });
    }
  }

  const codeContent = codeLines.map(l => l.code).join('\n');
  const firstNumberedLine = codeLines.find(l => l.lineNumber !== '');
  const startLineNumber = firstNumberedLine ? parseInt(firstNumberedLine.lineNumber) : 1;
  const language = getLanguage(filePath);

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="px-4 py-2 border-b bg-emerald-950/30 flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs font-mono text-emerald-400">Edit Result</span>
        {filePath && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">{filePath}</span>
          </>
        )}
      </div>
      <div className="overflow-x-auto max-h-[440px]">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          showLineNumbers
          startingLineNumber={startLineNumber}
          wrapLongLines={false}
          customStyle={{ margin: 0, background: 'transparent', lineHeight: '1.6' }}
          codeTagProps={{ style: { fontSize: '0.75rem' } }}
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
    </div>
  );
};

export const MultiEditWidget: React.FC<{
  file_path: string;
  edits: Array<{ old_string: string; new_string: string }>;
  result?: any;
}> = ({ file_path, edits, result: _result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const language = getLanguage(file_path);
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <FileEdit className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Using tool: MultiEdit</span>
      </div>
      <div className="ml-6 space-y-2">
        <div className="flex items-center gap-2">
          <FileEdit className="h-3 w-3 text-blue-500" />
          <code className="text-xs font-mono text-blue-500">{file_path}</code>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
            {edits.length} edit{edits.length !== 1 ? 's' : ''}
          </button>

          {isExpanded && (
            <div className="space-y-3 mt-3">
              {edits.map((edit, index) => {
                const diffResult = Diff.diffLines(edit.old_string || '', edit.new_string || '', {
                  newlineIsToken: true,
                  ignoreWhitespace: false
                });

                return (
                  <div key={index} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Edit {index + 1}</div>
                    <div className="rounded-lg border bg-background overflow-hidden text-xs font-mono">
                      <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                        {diffResult.map((part, partIndex) => {
                          const partClass = part.added
                            ? 'bg-green-950/20'
                            : part.removed
                            ? 'bg-red-950/20'
                            : '';

                          if (!part.added && !part.removed && part.count && part.count > 8) {
                            return (
                              <div key={partIndex} className="px-4 py-1 bg-muted border-y border-border text-center text-muted-foreground text-xs">
                                ... {part.count} unchanged lines ...
                              </div>
                            );
                          }

                          const value = part.value.endsWith('\n') ? part.value.slice(0, -1) : part.value;

                          return (
                            <div key={partIndex} className={cn(partClass, "flex")}>
                              <div className="w-8 select-none text-center flex-shrink-0">
                                {part.added ? <span className="text-green-400">+</span> : part.removed ? <span className="text-red-400">-</span> : null}
                              </div>
                              <div className="flex-1">
                                <SyntaxHighlighter
                                  language={language}
                                  style={syntaxTheme}
                                  PreTag="div"
                                  wrapLongLines={false}
                                  customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
                                  codeTagProps={{ style: { fontSize: '0.75rem', lineHeight: '1.6' } }}
                                >
                                  {value}
                                </SyntaxHighlighter>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MultiEditResultWidget: React.FC<{
  content: string;
  edits?: Array<{ old_string: string; new_string: string }>;
}> = ({ content, edits }) => {
  if (edits && edits.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-t-md border-b border-green-500/20">
          <GitBranch className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {edits.length} Changes Applied
          </span>
        </div>

        <div className="space-y-4">
          {edits.map((edit, index) => {
            const oldLines = edit.old_string.split('\n');
            const newLines = edit.new_string.split('\n');

            return (
              <div key={index} className="border border-border/50 rounded-md overflow-hidden">
                <div className="px-3 py-1 bg-muted/50 border-b border-border/50">
                  <span className="text-xs font-medium text-muted-foreground">Change {index + 1}</span>
                </div>

                <div className="font-mono text-xs">
                  {oldLines.map((line, lineIndex) => (
                    <div key={`old-${lineIndex}`} className="flex bg-red-500/10 border-l-4 border-red-500">
                      <span className="w-12 px-2 py-1 text-red-600 dark:text-red-400 select-none text-right bg-red-500/10">
                        -{lineIndex + 1}
                      </span>
                      <pre className="flex-1 px-3 py-1 text-red-700 dark:text-red-300 overflow-x-auto">
                        <code>{line || ' '}</code>
                      </pre>
                    </div>
                  ))}

                  {newLines.map((line, lineIndex) => (
                    <div key={`new-${lineIndex}`} className="flex bg-green-500/10 border-l-4 border-green-500">
                      <span className="w-12 px-2 py-1 text-green-600 dark:text-green-400 select-none text-right bg-green-500/10">
                        +{lineIndex + 1}
                      </span>
                      <pre className="flex-1 px-3 py-1 text-green-700 dark:text-green-300 overflow-x-auto">
                        <code>{line || ' '}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="px-4 py-2 border-b bg-emerald-950/30 flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs font-mono text-emerald-400">MultiEdit Result</span>
      </div>
      <div className="p-3">
        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{content}</pre>
      </div>
    </div>
  );
};
