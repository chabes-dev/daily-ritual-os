/* Layout check in a real browser: every screen at phone, tablet and desktop widths, with long
   titles. Flags text squeezed into a sliver, anything spilling off the right edge, and page errors.
   Needs Playwright with Chromium (not installed by npm install here — it is large).
   Run from this folder:   npm run layout        or   node layout.cjs shots   to save screenshots */
const path=require('path'),fs=require('fs'),http=require('http');
let chromium;try{({chromium}=require('playwright'))}catch(e){({chromium}=require('/opt/node22/lib/node_modules/playwright'))}
const EXE=process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const SHOT=process.argv[2]==='shots',ONLY=process.argv[3]||'';
const ROOT=path.join(__dirname,'..'),OUT=path.join(__dirname,'shots');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return}
  r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
(async () => {
  await new Promise(r=>server.listen(0,r));const BASE='http://localhost:'+server.address().port;
  if(SHOT)fs.mkdirSync(OUT,{recursive:true});
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const out=[];
  for (const W of [390,768,900,1024,1280,1440]) {
    const mobile=W<500;
    const ctx = await browser.newContext({ viewport:{width:W,height:900}, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile?2:1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => out.push(`${W} ERROR ${e.message}`));
    await page.goto(BASE+'/index.html');
    await page.evaluate(()=>localStorage.clear());await page.reload();
    await page.evaluate(()=>{
      const D=n=>tAddPer(today(),n,'days');
      const L='renovação leonoappmodulo e seguro do carro com a corretora antiga';
      for(const d of TOWN_DEPTS){
        const a=tAdd(L+' '+d.id,d.id,'inbox');a.stakes=3;a.due=D(2);
        const b=tAdd('How to get ai to make me smart finance '+d.id,d.id,'inbox');tSet(b,'week');b.size=60;
        const c=tAdd(L,d.id,'inbox');c.wait={who:'My wife and the long-named insurance broker',since:D(-1),checkBack:D(3)};tSet(c,'waiting');
        const e=tAdd('Planejamento financeiro bella — tia na seguro tight',d.id,'inbox');e.wait={who:'Wife',since:D(-2),checkBack:null};tSet(e,'wife');
        const f=tAdd(L+' AI',d.id,'inbox');tSet(f,'ai');
        const g=tAdd(L+' later',d.id,'inbox');tSet(g,'later');g.back=D(8);
        const h=tAdd('Done thing with a fairly long title for the log '+d.id,d.id,'inbox');tSet(h,'done');
        S.town.cycles.push({id:nid(),title:'Dentist checkup with a long clinic name',who:'Léo Gimenes',type:'interval',n:6,unit:'months',lead:30,lastDone:null,nextDue:D(5),on:null,notes:'',dept:d.id,itemId:null,retired:false,created:Date.now()});
        S.town.depts[d.id].ref='Doctor: Dr. Paula Something-Very-Long\nRenewal: March';
      }
      const t=tAdd(L+' today','house','inbox');tSet(t,'week');t.today=today();
      const made=add('Work task with a really long title that should wrap nicely number 0\nBatch one with a long long long title\nAI one with a long title for delegation\nSpare one','work');
      assign('work','deep',made[0].id);assign('work','batch',made[1].id);assign('work','buffer',made[2].id);assign('work','next',made[3].id);
      if(typeof gAdd==='function'){
        S.goals.heading='Become the undeniable creative engine for LATAM — and build the life where we choose where we live.';
        const a=gAdd('File the EB1 application with the lawyer before the end of November','now');a.why='Freedom to choose. The window will not stay open.';a.next='Book the call with the lawyer';a.by=D(42);a.route='stuck';a.trail=[{date:'2026-10-05',route:'drifting',note:''},{date:'2026-10-12',route:'stuck',note:'no reply'}];
        const b=gAdd('New portfolio online','now');b.route='moving';b.by=D(42);
        gAdd('Two new exciting briefs on the table','now');
        const c=gAdd('Lead SOIP MX and the big BR Relax campaign','q');c.why='Proof that I can carry the region.';
        gAdd('Be the obvious successor if Rafa leaves','long');
        gAdd('Creative lead for LATAM, then the US','long');
        S.goals.rules.push({id:nid(),text:'Rafa is an ally. Never fight — keep bringing value.'},{id:nid(),text:'Make my value obvious to Luana and Pedro.'});
        const ws=S.items.filter(i=>i.mode==='work');ws[0].goal=a.id;ws[1].goal=c.id;
      }
      S.ui.mode='personal';S.ui.personalView='town';save();render()});
    const views=[
      ['town-home',`S.ui.mode='personal';S.ui.personalView='town';townNav('home')`],['today',`townNav('today')`],['ai',`townNav('ai')`],
      ['waiting',`townNav('waiting')`],['map',`townNav('map')`],
      ...['health','treasury','house','family','wishes','buy'].map(d=>['dept-'+d,`townNav('dept','${d}')`]),
      ['north',`S.ui.personalView='north';render()`],
      ['work-home',`S.ui.mode='work';S.ui.workView='home';render()`],['work-today',`S.ui.mode='work';S.ui.workView='today';render()`],
      ['work-backlog',`S.ui.mode='work';S.ui.workView='backlog';render()`],
      ['work-goals',`S.ui.mode='work';S.ui.workView='goals';render()`],
      ...[0,1,2,3,4,5].map(s=>['round-'+s,`S.ui.mode='personal';S.ui.personalView='town';render();if(TZ)tzClose();S.town.round={step:${s},startedAt:Date.now()};if(${s}===3)tStartRounds(S.town.round,0);save();tzOpen('round')`]),
      ...[0,1,2,3].map(s=>['move-'+s,`if(TZ)tzClose();S.town.move={date:today(),step:${s},mins:60};save();tzOpen('move')`]),
      ['item-sheet',`if(TZ)tzClose();S.ui.mode='personal';townNav('waiting');tItemSheet(S.town.items.find(i=>i.state==='waiting').id)`],
      ['cycle-sheet',`closeSheet();tCycSheet('health',S.town.cycles[0].id);document.querySelector('#tcmore').click()`],
      ['goal-sheet',`closeSheet();if(typeof gSheet==='function'&&S.goals&&S.goals.items[0]){S.ui.mode='work';S.ui.workView='goals';render();gSheet(S.goals.items[0].id)}`],
      ...[0,1,2,3,4,5].map(k=>['step-'+k,`closeSheet();if(TZ)tzClose();S.ui.mode='work';S.ui.workView='goals';render();S.goals.lastWord={date:today(),feel:'A bit lost after the holiday',close:'Lawyer email first thing, then the portfolio shortlist'};S.goals.step={at:${k},gi:0,startedAt:Date.now(),feel:'A bit lost after the holiday',ans:{},pick:S.goals.items[0].id,move:'Email the lawyer this morning',close:'',taskId:null};S.items.filter(i=>i.mode==='work').slice(0,3).forEach(i=>{i.done=true;i.doneAt=Date.now()});save();tzOpen('step')`]),
      ['step-close',`if(TZ)tzClose();render()`],
      ['goal-check',`closeSheet();if(typeof gCheckSheet==='function'){gCheckSheet()}`],
    ].filter(([n])=>!ONLY||n.includes(ONLY));
    for(const [name,js] of views){
      await page.evaluate(js);await page.waitForTimeout(SHOT&&/round|move|sheet|check|step/.test(name)?900:60);   /* let overlays finish fading in before a screenshot */
      const r=await page.evaluate(()=>{
        const bad=[];const vw=document.documentElement.clientWidth;
        const root=document.querySelector('#mlayer .sheet')||document.querySelector('.tzen')||document.getElementById('app');
        root.querySelectorAll('*').forEach(el=>{
          const own=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');
          if(own.length<8)return;const b=el.getBoundingClientRect();if(!b.width&&!b.height)return;
          const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')return;
          if(el.closest('.cols'))return;   /* the backlog board scrolls sideways on purpose */
          if(b.width<60&&b.height>60)bad.push('squeezed '+el.className+' "'+own.slice(0,30)+'" w='+Math.round(b.width));
          if(b.right>vw+2&&cs.position!=='fixed')bad.push('off right '+el.className+' "'+own.slice(0,25)+'" right='+Math.round(b.right));
        });
        const sw=document.documentElement.scrollWidth;if(sw>vw+1)bad.push('page scrolls sideways '+sw+'>'+vw);
        return [...new Set(bad)].slice(0,6)});
      if(r.length)out.push(`${W} ${name}: ${r.join(' | ')}`);
      if(SHOT)await page.screenshot({path:`${OUT}/${W}-${name}.png`,fullPage:!name.match(/round|move|sheet|check|step/)});
    }
    await ctx.close();
  }
  console.log(out.join('\n')||'clean');
  await browser.close();server.close();process.exit(out.length?1:0);
})();
