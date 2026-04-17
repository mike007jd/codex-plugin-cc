# Changelog

## Unreleased

- `/codex:rescue` and `/codex:execute` now default to running the forwarding subagent in the background when neither `--background` nor `--wait` is given. This stops the Claude Code UI from sitting on "Initializing…" for the whole Codex turn when the subagent's only Bash call is blocking on Codex.
- The `codex:codex-rescue` and `codex:codex-execute` subagents no longer carry their own stale `prefer foreground/background` heuristic. They now always invoke `codex-companion task` without `--background`, so the full Codex output returns as the subagent's final message. Background vs foreground is decided once at the `/codex:*` command layer.

## 1.0.0

- Initial version of the Codex plugin for Claude Code
