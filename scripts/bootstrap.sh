#!/usr/bin/env bash
set -euo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$root"
[[ "$(uname -s)" = Darwin && "$(uname -m)" = arm64 ]] || {
  echo "This setup requires a native Apple Silicon macOS shell, not Rosetta." >&2
  exit 1
}
xcode-select -p >/dev/null 2>&1 || {
  echo "Install Apple's developer tools with xcode-select --install, then rerun." >&2
  exit 1
}
command -v brew >/dev/null || {
  echo "Install Homebrew from https://brew.sh, then run brew install mise." >&2
  exit 1
}

bash scripts/apply.sh
printf '\nThis installs the Brewfile, replaces the listed configs with backups,\n'
printf 'and installs runtimes. It does not apply macOS preferences or sign in.\n'
read -r -p "Type setup to continue: " answer
[[ "$answer" = setup ]] || { echo "Cancelled."; exit 1; }

brew bundle install --file "$root/Brewfile" --no-upgrade
if [[ ! -e "$HOME/.oh-my-zsh" && ! -L "$HOME/.oh-my-zsh" ]]; then
  git clone --depth 1 https://github.com/ohmyzsh/ohmyzsh.git "$HOME/.oh-my-zsh"
fi
if [[ ! -x "$HOME/.local/bin/cua-driver" ]] && ! command -v cua-driver >/dev/null 2>&1; then
  curl -fsSL https://cua.ai/driver/install.sh | bash -s -- --no-modify-path --no-connect --no-test
fi
bash scripts/apply.sh --apply
mise -C "$HOME" install
mise -C "$HOME" exec -- agents sync --global
mise -C "$HOME" exec -- agents sync --global --check
printf '\nBase setup complete. Follow README.md for sign-ins, App Store apps,\n'
printf 'vendor apps, local work settings, and optional macOS preferences.\n'
