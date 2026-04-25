# Anthropic OAuth Fix for OpenCode

Fixes the **rate limit (429)** and **"out of extra usage" / "no credit"** errors when using Claude Pro/Max subscription models (Sonnet, Opus, Haiku) in [opencode](https://opencode.ai).

## OAuth Login

After installing, restart opencode → `/connect` → **Claude Pro/Max** → authorize in browser → paste the code.

## Install

```bash
curl -sL https://raw.githubusercontent.com/vinzabe/opencode-anthropic-max-fix/master/install.cjs | node
```

## What it does

1. Installs the correct `op-anthropic-auth@0.1.1` plugin with OAuth billing-header support, into both opencode plugin layouts (`~/.cache/opencode/node_modules/...` and `~/.cache/opencode/packages/<spec>/...`)
2. Pins the plugin in `~/.config/opencode/opencode.json`
3. Sets up a per-platform watcher that restores the plugin if opencode overwrites it via `bun install`
   - **Linux**: systemd `path` + `service` user units
   - **macOS**: launchd agent with `WatchPaths` (kqueue `NOTE_WRITE`)

## Requirements

- Node.js
- macOS or Linux
- Claude Max or Pro subscription

## Reverting

```bash
# Linux
systemctl --user disable --now opencode-anthropic-patch.path opencode-anthropic-patch.service
rm ~/.config/systemd/user/opencode-anthropic-patch.{service,path}

# macOS
launchctl unload ~/Library/LaunchAgents/com.vinzabe.opencode-anthropic-patch.plist
rm ~/Library/LaunchAgents/com.vinzabe.opencode-anthropic-patch.plist
```

## Without the watcher (one-shot)

```bash
curl -sL https://raw.githubusercontent.com/vinzabe/opencode-anthropic-max-fix/master/install.cjs | node -- --no-watcher
```
