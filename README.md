# Fix "Out of Extra Usage" in OpenCode (Claude Max/Pro)

OpenCode's Anthropic OAuth routes requests through claude.ai's extra usage billing instead of your Claude Max/Pro plan quota.

## One-liner fix

```bash
curl -sL https://raw.githubusercontent.com/vinzabe/opencode-anthropic-max-fix/main/install.js | node
```

Then restart opencode and run `/connect` → **Claude Pro/Max** (OAuth login).

## After opencode updates

Re-run the one-liner — opencode may overwrite the patched plugin.
