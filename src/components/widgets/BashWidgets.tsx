import React from "react";
import { Terminal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectLinks, makeLinksClickable } from "@/lib/linkDetector";

export const BashWidget: React.FC<{
  command: string;
  description?: string;
  result?: any;
}> = ({ command, description, result }) => {
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
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 border-b">
        <Terminal className="h-3.5 w-3.5 text-green-500" />
        <span className="text-xs font-mono text-muted-foreground">Terminal</span>
        {description && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{description}</span>
          </>
        )}
        {!result && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Running...</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <code className="text-xs font-mono text-green-400 block">
          $ {command}
        </code>

        {result && (
          <div className={cn(
            "mt-3 p-3 rounded-md border text-xs font-mono whitespace-pre-wrap overflow-x-auto",
            isError
              ? "border-red-500/20 bg-red-500/5 text-red-400"
              : "border-green-500/20 bg-green-500/5 text-green-300"
          )}>
            {resultContent || (isError ? "Command failed" : "Command completed")}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommandWidget: React.FC<{
  commandName: string;
  commandMessage: string;
  commandArgs?: string;
}> = ({ commandName, commandMessage, commandArgs }) => {
  return (
    <div className="rounded-lg border bg-background/50 overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-2">
        <Terminal className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-mono text-blue-400">Command</span>
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">$</span>
          <code className="text-sm font-mono text-foreground">{commandName}</code>
          {commandArgs && (
            <code className="text-sm font-mono text-muted-foreground">{commandArgs}</code>
          )}
        </div>
        {commandMessage && commandMessage !== commandName && (
          <div className="text-xs text-muted-foreground ml-4">{commandMessage}</div>
        )}
      </div>
    </div>
  );
};

export const CommandOutputWidget: React.FC<{
  output: string;
  onLinkDetected?: (url: string) => void;
}> = ({ output, onLinkDetected }) => {
  React.useEffect(() => {
    if (output && onLinkDetected) {
      const links = detectLinks(output);
      if (links.length > 0) {
        onLinkDetected(links[0].fullUrl);
      }
    }
  }, [output, onLinkDetected]);

  const parseAnsiToReact = (text: string) => {
    const parts = text.split(/(\[\d+m)/);
    let isBold = false;
    const elements: React.ReactNode[] = [];

    parts.forEach((part, idx) => {
      if (part === '[1m') { isBold = true; return; }
      if (part === '[22m') { isBold = false; return; }
      if (part.match(/\[\d+m/)) return;
      if (!part) return;

      const linkElements = makeLinksClickable(part, (url) => {
        onLinkDetected?.(url);
      });

      if (isBold) {
        elements.push(<span key={idx} className="font-bold">{linkElements}</span>);
      } else {
        elements.push(...linkElements);
      }
    });

    return elements;
  };

  return (
    <div className="rounded-lg border bg-background/50 overflow-hidden">
      <div className="px-4 py-2 bg-muted/50 flex items-center gap-2">
        <ChevronRight className="h-3 w-3 text-green-500" />
        <span className="text-xs font-mono text-green-400">Output</span>
      </div>
      <div className="p-3">
        <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
          {output ? parseAnsiToReact(output) : <span className="text-zinc-500 italic">No output</span>}
        </pre>
      </div>
    </div>
  );
};
