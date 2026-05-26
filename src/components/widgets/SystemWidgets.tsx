import React, { useState } from "react";
import {
  Info,
  AlertCircle,
  Settings,
  Fingerprint,
  Cpu,
  FolderOpen,
  Wrench,
  Terminal,
  FileText,
  Search,
  List,
  LogOut,
  Edit3,
  FilePlus,
  Book,
  BookOpen,
  Globe,
  ListChecks,
  ListPlus,
  Globe2,
  Package,
  ChevronDown,
  Package2,
  CheckSquare,
  type LucideIcon,
  Bot,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const SummaryWidget: React.FC<{
  summary: string;
  leafUuid?: string;
}> = ({ summary, leafUuid }) => {
  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="mt-0.5">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">AI Summary</div>
          <p className="text-sm text-foreground">{summary}</p>
          {leafUuid && (
            <div className="text-xs text-muted-foreground mt-2">
              ID: <code className="font-mono">{leafUuid.slice(0, 8)}...</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SystemReminderWidget: React.FC<{ message: string }> = ({ message }) => {
  let icon = <Info className="h-4 w-4" />;
  let colorClass = "border-blue-500/20 bg-blue-500/5 text-blue-600";

  if (message.toLowerCase().includes("warning")) {
    icon = <AlertCircle className="h-4 w-4" />;
    colorClass = "border-yellow-500/20 bg-yellow-500/5 text-yellow-600";
  } else if (message.toLowerCase().includes("error")) {
    icon = <AlertCircle className="h-4 w-4" />;
    colorClass = "border-destructive/20 bg-destructive/5 text-destructive";
  }

  return (
    <div className={cn("flex items-start gap-2 p-3 rounded-md border", colorClass)}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 text-sm">{message}</div>
    </div>
  );
};

export const SystemInitializedWidget: React.FC<{
  sessionId?: string;
  model?: string;
  cwd?: string;
  tools?: string[];
}> = ({ sessionId, model, cwd, tools = [] }) => {
  const [mcpExpanded, setMcpExpanded] = useState(false);

  const regularTools = tools.filter(tool => !tool.startsWith('mcp__'));
  const mcpTools = tools.filter(tool => tool.startsWith('mcp__'));

  const toolIcons: Record<string, LucideIcon> = {
    'task': CheckSquare,
    'bash': Terminal,
    'glob': Search,
    'grep': Search,
    'ls': List,
    'exit_plan_mode': LogOut,
    'read': FileText,
    'edit': Edit3,
    'multiedit': Edit3,
    'write': FilePlus,
    'notebookread': Book,
    'notebookedit': BookOpen,
    'webfetch': Globe,
    'todoread': ListChecks,
    'todowrite': ListPlus,
    'websearch': Globe2,
  };

  const getToolIcon = (toolName: string) => {
    const normalizedName = toolName.toLowerCase();
    return toolIcons[normalizedName] || Wrench;
  };

  const formatMcpToolName = (toolName: string) => {
    const withoutPrefix = toolName.replace(/^mcp__/, '');
    const parts = withoutPrefix.split('__');
    if (parts.length >= 2) {
      const provider = parts[0].replace(/_/g, ' ').replace(/-/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const method = parts.slice(1).join('__').replace(/_/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { provider, method };
    }
    return {
      provider: 'MCP',
      method: withoutPrefix.replace(/_/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    };
  };

  const mcpToolsByProvider = mcpTools.reduce((acc, tool) => {
    const { provider } = formatMcpToolName(tool);
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(tool);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1 space-y-4">
            <h4 className="font-semibold text-sm">System Initialized</h4>

            <div className="space-y-2">
              {sessionId && (
                <div className="flex items-center gap-2 text-xs">
                  <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Session ID:</span>
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{sessionId}</code>
                </div>
              )}
              {model && (
                <div className="flex items-center gap-2 text-xs">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Model:</span>
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{model}</code>
                </div>
              )}
              {cwd && (
                <div className="flex items-center gap-2 text-xs">
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Working Directory:</span>
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">{cwd}</code>
                </div>
              )}
            </div>

            {regularTools.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Available Tools ({regularTools.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {regularTools.map((tool, idx) => {
                    const Icon = getToolIcon(tool);
                    return (
                      <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2 flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {tool}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {mcpTools.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setMcpExpanded(!mcpExpanded)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>MCP Services ({mcpTools.length})</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", mcpExpanded && "rotate-180")} />
                </button>

                {mcpExpanded && (
                  <div className="ml-5 space-y-3">
                    {Object.entries(mcpToolsByProvider).map(([provider, providerTools]) => (
                      <div key={provider} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Package2 className="h-3 w-3" />
                          <span className="font-medium">{provider}</span>
                          <span className="text-muted-foreground/60">({providerTools.length})</span>
                        </div>
                        <div className="ml-4 flex flex-wrap gap-1">
                          {providerTools.map((tool, idx) => {
                            const { method } = formatMcpToolName(tool);
                            return (
                              <Badge key={idx} variant="outline" className="text-xs py-0 px-1.5 font-normal">
                                {method}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tools.length === 0 && (
              <div className="text-xs text-muted-foreground italic">No tools available</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ThinkingWidget: React.FC<{
  thinking: string;
  signature?: string;
}> = ({ thinking }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const trimmedThinking = thinking.trim();

  return (
    <div className="rounded-lg border border-gray-500/20 bg-gray-500/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-4 w-4 text-gray-500" />
            <Sparkles className="h-2.5 w-2.5 text-gray-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 italic">Thinking...</span>
        </div>
        <Info className={cn("h-4 w-4 text-gray-500 transition-transform", isExpanded && "rotate-90")} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-500/20">
          <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-500/5 p-3 rounded-lg italic">
            {trimmedThinking}
          </pre>
        </div>
      )}
    </div>
  );
};
