#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const HOME = process.env.HOME;
const CACHE = path.join(HOME, '.cache', 'opencode');
const BUN_CACHE = path.join(HOME, '.bun', 'install', 'cache');
const NODE_MODULES = path.join(CACHE, 'node_modules');
const PLUGIN_DIR = path.join(NODE_MODULES, 'op-anthropic-auth');
const PKG_JSON = path.join(CACHE, 'package.json');
const CONFIG = path.join(HOME, '.config', 'opencode', 'opencode.json');
const VERSION = '0.1.1';
const PKG_NAME = 'op-anthropic-auth@' + VERSION;
const BUN_CACHE_DIR = path.join(BUN_CACHE, 'op-anthropic-auth@' + VERSION + '@@@1');
const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(PLUGIN_DIR, 'dist');

function log(m) { console.log('[fix] ' + m); }
function die(m) { console.error('[fix] ' + m); process.exit(1); }
function rf(d) { try { return fs.readFileSync(d, 'utf8'); } catch { return ''; } }
function jp(d) { try { return JSON.parse(d); } catch { return null; } }

if (!fs.existsSync(CACHE)) die('opencode cache not found');
if (!fs.existsSync(SRC_DIR) || !fs.existsSync(path.join(SRC_DIR, 'index.js')))
    die('src/index.js not found');

function cpDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const from = path.join(src, entry);
        const to = path.join(dst, entry);
        if (fs.statSync(from).isDirectory()) cpDir(from, to);
        else fs.copyFileSync(from, to);
    }
}

function createPackageJSON() {
    return JSON.stringify({
        name: 'op-anthropic-auth',
        version: VERSION,
        type: 'module',
        main: 'dist/index.js',
    }, null, 2);
}

function createDistDir() {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.copyFileSync(path.join(SRC_DIR, 'index.js'), path.join(DIST_DIR, 'index.js'));
}

function install() {
    log('installing ' + PKG_NAME + ' from local source...');
    createDistDir();

    const pkgJson = createPackageJSON();
    if (fs.existsSync(PLUGIN_DIR)) {
        try { fs.rmSync(PLUGIN_DIR, { recursive: true }); } catch {}
    }
    fs.mkdirSync(PLUGIN_DIR, { recursive: true });
    fs.writeFileSync(path.join(PLUGIN_DIR, 'package.json'), pkgJson);
    createDistDir();

    if (fs.existsSync(BUN_CACHE_DIR)) {
        try { fs.rmSync(BUN_CACHE_DIR, { recursive: true }); } catch {}
    }
    fs.mkdirSync(BUN_CACHE_DIR, { recursive: true });
    fs.mkdirSync(path.join(BUN_CACHE_DIR, 'dist'), { recursive: true });
    fs.copyFileSync(path.join(SRC_DIR, 'index.js'), path.join(BUN_CACHE_DIR, 'dist', 'index.js'));
    fs.writeFileSync(path.join(BUN_CACHE_DIR, 'package.json'), pkgJson);
    log('installed to cache and bun cache');
}

function pin() {
    if (!fs.existsSync(PKG_JSON)) return;
    let j = jp(rf(PKG_JSON));
    if (!j || !j.dependencies) return;
    if (j.dependencies['op-anthropic-auth'] !== VERSION) {
        j.dependencies['op-anthropic-auth'] = VERSION;
        fs.writeFileSync(PKG_JSON, JSON.stringify(j, null, 2) + '\n');
        log('pinned ' + PKG_NAME);
    } else {
        log('already pinned');
    }
}

function configure() {
    let j = jp(rf(CONFIG)) || {};
    if (!j.plugin) j.plugin = [];
    if (!j.plugin.includes(PKG_NAME)) {
        j.plugin.push(PKG_NAME);
        fs.mkdirSync(path.dirname(CONFIG), { recursive: true });
        fs.writeFileSync(CONFIG, JSON.stringify(j, null, 2) + '\n');
        log('added to config');
    } else {
        log('already in config');
    }
}

install();
pin();
configure();

if (!process.argv.includes('--no-systemd')) {
    const sd = path.join(HOME, '.config', 'systemd', 'user');
    const sf = path.join(sd, 'opencode-anthropic-patch.service');
    const pf = path.join(sd, 'opencode-anthropic-patch.path');
    const rs = path.join(path.join(sd, '..'), 'opencode', 'anthropic-patch', 'replace.sh');
    fs.mkdirSync(path.dirname(rs), { recursive: true });
    const rsContent = [
        '#!/bin/bash',
        'SRC="' + BUN_CACHE_DIR + '"',
        'DST="' + PLUGIN_DIR + '"',
        '[ ! -d "$SRC" ] && echo "source missing" && exit 1',
        '[ ! -d "$DST" ] && exit 0',
        'V=$(node -e "try{console.log(JSON.parse(require(\\\'fs\\\').readFileSync(\\\'$DST/package.json\\\',\\\'utf8\\\')).version)}catch{}" 2>/dev/null)',
        '[ "$V" = "' + VERSION + '" ] && [ "$(head -1 $DST/dist/index.js 2>/dev/null)" = \'import { createHash } from "node:crypto";\' ] && exit 0',
        'rm -rf "$DST" && cp -a "$SRC" "$DST"',
        'echo "restored ' + VERSION + ' at $(date)"',
        '',
    ].join('\n');
    fs.writeFileSync(rs, rsContent);
    fs.chmodSync(rs, 0o755);
    fs.mkdirSync(sd, { recursive: true });
    fs.writeFileSync(sf, [
        '[Unit]',
        'Description=Restore op-anthropic-auth@' + VERSION + ' after opencode updates',
        '',
        '[Service]',
        'Type=oneshot',
        'ExecStart=/bin/bash ' + rs,
        '',
    ].join('\n'));
    fs.writeFileSync(pf, [
        '[Unit]',
        'Description=Watch op-anthropic-auth for changes',
        '',
        '[Path]',
        'PathModified=%h/.cache/opencode/node_modules/op-anthropic-auth/dist/index.js',
        'Unit=opencode-anthropic-patch.service',
        '',
        '[Install]',
        'WantedBy=opencode-anthropic-patch.service',
        '',
    ].join('\n'));
    try {
        execSync('systemctl --user daemon-reload', { stdio: 'pipe', timeout: 5000 });
        execSync('systemctl --user restart opencode-anthropic-patch.path opencode-anthropic-patch.service', { stdio: 'pipe', timeout: 5000 });
        log('systemd watcher active');
    } catch (e) {
        log('systemd skipped: ' + e.message);
    }
}

log('done. restart opencode, /connect -> Claude Pro/Max');
