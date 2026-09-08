"use strict";
const KEY='os_v3';
const APPVER='v11';
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
  w1:'Put the music on. Set the timer. Nothing starts until this does.',
  w2:'Everything in your head, one line each. No order, no judgement.',
  w3:'Read, act, archive. Anything over 60 seconds becomes a task.',
  w4:'Two keystrokes each. Where it lives, then this week or later.',
  w5:'Look at the calendar, then say what is genuinely left. Not the optimistic number.',
  w6:'One deep thing. Three batch. Two spare. That is the whole day.',
  w8:'Work is done. Before you close, point at one personal thing for today — so a week of work days does not quietly swallow it.',
  w7:'Copy it down. Then close this and go and do it.',
  p1:'Health, money, family, the future — one line each. Anything sitting in TickTick counts too.',
  p2:'Anything in the backlog ready to move up? Anything on the board lying to you?',
  wk:'A new week. Everything you do not choose now goes to the backlog — it is not gone, it is just not this week.',
  p4:'Plan the whole week here, not today — most weeks need zero or one deep thing.',
  p5:'Copy it down. Then close this.'
};
const RITUALS={
  work:[{id:'w1',name:'Music on, timer set'},{id:'w2',name:'Dump everything — work'},{id:'w3',name:'Clear email inbox to zero'},
    {id:'w4',name:'Sort the dump'},{id:'w5',name:'How much time is actually free?'},{id:'w6',name:'Pick today'},
    {id:'w8',name:'One personal thing, before you close'},{id:'w7',name:'Copy to paper and close this'}],
  personal:[{id:'p1',name:'Dump everything personal'},{id:'p2',name:'Check the backlog and re-sort'},
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
if(!['today','board','backlog'].includes(S.ui.workView))S.ui.workView='today';
if(!['today','board','backlog'].includes(S.ui.personalView))S.ui.personalView='today';
S.cap=Object.assign({work:12,personal:8},S.cap||{});
S.hours=S.hours||{date:null,work:null,personal:null};
S.week=S.week||{iso:null,work:false,personal:false};
/* Weekly pacing number for work — separate from S.hours.work (today's number, which
   drives the actual daily deep/batch caps). This one is just "how much runway is left
   in the week," shown alongside it and freely editable every day since the week's
   shape keeps changing. It never touches the daily budget math. */
S.workWeekHours=S.workWeekHours||{weekIso:null,hours:null};
if(S.workWeekHours.weekIso!==isoWeek())S.workWeekHours={weekIso:isoWeek(),hours:null};
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
S.personal=S.personal||{deepCap:1,batchCap:5,weekIso:null,plan:{deep:[],batch:[],buffer:[],next:[]},todayPick:null,happyPick:null};
if(S.personal.weekIso!==isoWeek()){S.personal.weekIso=isoWeek();S.personal.plan={deep:[],batch:[],buffer:[],next:[]};S.personal.happyPick=null}
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
const capOf=m=>S.cap[m]||0;
const overCap=m=>load_(m)>capOf(m);
/* A week has a shape: it starts intact and erodes. The survival rate now tapers across
   the week instead of holding flat at 60% — Monday gets the optimistic number, Friday
   gets an honest one, so the day sizes itself down instead of you finding out at 4pm
   that today was never going to happen. Sun/Sat are treated like a fresh Monday. */
const DEEP_MIN=90, BATCH_MIN=25, BUFFER_SLOTS=2;
const SURVIVAL_BY_DAY={0:.6,1:.6,2:.6,3:.55,4:.5,5:.4,6:.6};
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
/* what today can actually hold. spare and buffer are always 2 each — spare is the
   overflow, buffer is explicitly reserved for whatever shows up uninvited. Neither
   tapers with the week; buffer especially should get *more* useful as batch shrinks,
   not less. */
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
function personalPlan(){
  if(S.personal.weekIso!==isoWeek()){S.personal.weekIso=isoWeek();S.personal.plan={deep:[],batch:[],buffer:[],next:[]};S.personal.happyPick=null}
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
    const caps=personalCaps(),label=slot==='deep'?'deep':slot==='batch'?'batch':slot==='buffer'?'buffer':'spare';
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
    el.querySelector('#fix').onclick=()=>{closeSheet();if(ZEN){ZI=zSteps(m).findIndex(x=>ZKIND[x.id]==='hours');paintZen(true)}else hoursSheet()}});
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
  p.buffer.forEach(id=>L.push('BUFFER / '+byId(id).text));
  p.next.forEach(id=>L.push('SPARE / '+byId(id).text));
  if(m==='work'){
    const pp=S.personal.todayPick&&S.personal.todayPick.date===today()?byId(S.personal.todayPick.id):null;
    if(pp)L.push('PERSONAL / '+pp.text);
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
  i.done=true;i.doneAt=Date.now();clearFromPlan(i.mode,id);save();render();
  toastUndo('done',()=>{i.done=false;delete i.doneAt;save();render()});
}
function flyIn(text,src){
  const target=document.querySelector('.nav .n.target');if(!target||!src)return;
  const a=src.getBoundingClientRect(),b=target.getBoundingClientRect();
  const g=document.createElement('div');g.className='ghost';g.textContent=text.split('\n')[0].slice(0,54);
  g.style.cssText+=`left:${a.left}px;top:${a.top+22}px;max-width:${Math.min(a.width,760)}px;font-size:34px`;
  document.body.appendChild(g);
  const dx=b.left-a.left,dy=b.top-(a.top+22);
  g.animate([{transform:'translate(0,0) scale(1)',opacity:1},
    {transform:`translate(${dx*.35}px,${dy*.55}px) scale(.55)`,opacity:.85,offset:.55},
    {transform:`translate(${dx}px,${dy}px) scale(.12)`,opacity:0}],
    {duration:640,easing:'cubic-bezier(.5,0,.2,1)'}).onfinish=()=>{g.remove();
      const n=document.querySelector('.nav .n.target');if(n){n.classList.remove('pulse');void n.offsetWidth;n.classList.add('pulse')}};
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
function sheetPrompt(title,note,ph,onOk){
  sheet(`<h3>${esc(title)}</h3>${note?`<p>${esc(note)}</p>`:''}
    <input class="field" id="f" placeholder="${esc(ph||'')}" />
    <div class="sheet-acts"><button class="btn" id="no">Cancel</button><button class="btn btn-hot" id="yes">Add</button></div>`,
    el=>{const f=el.querySelector('#f');f.focus();
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
    const g=GROUPS[i.mode],w=i.star?'star':i.quick?'quick':'plain';
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
          <button class="chip ${w==='plain'?'on':''}" data-w="plain" style="color:${C.grey}"><b></b>Normal</button></div></div>
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
          <button class="chip" data-slot="buffer" style="color:var(--hot)"><b></b>Buffer</button>
          <button class="chip" data-slot="next" style="color:var(--hot)"><b></b>Spare</button></div></div>`:''}
      <div class="sheet-acts" style="margin-top:30px">
        <button class="btn btn-danger" id="ddel">Delete</button>
        <span style="flex:1"></span>
        <button class="btn btn-hot" id="dclose">Save</button></div>`;
    const ta=box.querySelector('#dt');autosize(ta);
    ta.oninput=()=>{autosize(ta);const v=ta.value.trim();if(v)i.text=v;save()};
    ta.onblur=()=>{draw()};
    box.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{i[GKEY[i.mode]]=b.dataset.cat;save();draw()});
    box.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const v=b.dataset.w;
      i.star=v==='star';i.quick=v==='quick';save();draw()});
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
  const nRaw=raw(m).length,otherN=mine(other).length,bAge=backupAge();
  const v=m==='work'?S.ui.workView:S.ui.personalView;
  const body=v==='today'?(m==='personal'?viewWeekThis():viewToday()):v==='backlog'?viewCols('backlog'):viewCols('board');
  const tabs=[['today',m==='personal'?'This week':'Today',''],['board','Board',onBoard(m).length],['backlog','Backlog',inBacklog(m).length]];
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
    <div class="dump" id="dumpbox">
      <textarea id="cap" rows="1" placeholder="Dump it. Start with a verb."></textarea>
      <div class="dump-key">⏎ keep · ⇧⏎ new line</div>
    </div>
    <div class="nav">
      ${tabs.map(([k,l,n])=>`<button class="tab ${v===k?'on':''}" data-v="${k}">${l}${n!==''?`<span class="n ${k==='board'?'target':''}">${n}</span>`:''}</button>`).join('')}
      <span class="spacer"></span>
      <button class="cap capopen ${overCap(m)?'over':load_(m)===capOf(m)?'full':''}"
        title="How much you've said yes to this week. Click to change.">
        <span class="lbl">This week</span>
        <span class="capbar"><i style="width:${Math.min(100,Math.round(load_(m)/Math.max(1,capOf(m))*100))}%"></i></span>
        <span class="num">${load_(m)} / ${capOf(m)}</span></button>
      ${nRaw?`<button class="sortbtn" id="go">Sort ${nRaw} raw · t</button>`:''}
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

/* ---- TODAY ---- */
function viewToday(){
  const m=S.ui.mode,steps=zSteps(m),done=(S.ritual[m]||[]).filter(id=>steps.some(x=>x.id===id));
  const pct=Math.round(done.length/steps.length*100),p=plan(m),caps=dayCaps(m);
  const rest=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id)).sort(byOrd);
  const dp=p.deep?byId(p.deep):null,sug=!dp&&caps.deep?suggestDeep(m):null;
  const h=S.hours[m],bud=budget(h);
  const doneToday=S.items.filter(i=>i.mode===m&&i.done&&i.doneAt&&
    new Date(i.doneAt).toISOString().slice(0,10)===today()).length;
  const weekPending=!S.week[m];
  const streak=S.streak[m];

  return `
  <div class="daybar">
    <div class="db-date">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}</div>
    <button class="db-ritual ${done.length>=steps.length?'complete':''}" id="beginritual">
      <span class="db-ring" style="--pct:${pct}"><i></i></span>
      <span class="db-rt">${done.length>=steps.length?'Ritual done'
        :done.length?'Continue the ritual':'Begin the ritual'}<em>${done.length} of ${steps.length}${weekPending?' · new week':''}</em></span>
    </button>
    <button class="db-chip ${bud&&overBudget(m)?'over':''}" id="hoursbtn">
      ${bud?`${h}h free · ${bud.real}h real`:'set today’s free time'}
      <em>${bud?`${bud.deep?'1 deep':'no deep'} + ${bud.batch} batch`:'sizes the day'}</em></button>
    <button class="db-chip capopen ${overCap(m)?'over':''}">${load_(m)} / ${capOf(m)} this week<em>board capacity</em></button>
    ${doneToday?`<div class="db-chip flat">${doneToday} done today<em>nice</em></div>`:''}
    ${(()=>{const pp=S.personal.todayPick&&S.personal.todayPick.date===today()?byId(S.personal.todayPick.id):null;
      return pp?`<div class="db-chip flat" style="border-color:var(--green,#1E8E3E)">Personal: ${esc(pp.text)}
        <em><button class="act" data-done="${pp.id}" style="padding:0;color:var(--green,#1E8E3E)">✓ mark done</button></em></div>`:'';})()}
    <div class="db-sp"></div>
    <button class="btn btn-hot" id="closeday">Copy today → paper</button>
    <button class="btn" id="resetday" title="Untick the ritual and clear today’s picks">↻</button>
  </div>

  <div class="planhead"><h2>Today</h2>
    <span>${caps.deep?'1 deep':'no deep'} · ${caps.batch} batch · ${caps.buffer} buffer · 2 spare</span></div>

  <div class="slotlabel"><b>Deep</b> — ${caps.deep?'the one thing':'no room today'}
    ${streak.count>0?`<span class="streak ${streak.hitToday?'lit':''}" title="Days in a row you finished the deep task on a day that had room for one">🔥 ${streak.count}</span>`:''}</div>
  ${dp?deepCard(dp):`<div class="deep empty" data-slotdrop="deep">
      <div class="emptynote">${caps.deep?'Nothing chosen yet. Drag one up here.':'Your day is too short for a deep block.'}</div>
      ${sug?`<div class="suggest"><span class="txt">Suggested: ${esc(sug.text)}</span>
        <button class="btn btn-hot btn-sm" data-usedeep="${sug.id}">Use this</button></div>`:''}
    </div>`}

  <div class="slotlabel">Buffer — held for whatever shows up uninvited, ${p.buffer.length} of ${caps.buffer}</div>
  <div class="slots b2" data-slotdrop="buffer">
    ${[0,1].map(k=>p.buffer[k]?slotCard(byId(p.buffer[k]),'buffer'):`<div class="slot empty buffer">held open</div>`).join('')}
  </div>

  <div class="secondary">
    <div class="slotlabel secondary-head">Also today, if it goes well</div>
    <div class="slotlabel sub">Batch — ${p.batch.length} of ${caps.batch}</div>
    <div class="slots ${caps.batch>=3?'b3':caps.batch===2?'b2':'b1'}" data-slotdrop="batch">
      ${caps.batch===0?`<div class="slot empty">no room today</div>`
        :Array.from({length:caps.batch}).map((_,k)=>p.batch[k]?slotCard(byId(p.batch[k]),'batch'):`<div class="slot empty">drop a batch task</div>`).join('')}
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
  const m='personal',steps=zSteps(m),done=(S.ritual[m]||[]).filter(id=>steps.some(x=>x.id===id));
  const pct=Math.round(done.length/steps.length*100),p=personalPlan(),caps=personalCaps();
  const rest=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id)).sort(byOrd);
  const dp=p.deep.map(byId).filter(Boolean);
  const weekPending=!S.week[m];
  const doneThisWeek=S.items.filter(i=>i.mode===m&&i.done&&i.doneAt&&isoWeek(i.doneAt)===isoWeek()).length;

  return `
  <div class="daybar">
    <div class="db-date">Week of ${new Date(isoWeek()+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'long'})}</div>
    <button class="db-ritual ${done.length>=steps.length?'complete':''}" id="beginritual">
      <span class="db-ring" style="--pct:${pct}"><i></i></span>
      <span class="db-rt">${done.length>=steps.length?'Ritual done'
        :done.length?'Continue the ritual':'Begin the ritual'}<em>${done.length} of ${steps.length}${weekPending?' · new week':''}</em></span>
    </button>
    <button class="db-chip" id="pcapsbtn">${caps.deep} deep · ${caps.batch} batch<em>weekly caps</em></button>
    <button class="db-chip capopen ${overCap(m)?'over':''}">${load_(m)} / ${capOf(m)} this week<em>board capacity</em></button>
    ${doneThisWeek?`<div class="db-chip flat">${doneThisWeek} done this week<em>nice</em></div>`:''}
    ${(()=>{const hp=S.personal.happyPick?byId(S.personal.happyPick):null;
      return hp?`<div class="db-chip flat" style="border-color:#F9AB00">💛 ${esc(hp.text)}
        <em><button class="act" data-done="${hp.id}" style="padding:0;color:#B06000">✓ mark done</button></em></div>`:'';})()}
    <div class="db-sp"></div>
    <button class="btn btn-hot" id="closeday">Copy this week → paper</button>
  </div>

  <div class="planhead"><h2>This week</h2>
    <span>${caps.deep} deep max · ${caps.batch} batch · ${caps.buffer} buffer · ${caps.next} spare</span></div>

  <div class="slotlabel"><b>Deep</b> — up to ${caps.deep} this week</div>
  <div class="slots ${caps.deep>=2?'b2':'b1'}">
    ${dp.map(deepCard).join('')}
    ${dp.length<caps.deep?`<div class="deep empty" data-slotdrop="deep">
      <div class="emptynote">Nothing chosen yet. Most weeks this stays empty — that's fine.</div></div>`:''}
  </div>

  <div class="slotlabel">Buffer — held for whatever shows up uninvited, ${p.buffer.length} of ${caps.buffer}</div>
  <div class="slots b2" data-slotdrop="buffer">
    ${[0,1].map(k=>p.buffer[k]?slotCard(byId(p.buffer[k]),'buffer'):`<div class="slot empty buffer">held open</div>`).join('')}
  </div>

  <div class="secondary">
    <div class="slotlabel secondary-head">Also this week — the quick stuff</div>
    <div class="slotlabel sub">Batch — ${p.batch.length} of ${caps.batch}</div>
    <div class="slots ${caps.batch>=3?'b3':caps.batch===2?'b2':'b1'}" data-slotdrop="batch">
      ${caps.batch===0?`<div class="slot empty">no room this week</div>`
        :Array.from({length:Math.min(caps.batch,6)}).map((_,k)=>p.batch[k]?slotCard(byId(p.batch[k]),'batch'):`<div class="slot empty">drop a batch task</div>`).join('')}
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
  return `<div class="slot ${slot==='next'?'next':''}" draggable="true" data-id="${i.id}" style="${styleFor(i)}">
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
      <button class="act" data-tobuffer="${i.id}">Buffer</button>
      <button class="act" data-tonext="${i.id}">Spare</button>
      <button class="act" data-open2="${i.id}">Edit</button>
      <button class="act" data-later2="${i.id}">⌛ Later</button></span></div>`;
}

