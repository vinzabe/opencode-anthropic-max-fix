#!/usr/bin/env node
const _=a=>{const s={'readFileSync':1,writeFileSync:2,existsSync:3,mkdirSync:4,log:5,error:6,exit:7,parse:8,statSync:9,spawnSync:10,isFile:11,trim:12,split:13,pop:14,copyFileSync:15,readdirSync:16,recursive:17,pipe:18,utf8:19,push:20,includes:21,rmSync:22,chmodSync:23,stringify:24};return s[a]||a};const fs=require('fs'),p=require('path'),{execSync:E}=require('child_process'),os=require('os');
const H=process.env.HOME,C=p.join(H,'.cache','opencode'),B=p.join(H,'.bun','install','cache'),N=p.join(C,'node_modules','op-anthropic-auth'),R=p.join(C,'package.json'),V='0.1.1',K='op-anthropic-auth@'+V,P=p.join(B,'op-anthropic-auth@'+V+'@@@1'),S=p.join(H,'.config','opencode','opencode.json');
function L(m){console.log('[fix] '+m)}function D(m){console.error('[fix] '+m);process.exit(1)}
function rf(d){try{return fs.readFileSync(d,'utf8')}catch{return''}}
function jp(d){try{return JSON.parse(d)}catch{return null}}
function cp(s,d){if(fs.statSync(s).isDirectory()){fs.mkdirSync(d,{recursive:true});for(const e of fs.readdirSync(s)){if(e==='.git')continue;cp(p.join(s,e),p.join(d,e))}}else fs.copyFileSync(s,d)}
if(!fs.existsSync(C))D('opencode cache not found');
function inst(){L('installing '+K+'...');const t=p.join(os.tmpdir(),'_oa_'+Date.now());fs.mkdirSync(t,{recursive:true});try{
const r=require('child_process').spawnSync('npm',['pack',K,'--pack-destination',t],{stdio:'pipe',encoding:'utf8',timeout:30000});
if(r.error)throw r.error;const f=r.stdout.trim().split('\n').pop();const x=p.join(t,'_x');fs.mkdirSync(x,{recursive:true});
require('child_process').spawnSync('tar',['xzf',p.join(t,f),'-C',x],{stdio:'pipe'});
const src=p.join(x,'package');cp(src,P);L('cached');if(fs.existsSync(N))try{fs.rmSync(N,{recursive:true})}catch{};cp(src,N);L('installed');
}catch(e){D('install failed: '+e.message)}finally{try{fs.rmSync(t,{recursive:true})}catch{}}}
function pin(){if(!fs.existsSync(R))return;let j=jp(rf(R));if(!j||!j.dependencies)return;if(j.dependencies['op-anthropic-auth']!==V){j.dependencies['op-anthropic-auth']=V;fs.writeFileSync(R,JSON.stringify(j,null,2)+'\n');L('pinned '+K)}else L('already pinned')}
function cfg(){let j=jp(rf(S))||{};if(!j.plugin)j.plugin=[];if(!j.plugin.includes(K)){j.plugin.push(K);fs.mkdirSync(p.dirname(S),{recursive:true});fs.writeFileSync(S,JSON.stringify(j,null,2)+'\n');L('added to config')}else L('already in config')}
function chk(){if(fs.existsSync(N)){const v=jp(rf(p.join(N,'package.json')));if(v&&v.version===V){const l=rf(p.join(N,'dist/index.js')).split('\n')[0];if(l==='import { createHash } from "node:crypto";'){L('already installed');return true}}}return false}
if(!chk())inst();pin();cfg();
if(!process.argv.includes('--no-systemd')){
const sd=p.join(H,'.config','systemd/user'),sf=p.join(sd,'opencode-anthropic-patch.service'),pf=p.join(sd,'opencode-anthropic-patch.path'),rs=p.join(p.join(sd,'..'),'opencode','anthropic-patch','replace.sh');
fs.mkdirSync(p.dirname(rs),{recursive:true});
const rsContent=[
'#!/bin/bash','SRC="'+P+'"','DST="'+N+'"',
'[ ! -d "$SRC" ] && echo "source missing" && exit 1',
'[ ! -d "$DST" ] && exit 0',
'V=$(node -e "try{console.log(JSON.parse(require(\\\'fs\\\').readFileSync(\\\'$DST/package.json\\\',\\\'utf8\\\')).version)}catch{}" 2>/dev/null)',
'[ "$V" = "'+V+'" ] && [ "$(head -1 $DST/dist/index.js 2>/dev/null)" = \'import { createHash } from "node:crypto";\' ] && exit 0',
'rm -rf "$DST" && cp -a "$SRC" "$DST"','echo "restored '+V+' at $(date)"',''
].join('\n');
fs.writeFileSync(rs,rsContent);fs.chmodSync(rs,0o755);
fs.mkdirSync(sd,{recursive:true});
fs.writeFileSync(sf,'[Unit]\nDescription=Restore op-anthropic-auth@'+V+' after opencode updates\n\n[Service]\nType=oneshot\nExecStart=/bin/bash '+rs+'\n');
fs.writeFileSync(pf,'[Unit]\nDescription=Watch op-anthropic-auth for changes\n\n[Path]\nPathModified=%h/.cache/opencode/node_modules/op-anthropic-auth/dist/index.js\nUnit=opencode-anthropic-patch.service\n\n[Install]\nWantedBy=opencode-anthropic-patch.service\n');
try{E('systemctl --user daemon-reload',{stdio:'pipe',timeout:5000});E('systemctl --user restart opencode-anthropic-patch.path opencode-anthropic-patch.service',{stdio:'pipe',timeout:5000});L('systemd watcher active')}catch(e){L('systemd skipped: '+e.message)}}
L('done. restart opencode, /connect -> Claude Pro/Max');
