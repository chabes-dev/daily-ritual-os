/* Automatic checks for Daily Ritual OS — they open the app in a simulated browser (jsdom),
   press its buttons and confirm everything still works. Nothing here ships with the app.

   Run from this folder:   npm install   (once)   then   npm test

   Older versions of the app are read straight from git history, to check that old saved data
   still loads and that existing screens did not change by accident. REF (default: origin/main)
   is the version to compare against. */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const {JSDOM,VirtualConsole}=require('jsdom');
const REPO=path.join(__dirname,'..');
const HTML=fs.readFileSync(path.join(REPO,'index.html'),'utf8').replace(/<script src="\/app_1\.js"><\/script>/,'');
const NEW=fs.readFileSync(path.join(REPO,'app_1.js'),'utf8');
const gitShow=rev=>{try{return cp.execSync('git show '+rev+':app_1.js',{cwd:REPO,stdio:['ignore','pipe','ignore'],maxBuffer:64e6}).toString()}
  catch(e){console.log('  (could not read '+rev+' from git history — run: git fetch --unshallow)');process.exit(3)}};
const REF_REV=process.env.REF||'origin/main';
const OLD=gitShow('276201f');                 /* main before the almanac */
const PRETOWN=gitShow('5905f48');             /* main before Town */
const PRETOWN_HOME_REF=gitShow(REF_REV);      /* the version to compare screens against */

let pass=0,fail=0;const fails=[];
function ok(c,msg){if(c){pass++}else{fail++;fails.push(msg);console.log('  ✗ '+msg)}}
function section(t){console.log('\n— '+t)}

/* a fresh page. storage: a plain object shared between "reloads" */
function boot(code,store,opts={}){
  const errors=[];
  const vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(String(e&&e.message||e)));
  vc.on('error',e=>errors.push('console.error: '+e));
  const dom=new JSDOM(HTML,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://marcelo-os.test/',virtualConsole:vc,
    beforeParse(w){
      const mem=store;
      Object.defineProperty(w,'localStorage',{value:{
        getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]},clear:()=>{for(const k in mem)delete mem[k]}}});
      w.matchMedia=()=>({matches:!!opts.touch,addListener(){},removeListener(){}});
      w.Element.prototype.animate=function(){return {onfinish:null,cancel(){}}};
      w.__opened=[];w.open=u=>{w.__opened.push(u);return null};
      w.__clip=[];
      Object.defineProperty(w.navigator,'clipboard',{value:{writeText:t=>{w.__clip.push(t);return Promise.resolve()}}});
      w.document.execCommand=()=>true;
      w.addEventListener('error',e=>errors.push('onerror: '+e.message));
    }});
  const w=dom.window;
  const s=w.document.createElement('script');s.textContent=code;w.document.body.appendChild(s);
  const g=x=>w.eval(x);
  const $=q=>w.document.querySelector(q),$$=q=>[...w.document.querySelectorAll(q)];
  const click=el=>{if(typeof el==='string'){const e=$(el);if(!e)throw new Error('no element '+el);el=e}
    el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
  const key=(k,target)=>(target||w.document.body).dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true}));
  const type=(el,v)=>{if(typeof el==='string')el=$(el);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
  const enter=(el,v)=>{if(typeof el==='string')el=$(el);if(v!=null)type(el,v);key('Enter',el)};
  return {w,g,$,$$,click,key,type,enter,errors,store,close:()=>w.close()};
}
const tick=ms=>new Promise(r=>setTimeout(r,ms||0));
/* additions that are meant to change a screen — removed before side-by-side comparisons */
function intended(root){
  root.querySelectorAll('.hreset').forEach(e=>e.remove());                  /* energy reset card */
  root.querySelectorAll('.home-rituals').forEach(w=>w.replaceWith(...w.childNodes));
  root.querySelectorAll('.rbar').forEach(e=>e.remove());
  root.querySelectorAll('#hometile-ritual .ht-meta').forEach(e=>e.textContent=e.textContent.replace(/of \d+ steps/,'of N steps'));   /* the weekly mission step */
  return root}

/* drive a classic ritual (work zen) to the end by pressing its main button */
function runZen(P,mode){
  P.g(`S.ui.mode='${mode}';save();render();startZen()`);
  let guard=0;
  while(P.g('ZEN')&&guard++<80){
    const kind=P.g('ZKIND[ZSTEPS[ZI].id]');
    if(kind==='dump'){P.enter('#zcap',mode+' ritual item '+guard)}
    P.click('#zgo');
    while(P.g('TOPEN')&&guard++<200){
      if(P.$('[data-sort]'))P.click('[data-sort]');
      else if(P.$('[data-put="plain"]'))P.click('[data-put="plain"]');
      if(P.$('#mlayer #anyway'))P.click('#mlayer #anyway');
    }
  }
  return guard<80;
}
/* a lived-in Town: every state, every department */
const TOWN_SEED=`(()=>{const D=n=>tAddPer(today(),n,'days');
  for(const d of TOWN_DEPTS){
    tAdd('Inbox '+d.id,d.id,'inbox');
    const w=tAdd('Week '+d.id,d.id,'inbox');tSet(w,'week');w.size=30;
    const a=tAdd('AI '+d.id,d.id,'inbox');tSet(a,'ai');
    const x=tAdd('Wait '+d.id,d.id,'inbox');x.wait={who:'Clinic',since:D(-2),checkBack:D(1)};tSet(x,'waiting');
    const l=tAdd('Later '+d.id,d.id,'inbox');tSet(l,'later');l.back=D(9);
    const f=tAdd('Done '+d.id,d.id,'inbox');tSet(f,'done');
  }
  const h=tAdd('Wife thing','family','inbox');h.wait={who:'Wife',since:today(),checkBack:null};tSet(h,'wife');
  tAdd('Loose idea',null,'inbox');save()})()`;

