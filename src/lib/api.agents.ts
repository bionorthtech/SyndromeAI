import { apiCall } from './apiAdapter';
import type {
  Project, Session, FileEntry, ClaudeInstallation,
  Agent, AgentExport, GitHubAgentFile, AgentRun, AgentRunWithMetrics,
  ClaudeSettings, ClaudeVersionStatus, ClaudeMdFile,
  UsageStats, UsageEntry, ProjectUsage,
} from './api.types';

export const agentsMethods = {
  async getHomeDirectory(): Promise<string> {
    try {
      return await apiCall<string>("get_home_directory");
    } catch (error) {
      console.error("Failed to get home directory:", error);
      return "/";
    }
  },

  async listProjects(): Promise<Project[]> {
    try {
      return await apiCall<Project[]>("list_projects");
    } catch (error) {
      console.error("Failed to list projects:", error);
      throw error;
    }
  },

  async createProject(path: string): Promise<Project> {
    try {
      return await apiCall<Project>('create_project', { path });
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  },

  async getProjectSessions(projectId: string): Promise<Session[]> {
    try {
      return await apiCall<Session[]>('get_project_sessions', { projectId });
    } catch (error) {
      console.error("Failed to get project sessions:", error);
      throw error;
    }
  },

  async fetchGitHubAgents(): Promise<GitHubAgentFile[]> {
    try {
      return await apiCall<GitHubAgentFile[]>('fetch_github_agents');
    } catch (error) {
      console.error("Failed to fetch GitHub agents:", error);
      throw error;
    }
  },

  async fetchGitHubAgentContent(downloadUrl: string): Promise<AgentExport> {
    try {
      return await apiCall<AgentExport>('fetch_github_agent_content', { downloadUrl });
    } catch (error) {
      console.error("Failed to fetch GitHub agent content:", error);
      throw error;
    }
  },

  async importAgentFromGitHub(downloadUrl: string): Promise<Agent> {
    try {
      return await apiCall<Agent>('import_agent_from_github', { downloadUrl });
    } catch (error) {
      console.error("Failed to import agent from GitHub:", error);
      throw error;
    }
  },

  async getClaudeSettings(): Promise<ClaudeSettings> {
    try {
      const result = await apiCall<{ data: ClaudeSettings }>("get_claude_settings");
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data;
      }
      return result as ClaudeSettings;
    } catch (error) {
      console.error("Failed to get Claude settings:", error);
      throw error;
    }
  },

  async openNewSession(path?: string): Promise<string> {
    try {
      return await apiCall<string>("open_new_session", { path });
    } catch (error) {
      console.error("Failed to open new session:", error);
      throw error;
    }
  },

  async getSystemPrompt(): Promise<string> {
    try {
      return await apiCall<string>("get_system_prompt");
    } catch (error) {
      console.error("Failed to get system prompt:", error);
      throw error;
    }
  },

  async checkClaudeVersion(): Promise<ClaudeVersionStatus> {
    try {
      return await apiCall<ClaudeVersionStatus>("check_claude_version");
    } catch (error) {
      console.error("Failed to check Claude version:", error);
      throw error;
    }
  },

  async saveSystemPrompt(content: string): Promise<string> {
    try {
      return await apiCall<string>("save_system_prompt", { content });
    } catch (error) {
      console.error("Failed to save system prompt:", error);
      throw error;
    }
  },

  async saveClaudeSettings(settings: ClaudeSettings): Promise<string> {
    try {
      return await apiCall<string>("save_claude_settings", { settings });
    } catch (error) {
      console.error("Failed to save Claude settings:", error);
      throw error;
    }
  },

  async findClaudeMdFiles(projectPath: string): Promise<ClaudeMdFile[]> {
    try {
      return await apiCall<ClaudeMdFile[]>("find_claude_md_files", { projectPath });
    } catch (error) {
      console.error("Failed to find CLAUDE.md files:", error);
      throw error;
    }
  },

  async readClaudeMdFile(filePath: string): Promise<string> {
    try {
      return await apiCall<string>("read_claude_md_file", { filePath });
    } catch (error) {
      console.error("Failed to read CLAUDE.md file:", error);
      throw error;
    }
  },

  async saveClaudeMdFile(filePath: string, content: string): Promise<string> {
    try {
      return await apiCall<string>("save_claude_md_file", { filePath, content });
    } catch (error) {
      console.error("Failed to save CLAUDE.md file:", error);
      throw error;
    }
  },

  async listAgents(): Promise<Agent[]> {
    try {
      return await apiCall<Agent[]>('list_agents');
    } catch (error) {
      console.error("Failed to list agents:", error);
      throw error;
    }
  },

  async createAgent(
    name: string, icon: string, system_prompt: string,
    default_task?: string, model?: string, hooks?: string
  ): Promise<Agent> {
    try {
      return await apiCall<Agent>('create_agent', { name, icon, system_prompt, default_task, model, hooks });
    } catch (error) {
      console.error("Failed to create agent:", error);
      throw error;
    }
  },

  async updateAgent(
    id: number, name: string, icon: string, system_prompt: string,
    default_task?: string, model?: string, hooks?: string
  ): Promise<Agent> {
    try {
      return await apiCall<Agent>('update_agent', { id, name, icon, system_prompt, default_task, model, hooks });
    } catch (error) {
      console.error("Failed to update agent:", error);
      throw error;
    }
  },

  async deleteAgent(id: number): Promise<void> {
    try {
      return await apiCall('delete_agent', { id });
    } catch (error) {
      console.error("Failed to delete agent:", error);
      throw error;
    }
  },

  async getAgent(id: number): Promise<Agent> {
    try {
      return await apiCall<Agent>('get_agent', { id });
    } catch (error) {
      console.error("Failed to get agent:", error);
      throw error;
    }
  },

  async exportAgent(id: number): Promise<string> {
    try {
      return await apiCall<string>('export_agent', { id });
    } catch (error) {
      console.error("Failed to export agent:", error);
      throw error;
    }
  },

  async importAgent(jsonData: string): Promise<Agent> {
    try {
      return await apiCall<Agent>('import_agent', { jsonData });
    } catch (error) {
      console.error("Failed to import agent:", error);
      throw error;
    }
  },

  async importAgentFromFile(filePath: string): Promise<Agent> {
    try {
      return await apiCall<Agent>('import_agent_from_file', { filePath });
    } catch (error) {
      console.error("Failed to import agent from file:", error);
      throw error;
    }
  },

  async executeAgent(agentId: number, projectPath: string, task: string, model?: string): Promise<number> {
    try {
      return await apiCall<number>('execute_agent', { agentId, projectPath, task, model });
    } catch (error) {
      console.error("Failed to execute agent:", error);
      throw new Error(`Failed to execute agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async listAgentRuns(agentId?: number): Promise<AgentRunWithMetrics[]> {
    try {
      return await apiCall<AgentRunWithMetrics[]>('list_agent_runs', { agentId });
    } catch (error) {
      console.error("Failed to list agent runs:", error);
      return [];
    }
  },

  async listAgentRunsWithMetrics(agentId?: number): Promise<AgentRunWithMetrics[]> {
    try {
      return await apiCall<AgentRunWithMetrics[]>('list_agent_runs_with_metrics', { agentId });
    } catch (error) {
      console.error("Failed to list agent runs with metrics:", error);
      return [];
    }
  },

  async getAgentRun(id: number): Promise<AgentRunWithMetrics> {
    try {
      return await apiCall<AgentRunWithMetrics>('get_agent_run', { id });
    } catch (error) {
      console.error("Failed to get agent run:", error);
      throw new Error(`Failed to get agent run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getAgentRunWithRealTimeMetrics(id: number): Promise<AgentRunWithMetrics> {
    try {
      return await apiCall<AgentRunWithMetrics>('get_agent_run_with_real_time_metrics', { id });
    } catch (error) {
      console.error("Failed to get agent run with real-time metrics:", error);
      throw new Error(`Failed to get agent run with real-time metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async listRunningAgentSessions(): Promise<AgentRun[]> {
    try {
      return await apiCall<AgentRun[]>('list_running_sessions');
    } catch (error) {
      console.error("Failed to list running agent sessions:", error);
      throw new Error(`Failed to list running agent sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async killAgentSession(runId: number): Promise<boolean> {
    try {
      return await apiCall<boolean>('kill_agent_session', { runId });
    } catch (error) {
      console.error("Failed to kill agent session:", error);
      throw new Error(`Failed to kill agent session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getSessionStatus(runId: number): Promise<string | null> {
    try {
      return await apiCall<string | null>('get_session_status', { runId });
    } catch (error) {
      console.error("Failed to get session status:", error);
      throw new Error(`Failed to get session status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async cleanupFinishedProcesses(): Promise<number[]> {
    try {
      return await apiCall<number[]>('cleanup_finished_processes');
    } catch (error) {
      console.error("Failed to cleanup finished processes:", error);
      throw new Error(`Failed to cleanup finished processes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getSessionOutput(runId: number): Promise<string> {
    try {
      return await apiCall<string>('get_session_output', { runId });
    } catch (error) {
      console.error("Failed to get session output:", error);
      throw new Error(`Failed to get session output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getLiveSessionOutput(runId: number): Promise<string> {
    try {
      return await apiCall<string>('get_live_session_output', { runId });
    } catch (error) {
      console.error("Failed to get live session output:", error);
      throw new Error(`Failed to get live session output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async streamSessionOutput(runId: number): Promise<void> {
    try {
      return await apiCall<void>('stream_session_output', { runId });
    } catch (error) {
      console.error("Failed to start streaming session output:", error);
      throw new Error(`Failed to start streaming session output: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async loadSessionHistory(sessionId: string, projectId: string): Promise<any[]> {
    return apiCall("load_session_history", { sessionId, projectId });
  },

  async loadAgentSessionHistory(sessionId: string): Promise<any[]> {
    try {
      return await apiCall<any[]>('load_agent_session_history', { sessionId });
    } catch (error) {
      console.error("Failed to load agent session history:", error);
      throw error;
    }
  },

  async listDirectoryContents(directoryPath: string): Promise<FileEntry[]> {
    return apiCall("list_directory_contents", { directoryPath });
  },

  async searchFiles(basePath: string, query: string): Promise<FileEntry[]> {
    return apiCall("search_files", { basePath, query });
  },

  async getUsageStats(): Promise<UsageStats> {
    try {
      return await apiCall<UsageStats>("get_usage_stats");
    } catch (error) {
      console.error("Failed to get usage stats:", error);
      throw error;
    }
  },

  async getUsageByDateRange(startDate: string, endDate: string): Promise<UsageStats> {
    try {
      return await apiCall<UsageStats>("get_usage_by_date_range", { startDate, endDate });
    } catch (error) {
      console.error("Failed to get usage by date range:", error);
      throw error;
    }
  },

  async getSessionStats(since?: string, until?: string, order?: "asc" | "desc"): Promise<ProjectUsage[]> {
    try {
      return await apiCall<ProjectUsage[]>("get_session_stats", { since, until, order });
    } catch (error) {
      console.error("Failed to get session stats:", error);
      throw error;
    }
  },

  async getUsageDetails(limit?: number): Promise<UsageEntry[]> {
    try {
      return await apiCall<UsageEntry[]>("get_usage_details", { limit });
    } catch (error) {
      console.error("Failed to get usage details:", error);
      throw error;
    }
  },

  async getClaudeBinaryPath(): Promise<string | null> {
    try {
      return await apiCall<string | null>("get_claude_binary_path");
    } catch (error) {
      console.error("Failed to get Claude binary path:", error);
      throw error;
    }
  },

  async setClaudeBinaryPath(path: string): Promise<void> {
    try {
      return await apiCall<void>("set_claude_binary_path", { path });
    } catch (error) {
      console.error("Failed to set Claude binary path:", error);
      throw error;
    }
  },

  async listClaudeInstallations(): Promise<ClaudeInstallation[]> {
    try {
      return await apiCall<ClaudeInstallation[]>("list_claude_installations");
    } catch (error) {
      console.error("Failed to list Claude installations:", error);
      throw error;
    }
  },
};
