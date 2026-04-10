# Fix "Out of Extra Usage" in OpenCode (Claude Max/Pro)

OpenCode's Anthropic OAuth routes requests through claude.ai's extra usage billing instead of your Claude Max/Pro plan quota.

## One-liner fix

```
curl -sL https://raw.githubusercontent.com/zai-coding-plan/opencode-anthropic-max-fix/main/install.sh | bash
```

Then restart opencode and run `/connect` → **Anthropic API Key** → **Claude Pro/Max**.

## What it does

1. Installs [`op-anthropic-auth`](https://github.com/leohenon/op-anthropic-auth) — a drop-in replacement plugin that uses the correct `claude-code/{version}` user-agent (matching real Claude Code CLI)
2. Patches the token exchange endpoint from `platform.claude.com` → `console.anthropic.com` (avoids rate limits)
3. Updates your opencode config to use the new plugin

## Why it works

Anthropic routes API requests based on the OAuth token's origin. The built-in `opencode-anthropic-auth` plugin uses old endpoints and user-agent strings that cause requests to be billed against claude.ai's "extra usage" bucket instead of your Max/Pro plan. This fix ensures requests are identified as coming from Claude Code CLI.

## After opencode updates

Re-run the one-liner — opencode may overwrite the patched plugin.
