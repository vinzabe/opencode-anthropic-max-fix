# Anthropic OAuth Fix for OpenCode

Enables Claude Pro/Max subscription models (Sonnet, Opus, Haiku) in [opencode](https://opencode.ai).

## OAuth Login

After installing, restart opencode → `/connect` → **Claude Pro/Max** → authorize in browser → paste the code.

## Install

```bash
curl -sL https://raw.githubusercontent.com/vinzabe/opencode-anthropic-max-fix/main/install.cjs | node
```

## What it does

1. Installs the correct `op-anthropic-auth@0.1.1` plugin with OAuth billing header support
2. Persists the plugin across opencode restarts (which overwrite it via `bun install`)
3. Sets up a systemd watcher for automatic re-application

## Requirements

- Node.js, systemd (Linux)
- Claude Max or Pro subscription

## Reverting

```bash
systemctl --user disable --now opencode-anthropic-patch.path opencode-anthropic-patch.service
rm ~/.config/systemd/user/opencode-anthropic-patch.{service,path}
```

## Without systemd

```bash
curl -sL https://raw.githubusercontent.com/vinzabe/opencode-anthropic-max-fix/main/install.cjs | node -- --no-systemd
```
