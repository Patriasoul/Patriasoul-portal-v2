const fs=require("fs"),path=require("path");
const root=path.join(process.cwd(),"clanci");
let files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/^clanak-[^/]+\.html$/i.test(e.name))files.push(p)}}
walk(root);
const bad=[];
for(const f of files){
  const s=fs.readFileSync(f,"utf8");
  const rel=path.relative(process.cwd(),f);
  if(!/class=["'][^"']*article-page/i.test(s))bad.push(rel+" missing article-page");
  if(!/class=["'][^"']*ps-comments(?:\s|["'])/i.test(s))bad.push(rel+" missing static/live comment block");
  const relatedPos=s.search(/<section[^>]*class=["'][^"']*article-related(?:\s|["'])[^>]*>/i);
  const commentsPos=s.search(/<section[^>]*class=["'][^"']*ps-comments(?:\s|["'])[^>]*>/i);
  const footerPos=s.search(/<footer[^>]*class=["'][^"']*site-footer/i);
  if(relatedPos>=0 && commentsPos>=0 && commentsPos<relatedPos)bad.push(rel+" comments placed before related stories");
  if(commentsPos>=0 && footerPos>=0 && commentsPos>footerPos)bad.push(rel+" comments are after footer");
  if(!/<script[^>]+assets\/js\/portal\.js/i.test(s))bad.push(rel+" missing portal.js");
  if(!/modern-articles\.css/i.test(s))bad.push(rel+" missing modern-articles.css");
  if(/utterances|github\.com\/utterance|giscus/i.test(s))bad.push(rel+" contains anonymous/legacy comment system");
}
const comments=fs.readFileSync(path.join(process.cwd(),"assets/js/comments.js"),"utf8");
const auth=fs.readFileSync(path.join(process.cwd(),"assets/js/auth.js"),"utf8");
if(!/article_comments/.test(comments))bad.push("comments.js missing article_comments");
if(!/getUser\(\)/.test(auth))bad.push("auth.js missing authenticated user lookup");
for(const p of ["stranice/prijava.html","stranice/registracija.html"]){
 const s=fs.readFileSync(path.join(process.cwd(),p),"utf8");
 if(!/assets\/js\/auth\.js/.test(s))bad.push(p+" missing auth.js");
 if(!/assets\/css\/base\.css/.test(s))bad.push(p+" missing base.css");
 if(!/ps-auth-page/.test(s))bad.push(p+" missing responsive auth layout");
}
console.log("KOMENTARI — ČLANCI:",files.length);
if(bad.length){console.error("KOMENTARI FAIL",bad);process.exit(1)}
console.log("KOMENTARI OK — svi članci koriste portal shell + jedinstveni sustav komentara.");
