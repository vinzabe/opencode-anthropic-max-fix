#!/usr/bin/env bash
set -euo pipefail

PLUGIN_DIR=$(find ~/.cache/opencode/node_modules/op-anthropic-auth/dist -name "index.js" 2>/dev/null | head -1)
if [ -z "$PLUGIN_DIR" ]; then
  echo "Installing op-anthropic-auth..."
  npm i -g op-anthropic-auth@latest 2>/dev/null
  PLUGIN_DIR=$(find ~/.cache/opencode/node_modules/op-anthropic-auth/dist -name "index.js" 2>/dev/null | head -1)
fi

if [ -z "$PLUGIN_DIR" ]; then
  echo "ERROR: op-anthropic-auth not found. Run opencode once first, then re-run this script."
  exit 1
fi

echo "Patching $PLUGIN_DIR"
sed -i 's|https://platform.claude.com/v1/oauth/token|https://console.anthropic.com/v1/oauth/token|g' "$PLUGIN_DIR"
sed -i 's|https://platform.claude.com/oauth/code/callback|https://console.anthropic.com/oauth/code/callback|g' "$PLUGIN_DIR"
sed -i 's|mode === "console" ? "platform.claude.com" : "claude.ai"|mode === "console" ? "console.anthropic.com" : "claude.ai"|g' "$PLUGIN_DIR"

CONFIG="$HOME/.config/opencode/config.json"
if [ -f "$CONFIG" ]; then
  if grep -q "op-anthropic-auth" "$CONFIG" 2>/dev/null; then
    echo "op-anthropic-auth already in config."
  else
    echo "Adding op-anthropic-auth to config..."
    sed -i 's/"opencode-anthropic-auth[^"]*"/"op-anthropic-auth@latest"/g' "$CONFIG" 2>/dev/null || true
  fi
else
  echo '{"plugin":["op-anthropic-auth@latest"]}' > "$CONFIG"
fi

echo ""
echo "Done. Restart opencode and run /connect -> Anthropic API Key -> Claude Pro/Max"
