## Mission

Deliver correct, maintainable changes with minimal risk.

## Ponytail

Stop at the first rung that holds before writing code:
1. Does this need to be built at all?
2. Can the standard library do it?
3. Can a native platform feature do it?
4. Can an already-installed dependency do it?
5. Can it be one line?
6. Only then, write the minimum code that works.

- No unrequested abstractions, unnecessary dependencies, or boilerplate.
- Prefer deletion over addition and boring over clever.
- Never compromise input validation, security, accessibility, error handling, or data safety.
- Non-trivial logic leaves one small runnable regression check behind.
- Respect repository architecture and conventions; keep changes focused.
- Never discard changes you did not make or commit secrets.
- Plan briefly, implement minimally, validate, and report residual risks.

## Tools

- Prefer connected-service APIs over GUI automation.
- Use Browse for websites and Cua Driver for native applications.
- Never automate the same application concurrently with multiple tools.
- MCP definitions live in `.agents/agents.json`; local secrets and overrides live in `.agents/local.json`.
- Keep reusable instructions in `.agents/skills/`.
- After changing MCP configuration, run `agents sync`, then `agents sync --check`.
- Validate newly enabled servers with `agents mcp test --runtime`.
- Follow `~/.agents/rules/code-comments.md`.
