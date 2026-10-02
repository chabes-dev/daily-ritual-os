"use strict";
const KEY='os_v3';
const APPVER='v13';
const SPARK_URL='https://spark-v2-chabes-devs-projects.vercel.app/';
const REEL_URL='https://reel-chabes-devs-projects.vercel.app/';
/* phones/tablets: no hover, no drag-and-drop, no keyboard — copy and controls adapt */
const TOUCH=matchMedia('(hover:none) and (pointer:coarse)').matches;
let STORE_OK=true;
function load(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null}catch(e){STORE_OK=false;return null}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){STORE_OK=false}}
const C={blue:'#1A73E8',green:'#1E8E3E',yellow:'#FBBC04',red:'#EA4335',purple:'#A142F4',cyan:'#12B5CB',grey:'#5F6368'};
const LANES=[{id:'urgent',name:'Urgent',color:C.red},{id:'batch',name:'Batch',color:C.yellow},
  {id:'important',name:'Important',color:C.purple},{id:'followup',name:'Follow Up',color:C.blue},
  {id:'hold',name:'Hold',color:C.grey},{id:'ideas',name:'Ideas & Wishes',color:C.cyan}];
const DOMAINS=[{id:'health',name:'Health',color:C.green},{id:'money',name:'Money & Legal',color:C.blue},
  {id:'family',name:'Family & Home',color:C.yellow},{id:'future',name:'Future',color:C.purple},
  {id:'wish',name:'Wishes',color:C.cyan}];
const GROUPS={work:LANES,personal:DOMAINS};
const GKEY={work:'lane',personal:'domain'};
const PARKED={work:['hold','ideas'],personal:['wish']};
const isParked=i=>(PARKED[i.mode]||[]).includes(i[GKEY[i.mode]]);
const ZNOTE={
  p0:'One thing. Not chores, not tasks — playing with the kids, cooking something good, calling your parents. The one thing that would make this week actually good, not just handled.',
  w1:'Put the music on. Set the timer. Nothing starts until this does.',
  wj:'However it is actually going. No structure needed. Write them in Spark, then come back here.',
  w2:'Clear the inbox first — read, act, archive; anything over 60 seconds becomes a task. Then everything in your head, one line each. No order, no judgement.',
  w4:'Two keystrokes each. Where it lives, then this week or later.',
  w5:'Look at the calendar, then say what is genuinely left today. Not the optimistic number.',
  wpr:'The weekly round in Town. Work is planned — this keeps the rest of life from quietly piling up.',
  wpw:'Everything on the board is this week. Trim it to the limit you set — Later sends it to the backlog — or bring something back from the backlog.',
  ww:'Same question for the rest of the week. It sets how many tasks this week can hold — the limit you sort and pick against.',
  w6:'One deep thing. Three batch. Two spare. That is the whole day.',
  wad:'Had one worth keeping? Yes opens Reel to save it. Otherwise, skip.',
  w8:'Work is done. Before you close, point at one personal thing for today — so a week of work days does not quietly swallow it.',
  w7:'Copy it down. Then close this and go and do it.',
  p1:'Health, money, family, the future — one line each. Anything sitting in TickTick counts too.',
  p2:'Anything in the backlog ready to move up? Anything on the board lying to you?',
  wk:'A new week. Everything you do not choose now goes to the backlog — it is not gone, it is just not this week.',
  p4:'Plan the whole week here, not today — most weeks need zero or one deep thing.',
  p5:'Copy it down. Then close this.'
};
const RITUALS={
  work:[{id:'w1',name:'Music on, timer set'},{id:'wad',name:'Already had your ad breakfast?'},
    {id:'w2',name:'Clean inbox, dump everything'},
    {id:'w5',name:'How much time is actually free — today'},{id:'ww',name:'How much time is actually free — this week'},
    {id:'w4',name:'Sort the dump'},{id:'w6',name:'Pick today'},{id:'wpw',name:'Pick this week'},
    {id:'wpr',name:'Did you do your weekly round this week?'},
    {id:'w8',name:'One personal thing, before you close'},{id:'wj',name:'Morning pages'},
    {id:'w7',name:'Copy to paper and close this'}],
  personal:[{id:'p0',name:'What would make this week good for them?'},{id:'p1',name:'Dump everything personal'},{id:'p2',name:'Check the backlog and re-sort'},
    {id:'p4',name:'Pick this week'},
    {id:'p5',name:'Copy to paper and close this'}]};
const VERBS=('call email write send book schedule buy pay file review read draft finish start fix ask reply confirm cancel renew sign submit upload download print scan check order collect pick drop take bring return update reserve register apply request find search compare choose decide plan prep prepare build make create edit revise cut record shoot design map outline talk speak meet visit go move clean sort organize backup export import install set setup test measure watch train close open add remove delete assign share draw list get put run rewrite pitch present brief align follow chase ligar escrever enviar comprar pagar marcar agendar renovar assinar reservar levar buscar terminar comecar organizar resolver ler revisar').split(' ');
const nid=()=>Math.random().toString(36).slice(2,10);
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const emptyPlan=()=>({deep:null,batch:[],next:[],buffer:[]});
function isoWeek(d){const t=new Date(d||Date.now());t.setHours(12,0,0,0);
  const day=(t.getDay()+6)%7;t.setDate(t.getDate()-day);return t.toISOString().slice(0,10)}

let S=load()||{items:[],projects:[],ritual:{date:null,work:[],personal:[]},
  plan:{date:null,work:emptyPlan(),personal:emptyPlan()},
  ui:{mode:'work',workView:'today',personalView:'today',keys:false,open:{}},lastBackup:null};
S.ui=Object.assign({mode:'work',workView:'today',personalView:'today',keys:false,open:{}},S.ui||{});
S.ui.open=S.ui.open||{};S.projects=S.projects||[];
if(!['home','today','backlog'].includes(S.ui.workView))S.ui.workView='today';
/* personal mode is Town now — the old personal board's views (home/today/backlog) map onto it */
if(!['north','town'].includes(S.ui.personalView))S.ui.personalView='town';
/* one-time nudge onto the new home dashboard for people who already had a saved tab */
if(!S.ui.sawHome){S.ui.workView='home';S.ui.personalView='town';S.ui.sawHome=true}
/* Personal journal entries are {text,title}; very old ones were plain strings. Morning pages
   (the old work journal) are written in Spark now, so their in-app history is dropped. */
S.journal=S.journal||{personal:{}};S.journal.personal=S.journal.personal||{};
delete S.journal.work;
Object.keys(S.journal.personal).forEach(d=>{
  const store=S.journal.personal;if(typeof store[d]==='string')store[d]={text:store[d],title:''}});
S.north=S.north||'';
S.extLink=S.extLink||null;
S.cap=Object.assign({work:12,personal:8},S.cap||{});
S.hours=S.hours||{date:null,work:null,personal:null};
S.week=S.week||{iso:null,work:false,personal:false};
/* Weekly pacing number for work — separate from S.hours.work (today's number, which
   drives the actual daily deep/batch caps). This one is just "how much runway is left
   in the week," shown alongside it and freely editable every day since the week's
   shape keeps changing. It never touches the daily budget math. */
S.workWeekHours=S.workWeekHours||{weekIso:null,hours:null};
if(S.workWeekHours.weekIso!==isoWeek())S.workWeekHours={weekIso:isoWeek(),hours:null};
S.adCheck=S.adCheck||{date:null,answer:null};
if(S.adCheck.date!==today())S.adCheck={date:today(),answer:null};
S.streak=S.streak||{date:null,work:{count:0,hitToday:false},personal:{count:0,hitToday:false}};
if(S.streak.date!==today())S.streak={date:today(),
  work:{count:S.streak.work?S.streak.work.count:0,hitToday:false},
  personal:{count:S.streak.personal?S.streak.personal.count:0,hitToday:false}};
if(S.week.iso!==isoWeek())S.week={iso:isoWeek(),work:false,personal:false};
if(S.hours.date!==today())S.hours={date:today(),work:null,personal:null};
/* work runs on a daily cadence; personal runs weekly (see the personal restructure below).
   The old shape was a single shared {date,work,personal} for both — migrate forward if found. */
S.ritual=S.ritual||{workDate:null,personalWeekIso:null,work:[],personal:[]};
if(S.ritual.workDate===undefined)S.ritual={workDate:S.ritual.date||null,personalWeekIso:null,work:S.ritual.work||[],personal:S.ritual.personal||[]};
if(S.ritual.workDate!==today()){S.ritual.workDate=today();S.ritual.work=[]}
if(S.ritual.personalWeekIso!==isoWeek()){S.ritual.personalWeekIso=isoWeek();S.ritual.personal=[]}
S.plan=S.plan||{date:null,work:emptyPlan(),personal:emptyPlan()};
if(S.plan.date!==today()){S.plan.date=today();S.plan.work=emptyPlan()}
/* Personal: quick tasks — scheduling, checking, printing — with at most 1-2 deep things
   a week, so it's planned weekly, not daily. deepCap/batchCap are set by the person
   (personalCapSheet), not derived from an hours guess like work's daily budget is.
   todayPick is the one personal thing surfaced by the work ritual's closing step, so it
   doesn't get forgotten during a week of work days — it clears every day like the rest
   of "today" does, independent of the weekly plan underneath it. */
S.personal=S.personal||{deepCap:1,batchCap:5,weekIso:null,plan:{deep:[],batch:[],buffer:[],next:[]},todayPick:null,happyPick:null,anchors:[]};
S.personal.anchors=S.personal.anchors||[];
S.personal.anchorArchive=S.personal.anchorArchive||[];
/* the weekly phrase used to allow five lines that never cleared; it's one line a week now,
   so anything already there is archived once and the week starts clean */
if(!S.personal.onePhrase){archiveAnchors(null);S.personal.onePhrase=true}
rollPersonalWeek();
/* the work ritual asks whether the personal ritual happened this week; skips are counted
   (one per day) until it's done */
S.pcheck=S.pcheck||{doneWeek:null,skips:[]};
if(S.personal.todayPick&&S.personal.todayPick.date!==today())S.personal.todayPick=null;
delete S.pick;
let healed=0;
if(S.projects&&S.projects.length){S.items.forEach(i=>{if(i.project)i.project=null})}
S.projects=[];
S.items.forEach(i=>{
  if(i.ord==null)i.ord=i.created||0;
  if(!i.bucket)i.bucket='board';
  if(!Array.isArray(i.steps))i.steps=[];
  i.project=null;
  if(!i.done&&i.sorted&&!i.project){
    const g=GROUPS[i.mode]||[],k=GKEY[i.mode];
    if(!g.some(x=>x.id===i[k])){i.sorted=false;i[k]=null;healed++}
  }
});
if(healed)save();

/* A backlog item that's sat untouched for 30 days probably isn't a task anymore —
   it's a wish. Move it to the Wishes/Ideas column (visible on the board, just parked)
   instead of letting it rot unseen in the backlog. Visible-but-automatic: this always
   surfaces a dismissible banner naming what moved, same spirit as the healed-item repair. */
const WISH_AFTER_DAYS=30;
function migrateStaleBacklog(){
  let moved=0;
  S.items.forEach(i=>{
    if(i.done||!i.sorted||i.bucket!=='backlog'||!i.backlogAt||isParked(i))return;
    const days=Math.floor((Date.now()-i.backlogAt)/864e5);
    if(days<WISH_AFTER_DAYS)return;
    i[GKEY[i.mode]]=i.mode==='work'?'ideas':'wish';
    setBucket(i,'board');
    moved++;
  });
  if(moved)save();
  return moved;
}
let wishMoved=migrateStaleBacklog();

const mine=m=>S.items.filter(i=>i.mode===m&&!i.done);
const raw=m=>mine(m).filter(i=>!i.sorted);
const filed=m=>mine(m).filter(i=>i.sorted);
const onBoard=m=>filed(m).filter(i=>i.bucket!=='backlog');
const inBacklog=m=>filed(m).filter(i=>i.bucket==='backlog');
const load_=m=>onBoard(m).filter(i=>!isParked(i)).length;
const quickPool=m=>onBoard(m).filter(i=>i.quick&&!isParked(i)).sort(byOrd);
const capOf=m=>S.cap[m]||0;
const overCap=m=>load_(m)>capOf(m);
/* A week has a shape: it starts intact and erodes. The survival rate now tapers across
   the week instead of holding flat at 60% — Monday gets the optimistic number, Friday
   gets an honest one, so the day sizes itself down instead of you finding out at 4pm
   that today was never going to happen. Sun/Sat are treated like a fresh Monday. */
const DEEP_MIN=90, BATCH_MIN=25, BUFFER_SLOTS=2;
const SURVIVAL_BY_DAY={0:.6,1:.6,2:.6,3:.55,4:.5,5:.4,6:.6};
/* The week gets the day's arithmetic: ~60% of stated time survives, and a day with 4.2h
   real (7h stated) holds about 4 tasks — roughly one task per real hour. */
const weekCapFor=h=>Math.max(1,Math.round(h*.6));
function survivalRate(){return SURVIVAL_BY_DAY[new Date().getDay()]??.6}
function budget(h){
  if(!h)return null;
  const realMin=Math.round(h*60*survivalRate());
  const deep=realMin>=DEEP_MIN?1:0;
  const left=realMin-(deep?DEEP_MIN:0);
  let batch=Math.max(0,Math.min(3,Math.floor(left/BATCH_MIN)));
  if(!deep&&batch===0&&realMin>=12)batch=1;   /* a short day still fits one small thing */
  return {realMin,real:Math.round(realMin/6)/10,deep,batch};
}
/* what today can actually hold. spare and the AI-delegate slot ("buffer" internally) are
   always 2 each and neither tapers with the week — a shrinking batch is exactly when
   handing more off to AI matters most, not less. */
function dayCaps(m){
  const b=budget(S.hours&&S.hours[m]);
  if(!b)return {deep:1,batch:3,next:2,buffer:BUFFER_SLOTS};
  return {deep:b.deep,batch:b.batch,next:2,buffer:BUFFER_SLOTS};
}
function overBudget(m){const p=plan(m),c=dayCaps(m);
  return (p.deep?1:0)>c.deep||p.batch.length>c.batch}
