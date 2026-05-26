import { apiCall } from './apiAdapter';
import type { HooksConfiguration } from '@/types/hooks';
import type {
  Checkpoint, CheckpointResult, CheckpointDiff, CheckpointStrategy,
  SessionTimeline, SlashCommand,
} from './api.types';

export const claudeMethods = {
  async executeClaudeCode(projectPath: string, prompt: string, model: string): Promise<void> {
    return apiCall("execute_claude_code", { projectPath, prompt, model });
  },

  async continueClaudeCode(projectPath: string, prompt: string, model: string): Promise<void> {
    return apiCall("continue_claude_code", { projectPath, prompt, model });
  },

  async resumeClaudeCode(projectPath: string, sessionId: string, prompt: string, model: string): Promise<void> {
    return apiCall("resume_claude_code", { projectPath, sessionId, prompt, model });
  },

  async cancelClaudeExecution(sessionId?: string): Promise<void> {
    return apiCall("cancel_claude_execution", { sessionId });
  },

  async listRunningClaudeSessions(): Promise<any[]> {
    return apiCall("list_running_claude_sessions");
  },

  async getClaudeSessionOutput(sessionId: string): Promise<string> {
    return apiCall("get_claude_session_output", { sessionId });
  },

  async createCheckpoint(
    sessionId: string, projectId: string, projectPath: string,
    messageIndex?: number, description?: string
  ): Promise<CheckpointResult> {
    return apiCall("create_checkpoint", { sessionId, projectId, projectPath, messageIndex, description });
  },

  async restoreCheckpoint(
    checkpointId: string, sessionId: string, projectId: string, projectPath: string
  ): Promise<CheckpointResult> {
    return apiCall("restore_checkpoint", { checkpointId, sessionId, projectId, projectPath });
  },

  async listCheckpoints(
    sessionId: string, projectId: string, projectPath: string
  ): Promise<Checkpoint[]> {
    return apiCall("list_checkpoints", { sessionId, projectId, projectPath });
  },

  async forkFromCheckpoint(
    checkpointId: string, sessionId: string, projectId: string,
    projectPath: string, newSessionId: string, description?: string
  ): Promise<CheckpointResult> {
    return apiCall("fork_from_checkpoint", { checkpointId, sessionId, projectId, projectPath, newSessionId, description });
  },

  async getSessionTimeline(
    sessionId: string, projectId: string, projectPath: string
  ): Promise<SessionTimeline> {
    return apiCall("get_session_timeline", { sessionId, projectId, projectPath });
  },

  async updateCheckpointSettings(
    sessionId: string, projectId: string, projectPath: string,
    autoCheckpointEnabled: boolean, checkpointStrategy: CheckpointStrategy
  ): Promise<void> {
    return apiCall("update_checkpoint_settings", { sessionId, projectId, projectPath, autoCheckpointEnabled, checkpointStrategy });
  },

  async getCheckpointDiff(
    fromCheckpointId: string, toCheckpointId: string, sessionId: string, projectId: string
  ): Promise<CheckpointDiff> {
    try {
      return await apiCall<CheckpointDiff>("get_checkpoint_diff", { fromCheckpointId, toCheckpointId, sessionId, projectId });
    } catch (error) {
      console.error("Failed to get checkpoint diff:", error);
      throw error;
    }
  },

  async trackCheckpointMessage(
    sessionId: string, projectId: string, projectPath: string, message: string
  ): Promise<void> {
    try {
      await apiCall("track_checkpoint_message", { sessionId, projectId, projectPath, message });
    } catch (error) {
      console.error("Failed to track checkpoint message:", error);
      throw error;
    }
  },

  async checkAutoCheckpoint(
    sessionId: string, projectId: string, projectPath: string, message: string
  ): Promise<boolean> {
    try {
      return await apiCall<boolean>("check_auto_checkpoint", { sessionId, projectId, projectPath, message });
    } catch (error) {
      console.error("Failed to check auto checkpoint:", error);
      throw error;
    }
  },

  async cleanupOldCheckpoints(
    sessionId: string, projectId: string, projectPath: string, keepCount: number
  ): Promise<number> {
    try {
      return await apiCall<number>("cleanup_old_checkpoints", { sessionId, projectId, projectPath, keepCount });
    } catch (error) {
      console.error("Failed to cleanup old checkpoints:", error);
      throw error;
    }
  },

  async getCheckpointSettings(
    sessionId: string, projectId: string, projectPath: string
  ): Promise<{
    auto_checkpoint_enabled: boolean;
    checkpoint_strategy: CheckpointStrategy;
    total_checkpoints: number;
    current_checkpoint_id?: string;
  }> {
    try {
      return await apiCall("get_checkpoint_settings", { sessionId, projectId, projectPath });
    } catch (error) {
      console.error("Failed to get checkpoint settings:", error);
      throw error;
    }
  },

  async clearCheckpointManager(sessionId: string): Promise<void> {
    try {
      await apiCall("clear_checkpoint_manager", { sessionId });
    } catch (error) {
      console.error("Failed to clear checkpoint manager:", error);
      throw error;
    }
  },

  trackSessionMessages(
    sessionId: string, projectId: string, projectPath: string, messages: string[]
  ): Promise<void> {
    return apiCall("track_session_messages", { sessionId, projectId, projectPath, messages });
  },

  async storageListTables(): Promise<any[]> {
    try {
      return await apiCall<any[]>("storage_list_tables");
    } catch (error) {
      console.error("Failed to list tables:", error);
      throw error;
    }
  },

  async storageReadTable(tableName: string, page: number, pageSize: number, searchQuery?: string): Promise<any> {
    try {
      return await apiCall<any>("storage_read_table", { tableName, page, pageSize, searchQuery });
    } catch (error) {
      console.error("Failed to read table:", error);
      throw error;
    }
  },

  async storageUpdateRow(
    tableName: string, primaryKeyValues: Record<string, any>, updates: Record<string, any>
  ): Promise<void> {
    try {
      return await apiCall<void>("storage_update_row", { tableName, primaryKeyValues, updates });
    } catch (error) {
      console.error("Failed to update row:", error);
      throw error;
    }
  },

  async storageDeleteRow(tableName: string, primaryKeyValues: Record<string, any>): Promise<void> {
    try {
      return await apiCall<void>("storage_delete_row", { tableName, primaryKeyValues });
    } catch (error) {
      console.error("Failed to delete row:", error);
      throw error;
    }
  },

  async storageInsertRow(tableName: string, values: Record<string, any>): Promise<number> {
    try {
      return await apiCall<number>("storage_insert_row", { tableName, values });
    } catch (error) {
      console.error("Failed to insert row:", error);
      throw error;
    }
  },

  async storageExecuteSql(query: string): Promise<any> {
    try {
      return await apiCall<any>("storage_execute_sql", { query });
    } catch (error) {
      console.error("Failed to execute SQL:", error);
      throw error;
    }
  },

  async storageResetDatabase(): Promise<void> {
    try {
      return await apiCall<void>("storage_reset_database");
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  },

  async getSetting(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const cached = window.localStorage.getItem(`app_setting:${key}`);
        if (cached !== null) return cached;
      }
      const result = await claudeMethods.storageReadTable('app_settings', 1, 1000);
      const setting = result?.data?.find((row: any) => row.key === key);
      return setting?.value || null;
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  },

  async saveSetting(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        try { window.localStorage.setItem(`app_setting:${key}`, value); } catch (_ignore) {}
      }
      try {
        await claudeMethods.storageUpdateRow('app_settings', { key }, { value });
      } catch (_updateError) {
        await claudeMethods.storageInsertRow('app_settings', { key, value });
      }
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      throw error;
    }
  },

  async getHooksConfig(scope: 'user' | 'project' | 'local', projectPath?: string): Promise<HooksConfiguration> {
    try {
      return await apiCall<HooksConfiguration>("get_hooks_config", { scope, projectPath });
    } catch (error) {
      console.error("Failed to get hooks config:", error);
      throw error;
    }
  },

  async updateHooksConfig(
    scope: 'user' | 'project' | 'local', hooks: HooksConfiguration, projectPath?: string
  ): Promise<string> {
    try {
      return await apiCall<string>("update_hooks_config", { scope, projectPath, hooks });
    } catch (error) {
      console.error("Failed to update hooks config:", error);
      throw error;
    }
  },

  async validateHookCommand(command: string): Promise<{ valid: boolean; message: string }> {
    try {
      return await apiCall<{ valid: boolean; message: string }>("validate_hook_command", { command });
    } catch (error) {
      console.error("Failed to validate hook command:", error);
      throw error;
    }
  },

  async getMergedHooksConfig(projectPath: string): Promise<HooksConfiguration> {
    try {
      const [userHooks, projectHooks, localHooks] = await Promise.all([
        claudeMethods.getHooksConfig('user'),
        claudeMethods.getHooksConfig('project', projectPath),
        claudeMethods.getHooksConfig('local', projectPath),
      ]);
      const { HooksManager } = await import('@/lib/hooksManager');
      return HooksManager.mergeConfigs(userHooks, projectHooks, localHooks);
    } catch (error) {
      console.error("Failed to get merged hooks config:", error);
      throw error;
    }
  },

  async slashCommandsList(projectPath?: string): Promise<SlashCommand[]> {
    try {
      return await apiCall<SlashCommand[]>("slash_commands_list", { projectPath });
    } catch (error) {
      console.error("Failed to list slash commands:", error);
      throw error;
    }
  },

  async slashCommandGet(commandId: string): Promise<SlashCommand> {
    try {
      return await apiCall<SlashCommand>("slash_command_get", { commandId });
    } catch (error) {
      console.error("Failed to get slash command:", error);
      throw error;
    }
  },

  async slashCommandSave(
    scope: string, name: string, namespace: string | undefined, content: string,
    description: string | undefined, allowedTools: string[], projectPath?: string
  ): Promise<SlashCommand> {
    try {
      return await apiCall<SlashCommand>("slash_command_save", { scope, name, namespace, content, description, allowedTools, projectPath });
    } catch (error) {
      console.error("Failed to save slash command:", error);
      throw error;
    }
  },

  async slashCommandDelete(commandId: string, projectPath?: string): Promise<string> {
    try {
      return await apiCall<string>("slash_command_delete", { commandId, projectPath });
    } catch (error) {
      console.error("Failed to delete slash command:", error);
      throw error;
    }
  },
};
