#!/usr/bin/env bash
set -euo pipefail
umask 077

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
mode="${1:---preview}"
case "$mode" in
  --preview|--apply) ;;
  *) printf 'Usage: %s [--preview|--apply]\n' "$0" >&2; exit 2 ;;
esac
[[ $# -le 1 ]] || exit 2
[[ -n "${HOME:-}" && "$HOME" = /* && -d "$HOME" ]] || {
  echo "HOME must be an existing absolute directory." >&2
  exit 1
}
home="$(cd -- "$HOME" && pwd -P)"
[[ "$home" != / ]] || { echo "Refusing to install into /." >&2; exit 1; }

check_parents() {
  local parent
  parent="$(dirname -- "$1")"
  while [[ "$parent" != "$home" ]]; do
    if [[ -L "$parent" || ( -e "$parent" && ! -d "$parent" ) ]]; then
      printf 'Refusing redirected or non-directory parent: %s\n' "$parent" >&2
      return 1
    fi
    parent="$(dirname -- "$parent")"
  done
}

# Preflight every destination before moving any existing configuration.
while IFS= read -r -d '' source; do
  relative="${source#"$root/home/"}"
  destination="$home/$relative"
  check_parents "$destination"
  if [[ -d "$destination" && ! -L "$destination" ]]; then
    printf 'Refusing to replace a directory with a file: %s\n' "$destination" >&2
    exit 1
  fi
done < <(find "$root/home" -type f -print0)
check_parents "$home/.dotfiles-backups/run/placeholder"

backup=""
while IFS= read -r -d '' source; do
  relative="${source#"$root/home/"}"
  destination="$home/$relative"
  if [[ ! -L "$destination" && -f "$destination" ]] && cmp -s "$source" "$destination"; then
    continue
  fi
  if [[ -e "$destination" || -L "$destination" ]]; then
    printf 'REPLACE %s\n' "$relative"
  else
    printf 'CREATE  %s\n' "$relative"
  fi
  [[ "$mode" = --apply ]] || continue
  if [[ -e "$destination" || -L "$destination" ]]; then
    if [[ -z "$backup" ]]; then
      mkdir -p "$home/.dotfiles-backups"
      backup="$(mktemp -d "$home/.dotfiles-backups/run.XXXXXX")"
      printf 'Backup directory: %s\n' "$backup"
    fi
    mkdir -p "$(dirname -- "$backup/$relative")"
    mv "$destination" "$backup/$relative"
  fi
  mkdir -p "$(dirname -- "$destination")"
  cp "$source" "$destination"
done < <(find "$root/home" -type f -print0)

if [[ "$mode" != --apply ]]; then
  echo "Preview only. Run mise run apply to install these copies."
fi
