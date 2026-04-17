import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import { resolveStateDir } from "../plugins/codex/scripts/lib/state.mjs";
import { terminateProcessTree } from "../plugins/codex/scripts/lib/process.mjs";

const trackedTempDirs = new Set();
let cleanupHooked = false;

function killBrokersForDir(dir) {
  let stateDir;
  try {
    stateDir = resolveStateDir(dir);
  } catch {
    return;
  }
  const brokerJson = path.join(stateDir, "broker.json");
  if (fs.existsSync(brokerJson)) {
    let pid = null;
    let sessionDir = null;
    try {
      const data = JSON.parse(fs.readFileSync(brokerJson, "utf8"));
      pid = Number(data?.pid);
      sessionDir = typeof data?.sessionDir === "string" ? data.sessionDir : null;
    } catch {
      // Ignore — clean up whatever else we can.
    }
    if (Number.isFinite(pid) && pid > 0) {
      try {
        terminateProcessTree(pid);
      } catch {
        // Ignore — broker may already be gone.
      }
    }
    if (sessionDir && fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch {
        // Ignore — clean-up is best-effort.
      }
    }
  }
  if (fs.existsSync(stateDir)) {
    try {
      fs.rmSync(stateDir, { recursive: true, force: true });
    } catch {
      // Ignore — clean-up is best-effort.
    }
  }
}

function runCleanup() {
  for (const dir of trackedTempDirs) {
    killBrokersForDir(dir);
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore — clean-up is best-effort.
      }
    }
  }
  trackedTempDirs.clear();
}

function ensureCleanupHook() {
  if (cleanupHooked) {
    return;
  }
  cleanupHooked = true;
  process.once("exit", runCleanup);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.once(signal, () => {
      runCleanup();
      process.exit(128 + (signal === "SIGINT" ? 2 : signal === "SIGTERM" ? 15 : 1));
    });
  }
}

export function makeTempDir(prefix = "codex-plugin-test-") {
  ensureCleanupHook();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  trackedTempDirs.add(dir);
  return dir;
}

export function writeExecutable(filePath, source) {
  fs.writeFileSync(filePath, source, { encoding: "utf8", mode: 0o755 });
}

export function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    input: options.input,
    shell: process.platform === "win32" && !path.isAbsolute(command),
    windowsHide: true
  });
}

export function initGitRepo(cwd) {
  run("git", ["init", "-b", "main"], { cwd });
  run("git", ["config", "user.name", "Codex Plugin Tests"], { cwd });
  run("git", ["config", "user.email", "tests@example.com"], { cwd });
  run("git", ["config", "commit.gpgsign", "false"], { cwd });
  run("git", ["config", "tag.gpgsign", "false"], { cwd });
}