/* ---- columns ---- */
function card(i){
  return `<div class="card ${i.fresh?'landing':''}" draggable="true" data-id="${i.id}" data-open="${i.id}" style="${styleFor(i)}">
    <span class="wash"></span>
    <svg class="strike" viewBox="0 0 200 26" preserveAspectRatio="none"><path d="M2,15 C46,9 78,20 118,13 C150,8 172,18 198,11"/></svg>
    <span class="seal">✓</span>
    ${!hasVerb(i.text)?'<span class="vdot" title="No verb yet"></span>':''}
    ${(Array.isArray(i.steps)&&i.steps.length)?`<span class="sprog"><i style="width:${Math.round(i.steps.filter(x=>x.done).length/i.steps.length*100)}%"></i></span>`:''}
    <div class="card-top"><button class="tick" data-done="${i.id}" title="Done"></button>
      <div class="card-text">${esc(i.text)}</div></div></div>`;
}
function viewCols(bucket){
  const m=S.ui.mode,defs=GROUPS[m],key=GKEY[m];
  const items=(bucket==='board'?onBoard(m):inBacklog(m));
  const note=bucket==='board'
    ?'This week. Drag to re-file or re-order. Anything you won’t touch in the next few days belongs in Backlog.'
    :'Later. Nothing here appears on Today. Review it once a week and pull what’s ready into the Board.';
  return `<div style="font-size:18px;color:var(--ink-2);margin-bottom:22px;max-width:80ch">${note}</div>
  <div class="cols">${defs.map(d=>{
    const list=items.filter(i=>i[key]===d.id&&!i.project).sort(byOrd);
    return `<div class="col zone" data-drop="${d.id}" data-bucket="${bucket}">
      <div class="col-head"><span class="dot" style="color:${d.color}"><b></b></span>
        <span class="col-name" style="color:${d.color}">${d.name}</span>
        <span class="col-n">${list.length}</span></div>
      ${list.map(card).join('')}
      ${!list.length?'<div class="col-empty">Clear.</div>':''}
      ${S.ui.composer===bucket+':'+d.id
        ?`<div class="composer"><textarea id="comp" rows="1" placeholder="What's the action?"></textarea>
            <div class="hint">⏎ add · esc close</div></div>`
        :`<button class="addbtn" data-addto="${bucket}:${d.id}">＋ Add</button>`}
    </div>`}).join('')}</div>`;
}
function drawKeys(){
  const rows=[['Anywhere',[['⇥ Tab','switch mode'],['1 / 2','work / personal'],['/','jump to dump'],['t','sort raw items']]],
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
const ZKIND={wk:'week',w1:'plain',w2:'dump',w3:'plain',w4:'sort',w5:'hours',w6:'pick',w8:'pnudge',w7:'paper',
             p1:'dump',p2:'sort',p4:'pickweek',p5:'paper'};
const WEEKSTEP={id:'wk',name:'Choose this week'};
/* Personal only needs this once a week (its whole cadence is weekly). Work runs it
   every single ritual — the week's shape changes day to day, and this is the manual
   "adjust what's in vs out" checkpoint, not an automatic recompute. If nothing's
   changed since yesterday it's a two-second skim; if something has, you fix it here,
   before Pick Today filters down to just today from whatever survives this step. */
function zSteps(m){
  const base=RITUALS[m];
  const gated=m==='personal'&&S.week.iso===isoWeek()&&S.week[m];
  if(gated)return base;
  const sortIdx=base.findIndex(s=>ZKIND[s.id]==='sort');
  const at=sortIdx>=0?sortIdx+1:0;
  return [...base.slice(0,at),WEEKSTEP,...base.slice(at)];
}
let ZEN=false,ZI=0,ZT0=0,ZTICK=null,ZJUST=[];
const zlayer=(()=>{const d=document.createElement('div');document.body.appendChild(d);return d})();

function carryOver(m){
  return onBoard(m).filter(i=>!isParked(i)&&age(i)>=1).sort((x,y)=>(y.created||0)-(x.created||0));
}
function buildZenShell(){
  zlayer.innerHTML=`<div id="zen">
    <div class="zbar">
      <div class="zdots" id="zdots"></div>
      <div class="zclock" id="zclock">00:00</div>
      <button class="zexit" id="zexit">Esc</button>
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
  document.getElementById('zexit').onclick=endZen;
}
function startZen(){
  ZEN=true;ZT0=Date.now();document.body.style.overflow='hidden';
  const steps=RITUALS[S.ui.mode],done=S.ritual[S.ui.mode]||[];
  const first=steps.findIndex(x=>!done.includes(x.id));ZI=first<0?0:first;
  buildZenShell();
  ZTICK=setInterval(()=>{const el=document.getElementById('zclock');
    if(el){const s=Math.floor((Date.now()-ZT0)/1000);
      el.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}},1000);
  paintZen(true);
}
function endZen(){ZEN=false;clearInterval(ZTICK);zlayer.innerHTML='';document.body.style.overflow='';render()}
function zenNext(){
  const m=S.ui.mode,steps=zSteps(m),st=steps[ZI];
  if(st&&st.id==='wk'){S.week.iso=isoWeek();S.week[m]=true}
  if(st&&!(S.ritual[m]||[]).includes(st.id))S.ritual[m]=[...(S.ritual[m]||[]),st.id];
  save();
  if(ZI>=steps.length-1){endZen();closeTheDay();return}
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

function zPlanStrip(m,extra){
  const p=plan(m);
  const cell=(lbl,id)=>{const it=id&&byId(id);return it
    ?`<div class="zp" style="${styleFor(it)}"><b>${lbl}</b><span>${esc(it.text)}</span>
       <button class="zpdone" data-zdone="${it.id}" title="Already done">✓</button>
       <button class="zx" data-zdrop="${it.id}" title="Take it off">×</button></div>`:'';};
  const deepCells=m==='personal'?p.deep.map(id=>cell('Deep',id)):[cell('Deep',p.deep)];
  const cells=[...deepCells,...p.batch.map(id=>cell('Batch',id)),...p.buffer.map(id=>cell('Buffer',id)),...p.next.map(id=>cell('Spare',id))].join('')+(extra||'');
  return cells?`<div class="zplan">${cells}</div>`:'';
}

/* Repaints the current step. isStepChange=true rebuilds progress dots and plays the
   step-transition fade; false just refreshes the middle content in place (assign /
   remove / done / backlog / hours pick) — this is what stops those interactions from
   blinking, since #zen itself is never destroyed and rebuilt anymore. */
function paintZen(isStepChange){
  const m=S.ui.mode,steps=zSteps(m),st=steps[ZI],kind=ZKIND[st.id]||'plain';
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
  else if(kind==='week'){
    const cap=capOf(m),now=load_(m);
    if(m==='work'){
      dispName=`${st.name} — adjust as needed`;
      dispNote=`If nothing's changed since yesterday, skim and move on. If it has, shift things in or out, snooze, or clear them here — before Pick Today filters down to just today.`;
    }
    const pool=filed(m).filter(i=>!isParked(i))
      .sort((x,y)=>{
        const gx=x.bucket==='backlog'?(x.snoozeUntil&&x.snoozeUntil>today()?2:1):0;
        const gy=y.bucket==='backlog'?(y.snoozeUntil&&y.snoozeUntil>today()?2:1):0;
        if(gx!==gy)return gx-gy;
        const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;return (x.created||0)-(y.created||0)});
    mid=`<div class="zkept ${now>cap?'warn':''}">${now} chosen for this week · your cap is ${cap}${now>cap?' · over':''}</div>
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
            <button class="zsel ${on?'sel':''}" data-zw="board" data-zid="${i.id}">This week</button>
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
    const wkOpts=[10,15,20,25,30,40];
    const wh=S.workWeekHours.hours;
    mid=`<div class="hrow">${opts.map(v=>`<button class="hbtn ${h===v?'on':''}" data-h="${v}">${v}h</button>`).join('')}</div>
      ${b?`<div class="hout"><b>${b.real}h</b> of that survives the day — meetings run over, things arrive.
        <span>That buys <b>${b.deep?'1 deep block':'no deep block'}</b>${b.batch?` and <b>${b.batch} batch</b>`:''}.</span></div>`
      :`<div class="zkept">Pick a number. Be pessimistic.</div>`}
      <div class="seg-label" style="margin:26px 0 10px">This week — runway, not a hard cap</div>
      <div class="hrow">${wkOpts.map(v=>`<button class="hbtn ${wh===v?'on':''}" data-wh="${v}">${v}h</button>`).join('')}</div>
      ${wh?`<div class="hout">Roughly <b>${wh}h</b> left in the week. Reset it any day the week shifts — it's context for pacing, it doesn't touch today's caps above.</div>`:`<div class="zkept">Optional — a rough number for how the week's tracking, separate from today.</div>`}`;
    cta=h?'That is my day':'Skip for now';
    if(h&&b&&b.deep===0)mid+=`<div class="zkept warn" style="margin-top:20px">No deep block today — ${b.real}h of real time cannot hold 90 uninterrupted minutes.</div>`;
  }
  else if(kind==='pick'){
    const p=plan(m),b=budget(S.hours[m]);
    const cands=onBoard(m).filter(i=>!isParked(i)&&!inPlan(m,i.id))
      .sort((x,y)=>{const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;if(!!y.star!==!!x.star)return y.star?1:-1;return (x.ord||0)-(y.ord||0)}).slice(0,14);
    const caps=dayCaps(m);
    const full={deep:caps.deep===0||!!p.deep,batch:caps.batch===0||p.batch.length>=caps.batch,next:p.next.length>=caps.next,buffer:p.buffer.length>=caps.buffer};
    const deepWord=caps.deep?'1 deep':'0 deep';
    dispName=`${st.name} — ${deepWord}, ${caps.batch} batch, ${caps.buffer} buffer, ${caps.next} spare`;
    dispNote=`${caps.deep?'One deep thing.':'No deep block today.'} ${caps.batch} batch. ${caps.buffer} held back for whatever shows up uninvited. ${caps.next} spare.`;
    mid=`${zPlanStrip(m)}
      ${b?`<div class="zkept ${overBudget(m)?'warn':''}">${b.real}h of real time · fits <b>${b.deep?'1 deep':'0 deep'}</b>${b.batch?` + ${b.batch} batch`:''} · picked ${(p.deep?1:0)+p.batch.length}${b.deep===0?' · a deep block needs 90 min you do not have':''}</div>`
        :`<div class="zkept">No time set — <button class="zlink" id="zsethours">say how much is free</button> and this will size itself.</div>`}
      ${cands.length?`<div class="zpick">${cands.map(i=>`<div class="zrow" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>
          ${i.due?`<span class="zd ${dueLabel(i.due).c==='late'?'late':''}">${dueLabel(i.due).t}</span>`:''}
          <span class="zb">
            <button class="zsel" data-zs="deep" data-zid="${i.id}" ${full.deep?'disabled':''}>Deep</button>
            <button class="zsel" data-zs="batch" data-zid="${i.id}" ${full.batch?'disabled':''}>Batch</button>
            <button class="zsel" data-zs="buffer" data-zid="${i.id}" ${full.buffer?'disabled':''}>Buffer</button>
            <button class="zsel" data-zs="next" data-zid="${i.id}" ${full.next?'disabled':''}>Spare</button>
            <button class="zsel icon" data-zsnooze="${i.id}" title="Snooze — push to a later date">⌛</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
          </span></div>`).join('')}</div>`
        :`<div class="zkept">Nothing on the board to pick from.</div>`}`;
    cta=(p.deep||p.batch.length)?'That is today':'Skip for now';
  }
  else if(kind==='pickweek'){
    const p=personalPlan(),caps=personalCaps();
    const cands=onBoard('personal').filter(i=>!isParked(i)&&!inPlan('personal',i.id))
      .sort((x,y)=>{if(!!y.quick!==!!x.quick)return y.quick?1:-1;
        const dx=x.due?daysTo(x.due):999,dy=y.due?daysTo(y.due):999;
        if(dx!==dy)return dx-dy;return (x.ord||0)-(y.ord||0)}).slice(0,16);
    const full={deep:p.deep.length>=caps.deep,batch:p.batch.length>=caps.batch,buffer:p.buffer.length>=caps.buffer,next:p.next.length>=caps.next};
    dispName=`${st.name} — ${caps.deep} deep max, ${caps.batch} batch, ${caps.buffer} buffer, ${caps.next} spare`;
    dispNote=`Plan the whole week here, not today. Most weeks need zero or one deep thing — batch is for the quick stuff: scheduling, checking, registering, printing.`;
    const picked=p.deep.length+p.batch.length+p.buffer.length+p.next.length;
    const chosen=[...p.deep,...p.batch,...p.buffer,...p.next].map(byId).filter(Boolean);
    mid=`${zPlanStrip('personal')}
      <div class="zkept">picked ${picked} for the week · <button class="zlink" id="zpcaps">change weekly caps</button></div>
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
            <button class="zsel" data-zs="buffer" data-zid="${i.id}" ${full.buffer?'disabled':''}>Buffer</button>
            <button class="zsel" data-zs="next" data-zid="${i.id}" ${full.next?'disabled':''}>Spare</button>
            <button class="zsel icon" data-zsnooze="${i.id}" title="Snooze — push to a later date">⌛</button>
            <button class="zsel icon" data-zdone="${i.id}" title="Already done">✓</button>
          </span></div>`).join('')}</div>`
        :`<div class="zkept">Nothing on the board to pick from.</div>`}`;
    cta=picked?'That is my week':'Skip for now';
  }
  else if(kind==='pnudge'){
    const p=personalPlan();
    /* Deep is excluded on purpose — it needs a real block, not a squeeze at the end of
       a work day. This step is for the thing genuinely small enough to still fit today. */
    const chosen=[...p.batch,...p.buffer,...p.next].map(byId).filter(Boolean)
      .sort((a,b)=>(!!b.quick)-(!!a.quick));
    const pool=chosen.length?chosen:onBoard('personal').filter(i=>!isParked(i)&&!inPlan('personal',i.id))
      .sort((a,b)=>(!!b.quick)-(!!a.quick));
    const list=pool.slice(0,6);
    const current=S.personal.todayPick&&S.personal.todayPick.date===today()?byId(S.personal.todayPick.id):null;
    mid=`${current?`<div class="zkept">Today's personal pick: <b>${esc(current.text)}</b></div>`:''}
      ${p.deep.length?`<div class="zkept">Not offering this week's deep pick here — that needs its own block, not the end of a work day.</div>`:''}
      ${list.length?`<div class="zpick">${list.map(i=>`<div class="zrow" style="--cc:${cardColor(i)}">
          <span class="zt">${esc(i.text)}</span>
          ${i.quick?`<span class="zd">⚡ quick</span>`:''}
          <span class="zb"><button class="zsel ${current&&current.id===i.id?'sel':''}" data-ppick="${i.id}">Pick this</button></span>
        </div>`).join('')}</div>`
        :`<div class="zkept">Nothing small enough on the board yet — add something next time you dump.</div>`}`;
    cta=current?'Keep this and close':'Skip for today';
  }
  else if(kind==='paper'){
    let ppCell='';
    if(m==='work'){
      const pp=S.personal.todayPick&&S.personal.todayPick.date===today()?byId(S.personal.todayPick.id):null;
      if(pp)ppCell=`<div class="zp" style="${styleFor(pp)}"><b>Personal</b><span>${esc(pp.text)}</span>
        <button class="zpdone" data-zdone="${pp.id}" title="Already done">✓</button></div>`;
    }
    mid=zPlanStrip(m,ppCell)||`<div class="zkept">Nothing picked yet.</div>`;
    cta='Copy to paper';
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
    :kind==='pnudge'?'pick one thing, or skip — it is just for today'
    :'⏎ or space for the next step';

  const zb=document.getElementById('zback');if(zb)zb.onclick=zenBack;
  zmidEl.querySelectorAll('[data-h]').forEach(b2=>b2.onclick=()=>{S.hours[m]=+b2.dataset.h;S.hours.date=today();save();paintZen(false)});
  zmidEl.querySelectorAll('[data-wh]').forEach(b2=>b2.onclick=()=>{S.workWeekHours={weekIso:isoWeek(),hours:+b2.dataset.wh};save();paintZen(false)});
  zmidEl.querySelectorAll('[data-zs]').forEach(b2=>b2.onclick=()=>{
    if(b2.disabled)return;zenAssign(b2.dataset.zs,b2.dataset.zid)});
  const zsh=zmidEl.querySelector('#zsethours');
  if(zsh)zsh.onclick=()=>{ZI=zSteps(m).findIndex(x=>ZKIND[x.id]==='hours');paintZen(true)};
  const zpc=zmidEl.querySelector('#zpcaps');
  if(zpc)zpc.onclick=()=>personalCapSheet();
  zmidEl.querySelectorAll('[data-ppick]').forEach(b2=>b2.onclick=()=>{
    S.personal.todayPick={date:today(),id:b2.dataset.ppick};save();paintZen(false)});
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
    save();paintZen(false)});

  document.getElementById('zgo').onclick=()=>{
    if(kind==='sort'&&nRaw){openTriage();return}   /* stays inside the ritual */
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
let TQ=[],TI=0,TOPEN=false,TSTEP=1,TCAT=null,TCARD='';
function openTriage(){TQ=raw(S.ui.mode).map(i=>i.id);TI=0;TSTEP=1;TCAT=null;TCARD='';if(!TQ.length)return;
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
function drawTriage(){
  if(TI>=TQ.length){closeTriage();toast('inbox clear');return}
  const i=S.items.find(x=>x.id===TQ[TI]);if(!i){TI++;return drawTriage()}
  const tin=document.getElementById('tin');if(!tin)return;
  const html=TSTEP===1?step1Html(i):step2Html(i);
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
  if(pr)pr.textContent=`Sorting ${TI+1} of ${TQ.length} · step ${TSTEP} of 2`;
  const tb=document.getElementById('tbody');
  if(TSTEP===1)tb.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>pickCat(b.dataset.sort));
  else{
    tb.querySelectorAll('[data-put]').forEach(b=>b.onclick=()=>commitIt(i,b.dataset.put));
    tb.querySelector('[data-back]').onclick=()=>{TSTEP=1;TCAT=null;drawTriage()};
  }
  const sk=tb.querySelector('[data-skip]');
  if(sk)sk.onclick=()=>{TI++;TSTEP=1;TCAT=null;drawTriage()};
}
function pickCat(v){TCAT=v;TSTEP=2;drawTriage()}
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
  if(S.personal.todayPick&&S.personal.todayPick.date!==DAY)S.personal.todayPick=null;
  const moved=migrateStaleBacklog();
  save();render();toast('new day — ritual reset');
  if(moved)toast(moved+' backlog item'+(moved===1?'':'s')+' moved to Wishes');
}
setInterval(checkDay,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkDay()});

document.addEventListener('keydown',e=>{
  if(ZEN&&!mlayer.innerHTML&&!layer.innerHTML){
    if(e.key==='Escape'){endZen();return}
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
    if(e.key==='ArrowLeft'){e.preventDefault();TSTEP=1;TCAT=null;drawTriage();return}
    if(typing)return;
    const map={'1':'star','2':'quick','3':'plain','4':'later'};
    if(map[e.key]){e.preventDefault();commitIt(i,map[e.key])}
    return;
  }
  const t=e.target;
  if(e.key==='Escape'&&S.ui.composer){S.ui.composer=null;save();render();return}
  if(e.key==='Tab'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){
    e.preventDefault();S.ui.mode=S.ui.mode==='work'?'personal':'work';S.ui.composer=null;save();render();return}
  if(t.tagName==='TEXTAREA'||t.tagName==='INPUT'||t.isContentEditable)return;
  if(e.key==='1'){S.ui.mode='work';save();render()}
  if(e.key==='2'){S.ui.mode='personal';save();render()}
  if(e.key==='/'){e.preventDefault();const c=document.getElementById('cap');if(c)c.focus()}
  if(e.key==='t'&&raw(S.ui.mode).length)openTriage();
});

/* ===== wiring ===== */
function wire(){
  const m=S.ui.mode;
  const cap=document.getElementById('cap');
  if(cap){autosize(cap);cap.addEventListener('input',()=>autosize(cap));
    cap.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();const v=cap.value.trim();if(!v)return;
      const made=add(v,m);flyIn(v,document.getElementById('dumpbox'));
      document.getElementById('dumpbox').classList.add('flash');cap.value='';autosize(cap);
      setTimeout(()=>{render();const c=document.getElementById('cap');if(c)c.focus()},280);
      toast(made.length>1?made.length+' kept':'kept')}})}
  const comp=document.getElementById('comp');
  if(comp){autosize(comp);comp.focus();comp.addEventListener('input',()=>autosize(comp));
    comp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();const v=comp.value.trim();if(!v)return;
      const [bk,gid]=S.ui.composer.split(':');add(v,m,gid,bk);render();toast('added')}})}
  app.querySelectorAll('[data-addto]').forEach(b=>b.onclick=()=>{S.ui.composer=b.dataset.addto;save();render()});

  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{S.ui.mode=b.dataset.mode;S.ui.composer=null;save();render()});
  app.querySelectorAll('.nav [data-v]').forEach(b=>b.onclick=()=>{S.ui.composer=null;
    if(m==='work')S.ui.workView=b.dataset.v;else S.ui.personalView=b.dataset.v;save();render()});
  const go=document.getElementById('go');if(go)go.onclick=openTriage;
  const cd=document.getElementById('closeday');if(cd)cd.onclick=closeTheDay;
  app.querySelectorAll('.capopen').forEach(b=>b.onclick=capSheet);
  const hb=document.getElementById('hoursbtn');if(hb)hb.onclick=hoursSheet;
  const br=document.getElementById('beginritual');if(br)br.onclick=startZen;
  const pcb=document.getElementById('pcapsbtn');if(pcb)pcb.onclick=personalCapSheet;
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
    const i=byId(b.dataset.fq);if(i){i.quick=!i.quick;if(i.quick)i.star=false;save();render()}});
  app.querySelectorAll('[data-fs]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const i=byId(b.dataset.fs);if(i){i.star=!i.star;if(i.star)i.quick=false;save();render()}});
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
      const to=zone.dataset.drop;
      if(to){item[GKEY[item.mode]]=to;item.sorted=true;
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
}
render();
