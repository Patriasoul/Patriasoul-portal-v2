(()=>{"use strict";
const SUPABASE_URL="https://ijimozjfdffejbczwyzb.supabase.co";
const SUPABASE_KEY="sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";
const supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}});
const form=document.getElementById("heritageSubmissionForm"), status=document.getElementById("heritageFormStatus"), success=document.getElementById("heritageSuccess"), newSubmission=document.getElementById("heritageNewSubmission"), fileInput=document.getElementById("heritageAttachment");
if(!form)return;
const setStatus=(message,type="")=>{status.textContent=message;status.className="ps-story-form-status"+(type?" "+type:"")};
const safeName=name=>name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
form.addEventListener("submit",async event=>{
 event.preventDefault(); setStatus("");
 if(!form.checkValidity()){form.reportValidity();return}
 const data=new FormData(form), file=fileInput.files?.[0]||null;
 if(file && file.size>10*1024*1024){setStatus("Prilog je prevelik. Maksimalna veličina je 10 MB.","error");return}
 const allowed=["image/jpeg","image/png","image/webp","image/heic","image/tiff","application/pdf"];
 if(file && !allowed.includes(file.type)){setStatus("Ova vrsta datoteke nije dopuštena.","error");return}
 const button=form.querySelector("button[type=submit]"); button.disabled=true; button.classList.add("is-loading"); setStatus("Šaljemo prijavu…");
 let attachment=null;
 try{
  const {data:{user}}=await supabase.auth.getUser();
  const submissionId=crypto.randomUUID();
  let attachment=null;
  if(file){
   const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"");
   const path="submissions/"+submissionId+"/"+safeName(file.name).slice(0,120)+"."+ext;
   const upload=await supabase.storage.from("heritage-submissions").upload(path,file,{contentType:file.type,upsert:false});
   if(upload.error)throw upload.error;
   attachment={path,name:file.name,type:file.type,size:file.size};
  }
  const payload={
   id:submissionId,submitted_by:user?.id||null,
   name:data.get("name").trim(),email:data.get("email").trim(),title:data.get("title").trim(),
   location:(data.get("location")||"").trim()||null,category:data.get("category"),
   story:data.get("story").trim(),source_info:(data.get("source_info")||"").trim()||null,
   period:(data.get("period")||"").trim()||null,rights_confirmed:data.get("rights_confirmed")==="on",
   consent:data.get("consent")==="on",status:"novo",
   attachment:attachment
  };
  const {data:mailResult,error:mailError}=await supabase.functions.invoke("heritage-submit",{body:payload});
  if(mailError)throw mailError;
  if(!mailResult?.ok || !mailResult?.email_sent || !mailResult?.confirmation_sent)throw new Error("Potvrda e-pošte nije potvrđena kao poslana.");
  form.hidden=true;success.hidden=false;success.scrollIntoView({behavior:"smooth",block:"center"});
 }catch(error){console.error("PatriaSoul prijava:",error);setStatus("Prijavu nije bilo moguće poslati. Provjeri vezu i pokušaj ponovno.","error")}
 finally{button.disabled=false;button.classList.remove("is-loading")}
});
newSubmission?.addEventListener("click",()=>{form.reset();form.hidden=false;success.hidden=true;setStatus("");form.scrollIntoView({behavior:"smooth",block:"start"})});
})();