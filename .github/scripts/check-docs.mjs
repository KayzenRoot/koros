#!/usr/bin/env node
// KOR-GOV-002: deterministic Markdown link checks and heuristic credential detection.
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
const exclude = new Set([".git", "node_modules", "dist", "coverage", ".next", ".cache"]);
const secrets = /(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/;
function walk(dir, found=[]) {
 for(const item of readdirSync(dir,{withFileTypes:true})) {
  if(exclude.has(item.name)) continue;
  const full=join(dir,item.name);
  if(item.isDirectory()) walk(full,found);
  else if(item.isFile()&&[".md",".markdown"].includes(extname(item.name).toLowerCase())) found.push(full);
 }
 return found;
}
function audit(root) {
 const files=walk(root),findings=[];let links=0;
 for(const file of files) {
  const body=readFileSync(file,"utf8"),display=relative(root,file).split(sep).join("/");
  if(secrets.test(body)) findings.push(display+":POSSIBLE_SECRET");
  for(const match of body.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)){
   const raw=match[1];
   if(/^(?:https?:|mailto:|data:|#)/i.test(raw)) continue;
   let target=raw.split(/[?#]/,1)[0];if(!target)continue;
   try{target=decodeURIComponent(target)}catch{findings.push(display+":BAD_ENCODING:"+raw);continue}
   const dest=resolve(target.startsWith("/")?root:dirname(file),target.startsWith("/")?"."+target:target);
   links++;
   if(!(dest===root||dest.startsWith(root+sep)))findings.push(display+":PATH_ESCAPE:"+raw);
   else if(!existsSync(dest))findings.push(display+":BROKEN_LINK:"+raw);
   else if(lstatSync(dest).isSymbolicLink())findings.push(display+":SYMLINK_TARGET:"+raw);
  }
 }
 return {files:files.length,links,findings};
}
function selfTest(){
 const dir=mkdtempSync(join(tmpdir(),"kor-gov-"));
 try {
  mkdirSync(join(dir,"docs"));
  writeFileSync(join(dir,"README.md"),"# Test\n[good](docs/page.md)\n");
  writeFileSync(join(dir,"docs/page.md"),"# Page\n");
  let result=audit(dir);if(result.findings.length||result.links!==1)throw Error("valid fixture failed");
  writeFileSync(join(dir,"README.md"),"# Test\n[broken](docs/missing.md)\n");
  if(!audit(dir).findings.some(x=>x.includes("BROKEN_LINK")))throw Error("broken link not detected");
  writeFileSync(join(dir,"README.md"),"# Test\n[escape](../../missing.md)\n");
  if(!audit(dir).findings.some(x=>x.includes("PATH_ESCAPE")))throw Error("path traversal not detected");
  writeFileSync(join(dir,"README.md"),"# Test\n"+"ghp_"+"A".repeat(28)+"\n");
  if(!audit(dir).findings.some(x=>x.includes("POSSIBLE_SECRET")))throw Error("synthetic token not detected");
  process.stdout.write("PASS: valid link, broken link, path escape, synthetic secret\n");
 }finally{rmSync(dir,{recursive:true,force:true})}
}
if(process.argv.includes("--self-test"))selfTest();
else{
 const v=audit(process.cwd());
 process.stdout.write("Markdown files: "+v.files+"; local links: "+v.links+"; findings: "+v.findings.length+"\n");
 v.findings.forEach(x=>process.stderr.write(x+"\n"));
 if(v.findings.length)process.exitCode=1;
}