(async()=>{
  /* ===================================================================== */
  section('1. empty data — new code loads');
  {
    const P=boot(NEW,{});
    ok(P.errors.length===0,'no errors on empty load: '+P.errors.join(' | '));
    ok(P.g('typeof S.town')==='object','S.town created');
    ok(P.g('S.town.items.length')===0,'town starts empty');
    ok(P.g('Object.keys(S.town.depts).length')===9,'9 departments with defaults');
    ok(P.g('S.town.aiTemplate.includes("{task}")'),'default AI template');
    P.g(`S.ui.mode='personal';S.ui.personalView='town';save();render()`);
    ok(!!P.$('#tround')&&!!P.$('#tmove'),'Town hall shows both ritual buttons');
    ok(P.g('S.town.adopted')===true,'adoption ran (nothing to copy)');
    ok(P.$$('.nav [data-v]').map(b=>b.dataset.v).join()==='town:home,town:today,town:ai,town:waiting,town:map,north','personal nav is Town');
    ok(!!P.$('#navspark'),'Journal ↗ kept');
    P.g(`S.ui.mode='work';render()`);
    ok(!P.$$('.nav [data-v]').some(b=>b.dataset.v.startsWith('town')),'work nav has no Town');
    ok(P.errors.length===0,'no errors rendering: '+P.errors.join(' | '));
    P.close();
  }

  /* ===================================================================== */
  section('2. data from before Town: personal tasks move in once, work untouched');
  const store={};
  {
    const O=boot(PRETOWN,store);
    O.g(`add('Book the dentist\\nRenew passport','personal');add('Write the SOIP deck\\nReply to Pedro','work');
      const p=S.items.find(i=>i.text==='Book the dentist');p.due='2099-01-01';S.north='Be great';save()`);
    ok(O.errors.length===0,'old code ran: '+O.errors.join(' | '));
    O.close();
    const before=JSON.parse(store['os_v3']).items.length;
    const P=boot(NEW,store);
    ok(P.errors.length===0,'new code loads old data: '+P.errors.join(' | '));
    ok(P.g('S.items.length')===before,'no items lost');
    ok(P.g(`S.town.items.filter(i=>i.from).map(i=>i.title).sort().join()`)==='Book the dentist,Renew passport','open personal tasks copied into Town');
    ok(P.g(`S.town.items.find(i=>i.title==='Book the dentist').due`)==='2099-01-01','due date carried');
    ok(P.g(`S.items.filter(i=>i.mode==='work').length`)===2,'work tasks untouched');
    ok(P.g('S.north')==='Be great','North Star text kept');
    P.close();
    const Q=boot(NEW,store);ok(Q.g('S.town.items.length')===2,'reload does not copy again');Q.close();
  }

  /* ===================================================================== */
  section('3. every view renders, both modes');
  const tstore={};
  {
    const P=boot(NEW,tstore);
    P.g(TOWN_SEED);
    P.g(`add('Write the SOIP deck\\nReply to Pedro\\nResearch prompts\\nPlan the shoot','work')`);
    for(const v of ['home','today','backlog']){P.g(`S.ui.mode='work';S.ui.workView='${v}';render()`);
      ok(P.$('#app').innerHTML.length>500,'work '+v+' renders')}
    for(const v of ['home','today','ai','waiting','map']){P.g(`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='${v}';render()`);
      ok(P.$('#app').innerHTML.length>500,'town '+v+' renders')}
    for(const d of P.g('TOWN_DEPTS.map(d=>d.id)')){P.g(`townNav('dept','${d}')`);ok(P.$('.tdeptpage')&&P.$('.tcycs'),'dept '+d+' renders')}
    P.g(`S.ui.personalView='north';render()`);ok(!!P.$('#northtext'),'North Star renders');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
  }

  /* ===================================================================== */
  section('4. work ritual, start to finish');
  {
    const P=boot(NEW,{...tstore});
    ok(runZen(P,'work'),'work ritual runs to the end');
    ok(!P.g('ZEN'),'ritual closed');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
  }

  /* ===================================================================== */
  section('5. weekly round — full run, with a pause and a reload');
  {
    const st={...tstore};let P=boot(NEW,st);
    P.g(`S.ui.mode='personal';S.ui.personalView='town';render();startRound()`);
    ok(P.g('TZ')==='round','round opens');
    P.click('#tzgo');P.click('#tzgo');   /* phrase, dump */
    ok(P.g('S.town.round.step')===2,'on the sort step');
    P.click('#tzexit');ok(!P.g('TZ')&&P.g('S.town.round.step')===2,'pause keeps the place');
    P.close();P=boot(NEW,st);
    P.g(`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='home';render()`);
    ok(P.$('#tround').textContent.includes('Continue'),'after a reload the hall offers to continue');
    P.click('#tround');ok(P.g('S.town.round.step')===2,'… and it resumes on the same step');
    let guard=0;while(P.g('TZ')==='round'&&guard++<40)P.click('#tzgo');
    ok(!P.g('S.town.round')&&!!P.g('S.town.lastRound'),'round closes and records when it ran');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
  }

  /* ===================================================================== */
  section('6. today’s move');
  {
    const P=boot(NEW,{...tstore});
    P.g(`S.ui.mode='personal';S.ui.personalView='town';render();startMove()`);
    ok(P.g('TZ')==='move','move opens');
    P.click('#tzgo');                                   /* spark */
    P.click('[data-tmins]:last-of-type');               /* time */
    ok(P.g('S.town.move.step')>=1,'time chosen');
    let guard=0;while(P.g('TZ')==='move'&&P.g('S.town.move&&S.town.move.step')!==2&&guard++<5)P.click('#tzgo');
    const t=P.$('#tzmid [data-ttoday]');if(t)P.click(t);
    guard=0;while(P.g('TZ')==='move'&&guard++<6)P.click('#tzgo');
    ok(!P.g('TZ'),'move ends');
    ok(P.g('S.town.items.filter(tIsToday).length')>=1,'something went on today');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
  }

  /* ===================================================================== */
  section('7. every control in both rituals, every tab and every department responds');
  {
    const P=boot(NEW,{...tstore});
    P.g(`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='home';save();render()`);
    const dead=[];
    const sweep=(label,open,sel)=>{
      P.g(open);const n=P.$$(sel).length;
      for(let k=0;k<n;k++){
        P.g(open);const b=P.$$(sel)[k];if(!b||b.disabled||b.classList.contains('sel')||b.dataset.tback)continue;
        const before=P.g('JSON.stringify(S)')+'|'+P.w.__opened.length+'|'+P.w.__clip.length;
        const html=P.$('body').innerHTML;
        P.click(b);
        const changed=P.g('JSON.stringify(S)')+'|'+P.w.__opened.length+'|'+P.w.__clip.length!==before||!!P.$('#mlayer').innerHTML||!!P.$('#dplayer').innerHTML||P.$('body').innerHTML!==html;
        if(!changed)dead.push(label+': '+(b.textContent.trim().slice(0,30)||b.className));
        P.g('closeSheet();closeDP()');
      }
    };
    for(let st=0;st<6;st++)sweep('round step '+(st+1),`if(TZ)tzClose();S.town.round={step:${st},startedAt:Date.now()};if(${st}===3)tStartRounds(S.town.round,0);save();tzOpen('round')`,'#tzmid button');
    for(let st=0;st<4;st++)sweep('move step '+(st+1),`if(TZ)tzClose();S.town.move={date:today(),step:${st},mins:30};save();tzOpen('move')`,'#tzmid button');
    P.g('if(TZ)tzClose();S.town.round=null;S.town.move=null;save()');
    for(const tv of ['home','today','ai','waiting','map'])
      sweep('tab '+tv,`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='${tv}';render()`,'#app .wrap > :not(.top):not(.nav):not(.foot) button');
    for(const d of ['health','treasury','house','family','kitchen','wardrobe','future','buy','wishes'])
      sweep('dept '+d,`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='dept';S.ui.townDept='${d}';render()`,'#app .wrap > :not(.top):not(.nav):not(.foot) button');
    for(const wv of ['home','today'])
      sweep('work '+wv,`S.ui.mode='work';S.ui.workView='${wv}';render()`,'#app .wrap > :not(.top):not(.nav):not(.foot) button:not([data-done]):not([data-unplan])');
    ok(dead.length===0,'no dead buttons: '+dead.join(' | '));
    ok(P.errors.length===0,'no errors clicking through: '+P.errors.join(' | '));
    await tick(30);P.close();
  }

  /* ===================================================================== */
  section('8. AI queue by department');
  {
    const P=boot(NEW,{});
    P.g(`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='ai';
      ['Cancel gym','Dispute fee','Find accountant'].forEach(t=>tSet(tAdd(t,'treasury','inbox'),'ai'));
      ['Find a cleaner','Quote the leak'].forEach(t=>tSet(tAdd(t,'house','inbox'),'ai'));
      tSet(tAdd('Book vaccines','health','inbox'),'ai');save();render()`);
    const tiles=P.$$('.taidept').map(b=>b.querySelector('.taidept-n').textContent+':'+b.querySelector('.taidept-c').textContent.trim());
    ok(tiles.join(' | ')==='All departments:6 left | Health:1 left | Treasury:3 left | House:2 left','overview tiles: '+tiles.join(' | '));
    P.click('[data-taidept="treasury"]');
    ok(P.$$('.taiitem').length===3&&P.$('.slotlabel').textContent.startsWith('Treasury'),'tap a department → only its items');
    const first=P.$('.taiitem').dataset.taisel;
    P.click(`.taipane [data-tsent="${first}"]`);P.click('#yes');
    ok(P.$('[data-taidept="treasury"] .taidept-c').textContent.includes('2 left'),'sending one: 2 left');
    P.click('[data-taidept="all"]');
    ok(P.$$('.taiitem').length===5,'All shows everything left');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
  }

  /* ===================================================================== */
  section('9. sync payload');
  {
    const P=boot(NEW,{...tstore});
    ok(!('ui' in JSON.parse(P.g('JSON.stringify(syncContent(S))'))),'device UI state is not synced');
    ok(P.g(`JSON.stringify(syncContent(S)).includes('Week health')`),'Town data is synced');
    P.close();
  }

  /* ===================================================================== */
  section('17. almanac — recurring cycles');
  {
    const old={};const O=boot(OLD,old);O.g(`S.ui.mode='personal';save()`);O.close();
    let P=boot(NEW,old);
    ok(P.errors.length===0,'old data loads: '+P.errors.join(' | '));
    ok(P.g('Array.isArray(S.town.cycles)&&S.town.cycles.length===0'),'S.town.cycles defaults to []');
    P.close();
    const bad={};P=boot(NEW,bad);
    P.g(`S.town.cycles=[{id:'a',title:'Vaccines',dept:'dogs',type:'weird',n:0,unit:'eons',lead:'x'},null,{id:'b'}];save()`);P.close();
    P=boot(NEW,bad);
    ok(P.g('S.town.cycles.length')===1,'invalid cycles dropped');
    ok(P.g(`JSON.stringify((c=>[c.dept,c.type,c.n,c.unit,c.lead,!!c.nextDue])(S.town.cycles[0]))`)==='["family","interval",1,"months",30,true]','a damaged cycle is repaired (Dogs → Family, safe defaults)');
    P.close();
    const bad2={};P=boot(NEW,bad2);P.g(`S.town.cycles={};save()`);P.close();P=boot(NEW,bad2);
    ok(P.g('Array.isArray(S.town.cycles)'),'non-array cycles reset');P.close();

    P=boot(NEW,{});
    const A=(a,n,u)=>P.g(`tAddPer('${a}',${n},'${u}')`);
    ok(A('2026-01-31',1,'months')==='2026-02-28','Jan 31 + 1 month = Feb 28');
    ok(A('2028-01-31',1,'months')==='2028-02-29','… Feb 29 in a leap year');
    ok(A('2028-02-29',1,'years')==='2029-02-28','Feb 29 + 1 year = Feb 28');
    ok(A('2026-11-15',3,'months')==='2027-02-15','months roll into next year');
    ok(A('2026-12-30',2,'weeks')==='2027-01-13','weeks');
    ok(A('2026-02-27',3,'days')==='2026-03-02','days');
    ok(P.g(`tCycAfter({type:'fixed',n:1,unit:'months',on:'2026-01-31'},'2026-02-28')`)==='2026-03-31','fixed monthly on the 31st does not drift after February');
    ok(P.g(`tCycAfter({type:'fixed',n:1,unit:'years',on:'2027-02-15'},'2026-10-01')`)==='2027-02-15','fixed: an anchor still ahead is the next date');

    P.g(`window.D=n=>tAddPer(today(),n,'days');
      window.mk=(o)=>{const c=Object.assign({id:nid(),title:'Cycle',who:'',type:'interval',n:6,unit:'months',lead:30,lastDone:null,
        nextDue:D(0),on:null,notes:'',dept:'health',itemId:null,retired:false,created:Date.now()},o);S.town.cycles.push(c);save();return c}`);
    P.g(`window.c1=mk({title:'Near',nextDue:D(20)});window.c2=mk({title:'Far',nextDue:D(40)});window.c3=mk({title:'Late',nextDue:D(-5)});
      window.c4=mk({title:'Gone',nextDue:D(3),retired:true});window.c5=mk({title:'Short lead',nextDue:D(10),lead:7})`);
    ok(P.g(`tCycComing('health').map(c=>c.title).join()`)==='Late,Near','within lead time or overdue, sorted by due; far, retired and short-lead stay quiet');
    ok(P.g(`tDeptBusy('health')`)===true&&P.g(`tDeptBusy('house')`)===false,'a coming cycle gives its department a round screen');
    P.close();

    const st={};P=boot(NEW,st);
    P.g(`window.D=n=>tAddPer(today(),n,'days');S.ui.mode='personal';S.ui.personalView='town';
      window.mk=(o)=>{const c=Object.assign({id:nid(),title:'Cycle',who:'',type:'interval',n:6,unit:'months',lead:30,lastDone:null,
        nextDue:D(0),on:null,notes:'',dept:'health',itemId:null,retired:false,created:Date.now()},o);S.town.cycles.push(c);save();return c};
      mk({id:'den',title:'Dentist',who:'Léo',nextDue:D(12),notes:'Dr. Paula'});
      mk({id:'vac',title:'Vaccines',who:'Luna',type:'fixed',n:1,unit:'years',on:D(5),nextDue:D(5),dept:'family'});
      mk({id:'tax',title:'Taxes',type:'fixed',n:1,unit:'years',on:D(-3),nextDue:D(-3),dept:'treasury'});
      mk({id:'ac',title:'AC filter',n:3,unit:'months',nextDue:D(2),dept:'house'});
      mk({id:'ins',title:'Car insurance',type:'fixed',n:1,unit:'years',on:D(25),nextDue:D(25),dept:'treasury'});
      mk({id:'far',title:'Passport',type:'fixed',n:10,unit:'years',on:D(900),nextDue:D(900),dept:'future'});
      save();render()`);
    P.g(`townNav('map')`);
    const tile=id=>(P.$(`[data-tdept="${id}"] .tsoon`)||{textContent:''}).textContent;
    ok(tile('health')==='↻ 1 coming up'&&tile('treasury')==='↻ 2 coming up'&&tile('future')==='','map tiles count what is coming up');
    P.g(`S.town.round={step:3,startedAt:Date.now()};tStartRounds(S.town.round,0);save();tzOpen('round')`);
    ok(P.g('S.town.round.depts.length')===4,'round visits only departments with something coming: '+P.g('S.town.round.depts.join()'));
    const goTo=id=>{P.g(`S.town.round.di=S.town.round.depts.indexOf('${id}');tEnterDept(S.town.round);save();tzPaint(true)`)};
    goTo('health');
    ok(P.$('#tzmid .zcarry-h')&&P.$('#tzmid .zcarry-h').textContent.includes('Coming up — 1'),'Coming up sits at the top of the department');
    ok(P.$('#tzmid').firstElementChild.classList.contains('zcarry-h'),'… first thing on the screen');
    ok(P.$('.tcycrow').textContent.includes('Dentist — Léo')&&P.$('.tcycrow').textContent.includes('due in 12 days'),'row shows title, who and when');
    ok(P.$$('.tcycrow [data-tcverd]').length===7,'all seven verdicts offered (incl. Done already)');
    P.click('[data-tcverd="den:week"]');
    let it=JSON.parse(P.g(`JSON.stringify(S.town.items.find(i=>i.cycle==='den'))`));
    ok(it&&it.state==='week'&&it.title==='Dentist — Léo'&&it.dept==='health'&&it.due===P.g('D(12)')&&it.notes==='Dr. Paula','This week → a regular item, linked, due date and notes carried');
    ok(P.g(`tCyc('den').itemId`)===it.id,'cycle remembers its item');
    ok(!P.$('.tcycrow'),'… and leaves Coming up');
    ok(P.g(`S.town.round.lists.health.includes('${it.id}')`),'the item joins the frozen list for this department');
    ok(P.$('.tvrow .tv-week.sel')&&P.$('#tzmid').textContent.includes('↻ almanac'),'shown below with its verdict selected and an almanac mark');
    ok(P.g(`tCycComing('health').length`)===0,'an open item keeps the cycle from coming up again');
    P.click(`[data-tverd="${it.id}:ai"]`);
    ok(P.g(`tById('${it.id}').state`)==='ai'&&P.g(`S.town.items.filter(i=>i.cycle==='den').length`)===1,'changing the verdict reuses the item');

    goTo('family');
    P.click('[data-tcverd="vac:waiting"]');
    ok(!!P.$('#mlayer #twho'),'Waiting opens the who sheet');
    P.type('#twho','Vet');P.click('#mlayer #yes');
    ok(P.g(`S.town.items.find(i=>i.cycle==='vac').state+'/'+S.town.items.find(i=>i.cycle==='vac').wait.who`)==='waiting/Vet','… item waiting on the vet');

    goTo('treasury');
    ok(P.$$('.tcycrow').map(r=>r.textContent.includes('Taxes')?'T':'I').join('')==='TI','overdue first');
    ok(P.$('.tcycrow .zd.late')&&P.$('.tcycrow .zd.late').textContent==='3 days late','overdue reads late');
    const taxDue=P.g(`tCyc('tax').nextDue`);
    P.click('[data-tcverd="tax:done"]');
    ok(P.g(`tCyc('tax').nextDue`)===P.g(`tAddPer('${taxDue}',1,'years')`)&&P.g(`tCyc('tax').lastDone`)===P.g('today()'),'Done already: fixed yearly rolls to the same date next year');
    ok(P.g(`S.town.items.find(i=>i.cycle==='tax').state`)==='done','… and is logged as done');
    P.click('[data-tcverd="ins:later"]');
    ok(!!P.$('#mlayer [data-tbk]'),'Not this week opens the date sheet');
    P.click('#mlayer [data-tbk]');
    ok(P.g(`S.town.items.find(i=>i.cycle==='ins').state`)==='later','… item parked for next week');

    goTo('house');
    P.click('[data-tcverd="ac:dropped"]');
    ok(P.$('#mlayer h3').textContent==='Skip this cycle once, or retire it?','Drop asks: skip once or retire');
    P.click('#mlayer #no');
    ok(P.g(`S.town.items.some(i=>i.cycle==='ac')`)===false&&!!P.$('.tcycrow'),'Cancel: nothing created, still coming up');
    const acDue=P.g(`tCyc('ac').nextDue`);
    P.click('[data-tcverd="ac:dropped"]');P.click('#mlayer #tcskip');
    ok(P.g(`tCyc('ac').nextDue`)===P.g(`tAddPer('${acDue}',3,'months')`)&&!P.g(`tCyc('ac').retired`),'Skip once: moves one period, stays active');
    ok(P.g(`tCyc('ac').lastDone`)===null,'… and is not logged as done');
    ok(P.g(`S.town.items.find(i=>i.cycle==='ac').state`)==='dropped'&&!P.$('.tcycrow'),'… the item is dropped and the cycle leaves Coming up');
    const acItem=P.g(`S.town.items.find(i=>i.cycle==='ac').id`);
    P.click(`[data-tverd="${acItem}:week"]`);
    ok(P.g(`tCyc('ac').nextDue`)===acDue&&P.g(`tCyc('ac').itemId`)===acItem,'re-deciding restores the cycle exactly');
    P.click(`[data-tverd="${acItem}:dropped"]`);P.click('#mlayer #tcret');
    ok(P.g(`tCyc('ac').retired`)===true&&P.g(`tById('${acItem}').state`)==='dropped','Retire: cycle retired, item dropped');
    ok(P.g(`tCycComing('house').length`)===0,'retired never comes up');
    P.click(`[data-tverd="${acItem}:done"]`);
    ok(P.g(`tCyc('ac').retired`)===false&&P.g(`tCyc('ac').lastDone`)===P.g('today()')&&P.g(`tCyc('ac').nextDue`)===P.g(`tAddPer(today(),3,'months')`),'dropped → done: un-retires, then rolls from today');
    ok(P.errors.length===0,'no errors in the round: '+P.errors.join(' | '));
    P.g('tzClose()');P.close();

    P=boot(NEW,st);
    const den=P.g(`S.town.items.find(i=>i.cycle==='den').id`);
    const before=P.g(`JSON.stringify(tCyc('den'))`);
    P.g(`S.ui.mode='personal';S.ui.personalView='town';townNav('ai')`);
    P.g(`tItemSheet('${den}')`);
    ok(P.$('#mlayer .zkept').textContent.includes('↻ almanac, every 6 months'),'item card says it comes from the almanac');
    P.click('#mlayer #tdone');
    ok(P.g(`tCyc('den').lastDone`)===P.g('today()')&&P.g(`tCyc('den').nextDue`)===P.g(`tAddPer(today(),6,'months')`),'interval: done today → next due = today + 6 months');
    ok(P.g(`tCyc('den').itemId`)===null,'… unlinked, ready for the next time');
    P.click('.toast .undo');
    ok(P.g(`JSON.stringify(tCyc('den'))`)===before,'Undo puts the cycle back exactly');
    ok(P.g(`tById('${den}').state`)==='ai','… and the item back where it was');
    const vac=P.g(`S.town.items.find(i=>i.cycle==='vac').id`),vDue=P.g(`tCyc('vac').nextDue`);
    P.g(`tLand(tById('${vac}'))`);P.type('#tnext','Take Luna to the vet on Friday');P.click('#mlayer #tadd');
    ok(P.g(`tCyc('vac').nextDue`)===P.g(`tAddPer('${vDue}',1,'years')`),'Landed → the cycle rolls to next year');
    const nx=JSON.parse(P.g(`JSON.stringify(S.town.items.find(i=>i.title==='Take Luna to the vet on Friday'))`));
    ok(nx&&nx.state==='inbox'&&!nx.cycle,'… the next step is an ordinary inbox item (existing flow)');
    P.g(`townNav('dept','treasury')`);
    ok(P.$$('.donerow .t').some(t=>t.textContent.startsWith('↻ Taxes')),'Done log marks the completion ↻');
    P.g(`S.town.cycles.find(c=>c.id==='den').nextDue=tAddPer(today(),10,'days');tSet(tById('${den}'),'week');save()`);
    ok(P.g(`tCycComing('health').length`)===0,'open item → quiet');
    P.g(`S.town.items=S.town.items.filter(i=>i.id!=='${den}');save()`);
    ok(P.g(`tCycComing('health').length`)===1,'item deleted → the cycle comes up again');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();

    const ds={};P=boot(NEW,ds);
    P.g(`S.ui.mode='personal';S.ui.personalView='town';townNav('dept','health')`);
    ok(P.$('.tcycs .slotlabel').textContent.startsWith('Almanac — 0')&&P.$('.tcycs .col-empty'),'empty almanac at the bottom of the department');
    ok(P.$('.tdeptpage').nextElementSibling===P.$('.tcycs'),'… below everything else');
    P.click('#tcycadd');
    ok(!!P.$('#mlayer #tcti')&&P.$('#mlayer [data-tctype="interval"]').classList.contains('on'),'Add opens the quick sheet (interval by default)');
    P.click('#mlayer #tcok');
    ok(P.g('S.town.cycles.length')===0&&!!P.$('#mlayer #tcti'),'no name → not added');
    P.type('#mlayer #tcti','Dentist');P.type('#mlayer #tcwho','Léo');
    P.type('#mlayer #tcn','6');P.click('#mlayer [data-tcu="months"]');
    P.click('#mlayer #tclast');
    const lastIso=P.g(`tAddPer(today(),-150,'days')`);
    P.g(`DPV.y=${+lastIso.slice(0,4)};DPV.m=${+lastIso.slice(5,7)-1};drawDP()`);
    P.click(`#dplayer [data-iso="${lastIso}"]`);
    ok(P.$('#mlayer .zkept').textContent.includes('Next due'),'shows the computed next due');
    P.click('#mlayer #tcok');
    let c=JSON.parse(P.g('JSON.stringify(S.town.cycles[0])'));
    ok(c&&c.title==='Dentist'&&c.who==='Léo'&&c.type==='interval'&&c.n===6&&c.unit==='months'&&c.dept==='health'&&c.lead===30,'interval cycle saved with defaults: '+JSON.stringify(c));
    ok(c.lastDone===lastIso&&c.nextDue===P.g(`tAddPer('${lastIso}',6,'months')`),'next due = last done + 6 months');
    ok(P.$$('.tcycline').length===1&&P.$('.tcycline').textContent.includes('Léo'),'listed on the department page');
    P.click('#tcycadd');
    ok(P.$$('#mlayer [data-tcw]').map(b=>b.textContent).join()==='Léo','who chips offer names already used');
    P.type('#mlayer #tcti','Checkup');P.click('#mlayer [data-tcw="Léo"]');
    P.click('#mlayer [data-tctype="fixed"]');
    ok(P.$$('#mlayer [data-tcu]').map(b=>b.dataset.tcu).join()==='months,years','fixed offers months or years');
    ok(P.$('#mlayer [data-tcu="years"]').classList.contains('on')&&P.$('#mlayer #tcn').value==='1'&&P.$('#mlayer #tcon').textContent==='Pick the date','a new fixed cycle starts yearly and asks for its date');
    P.click('#mlayer #tcok');
    ok(P.g('S.town.cycles.length')===1&&!!P.$('#mlayer #tcon'),'no date → not added');
    P.click('#mlayer [data-tcu="years"]');P.type('#mlayer #tcn','1');
    P.click('#mlayer #tcon');
    const fixIso=P.g(`tAddPer(today(),3,'days')`);
    P.g(`DPV.y=${+fixIso.slice(0,4)};DPV.m=${+fixIso.slice(5,7)-1};drawDP()`);
    P.click(`#dplayer [data-iso="${fixIso}"]`);
    P.click('#mlayer #tcmore');
    ok(!!P.$('#mlayer #tclead')&&!!P.$('#mlayer #tcnotes'),'More reveals lead time and notes');
    P.type('#mlayer #tclead','14');P.type('#mlayer #tcnotes','Fasting');
    P.click('#mlayer #tcok');
    c=JSON.parse(P.g(`JSON.stringify(S.town.cycles.find(c=>c.title==='Checkup'))`));
    ok(c.type==='fixed'&&c.who==='Léo'&&c.unit==='years'&&c.n===1&&c.nextDue===fixIso&&c.on===fixIso&&c.lead===14&&c.notes==='Fasting','fixed cycle saved: '+JSON.stringify(c));
    ok(P.$$('.tcycline .zt').map(e=>e.textContent.split(' · ')[0]).join()==='Checkup,Dentist','list sorted by next due');
    ok(P.$('.tcycline .ztag.cyc'),'the near one is marked coming up');
    const did=P.g(`S.town.cycles.find(c=>c.title==='Dentist').id`);
    P.click(`[data-tcyc="${did}"]`);
    ok(P.$('#mlayer h3').textContent.startsWith('Edit cycle')&&P.$('#mlayer #tcti').value==='Dentist','tap a row → edit sheet');
    P.type('#mlayer #tcn','4');P.click('#mlayer #tcok');
    ok(P.g(`tCyc('${did}').nextDue`)===P.g(`tAddPer('${lastIso}',4,'months')`),'editing the period recomputes next due');
    P.g(`tCyc('${did}').nextDue='2099-01-01';save();render()`);
    P.click(`[data-tcyc="${did}"]`);P.type('#mlayer #tcwho','Léo M.');P.click('#mlayer #tcok');
    ok(P.g(`tCyc('${did}').nextDue`)==='2099-01-01'&&P.g(`tCyc('${did}').who`)==='Léo M.','renaming leaves the dates alone');
    P.click(`[data-tcyc="${did}"]`);P.click('#mlayer #tcmore');P.click('#mlayer [data-tcdp="family"]');P.click('#mlayer #tcok');
    ok(P.g(`tCyc('${did}').dept`)==='family'&&P.$$('.tcycline').length===1,'edit can move it to another department');
    P.g(`townNav('dept','family')`);
    P.click(`[data-tcyc="${did}"]`);P.click('#mlayer #tcmore');P.click('#mlayer #tcdue');
    const ovIso=P.g(`tAddPer(today(),20,'days')`);
    P.g(`DPV.y=${+ovIso.slice(0,4)};DPV.m=${+ovIso.slice(5,7)-1};drawDP()`);P.click(`#dplayer [data-iso="${ovIso}"]`);
    P.type('#mlayer #tcn','5');P.click('#mlayer #tcok');
    ok(P.g(`tCyc('${did}').nextDue`)===ovIso&&P.g(`tCyc('${did}').n`)===5,'next-due override sticks');
    P.g(`townNav('dept','health')`);
    const cid=P.g(`S.town.cycles.find(c=>c.title==='Checkup').id`);
    P.click(`[data-tcyc="${cid}"]`);P.click('#mlayer #tcretire');
    ok(P.g(`tCyc('${cid}').retired`)===true&&P.$$('.tcycline').length===0&&P.$('#tcycret'),'Retire hides it under a collapsed Retired list');
    P.click('#tcycret');
    ok(P.$$('.tcycline.off').length===1,'… which you can open');
    P.click(`[data-tcyc="${cid}"]`);
    ok(P.$('#mlayer #tcretire').textContent==='Bring it back','retired cycle offers Bring it back');
    P.click('#mlayer #tcretire');
    ok(P.g(`tCyc('${cid}').retired`)===false,'… and it is back');
    P.g(`tCycPlant(tCyc('${cid}'))`);
    P.click(`[data-tcyc="${cid}"]`);P.click('#mlayer #tcdel');
    ok(P.$('#mlayer h3').textContent==='Delete this cycle?','delete asks first');
    P.click('#mlayer #yes');
    ok(!P.g(`tCyc('${cid}')`)&&P.g(`S.town.items.some(i=>i.title.startsWith('Checkup')&&!i.cycle)`),'deleted; the item it planted stays, unlinked');
    ok(P.g(`JSON.parse(JSON.stringify(S)).town.cycles.length`)===1,'backup export (JSON of S) carries cycles');
    ok(P.g(`JSON.stringify(syncContent(S)).includes('Dentist')`),'sync payload carries cycles');
    P.close();
    P=boot(NEW,ds);
    ok(P.g('S.town.cycles.length')===1&&P.g('S.town.cycles[0].who')==='Léo M.','survives a reload');
    ok(P.errors.length===0,'no errors on the department page: '+P.errors.join(' | '));
    P.close();

    P=boot(NEW,{...st},{touch:true});
    P.g(`S.ui.mode='personal';S.ui.personalView='town';townNav('dept','treasury')`);
    ok(P.$$('.tcycline').length===2,'phone: department almanac renders');
    P.click('#tcycadd');ok(!!P.$('#mlayer #tcn')&&P.$('#mlayer #tcn').getAttribute('inputmode')==='numeric','phone: numeric keypad for the period');
    P.g('closeSheet()');
    const dead=[];
    const sweep=(label,open,sel)=>{P.g(open);const n=P.$$(sel).length;
      for(let k=0;k<n;k++){P.g(open);const b=P.$$(sel)[k];if(!b||b.classList.contains('on'))continue;
        const before=P.g('JSON.stringify(S)'),html=P.$('body').innerHTML;P.click(b);
        if(P.g('JSON.stringify(S)')===before&&!P.$('#dplayer').innerHTML&&P.$('body').innerHTML===html)dead.push(label+': '+b.textContent.trim().slice(0,30));
        P.g('closeDP();closeSheet()')}};
    sweep('dept page',`townNav('dept','treasury')`,'.tcycs button, .tcycs [data-tcyc]');
    sweep('cycle sheet',`closeSheet();tCycSheet('treasury',S.town.cycles.find(c=>c.id==='ins').id)`,'#mlayer button');
    sweep('new cycle sheet',`closeSheet();tCycSheet('treasury')`,'#mlayer button');
    ok(dead.length===0,'no dead almanac controls: '+dead.join(' | '));
    ok(P.errors.length===0,'no errors on phone: '+P.errors.join(' | '));
    await tick(30);P.close();
  }

  /* ===================================================================== */
  section('18. home screens: one-tap copy');
  if(!NEW.includes('tcopyall'))console.log('  (skipped — not on this branch)');else{
    const P=boot(NEW,{});
    P.g(`S.ui.mode='work';S.ui.workView='home';save();render()`);
    ok(!!P.$('#hcopy')&&P.$('.hcopy span').textContent.includes('nothing picked'),'work home has Copy today (empty state says so)');
    P.click('#hcopy');await tick(5);
    ok(P.w.__clip.length===0&&P.$('.toast').textContent.includes('nothing picked'),'empty plan: nothing copied, says why');
    P.g(`const [a,b,c]=add('Write the SOIP deck\\nReply to Pedro\\nResearch prompts','work','brief');
      assign('work','deep',a.id);assign('work','batch',b.id);assign('work','buffer',c.id);S.ui.workView='home';save();render()`);
    ok(P.$('.hcopy span').textContent==='3 on today’s plan','shows how many lines it will copy');
    P.click('#hcopy');await tick(5);
    ok(P.w.__clip[0]===P.g(`planText('work')`)&&P.w.__clip[0]==='DEEP / Write the SOIP deck\nBATCH / Reply to Pedro\nDELEGATE TO AI / Research prompts','copies the same text as the ritual’s paper step: '+JSON.stringify(P.w.__clip[0]));
    ok(!P.$('#tcopyall'),'Town button is not on the work home');
    P.g(`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='home';save();render()`);
    ok(!!P.$('#tcopyall')&&!P.$('#hcopy'),'Town hall has Copy today + this week');
    P.click('#tcopyall');await tick(5);
    ok(P.w.__clip.length===1&&P.$$('.toast').some(t=>t.textContent.includes('nothing on today')),'empty week: nothing copied, says why');
    P.g(`const a=tAdd('Call the bank','treasury','inbox');tSet(a,'week');a.size=10;
      const b=tAdd('Book vaccines','family','inbox');tSet(b,'week');b.today=today();b.stakes=3;
      const c=tAdd('Fix the shelf','house','inbox');tSet(c,'week');c.home=true;
      const d=tAdd('Inbox thing','house','inbox');const e=tAdd('Waiting thing','house','inbox');tSet(e,'waiting');
      setWeekPhrase('Play with Léo');save();render()`);
    ok(P.$('.hcopy span').textContent==='1 on today · 2 more this week','counts today and the rest of the week: '+P.$('.hcopy span').textContent);
    P.click('#tcopyall');await tick(5);
    ok(P.w.__clip[1]==='THIS WEEK IS GOOD IF / Play with Léo\nTODAY / Book vaccines (Family)\nTHIS WEEK / Call the bank (Treasury) · 10 min\nTHIS WEEK / Fix the shelf (House) · after work','today first, then the week; inbox and waiting left out: '+JSON.stringify(P.w.__clip[1]));
    P.g(`setWeekPhrase('');S.town.items.forEach(i=>{if(i.state==='week')tSet(i,'done')});save();render()`);
    P.click('#tcopyall');await tick(5);
    ok(P.w.__clip.length===2,'nothing left on the week → nothing copied');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    await tick(30);P.close();
  }

  /* ===================================================================== */
  section('19. goals tab (work)');
  {
    /* old data gains goals with safe defaults; damaged data is repaired */
    const old={};const O=boot(OLD,old);O.g(`add('Old work task','work');save()`);O.close();
    let P=boot(NEW,old);
    ok(P.errors.length===0,'old data loads: '+P.errors.join(' | '));
    ok(P.g(`JSON.stringify({...S.goals,lines:undefined})`)==='{"heading":"","items":[],"rules":[],"lastCheck":null,"missions":[]}','S.goals defaults');
    ok(P.g('S.goals.lines.map(l=>l.id).join()')==='l1,l2,l3,l4'&&P.g('S.goals.lines[0].text').includes('Jason Bagley'),'lines that move you start with your four (fixed ids, so two devices merge cleanly)');
    ok(P.g(`S.items.length`)===1,'work tasks untouched');
    P.close();
    const bad={};P=boot(NEW,bad);
    P.g(`S.goals={heading:5,items:[{id:'a',title:'Visa',horizon:'zzz',state:'?',trail:'x',route:'fast'},{id:'b'},null],rules:[{id:'r',text:''},{id:'s',text:'Rafa is an ally'}]};save()`);P.close();
    P=boot(NEW,bad);
    ok(P.g(`JSON.stringify([S.goals.heading,S.goals.items.length,S.goals.items[0].horizon,S.goals.items[0].state,Array.isArray(S.goals.items[0].trail),S.goals.items[0].route,S.goals.rules.length])`)==='["",1,"now","active",true,null,1]','damaged goals repaired, empties dropped');
    P.close();
    /* goals saved by the first version: This year / Further and weekly entries move over */
    const v1={};P=boot(NEW,v1);
    P.g(`S.goals.items=[{id:'y',title:'Lead SOIP',horizon:'year',state:'active',trail:[{week:'2026-10-12',route:'moving',note:'ok'}],why:'',next:''},
      {id:'f',title:'LATAM lead',horizon:'far',state:'active',trail:[],why:'',next:''},{id:'n',title:'EB1',horizon:'now',state:'active',trail:[],why:'',next:''}];save()`);P.close();
    P=boot(NEW,v1);
    ok(P.g(`S.goals.items.map(x=>x.horizon).join()`)==='long,long,now','This year and Further → A year or more; Now stays');
    ok(P.g(`JSON.stringify(gById('y').trail)`)==='[{"route":"moving","note":"ok","date":"2026-10-12"}]','old weekly entries keep their date');
    P.close();

    /* the tab */
    const st={};P=boot(NEW,st);
    P.g(`S.ui.mode='work';S.ui.workView='home';save();render()`);
    ok(P.$$('.nav [data-v]').map(b=>b.dataset.v).join()==='home,today,backlog,goals','Goals tab sits after Home, Today, Backlog');
    ok(P.$('.nav [data-v="goals"]').textContent==='Goals','the tab is just its name');
    P.click('.nav [data-v="goals"]');
    ok(P.g('S.ui.workView')==='goals'&&!!P.$('#gheading'),'the tab opens Goals');
    ok(P.$$('.gcol').length===3&&P.$$('.gcol .slotlabel').map(e=>e.textContent).join()==='Now — 0,3 months — 0,A year or more — 0','three horizons: Now, 3 months, a year or more');
    ok(P.$('#gcheck').textContent.includes('Step back')&&!P.$('#gquick'),'check-in is a ritual; no quick update until there are goals');
    P.type('#gheading','Become the undeniable creative lead for LATAM.');
    ok(P.g('S.goals.heading')==='Become the undeniable creative lead for LATAM.','heading autosaves');
    /* add goals: one, then a pasted list */
    P.enter('[data-gadd="now"]','File the EB1 application');
    ok(P.g(`S.goals.items.map(x=>x.title+'/'+x.horizon).join()`)==='File the EB1 application/now','Enter adds a goal to its horizon');
    P.enter('[data-gadd="now"]','• New portfolio online\n- Two new exciting briefs\n\n');
    ok(P.g(`S.goals.items.filter(x=>x.horizon==='now').map(x=>x.title).join('|')`)==='File the EB1 application|New portfolio online|Two new exciting briefs','pasting several lines adds several (bullets stripped, blanks skipped)');
    P.enter('[data-gadd="q"]','Lead SOIP MX and BR Relax');
    P.enter('[data-gadd="long"]','Creative lead for LATAM, then the US');
    ok(P.$$('.gcard').length===5,'cards render');
    ok(P.$('[data-gadd="long"]')===P.w.document.activeElement,'focus stays in the add box for the next one');
    /* ground rules */
    P.enter('#gruleadd','Rafa is an ally — never fight him');P.enter('#gruleadd','Make my value obvious to Luana and Pedro');
    ok(P.$$('[data-gredit]').length===2,'ground rules added');
    P.click('[data-gredit]');P.type('#mlayer #f','Rafa is an ally. Never fight.');P.click('#mlayer #yes');
    ok(P.g('S.goals.rules[0].text')==='Rafa is an ally. Never fight.','tap a rule to edit it');
    const r2=P.g('S.goals.rules[1].id');P.click(`[data-grdel="${r2}"]`);
    ok(P.g('S.goals.rules.length')===1,'× removes a rule');
    P.click('.toast .undo');ok(P.g('S.goals.rules.length')===2,'… with undo');

    /* goal sheet */
    const eb=P.g(`S.goals.items[0].id`);
    P.click(`[data-gopen="${eb}"]`);
    ok(!!P.$('#mlayer #gti')&&P.$('#mlayer #gti').value==='File the EB1 application','tap a goal → its card');
    P.type('#mlayer #gwhy','Freedom to choose where we live.');
    P.type('#mlayer #gnext','Book the call with the lawyer');
    P.click('#mlayer [data-gby]:nth-child(2)');
    P.click('#mlayer [data-grt="moving"]');
    let x=JSON.parse(P.g(`JSON.stringify(gById('${eb}'))`));
    ok(x.why==='Freedom to choose where we live.'&&x.next==='Book the call with the lawyer'&&x.by===P.g('gMonthEnd(0)')&&x.route==='moving','why, next step, date and route save as you go');
    P.enter('#mlayer #gtadd','Collect award certificates');
    ok(P.g(`S.items.find(i=>i.text==='Collect award certificates').goal`)===eb&&P.g(`S.items.find(i=>i.text==='Collect award certificates').sorted`)===false,'a task added from the goal is linked and waits in Sort');
    ok(P.$$('#mlayer .gtask').length===1,'… and listed on the goal');
    P.click('#mlayer [data-ghz="q"]');ok(P.g(`gById('${eb}').horizon`)==='q','horizon can change');
    ok(P.$$('#mlayer [data-gby]').map(b=>b.textContent).join('|')==='No date|End of this month|End of next month|In 3 months|In a year','by-when choices match the horizons');
    P.click('#mlayer [data-ghz="now"]');
    P.click('#mlayer #gok');
    ok(P.$(`[data-gopen="${eb}"]`).textContent.includes('Next → Book the call')&&P.$(`[data-gopen="${eb}"]`).textContent.includes('1 task on it'),'card shows next step and linked tasks');

    /* link an existing task from its own card; the today card shows the link */
    P.g(`const [t]=add('Draft the SOIP MX idea','work','brief');t.sorted=true;assign('work','deep',t.id);S.ui.workView='today';render()`);
    const tid=P.g(`S.items.find(i=>i.text==='Draft the SOIP MX idea').id`);
    P.g(`openDetail('${tid}')`);
    ok(P.$$('#mlayer [data-dgoal]').length===6,'task card offers every active goal + No');
    const soip=P.g(`S.goals.items.find(x=>x.horizon==='q').id`);
    P.click(`#mlayer [data-dgoal="${soip}"]`);
    ok(P.g(`byId('${tid}').goal`)===soip,'task linked to a goal');
    P.click('#mlayer #dclose');
    ok(P.$('.deep .ggoal')&&P.$('.deep .ggoal').textContent.includes('Lead SOIP MX'),'the deep card shows which goal it moves');
    P.g(`openDetail('${tid}')`);P.click('#mlayer [data-dgoal=""]');P.click('#mlayer #dclose');
    ok(P.g(`byId('${tid}').goal`)===undefined&&!P.$('.deep .ggoal'),'… and can be unlinked');
    P.g(`byId('${tid}').goal='${soip}';save()`);

    /* on purpose, currently: what's on the board right now */
    P.g(`S.items.filter(i=>i.mode==='work'&&!i.done).forEach(i=>{clearFromPlan('work',i.id);setBucket(i,'backlog')});
      const [a,b,c,d]=add('On it\\nNot on it\\nParked in backlog\\nAlso on it','work','brief');[a,b,c,d].forEach(i=>i.sorted=true);
      a.goal='${eb}';d.goal='${soip}';c.goal='${eb}';setBucket(c,'backlog');
      const [e,f,g]=add('Linked done\\nUnlinked done\\nOld linked','work');e.goal='${eb}';g.goal='${eb}';
      [e,f,g].forEach(i=>{i.done=true;i.doneAt=Date.now()});g.doneAt=Date.now()-14*864e5;S.ui.workView='goals';save();render()`);
    ok(P.$('.gmeter .ht-label').textContent==='On purpose, currently','labelled “currently”, not “this week”');
    ok(P.$('.gmeter .gbig').textContent==='2 of 3'&&P.$('.gmeter .gbar i').style.width==='67%','2 of the 3 things on the board move a goal (backlog not counted)');
    ok(P.$('.gmeter .ht-meta').textContent.includes('last 7 days: 1 of 2 finished moved one'),'plus the last 7 days of finished work');
    P.g(`gById('${soip}').state='dropped';save();render()`);
    ok(P.$('.gmeter .gbig').textContent==='1 of 3','a let-go goal no longer counts');
    P.g(`gById('${soip}').state='active';save();render()`);

    /* goals check-in — whenever you want, no schedule */
    ok(P.$('#gcheck .ht-label').textContent.startsWith('Goals check-in')&&P.$('#gcheck').textContent.includes('whenever you need it')&&!/due|week/i.test(P.$('#gcheck').textContent),'called Goals check-in, no schedule');
    P.click('#gquick');
    ok(P.$$('#mlayer .gci').length===5,'check-in lists every active goal');
    P.click('#mlayer #gcok');
    ok(!!P.$('#mlayer .gci')&&P.g('S.goals.lastCheck')===null,'saving with nothing rated is refused');
    P.click(`#mlayer [data-gcr="${eb}:stuck"]`);
    P.type(`#mlayer [data-gcn="${eb}"]`,'Lawyer has not replied');
    P.click(`#mlayer [data-gcr="${soip}:moving"]`);
    P.type(`#mlayer [data-gcx="${soip}"]`,'Share the first route with Rafa');
    P.click('#mlayer #gcok');
    x=JSON.parse(P.g(`JSON.stringify(gById('${eb}'))`));
    ok(x.route==='stuck'&&x.trail.length===1&&x.trail[0].route==='stuck'&&x.trail[0].note==='Lawyer has not replied'&&x.trail[0].date===P.g('today()'),'route and a dated entry saved');
    ok(P.g(`gById('${soip}').next`)==='Share the first route with Rafa','next step edited in the check-in');
    ok(P.$$('.toast').some(t=>t.textContent.includes('1 stuck')),'a stuck goal gets a nudge');
    ok(P.$('#gcheck').textContent.includes('last one today')&&P.$('.nav [data-v="goals"]').textContent==='Goals','shows when the last one was; tab name stays plain');
    P.click('#gquick');P.click(`#mlayer [data-gcr="${eb}:moving"]`);P.click('#mlayer #gcok');
    ok(P.g(`gById('${eb}').trail.length`)===1&&P.g(`gById('${eb}').trail[0].route`)==='moving','checking in twice on one day keeps the latest, not both');
    ok(P.$(`[data-gopen="${eb}"] .gtrail i`),'card shows the trail');
    P.g(`S.goals.lastCheck=Date.now()-40*864e5;save();render()`);
    ok(P.$('#gcheck').textContent.includes('last one 40 days ago')&&!/due/i.test(P.$('#gcheck').textContent),'weeks later it just says when — never nags');

    /* achieved / let go / delete */
    P.click(`[data-gopen="${eb}"]`);P.click('#mlayer #gwin');
    ok(P.g(`gById('${eb}').state`)==='achieved'&&P.$$('.gwin').length===1&&!P.$(`.gcard[data-gopen="${eb}"]`),'Achieved → moves to Wins');
    P.click(`.gwin[data-gopen="${eb}"]`);P.click('#mlayer #gback');P.click('#mlayer #gok');
    ok(P.g(`gById('${eb}').state`)==='active'&&!!P.$(`.gcard[data-gopen="${eb}"]`),'… and can come back');
    const far=P.g(`S.goals.items.find(x=>x.horizon==='long').id`);
    P.click(`[data-gopen="${far}"]`);P.click('#mlayer #gdrop');
    ok(P.g(`gById('${far}').state`)==='dropped'&&P.$('#gletgo'),'Let it go → collapsed under Let go');
    P.click('#gletgo');ok(P.$$('.gwin').length===1,'… which opens');
    P.click(`[data-gopen="${soip}"]`);P.click('#mlayer #gdel');P.click('#mlayer #yes');
    ok(!P.g(`gById('${soip}')`)&&P.g(`byId('${tid}').goal`)===undefined,'delete removes the goal and unlinks its tasks');

    /* home strip, persistence, backup, sync */
    P.g(`S.ui.workView='home';render()`);
    const homeTxt=P.$('#app').textContent;
    ok(!/LATAM|EB1|Goals ·|check-in/i.test(homeTxt.replace(/\bGoals\b(?=\s*$)/m,''))&&!P.$('.hgoal')&&!P.$('[data-hv="goals"]'),'nothing from Goals on the work home screen');
    ok(P.g(`JSON.parse(JSON.stringify(S)).goals.items.length`)===4,'backup (JSON of S) carries goals');
    ok(P.g(`JSON.stringify(syncContent(S)).includes('EB1')`),'sync carries goals');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
    P=boot(NEW,st);
    ok(P.g('S.goals.items.length')===4&&P.g('S.goals.heading').startsWith('Become')&&P.g('S.goals.rules.length')===2,'survives a reload');
    P.g(`S.ui.workView='goals';save()`);P.close();P=boot(NEW,st);
    ok(P.g('S.ui.workView')==='goals'&&!!P.$('#gheading'),'reopens on the Goals tab');
    /* typing in Goals never fires the global keys */
    P.$('#gheading').focus();P.key('2',P.$('#gheading'));P.key('t',P.$('#gheading'));
    ok(P.g('S.ui.mode')==='work'&&!P.g('TOPEN'),'typing 2 or t in a goal field does not switch mode or open Sort');
    /* every control responds */
    const dead=[];
    const sweep=(label,open,sel)=>{P.g(open);const n=P.$$(sel).length;
      for(let k=0;k<n;k++){P.g(open);const b=P.$$(sel)[k];if(!b||b.classList.contains('on'))continue;
        const before=P.g('JSON.stringify(S)'),html=P.$('body').innerHTML;P.click(b);
        if(P.g('JSON.stringify(S)')===before&&!P.$('#dplayer').innerHTML&&P.$('body').innerHTML===html)dead.push(label+': '+b.textContent.trim().slice(0,30));
        P.g('closeDP();closeSheet()')}};
    sweep('goals tab',`closeSheet();S.ui.mode='work';S.ui.workView='goals';render()`,'#app .wrap > :not(.top):not(.nav):not(.foot) button, #app [data-gopen], #app [data-gredit]');
    sweep('goal sheet',`closeSheet();gSheet(S.goals.items.find(x=>x.state==='active').id)`,'#mlayer button');
    sweep('check-in',`closeSheet();gCheckSheet()`,'#mlayer button');
    ok(dead.length===0,'no dead goal controls: '+dead.join(' | '));
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    await tick(30);P.close();
  }

  /* the work home screen is exactly what it was before Goals existed */
  {
    const seed=`add('Write the SOIP deck\\nReply to Pedro','work');S.ui.mode='work';S.ui.workView='home';save();render()`;
    const A=boot(PRETOWN_HOME_REF,{});A.g(seed);const before=intended(A.$('.home-grid').cloneNode(true)).outerHTML.replace(/\s+/g,' ');A.close();
    const B=boot(NEW,{});B.g(seed);B.g(`gAdd('File the EB1 application','now');S.goals.heading='Big direction';save();render()`);
    const after=intended(B.$('.home-grid').cloneNode(true)).outerHTML.replace(/\s+/g,' ');B.close();
    ok(after===before,'work home shows nothing from Goals, even with goals set');
  }

  /* ===================================================================== */
  section('20. side by side with the live version ('+REF_REV+'): screens a change does not mean to touch stay identical');
  {
    const seed=TOWN_SEED+`;(()=>{const m=add('Write the SOIP deck\\nReply to Pedro\\nResearch prompts\\nPlan the shoot\\nOld idea','work');
      m.forEach(i=>{i.sorted=true;i.lane='important'});assign('work','deep',m[0].id);assign('work','batch',m[1].id);assign('work','buffer',m[2].id);
      setBucket(m[4],'backlog');m[3].done=true;m[3].doneAt=Date.now();save()})()`;
    const views=[['work home',`S.ui.mode='work';S.ui.workView='home';render()`],['work today',`S.ui.mode='work';S.ui.workView='today';render()`],
      ['work backlog',`S.ui.mode='work';S.ui.workView='backlog';render()`],
      ...['home','today','ai','waiting','map'].map(v=>['town '+v,`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='${v}';render()`]),
      ['town dept',`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='dept';S.ui.townDept='health';render()`],
      ['north star',`S.ui.mode='personal';S.ui.personalView='north';render()`]];
    /* random ids and spacing differ between runs; what you see must not */
    const norm=h=>h.replace(/="[a-z0-9]{8}(:[a-z0-9]+)?"/g,'="ID"').replace(/\s+/g,' ').replace(/> </g,'><');
    const snap=(code)=>{const st={};const P=boot(code,st);P.g(seed);const out={};
      for(const [n,js] of views){P.g(js);const a=intended(P.$('#app').cloneNode(true));a.querySelectorAll('.nav').forEach(e=>e.remove());
        out[n]=norm(a.innerHTML)}
      const wid=P.g(`S.items.find(i=>i.mode==='work'&&!i.done).id`);P.g(`S.ui.mode='work';render();openDetail('${wid}')`);
      out['work task card']=norm(P.$('#mlayer').innerHTML);P.g('closeSheet()');
      out.navWork=(P.g(`S.ui.mode='work';render()`),P.$$('.nav [data-v]').map(b=>b.textContent).join('|'));
      out.navPersonal=(P.g(`S.ui.mode='personal';S.ui.personalView='town';render()`),P.$$('.nav [data-v]').map(b=>b.textContent).join('|'));
      out.err=P.errors.join('|');P.close();return out};
    /* ids differ between runs, so compare structure: strip ids, then text and markup must match */
    const A=snap(PRETOWN_HOME_REF),B=snap(NEW);
    const dif=(a,b)=>{let i=0;while(i<a.length&&a[i]===b[i])i++;return '\n      live: …'+a.slice(Math.max(0,i-80),i+120)+'\n      new : …'+b.slice(Math.max(0,i-80),i+120)};
    for(const [n] of views)ok(A[n]===B[n],n+' is unchanged'+(A[n]===B[n]?'':dif(A[n],B[n])));
    ok(A['work task card']===B['work task card'],'work task card is unchanged when no goals exist'+(A['work task card']===B['work task card']?'':dif(A['work task card'],B['work task card'])));
    ok(B.navWork===A.navWork,'work tabs unchanged ('+B.navWork+')');
    ok(A.navPersonal===B.navPersonal,'personal tabs unchanged');
    ok(!A.err&&!B.err,'no errors in either: '+A.err+B.err);
  }


  /* ===================================================================== */
  section('21. step back — the goals check-in as a ritual');
  {
    const st={};let P=boot(NEW,st);
    P.g(`S.ui.mode='work';S.ui.workView='goals';
      S.goals.heading='Be the creative engine LATAM can’t do without.';
      S.goals.rules=[{id:'r1',text:'Rafa is an ally. Never fight.'}];
      const a=gAdd('File the EB1 application','now');a.next='Book the lawyer call';a.why='Freedom to choose.';
      const b=gAdd('New portfolio online','now');
      const c=gAdd('Pay conversation','q');
      const [t1,t2,t3]=add('Collect awards\\nReply to Pedro\\nVery old thing','work');t1.goal=a.id;
      [t1,t2,t3].forEach(i=>{i.done=true;i.doneAt=Date.now()-864e5});t3.doneAt=Date.now()-40*864e5;
      save();render()`);
    const ids=P.g(`JSON.stringify(S.goals.items.map(x=>x.id))`),[ga,gb,gc]=JSON.parse(ids);
    const ritualBefore=P.g('JSON.stringify(S.ritual)');
    ok(P.$('#gcheck .ht-label').textContent.includes('a ritual')&&!!P.$('#gquick'),'Goals tab: the check-in is a ritual, quick update still there');
    P.click('#gcheck');
    ok(P.g('TZ')==='step'&&P.$('#tzname').textContent==='How are you, honestly?','1 · arrive');
    P.type('#gsfeel','A bit lost after the holiday');
    P.click('#gsspark');ok(P.w.__opened.includes(P.g('SPARK_URL')),'Spark opens from the first step');
    P.key('Enter',P.$('#gsfeel'));ok(P.g('S.goals.step.at')===0,'Enter inside the text box does not skip ahead');
    P.key('Enter');ok(P.g('S.goals.step.at')===1,'Enter (outside a text box) moves on, like the other rituals');
    ok(P.$('.gsheading').textContent.startsWith('Be the creative engine')&&P.$('.gsrule').textContent.includes('Rafa'),'2 · re-read: heading and ground rules');
    P.click('#tzgo');
    ok(P.$('.gsbig').textContent==='2'&&P.$('#tzmid').textContent.includes('1 moved a goal'),'3 · wins: finished since last time (first time: two weeks), how many moved a goal');
    ok(P.$('#tzmid .zci').textContent.startsWith('◎ Collect awards')&&!P.$('#tzmid').textContent.includes('Very old thing'),'… linked ones first; older work not counted');
    P.click('#tzgo');
    ok(P.$('#tzname').textContent==='File the EB1 application'&&P.$('#tzstep').textContent.includes('goal 1 of 3')&&P.$('#tznote').textContent.includes('Freedom to choose'),'4 · route: one goal at a time, with its why');
    ok(P.$('#gsnext').value==='Book the lawyer call','… next step prefilled');
    P.click('[data-gsr="stuck"]');P.type('#gsnote','Lawyer silent');
    P.click('#tzgo');
    ok(P.$('#tzname').textContent==='New portfolio online','next goal');
    P.click('[data-gsr="moving"]');
    P.click('#tzback');
    ok(P.$('#tzname').textContent==='File the EB1 application'&&P.$('[data-gsr="stuck"]').classList.contains('sel')&&P.$('#gsnote').value==='Lawyer silent','back keeps what you answered');
    P.click('#tzgo');P.click('#tzgo');P.click('#tzgo');
    ok(P.$('#tzname').textContent==='One move','5 · one move (the unrated goal is fine to skip)');
    ok(P.$('[data-gspick].sel').textContent.includes('File the EB1')&&P.$('#gsmove').value==='Book the lawyer call','… starts on the stuck goal, its next step ready');
    P.type('#gsmove','Email the lawyer today');
    P.click('#tzgo');
    let tsk=JSON.parse(P.g(`JSON.stringify(S.items.filter(i=>i.text==='Email the lawyer today'))`));
    ok(tsk.length===1&&tsk[0].goal===ga&&tsk[0].sorted===false&&!tsk[0].done,'the move becomes a task in Sort, linked to the goal');
    P.click('#tzback');P.type('#gsmove','Email the lawyer this morning');P.click('#tzgo');
    ok(P.g(`S.items.filter(i=>i.goal==='${ga}'&&!i.done).length`)===1&&P.g(`S.items.some(i=>i.text==='Email the lawyer this morning')`),'going back and changing it edits the same task — no duplicates');
    ok(P.$('#tzname').textContent==='What will you do on purpose now?','6 · close');
    /* pause, reload, resume */
    P.click('#tzexit');ok(!P.g('TZ')&&P.g('S.goals.step.at')===5,'Pause keeps the place');
    P.close();P=boot(NEW,st);
    P.g(`S.ui.mode='work';S.ui.workView='goals';render()`);
    ok(P.$('#gcheck').textContent.includes('Continue stepping back')&&P.$('#gcheck').textContent.includes('step 6 of 6'),'after a reload the tab offers to continue');
    P.click('#gcheck');
    ok(P.$('#tzname').textContent==='What will you do on purpose now?'&&P.g('S.goals.step.feel')==='A bit lost after the holiday','… resumes where it was, answers kept');
    P.type('#gsclose','Lawyer email first thing, then the portfolio shortlist');
    P.click('#tzgo');
    ok(!P.g('TZ')&&P.g('S.goals.step')===null,'Close ends the ritual');
    const A=JSON.parse(P.g(`JSON.stringify(gById('${ga}'))`)),B=JSON.parse(P.g(`JSON.stringify(gById('${gb}'))`)),Cc=JSON.parse(P.g(`JSON.stringify(gById('${gc}'))`));
    ok(A.route==='stuck'&&A.trail.length===1&&A.trail[0].note==='Lawyer silent'&&A.trail[0].date===P.g('today()')&&A.next==='Email the lawyer this morning','stuck goal: route, dated note and the new next step saved');
    ok(B.route==='moving'&&B.trail.length===1,'moving goal saved');
    ok(Cc.route===null&&Cc.trail.length===0,'the unrated goal is left as it was');
    ok(P.g('!!S.goals.lastCheck')&&P.g('S.goals.lastWord.close')==='Lawyer email first thing, then the portfolio shortlist'&&P.g('S.goals.lastWord.feel')==='A bit lost after the holiday','what you said is kept for next time');
    ok(P.$$('.toast').some(t=>t.textContent.includes('2 goals checked')),'toast says how many were checked');
    ok(P.$('#gcheck').textContent.includes('Step back again')&&P.$('#gcheck').textContent.includes('last one today'),'tab shows it was done today');
    ok(P.g('JSON.stringify(S.ritual)')===ritualBefore&&!P.g('ZEN'),'the work ritual is untouched');
    /* the next time: last words shown on re-read; wins counted since the last check-in */
    P.g(`const [n]=add('Shortlist done','work');n.done=true;n.doneAt=Date.now()+1000;save()`);
    P.click('#gcheck');P.click('#tzgo');
    ok(P.$('.gslast').textContent.includes('Lawyer email first thing')&&P.$('#tzmid').textContent.includes('A bit lost'),'next time, re-read shows what you said last time');
    P.click('#tzgo');ok(P.$('.gsbig').textContent==='1'&&P.$('#tzmid').textContent.includes('since '),'wins count from the last check-in');
    P.key('Escape');ok(!P.g('TZ')&&!!P.g('S.goals.step'),'Escape pauses');
    /* a goal deleted while paused; then every goal let go */
    P.g(`S.goals.step.at=3;S.goals.step.gi=2;S.goals.items=S.goals.items.filter(x=>x.id!=='${gc}');save();render()`);
    P.click('#gcheck');ok(P.$('#tzname').textContent==='New portfolio online','a goal deleted while paused: lands on the last one still there');
    P.g(`tzClose();S.goals.items.forEach(x=>x.state='dropped');save();render()`);
    P.click('#gcheck');P.g('S.goals.step.at=3;save();tzPaint(true)');
    ok(P.$('#tzmid').textContent.includes('No goals yet'),'no active goals: the route step says so');
    P.click('#tzgo');ok(P.$('#tzmid').textContent.includes('nothing to move'),'… and so does the move step');
    P.click('#tzgo');P.click('#tzgo');ok(!P.g('TZ')&&P.g('S.goals.step')===null,'… and it still closes cleanly');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();

    /* empty heading: write it during the ritual; phone; every control responds */
    P=boot(NEW,{},{touch:true});
    P.g(`S.ui.mode='work';S.ui.workView='goals';gAdd('One goal','now');save();render()`);
    P.click('#gcheck');P.click('#tzgo');
    ok(!!P.$('#gshead'),'no heading yet → re-read lets you write it');
    P.type('#gshead','Where it is all going');ok(P.g('S.goals.heading')==='Where it is all going','… saved to the Goals tab');
    const dead=[];
    for(let k=0;k<6;k++){
      const open=`if(TZ)tzClose();S.goals.step={at:${k},gi:0,startedAt:Date.now(),feel:'',ans:{},pick:S.goals.items[0].id,move:'x',close:'',taskId:null};save();tzOpen('step')`;
      P.g(open);const n=P.$$('#tzmid button').length;
      for(let j=0;j<n;j++){P.g(open);const b=P.$$('#tzmid button')[j];
        const before=P.g('JSON.stringify(S)')+P.w.__opened.length,html=P.$('body').innerHTML;P.click(b);
        if(P.g('JSON.stringify(S)')+P.w.__opened.length===before&&P.$('body').innerHTML===html)dead.push('step '+(k+1)+': '+b.textContent.trim().slice(0,30))}}
    P.g('if(TZ)tzClose()');
    ok(dead.length===0,'no dead buttons in the ritual: '+dead.join(' | '));
    /* the move starts on a stuck goal even when it is not the first one */
    {const Q=boot(NEW,{});Q.g(`S.ui.mode='work';S.ui.workView='goals';gAdd('Fine one','now');const s=gAdd('Stuck one','q');s.next='Unblock it';save();render()`);
      Q.click('#gcheck');Q.click('#tzgo');Q.click('#tzgo');Q.click('#tzgo');
      Q.click('[data-gsr="moving"]');Q.click('#tzgo');Q.click('[data-gsr="stuck"]');Q.click('#tzgo');
      ok(Q.$('[data-gspick].sel').textContent.includes('Stuck one')&&Q.$('#gsmove').value==='Unblock it','the move starts on the stuck goal, wherever it is');
      Q.click('[data-gspick]:not(.sel)');ok(Q.$('[data-gspick].sel').textContent.includes('Fine one'),'… and you can pick another');
      Q.g('tzClose()');Q.close()}
    /* damaged step state from another device is dropped, not fatal */
    P.g(`S.goals.step={at:'x'};save()`);P.close();
    P=boot(NEW,P.store);ok(P.g('S.goals.step')===null&&P.errors.length===0,'damaged ritual state is reset on load');
    P.close();
  }

  /* ===================================================================== */
  section('22. energy reset (work)');
  {
    const CLAUDE='https://claude.ai/project/01a0ef2a-a707-739c-bf11-e42eafa6b207';
    const desk={};let P=boot(NEW,desk);
    P.g(`S.ui.mode='work';S.ui.workView='home';
      S.goals.heading='Be the creative engine LATAM can’t do without.';gAdd('Creative lead for LATAM','long');gAdd('File EB1','now');
      const [d]=add('Write the SOIP deck intro','work','brief');d.sorted=true;assign('work','deep',d.id);S.ui.workView='home';save();render()`);
    ok(P.$('.home-rituals #hometile-ritual')&&P.$('.home-rituals #hometile-reset'),'work home: Energy reset sits beside the work ritual');
    ok(P.$('#hometile-reset').textContent.includes('Stuck? Reset')&&!/links|timer/i.test(P.$('.hreset').textContent),'… just the card');
    P.g(`S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='home';render()`);
    ok(!P.$('#hometile-reset'),'not on the personal side');
    P.g(`S.ui.mode='work';S.ui.workView='home';render()`);
    const zenBefore=P.g('JSON.stringify(S.ritual)');
    P.click('#hometile-reset');
    ok(P.g('TZ')==='reset'&&P.$('#zen').classList.contains('rzen')&&P.$('#tzname').textContent==='Close email and Webex','1 · close email and Webex');
    ok(P.$('#tzgo').textContent==='Done'&&P.$('#tzmid').textContent.trim()===''&&!P.$('[data-until]'),'… only a Done button — no timer, no settings');
    ok(!!P.$('#tzback'),'… and a way back (out of the ritual)');
    P.click('#tzback');ok(!P.g('TZ')&&P.g('S.reset.at')===0,'back on step 1 leaves the ritual, keeping its place');
    P.click('#hometile-reset');
    P.click('#tzgo');
    ok(P.$('#tzname').textContent==='What are you avoiding?'&&!!P.$('.rhand'),'Done → 2 · name it (with a nudge to take the phone)');
    P.type('#ravoid','The SOIP deck intro');
    P.click('#tzgo');
    ok(P.$('#tzname').textContent==='Get the blood moving'&&P.$$('[data-rmove]').map(b=>b.textContent).join('|')==='💧 Water|🙆 Stretch|🚶 Move|☀️ Sun & air|🎵 Play music','3 · move — with Play music as a check, no link');
    ok(!P.$('#tzmid a'),'… nothing to open');
    P.click('[data-rmove="water"]');P.click('[data-rmove="music"]');
    ok(P.g('JSON.stringify(S.reset.moved)')==='{"water":true,"music":true}','… ticks what you did');
    /* — the phone takes over — */
    const phone={};Object.keys(desk).forEach(k=>phone[k]=desk[k]);
    const dd=JSON.parse(phone.os_v3);dd.ui={mode:'personal',personalView:'town',townView:'home',sawHome:true,open:{}};phone.os_v3=JSON.stringify(dd);
    P.close();
    let Q=boot(NEW,phone,{touch:true});
    ok(Q.g('TZ')==='reset'&&Q.$('#tzname').textContent==='Get the blood moving'&&Q.$$('[data-rmove].on').length===2,'phone: opening the app lands back on the same step');
    Q.click('#tzgo');
    ok(Q.$('#tzname').textContent.startsWith('Talk it out')&&Q.$('#rclaude').getAttribute('href')===CLAUDE,'4 · talk it out — Open Claude goes to your project');
    ok(!Q.$('[data-until]')&&!Q.$('#rtalkgo'),'… no timer');
    const pts=Q.$('.rpoints').textContent;
    ok(pts.includes('The SOIP deck intro')&&pts.includes('creative engine LATAM')&&pts.includes('Creative lead for LATAM')&&!pts.includes('File EB1'),'talking points from what you named and your Goals');
    /* the link is changed right here, not in a pop-up */
    Q.click('[data-redit="claude"]');
    ok(!!Q.$('#tzmid #rlink')&&!Q.$('#mlayer .sheet'),'change the Claude link in place — no pop-up');
    Q.type('#rlink','not a link');Q.click('#rlinksave');
    ok(Q.$('#rlinkmsg').textContent.includes('https://')&&Q.g('S.resetCfg.claude')===CLAUDE,'a bad link is refused');
    Q.type('#rlink','https://claude.ai/project/new1');Q.click('#rlinksave');
    ok(Q.g('S.resetCfg.claude')==='https://claude.ai/project/new1'&&Q.$('#rclaude').getAttribute('href')==='https://claude.ai/project/new1'&&!Q.$('#rlink'),'saved, used at once');
    Q.click('[data-redit="claude"]');Q.click('#rlinkx');ok(!Q.$('#rlink'),'cancel closes it');
    ok(Q.$('.rpt.rq').textContent.includes('Kill it, shrink it, or keep it?'),'Stacey’s questions are on screen to say out loud');
    ok(Q.$('#rspark').getAttribute('href')===Q.g('SPARK_URL'),'… and Spark is one tap away');
    Q.click('#rtpl');await tick(5);
    const tpl=Q.w.__clip.at(-1);
    ok(tpl.startsWith('What I’m avoiding: The SOIP deck intro')&&tpl.includes('Why am I avoiding it?')&&tpl.includes('Why do I care about it?')&&tpl.includes('Kill it, shrink it, or keep it?')&&tpl.includes('doesn’t depend on anyone')&&tpl.includes('coolest thing'),'copy the writing template for Spark — Stacey’s questions, filled with what you named');
    ok(Q.w.__clip.at(-1).includes('avoiding: The SOIP deck intro'),'copy an opener for Claude');
    Q.click('#tzgo');
    ok(Q.$('#tzname').textContent==='What’s the coolest thing about this?'&&Q.$('#tzmid').textContent.includes('The SOIP deck intro')&&Q.$('#tzgo').textContent==='Skip','5 · the coolest thing about it — optional (Skip)');
    ok(Q.$('#tznote').textContent.includes('ad breakfast')&&Q.$('#rreel').href===Q.g('REEL_URL'),'… written like an ad breakfast note, with Reel there if you need a spark');
    ok(!!Q.$('[data-redit="reel"]'),'… its link can be changed here too');
    Q.type('#rcool','The switchers insight — imagine it live, everyone would see themselves');
    ok(Q.g('S.reset.cool').startsWith('The switchers')&&Q.$('#tzgo').textContent==='Skip','… saved as you type');
    Q.g('tzPaint(false)');ok(Q.$('#tzgo').textContent==='Next','… Next once written');
    Q.click('#tzgo');
    ok(Q.$('#tzname').textContent==='What are the first 2-minute moves?'&&Q.$('.rpt').textContent.includes('Write the SOIP deck intro'),'6 · moves, with today’s deep work');
    ok(Q.$('#rmovenew').getAttribute('placeholder').startsWith('Write one ugly headline'),'… “write one ugly headline” to get going');
    ok(Q.$('#tzgo').textContent==='Next','… the button is Next, not a timer');
    Q.enter('#rmovenew','Write one ugly headline');
    Q.enter('#rmovenew','• List the 3 proof points\n- Ask Rafa for the old deck\n\n');
    ok(Q.g('JSON.stringify(S.reset.moves.map(x=>x.text))')==='["Write one ugly headline","List the 3 proof points","Ask Rafa for the old deck"]','brain dump: ⏎ adds one, a pasted list adds them all');
    Q.click(`[data-rmdel="${Q.g('S.reset.moves[1].id')}"]`);ok(Q.g('S.reset.moves.length')===2,'× removes one');
    Q.type('#rtalk','Claude: the intro is just the problem in one line. Start there.');
    ok(Q.g('S.reset.talk').startsWith('Claude: the intro'),'paste what you and Claude landed on');
    Q.click('[data-rhelp="move"]');
    Q.type('#rmovenew','Typed but not entered');
    /* pause on the phone, finish back at the desk */
    Q.click('#tzexit');
    ok(!Q.g('TZ')&&Q.$('.rbar')&&Q.$('.rbar').textContent.includes('6 of 7'),'Pause: the bar keeps it one tap away');
    const back={};Object.keys(phone).forEach(k=>back[k]=phone[k]);
    const bd=JSON.parse(back.os_v3);bd.ui={mode:'work',workView:'today',sawHome:true,open:{}};back.os_v3=JSON.stringify(bd);
    Q.close();
    P=boot(NEW,back);
    ok(P.g('TZ')==='reset'&&P.$('#tzname').textContent==='What are the first 2-minute moves?'&&P.$$('.rmove').length===2,'back at the desk: same step, same moves');
    P.type('#rmovenew','Typed but not entered');P.click('#tzgo');
    ok(P.g('S.reset.moves.length')===3,'a move typed but not ⏎’d still counts when you tap Next');
    ok(P.$('#tzname').textContent==='Focus'&&P.$('#tzgo').textContent==='Start 25 min'&&P.$('#tznote').textContent.includes('music'),'7 · focus: start 25 min, put on some music');
    ok(P.$$('[data-rmins]').map(b=>b.textContent).join()==='15 min,25 min,45 min,60 min','… pick another length here');
    P.click('[data-rmins="45"]');ok(P.$('#tzgo').textContent==='Start 45 min'&&P.g('S.resetCfg.focus')===45,'… remembered for next time');
    P.click('[data-rmins="25"]');
    P.click('#tzgo');
    const fu=P.g('S.reset.focusUntil');
    ok(Math.abs(fu-(Date.now()+25*6e4))<5000&&P.g('TZ')==='reset'&&P.$('.rclock[data-until]'),'the clock runs inside the ritual — it stays open');
    ok(P.$('#tzgo').textContent==='Close the reset','… and can be closed when you’re done');
    P.click(`[data-rmdone="${P.g('S.reset.moves[0].id')}"]`);
    ok(P.$$('.rmove.rcheck.on').length===1,'tick moves off while the clock runs');
    /* the clock follows the reset to the other device, and runs out on screen */
    P.g(`S.reset.focusUntil=Date.now()+700;save();tzPaint(false)`);await tick(1800);
    ok(P.$('#tzname').textContent==='Time. Nice.'&&P.$('.rclock.over'),'when time is up it says so, still in the ritual');
    P.click('#tzback');ok(P.$('#tzname').textContent==='What are the first 2-minute moves?','back works from the last step too');
    P.click('#tzgo');P.click('#tzgo');
    ok(!P.g('TZ')&&P.g('S.reset')===null,'Done closes the reset');
    const log=JSON.parse(P.g('JSON.stringify(S.resetLog)'));
    ok(log.length===1&&log[0].moves.length===3&&log[0].done===1&&log[0].talk.startsWith('Claude:')&&log[0].helped.join()==='move'&&log[0].cool.startsWith('The switchers'),'kept quietly: moves, what you did, the summary, the coolest thing, what helped');
    ok(P.$$('.toast').some(t=>t.textContent.includes('1 move done')),'toast');
    P.g(`S.ui.workView='home';render()`);
    ok(P.$('#hometile-reset').textContent.includes('Stuck? Reset')&&!P.$('#hometile-reset [data-until]'),'home card is back to itself — no countdown in it');
    ok(!/\d+ resets?/i.test(P.$('#app').textContent),'no count of resets anywhere');
    ok(P.g('JSON.stringify(S.ritual)')===zenBefore&&!P.g('ZEN'),'the work ritual is untouched');
    ok(P.g(`JSON.stringify(syncContent(S)).includes('resetCfg')`),'reset state and links travel with sync');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();

    /* every step can go back */
    P=boot(NEW,{});
    for(let k=1;k<7;k++){P.g(`if(TZ)tzClose();S.ui.mode='work';startReset();S.reset.at=${k};save();tzPaint(true)`);P.click('#tzback');
      ok(P.g('S.reset.at')===k-1,'back from step '+(k+1))}
    P.g('endReset()');
    /* a running focus clock shows in the bar when the ritual is paused */
    P.g(`startReset();S.reset.at=6;S.reset.focusUntil=Date.now()+5*6e4;save();tzPause();render()`);
    ok(P.$('.rbar').textContent.includes('focus')&&P.$('.rbar [data-until]'),'paused during focus: the bar shows the clock');
    P.click('#rbargo');ok(P.g('TZ')==='reset'&&P.$('.rclock[data-until]'),'Continue goes straight back to the clock');
    P.click('#rfocusreset');ok(P.g('S.reset.focusUntil')===null&&P.$('#tzgo').textContent.startsWith('Start'),'the clock can be restarted');
    P.g('endReset()');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();

    /* a reset started in the first version carries over to the new steps */
    const v1={};P=boot(NEW,v1);
    P.g(`S.reset={at:4,startedAt:Date.now(),avoiding:'x',moved:{water:true},protectedUntil:Date.now(),talkUntil:Date.now(),musicOn:true,reelOpened:false,firstMove:'Old first move',helped:[]};
      S.resetCfg={claude:'https://claude.ai/projects',music:'https://youtube.com/x',reel:'https://reel.app',protect:60,talk:10,focus:30};S.focus={until:Date.now()+9e5};save()`);P.close();
    P=boot(NEW,v1);
    ok(P.$('#tzname').textContent==='What’s the coolest thing about this?'&&P.g('S.reset.moved.music')===true&&P.g('S.reset.moves[0].text')==='Old first move'&&P.g('S.reset.v')===3,'an old reset on the soundtrack step lands on the coolest-thing step, nothing lost');
    ok(P.g('JSON.stringify(S.resetCfg)')===JSON.stringify({claude:CLAUDE,reel:'https://reel.app',focus:30})&&P.g("'focus' in S")===false,'old settings tidied: links kept, timers gone');
    P.g('tzClose()');P.close();
    /* damaged state is repaired, never fatal */
    const bad={};P=boot(NEW,bad);P.g(`S.reset={at:99,startedAt:Date.now(),v:2};S.resetCfg={claude:'javascript:alert(1)',focus:'x'};save()`);P.close();
    P=boot(NEW,bad);
    ok(P.g('S.reset.at')===0&&P.g('S.resetCfg.claude')===CLAUDE&&P.g('S.resetCfg.focus')===25&&P.errors.length===0,'damaged reset data repaired (no unsafe links)');
    P.g('if(TZ)tzClose();endReset()');P.close();
    /* stale reset: no auto-open; Continue / End from the bar */
    const old={};P=boot(NEW,old);
    P.g(`S.ui.mode='work';S.ui.workView='today';S.reset={v:2,at:2,startedAt:Date.now()-4*36e5,avoiding:'x',moved:{},moves:[],talk:'',helped:[]};save()`);P.close();
    P=boot(NEW,old);
    ok(!P.g('TZ')&&!!P.$('.rbar'),'a reset from hours ago does not jump up by itself, but the bar is there');
    P.click('#rbargo');ok(P.g('TZ')==='reset'&&P.$('#tzname').textContent==='Get the blood moving','Continue opens it');
    P.key('Escape');ok(!P.g('TZ')&&!!P.g('S.reset'),'Escape pauses');
    P.click('#rbarend');P.click('#mlayer #yes');ok(P.g('S.reset')===null&&!P.$('.rbar'),'End clears it');
    P.g(`S.ui.workView='home';render();startZen()`);P.g('startReset()');ok(!P.g('ZEN')&&P.g('TZ')==='reset','starting a reset steps out of the work ritual');
    P.g('S.reset.at=1;save();tzPaint(true)');
    P.key('Enter',P.$('#ravoid'));ok(P.g('S.reset.at')===1,'Enter inside the box does not skip');
    P.key('Enter');ok(P.g('S.reset.at')===2,'Enter outside moves on');
    P.g('endReset()');
    P.g(`window.__pulled=0;syncPull=()=>{__pulled++};SY={id:'x',k:null,etag:'e',dirty:false}`);
    P.w.dispatchEvent(new P.w.Event('focus'));
    ok(P.g('__pulled')===1,'window focus checks for updates from the other device');
    P.g('SY=null');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
    /* every button responds, on a phone */
    P=boot(NEW,{},{touch:true});
    const dead=[];
    for(let k=0;k<7;k++){
      const open=`if(TZ)tzClose();S.ui.mode='work';S.reset={v:3,at:${k},startedAt:Date.now(),avoiding:'x',moved:{},reelOpened:false,moves:[{id:'m1',text:'One',done:false}],talk:'',helped:[],focusMins:25,focusUntil:null};REDIT=null;save();tzOpen('reset')`;
      /* plain links (Open Claude) navigate — their addresses are checked above */
      P.g(open);const n=P.$$('#zen button').length;
      for(let j=0;j<n;j++){P.g(open);const b=P.$$('#zen button')[j];
        const before=P.g('JSON.stringify(S)')+P.w.__clip.length,html=P.$('body').innerHTML;P.click(b);await tick(70);
        if(P.g('JSON.stringify(S)')+P.w.__clip.length===before&&P.$('body').innerHTML===html)dead.push('step '+(k+1)+': '+b.textContent.trim().slice(0,30))}}
    ok(dead.length===0,'no dead buttons in the reset: '+dead.join(' | '));
    ok(P.errors.length===0,'no errors on phone: '+P.errors.join(' | '));
    await tick(30);P.close();
  }

  /* ===================================================================== */
  section('23. sync: merge instead of asking; housekeeping is not an edit');
  {
    let P=boot(NEW,{});
    const M=(b,l,r)=>JSON.parse(P.g(`JSON.stringify(syncMerge3(${JSON.stringify(b)},${JSON.stringify(l)},${JSON.stringify(r)},''))`));
    const t=(id,text,x)=>Object.assign({id,text},x||{});
    ok(JSON.stringify(M({a:1},{a:2},{a:2}))==='{"v":{"a":2}}','same change on both → no question');
    ok(JSON.stringify(M({a:1,b:1},{a:2,b:1},{a:1,b:3}))==='{"v":{"a":2,"b":3}}','different fields → both kept');
    let r=M({items:[t('1','A'),t('2','B')]},{items:[t('1','A edited'),t('2','B')]},{items:[t('1','A'),t('2','B done',{done:true})]});
    ok(JSON.stringify(r.v.items)==='[{"id":"1","text":"A edited"},{"id":"2","text":"B done","done":true}]','different tasks edited on each device → both edits');
    r=M({items:[t('1','A')]},{items:[t('1','A'),t('2','new here')]},{items:[t('1','A'),t('3','new there')]});
    ok(r.v.items.map(x=>x.id).join()==='1,2,3','a new task on each device → both kept');
    r=M({items:[t('1','A'),t('2','B')]},{items:[t('2','B')]},{items:[t('1','A'),t('2','B edited there')]});
    ok(r.v.items.map(x=>x.id+x.text).join()==='2B edited there','deleted here, untouched there → stays deleted (while other edits merge)');
    r=M({items:[t('1','A'),t('2','B')]},{items:[t('2','B')]},{items:[t('1','A edited there'),t('2','B')]});
    ok(r.v.items.some(x=>x.text==='A edited there'),'deleted here but edited there → kept (nothing lost)');
    ok(M({items:[t('1','A')]},{items:[t('1','X')]},{items:[t('1','Y')]}).clash===true,'the same task renamed two ways → a real clash');
    ok(JSON.stringify(M({x:{movedAt:1}},{x:{movedAt:5}},{x:{movedAt:9}}))==='{"v":{"x":{"movedAt":9}}}','a clock field changed on both → the later one');
    r=M({reset:{at:1,avoiding:'',moved:{}}},{reset:{at:2,avoiding:'The deck',moved:{}}},{reset:{at:2,avoiding:'',moved:{water:true}}});
    ok(JSON.stringify(r.v.reset)==='{"at":2,"avoiding":"The deck","moved":{"water":true}}','energy reset: Mac typed, phone ticked → both');
    ok(M(null,{a:1},{a:2}).clash===true&&JSON.stringify(M(null,{a:1,b:2},{a:1,c:3}))==='{"v":{"a":1,"b":2,"c":3}}','no saved base: still merges what doesn’t collide');
    P.close();

    /* in the app: a pull while this device has edits → merged, uploaded, no question */
    const st={};P=boot(NEW,st);
    P.g(`add('Shared task','work');add('Will be edited on the Mac','work');save()`);
    const baseS=JSON.parse(P.g('JSON.stringify(syncContent(S))'));
    P.g(`window.__put=[];window.__reloads=0;
      syncOpen=async(k,remote)=>JSON.parse(JSON.stringify(remote.data));
      syncSeal=async(k,data)=>data;
      syncPut=async(id,etag,payload)=>{__put.push({etag,payload});return {etag:'e3'}};
      syncReload=()=>{__reloads++};
      syncBaseSet(syncContent(S));
      SY={id:'x',k:'k',etag:'e1',dirty:true,h:null,at:null};syncSave()`);
    /* this device: a new task. the Mac: edited another task. */
    P.g(`add('Added on the phone','work');save()`);
    const macS=JSON.parse(JSON.stringify(baseS));macS.items.find(i=>i.text==='Will be edited on the Mac').text='Edited on the Mac';
    P.g(`window.__remote={etag:'e2',device:'Mac',savedAt:Date.now(),data:${JSON.stringify(macS)}};syncGet=async()=>__remote`);
    P.g('syncPull()');await tick(30);
    const put=JSON.parse(P.g('JSON.stringify(__put)'));
    ok(put.length===1&&put[0].etag==='e2','merged copy uploaded on top of the Mac’s version');
    ok(put[0].payload.items.some(i=>i.text==='Added on the phone')&&put[0].payload.items.some(i=>i.text==='Edited on the Mac'),'… holding both changes');
    const saved=JSON.parse(st.os_v3);
    ok(saved.items.some(i=>i.text==='Edited on the Mac')&&saved.items.some(i=>i.text==='Added on the phone')&&saved.ui,'this device now has both, its open tab kept');
    ok(P.g('__reloads')===1&&!P.$('#mlayer h3'),'… reloads quietly — no pop-up');
    ok(P.g('SY.etag')==='e3'&&P.g('SY.dirty')===false&&JSON.parse(st.os_sync_base).items.length===3,'sync state and base updated');
    /* the pop-up's case: both sides "changed" but the content is the same */
    P.g(`__put=[];__reloads=0;SY.etag='e3';SY.dirty=true;syncSave();
      __remote={etag:'e4',device:'Mac',savedAt:Date.now(),data:JSON.parse(JSON.stringify(syncContent(S)))}`);
    P.g('syncPull()');await tick(30);
    ok(P.g('__put.length')===0&&P.g('__reloads')===0&&!P.$('#mlayer h3')&&P.g('SY.etag')==='e4'&&P.g('SY.dirty')===false,'identical content → settled silently: no upload, no reload, no pop-up');
    /* a real clash still asks */
    P.g(`const i=S.items.find(i=>i.text==='Shared task');syncBaseSet(syncContent(S));i.text='Phone name';SY.dirty=true;syncSave();save();
      const d=JSON.parse(JSON.stringify(syncContent(S)));d.items.find(x=>x.id===i.id).text='Mac name';
      __remote={etag:'e5',device:'Mac',savedAt:Date.now(),data:d}`);
    P.g('syncPull()');await tick(30);
    ok(P.$('#mlayer h3')&&P.$('#mlayer h3').textContent==='Both devices changed things'&&P.$('#mlayer p').textContent.includes('the same thing in different ways'),'the same thing changed two ways → still asks');
    P.click('#mlayer #syuse');await tick(30);
    ok(P.g('__reloads')===1,'… and either choice works');
    /* a normal upload remembers what both sides now agree on */
    P.g(`closeSheet();__put=[];syncPut=async(id,etag,payload)=>{__put.push({etag,payload});return {etag:'e5b'}};
      SY.etag='e5a';SY.dirty=true;syncSave();add('Plain push','work')`);
    P.g('syncPush()');await tick(30);
    ok(JSON.parse(st.os_sync_base).items.some(i=>i.text==='Plain push')&&P.g('SY.etag')==='e5b','after an upload, the agreed copy is saved for the next merge');
    /* a push that hits a newer copy merges too */
    P.g(`__put=[];__reloads=0;closeSheet();syncBaseSet(syncContent(S));SY.etag='e6';SY.dirty=true;syncSave();
      add('Pushed from here','work');
      const d=JSON.parse(JSON.stringify(syncContent(S)));d.items=d.items.filter(i=>i.text!=='Pushed from here');d.items.push({id:'mac1',text:'Mac new',mode:'work',done:false,created:1,ord:1,bucket:'board',sorted:false,steps:[]});
      window.__cur={etag:'e7',device:'Mac',savedAt:Date.now(),data:d};let first=true;
      syncPut=async(id,etag,payload)=>{__put.push({etag,payload});if(first){first=false;return {conflict:true,current:__cur}}return {etag:'e8'}}`);
    P.g('syncPush()');await tick(40);
    const p2=JSON.parse(P.g('JSON.stringify(__put)'));
    ok(p2.length===2&&p2[1].etag==='e7'&&p2[1].payload.items.some(i=>i.text==='Mac new')&&p2[1].payload.items.some(i=>i.text==='Pushed from here'),'a rejected upload is merged and sent again');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.g('SY=null;syncSave()');P.close();

    /* housekeeping on load (a finished focus timer) does not become an "edit" on the next tap */
    const hk={};P=boot(NEW,hk);
    P.g(`S.focus={until:Date.now()+300,move:'x',from:Date.now()};save();
      SY={id:'x',k:'k',etag:'e1',dirty:false,h:syncHash(JSON.stringify(syncContent(S))),at:null};syncSave()`);
    P.close();await tick(400);
    P=boot(NEW,hk);
    ok(P.g("'focus' in S")===false,'the old focus timer is tidied away on load');
    P.g(`LAST_INPUT=Date.now();S.ui.workView='today';save()`);
    ok(P.g('SY.dirty')===false,'… and the next tap does not mark this device as changed');
    P.g(`S.ritual.work=['w1','w2'];S.ritual.workDate='2000-01-01';LAST_INPUT=0;save();syncRebase();DAY='2000-01-01';LAST_INPUT=Date.now();checkDay()`);
    ok(P.g('S.ritual.work.length')===0,'(the new day really did reset things)');
    ok(P.g('SY.dirty')===false,'a new day’s reset right after a tap is not an edit either');
    P.g(`LAST_INPUT=Date.now();add('A real edit','work');save()`);
    ok(P.g('SY.dirty')===true,'a real edit still counts');
    P.g('SY=null;syncSave()');await tick(30);P.close();
  }

  /* ===================================================================== */
  section('24. weekly mission, lines that move you, avoidance as information');
  {
    const st={};let P=boot(NEW,st);
    /* last week's mission exists; this week's doesn't */
    P.g(`S.ui.mode='work';S.goals.missions=[{id:'mold',week:tAddPer(isoWeek(),-7,'days'),text:'Ship the SOIP MX route',at:1}];save()`);
    ok(P.g(`zSteps('work').map(s=>s.id).slice(0,3).join()`)==='w1,wad,wm','the weekly mission step comes right after the ad breakfast');
    P.g('startZen()');
    let guard=0;while(P.g('ZSTEPS[ZI].id')!=='wm'&&guard++<5)P.click('#zgo');
    ok(P.$('#zname').textContent==='This week’s mission'&&P.$('#znote').textContent.includes('Write it fresh'),'work ritual: write this week’s mission, fresh');
    ok(P.$('#zmid').textContent.includes('Last week: Ship the SOIP MX route')&&P.$('#zmission').value==='','… last week’s shown for reference, not copied in');
    ok(P.$('#zgo').textContent==='Skip for now','… skippable');
    P.type('#zmission','Make the LATAM switchers idea impossible to ignore');
    ok(P.g('gMissionWeek().text')==='Make the LATAM switchers idea impossible to ignore'&&P.$('#zgo').textContent==='That is my week','saved as you type');
    P.click('#zgo');
    guard=0;while(P.g('ZSTEPS[ZI].id')!=='w6'&&guard++<12){if(P.g('TOPEN'))P.g('closeTriage()');P.click('#zgo')}
    ok(P.$('#zmid .gmline')&&P.$('#zmid .gmline').textContent.includes('This week’s mission')&&P.$('#zmid .gmline').textContent.includes('LATAM switchers'),'“pick today” shows the mission on top');
    P.g('exitZen()');
    /* same day: a paused ritual keeps the step; a new day: it is gone until next week */
    ok(P.g(`zSteps('work').some(s=>s.id==='wm')`),'the rest of the day, the step list stays the same (resume is safe)');
    P.g(`S.ritual.work=[];save()`);
    ok(!P.g(`zSteps('work').some(s=>s.id==='wm')`),'next ritual this week: no mission step — it’s written');
    P.g(`S.goals.missions=S.goals.missions.filter(x=>x.week!==isoWeek());save()`);
    ok(P.g(`zSteps('work').some(s=>s.id==='wm')`),'a new week (nothing written yet): it comes back');
    P.g(`gMissionSet('Make the LATAM switchers idea impossible to ignore')`);
    /* goals tab */
    P.g(`S.ui.workView='goals';render()`);
    ok(P.$('#gmission').value==='Make the LATAM switchers idea impossible to ignore'&&P.$('.gmission .seg-label').textContent.startsWith('This week’s mission'),'Goals tab: this week’s mission on top');
    P.click('#gmhist');ok(P.$('.gmhist').textContent.includes('Ship the SOIP MX route'),'past missions, newest first');
    P.type('#gmission','Rewritten here');ok(P.g('gMissionWeek().text')==='Rewritten here'&&P.g('S.goals.missions.length')===2,'editable there too (same week, same entry)');
    P.type('#gmission','');ok(!P.g('gMissionWeek()')&&P.g('gMissionLatest().text')==='Ship the SOIP MX route','cleared → falls back to the latest one as “your mission”');
    P.type('#gmission','Make the LATAM switchers idea impossible to ignore');
    /* lines */
    ok(P.$$('[data-gledit]').length===4,'lines that move you: listed on the Goals tab');
    P.enter('#glineadd','Back to the drawing board. Simple.');
    ok(P.g('S.goals.lines.length')===5,'add one');
    P.click('[data-gledit="l2"]');P.type('#mlayer #f','You love advertising. It never drains you.');P.click('#mlayer #yes');
    ok(P.g(`S.goals.lines.find(l=>l.id==='l2').text`)==='You love advertising. It never drains you.','edit one');
    P.click('[data-gldel="l4"]');ok(P.g('S.goals.lines.length')===4,'remove one');P.click('.toast .undo');ok(P.g('S.goals.lines.length')===5,'… with undo');
    /* the reset uses all of it */
    P.g(`S.goals.lines=Array.from({length:20},(_,k)=>({id:'x'+k,text:'Line number '+k}));
      startReset();S.reset.avoiding='The SOIP deck';S.reset.at=3;save();tzPaint(true)`);
    ok(P.$('.rpoints').textContent.includes('This week’s mission')&&P.$('.rpoints').textContent.includes('LATAM switchers'),'talk step: this week’s mission is a talking point');
    ok(P.g('rTemplate()').includes('My mission: Make the LATAM switchers'),'… and closes the Spark template');
    P.click('#tzgo');P.click('#tzgo');
    ok(P.$('#tzmid .gmline').textContent.includes('LATAM switchers'),'moves step: the mission on top');
    ok(P.$('#tzmid').textContent.includes('What do you do with “The SOIP deck”?')&&P.$$('[data-rdecide]').map(b=>b.textContent).join('|')==='⚡ Do it now|✂️ Shrink it|🤖 Delegate to AI|✕ Not doing it','decide what to do with the avoided thing');
    P.click('[data-rdecide="drop"]');ok(P.$('#tzmid').textContent.includes('Dropped on purpose'),'not doing it is a decision, not a failure');
    P.click('[data-rdecide="ai"]');ok(P.g('S.reset.decision')==='ai'&&P.$('#tzmid').textContent.includes('marked for AI'),'delegate: it will go to Sort for AI');
    ok(P.$('#rblank').getAttribute('href')===P.g('SPARK_URL')&&P.$('.rnudge').textContent.includes('Is the deck the problem?'),'nudge: deck the problem? blank page in Spark');
    P.click('#tzgo');
    const shown=P.$('.rline').textContent;
    ok(/^Line number \d+$/.test(shown)&&P.g('S.reset.lineId')==='x'+shown.split(' ').pop(),'focus shows one of your lines');
    let same=true;for(let k=0;k<8;k++){P.g('tzPaint(false)');if(P.$('.rline').textContent!==shown)same=false}
    P.g('rBack();rNext()');if(P.$('.rline').textContent!==shown)same=false;
    ok(same,'… the same one for the whole reset, through redraws and going back');
    P.click('#tzgo');P.click('#tzgo');
    const t=JSON.parse(P.g(`JSON.stringify(S.items.find(i=>i.text==='The SOIP deck'))`));
    ok(t&&t.ai===true&&t.sorted===false&&t.mode==='work','closing the reset: the delegated thing is in Sort, marked for AI');
    ok(P.g('S.resetLog.at(-1).decision')==='ai','… and the decision is kept in the log');
    ok(P.errors.length===0,'no errors: '+P.errors.join(' | '));
    P.close();
    /* two devices seeding the default lines merge cleanly — no doubles */
    P=boot(NEW,{});
    const two=P.g(`(()=>{const a=JSON.parse(JSON.stringify(S.goals.lines)),b=JSON.parse(JSON.stringify(S.goals.lines));
      return JSON.stringify(syncMerge3(undefined,{lines:a,x:1},{lines:b,x:1},''))})()`);
    ok(JSON.parse(two).v.lines.length===4,'default lines from two devices merge into one set');
    P.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if(fail){console.log('FAILED:\n - '+fails.join('\n - '));process.exit(1)}
  process.exit(0);
})().catch(e=>{console.error('CRASH',e);process.exit(2)});
