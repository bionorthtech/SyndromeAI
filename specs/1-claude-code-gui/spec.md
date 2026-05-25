# Feature Specification: Claude Code GUI Desktop Application

**Branch**: `1-claude-code-gui`
**Short Name**: `claude-code-gui`
**Created**: 2026-05-22
**Status**: Draft

---

## Overview

A desktop GUI application for Claude Code that provides a visual command center for managing projects, sessions, analytics, and model configuration — based on the open-source opcode project (Tauri 2 + React + Rust), extended with model switching and LM Studio local model support.

## Problem Statement

Claude Code is a powerful CLI tool, but it lacks a visual interface for:
- Browsing and resuming past sessions
- Tracking API costs and token usage across projects
- Editing CLAUDE.md files with live preview
- Switching between cloud models and local LM Studio models without memorizing CLI flags

Users must context-switch between terminal, file explorer, and manual cost tracking, which slows down development workflows.

## Goals

- Provide a native Linux desktop app that wraps Claude Code's capabilities in an intuitive GUI
- Reduce friction for session management, cost awareness, and CLAUDE.md editing
- Enable seamless switching between Anthropic cloud models and local LM Studio models

## Non-Goals

- Replacing the Claude Code CLI (the GUI is a companion, not a replacement)
- Supporting Windows or macOS in v1 (Linux only)
- Implementing chat/conversation UI (that's opcode's existing scope; we extend it)
- Remote/cloud sync of session data

---

## User Personas

**Primary**: Developer who uses Claude Code daily and wants visual oversight of their sessions and costs.

**Secondary**: Developer experimenting with local LLMs (LM Studio) who wants to switch between cloud and local models without editing config files manually.

---

## User Scenarios & Testing

### Scenario 1: Browse and Resume a Session
1. User opens the app
2. App displays a list of projects from `~/.claude/projects/`
3. User selects a project and sees its session history with timestamps and opening messages
4. User clicks "Resume" on a session — the app launches Claude Code in a terminal with the correct session ID
5. **Pass criteria**: Session resumes in < 3 seconds; correct session is loaded

### Scenario 2: View Analytics Dashboard
1. User navigates to the Analytics tab
2. App shows total cost, token usage broken down by model and project, and a trend chart
3. User can filter by date range (today / 7 days / 30 days / all time)
4. **Pass criteria**: Data loads in < 2 seconds; numbers match `~/.claude/` JSONL usage logs

### Scenario 3: Edit CLAUDE.md
1. User selects a project and clicks "Edit CLAUDE.md"
2. A split-pane editor opens: markdown source on left, live rendered preview on right
3. User saves — file is written to the correct project directory
4. **Pass criteria**: Save persists across app restarts; preview updates within 300ms of typing

### Scenario 4: Switch Models
1. User opens the Model Switcher panel
2. App lists available Anthropic cloud models (claude-opus-4, claude-sonnet-4, etc.)
3. User can toggle "Local (LM Studio)" to switch to a local OpenAI-compatible endpoint
4. When local is selected, user enters the base URL and model name
5. App generates the correct `claude --model` flag or updates the Claude Code config
6. **Pass criteria**: Model switch takes effect on the next Claude Code invocation; config persists across restarts

---

## Functional Requirements

### FR-1: Project & Session Browser
- **FR-1.1** App reads projects from `~/.claude/projects/` on startup and on manual refresh
- **FR-1.2** Each project shows: name, last-used timestamp, session count
- **FR-1.3** Expanding a project shows sessions sorted by most recent first, with opening message preview (first 120 chars)
- **FR-1.4** "Resume" action launches Claude Code with `claude --resume <session-id>` in a new terminal
- **FR-1.5** Search bar filters projects and sessions by name/content in real time

### FR-2: Analytics Dashboard
- **FR-2.1** Reads usage data from `~/.claude/` JSONL log files
- **FR-2.2** Displays total cost (USD), total input tokens, total output tokens
- **FR-2.3** Breaks down cost and tokens by project and by model
- **FR-2.4** Shows a line chart of daily cost over time
- **FR-2.5** Supports date range filter: today / 7 days / 30 days / all time
- **FR-2.6** Export to CSV (cost + token data per project)

### FR-3: CLAUDE.md Editor
- **FR-3.1** Discovers all CLAUDE.md files in the selected project directory and subdirectories
- **FR-3.2** Opens selected file in a split-pane editor (source | preview)
- **FR-3.3** Preview renders GitHub-flavored markdown
- **FR-3.4** Auto-save on focus-loss (configurable, default on)
- **FR-3.5** Shows unsaved changes indicator in the file tab
- **FR-3.6** Global `~/.claude/CLAUDE.md` is always accessible as a pinned entry

### FR-4: Model Switcher
- **FR-4.1** Lists current Anthropic models (hardcoded list, updated with app releases): claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5
- **FR-4.2** "Local (LM Studio)" toggle with fields: base URL (default `http://localhost:1234/v1`) and model name
- **FR-4.3** Saves selection to `~/.claude/settings.json` under the `model` key
- **FR-4.4** "Test connection" button for local endpoint — sends a lightweight ping and reports success/failure
- **FR-4.5** Active model displayed in app status bar at all times
- **FR-4.6** Quick-switch shortcut (e.g., Ctrl+M) to open the model panel from anywhere

### FR-5: App Shell
- **FR-5.1** Native Linux desktop app (Tauri 2, .deb and .AppImage distribution targets)
- **FR-5.2** Dark mode by default; respects system color scheme preference
- **FR-5.3** Sidebar navigation: Projects | Analytics | Settings
- **FR-5.4** Settings panel: auto-save toggle, refresh interval, default terminal emulator
- **FR-5.5** App tray icon (system tray) with quick-open action

---

## Success Criteria

| Criterion | Target |
|-----------|--------|
| Session resume launch time | < 3 seconds from click to terminal open |
| Analytics data load time | < 2 seconds for 30-day dataset |
| CLAUDE.md preview update latency | < 300ms after keystroke |
| Cold app startup time | < 2 seconds on Linux |
| Model switch config persistence | Survives app restart 100% of the time |
| Session browser accuracy | 100% match to actual `~/.claude/projects/` state |
| Build size | < 50MB for AppImage |

---

## Key Entities

| Entity | Description |
|--------|-------------|
| `Project` | A directory tracked in `~/.claude/projects/`, with metadata (name, path, sessions) |
| `Session` | A Claude Code session within a project (ID, timestamp, opening message, cost data) |
| `UsageRecord` | A line from the JSONL usage log (tokens, model, cost, timestamp) |
| `ModelConfig` | User's selected model: cloud model name or local endpoint config |
| `ClaudeMdFile` | A CLAUDE.md file at a specific path within a project |

---

## Dependencies & Assumptions

- **opcode** is the base: we fork `github.com/winfunc/opcode` (AGPL-3.0) and extend it
- Claude Code CLI (`claude`) is installed at a discoverable path (PATH or user config)
- LM Studio local server exposes an OpenAI-compatible API at a configurable URL
- Usage logs are stored as JSONL files under `~/.claude/` (standard Claude Code behavior)
- Target OS: Linux (Ubuntu 20.04+ / Debian-based); no Windows or macOS in v1
- Build toolchain: Rust 1.70+, Bun (latest), Tauri 2 CLI

---

## Out of Scope (v1)

- Custom CC Agents management (opcode feature — kept as-is, not extended)
- MCP server management UI (opcode feature — kept as-is, not extended)
- Timeline/checkpoint system
- Multi-user or remote session management
- Windows / macOS support
