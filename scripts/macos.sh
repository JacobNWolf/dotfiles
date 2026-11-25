#!/usr/bin/env bash
set -euo pipefail
umask 077

mode="${1:---preview}"
case "$mode" in
  --preview|--apply) ;;
  *) printf 'Usage: %s [--preview|--apply]\n' "$0" >&2; exit 2 ;;
esac
[[ $# -le 1 && "$(uname -s)" = Darwin ]] || exit 2
backup=""
if [[ "$mode" = --apply ]]; then
  [[ -n "${HOME:-}" && "$HOME" = /* && -d "$HOME" && "$HOME" != / ]] || exit 1
  [[ ! -L "$HOME/.dotfiles-backups" ]] || {
    echo "Refusing a redirected backup directory." >&2
    exit 1
  }
  mkdir -p "$HOME/.dotfiles-backups"
  backup="$(mktemp -d "$HOME/.dotfiles-backups/macos.XXXXXX")"
  printf 'Previous preference values: %s\n' "$backup"
fi

write() {
  local domain="$1" key="$2" type="$3" value="$4" previous
  printf '%s %s = %s\n' "$domain" "$key" "$value"
  [[ "$mode" = --apply ]] || return 0
  previous="$backup/$domain.$key"
  if defaults read "$domain" "$key" > "$previous" 2>/dev/null; then
    printf 'present\n' > "$previous.status"
  else
    printf 'absent\n' > "$previous.status"
  fi
  defaults write "$domain" "$key" "-$type" "$value"
}

write NSGlobalDomain AppleInterfaceStyle string Dark
write NSGlobalDomain AppleShowAllExtensions bool true
write NSGlobalDomain NSAutomaticCapitalizationEnabled bool true
write NSGlobalDomain NSAutomaticPeriodSubstitutionEnabled bool true
write com.apple.finder FXPreferredViewStyle string icnv
write com.apple.dock autohide bool true
write com.apple.dock tilesize float 46
write com.apple.AppleMultitouchTrackpad Clicking int 0
write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerDrag bool false
write com.apple.AppleMultitouchTrackpad Dragging int 0
write com.apple.AppleMultitouchTrackpad TrackpadRightClick bool false
write com.apple.driver.AppleBluetoothMultitouch.trackpad Clicking int 0
write com.apple.driver.AppleBluetoothMultitouch.trackpad TrackpadThreeFingerDrag bool false
write com.apple.driver.AppleBluetoothMultitouch.trackpad Dragging int 0
write com.apple.driver.AppleBluetoothMultitouch.trackpad TrackpadRightClick bool false

if [[ "$mode" = --apply ]]; then
  echo "Applied. Log out and back in when convenient; running apps were not restarted."
else
  echo "Preview only. Run mise run macos:apply to write these preferences."
fi
