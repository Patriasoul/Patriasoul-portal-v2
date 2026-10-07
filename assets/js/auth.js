(()=>{"use strict";
const SUPABASE_URL="https://ijimozjfdffejbczwyzb.supabase.co";
const SUPABASE_KEY="sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";
let clientPromise=null;
function load(){
 if(clientPromise)return clientPromise;
 clientPromise=new Promise((resolve,reject)=>{
  const make=()=>{try{resolve(window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}))}catch(e){reject(e)}};
  if(window.supabase?.createClient){make();return}
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  s.async=true;
  s.onload=()=>window.supabase?.createClient?make():reject(new Error("Supabase se nije učitao."));
  s.onerror=()=>reject(new Error("Supabase se nije učitao."));
  document.head.append(s);
 });
 return clientPromise;
}
window.PatriaSoulAuth={
 ready:load,
 async getUser(){const c=await load();const {data:{user},error}=await c.auth.getUser();if(error)throw error;return user||null},
 async getSession(){const c=await load();return c.auth.getSession()},
 async getProfile(){const c=await load();const user=await this.getUser();if(!user)return null;const {data,error}=await c.from("profiles").select("id,display_name,role,avatar_url,created_at,updated_at").eq("id",user.id).maybeSingle();if(error)throw error;return data||null},
 async updateProfile(displayName){const c=await load();const user=await this.getUser();if(!user)throw new Error("Niste prijavljeni.");const {data,error}=await c.from("profiles").update({display_name:displayName,updated_at:new Date().toISOString()}).eq("id",user.id).select("id,display_name,role,avatar_url,created_at,updated_at").single();if(error)throw error;await c.auth.updateUser({data:{display_name:displayName}});return data},
 async signIn(email,password){const c=await load();const result=await c.auth.signInWithPassword({email,password});if(result.error)return result;const verified=await c.auth.getUser();return {data:{...result.data,user:verified.data.user},error:verified.error||null}},
 async signUp(email,password,displayName){const c=await load();return c.auth.signUp({email,password,options:{data:{display_name:displayName}}})},
 async signOut(){const c=await load();return c.auth.signOut()},
 async client(){return load()}
};
})();