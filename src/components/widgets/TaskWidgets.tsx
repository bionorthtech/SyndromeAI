import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  X,
  ChevronRight,
  Bot,
  Sparkles,
  Zap,
  FileEdit,
  GitBranch,
  BarChart3,
  LayoutGrid,
  Download,
  Activity,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export const TodoWidget: React.FC<{ todos: any[]; result?: any }> = ({ todos, result: _result }) => {
  const statusIcons = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500 animate-pulse" />,
    pending: <Circle className="h-4 w-4 text-muted-foreground" />
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20"
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <FileEdit className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Todo List</span>
      </div>
      <div className="space-y-2">
        {todos.map((todo, idx) => (
          <div
            key={todo.id || idx}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border bg-card/50",
              todo.status === "completed" && "opacity-60"
            )}
          >
            <div className="mt-0.5">
              {statusIcons[todo.status as keyof typeof statusIcons] || statusIcons.pending}
            </div>
            <div className="flex-1 space-y-1">
              <p className={cn("text-sm", todo.status === "completed" && "line-through")}>
                {todo.content}
              </p>
              {todo.priority && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", priorityColors[todo.priority as keyof typeof priorityColors])}
                >
                  {todo.priority}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TaskWidget: React.FC<{
  description?: string;
  prompt?: string;
  result?: any;
}> = ({ description, prompt, result: _result }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Bot className="h-4 w-4 text-purple-500" />
          <Sparkles className="h-2.5 w-2.5 text-purple-400 absolute -top-1 -right-1" />
        </div>
        <span className="text-sm font-medium">Spawning Sub-Agent Task</span>
      </div>

      <div className="ml-6 space-y-3">
        {description && (
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Task Description</span>
            </div>
            <p className="text-sm text-foreground ml-5">{description}</p>
          </div>
        )}

        {prompt && (
          <div className="space-y-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
              <span>Task Instructions</span>
            </button>

            {isExpanded && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {prompt}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const TodoReadWidget: React.FC<{ todos?: any[]; result?: any }> = ({ todos: inputTodos, result }) => {
  let todos: any[] = inputTodos || [];
  if (!todos.length && result) {
    if (typeof result === 'object' && Array.isArray(result.todos)) {
      todos = result.todos;
    } else if (typeof result.content === 'string') {
      try {
        const parsed = JSON.parse(result.content);
        if (Array.isArray(parsed)) todos = parsed;
        else if (parsed.todos) todos = parsed.todos;
      } catch (e) {
        // Not JSON, ignore
      }
    }
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "board" | "timeline" | "stats">("list");
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());

  const statusConfig = {
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      label: "Completed"
    },
    in_progress: {
      icon: <Clock className="h-4 w-4 animate-pulse" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      label: "In Progress"
    },
    pending: {
      icon: <Circle className="h-4 w-4" />,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted",
      label: "Pending"
    },
    cancelled: {
      icon: <X className="h-4 w-4" />,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      label: "Cancelled"
    }
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = !searchQuery ||
      todo.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.id && todo.id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.status === 'completed').length,
    in_progress: todos.filter(t => t.status === 'in_progress').length,
    pending: todos.filter(t => t.status === 'pending').length,
    cancelled: todos.filter(t => t.status === 'cancelled').length,
    high_priority: todos.filter(t => t.priority === 'high').length,
    medium_priority: todos.filter(t => t.priority === 'medium').length,
    low_priority: todos.filter(t => t.priority === 'low').length,
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20"
  };

  const toggleTodoExpansion = (id: string) => {
    setExpandedTodos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TodoCard = ({ todo, isExpanded: expanded }: { todo: any; isExpanded: boolean }) => {
    const config = statusConfig[todo.status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "rounded-lg border p-3 cursor-pointer transition-colors",
          config.bgColor,
          config.borderColor,
          todo.status === 'completed' && 'opacity-60'
        )}
        onClick={() => todo.id && toggleTodoExpansion(todo.id)}
      >
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 flex-shrink-0", config.color)}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm", todo.status === 'completed' && 'line-through text-muted-foreground')}>
              {todo.content}
            </p>
            {expanded && todo.id && (
              <div className="mt-2 text-xs text-muted-foreground font-mono">
                ID: {todo.id}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {todo.priority && (
              <Badge variant="outline" className={cn("text-xs", priorityColors[todo.priority as keyof typeof priorityColors])}>
                {todo.priority}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const BoardView = () => {
    const columns = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
    return (
      <div className="grid grid-cols-2 gap-3">
        {columns.map(status => {
          const config = statusConfig[status];
          const columnTodos = filteredTodos.filter(t => t.status === status);
          return (
            <div key={status} className={cn("rounded-lg border p-3 space-y-2", config.bgColor, config.borderColor)}>
              <div className={cn("flex items-center gap-2 text-xs font-medium", config.color)}>
                {config.icon}
                <span>{config.label}</span>
                <Badge variant="outline" className="ml-auto text-xs">{columnTodos.length}</Badge>
              </div>
              {columnTodos.map((todo, idx) => (
                <div key={todo.id || idx} className="bg-background/50 rounded p-2 text-xs">
                  {todo.content}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const TimelineView = () => {
    return (
      <div className="space-y-3">
        {filteredTodos.map((todo, idx) => {
          const config = statusConfig[todo.status as keyof typeof statusConfig] || statusConfig.pending;
          return (
            <div key={todo.id || idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("rounded-full p-1", config.bgColor, config.color)}>
                  {config.icon}
                </div>
                {idx < filteredTodos.length - 1 && (
                  <div className="w-px h-6 bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <p className={cn("text-sm", todo.status === 'completed' && 'line-through text-muted-foreground')}>
                  {todo.content}
                </p>
                {todo.priority && (
                  <Badge variant="outline" className={cn("text-xs mt-1", priorityColors[todo.priority as keyof typeof priorityColors])}>
                    {todo.priority}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const StatsView = () => {
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: <Hash className="h-4 w-4" />, color: 'text-foreground' },
            { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-500' },
            { label: 'In Progress', value: stats.in_progress, icon: <Activity className="h-4 w-4" />, color: 'text-blue-500' },
            { label: 'Pending', value: stats.pending, icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground' },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border bg-muted/20 p-3">
              <div className={cn("flex items-center gap-2 mb-1", stat.color)}>
                {stat.icon}
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Completion Rate</span>
            <span className="font-bold">{completionRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="text-xs font-medium mb-2">Priority Distribution</div>
          {[
            { label: 'High', value: stats.high_priority, color: 'bg-red-500' },
            { label: 'Medium', value: stats.medium_priority, color: 'bg-yellow-500' },
            { label: 'Low', value: stats.low_priority, color: 'bg-green-500' },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-2 text-xs">
              <span className="w-12 text-muted-foreground">{p.label}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", p.color)}
                  style={{ width: stats.total > 0 ? `${(p.value / stats.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="w-4 text-right">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (todos.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No todos available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Todo List</span>
          <Badge variant="outline" className="text-xs">{todos.length}</Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-green-500 border-green-500/20">
            {stats.completed} done
          </Badge>
          {stats.in_progress > 0 && (
            <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/20">
              {stats.in_progress} active
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search todos..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-7 text-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-7 text-xs border rounded-md px-2 bg-background"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Tabs value={viewMode} onValueChange={v => setViewMode(v as typeof viewMode)}>
        <TabsList className="h-7 text-xs">
          <TabsTrigger value="list" className="text-xs">
            <Download className="h-4 w-4 mr-1" />
            List
          </TabsTrigger>
          <TabsTrigger value="board" className="text-xs">
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            <GitBranch className="h-4 w-4 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">
            <BarChart3 className="h-4 w-4 mr-1" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredTodos.map(todo => (
                <TodoCard
                  key={todo.id || filteredTodos.indexOf(todo)}
                  todo={todo}
                  isExpanded={expandedTodos.has(todo.id)}
                />
              ))}
            </AnimatePresence>
            {filteredTodos.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No todos match your filters"
                  : "No todos available"}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <BoardView />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineView />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <StatsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};
