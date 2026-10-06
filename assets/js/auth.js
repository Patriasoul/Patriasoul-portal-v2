(()=>{"use strict";
const SUPABASE_URL="https://ijimozjfdffejbczwyzb.supabase.co";
const SUPABASE_KEY="sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";
let clientPromise=null;
function load(){
  if(clientPromise)return clientPromise;
  clientPromise=new Promise((resolve,reject)=>{
    if(window.supabase?.createClient){resolve(window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY));return}
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.async=true;
    s.onload=()=>window.supabase?.createClient?resolve(window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY)):reject(new Error("Supabase se nije učitao."));
    s.onerror=()=>reject(new Error("Supabase se nije učitao."));
    document.head.append(s);
  });
  return clientPromise;
}
window.PatriaSoulAuth={
  ready:load,
  async getUser(){const c=await load();const {data:{user}}=await c.auth.getUser();return user||null},
  async signIn(email,password){const c=await load();return c.auth.signInWithPassword({email,password})},
  async signUp(email,password,displayName){const c=await load();return c.auth.signUp({email,password,options:{data:{display_name:displayName}}})},
  async signOut(){const c=await load();return c.auth.signOut()},
  async client(){return load()}
};
})();