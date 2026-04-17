# Changelog

## Unreleased

- `/codex:rescue` and `/codex:execute` now default to running the forwarding subagent in the background when neither `--background` nor `--wait` is given. This stops the Claude Code UI from sitting on "Initializing…" for the whole Codex turn when the subagent's only Bash call is blocking on Codex.

## 1.0.0

- Initial version of the Codex plugin for Claude Code
