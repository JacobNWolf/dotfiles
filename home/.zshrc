export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
zstyle ':omz:update' mode auto
ENABLE_CORRECTION="true"
plugins=(git rails ruby pnpm)

if [[ -r "$ZSH/oh-my-zsh.sh" ]]; then
  source "$ZSH/oh-my-zsh.sh"
else
  autoload -Uz compinit
  compinit
fi

if [[ -x /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi
typeset -U path PATH
path=("$HOME/.local/bin" "$HOME/.opencode/bin" /opt/homebrew/opt/libpq/bin $path)
export EDITOR=zed
export VISUAL=zed
command -v mise >/dev/null && eval "$(mise activate zsh)"
[[ ! -r "$HOME/.zshrc.local" ]] || source "$HOME/.zshrc.local"
