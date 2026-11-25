if [[ -x /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi
[[ ! -r "$HOME/.orbstack/shell/init.zsh" ]] || source "$HOME/.orbstack/shell/init.zsh"
[[ ! -r "$HOME/.zprofile.local" ]] || source "$HOME/.zprofile.local"
