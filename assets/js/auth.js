(()=>{"use strict";
if(window.PatriaSoulAuth && window.PatriaSoulAuth.__v) return;
const SUPABASE_URL="https://ijimozjfdffejbczwyzb.supabase.co";
const SUPABASE_KEY="sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";
let clientPromise=null;
function load(){
 if(clientPromise)return clientPromise;
 clientPromise=new Promise((resolve,reject)=>{
  const make=()=>{try{resolve(window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}))}catch(e){reject(e)}};
  if(window.supabase?.createClient){make();return}
  const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.async=true;
  s.onload=()=>window.supabase?.createClient?make():reject(new Error("Supabase se nije učitao."));
  s.onerror=()=>reject(new Error("Supabase se nije učitao."));document.head.append(s);
 });
 return clientPromise;
}
const api={
 __v:"20261007-6",ready:load,
 async getUser(){const c=await load();const {data:{user},error}=await c.auth.getUser();if(error)throw error;return user||null},
 async getSession(){const c=await load();return c.auth.getSession()},
 async waitForUser(timeout=4000){
  const c=await load();
  const first=await c.auth.getSession();
  if(first.data?.session){const u=await c.auth.getUser();if(!u.error&&u.data.user)return u.data.user}
  return new Promise(resolve=>{
   let done=false;
   const finish=u=>{if(done)return;done=true;sub.subscription.unsubscribe();resolve(u||null)};
   const timer=setTimeout(()=>finish(null),timeout);
   const {data:sub}=c.auth.onAuthStateChange((_event,session)=>{
    if(session?.user){clearTimeout(timer);finish(session.user)}
   });
  });
 },
 async getProfile(){const c=await load();const user=await this.getUser();if(!user)return null;const {data,error}=await c.from("profiles").select("id,display_name,role,avatar_url,created_at,updated_at").eq("id",user.id).maybeSingle();if(error)throw error;return data||null},
 async updateProfile(displayName){const c=await load();const user=await this.getUser();if(!user)throw new Error("Niste prijavljeni.");const {data,error}=await c.from("profiles").update({display_name:displayName,updated_at:new Date().toISOString()}).eq("id",user.id).select("id,display_name,role,avatar_url,created_at,updated_at").single();if(error)throw error;await c.auth.updateUser({data:{display_name:displayName}});return data},
 async signIn(email,password){const c=await load();const result=await c.auth.signInWithPassword({email,password});if(result.error)return result;if(result.data?.session){const saved=await c.auth.setSession({access_token:result.data.session.access_token,refresh_token:result.data.session.refresh_token});if(saved.error)return {data:null,error:saved.error}}const verified=await c.auth.getUser();if(verified.error)return {data:null,error:verified.error};return {data:{...result.data,user:verified.data.user},error:null}},
 async signUp(email,password,displayName){const c=await load();return c.auth.signUp({email,password,options:{data:{display_name:displayName}}})},
 async signOut(){const c=await load();return c.auth.signOut()},
 async client(){return load()}
};
window.PatriaSoulAuth=api;
})();