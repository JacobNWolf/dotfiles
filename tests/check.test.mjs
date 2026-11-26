import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, lstatSync, symlinkSync, readlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === ".git") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function isolatedHome(t) {
  const home = mkdtempSync(join(tmpdir(), "dotfiles-test-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  return home;
}

function apply(home, ...args) {
  return spawnSync("bash", [join(root, "scripts/apply.sh"), ...args], {
    env: { ...process.env, HOME: home },
    encoding: "utf8",
  });
}

test("preview is read-only and apply preserves originals and local overrides", t => {
  const home = isolatedHome(t);
  writeFileSync(join(home, ".zshrc"), "original shell config\n");
  writeFileSync(join(home, ".zshrc.local"), "local-only configuration\n");
  const before = readdirSync(home);
  assert.equal(apply(home).status, 0);
  assert.deepEqual(readdirSync(home), before);
  assert.equal(readFileSync(join(home, ".zshrc"), "utf8"), "original shell config\n");

  const result = apply(home, "--apply");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(lstatSync(join(home, ".zshrc")).isSymbolicLink(), false);
  assert.equal(readFileSync(join(home, ".zshrc"), "utf8"), readFileSync(join(root, "home/.zshrc"), "utf8"));
  assert.equal(readFileSync(join(home, ".zshrc.local"), "utf8"), "local-only configuration\n");
  const backups = files(join(home, ".dotfiles-backups"));
  assert.equal(backups.length, 1);
  assert.equal(readFileSync(backups[0], "utf8"), "original shell config\n");
  assert.equal(apply(home, "--apply").status, 0);
  assert.deepEqual(files(join(home, ".dotfiles-backups")), backups);
});

test("a destination symlink is backed up without writing through it", t => {
  const home = isolatedHome(t);
  const external = join(home, "external");
  writeFileSync(external, "must remain untouched\n");
  symlinkSync(external, join(home, ".zshrc"));
  const result = apply(home, "--apply");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(external, "utf8"), "must remain untouched\n");
  const backup = files(join(home, ".dotfiles-backups")).find(path => path.endsWith("/.zshrc"));
  assert.equal(readlinkSync(backup), external);
  assert.equal(lstatSync(join(home, ".zshrc")).isSymbolicLink(), false);
});

test("preflight rejects redirected parents, directories, and backup paths before writing", t => {
  for (const conflict of ["parent", "directory", "backup"]) {
    const home = isolatedHome(t);
    writeFileSync(join(home, ".zshrc"), "original\n");
    const external = join(home, "external");
    mkdirSync(external);
    if (conflict === "parent") symlinkSync(external, join(home, ".config"));
    if (conflict === "directory") mkdirSync(join(home, ".gitconfig"));
    if (conflict === "backup") symlinkSync(external, join(home, ".dotfiles-backups"));
    const before = readdirSync(home).sort();
    assert.notEqual(apply(home, "--apply").status, 0, conflict);
    assert.deepEqual(readdirSync(home).sort(), before);
    assert.equal(readFileSync(join(home, ".zshrc"), "utf8"), "original\n");
    assert.deepEqual(readdirSync(external), []);
  }
});

test("invalid arguments never apply configuration", t => {
  const home = isolatedHome(t);
  assert.notEqual(apply(home, "--force").status, 0);
  assert.deepEqual(readdirSync(home), []);
  assert.notEqual(apply(home, "--apply", "unexpected").status, 0);
  assert.deepEqual(readdirSync(home), []);
  assert.notEqual(apply("/", "--apply").status, 0);
  assert.notEqual(apply("relative-home", "--apply").status, 0);
});

test("macOS preview never calls defaults; apply backs up only selected values", t => {
  const home = isolatedHome(t);
  const bin = join(home, "bin");
  mkdirSync(bin);
  const log = join(home, "defaults.log");
  writeFileSync(join(bin, "defaults"), '#!/bin/bash\nprintf "%s\\n" "$*" >> "$TEST_DEFAULTS_LOG"\nif [[ "$1" = read ]]; then echo old-value; fi\n', { mode: 0o755 });
  const run = args => spawnSync("bash", [join(root, "scripts/macos.sh"), ...args], {
    env: { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}`, TEST_DEFAULTS_LOG: log },
    encoding: "utf8",
  });
  assert.equal(run([]).status, 0);
  assert.equal(existsSync(log), false);
  const applied = run(["--apply"]);
  assert.equal(applied.status, 0, applied.stderr);
  const calls = readFileSync(log, "utf8").trim().split("\n");
  assert.equal(calls.filter(line => line.startsWith("read ")).length, 15);
  assert.equal(calls.filter(line => line.startsWith("write ")).length, 15);
  const backup = files(join(home, ".dotfiles-backups")).filter(path => !path.endsWith(".status"));
  assert.equal(backup.length, 15);
  assert.ok(backup.every(path => readFileSync(path, "utf8") === "old-value\n"));
});

test("version and consent guardrails survive future edits", () => {
  const runtimeConfig = readFileSync(join(root, "home/.config/mise/config.toml"), "utf8");
  assert.match(runtimeConfig, /"npm:@opencode\/cli"\s*=\s*\{\s*version\s*=\s*"2\.4\.1",\s*allow_builds\s*=\s*\["@opencode\/cli"\]\s*\}/);
  assert.ok(!runtimeConfig.includes("npm:opencode-ai"));
  const taskConfig = readFileSync(join(root, "mise.toml"), "utf8");
  assert.match(taskConfig, /run_auto_install\s*=\s*false/);
  const agents = JSON.parse(readFileSync(join(root, "home/.agents/agents.json"), "utf8"));
  assert.ok(Object.values(agents.mcp.servers).every(server => server.enabled === false));
  const opencode = JSON.parse(readFileSync(join(root, "home/.config/opencode/opencode.json"), "utf8"));
  assert.deepEqual(opencode.mcp, { servers: {} });
});

test("agents global sync preserves v2 settings and converges in an isolated home", {
  skip: spawnSync("agents", ["--version"], { encoding: "utf8" }).status !== 0,
}, t => {
  const home = isolatedHome(t);
  cpSync(join(root, "home"), home, { recursive: true });
  const manifestPath = join(home, ".agents/agents.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.mcp.servers.browse.enabled = true;
  writeFileSync(manifestPath, JSON.stringify(manifest));
  for (const args of [["sync", "--global"], ["sync", "--global", "--check"]]) {
    const result = spawnSync("agents", ["--no-update-check", ...args], {
      cwd: home,
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config") },
      encoding: "utf8",
      timeout: 15000,
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  }
  const config = JSON.parse(readFileSync(join(home, ".config/opencode/opencode.json"), "utf8"));
  assert.deepEqual(config.mcp.servers.browse.command, ["browse", "mcp"]);
  assert.ok(config.plugins.includes("@open-pets/opencode@4.1.0"));
  const source = JSON.parse(readFileSync(join(root, "home/.agents/agents.json"), "utf8"));
  assert.equal(source.mcp.servers.browse.enabled, false);
});

test("tracked candidates are text, portable, parseable, and free of common credential patterns", () => {
  for (const path of files(root)) {
    const text = readFileSync(path, "utf8");
    assert.ok(!text.includes("\0"), `binary file: ${path}`);
    assert.ok(text.endsWith("\n"), `missing final newline: ${path}`);
    assert.ok(!/[ \t]+$/m.test(text), `trailing whitespace: ${path}`);
    assert.ok(!/\/Users\/[A-Za-z0-9_.-]+\//.test(text), `machine-specific path: ${path}`);
    assert.ok(!/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16})\b/.test(text), `credential-shaped value: ${path}`);
    assert.ok(!/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/.test(text), `private key: ${path}`);
    if (path.endsWith(".json")) JSON.parse(text);
    if (path.endsWith(".sh")) {
      const result = spawnSync("bash", ["-n", path], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    }
  }
  for (const path of files(join(root, "home"))) {
    assert.ok(!lstatSync(path).isSymbolicLink(), path);
    assert.ok(!/\/(?:local\.json|auth\.json|service\.json)$/.test(path), `private state: ${path}`);
  }
});
