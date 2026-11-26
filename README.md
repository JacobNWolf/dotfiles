# dotfiles

**My Apple Silicon Mac, rebuilt with mise and Homebrew.**

An opinionated workstation for JavaScript/TypeScript, Ruby/Rails, Go, and Rust—plus the apps I use every day. Zed for editing, Warp for the terminal, OpenCode for agent workflows. No extra dotfile manager.

[What's inside](#whats-inside) · [Install](#install) · [Commands](#commands) · [Customize](#customize) · [Finish setup](#finish-setup) · [Safety](#safety-and-recovery) · [Inspiration](#inspiration)

## What's inside

| Layer | Tools and preferences | Source |
| --- | --- | --- |
| Shell | zsh, Oh My Zsh (`robbyrussell`), Git/Rails/Ruby/pnpm plugins, mise and OrbStack integration | [Shell files](home/) |
| Runtimes | Pinned Node, pnpm, Bun, Ruby, Go, and Rust | [mise config](home/.config/mise/config.toml) |
| Editor | Zed, Cursor-style keys, temporary zoom shortcuts, themes, extensions, formatters, and semantic highlighting | [Zed config](home/.config/zed/) |
| Terminal | Warp fonts, theme, vertical tabs, notifications, input, and command-approval settings | [Warp config](home/.warp/) |
| Git | delta, LFS, pruning, automatic upstream setup, and a private identity include | [Git config](home/.gitconfig) |
| Coding agents | OpenCode v2, shared instructions, plugins, Browse, and the Executor v2 beta CLI | [Agent manifest](home/.agents/agents.json) · [OpenCode config](home/.config/opencode/) |
| Development | Graphite CLI, GitHub CLI, search tools, Rails libraries, PostgreSQL 17, Redis, OrbStack, T3 Code, Beekeeper Studio, Insomnia | [Brewfile](Brewfile) |
| Everyday apps | Chrome, Superhuman, Discord, 1Password, Raycast, Tailscale, desktop utilities, Pocket Casts, and Elgato/Logitech apps | [Brewfile](Brewfile) |
| Optional extras | App Store purchases and a small set of captured macOS preferences | [App Store list](Brewfile.app-store) · [Preferences](scripts/macos.sh) |

### A few deliberate choices

- **mise is the front door.** It manages runtimes and named tasks; Homebrew handles Mac apps and native dependencies.
- **Copies, not symlinks.** Apps can add credentials or connection details to live config without writing them back into this repo.
- **Public preferences, private state.** Identity, work settings, secrets, sessions, databases, and device-specific state stay outside Git.
- **Preview before replacement.** Config installation has a preview, conflict checks, and backups. macOS preferences are a separate opt-in step.

This is a personal setup, not a universal Mac configuration or a byte-for-byte machine image. Homebrew supplies available package versions; mise version requests are pinned. Upstream releases can still change or disappear.

## Install

> [!CAUTION]
> Read the [Brewfile](Brewfile), [managed files](home/), and [setup script](scripts/bootstrap.sh) before running anything. Applying config **replaces whole files**, not individual settings. Close Zed and Warp first so they cannot overwrite config on exit. Check your employer's software policy before using this on a managed Mac.

### 1. Prepare the Mac

Use a native **Apple Silicon macOS** shell, not Rosetta. Intel Macs, Linux, and Windows are not supported by bootstrap.

Install Apple's developer tools, and wait for installation to finish:

```sh
xcode-select --install
```

Install [Homebrew](https://brew.sh) using its official instructions, then:

```sh
eval "$(/opt/homebrew/bin/brew shellenv)"
brew install mise
```

### 2. Review and bootstrap

```sh
git clone https://github.com/JacobNWolf/dotfiles.git "$HOME/dotfiles"
cd "$HOME/dotfiles"

mise trust
mise run plan
mise run bootstrap
mise run check
```

Only trust the checkout after reviewing it: mise tasks execute code.

Bootstrap asks you to type `setup`, then:

1. Installs the curated Brewfile without requesting upgrades to existing packages.
2. Clones Oh My Zsh if it is absent.
3. Copies managed config into your home, backing up replaced files.
4. Installs pinned mise tools and syncs the agent configuration.

It does **not** install Homebrew, sign into accounts, restore databases, start PostgreSQL/Redis, apply macOS preferences, or approve privacy permissions. It never commits or pushes anything.

Open a new login shell afterward, then complete the [post-install checklist](#finish-setup). Node must be available before running `check`; task auto-installation is disabled so previews cannot unexpectedly install missing tools.

## Commands

Run these from the repository root. The task definitions live in [mise.toml](mise.toml).

| Command | Effect |
| --- | --- |
| `mise run plan` | Preview config filenames and create/replace statuses; no config writes |
| `mise run apply` | Install config copies and back up replaced files |
| `mise run bootstrap` | Confirm, then install packages, shell framework, config, and runtimes |
| `mise run packages` | Install the Brewfile without upgrades or removing unlisted packages |
| `mise run check` | Run local safety and configuration tests |
| `mise run macos` | Preview captured macOS preferences |
| `mise run macos:apply` | Back up previous preference values and apply them |
| `mise run agents:sync` | Sync the live, machine-local agent configuration |
| `mise run agents:check` | Check the live agent configuration for drift |
| `mise run skills` | Interactively install selected skills from the recorded public sources |

### Repository map

```text
.
├── Brewfile                 # Native tools and Mac apps
├── Brewfile.app-store       # Optional purchased apps
├── mise.toml                # Setup and maintenance tasks
├── home/                    # Safe source files, mirrored into $HOME
│   ├── .agents/             # Shared instructions and disabled MCP templates
│   ├── .config/             # Git ignores, mise, OpenCode, and Zed
│   ├── .warp/               # Terminal preferences and bindings
│   ├── .gitconfig
│   ├── .zshenv / .zprofile / .zshrc
│   └── AGENTS.md
├── examples/                # Templates for private, machine-local overrides
├── scripts/                 # Bootstrap, config installation, macOS preferences
├── tests/                   # Isolated-home regression checks
└── docs/                    # README research and source comparisons
```

## Customize

### Change the shared setup

Edit the source under `home/`, inspect your changes, then preview and apply:

```sh
git diff
mise run plan
mise run apply
mise run check
```

The preview shows **paths, not a content diff**: old config may contain secrets. Applying resets managed files to the repository versions, including live agent definitions. It is not a settings merge. Review any local changes before proceeding.

To keep something changed inside an app, port only that reviewed setting into the source. Do not bulk-copy live config back into Git.

For package changes, edit the [Brewfile](Brewfile), then run `mise run packages`. For runtime changes, update the [version requests](home/.config/mise/config.toml), apply them, then run `mise -C "$HOME" install`. Package installation intentionally does not upgrade existing Homebrew packages; review upgrades separately.

### Keep identity and work settings local

On a new machine, create your private Git identity file from the [example](examples/gitconfig.local.example), then replace its placeholder values:

```sh
cp examples/gitconfig.local.example ~/.gitconfig.local
chmod 600 ~/.gitconfig.local
```

If that file already exists, edit it rather than overwrite it. The Git config uses macOS Keychain; `gh auth login` and, optionally, `gh auth setup-git` configure GitHub access. Commit signing is a separate choice.

| Local file | Purpose |
| --- | --- |
| `~/.zshenv.local` | Small exports needed by non-interactive zsh too; [example](examples/zshenv.local.example) |
| `~/.zprofile.local` | Machine-specific login initialization |
| `~/.zshrc.local` | Interactive customizations and work aliases; [example](examples/zshrc.local.example) |
| `~/.gitconfig.local` | Identity and conditional work includes |
| `~/.agents/local.json` | Agent secrets/overrides, managed by agents CLI |

Each shell hook loads at the end of its corresponding startup file; the local Git include follows the shared settings. The examples are not installed automatically. These hooks do not imply that arbitrary app settings support overlays.

Keep secret-bearing local files owner-only (`chmod 600`). Prefer 1Password or native OAuth/SSO over plaintext API keys. Work projects can have their own `mise.toml`, `.agents/`, and directory-scoped Git identity.

Work account/profile aliases, Kubernetes configuration, cloud credentials, trust exceptions, and employer instructions were **not exported**. Recreate them from approved sources. No Okta, Iru/Kandji, device-enrollment profile, or work VPN state is installed.

## Finish setup

- [ ] Set your private Git identity and authenticate GitHub.
- [ ] Sign into apps and restore licenses through their supported workflows.
- [ ] Install any purchased or vendor-only apps you want.
- [ ] Pair and enable only the agent integrations you intend to use.
- [ ] Review optional macOS preferences.
- [ ] Start local data services only if needed.

<details>
<summary><strong>Agent integrations and skills</strong></summary>

All MCP entries start **disabled**. Installing a tool is not consent to browser or desktop access.

| Integration | What remains manual |
| --- | --- |
| OpenCode | Authenticate providers in its UI; verify provider access and Zed's retained model choices |
| Browse | Install the [official browser extension and pair it](https://github.com/anomalyco/browse); the CLI is installed by mise |
| Executor | Install the v2 beta desktop app from your trusted channel, create a new MCP connection, and configure `EXECUTOR_MCP_URL` locally |
| Cua Driver | Installed into `~/.local/bin` by bootstrap (from [trycua/cua](https://github.com/trycua/cua)); approve Accessibility/Screen Recording yourself |
| OpenPets | Install and launch the [Apple Silicon desktop release](https://github.com/OpenPetsHQ/openpets/releases/latest); its stdio server uses the pinned npm package |
| T3 Code | Choose/authenticate a backend and install its Codex or Claude CLI if required |

Enable completed integrations in the **live** `~/.agents/agents.json`, export any required local variables in the syncing shell, and run:

```sh
agents sync --global
agents sync --global --check
agents mcp test --global --runtime
```

Use a shell with mise activated. Reapplying the repository templates resets those managed definitions; do not copy private connection URLs into this repo to preserve them.

Important version boundaries:

- OpenCode v2 uses **`@opencode/cli`**, not the v1 `opencode-ai` package. Its config uses `mcp.servers`.
- The standard Executor Homebrew cask supplies v1, so it is omitted; the CLI is pinned to the observed v2 beta.
- Pairing tokens, connection UUIDs, OAuth state, session history, the old OpenPets ACP shim, and blanket worktree trust are not migrated.

`mise run skills` offers skills from [`mattpocock/skills`](https://github.com/mattpocock/skills) and [`tt-a1i/archify`](https://github.com/tt-a1i/archify). Review skills and licenses before selecting them. Private/custom skills, cached copies, Cloudflare integrations, and the Sidepulse service are not automatically restored.

</details>

<details>
<summary><strong>App Store purchases and vendor apps</strong></summary>

After signing into the App Store and acquiring the apps:

```sh
brew bundle install --file Brewfile.app-store --no-upgrade
```

This installs **Velja, Magnet, and RunCat Neo** using their recorded App Store IDs.

| App | Installation boundary |
| --- | --- |
| Cider | Use your licensed download from [cider.sh](https://cider.sh), not an obsolete/unofficial cask |
| Universal Control | This is **Fender/PreSonus Universal Control**, not Apple's feature; choose the vendor download for your hardware |
| Graphite desktop | Install from Graphite's official desktop distribution; Homebrew supplies only the CLI |
| Mole desktop | Homebrew supplies the **CLI**, not the desktop wrapper |
| Executor v2 beta, Cua Driver, OpenPets | Follow the integration checklist above |

Restore app-specific state privately:

- **Raycast/Chrome:** use supported sync or reviewed exports; browser cookies and databases stay out of Git.
- **1Password/Tailscale:** sign in and approve the new device.
- **Velja:** recreate/import routing rules without publishing work URLs.
- **Desktop utilities:** review shortcuts, startup behavior, licenses, and permissions.
- **Stream Deck/Wave Link:** transfer profiles privately; they may contain URLs, scripts, or tokens. Reconfigure audio routing and plugin licenses.
- **Logitech/Universal Control:** use vendor-supported hardware profile restoration.
- **Beekeeper Studio/Insomnia:** securely transfer connection details and workspaces, which may contain credentials.

Private settings databases and login items are not restored by bootstrap.

</details>

<details>
<summary><strong>Optional macOS preferences and local databases</strong></summary>

```sh
mise run macos
mise run macos:apply
```

Only explicitly stored, allowlisted preferences were captured: dark appearance, filename extensions, capitalization/period substitution, Finder icon view, Dock autohide/size, and trackpad click/drag preferences. Unset values remain macOS defaults. No screenshot override was stored, so none is applied.

Previous values and presence/absence markers are saved under `~/.dotfiles-backups/macos.*`. No apps are restarted; log out/in when convenient. Display layouts, monitor IDs, networking, keyboard-device mappings, privacy approvals, and managed settings stay machine-local. MDM or future macOS releases may override preferences.

PostgreSQL has one owner—Homebrew, not a second mise installation. No database contents are copied. Start services explicitly when wanted:

```sh
brew services start postgresql@17
brew services start redis
```

</details>

## Safety and recovery

### What replacement means

Unchanged regular files are skipped. Existing files, including symlinks themselves, are moved to `~/.dotfiles-backups/run.*` before replacement. Redirected parent directories and file/directory conflicts are refused during preflight.

**Backups are not a transaction or a full machine rollback.** If a later step fails, earlier files or packages may already be installed. Displaced originals remain in the printed backup directory; newly created files have no original to restore. No uninstall task is provided.

- **Restore config:** inspect the backup, then restore the corresponding file to its home path. Review before overwriting newer changes.
- **Restore a preference:** use `defaults write DOMAIN KEY -TYPE VALUE` with its saved value, or `defaults delete DOMAIN KEY` if its `.status` file says `absent`.
- **A parent is a symlink:** keep your existing manager/layout and adopt the wanted settings manually; don't remove redirects just to silence the check.
- **An app already exists outside Homebrew:** inspect the conflict rather than force-overwriting the app.
- **A pinned runtime is unavailable:** deliberately update its version request after checking project compatibility; there is no silent fallback.

### Validation and publishing

```sh
mise run check
git status --short
git diff
```

The [tests](tests/check.test.mjs) cover preview behavior, backups, repeated application, symlink/conflict safety, JSON and shell checks, version/consent guardrails, and common credential/path leaks. When `agents` is installed, sync is tested in a disposable home without starting MCP servers.

> [!NOTE]
> Local regression checks pass, but a complete bootstrap on a clean Mac has **not yet been smoke-tested**. A passing test suite is not proof that every vendor installer, sign-in, or future macOS release will work.

Review every file before publishing and use a dedicated secret scanner such as Gitleaks. `git diff` does not show the contents of untracked files, so inspect new files listed by `git status` too. Never commit backup directories, local override values, private keys, account IDs, connection URLs, sessions, or raw usage logs.
