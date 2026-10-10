const fs=require("node:fs");
const path=require("node:path");
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const admin=read("stranice/administracija.html");
const js=read("assets/js/admin.js");
const ai=read("assets/js/ai-article.js");
const editor=read("assets/js/article-editor.js");
const worker=read("worker.js");
const requiredAdminIds=[
"admin-status","admin-denied","admin-dashboard","roles-panel","users-list","articles-manage","stories-manage",
"article-ai","ai-topic","ai-rss-url","ai-mode","ai-rss-refresh-all","ai-rss-feeds","ai-rss-new-url",
"ai-rss-add","ai-rss-load","ai-rss-selected-generate","ai-generate","ai-status","ai-rss-results",
"article-preview-modal","article-editor","article-save","article-clear","comments-manage","latest-list",
"system-checks","refresh-admin"
];
const missing=requiredAdminIds.filter(id=>!admin.includes('id="'+id+'"')&&!admin.includes("id='"+id+"'"));
const scripts=["assets/js/admin.js","assets/js/ai-article.js","assets/js/article-editor.js"];
for(const file of scripts){
 const result=require("node:child_process").spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
 if(result.status!==0){console.error("JS syntax error:",file,result.stderr);process.exitCode=1;}
}
const checks=[
["Admin includes AI RSS controls",admin.includes('id="ai-rss-refresh-all"')&&admin.includes('id="ai-rss-load"')],
["RSS script is loaded",admin.includes('src="../assets/js/ai-article.js"')],
["RSS uses same-origin proxy",ai.includes('"/api/rss?url="+encodeURIComponent(parsed.href)')],
["RSS no longer relies on AllOrigins",!ai.includes("api.allorigins.win")],
["Worker handles RSS endpoint",worker.includes('url.pathname === "/api/rss"')],
["RSS has timeout and response size cap",worker.includes("AbortSignal.timeout(10000)")&&worker.includes("1500000")],
["RSS server enforces approved source allowlist",worker.includes('new Set(["index.hr", "www.index.hr", "vecernji.hr", "www.vecernji.hr"])')&&worker.includes("Preusmjeravanje RSS izvora nije dopušteno.")],
["RSS admin rejects unapproved source domains",ai.includes("function validateFeedUrl")&&ai.includes("Novi izvori moraju se prethodno odobriti")],
["Article editor save action is connected",admin.includes('id="article-save"')&&js.includes('PatriaSoulArticleEditor?.save()')],
["Role management uses owner gate",js.includes('roles-panel')&&js.includes('hidden=!owner')],
["Article revisions are created",editor.includes("portal_article_revisions")],
["RSS error status can be surfaced",ai.includes("Nijedan RSS izvor nije uspio")],
];
console.log("PatriaSoul admin/RSS QA");
for(const [label,ok] of checks){console.log((ok?"PASS":"FAIL")+" "+label);if(!ok)process.exitCode=1;}
if(missing.length){console.error("Missing admin element IDs:",missing.join(", "));process.exitCode=1;}else console.log("PASS all "+requiredAdminIds.length+" required admin element IDs exist");