const byOrd=(a,b)=>(a.ord||0)-(b.ord||0);
const maxOrd=()=>S.items.reduce((n,i)=>Math.max(n,i.ord||0),0);
const daysTo=d=>Math.round((new Date(d+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5);
function dueLabel(d){const n=daysTo(d);
  if(n<0)return{t:Math.abs(n)+(Math.abs(n)===1?' day late':' days late'),c:'late'};
  if(n===0)return{t:'today',c:'hot'};if(n===1)return{t:'tomorrow',c:'hot'};
  if(n<=14)return{t:'in '+n+' days',c:'hot'};
  return{t:new Date(d+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'}),c:''}}
function dateChips(i){
  const iso=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
  const wk=(()=>{const x=new Date();const g=(6-x.getDay()+7)%7;x.setDate(x.getDate()+(g||6));return x.toISOString().slice(0,10)})();
  const opts=[['No date',null],['Today',iso(0)],['Tomorrow',iso(1)],['This weekend',wk],['Next week',iso(7)]];
  const custom=i.due&&!opts.some(o=>o[1]===i.due);
  return opts.map(([l,v])=>`<button class="dbtn ${i.due===v?'on':''}" data-dset="${v===null?'':v}">${l}</button>`).join('')
    +`<button class="dbtn ${custom?'on':''}" data-dpick="1">${custom?dueLabel(i.due).t:'Pick a date'}</button>`;
}
function hasVerb(t){const w=(t.trim().toLowerCase().replace(/[^a-zà-ÿ\s]/g,'').split(/\s+/)[0]||'');return VERBS.includes(w)}
const age=i=>Math.round((Date.now()-i.created)/864e5);
const groupOf=i=>(GROUPS[i.mode]||[]).find(g=>g.id===i[GKEY[i.mode]]);
const byId=id=>S.items.find(x=>x.id===id&&!x.done);
/* every place that sends something to the backlog goes through here, so we always know
   how long it's been sitting there — that timestamp drives the 30-day wish migration. */
function setBucket(it,bucket){
  if(!it)return;
  it.bucket=bucket;
  if(bucket==='backlog'){if(!it.backlogAt)it.backlogAt=Date.now()}
  else{delete it.backlogAt}
}
/* left bar = where it lives · tint = exception only */
function cardColor(i){const g=groupOf(i);return g?g.color:C.grey}
function cardTint(i){
  if(i.due&&daysTo(i.due)<0)return C.red;
  if(i.star)return C.purple;
  if(i.quick)return C.yellow;
  return null;
}
function dotColor(i){return cardTint(i)||cardColor(i)}
/* quiet = days since anything here was finished, measured from when this group
   first had work in it — never from the beginning of time. */
function quietDays(m,gid){
  const key=GKEY[m];
  const open=S.items.filter(i=>i.mode===m&&!i.done&&i[key]===gid);
  if(!open.length)return 0;
  const dones=S.items.filter(i=>i.mode===m&&i.done&&i[key]===gid&&i.doneAt);
  const lastDone=dones.length?Math.max(...dones.map(i=>i.doneAt)):0;
  const oldestOpen=Math.min(...open.map(i=>i.created||Date.now()));
  const since=Math.max(lastDone,oldestOpen);       /* whichever started the silence */
  return Math.max(0,Math.round((Date.now()-since)/864e5));
}
function styleFor(i){const t=cardTint(i);return `--cc:${cardColor(i)}`+(t?`;--tint:${t}`:'')}
/* ---- plan ---- */

/* Personal's weekly plan — deep is a capped array (1 or 2, set via personalCapSheet)
   instead of a single slot, since "1-2 deep things a week" is the whole point of the
   personal restructure. Batch/buffer/next work the same as they always have. */
/* Monday starts a new personal week: the plan resets, and last week's phrase goes to the
   archive (shown on North Star) so the ritual opens on a blank line. */
function rollPersonalWeek(){
  if(S.personal.weekIso===isoWeek())return;
  archiveAnchors(S.personal.weekIso);
  S.personal.weekIso=isoWeek();S.personal.plan={deep:[],batch:[],buffer:[],next:[]};
  S.personal.happyPick=null;
}
function archiveAnchors(weekIso){
  (S.personal.anchors||[]).forEach(a=>{if(a.text&&a.text.trim())S.personal.anchorArchive.unshift({weekIso,text:a.text.trim()})});
  S.personal.anchors=[];
}
const weekPhrase=()=>{const a=(S.personal.anchors||[])[0];return a&&a.text?a.text.trim():''};
function setWeekPhrase(v){v=(v||'').trim();S.personal.anchors=v?[{id:(S.personal.anchors[0]||{}).id||nid(),text:v}]:[];save()}
const personalDoneThisWeek=()=>S.pcheck.doneWeek===isoWeek()
  ||(S.town&&S.town.lastRound&&isoWeek(S.town.lastRound)===isoWeek())
  ||(S.ritual.personalWeekIso===isoWeek()&&(S.ritual.personal||[]).includes('p5'));
function personalPlan(){
  rollPersonalWeek();
  const p=S.personal.plan;
  p.deep=(p.deep||[]).filter(byId);p.batch=(p.batch||[]).filter(byId);
  p.buffer=(p.buffer||[]).filter(byId);p.next=(p.next||[]).filter(byId);
  if(S.personal.happyPick&&!byId(S.personal.happyPick))S.personal.happyPick=null;  /* done/deleted */
  return p;
}
function personalCaps(){return {deep:S.personal.deepCap,batch:S.personal.batchCap,buffer:BUFFER_SLOTS,next:2}}
function slotOf(m,id){
  if(m==='personal'){const p=personalPlan();
    return p.deep.includes(id)?'deep':p.batch.includes(id)?'batch':p.buffer.includes(id)?'buffer':p.next.includes(id)?'next':null}
  const p=S.plan[m];
  return p.deep===id?'deep':(p.batch||[]).includes(id)?'batch':(p.buffer||[]).includes(id)?'buffer':(p.next||[]).includes(id)?'next':null;
}
function plan(m){
  if(m==='personal')return personalPlan();
  const p=S.plan[m];p.deep=p.deep&&byId(p.deep)?p.deep:null;
  p.batch=(p.batch||[]).filter(byId);p.next=(p.next||[]).filter(byId);p.buffer=(p.buffer||[]).filter(byId);return p}
const inPlan=(m,id)=>{
  const p=plan(m);
  if(m==='personal')return p.deep.includes(id)||p.batch.includes(id)||p.next.includes(id)||p.buffer.includes(id);
  return p.deep===id||p.batch.includes(id)||p.next.includes(id)||p.buffer.includes(id);
};
function clearFromPlan(m,id){
  if(m==='personal'){const p=personalPlan();
    p.deep=p.deep.filter(x=>x!==id);p.batch=p.batch.filter(x=>x!==id);
    p.buffer=p.buffer.filter(x=>x!==id);p.next=p.next.filter(x=>x!==id);return}
  const p=S.plan[m];if(p.deep===id)p.deep=null;
  p.batch=(p.batch||[]).filter(x=>x!==id);p.next=(p.next||[]).filter(x=>x!==id);p.buffer=(p.buffer||[]).filter(x=>x!==id)}
function assign(m,slot,id,quiet){
  const it=byId(id);if(!it||it.mode!==m)return false;
  if(m==='personal'){
    const p=personalPlan(),caps=personalCaps();
    const lim=slot==='deep'?caps.deep:slot==='batch'?caps.batch:slot==='buffer'?caps.buffer:caps.next;
    if((p[slot]||[]).length>=lim&&!(p[slot]||[]).includes(id)){
      if(!quiet)noRoomSheet(m,slot);return false}
    clearFromPlan(m,id);
    p[slot]=p[slot]||[];p[slot].push(id);
    while(p[slot].length>lim)p[slot].shift();
    if(it.bucket==='backlog')setBucket(it,'board');
    save();if(!quiet)render();
    return true;
  }
  const c=dayCaps(m);
  if(slot==='deep'&&c.deep===0){
    if(!quiet)noRoomSheet(m,'deep');return false}
  if(slot==='batch'&&c.batch===0){
    if(!quiet)noRoomSheet(m,'batch');return false}
  clearFromPlan(m,id);const p=S.plan[m];
  if(slot==='deep'){if(p.deep&&c.batch>0)p.batch.unshift(p.deep);p.deep=id}
  else{p[slot]=p[slot]||[];p[slot].push(id);
    const lim=slot==='batch'?c.batch:(slot==='buffer'?c.buffer:c.next);
    while(p[slot].length>lim)p[slot].shift()}
  if(it.bucket==='backlog')setBucket(it,'board');
  save();if(!quiet)render();
  return true;
}
function noRoomSheet(m,slot){
  if(m==='personal'){
    const caps=personalCaps(),label=slot==='deep'?'deep':slot==='batch'?'batch':slot==='buffer'?'AI delegation':'spare';
    const lim=slot==='deep'?caps.deep:slot==='batch'?caps.batch:slot==='buffer'?caps.buffer:caps.next;
    sheet(`<h3>This week's ${label} is full.</h3>
      <p>Your weekly cap is <b>${lim}</b>. Take something off first, or raise the cap if it's genuinely a bigger week.</p>
      <div class="sheet-acts"><button class="btn" id="fix">Change weekly caps</button>
        <span style="flex:1"></span><button class="btn btn-hot" id="ok">Fair enough</button></div>`,
    el=>{el.querySelector('#ok').onclick=()=>{closeSheet();if(ZEN)paintZen(false);else render()};
      el.querySelector('#fix').onclick=()=>{closeSheet();personalCapSheet()}});
    return;
  }
  const h=S.hours[m],b=budget(h);
  sheet(`<h3>Today has no room for that.</h3>
    <p>You said <b>${h}h free</b>. About <b>${b.real}h</b> of that survives the day, which is
    ${b.deep?'one deep block':'<b>no deep block</b>'}${b.batch?` and ${b.batch} batch task${b.batch===1?'':'s'}`:' and nothing more'}.
    ${slot==='deep'?'A deep block needs 90 uninterrupted minutes — you do not have them today.':'There is no room left for another batch task.'}</p>
    <p style="margin-bottom:10px">If the number was wrong, change it. If it was right, this is the honest answer.</p>
    <div class="sheet-acts"><button class="btn" id="fix">Change my hours</button>
      <span style="flex:1"></span><button class="btn btn-hot" id="ok">Fair enough</button></div>`,
  el=>{el.querySelector('#ok').onclick=()=>{closeSheet();if(ZEN)paintZen(false);else render()};
    el.querySelector('#fix').onclick=()=>{closeSheet();if(ZEN){ZI=ZSTEPS.findIndex(x=>ZKIND[x.id]==='hours');paintZen(true)}else hoursSheet()}});
}
function suggestDeep(m){
  const pool=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id));
  const late=pool.filter(i=>i.due&&daysTo(i.due)<=1).sort((a,b)=>a.due<b.due?-1:1);
  if(late.length)return late[0];
  const st=pool.filter(i=>i.star).sort(byOrd);if(st.length)return st[0];
  const order=m==='work'?['urgent','important','followup','batch']:DOMAINS.filter(d=>d.id!=='wish').map(d=>d.id);
  for(const g of order){const l=pool.filter(i=>i[GKEY[m]]===g&&!i.quick).sort(byOrd);if(l.length)return l[0]}
  return pool.sort(byOrd)[0]||null;
}
function planText(m){
  const p=plan(m),L=[];
  if(m==='personal')p.deep.forEach(id=>L.push('DEEP / '+byId(id).text));
  else if(p.deep)L.push('DEEP / '+byId(p.deep).text);
  p.batch.forEach(id=>L.push('BATCH / '+byId(id).text));
  p.buffer.forEach(id=>L.push('DELEGATE TO AI / '+byId(id).text));
  p.next.forEach(id=>L.push('SPARE / '+byId(id).text));
  if(m==='work'){
    const pp=personalPick();
    if(pp)L.push('PERSONAL / '+pp.title);
  }
  return L.join('\n');
}
function add(text,mode,group,bucket){let o=maxOrd();const made=[];
  text.split('\n').map(t=>t.trim()).filter(Boolean).forEach(t=>{o+=100;
    const x={id:nid(),text:t,mode,sorted:!!group,done:false,created:Date.now(),ord:o,bucket:bucket||'board',
      domain:null,lane:null,project:null,due:null,quick:false,star:false,steps:[]};
    if(group)x[GKEY[mode]]=group;
    S.items.push(x);made.push(x)});save();return made}
function toast(m){const t=document.createElement('div');t.className='toast';if(ZEN)t.style.bottom='118px';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
function toastUndo(msg,fn){
  const t=document.createElement('div');t.className='toast';if(ZEN)t.style.bottom='118px';
  t.innerHTML=`<span>${esc(msg)}</span><button class="undo">Undo</button>`;
  document.body.appendChild(t);
  const kill=setTimeout(()=>t.remove(),6000);
  t.querySelector('.undo').onclick=()=>{clearTimeout(kill);t.remove();fn()};
}
const doneCount=()=>S.items.filter(i=>i.done).length;
function restore(id){
  const i=S.items.find(x=>x.id===id);if(!i)return;
  i.done=false;delete i.doneAt;
  if(!i.sorted){i.sorted=false}
  save();render();toast('back on the board');
}
function doneSheet(){
  const list=S.items.filter(i=>i.done).sort((a,b)=>(b.doneAt||0)-(a.doneAt||0));
  const day=d=>{const n=Math.round((new Date(today()+'T12:00:00')-new Date(new Date(d).toISOString().slice(0,10)+'T12:00:00'))/864e5);
    return n<=0?'Today':n===1?'Yesterday':n+' days ago'};
  let last='';
  const rows=list.slice(0,60).map(i=>{
    const d=i.doneAt?day(i.doneAt):'Earlier';
    const head=d!==last?`<div class="seg-label" style="margin:22px 0 8px">${d}</div>`:'';last=d;
    const g=groupOf(i);
    return head+`<div class="donerow">
      <span class="d" style="background:${g?g.color:C.grey}"></span>
      <span class="t">${esc(i.text)}</span>
      <span class="tag">${i.mode==='work'?'Work':'Personal'}</span>
      <button class="act" data-restore="${i.id}">Put back</button>
      <button class="act del" data-purge="${i.id}">×</button></div>`}).join('');
  sheet(`<h3>Done</h3>
    <p>${list.length?'Everything you have finished. Put anything back if you ticked it by mistake.':'Nothing finished yet.'}</p>
    ${rows}
    ${list.length>60?`<p style="margin-top:20px;color:var(--ink-3)">Showing the most recent 60 of ${list.length}.</p>`:''}
    <div class="sheet-acts" style="margin-top:28px">
      ${list.length?`<button class="btn btn-danger" id="clearall">Clear the list</button>`:''}
      <span style="flex:1"></span>
      <button class="btn btn-hot" id="ok">Close</button></div>`,
  el=>{
    el.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{restore(b.dataset.restore);closeSheet();doneSheet()});
    el.querySelectorAll('[data-purge]').forEach(b=>b.onclick=()=>{
      S.items=S.items.filter(x=>x.id!==b.dataset.purge);save();closeSheet();doneSheet()});
    const ca=el.querySelector('#clearall');
    if(ca)ca.onclick=()=>sheetConfirm('Clear the done list?','This permanently deletes '+list.length+' finished tasks. Your open tasks are untouched.','Clear',()=>{
      S.items=S.items.filter(i=>!i.done);save();render();toast('cleared')});
    el.querySelector('#ok').onclick=()=>{closeSheet();render()};
  },true);
}
function markDeepHit(m){S.streak[m].hitToday=true;save()}
function unmarkDeepHit(m){S.streak[m].hitToday=false;save()}
function finish(id,el){
  const i=byId(id);if(!i)return;
  const box=el.closest('.card')||el.closest('.deep')||el.closest('.slot');
  if(box){
    box.classList.add('done');box.querySelectorAll('button').forEach(b=>b.disabled=true);
    setTimeout(()=>{const h=box.offsetHeight;box.style.height=h+'px';box.offsetHeight;box.classList.add('collapse');
      setTimeout(()=>{i.done=true;i.doneAt=Date.now();
        const slot=slotOf(i.mode,id);
        if(slot==='deep'&&i.mode==='work')markDeepHit(i.mode);
        clearFromPlan(i.mode,id);save();render();
        toastUndo('done',()=>{i.done=false;delete i.doneAt;if(slot==='deep'&&i.mode==='work')unmarkDeepHit(i.mode);if(slot)assign(i.mode,slot,id);else{save();render()}});
      },430)},900);
    return;
  }
  const mbox=el.closest('.mini');
  if(mbox){
    mbox.style.pointerEvents='none';
    if(mbox.animate)mbox.animate([{opacity:1},{opacity:.15}],{duration:160,fill:'forwards'});
    else mbox.style.opacity='.15';
    setTimeout(()=>{
      const h=mbox.offsetHeight;mbox.style.height=h+'px';mbox.style.overflow='hidden';mbox.offsetHeight;
      mbox.style.transition='height .26s cubic-bezier(.4,0,.2,1),padding .26s,margin .26s';
      mbox.style.height='0px';mbox.style.paddingTop='0';mbox.style.paddingBottom='0';mbox.style.marginBottom='0';
      setTimeout(()=>{
        i.done=true;i.doneAt=Date.now();clearFromPlan(i.mode,id);save();render();
        toastUndo('done',()=>{i.done=false;delete i.doneAt;save();render()});
      },260);
    },160);
    return;
  }
  const slot=slotOf(i.mode,id);
  i.done=true;i.doneAt=Date.now();
  if(slot==='deep'&&i.mode==='work')markDeepHit(i.mode);
  clearFromPlan(i.mode,id);save();render();
  toastUndo('done',()=>{i.done=false;delete i.doneAt;if(slot==='deep'&&i.mode==='work')unmarkDeepHit(i.mode);if(slot)assign(i.mode,slot,id);else{save();render()}});
}
function exportBackup(silent){
  const payload=JSON.stringify(S,null,2);
  const b=new Blob([payload],{type:'application/json'});
  const url=URL.createObjectURL(b);
  const a=document.createElement('a');
  a.href=url;a.download='os-backup-'+today()+'-'+new Date().toTimeString().slice(0,5).replace(':','')+'.json';
  a.style.display='none';
  document.body.appendChild(a);        /* Firefox needs it in the document */
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},4000);  /* let the download finish reading the blob */
  S.lastBackup=today();save();
  const w=S.items.filter(i=>i.mode==='work').length,pn=S.items.filter(i=>i.mode==='personal').length;
  if(!silent)toast(`saved · ${w} work · ${pn} personal`);
  render();
  return {work:w,personal:pn,total:S.items.length};
}
function importBackup(){
  const f=document.createElement('input');f.type='file';f.accept='.json,application/json';
  f.onchange=()=>{
    const file=f.files&&f.files[0];if(!file)return;
    const r=new FileReader();
    r.onerror=()=>sheetAlert('Could not read that file.');
    r.onload=()=>{
      let d;
      try{d=JSON.parse(r.result)}catch(e){return sheetAlert('That file isn’t valid JSON.')}
      if(!d||!Array.isArray(d.items))return sheetAlert('That file isn’t an OS backup — no task list inside it.');
      const w=d.items.filter(i=>i.mode==='work'&&!i.done).length;
      const pn=d.items.filter(i=>i.mode==='personal'&&!i.done).length;
      const now=S.items.filter(i=>!i.done).length;
      sheetConfirm('Replace everything with this file?',
        `The file holds ${w} open work tasks and ${pn} open personal tasks. This replaces the ${now} you have now — export first if you're not sure.`,
        'Replace',()=>{localStorage.setItem(KEY,JSON.stringify(d));location.reload()});
    };
    r.readAsText(file);
  };
  f.click();
}
const backupAge=()=>S.lastBackup?-daysTo(S.lastBackup):999;

/* ===== dialogs ===== */
const mlayer=document.getElementById('mlayer');
function closeSheet(){mlayer.innerHTML=''}
function sheet(html,setup,wide){
  mlayer.innerHTML=`<div class="veil in"><div class="sheet" ${wide?'style="max-width:680px"':''}>${html}</div></div>`;
  mlayer.querySelector('.veil').onclick=e=>{if(e.target.classList.contains('veil'))closeSheet()};
  if(setup)setup(mlayer.querySelector('.sheet'));
}
function sheetAlert(msg){sheet(`<h3>Hm.</h3><p>${esc(msg)}</p><div class="sheet-acts"><button class="btn btn-hot" id="ok">OK</button></div>`,
  el=>el.querySelector('#ok').onclick=closeSheet)}
function sheetConfirm(title,msg,label,onYes){
  sheet(`<h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="sheet-acts">
    <button class="btn" id="no">Cancel</button><button class="btn btn-danger" id="yes">${esc(label)}</button></div>`,
    el=>{el.querySelector('#no').onclick=closeSheet;el.querySelector('#yes').onclick=()=>{closeSheet();onYes()}})}
function sheetPrompt(title,note,ph,onOk,initial){
  sheet(`<h3>${esc(title)}</h3>${note?`<p>${esc(note)}</p>`:''}
    <input class="field" id="f" placeholder="${esc(ph||'')}" value="${esc(initial||'')}" />
    <div class="sheet-acts"><button class="btn" id="no">Cancel</button><button class="btn btn-hot" id="yes">${initial?'Save':'Add'}</button></div>`,
    el=>{const f=el.querySelector('#f');f.focus();if(initial)f.setSelectionRange(f.value.length,f.value.length);
      const go=()=>{const v=f.value.trim();if(!v)return;closeSheet();onOk(v)};
      f.onkeydown=e=>{if(e.key==='Enter')go()};
      el.querySelector('#yes').onclick=go;el.querySelector('#no').onclick=closeSheet})}
/* Snooze is "reconsider me then," not a deadline — deliberately a separate field from
   due, so a snoozed item doesn't start reading as overdue. Presets match how snoozing
   actually gets used: looking ahead a day or two, or punting to next week. */
function snoozeSheet(id,after){
  const it=byId(id);if(!it)return;
  const iso=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
  const thisWeekend=(()=>{const x=new Date();const g=(6-x.getDay()+7)%7;x.setDate(x.getDate()+(g||6));return x.toISOString().slice(0,10)})();
  const nextMon=(()=>{const x=new Date();const g=(8-x.getDay())%7||7;x.setDate(x.getDate()+g);return x.toISOString().slice(0,10)})();
  const commit=(dateIso)=>{it.snoozeUntil=dateIso;setBucket(it,'backlog');save();closeSheet();if(after)after();else render()};
  sheet(`<h3>Snooze until</h3>
    <p>${esc(it.text)}</p>
    <div class="chips">
      <button class="dbtn" data-sn="${iso(1)}">Tomorrow</button>
      <button class="dbtn" data-sn="${thisWeekend}">This weekend</button>
      <button class="dbtn" data-sn="${nextMon}">Next Monday</button>
      <button class="dbtn" data-sn="${iso(7)}">Next week</button>
    </div>
    <div class="sheet-acts">
      <button class="btn" id="snpick">Pick a date</button>
      <span style="flex:1"></span>
      <button class="btn" id="snnone">No date — just backlog</button>
    </div>`,
  el=>{
    el.querySelectorAll('[data-sn]').forEach(b=>b.onclick=()=>commit(b.dataset.sn));
    el.querySelector('#snnone').onclick=()=>commit(null);
    el.querySelector('#snpick').onclick=()=>{closeSheet();openDate(it,()=>{setBucket(it,'backlog');save();if(after)after();else render()},'snoozeUntil')};
  });
}
function hoursSheet(){
  const m=S.ui.mode;
  const opts=m==='work'?[1,2,3,4,5,6]:[0.5,1,1.5,2,3,4];
  const draw=()=>{
    const h=S.hours[m],b=budget(h);
    sheet(`<h3>How much time is actually free today?</h3>
      <p>Look at the calendar first. Then give the pessimistic number — the one that assumes something will go wrong, because it will.</p>
      <div class="chips">${opts.map(v=>`<button class="chip ${h===v?'on':''}" data-h="${v}" style="color:var(--hot)"><b></b>${v} hours</button>`).join('')}</div>
      ${b?`<p style="margin:0"><b>${b.real}h</b> of that survives contact with the day. That buys <b>${b.deep?'one deep block':'no deep block'}</b>${b.batch?` and <b>${b.batch} batch task${b.batch===1?'':'s'}</b>`:''}.</p>`:''}
      <div class="sheet-acts" style="margin-top:26px">
        ${h?`<button class="btn" id="clr">Clear</button>`:''}<span style="flex:1"></span>
        <button class="btn btn-hot" id="ok">Done</button></div>`,
    el=>{el.querySelectorAll('[data-h]').forEach(b2=>b2.onclick=()=>{S.hours[m]=+b2.dataset.h;S.hours.date=today();save();draw()});
      const c=el.querySelector('#clr');if(c)c.onclick=()=>{S.hours[m]=null;save();draw()};
      el.querySelector('#ok').onclick=()=>{closeSheet();render()}});
  };
  draw();
}
function capSheet(){
  const m=S.ui.mode,cur=capOf(m),n=load_(m);
  const opts=m==='work'?[8,10,12,15,20]:[4,6,8,10,12];
  sheet(`<h3>How much fits in a week?</h3>
    <p>Not how much you'd like to do — how much you actually finish in a normal week. Set it low; a cap you can hit is worth more than one you admire.</p>
    <div class="chips">${opts.map(v=>`<button class="chip ${v===cur?'on':''}" data-cap="${v}" style="color:var(--hot)"><b></b>${v} tasks</button>`).join('')}</div>
    <p style="margin:0">Right now: <b>${n}</b> on the board${n>cur?` — <span style="color:#C5221F">${n-cur} over</span>`:''}. Parked columns don't count.</p>
    <div class="sheet-acts" style="margin-top:26px"><button class="btn btn-hot" id="ok">Done</button></div>`,
  el=>{el.querySelectorAll('[data-cap]').forEach(b=>b.onclick=()=>{S.cap[m]=+b.dataset.cap;save();closeSheet();render();
      toast(overCap(m)?'over capacity — send some to backlog':'capacity set')});
    el.querySelector('#ok').onclick=()=>{closeSheet();render()}});
}
/* How much of the weekly pick (Deep/Batch/Buffer/Spare) personal gets, not how much
   sits on the board overall — that's capSheet's job, this is a different number. */
function personalCapSheet(){
  const deepOpts=[1,2],batchOpts=[3,5,8,12];
  const draw=()=>{
    sheet(`<h3>This week's personal capacity</h3>
      <p>Personal is mostly quick things — scheduling, checking, printing. Deep is the exception, not the rule.</p>
      <div class="seg-label" style="margin:0 0 10px">Deep — max per week</div>
      <div class="chips">${deepOpts.map(v=>`<button class="chip ${v===S.personal.deepCap?'on':''}" data-pdeep="${v}" style="color:var(--hot)"><b></b>${v}</button>`).join('')}</div>
      <div class="seg-label" style="margin:22px 0 10px">Batch — quick tasks per week</div>
      <div class="chips">${batchOpts.map(v=>`<button class="chip ${v===S.personal.batchCap?'on':''}" data-pbatch="${v}" style="color:var(--hot)"><b></b>${v}</button>`).join('')}</div>
      <div class="sheet-acts" style="margin-top:26px"><button class="btn btn-hot" id="ok">Done</button></div>`,
    el=>{
      el.querySelectorAll('[data-pdeep]').forEach(b=>b.onclick=()=>{S.personal.deepCap=+b.dataset.pdeep;save();draw()});
      el.querySelectorAll('[data-pbatch]').forEach(b=>b.onclick=()=>{S.personal.batchCap=+b.dataset.pbatch;save();draw()});
      el.querySelector('#ok').onclick=()=>{closeSheet();if(ZEN)paintZen(false);else render()};
    });
  };
  draw();
}
function overflowSheet(item,onFiled){
  const m=item.mode,n=load_(m),c=capOf(m);
  const cands=onBoard(m).filter(i=>!isParked(i)&&i.id!==item.id&&!inPlan(m,i.id))
    .sort((a,b)=>(b.created||0)-(a.created||0)).slice(0,6);
  sheet(`<h3>The week is full.</h3>
    <p>${n} of ${c} already on the board. Something has to move to the backlog — this one, or one you said yes to earlier.</p>
    <div class="dsec"><div class="seg-label" style="margin:0 0 10px">New task</div>
      <button class="chip on" data-push="__new" style="color:var(--ink-3);max-width:100%"><b></b>${esc(item.text)}</button></div>
    ${cands.length?`<div class="dsec"><div class="seg-label" style="margin:0 0 10px">Or bump one of these</div>
      ${cands.map(i=>`<div style="margin-bottom:8px"><button class="chip" data-push="${i.id}" style="color:${cardColor(i)};max-width:100%"><b></b>${esc(i.text)}</button></div>`).join('')}</div>`:''}
    <div class="sheet-acts" style="margin-top:24px">
      <button class="btn" id="raise">Raise the cap</button>
      <span style="flex:1"></span>
      <button class="btn" id="anyway">Keep both anyway</button></div>`,
  el=>{
    el.querySelectorAll('[data-push]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.push;
      if(id==='__new'){setBucket(item,'backlog')}
      else{const o=byId(id);if(o){setBucket(o,'backlog');clearFromPlan(o.mode,o.id)}}
      save();closeSheet();render();toast('moved to backlog');if(onFiled)onFiled()});
    el.querySelector('#raise').onclick=()=>{S.cap[m]=c+1;save();closeSheet();render();toast('cap raised to '+(c+1));if(onFiled)onFiled()};
    el.querySelector('#anyway').onclick=()=>{closeSheet();render();if(onFiled)onFiled()};
  },true);
}
function closeTheDay(){
  const m=S.ui.mode,txt=planText(m),leftRaw=raw(m).length;
  sheet(`<h3>Take it to paper.</h3>
    <p>${leftRaw?`${leftRaw} item${leftRaw===1?'':'s'} still unsorted — they'll wait.`:'Everything is sorted and held. Copy this, close the tab, go work.'}</p>
    ${!txt?'<p style="color:var(--ink-3)">Nothing picked yet — choose a deep task and some batch ones first.</p>':''}
    <div class="paper" id="pp">${esc(txt)}</div>
    <div class="sheet-acts">
      <button class="btn" id="bk">Back up first</button>
      <button class="btn btn-hot" id="cp">Copy</button></div>`,
    el=>{el.querySelector('#cp').onclick=()=>{
        navigator.clipboard.writeText(txt).then(()=>{toast('copied');closeSheet()})
          .catch(()=>{const r=document.createRange();r.selectNodeContents(el.querySelector('#pp'));
            const s=getSelection();s.removeAllRanges();s.addRange(r);toast('selected — press ⌘C')})};
      el.querySelector('#bk').onclick=()=>{closeSheet();exportBackup()}},true)}

function openDetail(id){
  const draw=()=>{
    const i=byId(id);if(!i){closeSheet();return}
    if(!Array.isArray(i.steps))i.steps=[];
    const g=GROUPS[i.mode],w=i.ai?'ai':i.star?'star':i.quick?'quick':'plain';
    const box=mlayer.querySelector('#dtl');if(!box)return;
    box.innerHTML=`
      <textarea class="dtext" id="dt" rows="1">${esc(i.text)}</textarea>
      ${!hasVerb(i.text)?`<div class="nudge">✎ <span><b>No verb.</b> As written this is a topic. What's the first physical action?</span></div>`:''}
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Category</div>
        <div class="chips">${g.map(o=>`<button class="chip ${i[GKEY[i.mode]]===o.id?'on':''}" data-cat="${o.id}" style="color:${o.color}"><b></b>${o.name}</button>`).join('')}</div></div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Weight</div>
        <div class="chips">
          <button class="chip ${w==='star'?'on':''}" data-w="star" style="color:${C.purple}"><b></b>★ Deep work</button>
          <button class="chip ${w==='quick'?'on':''}" data-w="quick" style="color:${C.yellow}"><b></b>⚡ Under 60s</button>
          <button class="chip ${w==='plain'?'on':''}" data-w="plain" style="color:${C.grey}"><b></b>Normal</button>
          <button class="chip ${w==='ai'?'on':''}" data-w="ai" style="color:#7C5CFC"><b></b>🤖 For AI</button></div></div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Where</div>
        <div class="chips">
          <button class="chip ${i.bucket!=='backlog'?'on':''}" data-b="board" style="color:var(--hot)"><b></b>This week</button>
          <button class="chip ${i.bucket==='backlog'?'on':''}" data-b="backlog" style="color:${C.grey}"><b></b>Backlog</button></div>
        ${i.bucket==='backlog'?`<div style="margin-top:10px;font-family:var(--mono);font-size:13px;color:var(--ink-3)">
          ${i.snoozeUntil?`😴 snoozed until ${dueLabel(i.snoozeUntil).t} — `:''}<button class="zlink" id="dsnooze" style="font-size:13px">${i.snoozeUntil?'change':'snooze until…'}</button></div>`:''}</div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Date</div>
        <div class="dates">${dateChips(i)}</div></div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Steps ${i.steps.length?`— ${i.steps.filter(x=>x.done).length} of ${i.steps.length}`:''}</div>
        ${i.steps.map(st=>`<div class="stepline">
          <button class="sbox ${st.done?'on':''}" data-stog="${st.id}"></button>
          <input class="sinput ${st.done?'done':''}" data-sedit="${st.id}" value="${esc(st.text)}" />
          <button class="act del" data-sdel="${st.id}">×</button></div>`).join('')}
        <input class="snew" id="snew" placeholder="Break it down — press ⏎" /></div>
      ${!isParked(i)?`<div class="dsec"><div class="seg-label" style="margin:0 0 10px">Put on today</div>
        <div class="chips">
          <button class="chip" data-slot="deep" style="color:var(--hot)"><b></b>Deep</button>
          <button class="chip" data-slot="batch" style="color:var(--hot)"><b></b>Batch</button>
          <button class="chip" data-slot="buffer" style="color:var(--hot)"><b></b>Delegate to AI</button>
          <button class="chip" data-slot="next" style="color:var(--hot)"><b></b>Spare</button></div></div>`:''}
      <div class="sheet-acts" style="margin-top:30px">
        <button class="btn btn-danger" id="ddel">Delete</button>
        <span style="flex:1"></span>
        <button class="btn" id="ddone">✓ Done</button>
        <button class="btn btn-hot" id="dclose">Save</button></div>`;
    const ta=box.querySelector('#dt');autosize(ta);
    ta.oninput=()=>{autosize(ta);const v=ta.value.trim();if(v)i.text=v;save()};
    ta.onblur=()=>{draw()};
    box.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{i[GKEY[i.mode]]=b.dataset.cat;save();draw()});
    box.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const v=b.dataset.w;
      i.star=v==='star';i.quick=v==='quick';i.ai=v==='ai';save();draw()});
    box.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{setBucket(i,b.dataset.b);
      if(i.bucket==='backlog')clearFromPlan(i.mode,i.id);else i.snoozeUntil=null;save();draw()});
    const dsn=box.querySelector('#dsnooze');if(dsn)dsn.onclick=()=>snoozeSheet(i.id,draw);
    box.querySelectorAll('[data-dset]').forEach(b=>b.onclick=()=>{i.due=b.dataset.dset||null;save();draw()});
    const dpk=box.querySelector('[data-dpick]');if(dpk)dpk.onclick=()=>openDate(i,draw);
    box.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{assign(i.mode,b.dataset.slot,i.id);closeSheet()});
    box.querySelectorAll('[data-stog]').forEach(b=>b.onclick=()=>{
      const st=i.steps.find(x=>x.id===b.dataset.stog);if(st){st.done=!st.done;save();draw()}});
    box.querySelectorAll('[data-sedit]').forEach(el=>{
      el.oninput=()=>{const st=i.steps.find(x=>x.id===el.dataset.sedit);if(st){st.text=el.value;save()}};
      el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const nx=box.querySelector('#snew');if(nx)nx.focus()}}});
    box.querySelectorAll('[data-sdel]').forEach(b=>b.onclick=()=>{
      i.steps=i.steps.filter(x=>x.id!==b.dataset.sdel);save();draw()});
    const sn=box.querySelector('#snew');
    if(sn)sn.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const v=sn.value.trim();if(!v)return;
      i.steps.push({id:nid(),text:v,done:false});save();draw();
      const f=mlayer.querySelector('#snew');if(f)f.focus()}};
    box.querySelector('#dclose').onclick=()=>{closeSheet();render();toast('saved')};
    box.querySelector('#ddone').onclick=e=>{closeSheet();finish(i.id,e.currentTarget)};
    box.querySelector('#ddel').onclick=()=>{sheetConfirm('Delete this?',i.text,'Delete',()=>{
      S.items=S.items.filter(x=>x.id!==id);clearFromPlan(i.mode,id);save();render()})};
  };
  sheet('<div id="dtl"></div>',()=>draw(),true);
  const v=mlayer.querySelector('.veil');
  if(v)v.onclick=e=>{if(e.target.classList.contains('veil')){closeSheet();render()}};
}

/* ===== date picker ===== */
const dplayer=document.getElementById('dplayer');
let DPV=null;
function openDate(item,after,field){field=field||'due';const cur=item[field];
  const b=cur?new Date(cur+'T12:00:00'):new Date();
  DPV={y:b.getFullYear(),m:b.getMonth(),item,after,field};drawDP()}
function drawDP(){
  const {y,m,item,field}=DPV,first=new Date(y,m,1),start=first.getDay(),dim=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();
  let cells='';
  for(let k=start-1;k>=0;k--)cells+=`<div class="dp-d mute">${prev-k}</div>`;
  for(let d=1;d<=dim;d++){const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cl=['dp-d'];if(iso===today())cl.push('today');if(item[field]===iso)cl.push('sel');
    cells+=`<div class="${cl.join(' ')}" data-iso="${iso}">${d}</div>`}
  const tail=(7-((start+dim)%7))%7;
  for(let d=1;d<=tail;d++)cells+=`<div class="dp-d mute">${d}</div>`;
  dplayer.innerHTML=`<div class="veil in"><div class="sheet dp">
    <div class="dp-head"><button class="dp-nav" data-mv="-1">‹</button>
      <div class="dp-month">${first.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</div>
      <button class="dp-nav" data-mv="1">›</button></div>
    <div class="dp-grid">${['S','M','T','W','T','F','S'].map(w=>`<div class="dp-w">${w}</div>`).join('')}${cells}</div>
    <div class="dp-quick"><button class="dp-q" data-q="0">Today</button><button class="dp-q" data-q="1">Tomorrow</button>
      <button class="dp-q" data-q="w">This weekend</button><button class="dp-q" data-q="7">Next week</button>
      <button class="dp-q clear" data-q="x">No date</button></div></div></div>`;
  dplayer.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{DPV.m+=+b.dataset.mv;
    if(DPV.m<0){DPV.m=11;DPV.y--}if(DPV.m>11){DPV.m=0;DPV.y++}drawDP()});
  dplayer.querySelectorAll('[data-iso]').forEach(b=>b.onclick=()=>setDate(b.dataset.iso));
  dplayer.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const q=b.dataset.q;if(q==='x')return setDate(null);
    const d=new Date();if(q==='w'){const g=(6-d.getDay()+7)%7;d.setDate(d.getDate()+(g||6))}else d.setDate(d.getDate()+ +q);
    setDate(d.toISOString().slice(0,10))});
  dplayer.querySelector('.veil').onclick=e=>{if(e.target.classList.contains('veil'))closeDP()};
}
function setDate(iso){DPV.item[DPV.field]=iso;save();const a=DPV.after;closeDP();if(a)a();else render()}
function closeDP(){dplayer.innerHTML='';DPV=null}

/* ===== render ===== */
const app=document.getElementById('app'),layer=document.getElementById('layer'),keysbox=document.getElementById('keysbox');
function render(){
  const m=S.ui.mode,other=m==='work'?'personal':'work';
  document.body.dataset.mode=m;
  const P=m==='personal';
  const nRaw=P?0:raw(m).length,otherN=other==='personal'?townHeld():mine(other).length,bAge=backupAge();
  const v=m==='work'?S.ui.workView:S.ui.personalView;
  const body=P?(v==='north'?viewNorth():viewTown())
    :v==='home'?viewHome(m):v==='backlog'?viewCols('backlog'):viewToday();
  const tn=st=>S.town.items.filter(i=>i.state===st).length;
  const tabs=P?[['town:home','Town hall',''],['town:today','Today',S.town.items.filter(tIsToday).length],['town:ai','AI queue',tn('ai')],
      ['town:waiting','Waiting',tn('waiting')],['town:map','Town map',''],['spark','Journal ↗',''],['north','North Star','']]
    :[['home','Home',''],['today','Today',''],['backlog','Backlog',inBacklog(m).length]];
  const tvOn=k=>P&&k.startsWith('town:')?v==='town'&&k.slice(5)===(S.ui.townView==='dept'?'map':S.ui.townView||'home'):v===k;
  app.innerHTML=`<div class="wrap">
    <div class="top">
      <div class="modes">
        <button class="mode-btn ${m==='work'?'on':''}" data-mode="work">Work</button>
        <button class="mode-btn ${m==='personal'?'on':''}" data-mode="personal">Personal</button>
        <span class="modehint" title="Tab switches mode">⇥</span>
      </div><div class="grow"></div>
      <div class="ledger">${'<i></i>'.repeat(Math.min(otherN,20))||'<i style="opacity:.15"></i>'} ${otherN} held in ${other}</div>
    </div>
    ${!STORE_OK?`<div class="alarm"><b>This copy can't save.</b> Storage is blocked here. Download the file and open it from your own machine.</div>`:''}
    ${healed?`<div class="alarm">${healed} item${healed===1?'':'s'} were filed under a category that no longer exists. They're back in the sort queue.</div>`:''}
    ${wishMoved?`<div class="alarm">${wishMoved} item${wishMoved===1?'':'s'} moved from the backlog to Wishes after ${WISH_AFTER_DAYS} quiet days there.</div>`:''}
    <div class="nav">
      ${tabs.map(([k,l,n])=>k==='spark'?`<button class="tab" id="navspark" title="Opens Spark in a new tab">${l}</button>`
        :`<button class="tab ${tvOn(k)?'on':''}" data-v="${k}">${l}${n!==''&&n!==0?`<span class="n">${n}</span>`:''}</button>`).join('')}
      <span class="spacer"></span>
      ${P?'':`<button class="cap capopen ${overCap(m)?'over':load_(m)===capOf(m)?'full':''}"
        title="How much you've said yes to this week. Click to change.">
        <span class="lbl">This week</span>
        <span class="capbar"><i style="width:${Math.min(100,Math.round(load_(m)/Math.max(1,capOf(m))*100))}%"></i></span>
        <span class="num">${load_(m)} / ${capOf(m)}</span></button>`}
      ${nRaw?`<button class="sortbtn" id="go">Sort ${nRaw} raw${TOUCH?'':' · t'}</button>`:''}
    </div>
    ${body}
    <div class="dropbar" id="dropbar"><span>⌛ Drop here to send it to the backlog</span></div>
    <div class="foot">
      <div class="meta ${bAge>6?'warn':''}">${S.lastBackup?(bAge===0?'backed up today':'last backup '+bAge+' days ago'):'never backed up'}</div>
      <div class="meta" style="opacity:.5">${APPVER}</div>
      <button class="btn" id="donebtn">Done ${doneCount()>0?'· '+doneCount():''}</button>
      <button class="btn" id="exp">↓ Export backup</button>
      <button class="btn" id="imp">↑ Import backup</button>
    </div></div>`;
  healed=0;wishMoved=0;drawKeys();wire();
}

/* ---- HOME ---- */
function viewHome(m){
  const steps=zSteps(m),done=(S.ritual[m]||[]).filter(id=>steps.some(x=>x.id===id));
  const ritualDone=done.length>=steps.length;
  const p=plan(m),caps=m==='personal'?personalCaps():dayCaps(m);
  const deepId=m==='personal'?(p.deep&&p.deep[0]):p.deep;
  const deepItem=deepId?byId(deepId):null;
  const backlogN=inBacklog(m).length;
  const phrase=m==='personal'?weekPhrase():'';
  return `
  <div class="home-grid">
    ${m==='personal'?`<button class="hometile hometile-phrase" id="hometile-phrase">
      <span class="ht-label">💛 What would make this week good</span>
      <span class="ht-title">${phrase?esc(phrase):'Not set yet — tap to choose one thing'}</span>
    </button>`:''}
    <button class="hometile hometile-ritual" id="hometile-ritual">
      <span class="ht-label">${m==='personal'?'Personal':'Work'} ritual</span>
      <span class="ht-title">${ritualDone?'Ritual done':done.length?'Continue the ritual':'Begin the ritual'}</span>
      <span class="ht-meta">${done.length} of ${steps.length} steps</span>
    </button>
    <div class="home-row">
      <button class="hometile" data-hv="today">
        <span class="ht-label">${m==='personal'?'This week':'Today'}</span>
        <span class="ht-title">${deepItem?esc(deepItem.text):'Nothing chosen yet'}</span>
        <span class="ht-meta">${m==='personal'?`${caps.deep} deep max`:caps.deep?'1 deep':'no deep'} · ${caps.batch} batch · ${caps.buffer} to AI</span>
      </button>
      <button class="hometile" data-hv="backlog">
        <span class="ht-label">Backlog</span>
        <span class="ht-title">${backlogN} waiting</span>
        <span class="ht-meta">Later. Review once a week.</span>
      </button>
      <button class="hometile" id="hometile-spark">
        <span class="ht-label">${m==='work'?'Morning Pages':'Journal'}</span>
        <span class="ht-title">Write in Spark ↗</span>
        <span class="ht-meta">Opens in a new tab</span>
      </button>
    </div>
  </div>`;
}

/* ---- TODAY ---- */
function viewToday(){
  const m=S.ui.mode,p=plan(m),caps=dayCaps(m);
  const rest=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id)).sort(byOrd);
  const dp=p.deep?byId(p.deep):null,sug=!dp&&caps.deep?suggestDeep(m):null;
  const streak=S.streak[m];
  const pp=personalPick();

  return `
  <div class="daybar">
    <div class="db-sp"></div>
    <button class="btn btn-hot" id="closeday">Copy today → paper</button>
    <button class="btn" id="resetday" title="Untick the ritual and clear today’s picks">↻</button>
  </div>

  <div class="planhead"><h2>Today</h2>
    <span>${caps.deep?'1 deep':'no deep'} · ${caps.batch} batch · ${caps.buffer} to AI · 2 spare</span></div>

  ${pp?`<div class="db-chip flat" style="border-color:var(--green,#1E8E3E);display:inline-flex;margin-bottom:22px">Personal: ${esc(pp.title)}
    <em><button class="act" data-tpdone="${pp.id}" style="padding:0;color:var(--green,#1E8E3E)">✓ mark done</button></em></div>`:''}

  <div class="slotlabel"><b>Deep</b> — ${caps.deep?'the one thing':'no room today'}
    ${streak.count>0?`<span class="streak ${streak.hitToday?'lit':''}" title="Days in a row you finished the deep task on a day that had room for one">🔥 ${streak.count}</span>`:''}</div>
  ${dp?deepCard(dp):`<div class="deep empty" data-slotdrop="deep">
      <div class="emptynote">${caps.deep?(TOUCH?'Nothing chosen yet. Tap a task below and choose Deep.':'Nothing chosen yet. Drag one up here.'):'Your day is too short for a deep block.'}</div>
      ${sug?`<div class="suggest"><span class="txt">Suggested: ${esc(sug.text)}</span>
        <button class="btn btn-hot btn-sm" data-usedeep="${sug.id}">Use this</button></div>`:''}
    </div>`}

  ${fireCard(m)}

  <div class="slotlabel">Delegate to AI — ${p.buffer.length} of ${caps.buffer}</div>
  <div class="slots b2" data-slotdrop="buffer">
    ${[0,1].map(k=>p.buffer[k]?slotCard(byId(p.buffer[k]),'buffer'):`<div class="slot empty buffer">open</div>`).join('')}
  </div>

  <div class="secondary">
    <div class="slotlabel secondary-head">Also today, if it goes well</div>
    <div class="slotlabel sub">Batch — ${p.batch.length} of ${caps.batch}</div>
    <div class="slots ${caps.batch>=3?'b3':caps.batch===2?'b2':'b1'}" data-slotdrop="batch">
      ${caps.batch===0?`<div class="slot empty">no room today</div>`
        :Array.from({length:caps.batch}).map((_,k)=>p.batch[k]?slotCard(byId(p.batch[k]),'batch'):`<div class="slot empty">${TOUCH?'open':'drop a batch task'}</div>`).join('')}
    </div>

    <div class="slotlabel sub">Spare — ${p.next.length} of 2</div>
    <div class="slots b2" data-slotdrop="next">
      ${[0,1].map(k=>p.next[k]?slotCard(byId(p.next[k]),'next'):`<div class="slot empty next">spare</div>`).join('')}
    </div>
  </div>

  <div class="rest">
    <h3>Also on the board — ${rest.length}</h3>
    <div class="restgrid">${GROUPS[m].filter(g=>!PARKED[m].includes(g.id)).map(g=>{
        const list=rest.filter(i=>i[GKEY[m]]===g.id);
        const quiet=quietDays(m,g.id);
        return `<div class="restgroup zone" data-drop="${g.id}" data-bucket="board">
          <h4 style="color:${g.color}"><b></b>${g.name}
            ${quiet>=10?`<em class="quiet" title="Nothing finished here in ${quiet} days">${quiet}d quiet</em>`:''}
            <span>${list.length}</span></h4>
          ${list.map(mini).join('')}
          ${S.ui.composer==='board:'+g.id
            ?`<div class="composer"><textarea id="comp" rows="1" placeholder="What's the action?"></textarea>
                <div class="hint">⏎ add · esc close</div></div>`
            :`<button class="addbtn" data-addto="board:${g.id}">＋ Add</button>`}
        </div>`}).join('')}</div>
  </div>`;
}
function viewWeekThis(){
  const m='personal',p=personalPlan(),caps=personalCaps();
  const rest=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id)).sort(byOrd);
  const dp=p.deep.map(byId).filter(Boolean);

  return `
  <div class="daybar">
    ${(()=>{const hp=S.personal.happyPick?byId(S.personal.happyPick):null;
      return hp?`<div class="db-chip flat" style="border-color:#F9AB00">💛 ${esc(hp.text)}
        <em><button class="act" data-done="${hp.id}" style="padding:0;color:#B06000">✓ mark done</button></em></div>`:'';})()}
    ${weekPhrase()?`<div class="db-chip flat" style="border-color:#F9AB00">💛 ${esc(weekPhrase())}<em>this week</em></div>`:''}
    <div class="db-sp"></div>
    <button class="btn btn-hot" id="closeday">Copy this week → paper</button>
  </div>


  <div class="planhead"><h2>This week</h2>
    <span>${caps.deep} deep max · ${caps.batch} batch · ${caps.buffer} to AI · ${caps.next} spare</span></div>

  <div class="slotlabel"><b>Deep</b> — up to ${caps.deep} this week</div>
  <div class="slots ${caps.deep>=2?'b2':'b1'}">
    ${dp.map(deepCard).join('')}
    ${dp.length<caps.deep?`<div class="deep empty" data-slotdrop="deep">
      <div class="emptynote">Nothing chosen yet. Most weeks this stays empty — that's fine.</div></div>`:''}
  </div>

  ${fireCard(m)}

  <div class="slotlabel">Delegate to AI — ${p.buffer.length} of ${caps.buffer}</div>
  <div class="slots b2" data-slotdrop="buffer">
    ${[0,1].map(k=>p.buffer[k]?slotCard(byId(p.buffer[k]),'buffer'):`<div class="slot empty buffer">open</div>`).join('')}
  </div>

  <div class="secondary">
    <div class="slotlabel secondary-head">Also this week — the quick stuff</div>
    <div class="slotlabel sub">Batch — ${p.batch.length} of ${caps.batch}</div>
    <div class="slots ${caps.batch>=3?'b3':caps.batch===2?'b2':'b1'}" data-slotdrop="batch">
      ${caps.batch===0?`<div class="slot empty">no room this week</div>`
        :Array.from({length:Math.min(caps.batch,6)}).map((_,k)=>p.batch[k]?slotCard(byId(p.batch[k]),'batch'):`<div class="slot empty">${TOUCH?'open':'drop a batch task'}</div>`).join('')}
    </div>

    <div class="slotlabel sub">Spare — ${p.next.length} of ${caps.next}</div>
    <div class="slots b2" data-slotdrop="next">
      ${[0,1].map(k=>p.next[k]?slotCard(byId(p.next[k]),'next'):`<div class="slot empty next">spare</div>`).join('')}
    </div>
  </div>

  <div class="rest">
    <h3>Also on the board — ${rest.length}</h3>
    <div class="restgrid">${GROUPS[m].filter(g=>!PARKED[m].includes(g.id)).map(g=>{
        const list=rest.filter(i=>i[GKEY[m]]===g.id);
        const quiet=quietDays(m,g.id);
        return `<div class="restgroup zone" data-drop="${g.id}" data-bucket="board">
          <h4 style="color:${g.color}"><b></b>${g.name}
            ${quiet>=10?`<em class="quiet" title="Nothing finished here in ${quiet} days">${quiet}d quiet</em>`:''}
            <span>${list.length}</span></h4>
          ${list.map(mini).join('')}
          ${S.ui.composer==='board:'+g.id
            ?`<div class="composer"><textarea id="comp" rows="1" placeholder="What's the action?"></textarea>
                <div class="hint">⏎ add · esc close</div></div>`
            :`<button class="addbtn" data-addto="board:${g.id}">＋ Add</button>`}
        </div>`}).join('')}</div>
  </div>`;
}
function deepCard(i){
  const g=groupOf(i),l=i.due?dueLabel(i.due):null;
  return `<div class="deep" data-slotdrop="deep" draggable="true" data-id="${i.id}" style="${styleFor(i)}">
    <span class="wash"></span>
    <div class="deep-t">${esc(i.text)}</div>
    <svg class="strike" viewBox="0 0 200 26" preserveAspectRatio="none"><path d="M2,15 C46,9 78,20 118,13 C150,8 172,18 198,11"/></svg>
    <span class="seal">✓</span>
    <div class="meta">
      ${g?`<span class="dot" style="color:${g.color}"><b></b>${g.name}</span>`:''}
      ${l?`<span class="tag pill" style="background:${l.c==='late'?C.red:'var(--hot)'}">${l.t}</span>`:''}
      ${i.star?`<span class="tag pill" style="background:${C.purple}">★ deep</span>`:''}
      ${!hasVerb(i.text)?`<span class="tag noverb" data-text="${i.id}">no verb — name the action</span>`:''}
    </div>
    <div class="acts"><button class="btn btn-hot" data-done="${i.id}">Done</button>
      <button class="btn" data-open2="${i.id}">Edit</button>
      <button class="btn" data-unplan="${i.id}">Put it back</button></div></div>`;
}
function slotCard(i,slot){
  const g=groupOf(i);
  return `<div class="slot ${slot==='next'?'next':slot==='buffer'?'buffer':''}" draggable="true" data-id="${i.id}" style="${styleFor(i)}">
    <span class="wash"></span>
    <svg class="strike" viewBox="0 0 200 26" preserveAspectRatio="none"><path d="M2,15 C46,9 78,20 118,13 C150,8 172,18 198,11"/></svg>
    <span class="seal">✓</span>
    <div class="st">${esc(i.text)}</div>
    <div class="sf">${g?`<span class="tag" style="color:${g.color}">${esc(g.name.split(' ')[0])}</span>`:''}</div>
    <div class="floatbar"><button class="act" data-done="${i.id}">Done</button>
      ${slot!=='deep'?`<button class="act" data-todeep="${i.id}">Deep</button>`:''}
      <button class="act" data-open2="${i.id}">Edit</button>
      <button class="act" data-unplan="${i.id}">Put back</button></div></div>`;
}
function mini(i){
  const g=groupOf(i),l=i.due?dueLabel(i.due):null;
  return `<div class="mini" draggable="true" data-id="${i.id}" data-open="${i.id}">
    <span class="d" style="background:${dotColor(i)}"></span>
    <span class="t">${esc(i.text)}</span>
    ${l?`<span class="tag" style="color:${l.c==='late'?C.red:'var(--ink-3)'}">${l.t}</span>`:''}
    <span class="floatbar"><button class="act" data-done="${i.id}" title="Already done">✓ Done</button>
      <button class="act" data-todeep="${i.id}">Deep</button>
      <button class="act" data-tobatch="${i.id}">Batch</button>
      <button class="act" data-tobuffer="${i.id}">AI</button>
      <button class="act" data-tonext="${i.id}">Spare</button>
      <button class="act" data-open2="${i.id}">Edit</button>
      <button class="act" data-later2="${i.id}">⌛ Later</button></span></div>`;
}

/* ---- columns ---- */
function card(i,when){
  return `<div class="card ${i.fresh?'landing':''}" draggable="true" data-id="${i.id}" data-open="${i.id}" style="${styleFor(i)}">
    <span class="wash"></span>
    <svg class="strike" viewBox="0 0 200 26" preserveAspectRatio="none"><path d="M2,15 C46,9 78,20 118,13 C150,8 172,18 198,11"/></svg>
    <span class="seal">✓</span>
    ${!hasVerb(i.text)?'<span class="vdot" title="No verb yet"></span>':''}
    ${(Array.isArray(i.steps)&&i.steps.length)?`<span class="sprog"><i style="width:${Math.round(i.steps.filter(x=>x.done).length/i.steps.length*100)}%"></i></span>`:''}
    <div class="card-top"><button class="tick" data-done="${i.id}" title="Done"></button>
      <div class="card-text">${esc(i.text)}</div></div>
    ${when?`<div class="card-sub"><span class="tag" style="color:${when.c==='late'?C.red:'var(--hot)'}">${when.t}</span></div>`:''}</div>`;
}
/* The work backlog is sorted by what each item is waiting for, not by category (an
   "Urgent" column makes no sense for things that are, by definition, later). Each item
   lands in the first column it matches, in this order. Category stays as the card's
   color bar and still drives the board once the item comes back. */
const WORK_BACKLOG=[
  {id:'sched',name:'Scheduled',color:'var(--hot)',test:i=>!!schedDate(i)},
  {id:'hold',name:'On hold',color:C.grey,test:i=>i.lane==='hold'},
  {id:'wish',name:'Wishes',color:C.cyan,test:i=>i.lane==='ideas'},
  {id:'ai',name:'For AI',color:'#7C5CFC',test:i=>!!i.ai},
  {id:'deep',name:'Deep backlog',color:C.purple,test:i=>!!i.star},
  {id:'batch',name:'Batch backlog',color:C.yellow,test:()=>true}];
const WORK_BACKLOG_ORDER=['sched','hold','deep','batch','ai','wish'];
/* display order only — which column an item lands in never depends on this */
function backlogOrder(){
  const o=(S.ui.backlogOrder||WORK_BACKLOG_ORDER).filter(id=>WORK_BACKLOG.some(c=>c.id===id));
  WORK_BACKLOG_ORDER.forEach(id=>{if(!o.includes(id))o.push(id)});
  return o;
}
/* Trello-style column drag: grab a header (long-press on touch), the column lifts and
   follows the pointer while the others slide aside. Kept apart from card drag, which uses
   native HTML5 drag on the cards themselves. */
function colDrag(h){
  const col=h.parentNode,wrap=col.parentNode;
  let on=false,armed=null,sx=0,sy=0,ox=0,oy=0,px=0,py=0,ph=null,raf=0;
  const others=()=>[...wrap.children].filter(e=>e!==col&&e!==ph);
  const flip=mut=>{const els=others(),b4=new Map(els.map(e=>[e,e.getBoundingClientRect().left]));mut();
    els.forEach(e=>{const dx=b4.get(e)-e.getBoundingClientRect().left;
      if(dx)e.animate([{transform:`translateX(${dx}px)`},{transform:'none'}],{duration:220,easing:'cubic-bezier(.2,.8,.3,1)'})})};
  const place=()=>{
    /* layout positions (offsetLeft) not on-screen ones, so mid-slide columns don't make it jitter */
    const x=px-wrap.getBoundingClientRect().left+wrap.scrollLeft;
    const before=others().find(e=>x<e.offsetLeft+e.offsetWidth/2)||null;
    if(before?ph.nextElementSibling!==before:ph!==wrap.lastElementChild)flip(()=>wrap.insertBefore(ph,before))};
  const move=(x,y)=>{px=x;py=y;col.style.left=(x-ox)+'px';col.style.top=(y-oy)+'px';place()};
  const tick=()=>{if(!on)return;const r=wrap.getBoundingClientRect(),E=70;
    const d=px<Math.max(r.left,0)+E?-14:px>Math.min(r.right,innerWidth)-E?14:0;
    if(d){const b=wrap.scrollLeft;wrap.scrollLeft+=d;if(wrap.scrollLeft!==b)place()}
    raf=requestAnimationFrame(tick)};
  const start=(x,y)=>{on=true;const r=col.getBoundingClientRect();ox=x-r.left;oy=y-r.top;
    document.body.classList.add('coldrag');
    ph=document.createElement('div');ph.className='col-ph';ph.style.height=r.height+'px';
    wrap.insertBefore(ph,col);
    Object.assign(col.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',zIndex:400,margin:0});
    col.classList.add('col-lift');
    if(navigator.vibrate)navigator.vibrate(10);
    move(x,y);tick()};
  const end=()=>{if(!on)return;on=false;cancelAnimationFrame(raf);
    const r=ph.getBoundingClientRect();
    col.classList.remove('col-lift');
    col.animate([{left:col.style.left,top:col.style.top,transform:'rotate(2deg)'},{left:r.left+'px',top:r.top+'px',transform:'none'}],
      {duration:180,easing:'ease-out',fill:'forwards'}).onfinish=()=>{
      const o=[...wrap.children].filter(e=>e!==col).map(e=>e===ph?col.dataset.colid:e.dataset.colid).filter(Boolean);
      document.body.classList.remove('coldrag');
      S.ui.backlogOrder=o;save();render()}};
  h.addEventListener('mousedown',e=>{if(e.button!==0)return;e.preventDefault();sx=e.clientX;sy=e.clientY;
    const mm=v=>{if(!on&&Math.hypot(v.clientX-sx,v.clientY-sy)>4)start(sx,sy);if(on)move(v.clientX,v.clientY)};
    const mu=()=>{removeEventListener('mousemove',mm);removeEventListener('mouseup',mu);end()};
    addEventListener('mousemove',mm);addEventListener('mouseup',mu)});
  h.addEventListener('touchstart',e=>{if(e.touches.length>1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;
    armed=setTimeout(()=>{armed=null;start(sx,sy)},350)},{passive:true});
  h.addEventListener('touchmove',e=>{const t=e.touches[0];
    if(on){e.preventDefault();move(t.clientX,t.clientY)}
    else if(armed&&Math.hypot(t.clientX-sx,t.clientY-sy)>8){clearTimeout(armed);armed=null}},{passive:false});
  const tend=()=>{if(armed){clearTimeout(armed);armed=null}end()};
  h.addEventListener('touchend',tend);h.addEventListener('touchcancel',tend);
}
const backlogCol=i=>WORK_BACKLOG.find(c=>c.test(i)).id;
/* dropping into (or adding to) a backlog column sets what that column means */
function applyBacklogCol(i,col){
  const lane=fallback=>{if(!i.lane||isParked(i))i.lane=fallback};
  if(col==='hold')i.lane='hold';
  else if(col==='wish')i.lane='ideas';
  else if(col==='deep'){lane('important');i.star=true;i.quick=false;i.ai=false}
  else if(col==='batch'){lane('batch');i.star=false;i.ai=false}
  else if(col==='ai'){lane('batch');i.ai=true;i.star=false;i.quick=false}
  i.sorted=true;setBucket(i,'backlog');
}
/* the date a backlog item is waiting on: its due date, or the day its snooze ends */
const schedDate=i=>i.due||i.snoozeUntil||null;
function schedLabel(i){
  if(i.due)return dueLabel(i.due);
  const l=dueLabel(i.snoozeUntil);return {t:'😴 back '+l.t,c:''};
}
function viewCols(bucket){
  const m=S.ui.mode,defs=GROUPS[m],key=GKEY[m];
  const items=(bucket==='board'?onBoard(m):inBacklog(m));
  const note=bucket==='board'
    ?'This week. Drag to re-file or re-order. Anything you won’t touch in the next few days belongs in Backlog.'
    :'Later. Nothing here appears on Today. Review it once a week and pull what’s ready into the Board.';
  if(bucket==='backlog'&&m==='work')return viewWorkBacklog(items);
  return `<div style="font-size:18px;color:var(--ink-2);margin-bottom:22px;max-width:80ch">${note}</div>
  <div class="cols">${defs.map(d=>{
    const list=items.filter(i=>i[key]===d.id&&!i.project).sort(byOrd);
    return `<div class="col zone" data-drop="${d.id}" data-bucket="${bucket}">
      <div class="col-head"><span class="dot" style="color:${d.color}"><b></b></span>
        <span class="col-name" style="color:${d.color}">${d.name}</span>
        <span class="col-n">${list.length}</span></div>
      ${list.map(i=>card(i)).join('')}
      ${!list.length?'<div class="col-empty">Clear.</div>':''}
      ${S.ui.composer===bucket+':'+d.id
        ?`<div class="composer"><textarea id="comp" rows="1" placeholder="What's the action?"></textarea>
            <div class="hint">⏎ add · esc close</div></div>`
        :`<button class="addbtn" data-addto="${bucket}:${d.id}">＋ Add</button>`}
    </div>`}).join('')}</div>`;
}

function viewWorkBacklog(items){
  items=items.filter(i=>!i.project);
  const order=backlogOrder(),custom=order.join()!==WORK_BACKLOG_ORDER.join();
  return `<div style="font-size:18px;color:var(--ink-2);margin-bottom:22px;max-width:80ch">Later — sorted by what each thing is waiting for. Nothing here appears on Today; review it once a week and pull what's ready back in.
    ${custom?`<button class="zlink" id="colreset" style="font-size:12px">reset column order</button>`:''}</div>
  <div class="cols">${order.map(id=>{
    const c=WORK_BACKLOG.find(x=>x.id===id),sched=id==='sched';
    const list=items.filter(i=>backlogCol(i)===id)
      .sort(sched?(a,b)=>schedDate(a)<schedDate(b)?-1:schedDate(a)>schedDate(b)?1:0:byOrd);
    return `<div class="col ${sched?'col-sched':'zone'}" data-colid="${id}" ${sched?'':`data-bcol="${id}" data-bucket="backlog"`}>
      <div class="col-head"><span class="dot" style="color:${c.color}"><b></b></span>
        <span class="col-name" style="color:${c.color}">${c.name}</span>
        <span class="col-n">${list.length}</span></div>
      ${list.map(i=>card(i,sched?schedLabel(i):null)).join('')}
      ${!list.length?`<div class="col-empty">${sched?'Nothing dated.':'Clear.'}</div>`:''}
      ${sched?'':S.ui.composer==='bcol:'+id
        ?`<div class="composer"><textarea id="comp" rows="1" placeholder="What's the action?"></textarea>
            <div class="hint">⏎ add · esc close</div></div>`
        :`<button class="addbtn" data-addto="bcol:${id}">＋ Add</button>`}
    </div>`}).join('')}</div>`;
}

/* ---- fire (quick, sub-60s tasks — one at a time, no ceremony). Embedded inline in
   Today/This week rather than its own tab — same board data, no reason to duplicate the nav. */
function fireCard(m){
  const pool=quickPool(m);
  if(!pool.length)return '';
  const i=pool[0],g=groupOf(i);
  return `
  <div class="slotlabel">Quick — ${pool.length} queued, one at a time</div>
  <div class="deep" data-id="${i.id}" style="${styleFor(i)}">
    <span class="wash"></span>
    <div class="deep-t">${esc(i.text)}</div>
    <svg class="strike" viewBox="0 0 200 26" preserveAspectRatio="none"><path d="M2,15 C46,9 78,20 118,13 C150,8 172,18 198,11"/></svg>
    <span class="seal">✓</span>
    <div class="meta">
      ${g?`<span class="dot" style="color:${g.color}"><b></b>${g.name}</span>`:''}
      <span class="tag pill" style="background:${C.yellow};color:#202124">⚡ under 60s</span>
    </div>
    <div class="acts">
      <button class="btn btn-hot" data-done="${i.id}">Done · next</button>
      <button class="btn" data-fireskip="${i.id}">Skip for now</button>
      <button class="btn" data-open2="${i.id}">Edit</button>
    </div>
  </div>`;
}

/* ---- north star (goals / mission / how you're doing) ---- */
function viewNorth(){
  return `
  <div class="planhead"><h2>North Star</h2><span>goals · mission · how you're doing</span></div>
  <div class="zdump" style="border-bottom:3px solid var(--line)">
    <textarea id="northtext" rows="12" placeholder="What are you actually building toward? Come back here whenever the tasks start feeling untethered from a reason.">${esc(S.north)}</textarea>
  </div>
  <div class="db-chip flat" style="display:inline-flex">autosaves as you type</div>
  ${S.personal.anchorArchive.length?`<div class="rest">
    <h3>What made past weeks good</h3>
    ${S.personal.anchorArchive.map(a=>`<div class="donerow"><span class="d" style="background:#F9AB00;opacity:1"></span>
      <span class="t" style="text-decoration:none">${esc(a.text)}</span>
      <span class="tag">${a.weekIso?'week of '+new Date(a.weekIso+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'}):'earlier'}</span></div>`).join('')}
  </div>`:''}`;
}
function drawKeys(){
  const rows=[['Anywhere',[['⇥ Tab','switch mode'],['1 / 2','work / personal'],['t','sort raw items']]],
    ['Sorting · step 1',[['1–6','choose the category'],['→','skip'],['esc','stop']]],
    ['Sorting · step 2',[['1','★ deep — this week'],['2','⚡ quick — this week'],['3','• normal — this week'],['4','⌛ later — backlog'],['←','back']]],
    ['Ritual',[['▶ Begin','full-screen, one step at a time'],['⏎ / space','next step'],['esc','leave, keeps your place']]],
    ['Today',[['drag','into deep / batch / spare'],['drag back','onto any block below'],['click a card','open its details']]]];
  keysbox.innerHTML=`${S.ui.keys?`<div class="keyslist">${rows.map(([h,rs])=>`<h5>${h}</h5>${rs.map(([k,v])=>`<div class="keyrow"><kbd>${k}</kbd><span>${v}</span></div>`).join('')}`).join('')}</div>`:''}
    <button class="keystoggle" id="ktog">⌨ Shortcuts ${S.ui.keys?'▾':'▴'}</button>`;
  document.getElementById('ktog').onclick=()=>{S.ui.keys=!S.ui.keys;save();drawKeys()};
}

/* ===== zen ritual ===== */
/* step kind is keyed off the step id — never off its wording */
const ZKIND={wk:'week',w1:'plain',wj:'spark',wad:'adcheck',w2:'dump',w4:'sort',w5:'hours',ww:'weekhours',w6:'pick',wpw:'weekpick',wpr:'pcheck',w8:'pnudge',w7:'paper',
             p0:'anchors',p1:'dump',p2:'sort',p4:'pickweek',p5:'paper'};
const WEEKSTEP={id:'wk',name:'Choose this week'};
/* Personal gets a separate "Choose this week" step, once a week (its whole cadence is
   weekly). Work has no separate step: choosing the week happens inside "Pick today and
   this week", alongside the backlog, against the limit set by the week-hours step. */
function zSteps(m){
  const base=RITUALS[m];
  if(m==='work')return base;
  const gated=m==='personal'&&S.week.iso===isoWeek()&&S.week[m];
  if(gated)return base;
  const sortIdx=base.findIndex(s=>ZKIND[s.id]==='sort');
  const at=sortIdx>=0?sortIdx+1:0;
  return [...base.slice(0,at),WEEKSTEP,...base.slice(at)];
}
let ZEN=false,ZI=0,ZT0=0,ZTICK=null,ZJUST=[],ZSTEPS=[];
const zlayer=(()=>{const d=document.createElement('div');document.body.appendChild(d);return d})();

/* backlog, minus parked lanes: snoozes that have come due first, then by due date, then oldest */
function zBacklog(m){
  return inBacklog(m).filter(i=>!isParked(i)).sort((x,y)=>{
    const rx=x.snoozeUntil&&x.snoozeUntil<=today()?0:1,ry=y.snoozeUntil&&y.snoozeUntil<=today()?0:1;
    if(rx!==ry)return rx-ry;
    const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
    if(dx!==dy)return dx-dy;return (x.created||0)-(y.created||0)});
}
function zBacklogTags(i){
  const ready=i.snoozeUntil&&i.snoozeUntil<=today(),future=i.snoozeUntil&&i.snoozeUntil>today();
  return `${i.due?`<span class="zd ${dueLabel(i.due).c==='late'?'late':''}">${dueLabel(i.due).t}</span>`:''}
    ${ready?`<span class="zd ready">😴 ready to look at</span>`:''}
    ${future?`<span class="zd dim">😴 until ${dueLabel(i.snoozeUntil).t}</span>`:''}
    ${!i.snoozeUntil?`<span class="zd dim">${age(i)}d</span>`:''}`;
}
function carryOver(m){
  return onBoard(m).filter(i=>!isParked(i)&&age(i)>=1).sort((x,y)=>(y.created||0)-(x.created||0));
}
function buildZenShell(){
  zlayer.innerHTML=`<div id="zen">
    <div class="zbar">
      <div class="zdots" id="zdots"></div>
      <div class="zclock" id="zclock">00:00</div>
      <button class="zexit" id="zexit">${TOUCH?'Close':'Esc'}</button>
    </div>
    <div class="zbody">
      <div id="zcontent">
        <div class="zstep" id="zstepline"></div>
        <div class="zname" id="zname"></div>
        <div class="znote" id="znote"></div>
        <div id="zmid"></div>
      </div>
      <div class="zacts" id="zacts"></div>
      <div class="zhint" id="zhint"></div>
    </div></div>`;
  document.getElementById('zexit').onclick=exitZen;
}
function startZen(){
  ZEN=true;ZT0=Date.now();document.body.style.overflow='hidden';
  /* freeze the step list for this whole ritual run — zSteps(m) changes length the
     instant the wk step completes (S.week[m] flips), which otherwise shifts every
     later index by one and silently skips the step right after it (confirmed: it
     was eating "Pick this week" on personal's weekly-gated wk step every time). */
  ZSTEPS=zSteps(S.ui.mode);
  const done=S.ritual[S.ui.mode]||[];
  const first=ZSTEPS.findIndex(x=>!done.includes(x.id));ZI=first<0?0:first;
  buildZenShell();
  ZTICK=setInterval(()=>{const el=document.getElementById('zclock');
    if(el){const s=Math.floor((Date.now()-ZT0)/1000);
      el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}},1000);
  paintZen(true);
}
function endZen(){ZEN=false;clearInterval(ZTICK);zlayer.innerHTML='';document.body.style.overflow='';render()}
/* "No — do it now" on the work ritual's personal check: tick that step, run the personal
   ritual, then come back to the work ritual where it left off */
function detourToPersonal(){
  if(!S.ritual.work.includes('wpr'))S.ritual.work=[...S.ritual.work,'wpr'];
  S.ui.resumeWork=true;endZen();S.ui.mode='personal';S.ui.personalView='town';save();render();startRound();
}
function resumeWorkIfDetoured(){
  if(!S.ui.resumeWork)return false;
  S.ui.resumeWork=false;S.ui.mode='work';save();render();return true;
}
function exitZen(){endZen();resumeWorkIfDetoured()}
function zenNext(){
  const m=S.ui.mode,st=ZSTEPS[ZI];
  if(st&&st.id==='wk'){S.week.iso=isoWeek();S.week[m]=true}
  if(st&&!(S.ritual[m]||[]).includes(st.id))S.ritual[m]=[...(S.ritual[m]||[]),st.id];
  save();
  if(m==='personal'&&st&&st.id==='p5'){S.pcheck={doneWeek:isoWeek(),skips:[]};save()}
  if(ZI>=ZSTEPS.length-1){endZen();closeTheDay();if(resumeWorkIfDetoured())startZen();return}
  ZI++;paintZen(true);
}
function zenBack(){if(ZI>0){ZI--;paintZen(true)}}
function zenAssign(slot,id){if(assign(S.ui.mode,slot,id,true))paintZen(false)}
function zenMarkDone(id){
  const it=byId(id);if(!it)return;
  const wasSlot=slotOf(it.mode,id);
  if(wasSlot==='deep'&&it.mode==='work')markDeepHit(it.mode);
  clearFromPlan(it.mode,id);it.done=true;it.doneAt=Date.now();save();
  toastUndo('done',()=>{it.done=false;delete it.doneAt;if(wasSlot==='deep'&&it.mode==='work')unmarkDeepHit(it.mode);if(wasSlot)assign(it.mode,wasSlot,id,true);save();if(ZEN)paintZen(false)});
  paintZen(false);
}
function zenSendBacklog(id){
  const it=byId(id);if(!it)return;
  setBucket(it,'backlog');clearFromPlan(it.mode,it.id);save();
  toastUndo('sent to backlog',()=>{setBucket(it,'board');save();if(ZEN)paintZen(false)});
  paintZen(false);
}
function zenDeleteItem(id){
  const it=byId(id);if(!it)return;
  sheetConfirm('Delete this?',it.text,'Delete',()=>{
    S.items=S.items.filter(x=>x.id!==id);clearFromPlan(it.mode,id);save();
    if(ZEN)paintZen(false);
  });
}

/* one pill per slot: filled dots = picked, empty = still open, red = over the limit */
function zSlotMeter(m){
  const p=plan(m),caps=m==='personal'?personalCaps():dayCaps(m),none=m==='personal'?'none this week':'none today';
  const used={deep:m==='personal'?p.deep.length:(p.deep?1:0),batch:p.batch.length,buffer:p.buffer.length,next:p.next.length};
  const name={deep:'Deep',batch:'Batch',buffer:'AI',next:'Spare'};
  return `<div class="zmeter">${['deep','batch','buffer','next'].map(k=>{
    const cap=caps[k],u=used[k],left=cap-u;
    const dots=Array.from({length:Math.max(cap,u)},(_,x)=>`<i class="${x<u?'on':''}${x>=cap?' over':''}"></i>`).join('');
    return `<div class="zm ${cap===0?'none':left<=0?'full':''}"><span class="zm-l">${name[k]}</span>
      ${dots?`<span class="zm-d">${dots}</span>`:''}
      <span class="zm-n">${cap===0?none:left>0?left+' left':left===0?'full':-left+' over'}</span></div>`}).join('')}</div>`;
}
function zPlanStrip(m,extra){
  const p=plan(m);
  const cell=(lbl,id)=>{const it=id&&byId(id);return it
    ?`<div class="zp" style="${styleFor(it)}"><b>${lbl}</b><span>${esc(it.text)}</span>
       <button class="zpdone" data-zdone="${it.id}" title="Already done">✓</button>
       <button class="zx" data-zdrop="${it.id}" title="Take it off">×</button></div>`:'';};
  const deepCells=m==='personal'?p.deep.map(id=>cell('Deep',id)):[cell('Deep',p.deep)];
  const cells=[...deepCells,...p.batch.map(id=>cell('Batch',id)),...p.buffer.map(id=>cell('Delegate to AI',id)),...p.next.map(id=>cell('Spare',id))].join('')+(extra||'');
  return cells?`<div class="zplan">${cells}</div>`:'';
}

/* Repaints the current step. isStepChange=true rebuilds progress dots and plays the
   step-transition fade; false just refreshes the middle content in place (assign /
   remove / done / backlog / hours pick) — this is what stops those interactions from
   blinking, since #zen itself is never destroyed and rebuilt anymore. */
function paintZen(isStepChange){
  const m=S.ui.mode,steps=ZSTEPS,st=steps[ZI],kind=ZKIND[st.id]||'plain';
  const nRaw=raw(m).length;
  let mid='',cta='Done',dispName=st.name,dispNote=ZNOTE[st.id]||'';

  if(kind==='dump'){
    if(isStepChange)ZJUST=[];
    const carry=carryOver(m);
    const accent=m==='work'?C.blue:C.green;
    mid=`<div class="zdump"><textarea id="zcap" rows="1" placeholder="One line each. Press ⏎ after every one."></textarea></div>
      ${m==='personal'?`<div class="zkept">📋 Anything sitting in <a href="https://ticktick.com/webapp/#q/all/tasks" target="_blank" rel="noopener" class="zlink">TickTick</a>? Pull it in before moving on.</div>`:''}
      <div class="zkept" id="zkept">${nRaw?nRaw+' new · waiting to be sorted':'Nothing new yet.'}</div>
      <div class="zcarry just" id="zjustwrap" style="${ZJUST.length?'':'display:none'}">
        <div class="zcarry-h">Just added — <span id="zjustcount">${ZJUST.length}</span></div>
        <div class="zcarry-l" id="zjust">${ZJUST.map(t=>`<span class="zci" style="--cc:${accent}">${esc(t)}</span>`).join('')}</div>
      </div>
      ${carry.length?`<div class="zcarry">
        <div class="zcarry-h">Still open from before — ${carry.length}</div>
        <div class="zcarry-l">${carry.slice(0,12).map(i=>`<span class="zci" style="--cc:${cardColor(i)}">${esc(i.text)}<em>${age(i)}d</em><button class="zcidone" data-zdone="${i.id}" title="Already done">✓</button></span>`).join('')}</div>
        ${carry.length>12?`<div class="zcarry-m">and ${carry.length-12} more</div>`:''}
      </div>`:''}`;
    cta='Done dumping';
  }
  else if(kind==='spark'){
    mid=`<div class="hrow"><button class="hbtn" id="zspark">Open Spark ↗</button></div>
      <div class="zkept">Opens in a new tab. Come back here when you're done.</div>`;
    cta='Done writing';
  }
  else if(kind==='week'){
    const cap=capOf(m),now=load_(m);
    const capOpts=m==='work'?[8,10,12,15,20]:[4,6,8,10,12];
    const pool=filed(m).filter(i=>!isParked(i))
      .sort((x,y)=>{
        const gx=x.bucket==='backlog'?(x.snoozeUntil&&x.snoozeUntil>today()?2:1):0;
        const gy=y.bucket==='backlog'?(y.snoozeUntil&&y.snoozeUntil>today()?2:1):0;
        if(gx!==gy)return gx-gy;
        const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;return (x.created||0)-(y.created||0)});
    mid=`${m==='personal'?`<div class="seg-label" style="margin:0 0 10px">How many can you actually get through this week?</div>
      <div class="hrow">${capOpts.map(v=>`<button class="hbtn ${v===cap?'on':''}" data-wkcap="${v}">${v}</button>`).join('')}</div>`:''}
      <div class="zkept ${now>cap?'warn':''}">${now} of ${cap} chosen for this week${now>cap?` · over by ${now-cap} — snooze ${now-cap===1?'one':now-cap}`:now===cap?' · full — snooze one to swap in another':` · ${cap-now} left`}</div>
      ${pool.length?`<div class="zpick">${pool.map(i=>{
        const on=i.bucket!=='backlog';
        const ready=i.snoozeUntil&&i.snoozeUntil<=today();
        const future=i.snoozeUntil&&i.snoozeUntil>today();
        return `<div class="zrow ${on?'':'off'}" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>
          ${i.due?`<span class="zd ${dueLabel(i.due).c==='late'?'late':''}">${dueLabel(i.due).t}</span>`:''}
          ${ready?`<span class="zd ready">😴 ready to look at</span>`:''}
          ${future?`<span class="zd dim">😴 until ${dueLabel(i.snoozeUntil).t}</span>`:''}
          ${!i.snoozeUntil?`<span class="zd dim">${age(i)}d</span>`:''}
          <span class="zb">
            <button class="zsel ${on?'sel':''}" data-zw="board" data-zid="${i.id}" ${!on&&now>=cap?'disabled title="At your cap — snooze one first"':''}>This week</button>
            <button class="zsel ${!on?'sel':''}" data-zsnooze="${i.id}">${i.snoozeUntil?'Snoozed':'Snooze'}</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
            <button class="zsel icon danger" data-zdel="${i.id}" title="Delete">×</button>
          </span></div>`}).join('')}</div>`
        :`<div class="zkept">Nothing sorted yet — the dump comes next.</div>`}`;
    cta='This is my week';
  }
  else if(kind==='sort'){
    mid=`<div class="zbig ${nRaw?'':'muted'}">${nRaw?nRaw:'0'}</div>
      <div class="zkept">${nRaw?'item'+(nRaw===1?'':'s')+' waiting. Two keystrokes each — this takes about '+Math.max(1,Math.round(nRaw*8/60))+' min.':'Nothing left to sort.'}</div>`;
    cta=nRaw?'Sort them now':'Nothing to sort';
  }
  else if(kind==='hours'){
    const h=S.hours[m],b=budget(h);
    const opts=m==='work'?[1,2,3,4,5,6]:[0.5,1,1.5,2,3,4];
    mid=`<div class="hrow">${opts.map(v=>`<button class="hbtn ${h===v?'on':''}" data-h="${v}">${v}h</button>`).join('')}</div>
      ${b?`<div class="hout"><b>${b.real}h</b> of that survives the day — meetings run over, things arrive.
        <span>That buys <b>${b.deep?'1 deep block':'no deep block'}</b>${b.batch?` and <b>${b.batch} batch</b>`:''}.</span></div>`
      :`<div class="zkept">Pick a number. Be pessimistic.</div>`}`;
    cta=h?'That is my day':'Skip for now';
    if(h&&b&&b.deep===0)mid+=`<div class="zkept warn" style="margin-top:20px">No deep block today — ${b.real}h of real time cannot hold 90 uninterrupted minutes.</div>`;
  }
  else if(kind==='weekhours'){
    const wh=S.workWeekHours.hours,cap=capOf(m),now=load_(m);
    mid=`<div class="hrow">${[10,15,20,25,30,40].map(v=>`<button class="hbtn ${wh===v?'on':''}" data-wh="${v}">${v}h</button>`).join('')}</div>
      ${wh?`<div class="hout"><b>${Math.round(wh*.6*10)/10}h</b> of that survives the week.
        <span>That's room for about <b>${weekCapFor(wh)} tasks</b> this week.</span></div>`
      :`<div class="zkept">Pick a number. Be pessimistic.</div>`}
      <div class="zkept ${now>cap?'warn':''}" style="margin-top:20px">This week's limit: <b>${cap}</b>
        <button class="zsel icon" data-wkadj="-1" title="One fewer">−</button>
        <button class="zsel icon" data-wkadj="1" title="One more">+</button>
        · ${now} chosen${now>cap?' · over — trim it when you pick':''}</div>`;
    cta=wh?'That is my week':'Skip for now';
  }
  else if(kind==='pick'){
    const p=plan(m),b=budget(S.hours[m]);
    const cands=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id))
      .sort((x,y)=>{const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;if(!!y.star!==!!x.star)return y.star?1:-1;return (x.ord||0)-(y.ord||0)});
    const caps=dayCaps(m);
    const full={deep:caps.deep===0||!!p.deep,batch:caps.batch===0||p.batch.length>=caps.batch,next:p.next.length>=caps.next,buffer:p.buffer.length>=caps.buffer};
    const slotBtns=(i,attr)=>`<button class="zsel" ${attr}="deep" data-zid="${i.id}" ${full.deep?'disabled':''}>Deep</button>
            <button class="zsel" ${attr}="batch" data-zid="${i.id}" ${full.batch?'disabled':''}>Batch</button>
            <button class="zsel" ${attr}="buffer" data-zid="${i.id}" ${full.buffer?'disabled':''}>AI</button>
            <button class="zsel" ${attr}="next" data-zid="${i.id}" ${full.next?'disabled':''}>Spare</button>`;
    const back=zBacklog(m);
    dispNote=`Fill the slots — the dots show what's still open.${back.length?' Light day? The backlog is at the bottom.':''}`;
    mid=`${zSlotMeter(m)}
      ${b?`<div class="zkept">${b.real}h of real time today${b.deep===0?' · too short for a deep block (needs 90 min)':''}</div>`
        :`<div class="zkept">No time set — <button class="zlink" id="zsethours">say how much is free</button> and this will size itself.</div>`}
      ${zPlanStrip(m)}
      ${cands.length?`<div class="zpick">${cands.map(i=>`<div class="zrow" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>
          ${i.due?`<span class="zd ${dueLabel(i.due).c==='late'?'late':''}">${dueLabel(i.due).t}</span>`:''}
          <span class="zb">
            ${slotBtns(i,'data-zs')}
            <button class="zsel icon" data-zsnooze="${i.id}" title="Snooze — push to a later date">⌛</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
          </span></div>`).join('')}</div>`
        :`<div class="zkept">Nothing on the board to pick from.</div>`}
      ${back.length?`<div class="zcarry-h" style="margin-top:30px">From the backlog — straight onto today</div>
        <div class="zpick">${back.map(i=>`<div class="zrow off" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>${zBacklogTags(i)}
          <span class="zb">${slotBtns(i,'data-zbs')}</span></div>`).join('')}</div>`:''}`;
    cta=(p.deep||p.batch.length)?'That is today':'Skip for now';
  }
  else if(kind==='weekpick'){
    const wcap=capOf(m),wnow=load_(m),back=zBacklog(m);
    const week=onBoard(m).filter(i=>!isParked(i)).sort((x,y)=>{
        const px=inPlan(m,x.id)?0:1,py=inPlan(m,y.id)?0:1;if(px!==py)return px-py;
        const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;return (x.ord||0)-(y.ord||0)});
    mid=`<div class="zmeter"><div class="zm ${wnow>=wcap?'full':''}"><span class="zm-l">This week</span>
        <span class="zm-n">${wnow} of ${wcap} · ${wnow>wcap?`${wnow-wcap} over — send something to Later`:wnow===wcap?'full':`${wcap-wnow} left`}</span></div></div>
      ${week.length?`<div class="zpick">${week.map(i=>`<div class="zrow" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>
          ${inPlan(m,i.id)?`<span class="ztag today">today</span>`:`<span class="ztag week">this week</span>`}
          ${i.due?`<span class="zd ${dueLabel(i.due).c==='late'?'late':''}">${dueLabel(i.due).t}</span>`:''}
          <span class="zb">
            <button class="zsel" data-zback="${i.id}">Later</button>
            <button class="zsel icon" data-zsnooze="${i.id}" title="Snooze — back on a date you choose">⌛</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
            <button class="zsel icon danger" data-zdel="${i.id}" title="Delete">×</button>
          </span></div>`).join('')}</div>`
        :`<div class="zkept">Nothing on this week's list yet.</div>`}
      ${back.length?`<div class="zcarry-h" style="margin-top:30px">In the backlog — bring anything back?</div>
        <div class="zpick">${back.map(i=>`<div class="zrow off" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>${zBacklogTags(i)}
          <span class="zb">
            <button class="zsel" data-zw="board" data-zid="${i.id}">This week</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
            <button class="zsel icon danger" data-zdel="${i.id}" title="Delete">×</button>
          </span></div>`).join('')}</div>`:''}`;
    cta='That is my week';
  }
  else if(kind==='pickweek'){
    const p=personalPlan(),caps=personalCaps();
    const cands=onBoard('personal').filter(i=>!isParked(i)&&!inPlan('personal',i.id))
      .sort((x,y)=>{if(!!y.quick!==!!x.quick)return y.quick?1:-1;
        const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;return (x.ord||0)-(y.ord||0)}).slice(0,16);
    const full={deep:p.deep.length>=caps.deep,batch:p.batch.length>=caps.batch,buffer:p.buffer.length>=caps.buffer,next:p.next.length>=caps.next};
    dispName=`${st.name} — ${caps.deep} deep max, ${caps.batch} batch, ${caps.buffer} to AI, ${caps.next} spare`;
    dispNote=`Plan the whole week here, not today. Most weeks need zero or one deep thing — batch is for the quick stuff: scheduling, checking, registering, printing.`;
    const picked=p.deep.length+p.batch.length+p.buffer.length+p.next.length;
    const chosen=[...p.deep,...p.batch,...p.buffer,...p.next].map(byId).filter(Boolean);
    mid=`${zPlanStrip('personal')}
      ${zSlotMeter('personal')}
      <div class="zkept"><button class="zlink" id="zpcaps">change weekly caps</button></div>
      ${chosen.length?`<div class="zcarry-h" style="margin-top:10px">Which one would make you happiest to finish this week?</div>
        <div class="zpick">${chosen.map(i=>{const on=S.personal.happyPick===i.id;
          return `<div class="zrow" style="--cc:${cardColor(i)}">
            <span class="zt">${esc(i.text)}</span>
            <span class="zb"><button class="zsel ${on?'sel':''}" data-happy="${i.id}">💛 ${on?'this one':'pick this'}</button></span>
          </div>`}).join('')}</div>`:''}
      ${cands.length?`<div class="zcarry-h" style="margin-top:22px">Add to the week</div>
        <div class="zpick">${cands.map(i=>`<div class="zrow" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>
          ${i.quick?`<span class="zd">⚡ quick</span>`:''}
          ${i.due?`<span class="zd ${dueLabel(i.due).c==='late'?'late':''}">${dueLabel(i.due).t}</span>`:''}
          <span class="zb">
            <button class="zsel" data-zs="deep" data-zid="${i.id}" ${full.deep?'disabled':''}>Deep</button>
            <button class="zsel" data-zs="batch" data-zid="${i.id}" ${full.batch?'disabled':''}>Batch</button>
            <button class="zsel" data-zs="buffer" data-zid="${i.id}" ${full.buffer?'disabled':''}>AI</button>
            <button class="zsel" data-zs="next" data-zid="${i.id}" ${full.next?'disabled':''}>Spare</button>
            <button class="zsel icon" data-zsnooze="${i.id}" title="Snooze — push to a later date">⌛</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
          </span></div>`).join('')}</div>`
        :`<div class="zkept">Nothing on the board to pick from.</div>`}`;
    cta=picked?'That is my week':'Skip for now';
  }
  else if(kind==='pnudge'){
    /* Deep is excluded on purpose — it needs a real block, not a squeeze at the end of
       a work day. This step is for the thing genuinely small enough to still fit today. */
    const sz=i=>i.size||45;
    const list=S.town.items.filter(i=>i.state==='week'&&i.size!==120)
      .sort((a,b)=>tStakeW(b)-tStakeW(a)||sz(a)-sz(b)||tOrder(a,b)).slice(0,6);
    const current=personalPick();
    const deepN=S.town.items.filter(i=>i.state==='week'&&i.size===120).length;
    mid=`${current?`<div class="zkept">Today's personal pick: <b>${esc(current.title)}</b></div>`:''}
      ${deepN?`<div class="zkept">Not offering this week's longer deep task${deepN===1?'':'s'} here — that needs its own block, not the end of a work day.</div>`:''}
      ${list.length?`<div class="zpick">${list.map(i=>{const s=TOWN_SIZES.find(x=>x.v===i.size);
        return `<div class="zrow" style="--cc:${tColor(i)}">
          <span class="zt">${esc(i.title)}</span>
          ${s?`<span class="zd">${s.name}</span>`:''}
          <span class="zb"><button class="zsel ${current&&current.id===i.id?'sel':''}" data-ppick="${i.id}">Pick this</button></span>
        </div>`}).join('')}</div>`
        :`<div class="zkept">Nothing on Town's this-week list yet — the weekly round fills it.</div>`}`;
    cta=current?'Keep this and close':'Skip for today';
  }
  else if(kind==='paper'){
    let ppCell='';
    if(m==='work'){
      const pp=personalPick();
      if(pp)ppCell=`<div class="zp" style="--cc:${tColor(pp)}"><b>Personal</b><span>${esc(pp.title)}</span></div>`;
    }
    mid=zPlanStrip(m,ppCell)||`<div class="zkept">Nothing picked yet.</div>`;
    cta='Copy to paper';
  }
  else if(kind==='anchors'){
    const anchors=S.personal.anchors||[];
    mid=`<div class="dsec">
      ${anchors.map(a=>`<div class="stepline">
        <input class="sinput" data-aedit="${a.id}" value="${esc(a.text)}" />
        <button class="act del" data-adel="${a.id}">×</button></div>`).join('')}
      ${!anchors.length?`<input class="snew" id="anew" placeholder="Play with Léo on Saturday — press ⏎" />`:''}
    </div>`;
    cta=anchors.length?'That is the week':'Skip for now';
  }
  else if(kind==='pcheck'){
    const done=personalDoneThisWeek(),n=S.pcheck.skips.length;
    mid=done?`<div class="hout"><b>✓ Done this week.</b> Nothing to do here.</div>`
      :`<div class="hrow"><button class="hbtn on" id="pcno">No — do it now</button><button class="hbtn" id="pcyes">Yes, done</button></div>
        ${n?`<div class="zkept warn">Skipped ${n} day${n===1?'':'s'} since your last personal ritual.</div>`:''}`;
    cta=done?'Next':'Skip';
  }
  else if(kind==='adcheck'){
    const ans=S.adCheck.date===today()?S.adCheck.answer:null;
    mid=`<div class="hrow"><button class="hbtn ${ans===true?'on':''}" id="adyes">Yes — save it in Reel ↗</button></div>`;
    cta='Skip';
  }
  else{ mid=''; cta='Done'; }

  document.getElementById('zdots').innerHTML=steps.map((x,k)=>`<i class="${k<ZI?'on':k===ZI?'now':''}"></i>`).join('');
  document.getElementById('zstepline').textContent=`${m==='work'?'Work':'Personal'} ritual · step ${ZI+1} of ${steps.length}`;
  document.getElementById('zname').textContent=dispName;
  document.getElementById('znote').textContent=dispNote;
  const zmidEl=document.getElementById('zmid');
  zmidEl.innerHTML=mid;
  zmidEl.classList.remove('zfade');void zmidEl.offsetWidth;zmidEl.classList.add('zfade');
  document.getElementById('zacts').innerHTML=`
    ${ZI>0?`<button class="zbtn back" id="zback" title="Previous step">←</button>`:''}
    <button class="zbtn" id="zgo">${cta}</button>`;
  document.getElementById('zhint').textContent=kind==='dump'?'⏎ keeps a line · then press Done dumping'
    :kind==='pick'||kind==='pickweek'?'tap Deep · Batch · Spare — or ⌛ backlog / ✓ already done'
    :kind==='weekpick'?'Later sends it to the backlog · ⌛ snoozes it to a date'
    :kind==='pnudge'?'pick one thing, or skip — it is just for today'
    :kind==='spark'?'write in Spark · then press Done writing'
    :'⏎ or space for the next step';

  const zb=document.getElementById('zback');if(zb)zb.onclick=zenBack;
  zmidEl.querySelectorAll('[data-aedit]').forEach(el=>{
    el.oninput=()=>{const a=(S.personal.anchors||[]).find(x=>x.id===el.dataset.aedit);
      if(a){a.text=el.value;save()}};
  });
  zmidEl.querySelectorAll('[data-adel]').forEach(b=>b.onclick=()=>{
    S.personal.anchors=(S.personal.anchors||[]).filter(x=>x.id!==b.dataset.adel);
    save();paintZen(false)});
  const anew=zmidEl.querySelector('#anew');
  if(anew)anew.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();
    const v=anew.value.trim();if(!v)return;
    S.personal.anchors=S.personal.anchors||[];
    if(S.personal.anchors.length>=1)return;
    S.personal.anchors.push({id:nid(),text:v});save();paintZen(false)}};
  const ady=zmidEl.querySelector('#adyes');
  if(ady)ady.onclick=()=>{S.adCheck={date:today(),answer:true};save();window.open(REEL_URL,'_blank');zenNext()};
  const pcy=zmidEl.querySelector('#pcyes');
  if(pcy)pcy.onclick=()=>{S.pcheck={doneWeek:isoWeek(),skips:[]};save();zenNext()};
  const pcn=zmidEl.querySelector('#pcno');
  if(pcn)pcn.onclick=detourToPersonal;
  /* today's hours, the personal week cap, and Spark — these were lost in an earlier rewrite */
  zmidEl.querySelectorAll('[data-h]').forEach(b2=>b2.onclick=()=>{S.hours[m]=+b2.dataset.h;S.hours.date=today();save();paintZen(false)});
  zmidEl.querySelectorAll('[data-wkcap]').forEach(b2=>b2.onclick=()=>{S.cap[m]=+b2.dataset.wkcap;save();paintZen(false)});
  const zsp=zmidEl.querySelector('#zspark');
  if(zsp)zsp.onclick=()=>window.open(SPARK_URL,'_blank');
  zmidEl.querySelectorAll('[data-wh]').forEach(b2=>b2.onclick=()=>{const v=+b2.dataset.wh;
    S.workWeekHours={weekIso:isoWeek(),hours:v};S.cap[m]=weekCapFor(v);save();paintZen(false)});
  zmidEl.querySelectorAll('[data-wkadj]').forEach(b2=>b2.onclick=()=>{
    S.cap[m]=Math.max(1,capOf(m)+ +b2.dataset.wkadj);save();paintZen(false)});
  zmidEl.querySelectorAll('[data-zbs]').forEach(b2=>b2.onclick=()=>{
    const it=byId(b2.dataset.zid);if(!it||b2.disabled)return;
    setBucket(it,'board');it.snoozeUntil=null;assign(m,b2.dataset.zbs,it.id,true);save();paintZen(false)});
  zmidEl.querySelectorAll('[data-zs]').forEach(b2=>b2.onclick=()=>{
    if(b2.disabled)return;zenAssign(b2.dataset.zs,b2.dataset.zid)});
  const zsh=zmidEl.querySelector('#zsethours');
  if(zsh)zsh.onclick=()=>{ZI=ZSTEPS.findIndex(x=>ZKIND[x.id]==='hours');paintZen(true)};
  const zpc=zmidEl.querySelector('#zpcaps');
  if(zpc)zpc.onclick=()=>personalCapSheet();
  zmidEl.querySelectorAll('[data-ppick]').forEach(b2=>b2.onclick=()=>{
    S.personal.todayPick={date:today(),id:b2.dataset.ppick};
    const ti=tById(b2.dataset.ppick);if(ti)ti.today=today();   /* it goes on Town's Today too */
    save();paintZen(false)});
  zmidEl.querySelectorAll('[data-zdrop]').forEach(b2=>b2.onclick=()=>{clearFromPlan(m,b2.dataset.zdrop);save();paintZen(false)});
  zmidEl.querySelectorAll('[data-zback]').forEach(b2=>b2.onclick=()=>zenSendBacklog(b2.dataset.zback));
  zmidEl.querySelectorAll('[data-zdone]').forEach(b2=>b2.onclick=()=>zenMarkDone(b2.dataset.zdone));
  zmidEl.querySelectorAll('[data-zdel]').forEach(b2=>b2.onclick=()=>zenDeleteItem(b2.dataset.zdel));
  zmidEl.querySelectorAll('[data-zsnooze]').forEach(b2=>b2.onclick=()=>snoozeSheet(b2.dataset.zsnooze,()=>paintZen(false)));
  zmidEl.querySelectorAll('[data-happy]').forEach(b2=>b2.onclick=()=>{
    S.personal.happyPick=S.personal.happyPick===b2.dataset.happy?null:b2.dataset.happy;
    save();paintZen(false)});
  zmidEl.querySelectorAll('[data-zw]').forEach(b2=>b2.onclick=()=>{
    const it=byId(b2.dataset.zid);if(!it)return;
    setBucket(it,b2.dataset.zw);
    it.snoozeUntil=null;   /* pulling it into this week clears any stale snooze */
    if(it.bucket==='backlog')clearFromPlan(it.mode,it.id);
    save();
    /* Same cap enforcement as daily sort — committing to more than the cap here is exactly
       the "delusional about the week" case. Give the same bump-or-raise decision instead
       of silently letting the number tick past what closeTheDay already flags red. */
    if(it.bucket!=='backlog'&&!isParked(it)&&overCap(it.mode)){
      overflowSheet(it,()=>paintZen(false));
      return;
    }
    paintZen(false)});

  document.getElementById('zgo').onclick=()=>{
    if(kind==='sort'&&nRaw){openTriage();return}   /* stays inside the ritual */
    if(kind==='adcheck')S.adCheck={date:today(),answer:false};
    if(kind==='pcheck'&&!personalDoneThisWeek()&&!S.pcheck.skips.includes(today()))S.pcheck.skips.push(today());
    zenNext();
  };
  const zc=zmidEl.querySelector('#zcap');
  if(zc){autosize(zc);zc.focus();zc.addEventListener('input',()=>autosize(zc));
    zc.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();
      const v=zc.value.trim();if(!v)return;
      const made=add(v,m);
      zc.value='';autosize(zc);
      const k=document.getElementById('zkept');if(k)k.textContent=raw(m).length+' new · waiting to be sorted';
      const wrap=document.getElementById('zjustwrap'),list=document.getElementById('zjust'),cnt=document.getElementById('zjustcount');
      made.forEach(x=>{
        ZJUST.push(x.text);
        if(list){const chip=document.createElement('span');chip.className='zci';
          chip.style.setProperty('--cc',m==='work'?C.blue:C.green);chip.textContent=x.text;list.appendChild(chip)}
      });
      if(wrap)wrap.style.display='';
      if(cnt)cnt.textContent=ZJUST.length;
    }})}

  if(isStepChange){
    const zenEl=document.getElementById('zen');if(zenEl)zenEl.scrollTop=0;
    const zcontent=document.getElementById('zcontent');
    if(zcontent){zcontent.classList.remove('stepin');void zcontent.offsetWidth;zcontent.classList.add('stepin')}
  }
}

/* ===== sorting ===== */
let TQ=[],TI=0,TOPEN=false,TSTEP=1,TCAT=null,TCARD='',TQUICKSOFT=false;
/* TQUICKSOFT is per-sort-session only, never persisted — hard mode (interrupt for every
   ⚡ task) is the default every time the sorter opens; picking "batch these" below just
   quiets it for the rest of this pass. */
function openTriage(){TQ=raw(S.ui.mode).map(i=>i.id);TI=0;TSTEP=1;TCAT=null;TCARD='';TQUICKSOFT=false;if(!TQ.length)return;
  TOPEN=true;document.body.style.overflow='hidden';
  layer.innerHTML=`<div class="veil in"><div class="sheet triage"><div id="tin"></div></div></div>`;drawTriage()}
function closeTriage(){TOPEN=false;TSTEP=1;TCAT=null;TCARD='';layer.innerHTML='';
  if(ZEN){document.body.style.overflow='hidden';paintZen(false);return}
  document.body.style.overflow='';render()}
function step1Html(i){
  const opts=GROUPS[i.mode];
  return `${!hasVerb(i.text)?`<div class="nudge">✎ <span><b>No verb.</b> As written this is a topic, and topics can't be finished — they just sit there. What's the first physical action?</span></div>`:''}
    <div class="seg-label">Where does it live?</div>
    <div class="tgrid">${opts.map((o,n)=>`<button class="pick" data-sort="${o.id}" style="color:${o.color}"><b></b><span>${o.name}</span><span class="k">${n+1}</span></button>`).join('')}</div>
    <div class="tfoot"><span class="keys">1–6 to choose · → skip · esc stop</span>
      <button class="btn" data-skip="1">Skip</button></div>`;
}
function step2Html(i){
  const g=GROUPS[i.mode].find(o=>o.id===TCAT)||{name:'—',color:C.grey};
  const heavy=i.mode==='work'?{b:'Deep work',s:'Needs a real block. 90+ scorecard.'}
                             :{b:'Deep work',s:'Needs a real block, not a gap.'};
  return `<div class="chosen"><span class="dot" style="color:${g.color}"><b></b>${g.name}</span>
      <button data-back="1">← change</button></div>
    <div class="seg-label">This week, or later?</div>
    <div class="seg">
      <button class="opt" data-put="star" style="color:${C.purple}">
        <span class="ic">★</span><span class="lb"><b>${heavy.b}</b><span>${heavy.s}</span></span><span class="k">1</span></button>
      <button class="opt" data-put="quick" style="color:${C.yellow}">
        <span class="ic">⚡</span><span class="lb"><b>Quick — under 60s</b><span>Batch it</span></span><span class="k">2</span></button>
      <button class="opt" data-put="plain" style="color:${C.grey}">
        <span class="ic">•</span><span class="lb"><b>Normal</b><span>On the board this week</span></span><span class="k">3</span></button>
      <button class="opt" data-put="later" style="color:var(--ink-3)">
        <span class="ic">⌛</span><span class="lb"><b>Later</b><span>Backlog — recheck next week</span></span><span class="k">4</span></button>
    </div>
    <div class="tfoot"><span class="keys">1–4 to file · ← back · esc stop</span>
      <button class="btn" data-skip="1">Skip</button></div>`;
}
function quickHtml(i){
  return `<div class="seg-label">60 seconds — right now?</div>
    <div class="seg">
      <button class="opt" data-qdone="1" style="color:${C.green}">
        <span class="ic">✓</span><span class="lb"><b>Did it just now</b><span>Marks it done — skips the board entirely</span></span></button>
      <button class="opt" data-qlater="1" style="color:${C.yellow}">
        <span class="ic">⚡</span><span class="lb"><b>Do it later</b><span>Goes to Batch as normal</span></span></button>
    </div>
    <div class="tfoot"><span class="keys">1 done now · 2 later · 3 batch these</span>
      <button class="btn" data-back="1">← back</button>
      <button class="btn" data-qsoft="1">Not now — batch these for the rest of this sort</button></div>`;
}
function drawTriage(){
  if(TI>=TQ.length){closeTriage();toast('inbox clear');return}
  const i=S.items.find(x=>x.id===TQ[TI]);if(!i){TI++;return drawTriage()}
  const tin=document.getElementById('tin');if(!tin)return;
  const html=TSTEP===1?step1Html(i):TSTEP===3?quickHtml(i):step2Html(i);
  const fresh=TCARD!==i.id||!document.getElementById('tbody');
  if(fresh){
    tin.innerHTML=`<div class="tin anim">
      <div class="tcount"><span id="tprog"></span><span>esc to stop</span></div>
      <textarea class="ttext" id="tt" rows="1">${esc(i.text)}</textarea>
      <div id="tbody">${html}</div></div>`;
    TCARD=i.id;
    const ta=document.getElementById('tt');
    autosize(ta);ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
    ta.oninput=()=>{autosize(ta);i.text=ta.value.trim()||i.text;save();
      const nu=document.querySelector('#tbody .nudge');if(nu&&hasVerb(i.text))nu.remove()};
  }else{
    const tb=document.getElementById('tbody');tb.innerHTML=html;
    tb.classList.remove('stepin');void tb.offsetWidth;tb.classList.add('stepin');
  }
  const pr=document.getElementById('tprog');
  if(pr)pr.textContent=`Sorting ${TI+1} of ${TQ.length} · step ${Math.min(TSTEP,2)} of 2`;
  const tb=document.getElementById('tbody');
  if(TSTEP===1)tb.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>pickCat(b.dataset.sort));
  else if(TSTEP===3){
    tb.querySelector('[data-qdone]').onclick=()=>quickDoneNow(i);
    tb.querySelector('[data-qlater]').onclick=()=>commitIt(i,'quick');
    tb.querySelector('[data-qsoft]').onclick=()=>{TQUICKSOFT=true;commitIt(i,'quick')};
    tb.querySelector('[data-back]').onclick=()=>{TSTEP=2;drawTriage()};
  }
  else{
    tb.querySelectorAll('[data-put]').forEach(b=>b.onclick=()=>{
      /* Hard mode (default each sort): tagging something ⚡ interrupts right here instead
         of letting it quietly join Batch — the whole point of a sub-60s task is that
         "later" is more expensive than "now". "Not now — batch these" softens it for the
         rest of this sort only; it resets to hard the next time the sorter opens. */
      if(b.dataset.put==='quick'&&!TQUICKSOFT){TSTEP=3;drawTriage();return}
      commitIt(i,b.dataset.put)});
    tb.querySelector('[data-back]').onclick=()=>{TSTEP=1;TCAT=null;drawTriage()};
  }
  const sk=tb.querySelector('[data-skip]');
  if(sk)sk.onclick=()=>{TI++;TSTEP=1;TCAT=null;drawTriage()};
}
function pickCat(v){TCAT=v;TSTEP=2;drawTriage()}
function quickDoneNow(i){
  i[GKEY[i.mode]]=TCAT;i.sorted=true;i.ord=maxOrd()+100;i.star=false;i.quick=true;
  setBucket(i,'board');i.done=true;i.doneAt=Date.now();
  save();TI++;TSTEP=1;TCAT=null;
  toastUndo('done — cleared instantly',()=>{i.done=false;delete i.doneAt;save();render()});
  drawTriage();
}
function commitIt(i,put){
  i[GKEY[i.mode]]=TCAT;i.sorted=true;i.ord=maxOrd()+100;
  i.star=put==='star';i.quick=put==='quick';setBucket(i,put==='later'?'backlog':'board');
  save();TI++;TSTEP=1;TCAT=null;
  if(put!=='later'&&overCap(i.mode)&&!isParked(i)){
    const veil=layer.querySelector('.veil');if(veil)veil.style.display='none';
    overflowSheet(i,()=>{const v=layer.querySelector('.veil');if(v)v.style.display='';drawTriage()});
    return;
  }
  drawTriage();
}
function autosize(el){el.style.height='auto';el.style.height=el.scrollHeight+'px'}

let DAY=today();
function checkDay(){
  if(today()===DAY)return;
  DAY=today();
  const caps=dayCaps('work');   /* S.hours.work still reflects the day that just ended */
  if(caps.deep===1)S.streak.work.count=S.streak.work.hitToday?S.streak.work.count+1:0;
  S.streak.work.hitToday=false;
  S.streak.date=DAY;
  S.ritual.workDate=DAY;S.ritual.work=[];
  S.plan.date=DAY;S.plan.work=emptyPlan();
  if(S.ritual.personalWeekIso!==isoWeek()){S.ritual.personalWeekIso=isoWeek();S.ritual.personal=[]}
  personalPlan();  /* rolls S.personal.plan over if the week has turned */
  if(S.workWeekHours.weekIso!==isoWeek())S.workWeekHours={weekIso:isoWeek(),hours:null};
  if(S.adCheck.date!==DAY)S.adCheck={date:DAY,answer:null};
  if(S.personal.todayPick&&S.personal.todayPick.date!==DAY)S.personal.todayPick=null;
  const moved=migrateStaleBacklog();
  save();render();toast('new day — ritual reset');
  if(moved)toast(moved+' backlog item'+(moved===1?'':'s')+' moved to Wishes');
}
setInterval(checkDay,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkDay()});

document.addEventListener('keydown',e=>{
  if(TZ&&!mlayer.innerHTML&&!dplayer.innerHTML){
    if(e.key==='Escape'){tzPause();return}
    const t=e.target;
    if(t.tagName==='TEXTAREA'||t.tagName==='INPUT')return;
    if(e.key==='Enter'||e.key===' '){e.preventDefault();const g=document.getElementById('tzgo');if(g)g.click();return}
    if(e.key==='ArrowLeft'){e.preventDefault();const b=document.getElementById('tzback');if(b)b.click();return}
    return;
  }
  if(ZEN&&!mlayer.innerHTML&&!layer.innerHTML){
    if(e.key==='Escape'){exitZen();return}
    const t=e.target;
    if(t.tagName==='TEXTAREA'||t.tagName==='INPUT')return;
    if(e.key==='Enter'||e.key===' '){e.preventDefault();document.getElementById('zgo').click();return}
    if(e.key==='ArrowLeft'){e.preventDefault();zenBack();return}
    return;
  }
  if(mlayer.innerHTML){if(e.key==='Escape')closeSheet();return}
  if(DPV){if(e.key==='Escape')closeDP();return}
  if(TOPEN){
    if(e.key==='Escape'){closeTriage();return}
    const i=S.items.find(x=>x.id===TQ[TI]);if(!i)return;
    const typing=document.activeElement&&document.activeElement.id==='tt';
    if(TSTEP===1){
      if(!typing&&/^[1-6]$/.test(e.key)&&GROUPS[i.mode][+e.key-1]){e.preventDefault();pickCat(GROUPS[i.mode][+e.key-1].id);return}
      if(e.key==='ArrowRight'){e.preventDefault();TI++;drawTriage()}
      return;
    }
    if(TSTEP===3){
      if(e.key==='ArrowLeft'){e.preventDefault();TSTEP=2;drawTriage();return}
      if(typing)return;
      if(e.key==='1'){e.preventDefault();quickDoneNow(i);return}
      if(e.key==='2'){e.preventDefault();commitIt(i,'quick');return}
      if(e.key==='3'){e.preventDefault();TQUICKSOFT=true;commitIt(i,'quick');return}
      return;
    }
    if(e.key==='ArrowLeft'){e.preventDefault();TSTEP=1;TCAT=null;drawTriage();return}
    if(typing)return;
    const map={'1':'star','2':'quick','3':'plain','4':'later'};
    if(map[e.key]){
      e.preventDefault();
      if(map[e.key]==='quick'&&!TQUICKSOFT){TSTEP=3;drawTriage();return}
      commitIt(i,map[e.key]);
    }
    return;
  }
  const t=e.target;
  if(e.key==='Escape'&&S.ui.composer){S.ui.composer=null;save();render();return}
  if(e.key==='Tab'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){
    e.preventDefault();S.ui.mode=S.ui.mode==='work'?'personal':'work';S.ui.composer=null;save();render();return}
  if(t.tagName==='TEXTAREA'||t.tagName==='INPUT'||t.isContentEditable)return;
  if(e.key==='1'){S.ui.mode='work';save();render()}
  if(e.key==='2'){S.ui.mode='personal';save();render()}
  if(e.key==='t'&&S.ui.mode==='work'&&raw('work').length)openTriage();
});

/* ===== town (personal mode) =====
   Personal life as a small town with departments. Two hand-started rituals do the work —
   the weekly round and today's move — and the tabs are the records office. Town keeps
   its own list (S.town.items), so the work board never sees these items.
   Rule: in Town you add and edit; verdicts (this week / AI / wife / waiting / not this week /
   drop) only happen in the weekly round. Done is not a verdict — finishing is allowed anywhere.
   "Today" is a flag on a this-week item (i.today = the date it was picked), not a state:
   the week is the menu, today is the plate. It lapses on its own at midnight. */
const TOWN_DEPTS=[   /* round order, riskiest first — Wishes always last */
  {id:'health',name:'Health',color:'#1E8E3E'},{id:'treasury',name:'Treasury',color:'#1A73E8'},
  {id:'house',name:'House',color:'#E37400'},{id:'family',name:'Family',color:'#D01884',hint:'Kids, dogs, the people and animals at home'},
  {id:'kitchen',name:'Kitchen',color:'#00897B'},{id:'wardrobe',name:'Wardrobe & self',color:'#A142F4'},
  {id:'future',name:'Future',color:'#3949AB'},
  {id:'buy',name:'To buy',color:'#8D6E63',hint:'Things you’d like to buy — not groceries'},
  {id:'wishes',name:'Wishes',color:'#12B5CB',hint:'Desires, not tasks yet'}];
/* departments that were folded into another one */
const TOWN_MERGED={dogs:'family',kids:'family'};
const TOWN_STATES=[{id:'inbox',name:'Inbox'},{id:'week',name:'This week'},{id:'ai',name:'AI queue'},
  {id:'wife',name:'Wife help'},{id:'waiting',name:'Waiting on someone'},{id:'later',name:'Not this week'},
  {id:'done',name:'Done'},{id:'dropped',name:'Dropped'}];
/* size 1 = a 60-second thing: the right move is to do it on the spot */
const TOWN_SIZES=[{v:1,name:'60 sec',short:'⚡ 60 sec'},{v:10,name:'10 min'},{v:30,name:'30 min'},
  {v:60,name:'60+ min'},{v:120,name:'Longer deep task',short:'Deep'}];
/* time free today → the biggest size that fits. Deep tasks only show up for a real block. */
const TOWN_TIMES=[{v:0,name:'0'},{v:15,name:'15 min',fit:10},{v:30,name:'30 min',fit:30},
  {v:60,name:'60+ min',fit:60},{v:120,name:'2h+ block',fit:120}];
/* stakes — one question: "if this slips a week, can I still fix it later?"
   yes, nothing changes → can wait · yes, but it costs more → gets worse · no → can't undo.
   The line that matters is reversible vs not. Unrated sorts between "gets worse" and "can wait". */
const TOWN_STAKES=[
  {v:3,name:'Can’t undo',color:'#D93025',hint:'Miss it and something is lost for good — a fee or fine, a health window, a deadline, a promise'},
  {v:2,name:'Gets worse',color:'#F29900',hint:'Still fixable later, but it will cost more — work, money, stress, or someone kept waiting'},
  {v:1,name:'Can wait',color:'#80868B',hint:'Nothing changes if it waits a week'}];
const TSTAKE_Q='If this slips a week, can you still fix it later?';
const tStakeW=i=>({3:3,2:2,1:1}[i.stakes]||1.5);
const TOWN_QUIET_DAYS=21;
const TOWN_IMPORT={health:'health',money:'treasury',wish:'wishes'};
const TOWN_AI_TEMPLATE=`Task: {task}
Department: {department}
Notes: {notes}

What I keep on file for this department:
{reference}

Please take care of this for me. Tell me what you did, what is still open, and anything you need from me.`;
const TROUND=[{id:'phrase',name:'What would make this week good for them?'},{id:'dump',name:'Empty your head'},
  {id:'sort',name:'Sort the dump'},{id:'rounds',name:'Rounds'},{id:'size',name:'Size this week’s picks'},
  {id:'paper',name:'Copy to paper and close'}];
const TMOVE=[{id:'spark',name:'Morning pages first'},{id:'time',name:'How much time do you have today?'},
  {id:'pick',name:'What goes on today?'},{id:'plate',name:'That’s today'}];
const TNOTE={
  phrase:'One thing. Not chores — playing with the kids, a proper dinner, calling your parents. The thing that would make this week good, not just handled.',
  dump:'Everything personal in your head, one line each. No departments yet, no sorting.',
  sort:'One tap each — which department does it belong to? Sorted ones drop to the bottom.',
  rounds:'Rate each one, then decide: yours this week, handed off, not this week — or close it.',
  size:'How long will each one really take? Anything that takes 60 seconds — do it now and tick it.',
  paper:'Copy it down. Then close this and get on with the week.',
  spark:'However it is actually going. Write in Spark, then come back here.',
  time:'Be honest. Zero is a fine answer.',
  pick:'Pick what goes on today. Everything else stays on this week’s list for another day.',
  plate:'This is today. It lives in the Today tab — tick things off there.'};

function initTown(){
  const t=S.town=Object.assign({items:[],depts:{},round:null,move:null,day:null,lastRound:null,
    aiTemplate:TOWN_AI_TEMPLATE,imported:false},S.town||{});
  if(!Array.isArray(t.items))t.items=[];
  if(!t.depts||typeof t.depts!=='object')t.depts={};
  /* Dogs + Kids became Family: move items, keep both reference cards, keep the latest visit */
  Object.keys(TOWN_MERGED).forEach(old=>{
    const to=TOWN_MERGED[old],d=t.depts[old];
    t.items.forEach(i=>{if(i.dept===old)i.dept=to;if(i.suggest===old)i.suggest=to});
    if(!d)return;
    const f=t.depts[to]=Object.assign({ref:'',lastVisit:null},t.depts[to]||{});
    if(d.ref&&d.ref.trim())f.ref=(f.ref.trim()?f.ref.trim()+'\n\n':'')+old.charAt(0).toUpperCase()+old.slice(1)+':\n'+d.ref.trim();
    f.lastVisit=Math.max(f.lastVisit||0,d.lastVisit||0)||null;
    delete t.depts[old];
  });
  if(TOWN_MERGED[S.ui.townDept])S.ui.townDept=TOWN_MERGED[S.ui.townDept];
  if(S.ui.townView==='week')S.ui.townView='today';   /* This week lives inside Today now */
  TOWN_DEPTS.forEach(d=>{t.depts[d.id]=Object.assign({ref:'',lastVisit:null},t.depts[d.id]||{})});
  t.items.forEach(i=>{
    if(!TOWN_STATES.some(s=>s.id===i.state))i.state='inbox';
    if(i.dept&&!tDept(i.dept))i.dept=null;       /* a department that was renamed away */
    if(i.prio&&!i.stakes)i.stakes=3;               /* the old ★ priority flag */
  });
  const r=t.round;
  if(r&&r.depts){
    r.depts=[...new Set(r.depts.map(x=>TOWN_MERGED[x]||x))].filter(x=>tDept(x));
    if(r.lists)Object.keys(TOWN_MERGED).forEach(old=>{if(r.lists[old]){const to=TOWN_MERGED[old];
      r.lists[to]=[...new Set([...(r.lists[to]||[]),...r.lists[old]])];delete r.lists[old]}});
    r.di=Math.min(r.di||0,Math.max(0,r.depts.length-1));
  }
  if(typeof t.aiTemplate!=='string')t.aiTemplate=TOWN_AI_TEMPLATE;
  if(t.move&&t.move.date!==today())t.move=null;  /* today's move never carries into tomorrow */
  if(t.move&&!TMOVE[t.move.step])t.move.step=2;
  if(r&&!TROUND[r.step])t.round=null;
}

const tDept=id=>TOWN_DEPTS.find(d=>d.id===id);
const tById=id=>S.town.items.find(i=>i.id===id);
const tOpen=i=>i.state!=='done'&&i.state!=='dropped';
const tColor=i=>{const d=tDept(i.dept);return d?d.color:C.grey};
const tStake=i=>TOWN_STAKES.find(s=>s.v===i.stakes)||null;
const tSize=i=>TOWN_SIZES.find(s=>s.v===i.size)||null;
/* i.home = "after work, at home": not a size — it says where it happens, so it never counts
   against today's minutes. An item is either sized or after-work, not both. */
const TOWN_HOME={name:'After work, at home',short:'🏠 After work'};
const tSizeLabel=i=>i.home?TOWN_HOME.short:tSize(i)?(tSize(i).short||tSize(i).name):'';
const tDayItems=L=>L.filter(i=>!i.home),tHomeItems=L=>L.filter(i=>i.home);
const tMoveLive=()=>S.town.move&&S.town.move.date===today()?S.town.move:null;
const tDayMins=()=>S.town.day&&S.town.day.date===today()?S.town.day.mins:null;
const tIsToday=i=>i.today===today()&&tOpen(i);
const tDoneToday=i=>i.state==='done'&&i.doneAt&&new Date(i.doneAt).toISOString().slice(0,10)===today();
const tWeekEnd=()=>{const d=new Date(isoWeek()+'T12:00:00');d.setDate(d.getDate()+6);return d.toISOString().slice(0,10)};
/* next week's days, for "not this week" */
const tNextWeek=n=>{const d=new Date(isoWeek()+'T12:00:00');d.setDate(d.getDate()+7+n);return d.toISOString().slice(0,10)};
/* a waiting item whose check-back day has come (or gone) */
const tLate=i=>i.state==='waiting'&&!!(i.wait&&i.wait.checkBack&&i.wait.checkBack<=today());
/* a "not this week" item whose date has reached this week — the round brings it back up */
const tBackNow=i=>i.state==='later'&&!!i.back&&i.back<=tWeekEnd();
const tShort=x=>new Date(typeof x==='string'?x+'T12:00:00':x).toLocaleDateString(undefined,{day:'numeric',month:'short'});
const tDay=x=>new Date(x+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
function tAgo(ts){const n=Math.round((new Date(today()+'T12:00:00')-new Date(new Date(ts).toISOString().slice(0,10)+'T12:00:00'))/864e5);
  return n<=0?'today':n===1?'yesterday':n+' days ago'}
/* what it costs if it slips first, then the nearest deadline, then oldest */
function tOrder(a,b){
  const s=tStakeW(b)-tStakeW(a);if(s)return s;
  const da=a.due||'9999',db=b.due||'9999';if(da!==db)return da<db?-1:1;
  return (a.created||0)-(b.created||0)}
const tWaitOrder=(a,b)=>((a.wait&&a.wait.checkBack)||'9999')<((b.wait&&b.wait.checkBack)||'9999')?-1:1;
function tAdd(title,dept,state){
  const i={id:nid(),title,dept:dept||null,state:state||'inbox',size:null,stakes:0,due:null,notes:'',
    created:Date.now(),movedAt:Date.now(),doneAt:null,wait:null,instr:null,suggest:null,back:null,today:null};
  S.town.items.push(i);save();return i}
function tSet(i,state){
  i.state=state;i.movedAt=Date.now();i.doneAt=state==='done'||state==='dropped'?Date.now():null;
  if(state!=='week'&&state!=='waiting')i.today=null;
  if(state!=='later')i.back=null;
  save()}
function tRefresh(){if(TZ)tzPaint(false);else render()}
function tCopy(text,el){
  const fallback=()=>{let t=el&&el.select?el:null,tmp=null;
    if(!t){tmp=t=document.createElement('textarea');tmp.value=text;tmp.style.cssText='position:fixed;opacity:0';document.body.appendChild(tmp)}
    t.focus();t.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}
    if(tmp)tmp.remove();toast(ok?'copied':'select it and copy')};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(()=>toast('copied')).catch(fallback);
  else fallback();
}
function tInstr(i){
  if(i.instr!=null)return i.instr;
  const d=tDept(i.dept),ref=d?S.town.depts[d.id].ref.trim():'',notes=(i.notes||'').trim();
  return S.town.aiTemplate.split('\n').filter(l=>notes||!l.includes('{notes}')).join('\n')
    .replace(/\{task\}/g,i.title).replace(/\{department\}/g,d?d.name:'—')
    .replace(/\{notes\}/g,notes).replace(/\{reference\}/g,ref||'(nothing on file yet)')
    .replace(/\n{3,}/g,'\n\n').trim();
}
function tPulse(id){
  const L=S.town.items.filter(i=>i.dept===id),open=L.filter(tOpen);
  if(open.some(i=>tLate(i)||(i.due&&i.due<today())))return 'red';
  if(!open.length)return 'calm';
  const last=Math.max(...L.map(i=>i.movedAt||i.created||0));
  return Date.now()-last>TOWN_QUIET_DAYS*864e5?'orange':'calm';
}
const TPULSE={calm:'moving',orange:'nothing moved in 3 weeks',red:'something overdue'};
const tSizeSum=L=>L.reduce((n,i)=>n+(i.size||0),0);
initTown();
adoptPersonal();

/* ---- town: navigation ----
   Each tab pushes one history entry above the Town hall, so the browser's own back gesture
   (two-finger swipe on a Mac trackpad or Magic Mouse, edge swipe on iPhone) lands on the
   Town hall. Moving between tabs replaces that entry instead of stacking more. */
function townNav(tv,dept){
  const from=S.ui.personalView==='town'?(S.ui.townView||'home'):null;
  S.ui.mode='personal';S.ui.personalView='town';S.ui.townView=tv;if(dept)S.ui.townDept=dept;S.ui.composer=null;save();
  try{if(tv!=='home'){if(from&&from!=='home'&&history.state&&history.state.town)history.replaceState({town:tv},'');
    else history.pushState({town:tv},'')}}catch(e){}
  render();document.documentElement.scrollTop=0;
}
function townHome(){
  if(history.state&&history.state.town){history.back();return}
  townNav('home');
}
window.addEventListener('popstate',()=>{
  if(TZ||S.ui.mode!=='personal'||S.ui.personalView!=='town'||S.ui.townView==='home')return;
  S.ui.townView='home';save();closeSheet();render();
});
/* the app opened straight onto a tab: put the Town hall underneath it */
if(S.ui.mode==='personal'&&S.ui.personalView==='town'&&S.ui.townView&&S.ui.townView!=='home'){
  try{history.pushState({town:S.ui.townView},'')}catch(e){}
}
/* swipe right anywhere on a tab (phones/tablets) — back to the Town hall */
(()=>{let sx=null,sy=0;
  document.addEventListener('touchstart',e=>{const t=e.target;sx=null;
    if(e.touches.length!==1||TZ||mlayer.innerHTML||t.closest('.cols,textarea,input,.tailist'))return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  document.addEventListener('touchend',e=>{if(sx==null)return;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;sx=null;
    if(dx>90&&Math.abs(dy)<60&&S.ui.mode==='personal'&&S.ui.personalView==='town'&&S.ui.townView!=='home')townHome()},{passive:true});
})();
const tBackLink=()=>`<div class="tback"><button class="zlink" data-tback="1">← Town hall</button></div>`;

/* ---- town: sheets ---- */
/* sheets that redraw while open render into an inner box — rebuilding the whole sheet
   replays its entrance animation, which is what made the Waiting pop-up blink */
function tSheetBox(wide){sheet('<div id="tbox"></div>',null,wide);return mlayer.querySelector('#tbox')}
function tWaitSheet(i,who,after){
  const iso=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
  const quick=[['Tomorrow',1],['In 3 days',3],['Next week',7],['In 2 weeks',14]];
  const w={who:(i.wait&&i.wait.who&&i.wait.who!=='Wife'?i.wait.who:'')||who||'',since:today(),checkBack:null};
  const box=tSheetBox();
  const draw=()=>{
    const custom=w.checkBack&&!quick.some(([,n])=>iso(n)===w.checkBack);
    box.innerHTML=`<h3>👤 Who has the ball?</h3>
      <p>${esc(i.title)}<br><span style="color:var(--ink-3)">Someone else is doing their part — you just check back.</span></p>
      <input class="field" id="twho" placeholder="Clinic, bank, concierge…" value="${esc(w.who)}" />
      <div class="seg-label" style="margin:0 0 10px">Check back</div>
      <div class="dates">${quick.map(([l,n])=>`<button class="dbtn ${w.checkBack===iso(n)?'on':''}" data-tcb="${iso(n)}">${l}</button>`).join('')}
        <button class="dbtn ${custom?'on':''}" id="tcbpick">${custom?tShort(w.checkBack):'Pick a date'}</button></div>
      <div class="sheet-acts" style="margin-top:26px"><button class="btn" id="no">Cancel</button>
        <button class="btn btn-hot" id="yes">Waiting on them</button></div>`;
    const f=box.querySelector('#twho');f.oninput=()=>{w.who=f.value};
    box.querySelectorAll('[data-tcb]').forEach(b=>b.onclick=()=>{w.checkBack=b.dataset.tcb;draw()});
    box.querySelector('#tcbpick').onclick=()=>openDate(w,draw,'checkBack');
    box.querySelector('#no').onclick=closeSheet;
    box.querySelector('#yes').onclick=()=>{w.who=w.who.trim();i.wait=w;tSet(i,'waiting');closeSheet();if(after)after()};
  };
  draw();const f=box.querySelector('#twho');if(f&&!w.who)f.focus();
}
/* not this week: pick when it should come back — next week's days, or no date at all */
function tLaterSheet(i,after){
  const opts=[['Next Monday',tNextWeek(0)],['Next Wednesday',tNextWeek(2)],['Next Friday',tNextWeek(4)],['Next weekend',tNextWeek(5)]];
  const box=tSheetBox();
  const commit=d=>{tSet(i,'later');i.back=d;save();closeSheet();if(after)after()};
  box.innerHTML=`<h3>📅 Not this week</h3>
    <p>${esc(i.title)}<br><span style="color:var(--ink-3)">Still yours — just not now. When should it come back up?</span></p>
    <div class="dates">${opts.map(([l,d])=>`<button class="dbtn" data-tbk="${d}">${l} · ${tShort(d)}</button>`).join('')}</div>
    <div class="sheet-acts" style="margin-top:26px"><button class="btn" id="tbkpick">Pick a date</button>
      <span style="flex:1"></span><button class="btn" id="tbknone">No date</button></div>`;
  box.querySelectorAll('[data-tbk]').forEach(b=>b.onclick=()=>commit(b.dataset.tbk));
  box.querySelector('#tbknone').onclick=()=>commit(null);
  box.querySelector('#tbkpick').onclick=()=>{const o={back:i.back||tNextWeek(0)};openDate(o,()=>commit(o.back),'back')};
}
/* the ball is back with you: close this one and capture the next step in the same department */
function tLand(i,after){
  const box=tSheetBox();
  box.innerHTML=`<h3>Landed. What’s the next step?</h3><p>${esc(i.title)} is back with you.</p>
    <input class="field" id="tnext" placeholder="Book the follow-up appointment" />
    <div class="sheet-acts"><button class="btn" id="tnone">No next step — it’s finished</button>
      <span style="flex:1"></span><button class="btn btn-hot" id="tadd">Add next step</button></div>`;
  const f=box.querySelector('#tnext');f.focus();
  const fin=v=>{tSet(i,'done');const n=v?tAdd(v,i.dept,'inbox'):null;closeSheet();
    toast(n?'next step is in the inbox':'landed');if(after)after(n)};
  f.onkeydown=e=>{if(e.key==='Enter'&&f.value.trim())fin(f.value.trim())};
  box.querySelector('#tadd').onclick=()=>{const v=f.value.trim();if(!v){f.focus();return}fin(v)};
  box.querySelector('#tnone').onclick=()=>fin('');
}
/* the follow-up message, in Brazilian Portuguese */
function tNudgeText(i){
  const w=i.wait||{};
  if(i.state==='wife')return `Amor, lembra de "${i.title}"? Consegue me ajudar com isso essa semana? Obrigado! 💛`;
  const quando=w.since?new Date(w.since+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long'}):'';
  return `Oi${w.who?' '+w.who:''}, tudo bem? Estou passando para saber como está "${i.title}"${quando?`, que enviei em ${quando}`:''}. Consegue me dar um retorno? Obrigado!`;
}
function tNudge(i){
  const box=tSheetBox();
  box.innerHTML=`<h3>Nudge</h3><p>Copy it and send it however you usually reach them. Nothing here changes.</p>
    <textarea class="tai" id="tnmsg" rows="4">${esc(tNudgeText(i))}</textarea>
    <div class="sheet-acts" style="margin-top:20px">${i.state==='waiting'?`<button class="btn" id="tnpush">Push check-back</button>`:''}
      <span style="flex:1"></span><button class="btn" id="no">Close</button><button class="btn btn-hot" id="tncp">Copy</button></div>`;
  const ta=box.querySelector('#tnmsg');
  box.querySelector('#tncp').onclick=()=>tCopy(ta.value,ta);
  box.querySelector('#no').onclick=closeSheet;
  const p=box.querySelector('#tnpush');if(p)p.onclick=()=>{closeSheet();tPush(i)};
}
function tPush(i,after){i.wait=i.wait||{who:'',since:today(),checkBack:null};openDate(i.wait,after||tRefresh,'checkBack')}
function tTemplateSheet(){
  const box=tSheetBox(true);
  box.innerHTML=`<h3>AI instruction template</h3>
    <p>Used for every card in the AI queue unless you edit that card. Fill-ins: {task} {department} {notes} {reference}.</p>
    <textarea class="tai" id="ttpltxt" rows="10">${esc(S.town.aiTemplate)}</textarea>
    <div class="sheet-acts" style="margin-top:20px"><button class="btn" id="tdef">Back to the default</button>
      <span style="flex:1"></span><button class="btn btn-hot" id="tok">Save</button></div>`;
  const ta=box.querySelector('#ttpltxt');
  box.querySelector('#tdef').onclick=()=>{ta.value=TOWN_AI_TEMPLATE};
  box.querySelector('#tok').onclick=()=>{S.town.aiTemplate=ta.value;save();closeSheet();tRefresh()};
}
const tStakeBtns=i=>`<span class="tstakes"><span class="tstakes-l">If it slips a week</span>${TOWN_STAKES.slice().reverse().map(s=>
  `<button class="tstake ${i.stakes===s.v?'on':''}" data-tstake="${i.id}:${s.v}" style="--sc:${s.color}" title="${s.hint}">${s.name}</button>`).join('')}</span>`;
const tStakeHelp=()=>`<div class="tstakehelp">${TSTAKE_Q} <b>Yes, nothing changes</b> → can wait · <b>yes, but it costs more</b> → gets worse · <b>no, something is lost</b> → can’t undo.</div>`;
function tItemSheet(id){
  const box=tSheetBox(true);
  const draw=()=>{
    const i=tById(id);if(!i||!mlayer.contains(box)){closeSheet();return}
    const st=TOWN_STATES.find(s=>s.id===i.state),open=tOpen(i),w=i.wait||{};
    box.innerHTML=`
      <textarea class="dtext" id="tti" rows="1">${esc(i.title)}</textarea>
      <div class="zkept" style="margin:4px 0 0">${st.name}${i.state==='later'&&i.back?' · back '+tDay(i.back):''}${tIsToday(i)?' · on today':''}${open?' · verdicts happen in the weekly round':''}</div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Department</div>
        <div class="chips">${TOWN_DEPTS.map(d=>`<button class="chip ${i.dept===d.id?'on':''}" data-tdp="${d.id}" style="color:${d.color}"><b></b>${d.name}</button>`).join('')}</div></div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">If it slips a week</div>${tStakeBtns(i)}${tStakeHelp()}</div>
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Size</div>
        <div class="chips">${TOWN_SIZES.map(s=>`<button class="chip ${i.size===s.v&&!i.home?'on':''}" data-tsz="${s.v}" style="color:var(--hot)"><b></b>${s.short||s.name}</button>`).join('')}
          <button class="chip ${i.home?'on':''}" data-tsz="home" style="color:#0B7A55"><b></b>${TOWN_HOME.short}</button>
          <button class="chip ${!i.size&&!i.home?'on':''}" data-tsz="" style="color:${C.grey}"><b></b>Not sized</button></div></div>
      ${i.state==='week'?`<div class="dsec"><div class="seg-label" style="margin:0 0 10px">Today</div>
        <div class="chips"><button class="chip ${tIsToday(i)?'on':''}" data-ttoday="${i.id}" style="color:var(--hot)"><b></b>${tIsToday(i)?'On today':'Put it on today'}</button></div></div>`:''}
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Deadline</div><div class="dates">${dateChips(i)}</div></div>
      ${i.state==='waiting'?`<div class="dsec"><div class="seg-label" style="margin:0 0 10px">Waiting on</div>
        <input class="sinput" id="twho2" placeholder="Who has it?" value="${esc(w.who||'')}" style="width:100%" />
        <div class="zkept" style="margin:12px 0 10px">since ${w.since?tShort(w.since):'—'} · check back ${w.checkBack?dueLabel(w.checkBack).t:'— not set'}</div>
        <button class="dbtn" id="tcb2">${w.checkBack?'Change check-back':'Set check-back'}</button></div>`:''}
      ${i.state==='ai'?`<div class="dsec"><div class="seg-label" style="margin:0 0 10px">Instruction for the AI</div>
        <textarea class="tai" id="tins2" rows="6">${esc(tInstr(i))}</textarea></div>`:''}
      <div class="dsec"><div class="seg-label" style="margin:0 0 10px">Notes</div>
        <textarea class="tai" id="tnotes" rows="3" placeholder="Anything worth remembering about this one">${esc(i.notes||'')}</textarea></div>
      <div class="sheet-acts" style="margin-top:30px">
        <button class="btn btn-danger" id="tdel">Delete</button><span style="flex:1"></span>
        ${open?`<button class="btn" id="tdone">✓ Done</button>`:''}
        <button class="btn btn-hot" id="tok">Save</button></div>`;
    const ta=box.querySelector('#tti');autosize(ta);
    ta.oninput=()=>{autosize(ta);const v=ta.value.trim();if(v){i.title=v;save()}};
    box.querySelectorAll('[data-tdp]').forEach(b=>b.onclick=()=>{i.dept=b.dataset.tdp;save();draw()});
    box.querySelectorAll('[data-tsz]').forEach(b=>b.onclick=()=>{const v=b.dataset.tsz;
      i.home=v==='home';i.size=v&&v!=='home'?+v:null;save();draw()});
    box.querySelectorAll('[data-tstake]').forEach(b=>b.onclick=()=>{const v=+b.dataset.tstake.split(':')[1];i.stakes=i.stakes===v?0:v;save();draw()});
    box.querySelectorAll('[data-ttoday]').forEach(b=>b.onclick=()=>{i.today=tIsToday(i)?null:today();save();draw()});
    box.querySelectorAll('[data-dset]').forEach(b=>b.onclick=()=>{i.due=b.dataset.dset||null;save();draw()});
    const dpk=box.querySelector('[data-dpick]');if(dpk)dpk.onclick=()=>openDate(i,draw);
    const who=box.querySelector('#twho2');if(who)who.oninput=()=>{i.wait=i.wait||{since:today(),checkBack:null};i.wait.who=who.value;save()};
    const cb=box.querySelector('#tcb2');if(cb)cb.onclick=()=>tPush(i,draw);
    const ins=box.querySelector('#tins2');if(ins)ins.oninput=()=>{i.instr=ins.value;save()};
    const nt=box.querySelector('#tnotes');nt.oninput=()=>{i.notes=nt.value;save()};
    box.querySelector('#tok').onclick=()=>{closeSheet();tRefresh()};
    const dn=box.querySelector('#tdone');
    if(dn)dn.onclick=()=>{const was=i.state;tSet(i,'done');closeSheet();tRefresh();
      toastUndo('done',()=>{tSet(i,was);tRefresh()})};
    box.querySelector('#tdel').onclick=()=>sheetConfirm('Delete this?',i.title,'Delete',()=>{
      S.town.items=S.town.items.filter(x=>x.id!==id);save();tRefresh()});
  };
  draw();
  const v=mlayer.querySelector('.veil');
  if(v)v.onclick=e=>{if(e.target.classList.contains('veil')){closeSheet();tRefresh()}};
}
/* Town replaced the old personal board. Once, every open personal task is copied into
   Town's inbox with a suggested department; the originals stay in storage untouched (just
   no longer shown), so nothing is lost and a rollback still has them. Anything copied by the
   earlier one-time import is recognised by its `from` id and not copied twice. */
function adoptPersonal(){
  if(S.town.adopted)return;
  const have=new Set(S.town.items.map(i=>i.from).filter(Boolean));
  S.items.filter(i=>i.mode==='personal'&&!i.done&&!have.has(i.id)).forEach(i=>{
    const t=tAdd(i.text,null,'inbox');t.suggest=TOWN_IMPORT[i.domain]||null;t.from=i.id;if(i.due)t.due=i.due});
  S.town.adopted=true;S.town.imported=true;save();
}
/* open Town items, for the "held in personal" ledger shown in work mode */
const townHeld=()=>S.town.items.filter(i=>['inbox','week','ai','wife','waiting'].includes(i.state)).length;
/* the one personal thing the work ritual surfaced for today — a Town item now */
function personalPick(){const p=S.personal.todayPick;if(!p||p.date!==today())return null;
  const i=tById(p.id);return i&&tOpen(i)?i:null}

/* ---- town: views ---- */
function viewTown(){
  const v=S.ui.townView||'home';
  return v==='today'||v==='week'?tViewToday():v==='ai'?tViewAI():v==='waiting'?tViewWaiting()
    :v==='map'?tViewMap():v==='dept'?tViewDept(S.ui.townDept):tViewHome();
}
function tViewHome(){
  const T=S.town.items,n=st=>T.filter(i=>i.state===st).length;
  const r=S.town.round,mv=tMoveLive(),late=T.filter(tLate).length,todayN=T.filter(tIsToday).length;
  const moved=T.filter(i=>i.from&&i.state==='inbox'&&!i.dept).length,ph=weekPhrase();
  const where=r?(TROUND[r.step].id==='rounds'&&r.depts&&r.depts[r.di]?tDept(r.depts[r.di]).name+' · ':'')+'step '+(r.step+1)+' of '+TROUND.length:'';
  const mins=tDayMins(),mt=mins?TOWN_TIMES.find(x=>x.v===mins):null;
  return `<div class="home-grid">
    <button class="hometile hometile-phrase tgo" id="hometile-phrase">
      <span class="ht-label">✨ What would make this week good</span>
      <span class="ht-title">${ph?esc(ph):'Not set yet — tap to choose one thing'}</span></button>
    <div class="town-acts">
      <button class="hometile hometile-ritual" id="tround">
        <span class="ht-label">Weekly round</span>
        <span class="ht-title">${r?'Continue the round':'Start the round'}</span>
        <span class="ht-meta">${r?where:S.town.lastRound?'last round '+tAgo(S.town.lastRound):'not run yet'}</span></button>
      <button class="hometile hometile-ritual tmove" id="tmove">
        <span class="ht-label">Today’s move</span>
        <span class="ht-title">${mv?'Continue today’s move':todayN?'Today is planned':'Plan today'}</span>
        <span class="ht-meta">${todayN?`${todayN} on today${mt?' · '+mt.name:''}`:n('week')+' on this week’s list'}</span></button>
    </div>
    <div class="zdump tcap"><textarea id="tcap" rows="1" placeholder="Something on your mind? It goes to the inbox — ⏎"></textarea></div>
    ${moved?`<div class="zkept tmoved">${moved} task${moved===1?'':'s'} from the old personal board ${moved===1?'is':'are'} in the inbox — the weekly round sorts ${moved===1?'it':'them'}.</div>`:''}
    <div class="town-row">
      <button class="hometile" data-tv="today"><span class="ht-label">Today</span>
        <span class="ht-title">${todayN?todayN+' on today':'Not planned'}</span>
        <span class="ht-meta">${Math.max(0,n('week')-T.filter(i=>i.state==='week'&&tIsToday(i)).length)} more this week · ${T.filter(tDoneToday).length} done today</span></button>
      <button class="hometile" data-tv="ai"><span class="ht-label">AI queue</span>
        <span class="ht-title">${n('ai')} ready</span><span class="ht-meta">copy · send · mark sent</span></button>
      <button class="hometile" data-tv="waiting"><span class="ht-label">Waiting</span>
        <span class="ht-title">${n('waiting')} out</span><span class="ht-meta" ${late?'style="color:#C5221F"':''}>${late?late+' to check on':n('wife')?n('wife')+' with your wife':'nothing due back'}</span></button>
      <button class="hometile" data-tv="map"><span class="ht-label">Town map</span>
        <span class="ht-title">${TOWN_DEPTS.filter(d=>tPulse(d.id)==='red').length?'Something’s overdue':'All departments'}</span>
        <span class="ht-meta">${TOWN_DEPTS.length} departments</span></button>
    </div>
  </div>`;
}
/* where: 'week' (toggle onto today) or 'today' (take it off today) */
function tCard(i,where){
  const d=tDept(i.dept),l=i.due?dueLabel(i.due):null,s=tStake(i),on=tIsToday(i);
  return `<div class="card tcard ${on&&where==='week'?'ttoday':''}" data-topen="${i.id}" style="--cc:${tColor(i)}">
    <div class="card-top"><button class="tick" data-tdone="${i.id}" title="Done"></button>
      <div class="card-text">${esc(i.title)}</div></div>
    <div class="card-sub">${d?`<span class="tag" style="color:${d.color}">${esc(d.name)}</span>`:''}
      ${s&&s.v>1?`<span class="tag pill" style="background:${s.color}">${s.name}</span>`:''}
      ${l?`<span class="tag pill" style="background:${l.c==='late'?C.red:'var(--hot)'}">${l.t}</span>`:''}
      ${where==='today'&&tSizeLabel(i)?`<span class="tag">${tSizeLabel(i)}</span>`:''}
      <span class="grow"></span>
      ${where==='today'?`<button class="tlink" data-ttoday="${i.id}">not today</button>`
        :where==='week'?`<button class="tlink ${on?'on':''}" data-ttoday="${i.id}">${on?'✓ today':'+ today'}</button>`:''}</div></div>`;
}
function tMeter(mins,L){
  const home=tHomeItems(L).length;L=tDayItems(L);
  const used=tSizeSum(L),uns=L.filter(i=>!i.size).length,cap=mins||0;
  const pct=cap?Math.min(100,Math.round(used/cap*100)):0,over=cap&&used>cap;
  return `<div class="tmeter ${over?'over':''}"><span class="tmeter-l">${cap?`${used} of ${TOWN_TIMES.find(x=>x.v===cap).name}`:`${used} min`} planned${uns?` · ${uns} unsized`:''}${home?` · ${home} after work`:''}</span>
    ${cap?`<span class="tmeter-b"><i style="width:${pct}%"></i></span>`:''}${over?`<span class="tmeter-w">that’s more than today has</span>`:''}</div>`;
}
/* Today = the plate (highlighted, at the top) + the rest of this week underneath, grouped by
   department like work's "Also on the board", + a glance at the AI queue and Waiting. */
function tViewToday(){
  const mins=tDayMins(),L=S.town.items.filter(tIsToday).sort(tOrder),done=S.town.items.filter(tDoneToday);
  const day=tDayItems(L),home=tHomeItems(L);
  const rest=S.town.items.filter(i=>i.state==='week'&&!tIsToday(i)).sort(tOrder);
  const ai=S.town.items.filter(i=>i.state==='ai').sort(tOrder);
  const wait=S.town.items.filter(i=>i.state==='waiting'||i.state==='wife').sort((a,b)=>(tLate(b)-tLate(a))||tWaitOrder(a,b));
  const late=wait.filter(tLate).length;
  const groups=[...TOWN_DEPTS,{id:null,name:'No department',color:C.grey}]
    .map(d=>({d,list:rest.filter(i=>(i.dept||null)===d.id)})).filter(g=>g.list.length);
  const mini=i=>{const k=tStake(i),l=i.due?dueLabel(i.due):null;
    return `<div class="tmini" data-topen="${i.id}" title="${esc(i.title)}">
      <span class="d" style="background:${k&&k.v>1?k.color:tColor(i)}"></span>
      <span class="t">${esc(i.title)}</span>
      ${l?`<span class="tag" style="color:${l.c==='late'?C.red:'var(--ink-3)'}">${l.t}</span>`:''}
      ${tSizeLabel(i)?`<span class="tag">${tSizeLabel(i)}</span>`:''}
      <button class="tlink" data-ttoday="${i.id}">+ today</button></div>`};
  return `${tBackLink()}<div class="planhead"><h2>Today</h2><span>${tDay(today())}${mins?' · '+TOWN_TIMES.find(x=>x.v===mins).name+' free':''}</span></div>
    <div class="tplatewrap">
      ${L.length||mins?tMeter(mins,L):''}
      ${day.length?`<div class="tplate">${day.map(i=>tCard(i,'today')).join('')}</div>`:''}
      ${home.length?`<div class="slotlabel" style="margin:${day.length?'26px':'0'} 0 12px">🏠 After work, at home — ${home.length}</div>
        <div class="tplate">${home.map(i=>tCard(i,'today')).join('')}</div>`:''}
      ${!L.length?`<div class="tplate-empty"><h3>${done.length?'Nothing left on today.':'Today isn’t planned yet.'}</h3>
        <p>${done.length?'Nice. Add another from this week below, or call it a day.':'Today’s move picks it in a minute — or add from this week below.'}</p>
        ${done.length?'':`<button class="btn btn-hot" id="tmove2">Plan today</button>`}</div>`:''}
      ${done.length?`<div class="tdonestrip">✓ Done today: ${done.map(i=>`<span>${esc(i.title)}</span>`).join('')}</div>`:''}
    </div>
    <div class="rest">
      <h3>Also this week — ${rest.length}</h3>
      ${groups.length?`<div class="restgrid">${groups.map(g=>`<div class="restgroup">
        <h4 style="color:${g.d.color}"><b></b>${g.d.name}<span>${g.list.length}</span></h4>
        ${g.list.map(mini).join('')}</div>`).join('')}</div>`
        :`<div class="col-empty">${S.town.items.some(i=>i.state==='week')?'Everything this week is on today.':'Nothing on this week’s list — the weekly round fills it.'}</div>`}
    </div>
    <div class="tpeek">
      <div class="tpeekcard">
        <div class="tpeek-h"><span>🤖 AI queue</span><b>${ai.length}</b></div>
        ${ai.slice(0,3).map(i=>`<div class="tpeek-r" data-topen="${i.id}"><span class="d" style="background:${tColor(i)}"></span><span class="t">${esc(i.title)}</span></div>`).join('')
          ||`<div class="tpeek-e">Nothing to hand off.</div>`}
        ${ai.length>3?`<div class="tpeek-e">and ${ai.length-3} more</div>`:''}
        <button class="zlink" data-tv="ai">Open the AI queue →</button></div>
      <div class="tpeekcard">
        <div class="tpeek-h"><span>👤 Waiting</span><b>${wait.length}</b>${late?`<em>${late} to check on</em>`:''}</div>
        ${wait.slice(0,3).map(i=>`<div class="tpeek-r ${tLate(i)?'late':''}" data-topen="${i.id}"><span class="d" style="background:${tColor(i)}"></span>
          <span class="t">${esc(i.title)}</span><span class="tag">${i.state==='wife'?'💛 wife':esc((i.wait&&i.wait.who)||'')}</span></div>`).join('')
          ||`<div class="tpeek-e">Nobody has the ball.</div>`}
        ${wait.length>3?`<div class="tpeek-e">and ${wait.length-3} more</div>`:''}
        <button class="zlink" data-tv="waiting">Open Waiting →</button></div>
    </div>`;
}
/* AI queue: a list on the left, the selected card's instruction on the right. On a phone
   the instruction opens inline under the card you tap. */
function tViewAI(){
  const list=S.town.items.filter(i=>i.state==='ai').sort(tOrder);
  const sel=list.find(i=>i.id===S.ui.aiSel)||list[0];
  const detail=i=>{const d=tDept(i.dept),s=tStake(i);
    return `<div class="taidetail" style="--cc:${tColor(i)}">
      <div class="taihead">${d?`<span class="dot" style="color:${d.color}"><b></b>${d.name}</span>`:''}
        ${s&&s.v>1?`<span class="tag pill" style="background:${s.color}">${s.name}</span>`:''}</div>
      <div class="taititle" data-topen="${i.id}">${esc(i.title)}</div>
      <textarea class="tai" data-tinstr="${i.id}" rows="9">${esc(tInstr(i))}</textarea>
      <div class="taiacts"><button class="btn btn-hot" data-tcopy="${i.id}">Copy</button>
        <button class="btn" data-tsent="${i.id}">Sent → Waiting</button>
        ${i.instr!=null?`<button class="zlink" data-treset="${i.id}" style="font-size:12px">back to the template</button>`:''}</div></div>`};
  return `${tBackLink()}<div class="planhead"><h2>AI queue</h2><span>${list.length} ready</span></div>
    <p class="tlede">Copying changes nothing. Once you have actually sent it, press <b>Sent → Waiting</b>.
      <button class="zlink" id="ttpl" style="font-size:12px;margin-left:6px">edit the template</button></p>
    ${list.length?`<div class="taiwrap">
      <div class="tailist">${list.map(i=>{const d=tDept(i.dept),s=tStake(i),on=i===sel;
        return `<button class="taiitem ${on?'on':''}" data-taisel="${i.id}" style="--cc:${tColor(i)}">
          <span class="taiitem-t">${esc(i.title)}</span>
          <span class="taiitem-m">${d?esc(d.name):'No department'}${s&&s.v>1?` · <b style="color:${s.color}">${s.name}</b>`:''}${i.instr!=null?' · edited':''}</span>
        </button>${on?`<div class="taiinline">${detail(i)}</div>`:''}`}).join('')}</div>
      <div class="taipane">${detail(sel)}</div></div>`
    :`<div class="empty"><h3>Queue’s clear.</h3><p>Things land here when the weekly round delegates them.</p></div>`}`;
}
function tWaitRow(i){
  const w=i.wait||{},late=tLate(i),wife=i.state==='wife';
  return `<div class="trow ${late?'late':''} ${wife?'twife':''}">
    <span class="tr-what" data-topen="${i.id}">${esc(i.title)}</span>
    <span class="tr-who">${wife?'💛 Wife':esc(w.who||'—')}</span>
    <span class="tr-meta">since ${w.since?tShort(w.since):'—'}</span>
    <span class="tr-meta tr-cb">${w.checkBack?(late?'⚠ ':'')+'check '+dueLabel(w.checkBack).t:wife?'talk it through':'no check-back'}</span>
    <span class="tr-acts"><button class="zsel" data-tland="${i.id}">Landed</button>
      <button class="zsel" data-tnudge="${i.id}">Nudge</button>
      <button class="zsel" data-tpush="${i.id}">Push</button></span></div>`;
}
function tViewWaiting(){
  const all=S.town.items.filter(i=>i.state==='waiting'),wife=S.town.items.filter(i=>i.state==='wife').sort(tOrder);
  const groups=[...TOWN_DEPTS,{id:null,name:'No department',color:C.grey}]
    .map(d=>({d,list:all.filter(i=>(i.dept||null)===d.id).sort(tWaitOrder)})).filter(g=>g.list.length);
  return `${tBackLink()}<div class="planhead"><h2>Waiting</h2><span>${all.length} out · ${all.filter(tLate).length} to check on${wife.length?` · ${wife.length} with your wife`:''}</span></div>
    <p class="tlede">The ball is with someone else. Not “later” — you’re waiting on them, and checking back.</p>
    ${groups.length||wife.length?`<div class="trow trow-h"><span>What</span><span>Who has it</span><span>Since</span><span>Check back</span><span></span></div>`:''}
    ${wife.length?`<div class="restgroup tgroup"><h4 style="color:#D01884"><b></b>Wife help<span>${wife.length}</span></h4>${wife.map(tWaitRow).join('')}</div>`:''}
    ${groups.map(g=>`<div class="restgroup tgroup"><h4 style="color:${g.d.color}"><b></b>${g.d.name}<span>${g.list.length}</span></h4>
      ${g.list.map(tWaitRow).join('')}</div>`).join('')}
    ${!groups.length&&!wife.length?`<div class="empty"><h3>Nothing out.</h3><p>When the round hands something to someone, it shows up here.</p></div>`:''}`;
}
function tViewMap(){
  return `${tBackLink()}<div class="planhead"><h2>Town map</h2><span>in round order · tap a department</span></div>
    <div class="tmap">${TOWN_DEPTS.map(d=>{
      const L=S.town.items.filter(i=>i.dept===d.id),c=st=>L.filter(i=>i.state===st).length,p=tPulse(d.id),lv=S.town.depts[d.id].lastVisit;
      const costly=L.filter(i=>tOpen(i)&&i.stakes===3).length;
      return `<button class="ttile" data-tdept="${d.id}" style="--cc:${d.color}">
        <span class="ttile-h"><span class="tpulse ${p}" title="${TPULSE[p]}"></span><span class="ttile-n">${d.name}</span></span>
        ${d.hint?`<span class="ttile-hint">${d.hint}</span>`:''}
        <span class="ttile-c">${c('week')} this week · ${c('ai')} AI · ${c('waiting')+c('wife')} waiting · ${c('later')} not this week</span>
        ${costly?`<span class="ttile-c" style="color:#D93025;font-weight:700">${costly} can’t undo if it slips</span>`:''}
        ${c('inbox')?`<span class="ttile-c" style="color:var(--ink-3)">${c('inbox')} in the inbox</span>`:''}
        <span class="ttile-v">${p==='calm'?'':TPULSE[p]+' · '}${lv?'visited '+tAgo(lv):'not visited yet'}</span></button>`}).join('')}</div>`;
}
function tLine(i){
  const l=i.due?dueLabel(i.due):null,s=tSize(i),k=tStake(i);
  return `<div class="zrow tline" data-topen="${i.id}" style="--cc:${tColor(i)}">
    <span class="zt">${esc(i.title)}</span>
    ${k&&k.v>1?`<span class="zd" style="color:${k.color}">${k.name}</span>`:''}
    ${tSizeLabel(i)?`<span class="zd">${tSizeLabel(i)}</span>`:''}
    ${i.state==='later'&&i.back?`<span class="zd dim">📅 ${tShort(i.back)}</span>`:''}
    ${l?`<span class="zd ${l.c==='late'?'late':''}">${l.t}</span>`:''}</div>`;
}
function tViewDept(id){
  const d=tDept(id);if(!d)return tViewMap();
  const L=S.town.items.filter(i=>i.dept===id),p=tPulse(id),lv=S.town.depts[id].lastVisit;
  const groups=['inbox','week','ai','wife','waiting','later'].map(s=>({s:TOWN_STATES.find(x=>x.id===s),list:L.filter(i=>i.state===s).sort(s==='waiting'?tWaitOrder:tOrder)})).filter(g=>g.list.length);
  const done=L.filter(i=>i.state==='done').sort((a,b)=>(b.doneAt||0)-(a.doneAt||0));
  return `<div class="tback"><button class="zlink" data-tback="1">← Town hall</button>
      <button class="zlink" data-tv="map" style="margin-left:18px">Town map</button></div>
    <div class="planhead"><h2 style="color:${d.color}">${d.name}</h2>
      <span><span class="tpulse ${p}" style="display:inline-block;vertical-align:-1px;margin-right:8px"></span>${TPULSE[p]} · ${lv?'visited '+tAgo(lv):'not visited yet'}</span></div>
    ${d.hint?`<p class="tlede">${d.hint}.</p>`:''}
    <div class="tdeptpage">
      <div>
        <input class="snew" id="tdadd" placeholder="Add something for ${esc(d.name)} — ⏎ (it goes to the inbox)" style="margin:0 0 8px" />
        ${groups.map(g=>`<div class="slotlabel">${g.s.name} — ${g.list.length}</div>
          ${g.list.map(i=>g.s.id==='waiting'||g.s.id==='wife'?tWaitRow(i):tLine(i)).join('')}`).join('')
          ||`<div class="col-empty">Nothing open here.</div>`}
      </div>
      <div>
        <div class="slotlabel" style="margin-top:0">Reference card</div>
        <textarea class="tref" id="tref" placeholder="Standing facts — doctor names, renewal months, sizes, who to call">${esc(S.town.depts[id].ref)}</textarea>
        <div class="zkept" style="margin:10px 0 0">No ID, card or account numbers here — it’s stored as plain text in this browser.</div>
        <div class="slotlabel">Done log — ${done.length}</div>
        ${done.map(i=>`<div class="donerow"><span class="d" style="background:${d.color}"></span>
          <span class="t">${esc(i.title)}</span><span class="tag">${tShort(i.doneAt)}</span></div>`).join('')
          ||`<div class="col-empty">Nothing finished yet.</div>`}
      </div>
    </div>`;
}
/* shared by the tabs and the ritual overlay: open, done, today, waiting-row actions */
function tWireCommon(root){
  root.querySelectorAll('[data-topen]').forEach(el=>el.onclick=e=>{
    if(e.target.closest('[data-tdone],[data-ttoday]'))return;tItemSheet(el.dataset.topen)});
  root.querySelectorAll('[data-tdone]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=tById(b.dataset.tdone);if(!i)return;const was=i.state,td=i.today;tSet(i,'done');tRefresh();
    toastUndo('done',()=>{tSet(i,was);i.today=td;save();tRefresh()})});
  root.querySelectorAll('[data-ttoday]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=tById(b.dataset.ttoday);if(!i)return;i.today=tIsToday(i)?null:today();save();tRefresh()});
  root.querySelectorAll('[data-tland]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tland);
    if(i)tLand(i,n=>{const r=S.town.round;
      if(TZ==='round'&&n&&r&&r.lists&&r.depts&&r.lists[r.depts[r.di]]&&n.dept===r.depts[r.di]){r.lists[n.dept].push(n.id);save()}
      tRefresh()})});
  root.querySelectorAll('[data-tnudge]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tnudge);if(i)tNudge(i)});
  root.querySelectorAll('[data-tpush]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tpush);if(i)tPush(i)});
  root.querySelectorAll('[data-tstake]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const [id,v]=b.dataset.tstake.split(':'),i=tById(id);if(!i)return;i.stakes=i.stakes===+v?0:+v;save();tRefresh()});
}
function wireTown(){
  if(S.ui.mode!=='personal'||S.ui.personalView==='north')return;
  app.querySelectorAll('[data-tv]').forEach(b=>b.onclick=()=>townNav(b.dataset.tv));
  app.querySelectorAll('[data-tback]').forEach(b=>b.onclick=townHome);
  app.querySelectorAll('[data-tdept]').forEach(b=>b.onclick=()=>townNav('dept',b.dataset.tdept));
  const tr=document.getElementById('tround');if(tr)tr.onclick=startRound;
  const tm=document.getElementById('tmove');if(tm)tm.onclick=startMove;
  const tm2=document.getElementById('tmove2');if(tm2)tm2.onclick=startMove;
  const cap=document.getElementById('tcap');
  if(cap){autosize(cap);cap.oninput=()=>autosize(cap);
    cap.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();
      const lines=cap.value.split('\n').map(x=>x.trim()).filter(Boolean);if(!lines.length)return;
      lines.forEach(t=>tAdd(t,null,'inbox'));render();toast(lines.length===1?'in the inbox':lines.length+' in the inbox');
      const c2=document.getElementById('tcap');if(c2)c2.focus()}}}
  const da=document.getElementById('tdadd');
  if(da)da.onkeydown=e=>{if(e.key==='Enter'){const v=da.value.trim();if(!v)return;
    tAdd(v,S.ui.townDept,'inbox');render();toast('in the inbox');const d2=document.getElementById('tdadd');if(d2)d2.focus()}};
  const rf=document.getElementById('tref');
  if(rf){autosize(rf);rf.oninput=()=>{autosize(rf);S.town.depts[S.ui.townDept].ref=rf.value;save()}}
  app.querySelectorAll('[data-taisel]').forEach(b=>b.onclick=()=>{S.ui.aiSel=b.dataset.taisel;save();render()});
  app.querySelectorAll('[data-tinstr]').forEach(ta=>ta.oninput=()=>{const i=tById(ta.dataset.tinstr);if(i){i.instr=ta.value;save()}});
  app.querySelectorAll('[data-tcopy]').forEach(b=>b.onclick=()=>{
    const ta=b.closest('.taidetail').querySelector('[data-tinstr]');if(ta)tCopy(ta.value,ta)});
  app.querySelectorAll('[data-tsent]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tsent);if(i)tWaitSheet(i,'AI concierge',render)});
  app.querySelectorAll('[data-treset]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.treset);if(i){i.instr=null;save();render()}});
  const tp=document.getElementById('ttpl');if(tp)tp.onclick=tTemplateSheet;
  tWireCommon(app);
}

/* ---- town: the two rituals ----
   Their own overlay and state machine (S.town.round / S.town.move), styled with the work
   ritual's shell but sharing none of its state — so they can't disturb ZSTEPS / S.ritual.
   Every tap saves; closing mid-way is a pause and reopening resumes on the same screen. */
let TZ=null,TZT0=0,TZTICK=null,TZJUST=[],TZLATER=false;
const tzlayer=(()=>{const d=document.createElement('div');document.body.appendChild(d);return d})();
function tzOpen(kind){
  TZ=kind;TZT0=Date.now();TZJUST=[];TZLATER=false;document.body.style.overflow='hidden';
  tzlayer.innerHTML=`<div id="zen" class="tzen">
    <div class="zbar"><div class="zdots" id="tzdots"></div><div class="zclock" id="tzclock">00:00</div>
      <button class="zexit" id="tzexit">Pause</button></div>
    <div class="zbody"><div id="tzcontent"><div class="zstep" id="tzstep"></div><div class="zname" id="tzname"></div>
      <div class="znote" id="tznote"></div><div id="tzmid"></div></div>
      <div class="zacts" id="tzacts"></div><div class="zhint" id="tzhint"></div></div></div>`;
  document.getElementById('tzexit').onclick=tzPause;
  TZTICK=setInterval(()=>{const el=document.getElementById('tzclock');
    if(el){const s=Math.floor((Date.now()-TZT0)/1000);
      el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}},1000);
  tzPaint(true);
}
function tzClose(){TZ=null;clearInterval(TZTICK);tzlayer.innerHTML='';document.body.style.overflow='';render()}
function tzPause(){const k=TZ;tzClose();toast('paused — it picks up right here');if(k==='round')resumeWorkIfDetoured()}
function tzPaint(change){if(TZ==='round')tzRound(change);else if(TZ==='move')tzMove(change)}
function tzFrame(o,change){
  document.getElementById('tzdots').innerHTML=o.dots.map(c=>`<i class="${c}"></i>`).join('');
  document.getElementById('tzstep').textContent=o.step;
  document.getElementById('tzname').textContent=o.name;
  document.getElementById('tznote').textContent=o.note||'';
  const mid=document.getElementById('tzmid');mid.innerHTML=o.mid;
  document.getElementById('tzacts').innerHTML=`${o.back?`<button class="zbtn back" id="tzback" title="Previous step">←</button>`:''}
    ${o.extra||''}<button class="zbtn" id="tzgo">${o.cta}</button>`;
  document.getElementById('tzhint').textContent=o.hint||'⏎ or space for the next step · Pause keeps your place';
  if(o.back)document.getElementById('tzback').onclick=o.back;
  document.getElementById('tzgo').onclick=o.go;
  if(change){const z=tzlayer.querySelector('#zen');if(z)z.scrollTop=0;
    const c=document.getElementById('tzcontent');c.classList.remove('stepin');void c.offsetWidth;c.classList.add('stepin')}
  tWireCommon(mid);
  return mid;
}
const tzDots=(n,at)=>Array.from({length:n},(_,k)=>k<at?'on':k===at?'now':'');

/* -- weekly round -- */
function startRound(){if(!S.town.round){S.town.round={step:0,startedAt:Date.now()};save()}tzOpen('round')}
/* a department gets a screen if it has something to decide, someone to chase, or something
   whose "not this week" date has come round */
const tDeptBusy=id=>S.town.items.some(i=>i.dept===id&&(['inbox','week','waiting','wife'].includes(i.state)||tBackNow(i)));
function tStartRounds(r,at){
  r.depts=TOWN_DEPTS.filter(d=>tDeptBusy(d.id)).map(d=>d.id);r.lists={};
  r.di=at==='last'?Math.max(0,r.depts.length-1):0;tEnterDept(r);
}
/* the department's list is frozen on entry, riskiest first, so a verdict doesn't make a row
   jump under your finger — you see what you chose, and can change it until you move on */
function tEnterDept(r){
  const id=r.depts[r.di];if(!id)return;
  r.lists=r.lists||{};
  const fresh=S.town.items.filter(i=>i.dept===id&&(i.state==='inbox'||i.state==='week'||tBackNow(i))).sort(tOrder).map(i=>i.id);
  r.lists[id]=[...new Set([...(r.lists[id]||[]),...fresh])];
  S.town.depts[id].lastVisit=Date.now();TZLATER=false;
}
function tzRoundNext(){
  const r=S.town.round,st=TROUND[r.step];
  if(st.id==='rounds'&&r.depts&&r.di<r.depts.length-1){r.di++;tEnterDept(r);save();tzPaint(true);return}
  if(st.id==='paper'){S.town.round=null;S.town.lastRound=Date.now();S.pcheck={doneWeek:isoWeek(),skips:[]};save();tzClose();
    toast('round closed — have a good week');if(resumeWorkIfDetoured())startZen();return}
  r.step++;
  if(TROUND[r.step].id==='rounds')tStartRounds(r,0);
  save();tzPaint(true);
}
function tzRoundBack(){
  const r=S.town.round,st=TROUND[r.step];
  if(st.id==='rounds'&&r.di>0){r.di--;tEnterDept(r);save();tzPaint(true);return}
  if(r.step===0)return;
  r.step--;
  if(TROUND[r.step].id==='rounds')tStartRounds(r,'last');
  save();tzPaint(true);
}
/* verdicts, grouped by what they mean: mine · handed off · deferred · closed */
const TVERDICTS=[
  {g:'mine',v:[['week','I’ll do it this week']]},
  {g:'hand',v:[['ai','🤖 Delegate to AI'],['wife','💛 Wife help'],['waiting','👤 Waiting on someone']]},
  {g:'defer',v:[['later','📅 Not this week']]},
  {g:'close',v:[['done','✓ Done'],['dropped','✕ Drop']]}];
function tVerdictRow(i){
  const s=tSize(i),l=i.due?dueLabel(i.due):null,k=tStake(i),closed=i.state==='dropped'||i.state==='done';
  return `<div class="zrow tvrow ${closed?'off':''}" style="--cc:${k?k.color:'var(--g300)'}">
    <div class="tv-top"><span class="zt" data-topen="${i.id}">${esc(i.title)}</span>
      ${l?`<span class="zd ${l.c==='late'?'late':''}">${l.t}</span>`:''}
      ${tSizeLabel(i)?`<span class="zd dim">${tSizeLabel(i)}</span>`:''}
      ${i.state==='later'&&i.back?`<span class="zd dim">📅 ${tShort(i.back)}</span>`:''}
      ${i.state==='inbox'?`<span class="ztag week">new</span>`:''}</div>
    ${closed?'':tStakeBtns(i)}
    <div class="tv-acts">${TVERDICTS.map(g=>`<span class="tvg tvg-${g.g}">${g.v.map(([v,lb])=>
      `<button class="zsel tv-${v} ${i.state===v?'sel':''}" data-tverd="${i.id}:${v}">${lb}${v==='later'&&i.state==='later'&&i.back?' · '+tShort(i.back):''}</button>`).join('')}</span>`).join('')}</div></div>`;
}
function tzRound(change){
  const r=S.town.round;if(!r){tzClose();return}
  const st=TROUND[r.step];
  const o={dots:tzDots(TROUND.length,r.step),step:`Weekly round · step ${r.step+1} of ${TROUND.length}`,name:st.name,
    note:TNOTE[st.id]||'',back:r.step>0||(st.id==='rounds'&&r.di>0)?tzRoundBack:null,go:tzRoundNext,cta:'Next'};
  if(st.id==='phrase'){
    const ph=weekPhrase();
    o.mid=`<div class="zdump"><textarea id="tzphrase" rows="1" placeholder="Play with Léo on Saturday">${esc(ph)}</textarea></div>
      <div class="zkept">Shown at the top of the Town hall all week.</div>`;
    o.cta=ph?'That is the week':'Skip for now';
  }
  else if(st.id==='dump'){
    const n=S.town.items.filter(i=>i.state==='inbox'&&!i.dept).length;
    o.mid=`<div class="zdump"><textarea id="tzcap" rows="1" placeholder="One line each. Press ⏎ after every one."></textarea></div>
      <div class="zkept">${n?n+' in the inbox, waiting to be sorted':'Nothing in the inbox yet.'}</div>
      ${TZJUST.length?`<div class="zcarry"><div class="zcarry-h">Just added — ${TZJUST.length}</div>
        <div class="zcarry-l">${TZJUST.map(t=>`<span class="zci" style="--cc:var(--hot)">${esc(t)}</span>`).join('')}</div></div>`:''}`;
    o.cta=TZJUST.length?'Done dumping':'Skip';
    o.hint='⏎ keeps a line · then press '+o.cta;
  }
  else if(st.id==='sort'){
    r.sortList=[...new Set([...(r.sortList||[]),...S.town.items.filter(i=>i.state==='inbox'&&!i.dept).map(i=>i.id)])].filter(id=>tById(id));
    /* unsorted first, in arrival order; each one you sort drops below, in the order you sorted them */
    const all=r.sortList.map(tById),todo=all.filter(i=>!i.dept),done=all.filter(i=>i.dept).sort((a,b)=>(a.movedAt||0)-(b.movedAt||0));
    const row=i=>`<div class="zrow tsortrow ${i.dept?'off':''}" style="--cc:${tColor(i)}">
        <div class="tv-top"><span class="zt">${esc(i.title)}</span>${i.dept?`<span class="zd" style="color:${tColor(i)}">→ ${tDept(i.dept).name}</span>`:''}</div>
        <div class="tdepts">${TOWN_DEPTS.map(d=>`<button class="zsel tdsel ${i.dept===d.id?'sel':''} ${!i.dept&&i.suggest===d.id?'sug':''}" data-tsort="${i.id}:${d.id}" style="--dc:${d.color}">${d.name}</button>`).join('')}
          <button class="zsel icon danger" data-tdel="${i.id}" title="Delete">×</button></div></div>`;
    o.mid=all.length?`<div class="zkept">${todo.length?todo.length+' to go':'All sorted.'}${todo.some(i=>i.suggest)?' · dashed = suggested from your old backlog':''}</div>
      <div class="zpick">${todo.map(row).join('')}</div>
      ${done.length?`<div class="zcarry-h" style="margin-top:26px">Sorted — ${done.length}</div><div class="zpick">${done.map(row).join('')}</div>`:''}`
      :`<div class="zbig muted">0</div><div class="zkept">Nothing to sort.</div>`;
    o.cta=todo.length?'Leave the rest for now':'Next';
    o.hint='one tap each · × deletes something that isn’t a task';
  }
  else if(st.id==='rounds'){
    const id=r.depts&&r.depts[r.di];
    if(!id){o.mid=`<div class="hout"><b>Every department is clear.</b> Nothing to decide, nobody to chase.</div>`}
    else{
      const d=tDept(id),list=(r.lists[id]||[]).map(tById).filter(Boolean);
      const later=S.town.items.filter(i=>i.dept===id&&i.state==='later'&&!list.includes(i)).sort(tOrder);
      const waiting=S.town.items.filter(i=>i.dept===id&&(i.state==='waiting'||i.state==='wife')&&!list.includes(i)).sort(tWaitOrder);
      const open=list.filter(tOpen),cnt=v=>open.filter(i=>(i.stakes||0)===v).length;
      const next=r.depts[r.di+1];
      o.name=d.name;
      o.step=`Weekly round · step ${r.step+1} of ${TROUND.length} · department ${r.di+1} of ${r.depts.length}`;
      o.note=(d.hint?d.hint+'. ':'')+TNOTE.rounds;
      o.mid=`${open.length?`<div class="tstakebar">${TOWN_STAKES.map(s=>`<span class="tsb" style="--sc:${s.color}"><b>${cnt(s.v)}</b> ${s.name.toLowerCase()}</span>`).join('')}
          ${cnt(0)?`<span class="tsb" style="--sc:var(--g300)"><b>${cnt(0)}</b> not rated</span>`:''}</div>${tStakeHelp()}`:''}
        ${list.length?`<div class="zpick">${list.map(tVerdictRow).join('')}</div>`
          :`<div class="zkept">Nothing to decide here — just the follow-ups below.</div>`}
        <input class="snew" id="tzadd" placeholder="Anything else for ${esc(d.name)}? ⏎" style="margin:6px 0 4px" />
        ${later.length?`<div style="margin-top:26px"><button class="zlink" id="tzlater">Not this week — ${later.length} · ${TZLATER?'hide':'show'}</button></div>
          ${TZLATER?`<div class="zpick" style="margin-top:12px">${later.map(tVerdictRow).join('')}</div>`:''}`:''}
        ${waiting.length?`<div class="zcarry-h" style="margin-top:30px">Handed off — ${waiting.length}</div>${waiting.map(tWaitRow).join('')}`:''}`;
      o.cta=next?'Next: '+tDept(next).name:'Done with the rounds';
      o.hint='rate it · then tap a verdict · tap the title to read or edit it';
    }
  }
  else if(st.id==='size'){
    const week=S.town.items.filter(i=>i.state==='week').sort(tOrder),left=week.filter(i=>!i.size&&!i.home).length;
    const now=S.town.items.filter(i=>i.state==='done'&&i.size===1&&i.doneAt>=(r.startedAt||0));
    o.mid=week.length||now.length?`<div class="zkept">${left?left+' not sized yet':'All sized.'}</div>
      <div class="zpick">${week.map(i=>`<div class="zrow tsortrow" style="--cc:${tColor(i)}">
        <div class="tv-top"><span class="zt" data-topen="${i.id}">${esc(i.title)}</span></div>
        <div class="tdepts">${TOWN_SIZES.map(s=>`<button class="zsel ${i.size===s.v&&!i.home?'sel':''} ${s.v===1?'tquick':''}" data-tsize="${i.id}:${s.v}">${s.short||s.name}</button>`).join('')}
          <button class="zsel thome ${i.home?'sel':''}" data-thome="${i.id}" title="Time doesn’t matter — you’ll do it once work is done, at home or out of the office">${TOWN_HOME.short}</button>
          ${i.size===1&&!i.home?`<button class="zsel tdidit" data-tdidit="${i.id}">✓ Did it now</button>`:''}</div></div>`).join('')}</div>
      ${now.length?`<div class="zcarry-h" style="margin-top:26px">Done on the spot — ${now.length}</div>
        <div class="zcarry-l">${now.map(i=>`<span class="zci" style="--cc:${tColor(i)}">✓ ${esc(i.title)}</span>`).join('')}</div>`:''}`
      :`<div class="zkept">Nothing on this week’s list — that’s allowed.</div>`;
    o.cta=left?'Leave the rest unsized':'Next';
    o.hint='⚡ 60 sec means: do it now, then tick it · 🏠 after work means: not at the desk — once work is done';
  }
  else if(st.id==='paper'){
    const txt=tPaperText();
    o.mid=`<div class="paper" id="tzpaper">${esc(txt||'Nothing chosen this week.')}</div>`;
    o.extra=txt?`<button class="zbtn tzcopy" id="tzcopy">Copy</button>`:'';
    o.cta='Close the round';
  }
  const mid=tzFrame(o,change);
  /* step-specific wiring */
  const ph=mid.querySelector('#tzphrase');
  if(ph){autosize(ph);if(change)ph.focus();
    ph.oninput=()=>{autosize(ph);setWeekPhrase(ph.value);document.getElementById('tzgo').textContent=weekPhrase()?'That is the week':'Skip for now'};
    ph.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();tzRoundNext()}}}
  const cap=mid.querySelector('#tzcap');
  if(cap){autosize(cap);cap.focus();cap.oninput=()=>autosize(cap);
    cap.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();
      const lines=cap.value.split('\n').map(x=>x.trim()).filter(Boolean);if(!lines.length)return;
      lines.forEach(t=>{tAdd(t,null,'inbox');TZJUST.push(t)});tzPaint(false)}}}
  mid.querySelectorAll('[data-tsort]').forEach(b=>b.onclick=()=>{const [id,d]=b.dataset.tsort.split(':'),i=tById(id);
    if(i){i.dept=d;i.movedAt=Date.now();save();tzPaint(false)}});
  mid.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tdel);if(!i)return;
    S.town.items=S.town.items.filter(x=>x.id!==i.id);save();tzPaint(false);
    toastUndo('deleted',()=>{S.town.items.push(i);save();if(TZ)tzPaint(false)})});
  mid.querySelectorAll('[data-tverd]').forEach(b=>b.onclick=()=>{const [id,v]=b.dataset.tverd.split(':'),i=tById(id);
    if(!i)return;
    const keep=()=>{const L=r.lists&&r.lists[i.dept];if(L&&!L.includes(i.id)){L.push(i.id)}save();tzPaint(false)};
    if(v==='later'){tLaterSheet(i,keep);return}        /* re-tapping lets you change the date */
    if(i.state===v)return;
    if(v==='waiting'){tWaitSheet(i,'',keep);return}
    if(v==='wife'){i.wait={who:'Wife',since:today(),checkBack:null}}
    tSet(i,v);keep()});
  const lt=mid.querySelector('#tzlater');if(lt)lt.onclick=()=>{TZLATER=!TZLATER;tzPaint(false)};
  const ad=mid.querySelector('#tzadd');
  if(ad)ad.onkeydown=e=>{if(e.key==='Enter'){const v=ad.value.trim(),id=r.depts[r.di];if(!v)return;
    const n=tAdd(v,id,'inbox');r.lists[id].push(n.id);save();tzPaint(false);
    const a2=document.getElementById('tzadd');if(a2)a2.focus()}};
  mid.querySelectorAll('[data-tsize]').forEach(b=>b.onclick=()=>{const [id,v]=b.dataset.tsize.split(':'),i=tById(id);
    if(i){i.size=+v;i.home=false;save();tzPaint(false)}});
  mid.querySelectorAll('[data-thome]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.thome);
    if(i){i.home=true;i.size=null;save();tzPaint(false)}});
  mid.querySelectorAll('[data-tdidit]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tdidit);if(!i)return;
    tSet(i,'done');tzPaint(false);toastUndo('done — nice',()=>{tSet(i,'week');if(TZ)tzPaint(false)})});
  const cp=document.getElementById('tzcopy');
  if(cp)cp.onclick=()=>tCopy(tPaperText());
}
function tPaperText(){
  const L=[],ph=weekPhrase();if(ph)L.push('THIS WEEK IS GOOD IF / '+ph,'');
  const week=S.town.items.filter(i=>i.state==='week').sort(tOrder);
  [...TOWN_SIZES,{v:null,name:'Unsized'}].forEach(s=>week.filter(i=>!i.home&&(i.size||null)===s.v).forEach(i=>
    L.push(s.name.toUpperCase()+' / '+i.title+(i.dept?' ('+tDept(i.dept).name+')':'')+(i.stakes===3?' !':''))));
  week.filter(i=>i.home).forEach(i=>L.push('AFTER WORK / '+i.title+(i.dept?' ('+tDept(i.dept).name+')':'')+(i.stakes===3?' !':'')));
  const wife=S.town.items.filter(i=>i.state==='wife');
  if(wife.length){L.push('');wife.forEach(i=>L.push('WIFE HELP / '+i.title))}
  const w=S.town.items.filter(i=>i.state==='waiting').sort(tWaitOrder);
  if(w.length){L.push('');w.forEach(i=>L.push('WAITING / '+i.title+(i.wait&&i.wait.who?' — '+i.wait.who:'')+(i.wait&&i.wait.checkBack?' · check '+tShort(i.wait.checkBack):'')))}
  const ai=S.town.items.filter(i=>i.state==='ai').length;
  if(ai)L.push('',ai+' in the AI queue');
  return L.join('\n').trim();
}

/* -- today's move --
   Spark → how much time → put things on today (the rest stays on the week) → done. It ends;
   the doing happens from the Today tab. */
function startMove(){if(!tMoveLive()){S.town.move={date:today(),step:0,mins:tDayMins()};save()}tzOpen('move')}
function tMoveEnd(msg,toToday){S.town.move=null;save();if(toToday){S.ui.personalView='town';S.ui.townView='today'}
  tzClose();if(msg)toast(msg)}
/* this week's items that fit the time — unsized ones are always offered, marked as such */
function tFits(mins){
  const t=TOWN_TIMES.find(x=>x.v===mins);if(!t||!t.fit)return {sized:[],unsized:[],home:[]};
  const week=S.town.items.filter(i=>i.state==='week').sort(tOrder);
  return {sized:week.filter(i=>!i.home&&i.size&&(i.size<=t.fit||tIsToday(i))),unsized:week.filter(i=>!i.home&&!i.size),home:week.filter(i=>i.home)};
}
function tzMove(change){
  const mv=tMoveLive();if(!mv){tzClose();return}
  const st=TMOVE[mv.step];
  const o={dots:tzDots(TMOVE.length,mv.step),step:`Today’s move · step ${mv.step+1} of ${TMOVE.length}`,name:st.name,
    note:TNOTE[st.id]||'',cta:'Next',
    back:mv.step>0?()=>{mv.step--;save();tzPaint(true)}:null,
    go:()=>{mv.step++;save();tzPaint(true)}};
  if(st.id==='spark'){
    o.mid=`<div class="hrow"><button class="hbtn" id="tzspark">Open Spark ↗</button></div>
      <div class="zkept">Opens in a new tab. Come back here when you’re done.</div>`;
    o.cta='Skip';
  }
  else if(st.id==='time'){
    o.mid=`<div class="hrow">${TOWN_TIMES.map(t=>`<button class="hbtn ${mv.mins===t.v?'on':''}" data-tmins="${t.v}">${t.name}</button>`).join('')}</div>
      ${mv.mins===0?`<div class="hout"><b>Fine, see you tomorrow.</b></div>`:''}`;
    if(mv.mins===0){o.cta='Close';o.go=()=>tMoveEnd()}
    else{o.cta=mv.mins?'Next':'Skip — show me everything';if(!mv.mins)o.go=()=>{mv.mins=120;S.town.day={date:today(),mins:120};mv.step++;save();tzPaint(true)}}
  }
  else if(st.id==='pick'){
    const t=TOWN_TIMES.find(x=>x.v===mv.mins)||TOWN_TIMES[4],f=tFits(t.v);
    const end=tWeekEnd(),onToday=S.town.items.filter(tIsToday);
    const chase=S.town.items.filter(i=>i.state==='waiting'&&((i.wait&&i.wait.checkBack&&i.wait.checkBack<=end)||i.stakes===3)).sort(tWaitOrder);
    const ai=S.town.items.filter(i=>i.state==='ai').length;
    const row=i=>{const s=tSize(i),l=i.due?dueLabel(i.due):null,k=tStake(i),on=tIsToday(i);
      return `<div class="zrow ${on?'tpicked':''}" style="--cc:${tColor(i)}"><span class="zt" data-topen="${i.id}">${esc(i.title)}</span>
        ${k&&k.v>1?`<span class="zd" style="color:${k.color}">${k.name}</span>`:''}${l?`<span class="zd ${l.c==='late'?'late':''}">${l.t}</span>`:''}
        <span class="zd dim">${tSizeLabel(i)||'unsized'}</span>
        <span class="zb"><button class="zsel ${on?'sel':''}" data-ttoday="${i.id}">${on?'✓ Today':'+ Today'}</button></span></div>`};
    const crow=i=>{const w=i.wait||{},on=tIsToday(i);
      return `<div class="zrow ${on?'tpicked':''}" style="--cc:${tColor(i)}"><span class="zt" data-topen="${i.id}">Check on: ${esc(i.title)}</span>
        <span class="zd">${esc(w.who||'')}</span>${w.checkBack?`<span class="zd ${tLate(i)?'late':''}">${dueLabel(w.checkBack).t}</span>`:''}
        <span class="zb"><button class="zsel ${on?'sel':''}" data-ttoday="${i.id}">${on?'✓ Today':'+ Today'}</button></span></div>`};
    o.name=`${t.name} — what goes on today?`;
    o.mid=`${tMeter(mv.mins,onToday)}
      ${f.sized.length?`<div class="zpick">${f.sized.map(row).join('')}</div>`:`<div class="zkept">Nothing on this week’s list fits ${t.name}.</div>`}
      ${f.unsized.length?`<div class="zcarry-h" style="margin-top:26px">Not sized — your call</div><div class="zpick">${f.unsized.map(row).join('')}</div>`:''}
      ${f.home.length?`<div class="zcarry-h" style="margin-top:26px">🏠 After work, at home — time doesn’t matter</div><div class="zpick">${f.home.map(row).join('')}</div>`:''}
      ${chase.length?`<div class="zcarry-h" style="margin-top:30px">Worth chasing this week — ${chase.length}</div><div class="zpick">${chase.map(crow).join('')}</div>`:''}
      ${ai?`<div class="zkept" style="margin-top:26px">${ai} ready in AI queue · <button class="zlink" id="tzai">open it</button></div>`:''}`;
    o.cta=onToday.length?'That’s my today':'Nothing today';
    if(!onToday.length)o.go=()=>tMoveEnd('see you tomorrow');
    o.hint='+ Today puts it on today’s plate · everything else stays on the week';
  }
  else if(st.id==='plate'){
    const L=S.town.items.filter(tIsToday).sort(tOrder);
    o.mid=`${tMeter(mv.mins,L)}<div class="zpick">${L.map(i=>`<div class="zrow tpicked" style="--cc:${tColor(i)}">
      <span class="zt">${esc(i.title)}</span>${tSizeLabel(i)?`<span class="zd">${tSizeLabel(i)}</span>`:''}</div>`).join('')}</div>`;
    o.cta='Close — go do it';o.go=()=>tMoveEnd('today is set — it’s in the Today tab',true);
  }
  const mid=tzFrame(o,change);
  const sp=mid.querySelector('#tzspark');
  if(sp)sp.onclick=()=>{window.open(SPARK_URL,'_blank');mv.step++;save();tzPaint(true)};
  mid.querySelectorAll('[data-tmins]').forEach(b=>b.onclick=()=>{mv.mins=+b.dataset.tmins;
    S.town.day={date:today(),mins:mv.mins};if(mv.mins>0)mv.step++;save();tzPaint(mv.mins>0)});
  const ai=mid.querySelector('#tzai');
  if(ai)ai.onclick=()=>{S.ui.mode='personal';S.ui.personalView='town';S.ui.townView='ai';save();tzPause()};
}

/* ===== wiring ===== */
function wire(){
  const m=S.ui.mode;
  const nt=document.getElementById('northtext');
  if(nt){autosize(nt);nt.addEventListener('input',()=>{autosize(nt);S.north=nt.value;save()})}
  app.querySelectorAll('[data-fireskip]').forEach(b=>b.onclick=()=>{
    const it=byId(b.dataset.fireskip);if(!it)return;it.ord=maxOrd()+100;save();render()});
  const comp=document.getElementById('comp');
  if(comp){autosize(comp);comp.focus();comp.addEventListener('input',()=>autosize(comp));
    comp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();const v=comp.value.trim();if(!v)return;
      const [bk,gid]=S.ui.composer.split(':');
      if(bk==='bcol'){add(v,m,null,'backlog').forEach(x=>applyBacklogCol(x,gid));save()}
      else add(v,m,gid,bk);
      render();toast('added')}})}
  app.querySelectorAll('[data-colid]>.col-head').forEach(colDrag);
  const cr=document.getElementById('colreset');if(cr)cr.onclick=()=>{delete S.ui.backlogOrder;save();render()};
  app.querySelectorAll('[data-addto]').forEach(b=>b.onclick=()=>{S.ui.composer=b.dataset.addto;save();render()});

  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{S.ui.mode=b.dataset.mode;S.ui.composer=null;save();render()});
  app.querySelectorAll('.nav [data-v]').forEach(b=>b.onclick=()=>{S.ui.composer=null;const k=b.dataset.v;
    if(m==='work')S.ui.workView=k;
    else if(k.startsWith('town:')){townNav(k.slice(5));return}
    else S.ui.personalView=k;
    save();render()});
  app.querySelectorAll('[data-tpdone]').forEach(b=>b.onclick=()=>{const i=tById(b.dataset.tpdone);if(!i)return;
    const was=i.state;tSet(i,'done');render();toastUndo('done',()=>{tSet(i,was);render()})});
  const go=document.getElementById('go');if(go)go.onclick=openTriage;
  const cd=document.getElementById('closeday');if(cd)cd.onclick=closeTheDay;
  app.querySelectorAll('.capopen').forEach(b=>b.onclick=capSheet);
  const br=document.getElementById('beginritual');if(br)br.onclick=startZen;
  const htr=document.getElementById('hometile-ritual');if(htr)htr.onclick=startZen;
  const hts=document.getElementById('hometile-spark');if(hts)hts.onclick=()=>window.open(SPARK_URL,'_blank');
  const nsp=document.getElementById('navspark');if(nsp)nsp.onclick=()=>window.open(SPARK_URL,'_blank');
  const htp=document.getElementById('hometile-phrase');
  if(htp)htp.onclick=()=>sheetPrompt('What would make this week good?','One thing. Just the one.','Play with Léo on Saturday',
    v=>{setWeekPhrase(v);render()},weekPhrase());
  app.querySelectorAll('[data-hv]').forEach(b=>b.onclick=()=>{
    if(m==='work')S.ui.workView=b.dataset.hv;else S.ui.personalView=b.dataset.hv;save();render()});
  const rd=document.getElementById('resetday');
  if(rd)rd.onclick=()=>sheetConfirm('Start a fresh day?',
    'Unticks the ritual and clears today’s deep, batch and spare picks. Your tasks are untouched.','Reset',()=>{
      DAY=today();S.ritual.workDate=DAY;S.ritual.work=[];
      S.plan.date=DAY;S.plan.work=emptyPlan();
      save();render();toast('fresh day')});

  app.querySelectorAll('[data-done]').forEach(b=>b.onclick=e=>{e.stopPropagation();finish(b.dataset.done,b)});
  app.querySelectorAll('[data-open]').forEach(el=>el.onclick=e=>{
    if(e.target.closest('.tick')||e.target.closest('.floatbar'))return;
    openDetail(el.dataset.open)});
  app.querySelectorAll('[data-open2]').forEach(b=>b.onclick=e=>{e.stopPropagation();openDetail(b.dataset.open2)});
  app.querySelectorAll('[data-later2]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const it=byId(b.dataset.later2);if(!it)return;
    setBucket(it,'backlog');clearFromPlan(it.mode,it.id);save();render();
    toastUndo('sent to backlog',()=>{setBucket(it,'board');save();render()})});
  app.querySelectorAll('[data-usedeep]').forEach(b=>b.onclick=()=>assign(m,'deep',b.dataset.usedeep));
  app.querySelectorAll('[data-todeep]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.todeep);if(i)assign(i.mode,'deep',i.id)});
  app.querySelectorAll('[data-tobatch]').forEach(b=>b.onclick=e=>{e.stopPropagation();assign(m,'batch',b.dataset.tobatch)});
  app.querySelectorAll('[data-tobuffer]').forEach(b=>b.onclick=e=>{e.stopPropagation();assign(m,'buffer',b.dataset.tobuffer)});
  app.querySelectorAll('[data-tonext]').forEach(b=>b.onclick=e=>{e.stopPropagation();assign(m,'next',b.dataset.tonext)});
  app.querySelectorAll('[data-unplan]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    clearFromPlan(m,b.dataset.unplan);save();render()});
  app.querySelectorAll('[data-bucket]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.bucket);if(!i)return;
    setBucket(i,i.bucket==='backlog'?'board':'backlog');
    if(i.bucket==='backlog')clearFromPlan(i.mode,i.id);
    save();render();toast(i.bucket==='backlog'?'moved to backlog':'on the board')});
  app.querySelectorAll('[data-fq]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.fq);if(i){i.quick=!i.quick;if(i.quick){i.star=false;i.ai=false}save();render()}});
  app.querySelectorAll('[data-fs]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.fs);if(i){i.star=!i.star;if(i.star){i.quick=false;i.ai=false}save();render()}});
  app.querySelectorAll('[data-date]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.date);if(i)openDate(i,null)});
  app.querySelectorAll('[data-del]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.del);if(!i)return;
    sheetConfirm('Delete this?',i.text,'Delete',()=>{S.items=S.items.filter(x=>x.id!==i.id);
      clearFromPlan(i.mode,i.id);save();render()})});
  app.querySelectorAll('[data-text]').forEach(el=>{
    const id=el.dataset.text;
    const start=()=>{const t=app.querySelector('.card-text[data-text="'+id+'"]')||app.querySelector('.deep-t');
      if(!t)return;const c=t.closest('.card');if(c)c.draggable=false;
      t.contentEditable='true';t.focus();
      const r=document.createRange();r.selectNodeContents(t);r.collapse(false);
      const s=getSelection();s.removeAllRanges();s.addRange(r);
      t.onblur=()=>{const i=byId(id);if(i){const v=t.textContent.trim();if(v)i.text=v;save()}render()};
      t.onkeydown=k=>{if(k.key==='Enter'){k.preventDefault();t.blur()}}};
    if(el.classList.contains('noverb'))el.onclick=start;else el.ondblclick=start});

  /* drag */
  let dragId=null,ph=null,dragH=0;
  const flip=mut=>{const els=[...app.querySelectorAll('.card,.mini')];
    const b4=new Map(els.map(e=>[e,e.getBoundingClientRect()]));mut();
    els.forEach(e=>{const b=b4.get(e),a=e.getBoundingClientRect();
      const dx=b.left-a.left,dy=b.top-a.top;
      if(dx||dy)e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],
        {duration:200,easing:'cubic-bezier(.2,.8,.3,1)'})})};
  const dropPh=()=>{if(ph&&ph.parentNode)ph.remove();ph=null};
  app.querySelectorAll('[draggable="true"]').forEach(c=>{
    c.addEventListener('dragstart',e=>{dragId=c.dataset.id;dragH=c.offsetHeight;
      document.body.classList.add('dragging');
      setTimeout(()=>c.classList.add('drag'),0);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragId)});
    c.addEventListener('dragend',()=>{c.classList.remove('drag');dropPh();
      document.body.classList.remove('dragging');
      const db=document.getElementById('dropbar');if(db)db.classList.remove('hot');
      app.querySelectorAll('.zone,.slot,.deep,.slots').forEach(z=>z.classList.remove('over'))})});
  const dbar=document.getElementById('dropbar');
  if(dbar){
    dbar.addEventListener('dragover',e=>{e.preventDefault();e.stopPropagation();dbar.classList.add('hot')});
    dbar.addEventListener('dragleave',()=>dbar.classList.remove('hot'));
    dbar.addEventListener('drop',e=>{
      e.preventDefault();e.stopPropagation();dbar.classList.remove('hot');
      document.body.classList.remove('dragging');
      const id=dragId||e.dataTransfer.getData('text/plain');const it=byId(id);if(!it)return;
      setBucket(it,'backlog');clearFromPlan(it.mode,it.id);save();render();
      toastUndo('sent to backlog',()=>{setBucket(it,'board');save();render()})});
  }

  /* plan slots */
  app.querySelectorAll('[data-slotdrop]').forEach(z=>{
    z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('over')});
    z.addEventListener('dragleave',e=>{if(!z.contains(e.relatedTarget))z.classList.remove('over')});
    z.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();z.classList.remove('over');
      const id=dragId||e.dataTransfer.getData('text/plain');dropPh();
      if(id)assign(m,z.dataset.slotdrop,id)})});

  /* columns */
  app.querySelectorAll('.zone').forEach(zone=>{
    zone.addEventListener('dragover',e=>{
      e.preventDefault();zone.classList.add('over');
      const cards=[...zone.querySelectorAll('.card:not(.drag),.mini:not(.drag)')];
      let before=null;
      for(const el of cards){const r=el.getBoundingClientRect();if(e.clientY<r.top+r.height/2){before=el;break}}
      const anchor=before||zone.querySelector('.addbtn,.composer')||null;
      if(!ph){ph=document.createElement('div');ph.className='ph';
        flip(()=>{anchor?zone.insertBefore(ph,anchor):zone.appendChild(ph)});
        requestAnimationFrame(()=>{if(ph)ph.style.height=dragH+'px'})}
      else if((before&&ph.nextElementSibling!==before)||(!before&&anchor&&ph.nextElementSibling!==anchor))
        flip(()=>{anchor?zone.insertBefore(ph,anchor):zone.appendChild(ph)});
    });
    zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('over')});
    zone.addEventListener('drop',e=>{
      e.preventDefault();zone.classList.remove('over');
      const id=dragId||e.dataTransfer.getData('text/plain');
      const item=byId(id);if(!item){dropPh();return}
      const kids=[...zone.children],phIdx=kids.indexOf(ph);
      const idx=(phIdx<0?kids.length:kids.slice(0,phIdx).filter(el=>(el.classList.contains('card')||el.classList.contains('mini'))&&el.dataset.id!==id).length);
      dropPh();
      const to=zone.dataset.drop,bcol=zone.dataset.bcol;
      if(bcol){applyBacklogCol(item,bcol);clearFromPlan(item.mode,item.id)}
      else if(to){item[GKEY[item.mode]]=to;item.sorted=true;
        if(zone.dataset.bucket)setBucket(item,zone.dataset.bucket);
        clearFromPlan(item.mode,item.id)}
      const ids=[...zone.querySelectorAll('.card,.mini')].map(el=>el.dataset.id).filter(x=>x!==id);
      ids.splice(idx,0,id);
      ids.forEach((x,k)=>{const it=byId(x);if(it)it.ord=k*100});
      item.fresh=true;save();render();
      setTimeout(()=>{S.items.forEach(x=>delete x.fresh);save()},700)})});

  app.querySelectorAll('.step').forEach(el=>el.onclick=()=>{
    const id=el.dataset.step,d=S.ritual[m]||[];
    S.ritual[m]=d.includes(id)?d.filter(x=>x!==id):[...d,id];save();render()});
  document.getElementById('exp').onclick=()=>exportBackup(false);
  const db=document.getElementById('donebtn');if(db)db.onclick=doneSheet;
  document.getElementById('imp').onclick=importBackup;
  wireTown();
}
render();
