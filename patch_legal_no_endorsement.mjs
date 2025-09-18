import fs from 'node:fs'; import path from 'node:path';
const ROOT=process.cwd();
const PUB = path.join(ROOT,'web','src','public');
const LEG = path.join(PUB,'legal');
const TOS = path.join(LEG,'terms','index.html');
const PRIV= path.join(LEG,'privacy','index.html');
const DPA = path.join(LEG,'dpa','index.html');
const PLAY= path.join(PUB,'demo','playground','index.html');

const r=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const w=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);console.log('✏️  wrote',p.replace(ROOT+'/',''));};

function ensureTerms(){
  let h=r(TOS); if(!h){console.warn('Terms not found:',TOS);return;}
  if(!/Marketing\s*&\s*Personas/i.test(h)){
    const block = `
<h3>Marketing & Personas (No Endorsement)</h3>
<p>Our Service may provide message styles inspired by public figures (e.g., “Kevin Hart tone”, “Beyoncé tone”, “Taylor Swift tone”). 
These features are <strong>style inspirations only</strong> and <strong>do not</strong> use any celebrity’s name, image, likeness, or voice, 
and <strong>do not</strong> imply sponsorship, affiliation, or endorsement. You must not represent otherwise.</p>
<h4>Right of Publicity & Trademark</h4>
<p>You agree not to infringe any person’s right of publicity, trademark, or other rights. 
You will not use the Service to suggest any false affiliation or endorsement. 
All names, brands, and marks belong to their respective owners. References are for <em>descriptive</em> purposes only.</p>
<h4>User Responsibility</h4>
<p>You are responsible for your marketing claims and legal compliance in your jurisdiction, including consumer protection and advertising laws.</p>`;
    h = h.replace(/<\/section>\s*<footer/i, `${block}\n</section>\n<footer`);
    // tiny “No endorsement” disclaimer in hero/intro if present
    h = h.replace(/(<h1[^>]*>[^<]*Terms[^<]*<\/h1>)/i, `$1\n<p class="note">Note: Persona styles are non-affiliative, non-endorsement “vibes” only.</p>`);
  }
  w(TOS,h.replace(/Abando™/g,'Abando<sup>™</sup>'));
}
function ensurePrivacy(){
  let h=r(PRIV); if(!h){console.warn('Privacy not found:',PRIV);return;}
  if(!/Generated Content & Personas/i.test(h)){
    const block = `
<h3>Generated Content & Personas</h3>
<p>When using persona style options, the Service generates copy based on prompts. 
We do not process biometric identifiers, voiceprints, or likeness data of public figures; the feature is stylistic only.</p>`;
    h = h.replace(/<\/section>\s*<footer/i, `${block}\n</section>\n<footer`);
  }
  w(PRIV,h.replace(/Abando™/g,'Abando<sup>™</sup>'));
}
function ensureDPA(){
  let h=r(DPA); if(!h){console.warn('DPA not found:',DPA);return;}
  if(!/Generated Marketing Text/i.test(h)){
    const block = `
<h3>Generated Marketing Text</h3>
<p>Processor may generate marketing text from Controller prompts. Processor does not create or process any biometric or likeness data 
of third parties in connection with persona style features; such features are stylistic only.</p>`;
    h = h.replace(/<\/section>\s*<footer/i, `${block}\n</section>\n<footer`);
  }
  w(DPA,h.replace(/Abando™/g,'Abando<sup>™</sup>'));
}
function patchPlaygroundDisclaimer(){
  let h=r(PLAY); if(!h){console.warn('Playground not found:',PLAY);return;}
  if(!/id="persona-disclaimer"/.test(h)){
    h = h.replace(/(<div class="persona-pills">[\s\S]*?<\/div>)/, `$1
<p id="persona-disclaimer" class="note" style="margin:.25rem 0 0">
  Personas are style inspirations only — no affiliation or endorsement.
</p>`);
  }
  w(PLAY,h.replace(/Abando™/g,'Abando<sup>™</sup>'));
}
ensureTerms(); ensurePrivacy(); ensureDPA(); patchPlaygroundDisclaimer();
console.log('✅ Legal: added No-Endorsement clauses + Playground disclaimer.');
