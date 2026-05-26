import { apiCall } from './apiAdapter';
import type {
  MCPServer, MCPProjectConfig, ServerStatus,
  AddServerResult, ImportResult,
} from './api.types';

export const mcpMethods = {
  async mcpAdd(
    name: string,
    transport: string,
    command?: string,
    args: string[] = [],
    env: Record<string, string> = {},
    url?: string,
    scope: string = "local"
  ): Promise<AddServerResult> {
    try {
      return await apiCall<AddServerResult>("mcp_add", { name, transport, command, args, env, url, scope });
    } catch (error) {
      console.error("Failed to add MCP server:", error);
      throw error;
    }
  },

  async mcpList(): Promise<MCPServer[]> {
    try {
      return await apiCall<MCPServer[]>("mcp_list");
    } catch (error) {
      console.error("API: Failed to list MCP servers:", error);
      throw error;
    }
  },

  async mcpGet(name: string): Promise<MCPServer> {
    try {
      return await apiCall<MCPServer>("mcp_get", { name });
    } catch (error) {
      console.error("Failed to get MCP server:", error);
      throw error;
    }
  },

  async mcpRemove(name: string): Promise<string> {
    try {
      return await apiCall<string>("mcp_remove", { name });
    } catch (error) {
      console.error("Failed to remove MCP server:", error);
      throw error;
    }
  },

  async mcpAddJson(name: string, jsonConfig: string, scope: string = "local"): Promise<AddServerResult> {
    try {
      return await apiCall<AddServerResult>("mcp_add_json", { name, jsonConfig, scope });
    } catch (error) {
      console.error("Failed to add MCP server from JSON:", error);
      throw error;
    }
  },

  async mcpAddFromClaudeDesktop(scope: string = "local"): Promise<ImportResult> {
    try {
      return await apiCall<ImportResult>("mcp_add_from_claude_desktop", { scope });
    } catch (error) {
      console.error("Failed to import from Claude Desktop:", error);
      throw error;
    }
  },

  async mcpServe(): Promise<string> {
    try {
      return await apiCall<string>("mcp_serve");
    } catch (error) {
      console.error("Failed to start MCP server:", error);
      throw error;
    }
  },

  async mcpTestConnection(name: string): Promise<string> {
    try {
      return await apiCall<string>("mcp_test_connection", { name });
    } catch (error) {
      console.error("Failed to test MCP connection:", error);
      throw error;
    }
  },

  async mcpResetProjectChoices(): Promise<string> {
    try {
      return await apiCall<string>("mcp_reset_project_choices");
    } catch (error) {
      console.error("Failed to reset project choices:", error);
      throw error;
    }
  },

  async mcpGetServerStatus(): Promise<Record<string, ServerStatus>> {
    try {
      return await apiCall<Record<string, ServerStatus>>("mcp_get_server_status");
    } catch (error) {
      console.error("Failed to get server status:", error);
      throw error;
    }
  },

  async mcpReadProjectConfig(projectPath: string): Promise<MCPProjectConfig> {
    try {
      return await apiCall<MCPProjectConfig>("mcp_read_project_config", { projectPath });
    } catch (error) {
      console.error("Failed to read project MCP config:", error);
      throw error;
    }
  },

  async mcpSaveProjectConfig(projectPath: string, config: MCPProjectConfig): Promise<string> {
    try {
      return await apiCall<string>("mcp_save_project_config", { projectPath, config });
    } catch (error) {
      console.error("Failed to save project MCP config:", error);
      throw error;
    }
  },
};
