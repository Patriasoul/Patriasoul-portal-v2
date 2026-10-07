(() => {
  "use strict";
  const SUPABASE_URL = "https://ijimozjfdffejbczwyzb.supabase.co";
  const SUPABASE_KEY = "sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";
  const form=document.getElementById("newsletterForm"), email=document.getElementById("newsletterEmail"), consent=document.getElementById("newsletterConsent"), button=document.getElementById("newsletterSubmit"), status=document.getElementById("newsletterStatus"), success=document.getElementById("newsletterSuccess"), again=document.getElementById("newsletterAgain");
  if(!form||!window.supabase)return;
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const copy=success.querySelector(".ps-newsletter-success-copy");
  const show=(message,ok=false)=>{status.textContent=message;status.className="ps-newsletter-status"+(ok?" ok":"");};
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const value=email.value.trim().toLowerCase();
    if(!value||!email.checkValidity()){email.focus();show("Upiši ispravnu e-mail adresu.");return;}
    if(!consent.checked){consent.focus();show("Potvrdi da želiš primati PatriaSoul novosti.");return;}
    button.disabled=true;show("Prijava se šalje…");
    try{
      const {error}=await client.from("newsletter_subscribers").insert({email:value,source:"newsletter"});
      if(error){
        if(error.code==="23505"){form.hidden=true;success.hidden=false;success.querySelector("h2").textContent="Već pratiš PatriaSoul.";copy.textContent="Ova je e-mail adresa već prijavljena. Hvala što si dio PatriaSoul kruga čitatelja.";success.scrollIntoView({behavior:"smooth",block:"center"});return;}
        throw error;
      }
      form.hidden=true;success.hidden=false;success.scrollIntoView({behavior:"smooth",block:"center"});
    }catch(error){console.error("Newsletter prijava:",error);show("Prijava trenutačno nije uspjela. Pokušaj ponovno za trenutak.");button.disabled=false;}
  });
  again?.addEventListener("click",()=>{form.reset();form.hidden=false;success.hidden=true;success.querySelector("h2").textContent="Hvala što pratiš PatriaSoul.";copy.textContent="Tvoja je e-mail adresa uspješno zaprimljena. Kada newsletter bude slao nove objave, PatriaSoul će ti ih moći poslati izravno.";status.textContent="";status.className="ps-newsletter-status";email.focus();});
})();