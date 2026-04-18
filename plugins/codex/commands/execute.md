---
description: Launch a fresh Codex implementation run through the shared companion runtime
argument-hint: "[--background|--wait] [--resume|--fresh] [--model <model|spark>] [--effort <none|minimal|low|medium|high|xhigh>] [what Codex should implement or run]"
disable-model-invocation: true
allowed-tools: Bash(node:*), AskUserQuestion
---

Run a Codex task through the shared companion runtime.
The final user-visible response must be Codex's output verbatim.

Raw slash-command arguments:
`$ARGUMENTS`

Core constraint:
- Do not route `/codex:execute` through the `codex:codex-execute` subagent.
- This command must call `node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task ...` directly so it cannot get stuck at Skill initialization before a Codex job is even created.
- Your only job is to launch the direct `task` command and return that command's stdout as-is.

Execution mode:
- If the raw arguments include `--wait`, do not ask. Run the direct `task` command in the foreground.
- If the raw arguments include `--background`, do not ask. Run the direct `task` command with `--background`.
- If neither flag is present, default to background by adding `--background` to the direct `task` invocation.
- `--background` and `--wait` are runtime-selection flags for the direct `task` invocation. Do not treat them as part of the natural-language task text.
- `--model` and `--effort` are runtime-selection flags. Preserve them for the direct `task` call, but do not treat them as part of the natural-language task text.
- Leave `--effort` unset unless the user explicitly asks for a specific reasoning effort.
- If they ask for `spark`, map it to `gpt-5.3-codex-spark`.
- If the request includes `--resume`, do not ask whether to continue. The user already chose.
- If the request includes `--fresh`, do not ask whether to continue. The user already chose.
- Otherwise, before starting Codex, check for a resumable Codex thread from this Claude session by running:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task-resume-candidate --json
```

- If that helper reports `available: true`, use `AskUserQuestion` exactly once to ask whether to continue the current Codex thread or start a new one.
- The two choices must be:
  - `Continue current Codex thread`
  - `Start a new Codex thread`
- If the user is clearly giving a follow-up instruction such as "continue", "keep going", "resume", "apply the top fix", or "dig deeper", put `Continue current Codex thread (Recommended)` first.
- Otherwise put `Start a new Codex thread (Recommended)` first.
- If the user chooses continue, add `--resume` before launching the direct `task` command.
- If the user chooses a new thread, add `--fresh` before launching the direct `task` command.
- If the helper reports `available: false`, do not ask. Launch normally.

Launch rules:
- Always add `--write`.
- For background mode, call the companion directly with `task --background --write ...` in the current turn so the queued `job_id` comes back immediately.
- For foreground mode, call the companion directly with `task --write ...` and let the command stream until Codex finishes.
- Do not use `Bash(..., run_in_background: true)` for `/codex:execute`. The companion runtime is what owns the tracked job and returns the stable `job_id`.
- Return the Codex companion stdout verbatim to the user.
- Do not paraphrase, summarize, rewrite, or add commentary before or after it.
- If the helper reports that Codex is missing or unauthenticated, stop and tell the user to run `/codex:setup`.
- If the user did not supply a request, ask what Codex should implement or run.
