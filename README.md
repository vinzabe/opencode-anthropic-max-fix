# Fix "Out of Extra Usage" in OpenCode (Claude Max/Pro)

OpenCode's Anthropic OAuth routes requests through claude.ai's extra usage billing instead of your Claude Max/Pro plan quota.

## One-liner fix

```bash
curl -sL https://raw.githubusercontent.com/vinzabe/opencode-anthropic-max-fix/main/install.js | node
```

Then restart opencode and run `/connect` → **Claude Pro/Max** (OAuth login).

## How it works

The fix patches the `op-anthropic-auth` plugin to route token exchanges through Anthropic's console endpoint (which respects your Max/Pro plan quota) instead of the claude.ai platform endpoint (which uses "extra usage" billing).

A persistence wrapper is installed at `/usr/bin/opencode` that automatically re-applies patches if opencode or bun overwrites them during startup — no need to re-run the installer after updates.

## Requirements

- Root access (for wrapper installation at `/usr/bin/opencode`)
- Node.js (already required by opencode)
- A Claude Max or Pro subscription
