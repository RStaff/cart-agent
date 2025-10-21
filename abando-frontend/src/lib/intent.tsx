// Minimal CTA intent tracker
'use client';
import * as React from "react";
declare global { interface Window { plausible?: (e:string,opts?:{props?:Record<string,unknown>})=>void } }
function match(el: Element|null){ if(!el) return null;
  const a=el.closest('a') as HTMLAnchorElement|null;
  if(a){ const href=a.getAttribute('href')||''; if(/^\/(onboarding|pricing|trial|demo)/.test(href)||a.hasAttribute('data-cta')) return {kind:'link' as const, href};}
  const b=el.closest('button') as HTMLButtonElement|null;
  if(b&&(b.hasAttribute('data-cta')||/start|try|demo|install/i.test(b.textContent||''))) return {kind:'button' as const};
  return null;
}
export default function IntentTracker(){
  React.useEffect(()=>{ const on=(e:MouseEvent)=>{ const t=e.target as Element|null; const m=match(t); if(!m) return;
    const el=(t?.closest('a,button') as HTMLElement|null)||undefined;
    const label=(el?.getAttribute('data-cta'))||(el?.textContent?.trim()?.slice(0,80))||'cta';
    const href=(el as HTMLAnchorElement|undefined)?.getAttribute?.('href')||undefined;
    if(process.env.NEXT_PUBLIC_ANALYTICS==='plausible' && typeof window!=='undefined' && typeof window.plausible==='function'){
      window.plausible('cta_click',{props:{label,href:href||null,kind:m.kind,path:location.pathname}});
    }
  }; document.addEventListener('click',on,{capture:true}); return ()=>document.removeEventListener('click',on,{capture:true});},[]);
  return null;
}
