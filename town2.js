/* ======================================================================
   Town 2 — the new Personal tab: Town Hall (hero) · Town Map (folding bands) · Waiting · rituals.
   Built on top of app_1.js, which stays the engine: storage (os_v3), sync, backups, migrations.
   This file reads and writes the same S.town data through app_1's own helpers (tAdd, tSet,
   tCycPlant, weekPhrase/setWeekPhrase, save → sync) and draws inside its own shadow root, so
   neither stylesheet can touch the other. Its own screen state lives in S.ui._t2 (S.ui never syncs).
   Escape hatch: add ?classic=1 to the address to get the original Personal tab back.
   ====================================================================== */
window.__T2REAL=()=>S;
(function(){
if(/[?&]classic\b/.test(location.search))return;
const REAL=()=>window.__T2REAL();
const T2VER='town2 · r5';
(()=>{const lk=document.createElement('link');lk.rel='stylesheet';
  lk.href='https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(lk)})();
const host=document.createElement('div');host.id='town2';host.style.cssText='position:fixed;inset:0;z-index:100;display:none';
document.body.appendChild(host);
const ROOT=host.attachShadow({mode:'open'});
ROOT.innerHTML=`<style>
.t2app{
  --serif:'Fraunces',Georgia,serif;--sans:'IBM Plex Sans',-apple-system,'Segoe UI',sans-serif;--mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
  --bg:#F6FAF7;--surface:#FFFFFF;--sunken:#F1F6F2;--line:#DFE8E2;--line-soft:#ECF2EE;
  --ink:var(--dark);--ink-2:#4D5360;--ink-3:#8A909C;
  --hot:#0EA672;--hot-ink:#07805A;--hot-soft:#E3F6ED;--hot-line:#A8E2C9;
  --late:#D93025;--late-soft:#FDECEA;--stuck:#B65C00;--stuck-soft:#FFF3E0;--sort:#2F62D9;--sort-soft:#EAF0FE;--quiet:#7A808C;
  --shadow:0 1px 2px rgba(20,22,27,.05),0 10px 24px -16px rgba(20,22,27,.28);
  --shadow-2:0 2px 6px rgba(20,22,27,.05),0 28px 60px -24px rgba(20,22,27,.30);
}
*{box-sizing:border-box;margin:0;padding:0}

.t2app{background:var(--bg);color:var(--ink);font:16px/1.5 var(--sans);display:flex;flex-direction:column;overflow:hidden}
button{font:inherit;color:inherit;background:none;border:none;cursor:pointer}
input,textarea,select{font:inherit;color:inherit}
.mono{font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase;font-size:12px;font-weight:600}
.serif{font-family:var(--serif)}
.note{font-size:14px;color:var(--ink-3)}
.link{font:500 13px var(--sans);color:var(--ink-3);text-decoration:underline;text-underline-offset:3px}
.link:hover{color:var(--ink)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--c);flex:none}
.btn{display:inline-flex;align-items:center;gap:8px;font:600 14px var(--sans);padding:10px 16px;border-radius:12px;background:var(--surface);border:1px solid var(--line);transition:.15s;white-space:nowrap}
.btn:hover{border-color:var(--hot-line)}
.btn.hot{background:var(--hot);color:#fff;border-color:var(--hot)}
.btn.hot:hover{filter:brightness(1.05)}
.btn.sm{padding:7px 12px;font-size:13px;border-radius:10px}
.btn.ghost{background:transparent}
.grow{flex:1}
.st{font:600 13px var(--sans);color:var(--sc)}
.st-late{--sc:var(--late)}.st-stuck{--sc:var(--stuck)}.st-sort{--sc:var(--sort)}.st-quiet{--sc:var(--quiet)}.st-ok{--sc:var(--hot-ink)}.st-empty{--sc:var(--ink-3)}
.sdot{width:10px;height:10px;border-radius:50%;background:var(--sc);flex:none;display:inline-block}

/* ---------- top ---------- */
.top{display:flex;align-items:center;gap:14px;padding:18px 32px 0}
.t2app::before{content:'';position:fixed;left:0;right:0;top:0;height:4px;background:var(--hot);z-index:5}
.brand{font:500 30px var(--serif);letter-spacing:-.02em;margin-right:6px}
.seg{display:flex;gap:2px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:4px}
.seg button{font:600 12px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);padding:8px 14px;border-radius:999px}
.seg button.on{background:var(--ink);color:#fff}
.seg kbd{font:inherit;opacity:.5;margin-right:6px}
.nav{display:flex;align-items:center;gap:6px;padding:14px 32px 14px;border-bottom:1px solid var(--line)}
.tab{font:500 15px var(--sans);color:var(--ink-2);padding:8px 14px;border-radius:10px;display:inline-flex;align-items:center;gap:8px}
.tab:hover{background:var(--sunken)}
.tab.on{background:var(--ink);color:#fff}
.tab .n{font:600 12px var(--mono);color:var(--ink-3);background:var(--sunken);border-radius:7px;padding:1px 7px}
.tab.on .n{background:rgba(255,255,255,.15);color:#fff}
.tab .n.red{background:var(--late-soft);color:var(--late)}
.navsep{width:1px;height:22px;background:var(--line);margin:0 8px}
.navlabel{font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin-right:2px}
.cap{margin-left:auto;display:flex;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:0 12px;width:380px}
.cap:focus-within{border-color:var(--hot)}
.cap input{flex:1;border:none;outline:none;background:none;padding:9px 4px;font-size:14.5px}
.cap span{font:500 11px var(--mono);color:var(--ink-3)}
#stage{flex:1;overflow:auto;min-height:0}
.page{padding:30px 32px 60px}

/* ---------- shared rows ---------- */
.it{display:flex;align-items:baseline;gap:10px;width:100%;text-align:left;padding:9px 12px;border-radius:10px;transition:background .12s}
.it:hover{background:var(--sunken)}
.it .t{flex:1;font-size:15.5px;line-height:1.35}
.it .m{font-size:13px;color:var(--ink-3);white-space:nowrap}
.it .m.red{color:var(--late);font-weight:600}.it .m.amber{color:var(--stuck);font-weight:600}
.it .dot{width:8px;height:8px;transform:translateY(-1px)}
.it.done .t{text-decoration:line-through;color:var(--ink-3)}
.bk{margin-bottom:18px}
.bk-h{display:flex;align-items:baseline;gap:8px;padding:0 12px 4px}
.bk-h .l{font:600 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.bk-h .c{font:500 12px var(--mono);color:var(--ink-3)}
.bk-h .h{font-size:13px;color:var(--ink-3);margin-left:auto}
.bk.now .bk-h .l{color:var(--hot-ink)}
.bk-e{font-size:14px;color:var(--ink-3);padding:4px 12px}
.addin{width:100%;border:1px dashed var(--line);border-radius:10px;padding:9px 12px;outline:none;background:transparent;font-size:14.5px}
.addin:focus{border-style:solid;border-color:var(--hot);background:#fff}
.more{font:500 13px var(--sans);color:var(--ink-3);padding:4px 12px}
.more:hover{color:var(--ink)}

/* ---------- 1 · BRIEFING hall ---------- */
.brief{display:grid;grid-template-columns:minmax(0,820px) 300px;gap:56px;justify-content:center}
.brief .date{color:var(--ink-3)}
.brief .phr{font:italic 300 22px var(--serif);color:var(--ink-2);margin:6px 0 30px}
.brief .phr b{font-weight:400;color:var(--ink)}
.brief h1{font:400 44px/1.1 var(--serif);letter-spacing:-.02em;margin-bottom:6px}
.brief h2{font:400 28px/1.2 var(--serif);letter-spacing:-.01em;margin:44px 0 12px}
.plist{counter-reset:p;margin-top:16px}
.prow{display:grid;grid-template-columns:40px 1fr auto;gap:14px;align-items:baseline;padding:12px 6px;border-bottom:1px solid var(--line-soft);cursor:pointer}
.prow:hover{background:#fff}
.prow .k{font:400 22px var(--serif);color:var(--ink-3)}
.prow .t{font-size:18px;font-weight:500}
.prow .a{font-size:13px;color:var(--ink-3);margin-top:1px;display:flex;align-items:center;gap:6px}
.prow .m{font-size:13.5px;color:var(--ink-3);white-space:nowrap}
.prow .m.red{color:var(--late);font-weight:600}
.prow.today .k{color:var(--hot)}
.att{display:flex;gap:12px;align-items:baseline;padding:10px 6px;border-bottom:1px solid var(--line-soft);cursor:pointer;font-size:16px}
.att:hover{background:#fff}
.att .w{font:600 11.5px var(--mono);letter-spacing:.07em;text-transform:uppercase;width:86px;flex:none;color:var(--sc)}
.att .t{flex:1}
.att .why{color:var(--ink-3);font-size:14px}
.areas-t .ar{display:grid;grid-template-columns:200px 170px 1fr 20px;gap:14px;align-items:baseline;padding:13px 6px;border-bottom:1px solid var(--line-soft);cursor:pointer}
.areas-t .ar:hover{background:#fff}
.areas-t .ar .n{display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px}
.areas-t .ar .ctx{font-size:14px;color:var(--ink-3)}
.areas-t .ar .go{color:var(--ink-3)}
.side{position:sticky;top:0;align-self:start;display:flex;flex-direction:column;gap:10px;padding-top:4px}
.side .mono{color:var(--ink-3);margin:8px 0 2px}
.ibox{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:13px 16px;text-align:left;width:100%}
.ibox:hover{border-color:var(--hot-line);box-shadow:var(--shadow)}
.ibox .l{flex:1}
.ibox .l b{display:block;font-size:15px;font-weight:600}
.ibox .l span{font-size:13px;color:var(--ink-3)}
.ibox .l span.red{color:var(--late)}
.ibox .n{font:400 28px var(--serif)}
.ibox.zero{opacity:.55}
.rbtn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:var(--ink);color:#fff;border-radius:16px;padding:16px 18px;text-align:left;width:100%}
.rbtn b{font:400 22px var(--serif)}
.rbtn span{font-size:13px;opacity:.7}
.rbtn.alt{background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.rbtn.alt span{opacity:1;color:var(--ink-3)}

/* ---------- 2 · CONTROL ROOM hall ---------- */
.ctrl{display:grid;grid-template-columns:minmax(380px,.9fr) 1.4fr;gap:22px;max-width:1500px;margin:0 auto}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:22px 22px;box-shadow:var(--shadow)}
.panel h3{font:400 26px var(--serif);display:flex;align-items:baseline;gap:10px}
.panel h3 .c{font:500 14px var(--mono);color:var(--ink-3)}
.panel h3 .r{margin-left:auto}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px;max-width:1500px;margin-left:auto;margin-right:auto}
.metric{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px 18px;text-align:left}
.metric:hover{border-color:var(--hot-line);box-shadow:var(--shadow)}
.metric .l{font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.metric .n{font:400 40px/1.1 var(--serif);margin-top:2px}
.metric .s{font-size:13px;color:var(--ink-3)}
.metric .s.red{color:var(--late)}
.chips-att{display:flex;flex-wrap:wrap;gap:8px;margin:0 auto 22px;max-width:1500px}
.catt{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 14px 7px 12px;font-size:14px}
.catt:hover{border-color:var(--sc)}
.catt .w{font:600 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--sc)}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
.tile{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 16px 14px;text-align:left;display:flex;flex-direction:column;gap:8px;min-height:150px}
.tile:hover{border-color:var(--hot-line);box-shadow:var(--shadow)}
.tile .n{display:flex;align-items:center;gap:9px;font:500 20px var(--serif)}
.tile .s{display:flex;align-items:center;gap:7px}
.tile .ctx{font-size:13px;color:var(--ink-3);margin-top:auto}
.bar{display:flex;height:8px;border-radius:8px;overflow:hidden;background:var(--line-soft);gap:2px}
.bar i{display:block;height:100%}
.b-now{background:var(--hot)}.b-delegated{background:#9C8CF0}.b-queue{background:#8FB2F5}.b-later{background:#D9DDE3}.b-unscheduled{background:#E7E9ED}.b-notprio{background:#F0F1F3}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:var(--ink-3);margin-top:12px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}

/* ---------- 3 · FOCUS hall ---------- */
.focus{max-width:1180px;margin:0 auto}
.pulse-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:30px}
.pchip{display:inline-flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 14px 8px 10px}
.pchip:hover{border-color:var(--hot-line)}
.pchip .ring{width:14px;height:14px;border-radius:50%;border:3px solid var(--sc);background:#fff}
.pchip .ring.full{background:var(--sc)}
.pchip b{font-weight:600;font-size:14.5px}
.pchip span{font-size:13px;color:var(--sc)}
.hero{background:var(--surface);border:1px solid var(--line);border-radius:28px;padding:34px 40px;box-shadow:var(--shadow-2);display:grid;grid-template-columns:1fr 340px;gap:40px}
.hero .eyebrow{color:var(--hot-ink)}
.hero .one{font:400 50px/1.1 var(--serif);letter-spacing:-.025em;margin:12px 0 10px;cursor:pointer}
.hero .why{font-size:16px;color:var(--ink-2);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.hero .why .red{color:var(--late);font-weight:600}
.hero .then{margin-top:28px;border-top:1px solid var(--line-soft);padding-top:16px}
.hero .then .mono{color:var(--ink-3);display:block;margin-bottom:6px}
.hero aside{border-left:1px solid var(--line-soft);padding-left:32px}
.hero aside h4{font:400 22px var(--serif);margin-bottom:8px}
.hero aside .att{font-size:14.5px;padding:9px 0}
.hero aside .att .w{width:92px}
.lowrow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}

/* ---------- MAP: 1 · ATLAS ---------- */
.atlas{display:grid;grid-template-columns:310px 1fr;height:100%}
.atlas .rail{border-right:1px solid var(--line);overflow:auto;padding:22px 14px 30px;background:#FBFDFB}
.atlas .rail .mono{color:var(--ink-3);padding:0 12px 8px;display:flex;justify-content:space-between}
.arow{display:block;width:100%;text-align:left;padding:12px 12px;border-radius:14px;margin-bottom:2px;border:1px solid transparent}
.arow:hover{background:#fff;border-color:var(--line-soft)}
.arow.on{background:#fff;border-color:var(--line);box-shadow:var(--shadow)}
.arow .n{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15.5px}
.arow .n .st{margin-left:auto;font-size:12.5px}
.arow .cnt{font-size:12.5px;color:var(--ink-3);margin:3px 0 0 19px}
.atlas .main{overflow:auto;padding:30px 44px 60px}
.ahead{display:flex;align-items:center;gap:14px;margin-bottom:6px}
.ahead h2{font:400 46px/1.1 var(--serif);letter-spacing:-.02em}
.ahead .nav2{margin-left:auto;display:flex;gap:6px}
.ahint{font-size:15px;color:var(--ink-3);margin-bottom:26px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.agrid{display:grid;grid-template-columns:1fr 1fr 360px;gap:28px;align-items:start}
.acol{min-width:0}
.ref{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;min-height:120px;resize:vertical;outline:none;font-size:14.5px;line-height:1.5;background:#fff}
.ref:focus{border-color:var(--hot)}
.cyc{display:flex;gap:10px;align-items:baseline;padding:8px 12px;font-size:14.5px;border-radius:10px}
.cyc .t{flex:1}.cyc .m{font-size:13px;color:var(--ink-3)}.cyc .m.red{color:var(--late)}
.box{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 10px 10px;margin-bottom:16px}

/* ---------- MAP: 2 · LEDGER ---------- */
.ledger{max-width:1500px;margin:0 auto}
.ledger table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:var(--shadow)}
.ledger th{font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);text-align:left;padding:16px 14px 12px;border-bottom:1px solid var(--line);background:#FBFDFB;position:sticky;top:0}
.ledger th small{display:block;font:400 12px var(--sans);letter-spacing:0;text-transform:none;color:var(--ink-3);margin-top:2px}
.ledger td{padding:14px 14px;border-bottom:1px solid var(--line-soft);vertical-align:top}
.ledger tr.arow2{cursor:pointer}
.ledger tr.arow2:hover td{background:#FBFDFB}
.ledger tr.arow2.open td{background:#F7FBF8}
.ledger .an{display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px}
.ledger .an .chev{color:var(--ink-3);width:14px;transition:transform .15s}
.ledger tr.open .an .chev{transform:rotate(90deg)}
.cnum{font:400 24px var(--serif);display:inline-block;min-width:36px;padding:2px 8px;border-radius:10px;text-align:left}
.cnum:hover{background:var(--sunken)}
.cnum.zero{color:#C9CDD5}
.cnum.sel{background:var(--ink);color:#fff}
.cnum small{font:500 11px var(--mono);margin-left:4px;vertical-align:4px;color:var(--late)}
.cnum.sel small{color:#fff}
.ledger tr.exp td{padding:6px 14px 22px;background:#F7FBF8}
.expgrid{display:grid;grid-template-columns:repeat(3,1fr) 320px;gap:20px}
.ltools{display:flex;gap:10px;align-items:center;margin-bottom:14px}
.ltools h2{font:400 34px var(--serif);margin-right:auto}

/* ---------- MAP: 3 · SPREAD ---------- */
.spreadtop{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:20px 32px 14px}
.spreadtop .mono{color:var(--ink-3);margin-right:6px}
.tog{font-size:14px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink-3)}
.tog.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.jump{font-size:14px;padding:6px 10px;border-radius:10px;display:inline-flex;gap:7px;align-items:center}
.jump:hover{background:#fff}
.spread{display:flex;gap:14px;overflow-x:auto;padding:4px 32px 40px;scroll-snap-type:x proximity;align-items:flex-start}
.scol{flex:0 0 330px;scroll-snap-align:start;background:#fff;border:1px solid var(--line);border-radius:22px;padding:18px 8px 12px;box-shadow:var(--shadow)}
.scol.flash{box-shadow:0 0 0 3px var(--hot-line),var(--shadow)}
.scol .sh{padding:0 12px 12px;border-bottom:1px solid var(--line-soft);margin-bottom:12px}
.scol .sh .n{display:flex;align-items:center;gap:10px;font:500 24px var(--serif)}
.scol .sh .s{margin-top:4px;display:flex;gap:8px;align-items:center}
.scol .sh .s .note{font-size:13px}
.scol .open{margin-left:auto;font-size:12.5px}

/* ---------- inbox pages ---------- */
.ib{max-width:1200px;margin:0 auto}
.ib h1{font:400 42px/1.1 var(--serif);letter-spacing:-.02em}
.ib .lede{font-size:16px;color:var(--ink-2);margin:6px 0 22px;max-width:70ch}
.prog{display:flex;align-items:center;gap:14px;margin-bottom:22px}
.prog .bar{flex:1;max-width:420px;height:8px}
.prog .bar i{background:var(--hot)}
.aiwrap{display:grid;grid-template-columns:380px 1fr;gap:24px;align-items:start}
.ailist{background:#fff;border:1px solid var(--line);border-radius:20px;padding:10px}
.ailist .grp{font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);padding:12px 12px 4px;display:flex;gap:8px;align-items:center}
.ailist .it.on{background:var(--ink);color:#fff}
.ailist .it.on .m{color:rgba(255,255,255,.7)}
.aipane{background:#fff;border:1px solid var(--line);border-radius:22px;padding:26px 28px;position:sticky;top:0;box-shadow:var(--shadow)}
.aipane h2{font:400 30px/1.2 var(--serif);margin:6px 0 14px;cursor:pointer}
.aipane textarea{width:100%;min-height:280px;border:1px solid var(--line);border-radius:14px;padding:14px 16px;font:400 14.5px/1.6 var(--mono);outline:none;resize:vertical;background:#FBFDFB}
.aipane textarea:focus{border-color:var(--hot)}
.wrow{display:grid;grid-template-columns:1fr 160px 120px 150px auto;gap:14px;align-items:center;padding:13px 16px;background:#fff;border:1px solid var(--line);border-radius:16px;margin-bottom:8px}
.wrow .t{font-size:16px;font-weight:500;cursor:pointer}
.wrow .t small{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-3);font-weight:400;margin-top:2px}
.wrow .c{font-size:14px;color:var(--ink-2)}
.wrow .c.red{color:var(--late);font-weight:600}
.wrow .acts{display:flex;gap:6px}
.whead{display:grid;grid-template-columns:1fr 160px 120px 150px auto;gap:14px;padding:0 16px 8px;font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.empty{padding:60px 20px;text-align:center}
.empty h3{font:400 34px var(--serif);margin-bottom:6px}
.empty p{color:var(--ink-3)}

/* ---------- item sheet (from the real app’s card) ---------- */
#layer .veil{position:fixed;inset:0;background:rgba(20,22,27,.28);display:flex;justify-content:center;align-items:flex-start;padding:5vh 20px;z-index:120;overflow:auto}
.sheet{background:var(--surface);border-radius:22px;box-shadow:var(--shadow-2);width:680px;max-width:100%;padding:26px 28px 22px;position:relative}
.sheet .x{position:absolute;right:14px;top:12px;font-size:24px;color:var(--ink-3);padding:4px 8px}
.sheet .ttl{width:100%;border:none;outline:none;resize:none;font:400 28px/1.25 var(--serif);padding-right:30px}
.sheet .sec{border-top:1px solid var(--line-soft);padding:14px 0}
.sheet .sec>.mono{display:block;color:var(--ink-3);margin-bottom:9px}
.sheet .state-now{font-size:14px;color:var(--ink-3);margin:4px 0 8px}
.moveto{display:flex;flex-wrap:wrap;gap:6px}
.moveto button{font-weight:500;font-size:14px;padding:8px 12px;border-radius:11px;border:1px solid var(--line);background:#fff}
.moveto button:hover{border-color:var(--hot-line)}
.moveto button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:500;padding:6px 12px;border-radius:999px;border:1px solid var(--line);color:var(--ink-2);background:#fff}
.chip b{width:8px;height:8px;border-radius:50%;background:currentColor;display:inline-block}
.chip span{color:var(--ink)}
.chip.on{border-color:currentColor;background:color-mix(in srgb,currentColor 9%,#fff)}
.fld{border:1px solid var(--line);border-radius:10px;padding:8px 11px;outline:none;background:#fff;font-size:15px}
.fld:focus{border-color:var(--hot)}
textarea.fld{width:100%;resize:vertical;line-height:1.5}
.row2{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.foot{display:flex;gap:10px;align-items:center;border-top:1px solid var(--line-soft);padding-top:14px}
.foot .grow{flex:1}
.danger{color:var(--late)}

/* ================= RITUALS — full screen ================= */
#rit{display:none}
#rit.open{display:grid;grid-template-columns:330px 1fr;position:fixed;inset:0;z-index:100;
  background:radial-gradient(1100px 620px at 92% -12%,#D9F4E7 0%,rgba(217,244,231,0) 62%),radial-gradient(900px 520px at -8% 112%,#FFF2D6 0%,rgba(255,242,214,0) 58%),#FAFCFA}
.r-rail{display:flex;flex-direction:column;padding:38px 30px 30px;border-right:1px solid rgba(20,22,27,.07);background:rgba(255,255,255,.55);backdrop-filter:blur(6px)}
.r-kind{font:600 12px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--hot-ink)}
.r-title{font:400 30px/1.15 var(--serif);margin-top:6px}
.r-clock{font:300 54px/1 var(--mono);letter-spacing:-.02em;margin:22px 0 4px;color:var(--ink)}
.r-clock+.note{margin-bottom:28px}
.r-steps{display:flex;flex-direction:column;gap:2px}
.r-step{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:12px;font-size:15.5px;color:var(--ink-3);text-align:left}
.r-step .b{width:24px;height:24px;border-radius:50%;border:1.5px solid #CBD2CD;display:flex;align-items:center;justify-content:center;font:600 11px var(--mono);flex:none;background:#fff}
.r-step.done{color:var(--ink-2)}
.r-step.done .b{background:var(--hot);border-color:var(--hot);color:#fff}
.r-step.now{color:var(--ink);font-weight:600;background:#fff;box-shadow:var(--shadow)}
.r-step.now .b{border-color:var(--hot);color:var(--hot-ink);box-shadow:0 0 0 4px var(--hot-soft)}
.r-step:hover:not(.now){background:rgba(255,255,255,.7)}
.r-tally{margin-top:auto;background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 16px 14px}
.r-tally .mono{color:var(--ink-3)}
.r-tally .big{font:400 40px/1 var(--serif);margin:6px 0 8px}
.r-tally .tl{display:flex;flex-wrap:wrap;gap:6px}
.r-tally .tl span{font-size:12.5px;background:var(--sunken);border-radius:8px;padding:3px 8px;color:var(--ink-2)}
.r-tally .tl span.pop{animation:pop .45s}
.r-pause{margin-top:14px;font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);border:1px solid var(--line);border-radius:12px;padding:12px;background:rgba(255,255,255,.7)}
.r-pause:hover{color:var(--ink);border-color:var(--ink-3)}
.r-stage{overflow:auto;display:flex;flex-direction:column}
.r-inner{width:100%;max-width:1080px;margin:0 auto;padding:64px 64px 0;flex:1;display:flex;flex-direction:column}
.r-eyebrow{font:600 13px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--hot-ink);margin-bottom:18px;display:flex;gap:14px;align-items:center}
.r-eyebrow .pill{letter-spacing:.06em;background:#fff;border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink-2)}
.r-name{font:400 clamp(48px,6.4vw,96px)/1.03 var(--serif);letter-spacing:-.035em;margin-bottom:16px}
.r-name.long{font-size:clamp(36px,4.4vw,64px);line-height:1.1}
.r-note{font-size:21px;line-height:1.5;color:var(--ink-2);max-width:56ch;margin-bottom:36px}
.r-body{flex:1}
.r-bar{position:sticky;bottom:0;display:flex;align-items:center;gap:18px;padding:30px 0 34px;margin-top:30px;background:linear-gradient(rgba(250,252,250,0),#FAFCFA 40%)}
.r-go{display:inline-flex;align-items:center;gap:14px;background:var(--ink);color:#fff;border-radius:999px;padding:20px 38px;font:600 18px var(--sans);box-shadow:0 14px 30px -14px rgba(20,22,27,.55);transition:transform .12s}
.r-go:hover{transform:translateY(-1px)}
.r-go kbd{font:500 12px var(--mono);border:1px solid rgba(255,255,255,.35);border-radius:6px;padding:2px 7px;opacity:.85}
.r-back{font:600 13px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);padding:12px 6px}
.r-back:hover{color:var(--ink)}
.r-hint{margin-left:auto;font:500 12.5px var(--mono);letter-spacing:.05em;color:var(--ink-3);text-align:right;max-width:46ch}
kbd.k{font:600 11px var(--mono);border:1px solid var(--line);background:#fff;border-radius:6px;padding:2px 7px;color:var(--ink-3)}

.r-phrase{width:100%;border:none;border-bottom:2px solid var(--line);background:transparent;outline:none;font:italic 300 clamp(30px,3.6vw,48px)/1.25 var(--serif);padding:8px 0 14px}
.r-phrase:focus{border-color:var(--hot)}
.r-dump{width:100%;border:none;border-bottom:2px solid var(--line);background:transparent;outline:none;resize:none;font:300 clamp(26px,3vw,40px)/1.3 var(--serif);padding:6px 0 12px}
.r-dump:focus{border-color:var(--hot)}
.r-dump::placeholder,.r-phrase::placeholder{color:#B9BFC9;font-style:italic}
.caught{margin-top:26px}
.caught .mono{color:var(--ink-3)}
.caught .list{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.caught .list span{background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 13px;font-size:15.5px;animation:pop .35s}
.caught .list span:last-child{border-color:var(--hot-line);background:var(--hot-soft)}
@keyframes pop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}

.deck{position:relative;margin-top:4px}
.deck::before,.deck::after{content:'';position:absolute;left:18px;right:18px;height:100%;border-radius:28px;background:#fff;border:1px solid var(--line);z-index:0}
.deck::before{top:10px;opacity:.7}.deck::after{top:20px;left:36px;right:36px;opacity:.4}
.deck.single::before,.deck.single::after{display:none}
.r-card{position:relative;z-index:1;background:#fff;border:1px solid var(--line);border-radius:28px;padding:34px 38px 30px;box-shadow:var(--shadow-2);animation:cardin .28s cubic-bezier(.2,.8,.2,1)}
.r-card.out{animation:cardout .2s ease-in forwards}
@keyframes cardin{from{transform:translateY(18px) scale(.98);opacity:0}to{transform:none;opacity:1}}
@keyframes cardout{to{transform:translateX(60px) rotate(2deg);opacity:0}}
.r-card .from{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink-3);margin-bottom:10px}
.r-card .from .cnt{margin-left:auto;font:600 12px var(--mono);letter-spacing:.08em}
.r-card h3{font:400 clamp(30px,3.2vw,44px)/1.15 var(--serif);letter-spacing:-.02em;margin-bottom:6px;outline:none}
.r-card .meta{font-size:15px;color:var(--ink-3);margin-bottom:20px}
.r-card .q{font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin:20px 0 10px}
.r-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:10px}
.r-tile{display:flex;align-items:center;gap:11px;text-align:left;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 15px;font-size:16px;font-weight:500;transition:transform .1s,border-color .1s,background .1s}
.r-tile:hover{border-color:var(--tc,var(--hot));transform:translateY(-1px)}
.r-tile kbd{font:600 11px var(--mono);border:1px solid var(--line);border-radius:6px;padding:2px 7px;color:var(--ink-3);background:var(--sunken)}
.r-tile .d{width:10px;height:10px;border-radius:50%;background:var(--tc)}
.r-tile.on{background:color-mix(in srgb,var(--tc,var(--hot)) 10%,#fff);border-color:var(--tc,var(--hot))}
.r-tile.primary{border-color:var(--hot-line);background:var(--hot-soft)}
.r-tile small{display:block;font-size:12.5px;color:var(--ink-3);font-weight:400}
.r-tiles.big .r-tile{padding:22px 20px;font-size:20px}
.r-after{margin-top:26px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.r-after .mono{color:var(--ink-3);margin-right:4px}
.r-after span{font-size:14px;color:var(--ink-3);background:rgba(255,255,255,.7);border:1px solid var(--line-soft);border-radius:10px;padding:5px 10px}
.areas-prog{display:flex;flex-wrap:wrap;gap:6px;margin:-14px 0 26px}
.areas-prog>span{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid var(--line-soft);color:var(--ink-3)}
.areas-prog>span.done{color:var(--hot-ink);border-color:var(--hot-line)}
.areas-prog>span.now{background:var(--ink);color:#fff;border-color:var(--ink)}
.r-clear{background:#fff;border:1px solid var(--line);border-radius:28px;padding:40px;text-align:left;box-shadow:var(--shadow)}
.r-clear b{font:400 40px var(--serif);display:block;margin-bottom:6px}
.r-clear p{color:var(--ink-2);font-size:18px}
.r-also{margin-top:22px;font-size:15px;color:var(--ink-3)}
.r-also b{color:var(--ink-2);font-weight:600}
.paper{background:#FFFEF9;border:1px solid #EDE7D3;border-radius:6px;padding:40px 46px;box-shadow:0 1px 0 #E9E2CB,0 30px 60px -30px rgba(80,60,0,.3);max-width:640px;font:400 18px/1.75 var(--serif);white-space:pre-wrap;transform:rotate(-.4deg)}
.meterbig{display:flex;align-items:center;gap:18px;margin-bottom:22px;font-size:17px;color:var(--ink-2)}
.meterbig .bar{width:340px;height:10px}
.meterbig .bar i{background:var(--hot)}
.meterbig.over{color:var(--late)}.meterbig.over .bar i{background:var(--late)}
.r-done{display:flex;flex-direction:column;gap:20px}
.r-done .big{font:300 120px/1 var(--serif);letter-spacing:-.04em}
.r-done .tl{display:flex;flex-wrap:wrap;gap:8px}
.r-done .tl span{font-size:17px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 14px;animation:pop .4s backwards}

#toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(30px);opacity:0;background:var(--ink);color:#fff;border-radius:12px;padding:11px 18px;font-size:14.5px;transition:.2s;z-index:150;display:flex;gap:14px;align-items:center;pointer-events:none}
#toast.in{opacity:1;transform:translateX(-50%);pointer-events:auto}
#toast button{color:#7FF0C2;font-weight:700}

/* ===== round 4 ===== */
.tab{white-space:nowrap}
.brand{font-size:26px}
.spreadtop{flex-wrap:nowrap!important;overflow-x:auto;white-space:nowrap}
.spread{scroll-padding-left:28px}
@media (max-width:1320px){.navlabel{display:none}.seg .lbl{display:none}.cap{width:200px!important}.tab{padding:8px 10px}}
.top{padding:14px 28px;border-bottom:1px solid var(--line);gap:12px}
.nav{flex:1;padding:0;border:none;gap:4px}
.cap{width:300px;margin-left:auto}
.seg button{padding:7px 11px}
#stage.p-hall{overflow:auto}
.hall{height:100%;padding:22px 28px 22px;display:flex;flex-direction:column;gap:16px;min-height:640px}
.panel{background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px 22px;box-shadow:var(--shadow);min-height:0;overflow:auto}
.mono{color:var(--ink-3)}
/* priorities */
.pp-h{display:flex;align-items:center;gap:10px}
.pp-n{font:400 26px var(--serif)}
.pp-phr{font:italic 300 18px var(--serif);color:var(--ink-2);margin:6px 0 4px;cursor:pointer}
.pp-top{display:flex;flex-direction:column;gap:2px;margin-top:10px}
.pp-i{display:grid;grid-template-columns:34px 1fr;text-align:left;padding:10px 8px;border-radius:12px;column-gap:6px}
.pp-i:hover{background:var(--sunken)}
.pp-i .k{font:400 26px/1 var(--serif);color:var(--hot);grid-row:span 2;padding-top:2px}
.pp-i .t{font:400 23px/1.2 var(--serif);letter-spacing:-.01em}
.pp-i .a{font-size:13.5px;color:var(--ink-3);display:flex;align-items:center;gap:6px;margin-top:3px}
.pp-i .a b{font-weight:600}.pp-i .a b.red{color:var(--late)}.pp-i .a b.amber{color:var(--stuck)}
.pp-rest{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px;padding:12px 8px 0;border-top:1px solid var(--line-soft)}
.pp-c{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;color:var(--ink-2);background:var(--sunken);border-radius:999px;padding:4px 10px}
.pp-empty .big{font-size:34px;line-height:1.15;letter-spacing:-.02em;margin:12px 0 8px}
/* attention */
.ap-i{display:block;width:100%;text-align:left;padding:8px 0;border-bottom:1px solid var(--line-soft)}
.ap-i:last-of-type{border:none}
.ap-i .w{font:600 10.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--sc);margin-right:8px}
.ap-i .t{font-size:14.5px;font-weight:500}
.ap-i .why{display:block;font-size:13px;color:var(--ink-3)}
/* areas */
.arp-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.arp-i{display:grid;grid-template-columns:150px 140px 1fr;gap:10px;align-items:baseline;width:100%;text-align:left;padding:7px 4px;border-bottom:1px solid var(--line-soft);font-size:14.5px}
.arp-i:last-child{border:none}
.arp-i:hover{background:var(--sunken)}
.arp-i .n{display:flex;align-items:center;gap:8px;font-weight:600}
.arp-i .st{font-size:13px;display:flex;align-items:center;gap:6px}
.arp-i .st .sdot{width:8px;height:8px}
.arp-i .ctx{font-size:12.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.warn{color:#FF8A80!important}
/* 1 · stage */
.band{display:grid;grid-template-columns:1.6fr repeat(4,1fr);gap:10px}
.rc{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;background:var(--dark);color:#fff;border-radius:20px;padding:16px 18px 16px;min-height:118px;box-shadow:0 18px 34px -20px rgba(20,22,27,.7);transition:transform .12s}
.rc:hover{transform:translateY(-2px)}
.rc .ic{font-size:18px;opacity:.7}
.rc .nm{font:400 22px/1.15 var(--serif)}
.rc .ln{font-size:13px;opacity:.65}
.rc.next{background:linear-gradient(135deg,var(--dark),var(--darkhot));order:-1}
.rc.next .nm{font-size:34px}
.rc.next .go{position:absolute;right:18px;bottom:16px;font:600 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;background:var(--hot);color:#fff;border-radius:999px;padding:8px 14px}
.rc.calm{background:var(--dark-3);opacity:.82}
.h1-grid{flex:1;display:grid;grid-template-columns:1.2fr .95fr 1fr;gap:16px;min-height:0}
.h1-side{display:flex;flex-direction:column;gap:16px;min-height:0}
.h1-side .grow{flex:1}
/* 2 · sidebar */
.h2{flex-direction:row}
.dark{width:320px;flex:none;background:var(--dark);color:#fff;border-radius:24px;padding:22px 16px;display:flex;flex-direction:column;gap:6px;box-shadow:0 24px 40px -24px rgba(20,22,27,.7)}
.dark>.mono{color:var(--ink-3);padding:0 10px 6px}
.dr{display:flex;align-items:center;gap:14px;text-align:left;padding:14px 14px;border-radius:16px;color:#fff}
.dr:hover{background:var(--dark-2)}
.dr .ic{width:36px;height:36px;border-radius:12px;background:var(--dark-2);display:flex;align-items:center;justify-content:center;font-size:16px;flex:none}
.dr b{display:block;font:400 21px/1.2 var(--serif)}
.dr small{font-size:13px;color:#A9A5B2}
.dr em{margin-left:auto;font:normal 500 13px var(--mono);background:var(--dark-2);border-radius:8px;padding:2px 8px}
.dr.next{background:var(--darkhot);padding:20px 14px}
.dr.next b{font-size:28px}
.dr.next .ic{background:var(--hot)}
.dk-foot{margin-top:auto;padding:14px 10px 4px;border-top:1px solid var(--dark-2)}
.dk-phr{font:italic 300 17px var(--serif);color:#E4E1EA;cursor:pointer}
.h2-main{flex:1;display:grid;grid-template-columns:1.25fr 1fr;grid-template-rows:auto 1fr;gap:16px;min-width:0;min-height:0}
.h2-main .big{grid-column:1;grid-row:1}
.h2-main .att{grid-column:1;grid-row:2}
.h2-main .ars{grid-column:2;grid-row:1 / span 2}
/* 3 · hero */
.hero3{display:grid;grid-template-columns:1.5fr 1fr;gap:12px}
.hb{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;background:linear-gradient(135deg,var(--dark) 0%,var(--darkhot) 100%);color:#fff;border-radius:26px;padding:26px 30px;position:relative;box-shadow:0 24px 44px -24px rgba(20,22,27,.75);min-height:200px}
.hb .mono{color:var(--hotlite)}
.hb .nm{font:400 54px/1.05 var(--serif);letter-spacing:-.03em}
.hb .sub{font-size:16px;opacity:.75}
.hb .ln{font-size:14px;color:var(--hotlite);margin-top:auto}
.hb .go{position:absolute;right:26px;bottom:24px;background:var(--hot);border-radius:999px;padding:13px 22px;font:600 16px var(--sans);display:flex;gap:10px;align-items:center}
.hb .go kbd{font:500 11px var(--mono);border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:1px 6px}
.hs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hsr{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;background:var(--dark);color:#fff;border-radius:18px;padding:14px 16px}
.hsr .ic{opacity:.6}
.hsr b{font:400 19px var(--serif)}
.hsr small{font-size:12.5px;opacity:.65}
.hsr.calm{background:var(--dark-3);opacity:.8}
.h3-row{flex:1;display:grid;grid-template-columns:1.2fr .9fr 1.1fr;gap:16px;min-height:0}
.arp-i{grid-template-columns:1fr auto!important}
.arp-i .ctx{display:none}
/* ===== map spreads ===== */
.p-map{display:flex;flex-direction:column;overflow:hidden!important}
.spreadtop{flex:none}
.tog{display:inline-flex;align-items:center;gap:7px}
.tog i{width:9px;height:9px;border-radius:3px;background:var(--bc);opacity:.35}
.tog.on{background:#fff;color:var(--ink);border-color:var(--bc)}
.tog.on i{opacity:1}
.spread{flex:1;overflow:auto;padding:4px 28px 40px;gap:16px}
.scol{flex:0 0 400px;padding:0;overflow:hidden;align-self:flex-start}
.ch{position:sticky;top:0;background:#fff;padding:18px 20px 14px;border-bottom:1px solid var(--line-soft);z-index:2}
.ch .n{display:flex;align-items:center;gap:10px;font:400 27px var(--serif);letter-spacing:-.01em}
.ch .n .dot{width:11px;height:11px}
.ch .st{font-size:14px;display:flex;align-items:center;gap:7px;margin-top:3px}
.ir{display:flex;align-items:baseline;gap:12px;width:100%;text-align:left;padding:9px 14px;border-radius:10px}
.ir:hover{background:rgba(255,255,255,.75)}
.ir .t{flex:1;font-size:17px;line-height:1.35}
.ir .m{font-size:13.5px;color:var(--ink-3);white-space:nowrap}
.ir .m.red{color:var(--late);font-weight:600}.ir .m.amber{color:var(--stuck);font-weight:600}.ir .m.tod{color:var(--hot-ink);font-weight:600}
.scol .addin{margin:10px 14px 16px;width:calc(100% - 28px);font-size:15px}
/* A blocks */
.sA .scol{padding-bottom:2px}
.blk{margin:12px 12px 0;background:var(--bg);border-radius:16px;padding:4px 2px 8px;border-left:4px solid var(--bc)}
.blk .bh,.nowbox .bh{display:flex;align-items:baseline;justify-content:space-between;padding:10px 14px 4px;font:600 12.5px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--bc)}
.blk .bh b,.nowbox .bh b{font:400 22px var(--serif);letter-spacing:0;color:var(--bc)}
.blk0{display:flex;justify-content:space-between;margin:8px 12px 0;padding:7px 14px;border-radius:12px;border:1px dashed #E2E6E3;font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#B4BAC3}
.blk0 b{font:400 13px var(--sans);letter-spacing:0;text-transform:none}
.blk .bk{margin:0}
/* B bands */
.bandsWrap{flex:1;overflow:auto;padding:0 28px 40px}
.bands{display:grid;width:max-content;border-radius:20px;background:#fff;border:1px solid var(--line);box-shadow:var(--shadow)}
.bands .bhd{position:sticky;top:0;z-index:3;background:#fff;border-bottom:1px solid var(--line);border-left:1px solid var(--line-soft)}
.bands .bl{position:sticky;left:0;z-index:2;background:var(--bg,#fff);border-bottom:1px solid #fff;padding:16px 14px;border-left:5px solid var(--bc,transparent);box-shadow:1px 0 0 var(--line)}
.bands .bl span{display:block;font:600 12.5px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--bc)}
.bands .bl small{font-size:12.5px;color:var(--ink-3)}
.bands .corner{top:0;z-index:4;background:#fff;border-bottom:1px solid var(--line)}
.bands .bc{background:var(--bg,#fff);border-bottom:3px solid #fff;border-left:1px solid #fff;padding:8px 6px}
.bands .bc.plain{background:#fff}
.bands .bc .none{display:block;padding:9px 14px;color:#C3C8CF}
/* C fold */
.nowbox{margin:12px 12px 4px;background:#EAF7F0;border-radius:16px;padding:4px 2px 8px;border-left:4px solid #07805A;--bc:#07805A}
.nowbox .none{padding:6px 14px 4px;color:var(--ink-3);font-size:15px}
.fold{margin:8px 12px 0;border-radius:14px;background:var(--bg);border-left:4px solid var(--bc)}
.fold .fh{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 14px}
.fold .cnt{font:400 24px/1 var(--serif);color:var(--bc);min-width:22px}
.fold .l{font:600 12.5px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--bc)}
.fold .peek{flex:1;font-size:14.5px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fold .chev{margin-left:auto;font:400 20px var(--sans);color:var(--bc)}
.fold.zero{background:transparent;border-left-color:#E3E7E4}
.fold.zero .cnt,.fold.zero .l{color:#BFC5CC}
.fold.open{padding-bottom:6px}
/* waiting */
.wrow.over{border-color:#F4C7C3;background:#FFFBFA}
.wrow,.whead{grid-template-columns:minmax(0,1fr) 110px 70px 150px 380px!important}
.wrow .acts{justify-content:flex-end}
/* ai ritual */
.r-instr{width:100%;min-height:190px;border:1px solid var(--line);border-radius:14px;padding:14px 16px;font:400 14.5px/1.6 var(--mono);outline:none;resize:vertical;background:#FBFDFB;margin-top:6px}
.r-instr:focus{border-color:var(--hot)}

/* ================= ROUND 5 — three skins, two worlds, one ritual room ================= */
.t2app[data-skin="1"]{ /* Paper & Jewel */
  --bg:#FBF8F2;--surface:#FFFFFF;--sunken:#F6F1E7;--line:#EAE2D4;--line-soft:#F2ECE1;
  --ink:#17161B;--ink-2:#55525C;--ink-3:#8F8A94;--dark:#17161B;--dark-2:#25232B;--dark-3:#34313B;
  --serif:'Fraunces',Georgia,serif;--sans:'Instrument Sans',-apple-system,sans-serif;--rp:22px;
  --hp:#0E8F64;--hpi:#0A6E4D;--hps:#E3F3EB;--hpl:#A9DCC5;--hw:#3046D6;--hwi:#2335B0;--hws:#E8EBFC;--hwl:#B7C0F5;
  --shadow:0 1px 2px rgba(40,30,10,.05),0 12px 28px -18px rgba(40,30,10,.30);--shadow-2:0 2px 6px rgba(40,30,10,.05),0 30px 60px -26px rgba(40,30,10,.32)}
.t2app[data-skin="2"]{ /* Porcelain */
  --bg:#FAFBFD;--surface:#FFFFFF;--sunken:#F2F5FA;--line:#E1E6EF;--line-soft:#EDF1F6;
  --ink:#0D1220;--ink-2:#4A5163;--ink-3:#8A91A3;--dark:#0D1220;--dark-2:#1A2134;--dark-3:#262F46;
  --serif:'Instrument Serif',Georgia,serif;--sans:'Inter Tight',-apple-system,sans-serif;--rp:14px;
  --hp:#0B9C7B;--hpi:#077A60;--hps:#E2F5EF;--hpl:#9EDCCB;--hw:#2F54FF;--hwi:#1E3FE0;--hws:#E8EDFF;--hwl:#B5C4FF;
  --shadow:0 1px 0 rgba(13,18,32,.04),0 8px 18px -14px rgba(13,18,32,.22);--shadow-2:0 1px 0 rgba(13,18,32,.04),0 24px 48px -28px rgba(13,18,32,.30)}
.t2app[data-skin="3"]{ /* Sorbet */
  --bg:#FFF8EE;--surface:#FFFFFF;--sunken:#FFF0DD;--line:#F1E1C9;--line-soft:#F8ECDB;
  --ink:#2B2135;--ink-2:#5E5168;--ink-3:#9A8EA2;--dark:#2B2135;--dark-2:#3B2F47;--dark-3:#4B3D59;
  --serif:'Bricolage Grotesque',Georgia,sans-serif;--sans:'DM Sans',-apple-system,sans-serif;--rp:28px;
  --hp:#2E9E5B;--hpi:#1F7C44;--hps:#E2F6E3;--hpl:#A9E1B8;--hw:#5B4BE0;--hwi:#4434C4;--hws:#ECE9FF;--hwl:#C3BAFF;
  --shadow:0 2px 0 rgba(120,80,30,.06),0 14px 30px -18px rgba(120,80,30,.30);--shadow-2:0 3px 0 rgba(120,80,30,.06),0 30px 60px -26px rgba(120,80,30,.35)}
.t2app{--hot:var(--hp);--hot-ink:var(--hpi);--hot-soft:var(--hps);--hot-line:var(--hpl);
  --darkhot:color-mix(in srgb,var(--hot) 32%,var(--dark));--hotlite:color-mix(in srgb,var(--hot) 45%,#fff);font-family:var(--sans)}
.t2app[data-mode="work"]{--hot:var(--hw);--hot-ink:var(--hwi);--hot-soft:var(--hws);--hot-line:var(--hwl)}
.t2app,.btn,.tab,.ir .t,.ap-i,.arp-i{font-family:var(--sans)}
.panel,.wslot,.wgoal,.ailist,.aipane,.wrow,.pp-empty{border-radius:var(--rp)}
.t2app[data-skin="2"] .panel{box-shadow:none}
.t2app[data-skin="2"] .serif,.t2app[data-skin="2"] .pp-i .t,.t2app[data-skin="2"] .hb .nm,.t2app[data-skin="2"] .r-name{letter-spacing:-.01em}
.t2app[data-skin="3"] .panel{border-width:2px}
.t2app[data-skin="3"] .hb,.t2app[data-skin="3"] .hsr{border-radius:30px}
.t2app[data-skin="3"] .pp-i .t,.t2app[data-skin="3"] .hb .nm,.t2app[data-skin="3"] .r-name,.t2app[data-skin="3"] .ch .n{font-weight:600;letter-spacing:-.03em}
.brand{font:500 23px var(--serif);letter-spacing:-.02em;white-space:nowrap}
.t2app[data-skin="3"] .brand{font-weight:700}

/* mode switch */
.modesw{display:flex;background:var(--sunken);border:1px solid var(--line);border-radius:999px;padding:3px;margin-right:8px}
.modesw button{font:600 13.5px var(--sans);padding:7px 14px;border-radius:999px;color:var(--ink-3)}
.modesw button.on{background:var(--hot);color:#fff;box-shadow:0 6px 14px -8px var(--hot)}
.tab.on{background:var(--dark)}
.btn.hot{background:var(--hot);border-color:var(--hot)}

/* hero tweaks */
.hb{overflow:hidden}
.hb::after{content:'';position:absolute;right:-60px;top:-80px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--hot) 55%,transparent),transparent 70%);opacity:.55}
.hb .go{z-index:1}
.hsr.reset{background:linear-gradient(135deg,var(--dark),#6B2E0E)}
.hsr{transition:transform .12s}.hsr:hover{transform:translateY(-2px)}

/* ================= THE RITUAL ROOM ================= */
#rit[data-r="round"]{--rc:#1F7A55;--rc2:#8FDDB4;--rc3:#FFE3A3}
#rit[data-r="move"]{--rc:#D9692A;--rc2:#FFC98A;--rc3:#FFE9B8}
#rit[data-r="clear"]{--rc:#2A72C9;--rc2:#9FD0FF;--rc3:#D9F0FF}
#rit[data-r="ai"],#rit[data-r="wai"]{--rc:#6847E3;--rc2:#C7B6FF;--rc3:#FFD3EC}
#rit[data-r="work"]{--rc:#3046D6;--rc2:#A9B7FF;--rc3:#FFE1B0}
#rit[data-r="reset"]{--rc:#E2541E;--rc2:#FFB27A;--rc3:#FFE2A0}
#rit[data-r="stepback"]{--rc:#A9740F;--rc2:#F2D27E;--rc3:#C9E8D8}
#rit.open{background:var(--bg)!important;grid-template-columns:320px 1fr}
#rit .aura{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0}
#rit .aura i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;animation:drift 22s ease-in-out infinite alternate}
#rit .aura i:nth-child(1){width:620px;height:620px;right:-140px;top:-220px;background:var(--rc2)}
#rit .aura i:nth-child(2){width:520px;height:520px;left:22%;bottom:-260px;background:var(--rc3);animation-duration:28s}
#rit .aura i:nth-child(3){width:340px;height:340px;right:24%;top:30%;background:var(--rc2);opacity:.25;animation-duration:34s}
@keyframes drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-60px,40px) scale(1.08)}100%{transform:translate(40px,-30px) scale(.95)}}
.t2app[data-skin="2"] #rit .aura i{opacity:.28}
.t2app[data-skin="3"] #rit .aura i{opacity:.75;filter:blur(50px)}
#rit .r-rail,#rit .r-stage{position:relative;z-index:1}
.r-rail{background:color-mix(in srgb,var(--surface) 70%,transparent);backdrop-filter:blur(14px);border-right:1px solid color-mix(in srgb,var(--rc) 12%,var(--line))}
.r-kind{color:var(--rc)}
.r-title{font-family:var(--serif)}
.ring{position:relative;width:148px;height:148px;margin:22px 0 22px}
.ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.ring circle{fill:none;stroke-width:7;stroke-linecap:round}
.ring .trk{stroke:color-mix(in srgb,var(--rc) 12%,var(--line-soft))}
.ring .bar{stroke:var(--rc);transition:stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)}
.rc-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.rc-in span{font:400 30px var(--mono);letter-spacing:-.02em}
.rc-in small{font-size:12px;color:var(--ink-3);margin-top:2px}
.r-step .sl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r-step.done .b{background:var(--rc);border-color:var(--rc)}
.r-step.now .b{border-color:var(--rc);color:var(--rc);box-shadow:0 0 0 4px color-mix(in srgb,var(--rc) 16%,transparent)}
.r-steps{overflow:auto;min-height:0;flex:1 1 auto;margin-bottom:12px}
.r-rail{overflow:hidden}
.r-tally{border-radius:var(--rp);flex:none}
.r-tally .big{font-family:var(--serif);color:var(--rc)}
.r-tally .tl span{background:color-mix(in srgb,var(--rc) 9%,#fff);color:color-mix(in srgb,var(--rc) 70%,var(--ink))}
.r-foot{display:flex;gap:8px;margin-top:12px;flex:none}
.r-foot .r-pause{flex:1;margin:0}
.r-snd{font:600 12px var(--mono);letter-spacing:.06em;color:var(--ink-3);border:1px solid var(--line);border-radius:12px;padding:0 12px;background:rgba(255,255,255,.7)}
.r-snd.on{color:var(--rc);border-color:var(--rc)}
.r-eyebrow{color:var(--rc)}
.r-name{font-family:var(--serif)}
.r-name::after{content:'';display:block;width:64px;height:5px;border-radius:5px;background:var(--rc);margin-top:18px;opacity:.85}
.r-body{position:relative}
.r-go{background:var(--rc);box-shadow:0 18px 36px -16px var(--rc)}
.r-card{border-radius:calc(var(--rp) + 6px)}
.r-card h3{font-family:var(--serif)}
.r-card .q{color:color-mix(in srgb,var(--rc) 60%,var(--ink-3))}
.deck::before,.deck::after{border-radius:calc(var(--rp) + 6px)}
.r-tile{border-radius:calc(var(--rp) - 4px)}
.r-tile kbd,kbd.k{font:600 11px var(--mono);min-width:24px;text-align:center;background:linear-gradient(#fff,#F1EEE8);border:1px solid #D9D3C7;border-bottom-width:3px;border-radius:7px;padding:2px 6px 1px;color:var(--ink-2);box-shadow:0 1px 0 rgba(0,0,0,.04)}
.r-tile:hover{border-color:var(--tc,var(--rc));box-shadow:0 10px 20px -14px var(--tc,var(--rc))}
.r-tile:active{transform:translateY(1px) scale(.99)}
.r-tile.primary{border-color:color-mix(in srgb,var(--rc) 40%,#fff);background:color-mix(in srgb,var(--rc) 9%,#fff)}
.r-tile.on{background:color-mix(in srgb,var(--tc,var(--rc)) 12%,#fff);border-color:var(--tc,var(--rc))}
.r-phrase:focus,.r-dump:focus{border-color:var(--rc)}
.caught .list span:last-child{border-color:var(--rc);background:color-mix(in srgb,var(--rc) 10%,#fff)}
.r-card.out.to-up{animation:flyUp .22s ease-in forwards}.r-card.out.to-right{animation:flyRight .22s ease-in forwards}
.r-card.out.to-down{animation:flyDown .22s ease-in forwards}.r-card.out.to-left{animation:flyLeft .22s ease-in forwards}
@keyframes flyUp{to{transform:translateY(-120px) rotate(-1deg) scale(.96);opacity:0}}
@keyframes flyRight{to{transform:translateX(160px) rotate(4deg);opacity:0}}
@keyframes flyDown{to{transform:translateY(120px) rotate(1deg) scale(.96);opacity:0}}
@keyframes flyLeft{to{transform:translateX(-160px) rotate(-4deg);opacity:0}}
.burst{position:absolute;left:50%;top:120px;width:0;height:0;pointer-events:none;z-index:5}
.burst i{position:absolute;width:10px;height:10px;border-radius:3px;background:var(--rc);animation:pf .95s cubic-bezier(.12,.75,.3,1) forwards}
.burst i:nth-child(3n){background:var(--rc2);border-radius:50%}.burst i:nth-child(4n){background:var(--rc3);width:7px;height:14px}
@keyframes pf{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--x),var(--y)) rotate(320deg);opacity:0}}
.r-clear{border-radius:calc(var(--rp) + 6px);background:color-mix(in srgb,#fff 82%,var(--rc2));border-color:color-mix(in srgb,var(--rc) 20%,var(--line))}
.r-clear b{font-family:var(--serif)}
.r-done .big{font-family:var(--serif);color:var(--rc)}
.r-done .tl span{border-color:color-mix(in srgb,var(--rc) 30%,var(--line))}
.wk1{background:#fff;border:1px solid var(--line);border-radius:var(--rp);padding:18px 22px;max-width:640px;box-shadow:var(--shadow)}
.wk1 b{display:block;font:400 28px/1.2 var(--serif);margin-top:6px}
.paper{font-family:var(--serif)}
.breath{display:flex;align-items:center;gap:22px;margin-top:26px;color:var(--ink-2)}
.breath i{width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,var(--rc2),var(--rc));animation:breathe 14s ease-in-out infinite}
@keyframes breathe{0%{transform:scale(.55)}28%{transform:scale(1)}57%{transform:scale(1)}100%{transform:scale(.55)}}
.focusring{width:240px;height:240px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#fff,var(--rc2));box-shadow:0 30px 60px -30px var(--rc);animation:pulse 3s ease-in-out infinite}
.focusring span{font-size:72px;line-height:1}.focusring small{color:var(--ink-2)}
@keyframes pulse{50%{transform:scale(1.04)}}
.r-next{width:100%;border:none;border-bottom:2px solid var(--line);background:transparent;outline:none;font:400 22px var(--serif);padding:6px 0 10px}
.r-next:focus{border-color:var(--rc)}
.slotbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.slotbar .sb{font-size:14px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px}
.slotbar .sb b{font-family:var(--serif);font-weight:500;color:var(--rc)}
.r-tile.pick{position:relative;min-height:74px}
.r-tile.pick .slt{position:absolute;top:8px;right:10px;font:600 10.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#fff;background:var(--rc);border-radius:6px;padding:2px 7px}
.r-tile.pick.s-batch .slt{background:color-mix(in srgb,var(--rc) 65%,#fff)}.r-tile.pick.s-spare .slt{background:color-mix(in srgb,var(--rc) 40%,#fff)}

/* ================= TOWN MAP — folding bands ================= */
.bands .bl{font:inherit;text-align:left;cursor:pointer;width:100%;display:block}
.bands .bl .chev{font-style:normal;display:inline-block;width:16px;color:var(--bc)}
.bands .bl:hover span{text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--bc) 40%,transparent);text-underline-offset:4px}
.bands .bc .sum{display:none}
.bands .bc.collapsed .sum{display:block;padding:4px 14px}
.bands .bc.collapsed .sum b{font:400 24px var(--serif);color:var(--bc)}
.bands .bc.collapsed .sum .none{color:#C9CDD3;font-size:20px}
.bands .bc.collapsed .full{display:none}
.bands .bc.collapsed{padding:6px 6px}
.bands .bl.collapsed{padding:10px 14px;opacity:.85}
.bands .bc.collapsed.peek .full{display:block;animation:peekIn .16s ease-out}
.bands .bc.collapsed.peek .sum{display:none}
.bands .bc.collapsed.peek,.bands .bl.collapsed.peek{background:color-mix(in srgb,var(--bg) 60%,#fff);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--bc) 35%,transparent)}
@keyframes peekIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.bands{border-radius:var(--rp)}

/* ================= WORK ================= */
.wdeep{background:var(--hot-soft);border-radius:calc(var(--rp) - 6px);padding:14px 16px;margin-top:12px;cursor:pointer;border-left:4px solid var(--hot)}
.wdeep .mono{color:var(--hot-ink)}
.wdeep .t{font:400 24px/1.2 var(--serif);margin-top:4px}
.wdeep .a{font-size:13px;color:var(--ink-3);display:flex;gap:6px;align-items:center;margin-top:4px}
.wsl{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px}
.wli{display:block;width:100%;text-align:left;padding:7px 2px;font-size:14.5px;border-bottom:1px solid var(--line-soft)}
.wli:hover{color:var(--hot-ink)}.wli b.red{color:var(--late);font-weight:600}
.wmis{font-size:13.5px;color:var(--ink-3);margin:0 0 6px}.wmis b{color:var(--ink);font-weight:600}
.wcounts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.wcounts button{font-size:13px;color:var(--ink-3);background:var(--sunken);border-radius:999px;padding:5px 11px}
.wcounts b{color:var(--ink);font-weight:600}
.wtoday{max-width:1240px;margin:0 auto}
.wt-head{display:flex;align-items:flex-end;gap:14px;margin-bottom:18px}
.wt-head h1{font-size:46px;font-weight:400;letter-spacing:-.02em;line-height:1}
.wslots{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr;gap:14px}
.wslot{background:var(--surface);border:1px solid var(--line);padding:6px 4px 12px;border-top:4px solid var(--sc,var(--hot));box-shadow:var(--shadow)}
.wslot.deep{--sc:var(--hot);background:linear-gradient(var(--hot-soft),#fff 70%)}.wslot.batch{--sc:color-mix(in srgb,var(--hot) 55%,#fff)}.wslot.spare{--sc:var(--line)}.wslot.ai{--sc:#6847E3}
.wslot .bh{display:flex;justify-content:space-between;align-items:baseline;padding:10px 12px 0;font:600 12.5px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-2)}
.wslot .bh b{font:400 22px var(--serif);letter-spacing:0}
.wslot>.note{padding:0 12px 6px;font-size:13px}
.wslot.deep .ir .t{font:400 21px/1.25 var(--serif)}
.wempty{margin:6px 12px 0;border:1px dashed var(--line);border-radius:12px;padding:10px 12px;font-size:13.5px;color:var(--ink-3)}
.wweek{margin-top:22px;background:var(--surface);border:1px solid var(--line);border-radius:var(--rp);padding:16px 10px 12px}
.bh2{display:flex;align-items:baseline;gap:12px;padding:0 10px 6px}.bh2 .serif{font-size:24px}
.wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:6px 18px}
.wgrid.wide{grid-template-columns:repeat(4,1fr)}
.wgrid .grp{padding:8px 12px 2px;display:flex;gap:7px;align-items:center;font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase}
.wcol{background:var(--surface);border:1px solid var(--line);border-radius:var(--rp);padding:8px 4px 10px;align-self:start}
.wbrow{display:flex;align-items:center;gap:6px;padding-right:8px}.wbrow .ir{flex:1}
.wbrow .btn{opacity:0;transition:opacity .12s}.wbrow:hover .btn{opacity:1}
.wmission{background:linear-gradient(135deg,var(--dark),var(--darkhot));color:#fff;border-radius:var(--rp);padding:22px 26px;margin-bottom:16px;cursor:pointer}
.wmission .mono{color:var(--hotlite)}.wmission .serif{font-size:32px;line-height:1.15;margin-top:6px}
.wgoals{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.wgoal{background:var(--surface);border:1px solid var(--line);border-top:5px solid var(--gc);padding:18px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:6px}
.wgoal .st{display:flex;align-items:center;gap:7px;font-size:13.5px}
.wgoal .t{font-size:24px;line-height:1.2}
.wgoal .nx{font-size:14.5px;color:var(--ink-2);margin-top:6px}.wgoal .nx.none{color:var(--late)}
.trail{display:flex;gap:4px;align-items:center;margin-top:auto;padding-top:10px}.trail i{width:16px;height:8px;border-radius:3px}.trail .note{margin-left:8px;font-size:12.5px}
#stage[class^="w-"]:not(.w-home) .page{padding-top:28px}
.ir .dot{width:8px;height:8px;flex:none}

@media (max-height:820px){.ring{width:112px;height:112px;margin:14px 0 14px}.rc-in span{font-size:24px}.r-rail{padding-top:26px}.r-step{padding:6px 10px;font-size:14.5px}}

.r-body{padding-bottom:40px}
.r-tile{line-height:1.3}

.t2app{height:100%;}
.cap span{display:none}
.more2{font:600 18px var(--sans);color:var(--ink-2);width:38px;height:38px;border-radius:12px;border:1px solid var(--line);background:var(--surface);margin-left:6px;flex:none}
.more2:hover{border-color:var(--hot-line)}
.menu2{position:fixed;z-index:150;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-2);padding:6px;display:flex;flex-direction:column;min-width:230px}
.menu2 button{text-align:left;font:500 14.5px var(--sans);padding:10px 12px;border-radius:10px}
.menu2 button:hover{background:var(--hot-soft)}
.menu2 .mv{font:500 11.5px var(--mono);color:var(--ink-3);padding:8px 12px 4px;border-top:1px solid var(--line-soft);margin-top:4px}
@media (max-width:760px){.top{flex-wrap:wrap}.nav{overflow-x:auto;flex-wrap:nowrap;width:100%;padding-bottom:4px}.nav .tab{flex:none}.modesw{flex:none}.cap{order:9;width:100%!important;margin:6px 0 0}.hall{height:auto}.hero3,.h3-row{grid-template-columns:1fr!important}.hb .nm{font-size:38px}}
@media (max-width:760px){#rit.open{grid-template-columns:1fr!important;grid-template-rows:auto 1fr}.r-rail{flex-direction:row!important;align-items:center;gap:12px;padding:12px 16px!important;border-right:0!important;border-bottom:1px solid var(--line)}.r-rail .ring,.r-rail .r-tally,.r-rail .r-steps,.r-rail .r-kind{display:none!important}.r-rail .r-title{font-size:22px;margin:0}.r-foot{margin:0 0 0 auto!important}.r-stage{overflow:auto;min-height:0}.r-inner{padding:22px 18px 40px!important}.r-name{font-size:40px!important}.r-tiles{grid-template-columns:1fr 1fr!important}}
</style><div class="t2app" data-skin="1" data-mode="town"><header class="top"><span class="brand">Daily Ritual</span><nav class="nav" id="nav"></nav></header><main id="stage"></main><div id="rit"></div><div id="layer"></div><div id="toast"></div></div>`;
const APP=ROOT.querySelector('.t2app');
const UI=()=>{const u=REAL().ui;if(!u._t2||typeof u._t2!=='object')u._t2={page:'hall',bandOpen:{now:1,delegated:1,queue:1},spreadShow:{now:1,delegated:1,queue:1,later:1,unscheduled:1,notprio:1}};return u._t2};
const TOWNMAP={items:1,cycles:1,depts:1,lastRound:1,aiTemplate:1};
/* the prototype's S, mapped onto the real data: town fields → S.town, the week's phrase → anchors,
   today's free time → S.town.day, everything else (screen state) → S.ui._t2 */
const S=new Proxy({},{
  get(_,k){const R0=REAL();
    if(TOWNMAP[k])return R0.town[k];
    if(k==='phrase')return weekPhrase();
    if(k==='dayMins'){const d=R0.town.day;return d&&d.date===today()?d.mins:null}
    if(k==='dayDate'){const d=R0.town.day;return d?d.date:null}
    return UI()[k]},
  set(_,k,v){const R0=REAL();
    if(TOWNMAP[k]){R0.town[k]=v;return true}
    if(k==='phrase'){setWeekPhrase(v||'');return true}
    if(k==='dayMins'){R0.town.day={date:today(),mins:v};return true}
    if(k==='dayDate')return true;
    UI()[k]=v;return true}});
/* every write goes through app_1's save (localStorage os_v3 + sync); a fresh input stamp lets sync pick it up */
function save(){LAST_INPUT=Date.now();window.save()}
const KH=[];function ON_KEY(fn){KH.push(fn)}

/* ================= data (same shape as S.town in the real app) ================= */
const DEPTS=TOWN_DEPTS;
const NODEPT={id:null,name:'Unsorted',color:'#9AA0A6'};
const ROWS=['inbox','week','ai','wife','waiting','later'];
const SN={inbox:'Inbox',week:'This week',ai:'AI queue',wife:'Wife help',waiting:'Waiting',later:'Not this week',done:'Done',dropped:'Dropped'};
const SC={inbox:'#5F6368',week:'#1A73E8',ai:'#7C5CFC',wife:'#D01884',waiting:'#B06000',later:'#E37400',done:'#1E8E3E',dropped:'#D93025'};
const SKEY={week:'W',ai:'A',wife:'F',waiting:'S',later:'L',done:'D',dropped:'X'};
const SHINT={inbox:'Not decided yet',week:'Yours, this week',ai:'Hand to Claude',wife:'Talk it through',waiting:'Someone else has the ball',later:'Comes back on a date'};
const SIZES=[{v:1,name:'⚡ 60 sec'},{v:10,name:'10 min'},{v:30,name:'30 min'},{v:60,name:'60+ min'},{v:120,name:'Deep'}];
const TIMES=[{v:0,name:'0'},{v:15,name:'15 min'},{v:30,name:'30 min'},{v:60,name:'60+ min'},{v:120,name:'2h+ block'}];
const STAKES=[{v:3,name:'Can’t undo',color:'#D93025'},{v:2,name:'Gets worse',color:'#F29900'},{v:1,name:'Can wait',color:'#80868B'}];
const UNITS=['days','weeks','months','years'];
const AI_TPL=`Task: {task}
Department: {department}
Notes: {notes}

What I keep on file for this department:
{reference}

Please take care of this for me. Tell me what you did, what is still open, and anything you need from me.`;
const SPARK_URL='https://spark-v2-chabes-devs-projects.vercel.app/';

const iso=d=>new Date(d).toISOString().slice(0,10);
const addDays=(n,from)=>{const d=new Date((from||today())+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const daysTo=s=>Math.round((new Date(s+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nid=()=>Math.random().toString(36).slice(2,9);
const short=s=>new Date(s+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'});
function dueLabel(s){const n=daysTo(s);return {t:n<0?(-n)+'d late':n===0?'today':n===1?'tomorrow':n<7?'in '+n+'d':short(s),late:n<0,soon:n>=0&&n<=2}}



/* ================= helpers (mirror the real app’s rules) ================= */
const dept=id=>DEPTS.find(d=>d.id===id)||null;
const byId=id=>S.items.find(i=>i.id===id);
const open=i=>i.state!=='done'&&i.state!=='dropped';
const stake=i=>STAKES.find(s=>s.v===i.stakes)||null;
const stakeW=i=>({3:3,2:2,1:1}[i.stakes]||1.5);
const timeW=i=>{if(!i.due)return 0;const n=daysTo(i.due);return n<0?3:n<=3?2:n<=7?1:0};
const prio=i=>stakeW(i)+timeW(i);
const order=(a,b)=>(prio(b)-prio(a))||((a.due||'9')<(b.due||'9')?-1:(a.due||'9')>(b.due||'9')?1:0)||(a.created-b.created);
const isToday=i=>open(i)&&(i.today===today()||(i.state==='week'&&i.day===today()));
const doneToday=i=>i.state==='done'&&i.doneAt&&iso(i.doneAt)===today();
const late=i=>i.state==='waiting'&&i.wait&&i.wait.checkBack&&i.wait.checkBack<=today();
const sizeLabel=i=>i.home?'🏠 after work':(SIZES.find(s=>s.v===i.size)||{}).name||'';
const dayMins=()=>S.dayDate===today()?S.dayMins:null;
const cycItem=c=>{const i=c.itemId?byId(c.itemId):null;return i&&open(i)?i:null};
const cycDue=c=>!c.retired&&!cycItem(c)&&daysTo(c.nextDue)<=c.lead;
const cycEvery=c=>'every '+(c.n===1?c.unit.replace(/s$/,''):c.n+' '+c.unit);
function pulse(id){const L=S.items.filter(i=>i.dept===id),o=L.filter(open);
  if(o.some(i=>late(i)||(i.due&&i.due<today())))return 'red';if(!o.length)return 'calm';
  const last=Math.max(...L.map(i=>i.movedAt||i.created||0));return Date.now()-last>21*864e5?'orange':'calm'}
const PULSE={calm:'moving',orange:'nothing moved in 3 weeks',red:'something overdue'};
function instr(i){if(i.instr!=null)return i.instr;const d=dept(i.dept),ref=d?S.depts[d.id].ref.trim():'',notes=(i.notes||'').trim();
  return S.aiTemplate.split('\n').filter(l=>notes||!l.includes('{notes}')).join('\n').replace(/\{task\}/g,i.title)
    .replace(/\{department\}/g,d?d.name:'—').replace(/\{notes\}/g,notes).replace(/\{reference\}/g,ref||'(nothing on file yet)').trim()}

/* the one move function — anything can go anywhere, any time */
function move(i,s){
  if(!i||i.state===s)return;const was=i.state;
  if(was==='ai')i.aiOut=Date.now();if(s==='ai'){i.aiIn=Date.now();i.aiOut=null}
  i.state=s;i.movedAt=Date.now();i.doneAt=(s==='done'||s==='dropped')?Date.now():null;
  if(s!=='week'){i.today=null;i.day=null}
  if(s!=='later')i.back=null;else if(!i.back)i.back=addDays(7);
  if(s==='waiting'&&!i.wait)i.wait={who:'',since:today(),checkBack:addDays(3)};
  const c=i.cycle&&S.cycles.find(x=>x.id===i.cycle);
  if(c&&s==='done'){const d=new Date(today()+'T12:00:00');({days:()=>d.setDate(d.getDate()+c.n),weeks:()=>d.setDate(d.getDate()+7*c.n),
    months:()=>d.setMonth(d.getMonth()+c.n),years:()=>d.setFullYear(d.getFullYear()+c.n)})[c.unit]();c.nextDue=iso(d);c.itemId=null}
}
let UNDO=null;
function snap(ids,msg){UNDO={msg,items:ids.map(id=>JSON.parse(JSON.stringify(byId(id)))),cycles:JSON.parse(JSON.stringify(S.cycles))}}
function undo(){if(!UNDO)return;UNDO.items.forEach(o=>{const k=S.items.findIndex(i=>i.id===o.id);if(k>=0)S.items[k]=o;else S.items.push(o)});
  S.cycles=UNDO.cycles;UNDO=null;save();render();toast('undone')}
let TT;function toast(msg,withUndo){const t=ROOT.getElementById('toast');
  t.innerHTML=esc(msg)+(withUndo?' <button id="tund">Undo</button>':'');t.classList.add('in');
  const u=ROOT.getElementById('tund');if(u)u.onclick=undo;clearTimeout(TT);TT=setTimeout(()=>t.classList.remove('in'),3800)}
function doMove(id,s,quiet){const i=byId(id);if(!i||i.state===s)return;snap([id]);move(i,s);save();render();
  if(!quiet)toast(`“${i.title.slice(0,40)}” → ${SN[s]}${s==='waiting'?' · set who has it in the card':''}`,true)}
function add(title,deptId,state){const i={id:nid(),title,dept:deptId||null,state:state||'inbox',size:null,home:false,stakes:0,due:null,notes:'',
  wait:null,instr:null,today:null,back:null,cycle:null,created:Date.now(),movedAt:Date.now(),doneAt:null};S.items.push(i);save();return i}
function copy(text){(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(()=>toast('copied'))
  .catch(()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('copied')})}

/* ================= item sheet: every detail + move anywhere ================= */
let LAYER=null;
function closeLayer(){ROOT.getElementById('layer').innerHTML='';LAYER=null;render()}
function sheet(html,wide){ROOT.getElementById('layer').innerHTML=`<div class="veil"><div class="sheet ${wide?'wide':''}"><button class="x" data-close>×</button>${html}</div></div>`;
  const v=ROOT.querySelector('#layer .veil');v.onmousedown=e=>{if(e.target===v)closeLayer()};v.querySelector('[data-close]').onclick=closeLayer}
function openItem(id){LAYER={k:'item',id};drawItem()}
function drawItem(){
  const i=byId(LAYER.id);if(!i){closeLayer();return}
  const w=i.wait||{},c=i.cycle&&S.cycles.find(x=>x.id===i.cycle);
  sheet(`<textarea class="ttl" id="sTitle" rows="1">${esc(i.title)}</textarea>
    <div class="state-now">${SN[i.state]}${i.state==='later'&&i.back?' · back '+short(i.back):''}${isToday(i)?' · on today':''}${c?' · ↻ '+cycEvery(c):''}</div>
    <div class="sec"><span class="mono">Move to — any time</span><div class="moveto">
      ${['inbox','week','ai','wife','waiting','later','done','dropped'].map(s=>`<button class="${i.state===s?'on':''}" data-mv="${s}">${s==='wife'?'💛 Ask your wife':s==='waiting'?'Someone else has it':SN[s]}</button>`).join('')}</div>
      ${i.state==='week'?`<div class="chips" style="margin-top:9px"><button class="chip ${isToday(i)?'on':''}" data-stoday style="color:var(--hot)"><b></b><span>${isToday(i)?'On today':'Put it on today'}</span></button></div>`:''}
      ${i.state==='later'?`<div class="row2" style="margin-top:9px"><span class="note">Comes back on</span><input type="date" class="fld" id="sBack" value="${i.back||''}"></div>`:''}</div>
    ${i.state==='waiting'?`<div class="sec"><span class="mono">Waiting on</span><div class="row2"><input class="fld" id="sWho" placeholder="Who has it?" value="${esc(w.who||'')}">
      <span class="note">since ${w.since?short(w.since):'—'} · check back</span><input type="date" class="fld" id="sCb" value="${w.checkBack||''}"></div></div>`:''}
    ${i.state==='ai'?`<div class="sec"><span class="mono">Instruction for the AI</span><textarea class="fld" id="sIns" rows="6">${esc(instr(i))}</textarea>
      <div class="row2" style="margin-top:8px"><button class="btn sm" data-scopy>Copy</button><button class="btn sm" data-ssent>Sent → Waiting</button></div></div>`:''}
    <div class="sec"><span class="mono">Department</span><div class="chips">${DEPTS.map(d=>`<button class="chip ${i.dept===d.id?'on':''}" data-sdept="${d.id}" style="color:${d.color}"><b></b><span>${d.name}</span></button>`).join('')}</div></div>
    <div class="sec"><span class="mono">If it slips a week, can you still fix it later?</span><div class="chips">${STAKES.map(s=>`<button class="chip ${i.stakes===s.v?'on':''}" data-sstake="${s.v}" style="color:${s.color}"><b></b><span>${s.name}</span></button>`).join('')}</div></div>
    <div class="sec"><span class="mono">Size</span><div class="chips">${SIZES.map(s=>`<button class="chip ${i.size===s.v&&!i.home?'on':''}" data-ssize="${s.v}" style="color:var(--hot)"><b></b><span>${s.name}</span></button>`).join('')}
      <button class="chip ${i.home?'on':''}" data-ssize="home" style="color:#0B7A55"><b></b><span>🏠 After work</span></button><button class="chip ${!i.size&&!i.home?'on':''}" data-ssize="" style="color:#9AA0A6"><b></b><span>Not sized</span></button></div></div>
    <div class="sec row2"><span class="mono" style="margin:0">Deadline</span><input type="date" class="fld" id="sDue" value="${i.due||''}">
      <span class="mono" style="margin:0 0 0 14px">Repeats</span>${c?`<span class="note">${esc(cycEvery(c))} — edit in ${dept(c.dept)?dept(c.dept).name:''}</span>`:`<button class="btn sm" data-srep>↻ Make it repeat</button>`}</div>
    <div class="sec"><span class="mono">Notes</span><textarea class="fld" id="sNotes" rows="3" placeholder="Anything worth remembering">${esc(i.notes)}</textarea></div>
    <div class="foot"><button class="btn sm danger" data-sdel>Delete</button><span class="grow"></span><span class="note">Changes save as you go</span><button class="btn hot" data-close2>Close</button></div>`);
  const L=ROOT.getElementById('layer'),$=q=>L.querySelector(q),re=()=>{save();drawItem()};
  const t=$('#sTitle');t.style.height=t.scrollHeight+'px';t.oninput=()=>{t.style.height='auto';t.style.height=t.scrollHeight+'px';if(t.value.trim()){i.title=t.value.trim();save()}};
  L.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const s=b.dataset.mv;if(s==='wife'){wifeFlow(i);return}if(s==='waiting'&&i.state!=='waiting'){toWaiting(i,'',3);re();return}snap([i.id]);move(i,s);re();toast('→ '+SN[s],true)});
  const st=$('[data-stoday]');if(st)st.onclick=()=>{i.today=isToday(i)?null:today();re()};
  const bk=$('#sBack');if(bk)bk.onchange=()=>{i.back=bk.value||null;save()};
  const wh=$('#sWho');if(wh)wh.oninput=()=>{i.wait.who=wh.value;save()};
  const cb=$('#sCb');if(cb)cb.onchange=()=>{if(!cb.value){cb.value=i.wait.checkBack;toast('waiting always needs a check-back day');return}i.wait.checkBack=cb.value;save()};
  const ins=$('#sIns');if(ins)ins.oninput=()=>{i.instr=ins.value;save()};
  const sc=$('[data-scopy]');if(sc)sc.onclick=()=>copy(instr(i));
  const ss=$('[data-ssent]');if(ss)ss.onclick=()=>{snap([i.id]);move(i,'waiting');i.wait={who:'Claude',since:today(),checkBack:addDays(2)};re()};
  L.querySelectorAll('[data-sdept]').forEach(b=>b.onclick=()=>{i.dept=b.dataset.sdept;re()});
  L.querySelectorAll('[data-sstake]').forEach(b=>b.onclick=()=>{const v=+b.dataset.sstake;i.stakes=i.stakes===v?0:v;re()});
  L.querySelectorAll('[data-ssize]').forEach(b=>b.onclick=()=>{const v=b.dataset.ssize;i.home=v==='home';i.size=v&&v!=='home'?+v:null;re()});
  $('#sDue').onchange=e=>{i.due=e.target.value||null;save()};
  $('#sNotes').oninput=e=>{i.notes=e.target.value;save()};
  const rp=$('[data-srep]');if(rp)rp.onclick=()=>{if(!i.dept){toast('give it a department first');return}
    const c={id:nid(),title:i.title,dept:i.dept,n:1,unit:'months',nextDue:i.due||addDays(30),lead:14,itemId:i.id,retired:false};S.cycles.push(c);i.cycle=c.id;re()};
  $('[data-sdel]').onclick=()=>{snap([i.id]);S.items=S.items.filter(x=>x!==i);save();closeLayer();toast('deleted',true)};
  $('[data-close2]').onclick=closeLayer;
}

/* ================= department sheet: reference, almanac, done log ================= */
function openDept(id){LAYER={k:'dept',id};drawDept()}
function drawDept(){
  const d=dept(LAYER.id),p=pulse(d.id),L=S.items.filter(i=>i.dept===d.id);S.depts[d.id].lastVisit=Date.now();save();
  const groups=ROWS.map(s=>({s,L:L.filter(i=>i.state===s).sort(order)})).filter(g=>g.L.length);
  const done=L.filter(i=>i.state==='done').sort((a,b)=>b.doneAt-a.doneAt),cyc=S.cycles.filter(c=>c.dept===d.id&&!c.retired).sort((a,b)=>a.nextDue<b.nextDue?-1:1);
  sheet(`<div class="row2"><span class="pulse ${p}"></span><span style="font:600 28px var(--serif);color:${d.color}">${d.name}</span><span class="note">${PULSE[p]}</span></div>
    ${d.hint?`<div class="note" style="margin-top:4px">${d.hint}.</div>`:''}
    <div class="dept2"><div>
      <input class="fld" id="dAdd" placeholder="Add something for ${esc(d.name)} — ⏎ (inbox)" style="width:100%;margin-bottom:6px">
      ${groups.map(g=>`<div class="grp" style="--c:${SC[g.s]}">${SN[g.s]} — ${g.L.length}</div><div class="lst">${g.L.map(i=>card(i)).join('')}</div>`).join('')||'<div class="note" style="padding:12px 0">Nothing open here.</div>'}
    </div><div>
      <div class="mono" style="color:var(--ink-3);margin-bottom:8px">Reference card</div>
      <textarea class="fld" id="dRef" rows="6" placeholder="Standing facts — doctor names, renewal months, sizes, who to call">${esc(S.depts[d.id].ref)}</textarea>
      <div class="note" style="margin-top:4px">No ID, card or account numbers — it’s plain text in this browser.</div>
      <div class="mono" style="color:var(--ink-3);margin:18px 0 6px">Almanac — ${cyc.length}</div>
      ${cyc.map(c=>{const l=dueLabel(c.nextDue),it=cycItem(c);return `<div class="cycrow"><span class="t">↻ ${esc(c.title)}${c.who?' · '+esc(c.who):''}</span><span class="m">${cycEvery(c)}</span>
        <span class="m ${l.late?'late':''}">${it?SN[it.state]:cycDue(c)?'coming up · ':''}${l.late?l.t:'due '+l.t}</span>
        ${!it&&cycDue(c)?`<button class="btn sm" data-cplant="${c.id}">+ this week</button>`:''}<button class="link" data-cret="${c.id}">retire</button></div>`}).join('')||'<div class="note">Nothing recurring yet.</div>'}
      <div class="row2" style="margin-top:10px"><input class="fld" id="cT" placeholder="New cycle — e.g. Vaccine" style="flex:1;min-width:140px">
        <span class="note">every</span><input class="fld" id="cN" type="number" min="1" value="1" style="width:56px"><select class="fld" id="cU">${UNITS.map(u=>`<option ${u==='months'?'selected':''}>${u}</option>`).join('')}</select>
        <input class="fld" id="cD" type="date" value="${addDays(30)}"><button class="btn sm" id="cAdd">Add</button></div>
      <div class="mono" style="color:var(--ink-3);margin:18px 0 6px">Done log — ${done.length}</div>
      ${done.map(i=>`<div class="donerow"><span class="t">${esc(i.title)}</span><span>${short(iso(i.doneAt))}</span></div>`).join('')||'<div class="note">Nothing finished yet.</div>'}
    </div></div>`,true);
  const Ly=ROOT.getElementById('layer');
  Ly.querySelector('#dRef').oninput=e=>{S.depts[d.id].ref=e.target.value;save()};
  Ly.querySelector('#dAdd').onkeydown=e=>{if(e.key==='Enter'&&e.target.value.trim()){add(e.target.value.trim(),d.id,'inbox');drawDept();Ly.querySelector('#dAdd').focus()}};
  Ly.querySelectorAll('[data-cplant]').forEach(b=>b.onclick=()=>{const c=S.cycles.find(x=>x.id===b.dataset.cplant),i=add(c.title+(c.who?' — '+c.who:''),c.dept,'week');i.cycle=c.id;i.due=c.nextDue;c.itemId=i.id;save();drawDept()});
  Ly.querySelectorAll('[data-cret]').forEach(b=>b.onclick=()=>{S.cycles.find(x=>x.id===b.dataset.cret).retired=true;save();drawDept()});
  Ly.querySelector('#cAdd').onclick=()=>{const t=Ly.querySelector('#cT').value.trim();if(!t)return;
    S.cycles.push({id:nid(),title:t,dept:d.id,n:Math.max(1,+Ly.querySelector('#cN').value||1),unit:Ly.querySelector('#cU').value,nextDue:Ly.querySelector('#cD').value||addDays(30),lead:30,itemId:null,retired:false});save();drawDept()};
  wireCards(Ly);
}

/* ================= AI queue (same job as today) ================= */
function openAI(){LAYER={k:'ai'};drawAI()}
function drawAI(){
  const all=inState('ai'),wk=Date.now()-7*864e5,sent=S.items.filter(i=>i.aiOut&&i.aiOut>=wk&&i.state!=='ai');
  const ds=[...DEPTS,NODEPT].map(d=>({d,left:all.filter(i=>(i.dept||null)===d.id).length,sent:sent.filter(i=>(i.dept||null)===d.id).length})).filter(x=>x.left||x.sent);
  let f=S.aiDept;if(f!=='all'&&!ds.some(x=>x.left&&String(x.d.id)===f))f='all';
  const L=all.filter(i=>f==='all'||String(i.dept||null)===f).sort(order),sel=L.find(i=>i.id===S.aiSel)||L[0];
  const tile=(x,id,name,c)=>{const tot=x.left+x.sent,pct=tot?Math.round(x.sent/tot*100):0;
    return `<button class="aitile ${String(id)===f?'on':''}" data-aid="${id}" style="--c:${c}"><div class="n">${name}</div><div class="c">${x.left?x.left+' left':'✓ clear'} · ${x.sent} sent</div><div class="bar"><i style="width:${pct}%"></i></div></button>`};
  sheet(`<div class="row2"><span style="font:600 28px var(--serif)">🤖 AI queue</span><span class="note">${all.length} ready · ${sent.length} sent this week · riskiest first</span>
      <span style="flex:1"></span><button class="link" id="aiTpl">edit the template</button></div>
    <div class="aitiles">${tile({left:all.length,sent:sent.length},'all','All departments','var(--ai)')}${ds.map(x=>tile(x,x.d.id,x.d.name,x.d.color)).join('')}</div>
    ${sel?`<div class="ai2"><div class="lst" style="display:flex;flex-direction:column;gap:6px">${L.map(i=>card(i,{dept:1,cls:i===sel?'cur':''}).replace('class="card','data-aisel="'+i.id+'" class="card')).join('')}</div>
      <div><div style="font:500 22px var(--serif);margin-bottom:8px">${esc(sel.title)}</div>
        <textarea class="fld" id="aiIns" rows="11">${esc(instr(sel))}</textarea>
        <div class="row2" style="margin-top:10px"><button class="btn hot" id="aiCopy">Copy</button><button class="btn" id="aiSent">Sent → Waiting</button>
          ${sel.instr!=null?'<button class="link" id="aiReset">back to the template</button>':''}<span style="flex:1"></span><button class="link" data-open="${sel.id}">all details</button></div>
        <div class="note" style="margin-top:8px">Copying changes nothing — press Sent once you’ve actually sent it.</div></div></div>`
      :`<div class="empty"><h3>Queue’s clear.</h3>Drag any card onto the AI row or dock to hand it off.</div>`}`,true);
  const Ly=ROOT.getElementById('layer');
  Ly.querySelectorAll('[data-aid]').forEach(b=>b.onclick=()=>{S.aiDept=b.dataset.aid;save();drawAI()});
  Ly.querySelectorAll('[data-aisel]').forEach(b=>b.onclick=()=>{S.aiSel=b.dataset.aisel;save();drawAI()});
  const tp=Ly.querySelector('#aiTpl');tp.onclick=()=>{const v=prompt('AI template — {task} {department} {notes} {reference}',S.aiTemplate);if(v!=null){S.aiTemplate=v;save();drawAI()}};
  if(sel){Ly.querySelector('#aiIns').oninput=e=>{sel.instr=e.target.value;save()};
    Ly.querySelector('#aiCopy').onclick=()=>copy(instr(sel));
    Ly.querySelector('#aiSent').onclick=()=>{snap([sel.id]);move(sel,'waiting');sel.wait={who:'Claude',since:today(),checkBack:addDays(2)};save();drawAI();toast('sent → Waiting',true)};
    const r=Ly.querySelector('#aiReset');if(r)r.onclick=()=>{sel.instr=null;save();drawAI()};
    Ly.querySelector('[data-open]').onclick=()=>openItem(sel.id)}
}


/* ======================================================================
   ROUND 3 — Town Hall = what to act on + how each area is doing.
   Town Map = everything, by area and bucket.  Inboxes = side work.
   Rituals = full-screen, one card at a time, keyboard-first.
   ====================================================================== */
const DAY=864e5;
const inState=s=>S.items.filter(i=>i.state===s);
const poolDue=()=>S.items.filter(i=>i.state==='inbox'||(i.state==='later'&&i.back&&i.back<=today())).sort((a,b)=>(a.state==='later'?0:1)-(b.state==='later'?0:1)||a.created-b.created);
S.page=S.page||'hall';S.ledgerOpen=S.ledgerOpen||{};S.spreadShow=S.spreadShow||{now:1,delegated:1,queue:1};

/* ---------- buckets: every open item sits in exactly one ---------- */
const BUCKETS=[
  {id:'now',name:'Now',hint:'yours this week',test:i=>i.state==='week'},
  {id:'delegated',name:'Delegated',hint:'AI · someone else has it',test:i=>['ai','wife','waiting'].includes(i.state)},
  {id:'queue',name:'In queue',hint:'not sorted or decided yet',test:i=>i.state==='inbox'||(i.state==='later'&&!!i.back&&i.back<=today())},
  {id:'later',name:'Later',hint:'comes back on a date',test:i=>i.state==='later'&&!!i.back&&i.back>today()&&i.stakes!==1},
  {id:'unscheduled',name:'Not scheduled',hint:'parked, no date',test:i=>i.state==='later'&&!i.back&&i.stakes!==1},
  {id:'notprio',name:'Not priority',hint:'rated “can wait”',test:i=>i.state==='later'&&i.stakes===1&&!(i.back&&i.back<=today())}];
const bucketOf=i=>BUCKETS.find(b=>b.test(i));
const inArea=id=>S.items.filter(i=>(i.dept||null)===id&&open(i));
const inB=(id,b)=>inArea(id).filter(BUCKETS.find(x=>x.id===b).test).sort(b==='delegated'?(x,y)=>(late(y)-late(x))||order(x,y):b==='later'?(x,y)=>x.back<y.back?-1:1:order);
const daysSince=ts=>Math.floor((Date.now()-ts)/DAY);

/* ---------- stuck, late, health ---------- */
function stuckWhy(i){
  if(i.state==='ai'&&i.aiIn&&daysSince(i.aiIn)>7)return `in the AI queue for ${daysSince(i.aiIn)} days`;
  if(i.state==='week'&&i.movedAt&&daysSince(i.movedAt)>10)return `carried for ${Math.round(daysSince(i.movedAt)/7)} weeks`;
  if(i.state==='waiting'&&i.wait&&!i.wait.checkBack&&i.wait.since&&-daysTo(i.wait.since)>14)return `waiting ${Math.round(-daysTo(i.wait.since)/7)} weeks, no check-back`;
  return null}
const isLate=i=>open(i)&&((i.due&&i.due<today())||late(i));
function health(id){
  const L=inArea(id);
  if(!L.length)return {k:'empty',t:'Nothing open'};
  const lt=L.filter(isLate).length;if(lt)return {k:'late',t:lt===1?'Something late':lt+' things late'};
  const sk=L.filter(stuckWhy).length;if(sk)return {k:'stuck',t:sk===1?'Something stuck':sk+' stuck'};
  const last=Math.max(...S.items.filter(i=>i.dept===id).map(i=>i.movedAt||i.created||0));
  const wk=Math.floor(daysSince(last)/7);if(wk>=3)return {k:'quiet',t:`Quiet for ${wk} weeks`};
  const q=L.filter(BUCKETS[2].test).length;if(q)return {k:'sort',t:q+' to sort'};
  return {k:'ok',t:'On track'}}
const HORDER={late:0,stuck:1,sort:2,quiet:3,ok:4,empty:5};
const areasByNeed=()=>[...DEPTS].sort((a,b)=>HORDER[health(a.id).k]-HORDER[health(b.id).k]);
function ctxLine(id){
  const n=b=>inB(id,b).length,p=[];
  if(n('now'))p.push(n('now')+' now');if(n('delegated'))p.push(n('delegated')+' delegated');if(n('queue'))p.push(n('queue')+' in queue');
  const parked=n('later')+n('unscheduled')+n('notprio');if(parked)p.push(parked+' parked');
  return p.join(' · ')||'—'}
function attention(){
  const out=[];
  S.items.filter(open).forEach(i=>{
    if(i.due&&i.due<today())out.push({i,k:'late',w:'Late',t:i.title,why:`${-daysTo(i.due)} days past its deadline`});
    else if(late(i))out.push({i,k:'late',w:'Follow up',t:i.title,why:`check back with ${i.wait.who||'them'} — due ${dueLabel(i.wait.checkBack).t}`});
    else if(stuckWhy(i))out.push({i,k:'stuck',w:'Stuck',t:i.title,why:stuckWhy(i)});
    else if(i.due&&daysTo(i.due)<=7&&i.stakes===3&&i.state!=='week')out.push({i,k:'sort',w:'Can’t undo',t:i.title,why:`due ${dueLabel(i.due).t} — not on your list`});
  });
  S.cycles.filter(cycDue).forEach(c=>out.push({c,k:'quiet',w:'Coming up',t:c.title,why:`${dueLabel(c.nextDue).late?'overdue':'due '+dueLabel(c.nextDue).t} · ${cycEvery(c)} · ${(dept(c.dept)||{}).name}`}));
  return out.sort((a,b)=>({late:0,stuck:1,sort:2,quiet:3}[a.k])-({late:0,stuck:1,sort:2,quiet:3}[b.k]))}
const priorities=()=>inState('week').sort((a,b)=>(isToday(b)-isToday(a))||order(a,b));
function prioText(){const P=priorities();return (S.phrase?'✨ '+S.phrase+'\n\n':'')+'THIS WEEK\n'+(P.map(i=>'☐ '+i.title+(i.due?' ('+dueLabel(i.due).t+')':'')).join('\n')||'—')}
function sig(i){
  if(i.due&&i.due<today())return {t:dueLabel(i.due).t,c:'red'};
  if(late(i))return {t:'check back · '+(i.wait.who||''),c:'red'};
  const s=stuckWhy(i);if(s)return {t:s,c:'amber'};
  if(i.due&&daysTo(i.due)<=7)return {t:'due '+dueLabel(i.due).t,c:i.stakes>=2&&daysTo(i.due)<=2?'red':''};
  if(i.state==='ai')return {t:'AI'};if(i.state==='wife')return {t:'with your wife'};
  if(i.state==='waiting')return {t:(i.wait&&i.wait.who||'waiting')+(i.wait&&i.wait.checkBack?' · check '+dueLabel(i.wait.checkBack).t:'')};
  if(i.state==='later'&&i.back)return {t:(i.back<=today()?'back now':'back '+short(i.back))};
  if(isToday(i))return {t:'today'};
  if(i.stakes===3)return {t:'can’t undo'};
  return null}
function row(i,o={}){const d=dept(i.dept),s=sig(i);
  return `<button class="it ${i.state==='done'?'done':''}" data-open="${i.id}">${o.area?`<span class="dot" style="--c:${d?d.color:'#B8BCC6'}"></span>`:''}<span class="t">${esc(i.title)}</span>${s?`<span class="m ${s.c||''}">${esc(s.t)}</span>`:''}</button>`}
function bucketBlock(id,b,o={}){
  const B=BUCKETS.find(x=>x.id===b),L=inB(id,b),max=o.max||99,key='bb'+id+b;
  if(!L.length&&o.hideEmpty)return '';
  return `<div class="bk ${b}"><div class="bk-h"><span class="l">${B.name}</span><span class="c">${L.length}</span><span class="h">${B.hint}</span></div>
    ${L.length?(EXP[key]?L:L.slice(0,max)).map(i=>row(i)).join('')+(L.length>max?`<button class="more" data-exp="${key}">${EXP[key]?'show less':'+ '+(L.length-max)+' more'}</button>`:''):'<div class="bk-e">—</div>'}</div>`}
const EXP={};
function areaExtras(id){
  const cyc=S.cycles.filter(c=>c.dept===id&&!c.retired).sort((a,b)=>a.nextDue<b.nextDue?-1:1);
  const done=S.items.filter(i=>i.dept===id&&i.state==='done').sort((a,b)=>b.doneAt-a.doneAt).slice(0,6);
  return `<div class="bk"><div class="bk-h"><span class="l">Almanac</span><span class="c">${cyc.length}</span><span class="h">recurring</span></div>
      ${cyc.map(c=>{const l=dueLabel(c.nextDue),it=cycItem(c);return `<div class="cyc"><span class="t">↻ ${esc(c.title)}</span><span class="m ${l.late?'red':''}">${it?SN[it.state]:cycDue(c)?'coming up · '+l.t:cycEvery(c)}</span>
        ${!it&&cycDue(c)?`<button class="btn sm" data-cplant="${c.id}">+ now</button>`:''}</div>`}).join('')||'<div class="bk-e">Nothing recurring.</div>'}</div>
    <div class="bk"><div class="bk-h"><span class="l">Reference card</span></div><div style="padding:0 12px"><textarea class="ref" data-ref="${id}" placeholder="Standing facts — names, renewal months, sizes, who to call">${esc(S.depts[id].ref)}</textarea></div></div>
    <div class="bk"><div class="bk-h"><span class="l">Done</span><span class="c">${done.length}</span></div>${done.map(i=>row(i)).join('')||'<div class="bk-e">Nothing finished yet.</div>'}</div>`}

/* ======================= NAV (one bar) ======================= */
const weekStart=()=>{const d=new Date(today()+'T00:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()};
const roundDone=()=>!!S.lastRound&&S.lastRound>=weekStart();
const overdueW=()=>inState('waiting').filter(late);
function navHTML(){
  const od=overdueW().length;
  const t=(p,l,n,red,attr)=>`<button class="tab ${S.page===p?'on':''}" ${attr||`data-page="${p}"`}>${l}${n!=null?`<span class="n ${red?'red':''}">${n}</span>`:''}</button>`;
  return `${t('hall','Town Hall')}${t('map','Town Map')}<span class="navsep"></span><span class="navlabel">Inboxes</span>
    ${t('','To sort',poolDue().length,0,'data-rit="clear"')}${t('','AI queue',inState('ai').length,0,'data-rit="ai"')}${t('waiting','Waiting',inState('waiting').length,od)}
    <label class="cap"><input id="cap" placeholder="Something on your mind? → queue"><span>⏎</span></label>`}

/* ======================= RITUAL CARDS (state-aware) ======================= */
function ritState(){
  const q=poolDue().length,ai=inState('ai').length,aiOld=inState('ai').filter(stuckWhy).length,od=overdueW().length,tod=S.items.filter(isToday).length;
  const L=[
    {k:'round',name:S.rit&&S.rit.kind==='round'?'Continue the round':'Weekly round',line:roundDone()?`done ${daysSince(S.lastRound)<1?'today':daysSince(S.lastRound)+' days ago'} · ${inState('week').length} priorities`:`due · last one ${S.lastRound?daysSince(S.lastRound)+' days ago':'never'}`,need:!roundDone(),icon:'↻'},
    {k:'clear',name:'Clear the queue',line:q?q+' waiting to be sorted':'nothing to sort',need:q>0,icon:'⇣',n:q},
    {k:'move',name:'Today’s move',line:tod?tod+' on today':(S.dayDate===today()?'nothing picked yet':'plan today in 2 minutes'),need:roundDone()&&!tod,icon:'☀'},
    {k:'ai',name:'AI round',line:ai?ai+' to hand off'+(aiOld?' · '+aiOld+' over a week':''):'nothing to hand off',need:ai>0,icon:'✦',n:ai,warn:aiOld},
    {k:'follow',name:'Follow up',line:od?od+' overdue':'nobody overdue',need:od>0,icon:'↩',n:od,warn:od}];
  const order=['round','clear','move','ai','follow'],next=order.map(k=>L.find(x=>x.k===k)).find(x=>x.need)||L.find(x=>x.k==='move');
  return {L,next}}
const ritAttr=r=>r.k==='follow'?'data-page="waiting"':`data-rit="${r.k}"`;

/* ======================= PRIORITIES (summary, not a task list) ======================= */
function prioPanel(o={}){
  if(!roundDone()&&!S.peekPrio)return `<div class="pp-empty"><div class="mono">Priorities</div>
    <div class="big serif">Your priorities appear<br>after the weekly round.</div>
    <div class="note">Dump, sort, decide — then this week’s list lands here, ready to copy.</div>
    <div style="display:flex;gap:10px;margin-top:18px;align-items:center"><button class="btn hot" data-rit="round">↻ Start the weekly round</button><button class="link" data-peek="1">peek at last week’s list</button></div></div>`;
  const P=priorities(),top=P.slice(0,o.top||3),rest=P.slice(o.top||3);
  const byA=[...DEPTS,NODEPT].map(d=>({d,n:rest.filter(i=>(i.dept||null)===d.id).length})).filter(x=>x.n);
  return `<div class="pp"><div class="pp-h"><span class="mono">${roundDone()?'This week’s priorities':'Last week’s list'}</span><span class="pp-n">${P.length}</span><span class="grow"></span><button class="btn sm" data-copy="1">⧉ Copy the list</button></div>
    ${S.phrase?`<div class="pp-phr" data-phrase="1">✨ ${esc(S.phrase)}</div>`:''}
    <div class="pp-top">${top.map((i,k)=>{const d=dept(i.dept),s=sig(i);return `<button class="pp-i" data-open="${i.id}"><span class="k">${k+1}</span><span class="t">${esc(i.title)}</span>
      <span class="a"><span class="dot" style="--c:${d?d.color:'#bbb'}"></span>${d?d.name:'Unsorted'}${s?` · <b class="${s.c||''}">${esc(s.t)}</b>`:''}</span></button>`}).join('')}</div>
    ${rest.length?`<div class="pp-rest"><span class="note">and ${rest.length} more —</span>${byA.map(x=>`<span class="pp-c"><span class="dot" style="--c:${x.d.color}"></span>${x.d.name} ${x.n}</span>`).join('')}</div>`:''}
    ${!roundDone()?`<button class="link" data-peek="0" style="margin-top:10px">hide — run the round first</button>`:''}</div>`}
function attPanel(max){
  const A=attention();
  return `<div class="ap"><div class="mono">Needs your attention</div>${A.length?A.slice(0,max).map(a=>`<button class="ap-i st-${a.k}" ${a.i?`data-open="${a.i.id}"`:`data-cyc="${a.c.id}"`}><span class="w">${a.w}</span><span class="t">${esc(a.t)}</span><span class="why">${esc(a.why)}</span></button>`).join('')
    +(A.length>max?`<button class="link" data-page="map" style="margin-top:6px">+ ${A.length-max} more on the map</button>`:''):'<div class="note" style="margin-top:8px">Nothing late or stuck. Every area is moving.</div>'}</div>`}
function areasPanel(){
  return `<div class="arp"><div class="arp-h"><span class="mono">How your areas are doing</span><button class="link" data-page="map">open the map →</button></div>
    ${areasByNeed().map(d=>{const h=health(d.id);return `<button class="arp-i" data-area="${d.id}" title="${ctxLine(d.id)}"><span class="n"><span class="dot" style="--c:${d.color}"></span>${d.name}</span><span class="st st-${h.k}"><span class="sdot"></span>${h.t}</span><span class="ctx">${ctxLine(d.id)}</span></button>`}).join('')}</div>`}

/* ======================= TOWN HALL ×3 ======================= */
function hallStage(){ /* 1 · Ritual stage: a black band of rituals across the top */
  const {L,next}=ritState();
  return `<div class="hall h1"><div class="band">${L.map(r=>`<button class="rc ${r===next?'next':''} ${r.need?'':'calm'}" ${ritAttr(r)}>
      <span class="ic">${r.icon}</span><span class="nm">${r.name}</span><span class="ln ${r.warn?'warn':''}">${r.line}</span>${r===next?'<span class="go">Start ⏎</span>':''}</button>`).join('')}</div>
    <div class="h1-grid"><div class="panel big">${prioPanel()}</div><div class="panel">${areasPanel()}</div><div class="panel">${attPanel(4)}</div></div></div>`}
function hallSidebar(){ /* 2 · Dark ritual column on the left, dashboard on the right */
  const {L,next}=ritState();
  return `<div class="hall h2"><aside class="dark"><div class="mono">Rituals</div>
      ${L.map(r=>`<button class="dr ${r===next?'next':''}" ${ritAttr(r)}><span class="ic">${r.icon}</span><span><b>${r.name}</b><small class="${r.warn?'warn':''}">${r.line}</small></span>${r.n?`<em>${r.n}</em>`:''}</button>`).join('')}
      <div class="dk-foot">${S.phrase?`<div class="dk-phr" data-phrase="1">✨ ${esc(S.phrase)}</div>`:'<button class="link" data-phrase="1" style="color:#9aa">set the week’s one thing</button>'}</div></aside>
    <div class="h2-main"><div class="panel big">${prioPanel()}</div><div class="panel att">${attPanel(2)}</div><div class="panel ars">${areasPanel()}</div></div></div>`}
function hallHero(){ /* 3 · One hero: the ritual you should do next */
  const {L,next}=ritState(),others=L.filter(r=>r!==next);
  const sub={round:'Dump, sort, decide. About 12 minutes.',clear:'One card at a time — where it lives, who does it.',move:'Time free today, then pick from the week.',ai:'Copy, send, mark sent. Watch the queue empty.',follow:'Nudge them or close it.'}[next.k];
  return `<div class="hall h3"><div class="hero3"><button class="hb" ${ritAttr(next)}><span class="mono">Next ritual</span><span class="nm">${next.icon} ${next.name}</span><span class="sub">${sub}</span><span class="ln">${next.line}</span><span class="go">Start <kbd>⏎</kbd></span></button>
      <div class="hs">${others.map(r=>`<button class="hsr ${r.need?'':'calm'}" ${ritAttr(r)}><span class="ic">${r.icon}</span><b>${r.name}</b><small class="${r.warn?'warn':''}">${r.line}</small></button>`).join('')}</div></div>
    <div class="h3-row"><div class="panel">${prioPanel({top:3})}</div><div class="panel">${attPanel(4)}</div><div class="panel">${areasPanel()}</div></div></div>`}

/* ======================= TOWN MAP: the spread ×3 ======================= */
const BCOL={now:['#07805A','#EAF7F0'],delegated:['#5B45D6','#F1EEFD'],queue:['#2F62D9','#ECF2FE'],later:['#8A6420','#FBF5E8'],unscheduled:['#5F6673','#F2F3F5'],notprio:['#8A909C','#F7F8F9']};
function spreadTop(){const list=areasByNeed(),show=S.spreadShow;
  return `<div class="spreadtop"><span class="mono">Show</span>${BUCKETS.map(b=>`<button class="tog ${show[b.id]?'on':''}" data-stog="${b.id}" style="--bc:${BCOL[b.id][0]}"><i></i>${b.name}</button>`).join('')}
    <button class="tog ${show.extras?'on':''}" data-stog="extras" style="--bc:#15171C"><i></i>Almanac & ref</button>
    <span class="grow"></span><span class="mono">Jump</span><select class="fld" data-jumpsel="1" style="padding:6px 10px;font-size:14px">${list.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select>
    <span class="note">← → to scroll</span></div>`}
function colHead(d){const h=health(d.id);return `<div class="ch"><div class="n"><span class="dot" style="--c:${d.color}"></span>${d.name}</div><div class="st st-${h.k}"><span class="sdot"></span> ${h.t}</div></div>`}
function irow(i){const s=sig(i);return `<button class="ir" data-open="${i.id}"><span class="t">${esc(i.title)}</span>${s&&s.t!=='today'&&s.t!=='AI'?`<span class="m ${s.c||''}">${esc(s.t)}</span>`:isToday(i)?'<span class="m tod">today</span>':i.state==='ai'?'<span class="m">AI</span>':''}</button>`}
/* A · tinted blocks; empty ones shrink to a line */
function mapBlocks(){const list=areasByNeed(),show=S.spreadShow;
  return spreadTop()+`<div class="spread sA" id="spread">${list.map(d=>`<div class="scol" id="col-${d.id}">${colHead(d)}
    ${BUCKETS.filter(b=>show[b.id]).map(b=>{const L=inB(d.id,b.id),[c,bg]=BCOL[b.id];
      return L.length?`<div class="blk" style="--bc:${c};--bg:${bg}"><div class="bh"><span>${b.name}</span><b>${L.length}</b></div>${L.map(irow).join('')}</div>`
        :`<div class="blk0" style="--bc:${c}"><span>${b.name}</span><b>none</b></div>`}).join('')}
    ${show.extras?`<div class="blk" style="--bc:#15171C;--bg:#FAFAFA">${areaExtras(d.id)}</div>`:''}
    <input class="addin" data-add="${d.id}" placeholder="Add to ${esc(d.name)} — ⏎"></div>`).join('')}</div>`}
/* B · aligned bands: the same bucket sits on the same line across every area */
function mapBands(){const list=areasByNeed(),show=S.spreadShow,B=BUCKETS.filter(b=>show[b.id]);
  return spreadTop()+`<div class="bandsWrap" id="spread"><div class="bands" style="grid-template-columns:150px repeat(${list.length},380px)">
    <div class="bl corner"></div>${list.map(d=>`<div class="bhd" id="col-${d.id}">${colHead(d)}</div>`).join('')}
    ${B.map(b=>{const [c,bg]=BCOL[b.id];return `<div class="bl" style="--bc:${c};--bg:${bg}"><span>${b.name}</span><small>${b.hint}</small></div>
      ${list.map(d=>{const L=inB(d.id,b.id);return `<div class="bc" style="--bc:${c};--bg:${bg}">${L.length?L.map(irow).join(''):'<span class="none">—</span>'}</div>`}).join('')}`}).join('')}
    ${show.extras?`<div class="bl"><span>Almanac · ref</span></div>${list.map(d=>`<div class="bc">${areaExtras(d.id)}</div>`).join('')}`:''}
    <div class="bl"></div>${list.map(d=>`<div class="bc plain"><input class="addin" data-add="${d.id}" placeholder="Add to ${esc(d.name)} — ⏎"></div>`).join('')}
  </div></div>`}
/* C · Now leads; the rest fold into count rows you open in place */
function mapFold(){const list=areasByNeed(),show=S.spreadShow;S.fold=S.fold||{};
  return spreadTop()+`<div class="spread sC" id="spread">${list.map(d=>{const now=inB(d.id,'now');
    return `<div class="scol" id="col-${d.id}">${colHead(d)}
      ${show.now?`<div class="nowbox"><div class="bh"><span>Now</span><b>${now.length}</b></div>${now.map(irow).join('')||'<div class="none">nothing of yours this week</div>'}</div>`:''}
      ${BUCKETS.filter(b=>b.id!=='now'&&show[b.id]).map(b=>{const L=inB(d.id,b.id),[c,bg]=BCOL[b.id],k=d.id+b.id,o=S.fold[k];
        return `<div class="fold ${o?'open':''} ${L.length?'':'zero'}" style="--bc:${c};--bg:${bg}"><button class="fh" ${L.length?`data-fold="${k}"`:''}><span class="cnt">${L.length}</span><span class="l">${b.name}</span>
          ${!o&&L.length?`<span class="peek">${esc(L[0].title)}${L.length>1?' …':''}</span>`:''}<span class="chev">${L.length?(o?'−':'+'):''}</span></button>${o?L.map(irow).join(''):''}</div>`}).join('')}
      ${show.extras?`<div class="fold open" style="--bc:#15171C;--bg:#FAFAFA">${areaExtras(d.id)}</div>`:''}
      <input class="addin" data-add="${d.id}" placeholder="Add to ${esc(d.name)} — ⏎"></div>`}).join('')}</div>`}

/* ======================= WAITING (never goes stale) ======================= */
function pageWaiting(){
  const L=inState('waiting').sort((a,b)=>(late(b)-late(a))||((a.wait.checkBack||'9')<(b.wait.checkBack||'9')?-1:1));
  const od=L.filter(late).length;
  return `<div class="page"><div class="ib"><h1>Waiting</h1><div class="lede">The ball is with someone else. Every item has a check-back day — when it comes, follow up or close it.${od?` <b style="color:var(--late)">${od} overdue.</b>`:''}</div>
    ${L.length?`<div class="whead"><span>What</span><span>Who has it</span><span>Since</span><span>Check back</span><span></span></div>`:''}
    ${L.map(i=>{const w=i.wait,d=dept(i.dept),lt=late(i),n=-daysTo(w.checkBack);return `<div class="wrow ${lt?'over':''}"><div class="t" data-open="${i.id}">${esc(i.title)}<small><span class="dot" style="--c:${d?d.color:'#bbb'}"></span>${d?d.name:''}</small></div>
      <span class="c">${w.who==='Wife'?'💛 Wife':w.who==='Claude'?'✦ Claude':esc(w.who||'—')}</span><span class="c">${w.since?short(w.since):'—'}</span>
      <span class="c ${lt?'red':''}"><input type="date" class="fld" data-cb="${i.id}" value="${w.checkBack}" style="padding:5px 8px;font-size:13.5px;${lt?'border-color:#F4C7C3;color:var(--late)':''}">${lt?`<small style="display:block">${n>1?n+' days overdue':n===1?'1 day overdue':'due today'}</small>`:''}</span>
      <div class="acts"><button class="btn sm ${lt?'hot':''}" data-nudge="${i.id}">${w.who==='Wife'?'Nudge on WhatsApp':'Nudged'} → +${w.who==='Wife'?2:3}d</button><button class="btn sm" data-land="${i.id}">Landed ✓</button><button class="btn sm ghost" data-mv2="${i.id}:week">Back to me</button></div></div>`}).join('')
      ||'<div class="empty"><h3>Nobody has the ball.</h3></div>'}</div></div>`}

/* ======================= WIFE: ask her right away ======================= */
const waLink=t=>`https://wa.me/${(S.wifePhone||'').replace(/\D/g,'')}?text=${encodeURIComponent(t)}`;
function toWaiting(i,who,days){snap([i.id]);move(i,'waiting');i.wait={who,since:today(),checkBack:addDays(days)};save()}
function wifeFlow(i,after){LAYER={k:'wife',id:i.id};
  const msg=`Oi amor! Você consegue me ajudar com isso? → ${i.title}${i.notes?` (${i.notes})`:''}`;
  sheet(`<div class="mono" style="color:#D01884">💛 Ask your wife</div><div class="ttl" style="margin:6px 0 14px">${esc(i.title)}</div>
    <textarea class="fld" id="wmsg" rows="4" style="font-size:16px">${esc(msg)}</textarea>
    <div class="row2" style="margin-top:12px"><span class="note">Her WhatsApp</span><input class="fld" id="wphone" placeholder="+55 11 9…  (saved once)" value="${esc(S.wifePhone||'')}" style="width:220px"></div>
    <div class="foot" style="margin-top:18px"><button class="btn hot" id="wsend">Send on WhatsApp ↗</button><button class="btn" id="wperson">I asked her in person</button><span class="grow"></span><span class="note">→ Waiting · check back in 2 days</span></div>`);
  const Ly=ROOT.getElementById('layer'),done=()=>{toWaiting(i,'Wife',2);closeLayer();toast('asked → Waiting · check back '+dueLabel(addDays(2)).t,true);if(after)after()};
  Ly.querySelector('#wphone').oninput=e=>{S.wifePhone=e.target.value;save()};
  Ly.querySelector('#wsend').onclick=()=>{window.open(waLink(Ly.querySelector('#wmsg').value),'_blank');done()};
  Ly.querySelector('#wperson').onclick=done;
  setTimeout(()=>Ly.querySelector('#wmsg').focus(),30)}


/* ======================= RITUALS ======================= */
const RIT={
  round:{name:'Weekly round',steps:[
    ['phrase','What would make this week good?','One thing. Not chores — the thing that would make this week good, not just handled.'],
    ['dump','Empty your head','Everything personal, one line each. Press ⏎ after every one. No sorting yet.'],
    ['sort','Sort the dump','One key each — which area of your life does it belong to?'],
    ['rounds','Rounds','Area by area. Rate it, then decide: yours, handed off, not now — or close it.'],
    ['size','Size this week','How long will each one really take? Anything that takes 60 seconds — do it now.'],
    ['paper','Copy it down','Take the list with you. Then close this and get on with the week.'],
    ['done','Round done','']]},
  move:{name:'Today’s move',steps:[
    ['spark','Morning pages first','However it is actually going. Write in Spark, then come back here.'],
    ['time','How much time do you have today?','Be honest. Zero is a fine answer.'],
    ['pick','What goes on today?','Pick from this week. Everything else stays on the list for another day.'],
    ['plate','That’s today','Copy it and go.'],['done','Today is set','']]},
  clear:{name:'Clear the queue',steps:[['clear','Clear the queue','One at a time: where it lives, what’s at stake, who does it.'],['done','Queue cleared','']]},
  ai:{name:'AI round',steps:[['aiq','AI round','Copy it, send it, mark it sent. Watch the queue empty.'],['done','Handed off','']]}};
const VERD=[['week','W','Mine this week'],['ai','A','🤖 Give to AI'],['wife','F','💛 Ask your wife'],['waiting','S','👤 Someone else has it'],['later','L','📅 Not now'],['done','D','✓ Already done'],['dropped','X','✕ Let it go']];
const TSAID={sent:'sent to AI',mine:'taken back',sorted:'sorted',week:'this week',ai:'to AI',wife:'to your wife',waiting:'waiting',later:'not now',done:'done',dropped:'let go',sized:'sized',planted:'from the almanac'};
let RCLOCK=null;
function startRit(kind){
  if(!S.rit||S.rit.kind!==kind)S.rit={kind,step:0,started:Date.now(),tally:{},just:[],di:0,skipped:[]};
  S.rit.open=true;if(kind==='round'&&!S.rit.started)S.rit.started=Date.now();save();drawRit(true)}
function pauseRit(){if(!S.rit)return;S.rit.open=false;save();drawRit();render();toast('paused — it picks up right here')}
function endRit(){const k=S.rit.kind;if(k==='round')S.lastRound=Date.now();S.peekPrio=0;S.rit=null;save();drawRit();render();
  toast(k==='round'?'Good week. Your priorities are on the Town Hall.':k==='move'?'That’s today.':k==='ai'?'Handed off.':'Queue cleared.')}
function tal(k){S.rit.tally[k]=(S.rit.tally[k]||0)+1;S.rit.lastTal=k}
const R=()=>S.rit,RS=()=>RIT[S.rit.kind].steps[S.rit.step];
function goStep(n){S.rit.step=Math.max(0,Math.min(RIT[S.rit.kind].steps.length-1,n));S.rit.di=0;S.rit.skipped=[];S.rit.just=S.rit.just||[];save();drawRit(true)}
/* queues */
const sortQ=()=>S.items.filter(i=>i.state==='inbox'&&!i.dept&&!R().skipped.includes(i.id)).sort((a,b)=>a.created-b.created);
function roundAreas(){return DEPTS.filter(d=>S.items.some(i=>i.dept===d.id&&BUCKETS[2].test(i))||S.cycles.some(c=>c.dept===d.id&&cycDue(c))||(R().visited||[]).includes(d.id))}
function areaQ(id){return [...S.cycles.filter(c=>c.dept===id&&cycDue(c)&&!R().skipped.includes(c.id)).map(c=>({c})),
  ...S.items.filter(i=>i.dept===id&&BUCKETS[2].test(i)&&!R().skipped.includes(i.id)).sort(order).map(i=>({i}))]}
const sizeQ=()=>inState('week').filter(i=>!i.size&&!i.home&&!R().skipped.includes(i.id)).sort(order);
const clearQ=()=>poolDue().filter(i=>!R().skipped.includes(i.id));
const aiQ=()=>inState('ai').filter(i=>!R().skipped.includes(i.id)).sort(order);

function railHTML(){
  const r=R(),def=RIT[r.kind],steps=def.steps.filter(s=>s[0]!=='done'),T=Object.entries(r.tally).filter(([,n])=>n);
  const total=T.reduce((n,[,v])=>n+v,0);
  return `<div class="r-rail"><div class="r-kind">Ritual</div><div class="r-title">${def.name}</div>
    <div class="r-clock" id="rclock">00:00</div><div class="note">${r.kind==='round'?'most rounds take 10–15 minutes':r.kind==='move'?'about 2 minutes':r.kind==='ai'?'a minute per card':'one at a time'}</div>
    ${steps.length>1?`<div class="r-steps">${steps.map((s,k)=>`<button class="r-step ${k<r.step?'done':k===r.step?'now':''}" data-rgo="${k}"><span class="b">${k<r.step?'✓':k+1}</span>${s[0]==='rounds'?'Rounds':s[1].replace('What would make this week good?','The week’s one thing').replace('How much time do you have today?','Time today').replace('What goes on today?','Pick today')}</button>`).join('')}</div>`:''}
    <div class="r-tally"><div class="mono">This ${r.kind==='move'?'morning':'session'}</div><div class="big">${total||'—'}</div>
      <div class="tl">${T.map(([k,n])=>`<span class="${k===r.lastTal?'pop':''}">${n} ${TSAID[k]||k}</span>`).join('')||'<span>decisions show up here</span>'}</div></div>
    <button class="r-pause" data-rpause="1">Pause · esc</button></div>`}
function verdTiles(){return `<div class="r-tiles">${VERD.map(([s,k,l])=>`<button class="r-tile ${s==='week'?'primary':''}" data-rv="${s}"><kbd>${k}</kbd>${l}</button>`).join('')}<button class="r-tile" data-rskip="1"><kbd>→</kbd>Skip</button></div>`}
function stakeTiles(i){return `<div class="r-tiles">${STAKES.map((s,k)=>`<button class="r-tile ${i.stakes===s.v?'on':''}" data-rstake="${s.v}" style="--tc:${s.color}"><kbd>${k+1}</kbd><span class="d"></span>${s.name}</button>`).join('')}</div>`}
function deptTiles(i){return `<div class="r-tiles">${DEPTS.map((d,k)=>`<button class="r-tile ${i&&i.dept===d.id?'on':''}" data-rdept="${d.id}" style="--tc:${d.color}"><kbd>${k+1}</kbd><span class="d"></span>${d.name}</button>`).join('')}</div>`}

function stageHTML(){
  const r=R(),[id,name,note]=RS(),steps=RIT[r.kind].steps;
  let body='',cta='Next',hint='',back=r.step>0&&id!=='done',nm=name,eyebrow=`${RIT[r.kind].name} · step ${r.step+1} of ${steps.length-1}`,long=false;
  if(WST[id]){const w=WST[id](r);body=w.body;cta=w.cta||cta;hint=w.hint||'';if(w.nm)nm=w.nm}
  if(steps.length<=2)eyebrow=RIT[r.kind].name;
  if(id==='phrase'){body=`<input class="r-phrase" id="rphrase" value="${esc(S.phrase||'')}" placeholder="Play with the kids on Saturday" autocomplete="off">
      <div class="note" style="margin-top:12px">It sits at the top of the Town Hall all week.</div>`;cta=S.phrase?'That’s the week':'Skip for now';hint='type · ⏎ to continue'}
  if(id==='dump'){const J=r.just||[];
    body=`<textarea class="r-dump" id="rdump" rows="1" placeholder="Renew the car insurance…"></textarea>
      <div class="caught">${J.length?`<div class="mono">Caught — ${J.length}</div><div class="list">${J.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:`<div class="note">${S.items.filter(i=>i.state==='inbox'&&!i.dept).length} already waiting to be sorted.</div>`}</div>`;
    cta=J.length?'Done dumping':'Nothing to add';hint='⏎ catches a line · ⌘⏎ when you’re done'}
  if(id==='sort'||id==='clear'){
    const Q=id==='sort'?sortQ():clearQ(),i=Q[0],tot=(r.qtotal=r.qtotal||Q.length);
    if(!r.qtotal||Q.length>r.qtotal)r.qtotal=Q.length+(r.tally.sorted||0);
    if(!i){body=`<div class="r-clear"><b>${id==='sort'?'All sorted.':'Queue is clear.'}</b><p>${id==='sort'?'Every thought has a home. Next, the rounds.':'Nothing left to decide.'}</p></div>`;cta=id==='sort'?'Next: rounds':'Finish'}
    else{const d=dept(i.dept);
      body=`<div class="deck ${Q.length<2?'single':''}"><div class="r-card" id="rcard"><div class="from">${i.state==='later'?'↩ Back from “not now”':'From your dump'}${d?` · <span class="dot" style="--c:${d.color}"></span>${d.name}`:''}<span class="cnt">${Q.length} left</span></div>
        <h3 contenteditable="true" data-rtitle="${i.id}">${esc(i.title)}</h3><div class="meta">${i.due?'due '+dueLabel(i.due).t:'no deadline'}</div>
        ${id==='sort'?`<div class="q">Which area?</div>${deptTiles(i)}<div class="r-after"><button class="r-tile" data-rskip="1" style="padding:8px 12px"><kbd>→</kbd>Skip</button><button class="r-tile" data-rdel="1" style="padding:8px 12px"><kbd>⌫</kbd>Not a task — delete</button></div>`
          :`${!i.dept?`<div class="q">Which area?</div>${deptTiles(i)}`:''}<div class="q">If it slips a week, can you still fix it later?</div>${stakeTiles(i)}<div class="q">Who does it?</div>${verdTiles()}`}</div></div>
        ${id==='sort'&&(r.tally.sorted||0)?`<div class="r-after"><span class="mono">Sorted</span>${S.items.filter(x=>(r.sortedIds||[]).includes(x.id)).slice(-8).map(x=>`<span>${esc(x.title)} → ${(dept(x.dept)||{}).name}</span>`).join('')}</div>`:''}`;
      cta=id==='sort'?'Leave the rest for later':'Stop here';hint=id==='sort'?'1–9 picks the area · → skips · ⌫ deletes':(!i.dept?'1–9 area · ':'')+'then W A F S L D X'}}
  if(id==='aiq'){const Q=aiQ(),i=Q[0];
    if(!i)body=`<div class="r-clear"><b>The AI queue is empty.</b><p>Everything is handed off — it waits in Waiting until it lands.</p></div>`;
    else{const d=dept(i.dept);body=`<div class="deck ${Q.length<2?'single':''}"><div class="r-card" id="rcard"><div class="from"><span class="dot" style="--c:${d?d.color:'#bbb'}"></span>${d?d.name:'Unsorted'}${stuckWhy(i)?' · <span style="color:var(--stuck)">'+stuckWhy(i)+'</span>':''}<span class="cnt">${Q.length} to go</span></div>
      <h3>${esc(i.title)}</h3><textarea class="r-instr" data-rinstr="${i.id}">${esc(instr(i))}</textarea>
      <div class="r-tiles" style="margin-top:14px"><button class="r-tile" data-rai="copy"><kbd>C</kbd>⧉ Copy</button><button class="r-tile" data-rai="open"><kbd>O</kbd>Open in Claude ↗</button>
        <button class="r-tile primary" data-rai="sent"><kbd>S</kbd>Sent → Waiting</button><button class="r-tile" data-rai="mine"><kbd>M</kbd>I’ll do it myself</button><button class="r-tile" data-rai="drop"><kbd>X</kbd>✕ Drop it</button><button class="r-tile" data-rskip="1"><kbd>→</kbd>Skip</button></div></div></div>`}
    cta=i?'Stop here':'Finish';hint=i?'C copy · O open Claude · S sent · M mine · X drop':''}
  if(id==='rounds'){
    const A=roundAreas();r.visited=r.visited||[];
    const a=A[r.di];
    if(!a){nm='Every area is clear';body=`<div class="r-clear"><b>Nothing left to decide.</b><p>Nobody to chase, nothing new. On to sizing.</p></div>`;cta='Next'}
    else{if(!r.visited.includes(a.id))r.visited.push(a.id);
      const Q=areaQ(a.id),x=Q[0],nx=A[r.di+1];nm=a.name;long=false;
      eyebrow+=` · area ${r.di+1} of ${A.length}`;
      const prog=`<div class="areas-prog">${A.map((z,k)=>`<span class="${k<r.di?'done':k===r.di?'now':''}"><span class="dot" style="--c:${z.color};width:7px;height:7px"></span>${z.name}${k<r.di?' ✓':''}</span>`).join('')}</div>`;
      const also=`<div class="r-also">Also in ${esc(a.name)}: <b>${inB(a.id,'now').length}</b> now · <b>${inB(a.id,'delegated').length}</b> delegated · <b>${inB(a.id,'later').length+inB(a.id,'unscheduled').length+inB(a.id,'notprio').length}</b> parked</div>`;
      if(!x)body=prog+`<div class="r-clear"><b>${esc(a.name)} is clear.</b><p>${nx?'Next up: '+nx.name+'.':'That was the last area.'}</p>
          <input class="addin" data-radd="${a.id}" placeholder="Anything else for ${esc(a.name)}? ⏎" style="margin-top:18px;font-size:16px;padding:12px 14px"></div>${also}`;
      else if(x.c){const c=x.c;body=prog+`<div class="deck ${Q.length<2?'single':''}"><div class="r-card" id="rcard"><div class="from">↻ From the almanac · ${cycEvery(c)}<span class="cnt">${Q.length} in ${esc(a.name)}</span></div>
          <h3>${esc(c.title)}</h3><div class="meta">${dueLabel(c.nextDue).late?'overdue — was due '+dueLabel(c.nextDue).t:'due '+dueLabel(c.nextDue).t}</div>
          <div class="r-tiles"><button class="r-tile primary" data-rcyc="plant"><kbd>W</kbd>Put it on this week</button><button class="r-tile" data-rcyc="did"><kbd>D</kbd>✓ Already did it</button><button class="r-tile" data-rskip="1"><kbd>→</kbd>Not yet</button></div></div></div>${also}`}
      else{const i=x.i;body=prog+`<div class="deck ${Q.length<2?'single':''}"><div class="r-card" id="rcard"><div class="from">${i.state==='later'?'↩ Back from “not now”':'In the queue'}<span class="cnt">${Q.length} in ${esc(a.name)}</span></div>
          <h3 contenteditable="true" data-rtitle="${i.id}">${esc(i.title)}</h3><div class="meta">${i.due?'due '+dueLabel(i.due).t:'no deadline'}${i.notes?' · '+esc(i.notes):''}</div>
          <div class="q">If it slips a week, can you still fix it later?</div>${stakeTiles(i)}<div class="q">Who does it?</div>${verdTiles()}</div></div>${also}`}
      cta=x?'Skip the rest of '+a.name:(nx?'Next: '+nx.name:'Done with the rounds');hint=x?(x.c?'W puts it on this week · D did it · → not yet':'1 2 3 rate · W A F S L D X decide · → skip'):'⏎ next area'}}
  if(id==='size'){const Q=sizeQ(),i=Q[0];
    if(!i)body=`<div class="r-clear"><b>All sized.</b><p>${inState('week').length} things this week.</p></div>`;
    else body=`<div class="deck ${Q.length<2?'single':''}"><div class="r-card" id="rcard"><div class="from"><span class="dot" style="--c:${(dept(i.dept)||NODEPT).color}"></span>${(dept(i.dept)||NODEPT).name}<span class="cnt">${Q.length} to size</span></div>
      <h3>${esc(i.title)}</h3><div class="meta">${i.due?'due '+dueLabel(i.due).t:''}</div>
      <div class="r-tiles big">${SIZES.map((s,k)=>`<button class="r-tile" data-rsize="${s.v}"><kbd>${k+1}</kbd>${s.name}</button>`).join('')}<button class="r-tile" data-rsize="home"><kbd>H</kbd>🏠 After work<small>not at the desk</small></button></div>
      <div class="r-after"><button class="r-tile" data-rsize="now" style="padding:10px 14px;--tc:var(--hot)"><kbd>D</kbd>⚡ It’s 60 seconds — I did it now</button><button class="r-tile" data-rskip="1" style="padding:10px 14px"><kbd>→</kbd>Skip</button></div></div></div>`;
    cta=i?'Leave the rest unsized':'Next';hint=i?'1–5 size · H after work · D did it now · → skip':''}
  if(id==='paper'){body=`<div class="paper">${esc(prioText())}</div>`;cta='Close the round';hint='C copies it'}
  if(id==='spark'){body=`<a class="r-tile primary" href="${SPARK_URL}" target="_blank" rel="noopener" style="display:inline-flex;font-size:20px;padding:22px 26px">✍️ Open Spark ↗</a><div class="note" style="margin-top:14px">Then come back and press ⏎.</div>`;cta='I wrote'}
  if(id==='time'){body=`<div class="r-tiles big" style="max-width:860px">${TIMES.map((t,k)=>`<button class="r-tile ${dayMins()===t.v?'on':''}" data-rtime="${t.v}"><kbd>${k}</kbd>${t.name==='0'?'None today':t.name}</button>`).join('')}</div>`;cta='Next';hint='0–4 picks · ⏎ continues'}
  if(id==='pick'||id==='plate'){const W=inState('week').sort(order),T=W.filter(isToday),mins=dayMins(),used=T.filter(i=>!i.home).reduce((n,i)=>n+(i.size||0),0),over=mins&&used>mins;
    const meterH=`<div class="meterbig ${over?'over':''}"><span>${used} min${mins!=null?' of '+(TIMES.find(t=>t.v===mins)||{}).name:''}${T.filter(i=>i.home).length?' · '+T.filter(i=>i.home).length+' after work':''}${over?' — more than today has':''}</span>${mins?`<span class="bar"><i style="width:${Math.min(100,used/mins*100)}%"></i></span>`:''}</div>`;
    if(id==='pick')body=meterH+`<div class="r-tiles">${W.map(i=>`<button class="r-tile ${isToday(i)?'on':''}" data-rpick="${i.id}" style="--tc:var(--hot);align-items:flex-start;flex-direction:column;gap:3px">${esc(i.title)}<small>${(dept(i.dept)||NODEPT).name}${sizeLabel(i)?' · '+sizeLabel(i):''}${i.due?' · due '+dueLabel(i.due).t:''}</small></button>`).join('')}</div>`;
    else body=meterH+`<div class="paper">${esc('TODAY\n'+(T.map(i=>'☐ '+i.title).join('\n')||'—'))}</div>`;
    cta=id==='pick'?'That’s today':'Done';hint=id==='plate'?'C copies it':'click to put on today'}
  if(id==='done'){const T=Object.entries(r.tally).filter(([,n])=>n),secs=Math.floor((Date.now()-r.started)/1000);
    nm=name;body=`<div class="r-done"><div class="big">${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}</div><div class="note" style="font-size:18px">minutes, start to finish.</div>
      <div class="tl">${T.map(([k,n],j)=>`<span style="animation-delay:${j*70}ms">${n} ${TSAID[k]||k}</span>`).join('')}</div>${r.kind==='round'&&S.phrase?`<div class="wk1"><span class="mono">This week is good if</span><b>${esc(S.phrase)}</b></div>`:''}${r.kind==='work'?`<div class="paper" style="margin-top:8px">${esc(wPlanText())}</div>`:''}</div>`;cta='Back to the Town Hall';back=false}
  return `<div class="r-inner"><div class="r-eyebrow">${id==='done'?'✓ Finished':eyebrow}</div><div class="r-name ${long?'long':''}">${esc(nm)}</div>${note?`<div class="r-note">${note}</div>`:''}
    <div class="r-body">${body}</div>
    <div class="r-bar">${back?'<button class="r-back" data-rback="1">← Back</button>':''}<button class="r-go" data-rnext="1">${cta} <kbd>⏎</kbd></button><span class="r-hint">${hint}</span></div></div>`}

function drawRit(focus){
  const el=ROOT.getElementById('rit');
  if(!S.rit||!S.rit.open){el.className='';el.innerHTML='';clearInterval(RCLOCK);RCLOCK=null;return}
  el.className='open';el.innerHTML=railHTML()+`<div class="r-stage" id="rstage">${stageHTML()}</div>`;
  const tick=()=>{const c=ROOT.getElementById('rclock');if(c&&S.rit){const s=Math.floor((Date.now()-S.rit.started)/1000);c.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}};
  tick();if(!RCLOCK)RCLOCK=setInterval(tick,1000);
  wireRit(el,focus);
}
function ritAct(fn){const c=ROOT.getElementById('rcard');if(c){c.classList.add('out');setTimeout(()=>{fn();save();drawRit()},170)}else{fn();save();drawRit()}}
function curItem(){const id=RS()[0],r=R();
  if(id==='sort')return sortQ()[0];if(id==='clear')return clearQ()[0];if(id==='aiq')return aiQ()[0];if(id==='size')return sizeQ()[0];
  if(id==='rounds'){const a=roundAreas()[r.di];if(!a)return null;const x=areaQ(a.id)[0];return x?(x.i||x.c):null}return null}
function ritNext(){
  const r=R(),id=RS()[0];
  if(id==='done'){endRit();return}
  if(id==='rounds'){const A=roundAreas(),a=A[r.di];if(a&&r.di<A.length-1){r.di++;r.skipped=[];S.depts[a.id].lastVisit=Date.now();save();drawRit(true);return}}
  if(id==='clear'||id==='aiq'){goStep(1);return}
  if(id==='plate'||id==='paper'){goStep(r.step+1);return}
  goStep(r.step+1)}
function ritBack(){const r=R();if(RS()[0]==='rounds'&&r.di>0){r.di--;r.skipped=[];save();drawRit(true);return}goStep(r.step-1)}
function verdict(s){const i=curItem();if(!i||!i.state)return;
  if(s==='wife'){wifeFlow(i,()=>{tal('wife');save();drawRit()});return}
  if(s==='waiting'){const who=prompt('Who has it?','');if(who===null)return;ritAct(()=>{toWaiting(i,who||'someone',3);tal('waiting')});return}
  ritAct(()=>{snap([i.id]);move(i,s);tal(s)})}
function aiAct(a){const i=curItem();if(!i||!i.state)return;
  if(a==='copy'){copy(instr(i));return}
  if(a==='open'){copy(instr(i));window.open('https://claude.ai/new?q='+encodeURIComponent(instr(i)),'_blank');return}
  ritAct(()=>{if(a==='sent'){toWaiting(i,'Claude',2);tal('sent')}else if(a==='mine'){snap([i.id]);move(i,'week');tal('mine')}else{snap([i.id]);move(i,'dropped');tal('dropped')}})}
function wireRit(el,focus){
  const q=s=>el.querySelector(s),r=R();
  el.querySelectorAll('[data-rpause]').forEach(b=>b.onclick=pauseRit);
  el.querySelectorAll('[data-rgo]').forEach(b=>b.onclick=()=>goStep(+b.dataset.rgo));
  el.querySelectorAll('[data-rnext]').forEach(b=>b.onclick=ritNext);
  el.querySelectorAll('[data-rback]').forEach(b=>b.onclick=ritBack);
  const ph=q('#rphrase');if(ph){if(focus)ph.focus();ph.oninput=()=>{S.phrase=ph.value;save();q('[data-rnext]').firstChild.textContent=(S.phrase?'That’s the week':'Skip for now')+' '}}
  const dp=q('#rdump');if(dp){dp.focus();dp.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.metaKey&&!e.ctrlKey){e.preventDefault();
      const L=dp.value.split('\n').map(x=>x.trim()).filter(Boolean);if(!L.length)return;L.forEach(t=>{add(t,null,'inbox');r.just.push(t);tal('caught')});save();drawRit()}}}
  el.querySelectorAll('[data-rdept]').forEach(b=>b.onclick=()=>{const i=curItem();if(!i)return;
    if(RS()[0]==='sort')ritAct(()=>{i.dept=b.dataset.rdept;i.movedAt=Date.now();r.sortedIds=[...(r.sortedIds||[]),i.id];tal('sorted')});else{i.dept=b.dataset.rdept;save();drawRit()}});
  el.querySelectorAll('[data-rstake]').forEach(b=>b.onclick=()=>{const i=curItem();if(!i)return;const v=+b.dataset.rstake;i.stakes=i.stakes===v?0:v;save();drawRit()});
  el.querySelectorAll('[data-rv]').forEach(b=>b.onclick=()=>verdict(b.dataset.rv));
  el.querySelectorAll('[data-rai]').forEach(b=>b.onclick=()=>aiAct(b.dataset.rai));
  el.querySelectorAll('[data-rinstr]').forEach(t=>{t.oninput=()=>{byId(t.dataset.rinstr).instr=t.value;save()};t.onkeydown=e=>e.stopPropagation()});
  el.querySelectorAll('[data-rskip]').forEach(b=>b.onclick=()=>{const i=curItem();if(!i)return;ritAct(()=>{r.skipped.push(i.id)})});
  el.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=()=>{const i=curItem();if(!i)return;ritAct(()=>{snap([i.id]);S.items=S.items.filter(x=>x!==i);toast('deleted',true)})});
  el.querySelectorAll('[data-rcyc]').forEach(b=>b.onclick=()=>{const c=curItem();if(!c||c.state)return;ritAct(()=>{const i=tCycPlant(c);tSet(i,'week');
    if(b.dataset.rcyc==='did'){move(i,'done');tal('done')}else tal('planted')})});
  el.querySelectorAll('[data-rsize]').forEach(b=>b.onclick=()=>{const i=curItem();if(!i)return;const v=b.dataset.rsize;
    ritAct(()=>{if(v==='now'){i.size=1;move(i,'done');tal('done')}else{i.home=v==='home';i.size=v==='home'?null:+v;tal('sized')}})});
  el.querySelectorAll('[data-rtime]').forEach(b=>b.onclick=()=>{S.dayMins=+b.dataset.rtime;S.dayDate=today();save();drawRit()});
  el.querySelectorAll('[data-rpick]').forEach(b=>b.onclick=()=>{const i=byId(b.dataset.rpick);i.today=isToday(i)?null:today();if(!i.today)i.day=null;save();drawRit()});
  el.querySelectorAll('[data-radd]').forEach(inp=>inp.onkeydown=e=>{if(e.key==='Enter'&&inp.value.trim()){add(inp.value.trim(),inp.dataset.radd,'inbox');save();drawRit(true)}});
  el.querySelectorAll('[data-rtitle]').forEach(t=>{t.onblur=()=>{const i=byId(t.dataset.rtitle),v=t.textContent.trim();if(i&&v){i.title=v;save()}};t.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();t.blur()}e.stopPropagation()}});
}
function ritKey(e){
  if(!S.rit||!S.rit.open||LAYER)return false;
  const id=RS()[0],typing=/INPUT|TEXTAREA/.test(e.target.tagName)||e.target.isContentEditable;
  if(e.key==='Escape'){pauseRit();return true}
  if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){ritNext();return true}
  if(typing){if(e.key==='Enter'&&(id==='phrase'||id==='wm')){e.preventDefault();ritNext()}return true}
  if(e.key==='Enter'&&id==='sbg'&&curItem()){e.preventDefault();wAct('gdone');return true}
  if(e.key==='Enter'){e.preventDefault();ritNext();return true}
  const k=e.key.toLowerCase(),i=curItem();
  if(WKEY[id]){if(e.key.length===1)e.preventDefault();if(e.key==='ArrowRight'&&i){const sk=ROOT.querySelector('#rit [data-rskip]');if(sk)sk.click();return true}WKEY[id](k,e);return true}
  if(e.key==='ArrowRight'&&i){const sk=ROOT.querySelector('#rit [data-rskip]');if(sk)sk.click();return true}
  if(id==='sort'&&i){if(/^[1-9]$/.test(k)){ROOT.querySelector(`[data-rdept="${DEPTS[+k-1].id}"]`).click()}else if(e.key==='Backspace'){ROOT.querySelector('[data-rdel]').click()}return true}
  if((id==='clear'||id==='rounds')&&i){
    if(i.n!==undefined&&!i.state){if(k==='w')ROOT.querySelector('[data-rcyc="plant"]').click();if(k==='d')ROOT.querySelector('[data-rcyc="did"]').click();return true}
    if(id==='clear'&&!i.dept&&/^[1-9]$/.test(k)){ROOT.querySelector(`[data-rdept="${DEPTS[+k-1].id}"]`).click();return true}
    if(/^[1-3]$/.test(k)){ROOT.querySelector(`[data-rstake="${STAKES[+k-1].v}"]`).click();return true}
    const v=VERD.find(x=>x[1].toLowerCase()===k);if(v){verdict(v[0]);return true}return true}
  if(id==='aiq'&&i){const m={c:'copy',o:'open',s:'sent',m:'mine',x:'drop'}[k];if(m)aiAct(m);return true}
  if(id==='size'&&i){if(/^[1-5]$/.test(k))ROOT.querySelector(`[data-rsize="${SIZES[+k-1].v}"]`).click();if(k==='h')ROOT.querySelector('[data-rsize="home"]').click();if(k==='d')ROOT.querySelector('[data-rsize="now"]').click();return true}
  if(id==='time'&&/^[0-4]$/.test(k)){ROOT.querySelector(`[data-rtime="${TIMES[+k].v}"]`).click();return true}
  if((id==='paper'||id==='plate')&&k==='c'){copy(id==='paper'?prioText():'TODAY\n'+S.items.filter(isToday).map(i=>'☐ '+i.title).join('\n'));return true}
  if(e.key==='Backspace'&&!typing){ritBack();return true}
  return true}
function startAI(){if(!inState('ai').length){toast('nothing in the AI queue');return}S.rit={kind:'ai',step:0,started:Date.now(),tally:{},just:[],di:0,skipped:[],open:true};save();drawRit(true)}
function startClear(){if(!poolDue().length){toast('nothing to sort');return}S.rit={kind:'clear',step:0,started:Date.now(),tally:{},just:[],di:0,skipped:[],open:true};save();drawRit(true)}

/* ======================= RENDER + WIRING ======================= */
function render(){
  ROOT.querySelectorAll('#dirs button').forEach(b=>b.classList.toggle('on',b.dataset.dir===S.dir));
  ROOT.getElementById('nav').innerHTML=navHTML();
  const st=ROOT.getElementById('stage'),sc=st.scrollTop;
  const p=S.page;
  if(!['hall','map','waiting'].includes(p))S.page='hall';
  st.innerHTML=S.page==='map'?(S.dir==='2'?mapBands():S.dir==='3'?mapFold():mapBlocks())
    :S.page==='waiting'?pageWaiting():(S.dir==='2'?hallSidebar():S.dir==='3'?hallHero():hallStage());
  st.scrollTop=sc;st.className='p-'+S.page+' d'+S.dir;
  const sp=ROOT.getElementById('spread');if(sp&&S.spreadX)sp.scrollLeft=S.spreadX;if(sp)sp.onscroll=()=>{S.spreadX=sp.scrollLeft};
  wire(APP);drawRit();
}
function wire(root){
  const on=(sel,fn)=>root.querySelectorAll(sel).forEach(b=>b.onclick=e=>fn(b,e));
  on('[data-page]',b=>{S.page=b.dataset.page;save();render();ROOT.getElementById('stage').scrollTop=0});
  on('[data-open]',b=>openItem(b.dataset.open));
  on('[data-area]',b=>{S.page='map';save();render();setTimeout(()=>jumpTo(b.dataset.area),30)});
  on('[data-marea]',b=>{S.mapArea=b.dataset.marea;save();render();const m=ROOT.getElementById('amain');if(m)m.scrollTop=0});
  on('[data-rit]',b=>{const k=b.dataset.rit;k==='clear'?startClear():k==='ai'?startAI():startRit(k)});
  on('[data-peek]',b=>{S.peekPrio=b.dataset.peek==='1'?1:0;save();render()});
  on('[data-fold]',b=>{S.fold[b.dataset.fold]=!S.fold[b.dataset.fold];save();render()});
  root.querySelectorAll('[data-jumpsel]').forEach(s=>s.onchange=()=>jumpTo(s.value));
  root.querySelectorAll('[data-cb]').forEach(t=>t.onchange=()=>{const i=byId(t.dataset.cb);if(!t.value){t.value=i.wait.checkBack;toast('waiting always needs a check-back day');return}i.wait.checkBack=t.value;save();render()});
  on('[data-sortnow]',()=>startClear());
  on('[data-copy]',()=>copy(prioText()));
  on('[data-phrase]',()=>{const v=prompt('What would make this week good? One thing.',S.phrase||'');if(v!=null){S.phrase=v.trim();save();render()}});
  on('[data-exp]',b=>{EXP[b.dataset.exp]=!EXP[b.dataset.exp];render()});
  on('[data-cyc]',b=>{const c=S.cycles.find(x=>x.id===b.dataset.cyc);S.page='map';S.mapArea=c.dept;save();render()});
  on('[data-cplant]',b=>{const c=S.cycles.find(x=>x.id===b.dataset.cplant),i=tCycPlant(c);tSet(i,'week');save();render();toast('on this week')});
  root.querySelectorAll('[data-ref]').forEach(t=>t.oninput=()=>{S.depts[t.dataset.ref].ref=t.value;save()});
  root.querySelectorAll('[data-add]').forEach(t=>t.onkeydown=e=>{if(e.key==='Enter'&&t.value.trim()){add(t.value.trim(),t.dataset.add,'inbox');render();toast('in the queue')}});
  on('[data-lrow]',(b,e)=>{if(e.target.closest('[data-lcell]'))return;const id=b.dataset.lrow;S.ledgerOpen[id]=S.ledgerOpen[id]==='all'?null:'all';save();render()});
  on('[data-lcell]',(b,e)=>{e.stopPropagation();const [id,bk]=b.dataset.lcell.split(':');S.ledgerOpen[id]=S.ledgerOpen[id]===bk?null:bk;save();render()});
  on('[data-lall]',b=>{DEPTS.forEach(d=>S.ledgerOpen[d.id]=b.dataset.lall==='open'?'all':null);save();render()});
  on('[data-stog]',b=>{S.spreadShow[b.dataset.stog]=!S.spreadShow[b.dataset.stog];save();render()});
  on('[data-jump]',b=>jumpTo(b.dataset.jump));
  on('[data-aisel]',b=>{S.aiSel=b.dataset.aisel;save();render()});
  root.querySelectorAll('[data-instr]').forEach(t=>t.oninput=()=>{byId(t.dataset.instr).instr=t.value;save()});
  on('[data-aicopy]',b=>copy(instr(byId(b.dataset.aicopy))));
  on('[data-aisent]',b=>{const i=byId(b.dataset.aisent);snap([i.id]);move(i,'waiting');i.wait={who:'Claude',since:today(),checkBack:addDays(2)};save();render();toast('sent → Waiting',true)});
  on('[data-tpl]',()=>{const v=prompt('AI template — {task} {department} {notes} {reference}',S.aiTemplate);if(v!=null){S.aiTemplate=v;save();render()}});
  on('[data-mv2]',b=>{const [id,s]=b.dataset.mv2.split(':');doMove(id,s)});
  on('[data-wifehers]',b=>{const i=byId(b.dataset.wifehers);snap([i.id]);move(i,'waiting');i.wait={who:'Wife',since:today(),checkBack:addDays(3)};save();render();toast('with your wife → Waiting',true)});
  on('[data-land]',b=>doMove(b.dataset.land,'done'));
  on('[data-nudge]',b=>{const i=byId(b.dataset.nudge);snap([i.id]);const wife=i.wait.who==='Wife';if(wife)window.open(waLink('Oi amor, conseguiu ver aquilo? → '+i.title),'_blank');i.wait.checkBack=addDays(wife?2:3);i.movedAt=Date.now();save();render();toast('check back '+dueLabel(i.wait.checkBack).t,true)});
  const cap=ROOT.getElementById('cap');if(cap)cap.onkeydown=e=>{if(e.key==='Enter'&&cap.value.trim()){add(cap.value.trim(),null,'inbox');cap.value='';render();toast('in the queue — sort it later')}};
}
function jumpTo(id){const c=ROOT.getElementById('col-'+id),sp=ROOT.getElementById('spread');if(!c||!sp)return;
  sp.scrollTo({left:c.offsetLeft-(S.dir==='2'?182:32),behavior:'smooth'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),900)}
/* item sheet closes → refresh */
function closeLayer(){ROOT.getElementById('layer').innerHTML='';LAYER=null;render();if(S.rit&&S.rit.open)drawRit()}
ON_KEY(e=>{
  if(e.key==='Escape'&&LAYER){closeLayer();return}
  if(ritKey(e)){return}
  const typing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;
  if(typing||e.metaKey||e.ctrlKey||e.altKey||LAYER)return;
  if(e.key==='Enter'&&S.mode!=='work'&&S.page==='hall'){const n=ritState().next;n.k==='follow'?(S.page='waiting',save(),render()):n.k==='clear'?startClear():n.k==='ai'?startAI():startRit(n.k);return}
  if(S.page==='map'&&['ArrowLeft','ArrowRight'].includes(e.key)){const sp=ROOT.getElementById('spread');if(sp)sp.scrollBy({left:(e.key==='ArrowRight'?400:-400),behavior:'smooth'})}
});

/* ======================= ROUND 5 OVERRIDES ======================= */
S.mode=S.mode||'town';S.wpage=S.wpage||'home';S.bandOpen=S.bandOpen||{now:1,delegated:1,queue:1};
/* ---------- sound (off by default) ---------- */
let ACTX=null;
function beep(f){if(!S.sound)return;try{ACTX=ACTX||new (window.AudioContext||window.webkitAudioContext)();const o=ACTX.createOscillator(),g=ACTX.createGain();
  o.type='sine';o.frequency.value=f||660;g.gain.setValueAtTime(.0001,ACTX.currentTime);g.gain.exponentialRampToValueAtTime(.08,ACTX.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ACTX.currentTime+.16);
  o.connect(g).connect(ACTX.destination);o.start();o.stop(ACTX.currentTime+.18)}catch(e){}}
/* ---------- burst of colour when a queue or area clears ---------- */
function burst(){const host=ROOT.querySelector('#rit .r-body');if(!host)return;const b=document.createElement('div');b.className='burst';
  for(let k=0;k<26;k++){const s=document.createElement('i'),a=Math.random()*Math.PI*2,d=80+Math.random()*160;
    s.style.setProperty('--x',Math.cos(a)*d+'px');s.style.setProperty('--y',Math.sin(a)*d+'px');s.style.setProperty('--h',(k%4));s.style.animationDelay=(Math.random()*80)+'ms';b.appendChild(s)}
  host.appendChild(b);setTimeout(()=>b.remove(),1100);beep(880);setTimeout(()=>beep(1180),90)}
/* fly the card toward the choice, then burst if that emptied the queue */
function ritAct(fn,dir){const had=!!curItem(),c=ROOT.getElementById('rcard');beep(520+Math.random()*80);
  const go=()=>{fn();save();drawRit();if(had&&!curItem())setTimeout(burst,60)};
  if(c){c.classList.add('out');if(dir)c.classList.add('to-'+dir);setTimeout(go,200)}else go()}
function verdict(s){const i=curItem();if(!i||!i.state)return;
  if(s==='wife'){wifeFlow(i,()=>{tal('wife');save();drawRit()});return}
  if(s==='waiting'){const who=prompt('Who has it?','');if(who===null)return;ritAct(()=>{toWaiting(i,who||'someone',3);tal('waiting')},'right');return}
  ritAct(()=>{snap([i.id]);move(i,s);tal(s)},DIR[s])}
function aiAct(a){const i=curItem();if(!i||!i.state)return;
  if(a==='copy'){copy(instr(i));return}
  if(a==='open'){copy(instr(i));window.open('https://claude.ai/new?q='+encodeURIComponent(instr(i)),'_blank');return}
  ritAct(()=>{if(a==='sent'){toWaiting(i,'Claude',2);tal('sent')}else if(a==='mine'){snap([i.id]);move(i,'week');tal('mine')}else{snap([i.id]);move(i,'dropped');tal('dropped')}},DIR[a==='drop'?'dropped':a])}
const _curItem=curItem;curItem=function(){const id=RS()[0];return WCUR[id]?WCUR[id]():_curItem()};
const _ritNext=ritNext;ritNext=function(){const id=RS()[0];if(['sbg','waiq'].includes(id)){goStep(1);return}if(id==='done'){endRit();return}beep(740);_ritNext()};
function endRit(){const k=S.rit.kind,secs=Math.floor((Date.now()-S.rit.started)/1000);
  if(k==='round'){S.lastRound=Date.now();S.peekPrio=0}
  if(k==='work')WK().ritualDay=today();
  if(k==='stepback')WK().lastStepBack=Date.now();
  if(k==='reset')S.wreset=null;
  S.rit=null;save();
  if(k==='round'&&S.wsaved){S.rit=S.wsaved;S.wsaved=null;S.mode='work';S.rit.step++;S.rit.open=true;save();render();drawRit(true);toast('Round done — back to the Work ritual.');return}
  drawRit();render();
  toast({round:'Good week. Your priorities are on the Town Hall.',move:'That’s today.',ai:'Handed off.',clear:'Queue cleared.',work:'The day is set. Go.',reset:'Back in it.',stepback:'Goals checked.',wai:'Handed off.'}[k]||'Done.')}
function railHTML(){
  const r=R(),def=RIT[r.kind],steps=def.steps.filter(s=>s[0]!=='done'),T=Object.entries(r.tally).filter(([,n])=>n);
  const total=T.reduce((n,[,v])=>n+v,0),prog=Math.min(1,r.step/Math.max(1,def.steps.length-1)),C=2*Math.PI*58;
  const lab={phrase:'The week’s one thing',time:'Time today',pick:'Pick today',rounds:'Rounds',w5:'Time today',ww:'Time this week',wpr:'Weekly round?',w8:'One personal thing'};
  return `<div class="r-rail"><div class="r-kind">${r.kind==='round'||r.kind==='move'||r.kind==='clear'||r.kind==='ai'?'Personal':'Work'} ritual</div><div class="r-title">${def.name}</div>
    <div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="58" class="trk"/><circle cx="66" cy="66" r="58" class="bar" style="stroke-dasharray:${C};stroke-dashoffset:${C*(1-prog)}"/></svg>
      <div class="rc-in"><span id="rclock">00:00</span><small>${steps.length>1?'step '+Math.min(r.step+1,steps.length)+' of '+steps.length:'one at a time'}</small></div></div>
    ${steps.length>1?`<div class="r-steps">${steps.map((s,k)=>`<button class="r-step ${k<r.step?'done':k===r.step?'now':''}" data-rgo="${k}"><span class="b">${k<r.step?'✓':k+1}</span><span class="sl">${lab[s[0]]||s[1]}</span></button>`).join('')}</div>`:''}
    <div class="r-tally"><div class="mono">This session</div><div class="big">${total||'—'}</div>
      <div class="tl">${T.map(([k,n])=>`<span class="${k===r.lastTal?'pop':''}">${n} ${TSAID[k]||k}</span>`).join('')||'<span>decisions land here</span>'}</div></div>
    <div class="r-foot"><button class="r-pause" data-rpause="1">Pause · esc</button><button class="r-snd ${S.sound?'on':''}" data-rsound="1" title="soft sounds">${S.sound?'♪ on':'♪ off'}</button></div></div>`}
function drawRit(focus){
  const el=ROOT.getElementById('rit');
  if(!S.rit||!S.rit.open){el.className='';el.innerHTML='';clearInterval(RCLOCK);RCLOCK=null;return}
  el.className='open';el.dataset.r=S.rit.kind;
  el.innerHTML=`<div class="aura"><i></i><i></i><i></i></div>`+railHTML()+`<div class="r-stage" id="rstage">${stageHTML()}</div>`;
  const tick=()=>{const c=ROOT.getElementById('rclock');if(c&&S.rit){const s=Math.floor((Date.now()-S.rit.started)/1000);c.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}};
  tick();if(!RCLOCK)RCLOCK=setInterval(tick,1000);
  wireRit(el,focus);wireWork(el);
  const sd=el.querySelector('[data-rsound]');if(sd)sd.onclick=()=>{S.sound=!S.sound;save();drawRit();beep(700)};
}

/* ---------- Town Map: bands that fold (hover to peek, click to pin) ---------- */
function mapBands(){const list=areasByNeed(),B=BUCKETS;
  const top=`<div class="spreadtop"><span class="mono">Rows</span><button class="tog on" data-ball="open" style="--bc:var(--ink)"><i></i>Open all</button><button class="tog" data-ball="close" style="--bc:var(--ink)"><i></i>Fold all</button>
    <span class="note">hover a folded row to peek · click its name to pin it open</span><button class="tog ${S.spreadShow.extras?'on':''}" data-stog="extras" style="--bc:var(--ink)"><i></i>Almanac & ref</button>
    <span class="grow"></span><span class="mono">Jump</span><select class="fld" data-jumpsel="1" style="padding:6px 10px;font-size:14px">${list.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select><span class="note">← →</span></div>`;
  return top+`<div class="bandsWrap" id="spread"><div class="bands" style="grid-template-columns:170px repeat(${list.length},360px)">
    <div class="bl corner"></div>${list.map(d=>`<div class="bhd" id="col-${d.id}">${colHead(d)}</div>`).join('')}
    ${B.map(b=>{const [c,bg]=BCOL[b.id],open=!!S.bandOpen[b.id],tot=list.reduce((n,d)=>n+inB(d.id,b.id).length,0);
      return `<button class="bl ${open?'':'collapsed'}" data-band="${b.id}" data-bandtoggle="${b.id}" style="--bc:${c};--bg:${bg}"><span><em class="chev">${open?'▾':'▸'}</em>${b.name}</span><small>${tot} · ${b.hint}</small></button>
      ${list.map(d=>{const L=inB(d.id,b.id);return `<div class="bc ${open?'':'collapsed'}" data-band="${b.id}" style="--bc:${c};--bg:${bg}">
        <div class="sum">${L.length?`<b>${L.length}</b>`:'<span class="none">·</span>'}</div><div class="full">${L.length?L.map(irow).join(''):'<span class="none">—</span>'}</div></div>`}).join('')}`}).join('')}
    ${S.spreadShow.extras?`<div class="bl" style="--bc:var(--ink)"><span>Almanac · ref</span></div>${list.map(d=>`<div class="bc">${areaExtras(d.id)}</div>`).join('')}`:''}
    <div class="bl"></div>${list.map(d=>`<div class="bc plain"><input class="addin" data-add="${d.id}" placeholder="Add to ${esc(d.name)} — ⏎"></div>`).join('')}
  </div></div>`}
let PEEKT={};
function wireBands(root){
  root.querySelectorAll('[data-bandtoggle]').forEach(b=>b.onclick=()=>{const k=b.dataset.bandtoggle;S.bandOpen[k]=!S.bandOpen[k];save();render()});
  root.querySelectorAll('[data-ball]').forEach(b=>b.onclick=()=>{BUCKETS.forEach(x=>S.bandOpen[x.id]=b.dataset.ball==='open'?1:0);save();render()});
  root.querySelectorAll('.collapsed[data-band]').forEach(el=>{const k=el.dataset.band,all=()=>root.querySelectorAll(`[data-band="${k}"]`);
    el.addEventListener('mouseenter',()=>{clearTimeout(PEEKT[k]);PEEKT[k]=setTimeout(()=>all().forEach(x=>x.classList.add('peek')),110)});
    el.addEventListener('mouseleave',()=>{clearTimeout(PEEKT[k]);PEEKT[k]=setTimeout(()=>all().forEach(x=>x.classList.remove('peek')),260)});});
}

/* ---------- nav: one bar, mode switch ---------- */
function navHTML(){
  const ms=`<div class="modesw"><button class="${S.mode==='town'?'on':''}" data-mode="town">Personal</button><button class="${S.mode==='work'?'on':''}" data-mode="work">Work</button></div>`;
  if(S.mode==='work'){const od=wIn('waiting').filter(wLate).length,t=(p,l,n,red)=>`<button class="tab ${S.wpage===p?'on':''}" data-wpage="${p}">${l}${n!=null?`<span class="n ${red?'red':''}">${n}</span>`:''}</button>`;
    return ms+`${t('home','Home')}${t('today','Today')}${t('backlog','Backlog')}${t('goals','Goals')}<span class="navsep"></span>
      <button class="tab" data-rit="wai">AI queue<span class="n">${wIn('ai').length}</span></button>${t('waiting','Waiting',wIn('waiting').length,od)}
      <label class="cap"><input id="cap" placeholder="Dump it → work inbox"><span>⏎</span></label>`}
  const od=overdueW().length,t=(p,l,n,red,attr)=>`<button class="tab ${S.page===p?'on':''}" ${attr||`data-page="${p}"`}>${l}${n!=null?`<span class="n ${red?'red':''}">${n}</span>`:''}</button>`;
  return ms+`${t('hall','Town Hall')}${t('map','Town Map')}<span class="navsep"></span>
    ${t('','To sort',poolDue().length,0,'data-rit="clear"')}${t('','AI queue',inState('ai').length,0,'data-rit="ai"')}${t('waiting','Waiting',inState('waiting').length,od)}
    <label class="cap"><input id="cap" placeholder="On your mind? → queue"><span>⏎</span></label>`}

function render(){
  APP.dataset.skin=S.dir||'1';APP.dataset.mode=S.mode;
  ROOT.querySelectorAll('#dirs button').forEach(b=>b.classList.toggle('on',b.dataset.dir===(S.dir||'1')));
  ROOT.getElementById('nav').innerHTML=navHTML();
  const st=ROOT.getElementById('stage'),sc=st.scrollTop;
  if(S.mode==='work'){st.innerHTML=({home:wHome,today:wToday,backlog:wBacklog,goals:wGoals,waiting:wWaiting}[S.wpage]||wHome)();st.className='w-'+S.wpage}
  else{if(!['hall','map','waiting'].includes(S.page))S.page='hall';
    st.innerHTML=S.page==='map'?mapBands():S.page==='waiting'?pageWaiting():hallHero();st.className='p-'+S.page}
  st.scrollTop=sc;
  const sp=ROOT.getElementById('spread');if(sp&&S.spreadX)sp.scrollLeft=S.spreadX;if(sp)sp.onscroll=()=>{S.spreadX=sp.scrollLeft};
  wire(APP);wireBands(st);wireT2(APP);drawRit();
}
function wireW(root){
  const on=(sel,fn)=>root.querySelectorAll(sel).forEach(b=>b.onclick=e=>fn(b,e));
  on('[data-mode]',b=>{S.mode=b.dataset.mode;save();render();ROOT.getElementById('stage').scrollTop=0});
  on('[data-wpage]',b=>{S.wpage=b.dataset.wpage;save();render();ROOT.getElementById('stage').scrollTop=0});
  on('[data-wview]',b=>{S.wpage=b.dataset.wview;save();render()});
  on('[data-wopen]',b=>wSheet(b.dataset.wopen));
  on('[data-wcopy]',()=>copy(wPlanText()));
  on('[data-wpeek]',b=>{S.wpeek=b.dataset.wpeek==='1';save();render()});
  on('[data-wto]',b=>{const [id,s]=b.dataset.wto.split(':');wMove(wById(id),s);render();toast({board:'→ this week',done:'landed ✓',backlog:'→ backlog'}[s]||'moved')});
  on('[data-wnudge]',b=>{const i=wById(b.dataset.wnudge);i.wait.checkBack=addDays(3);save();render();toast('check back '+dueLabel(i.wait.checkBack).t)});
  root.querySelectorAll('[data-wcb]').forEach(t=>t.onchange=()=>{const i=wById(t.dataset.wcb);if(!t.value){t.value=i.wait.checkBack;toast('waiting always needs a check-back day');return}i.wait.checkBack=t.value;save();render()});
  on('[data-wmission]',()=>{const v=prompt('This week’s mission — one line',WK().mission?WK().mission.text:'');if(v!=null){WK().mission=v.trim()?{week:isoWeekStr(),text:v.trim()}:null;save();render()}});
  on('[data-rit]',b=>{const k=b.dataset.rit;if(k==='wai'&&!wIn('ai').length){toast('nothing in the AI queue');return}k==='clear'?startClear():k==='ai'?startAI():startRit(k)});
  const cap=ROOT.getElementById('cap');if(cap&&S.mode==='work')cap.onkeydown=e=>{if(e.key==='Enter'&&cap.value.trim()){wAdd(cap.value.trim(),null,'inbox');cap.value='';render();toast('in the work inbox — the ritual sorts it')}};
}


/* ======================= Town 2 ↔ app_1 ======================= */
/* Work keeps app_1's own screens for now: no work rituals in this file */
const WST={},WCUR={},WKEY={};function wireWork(){}
const DIR={week:'up',done:'up',mine:'up',ai:'right',wife:'right',waiting:'right',sent:'right',later:'down',dropped:'left',drop:'left'};
function wPlanText(){return ''}
/* real data: adding and moving go through app_1's own rules (cycles roll, AI in/out stamps, today/back resets) */
function add(title,deptId,state){return tAdd(title,deptId||null,state||'inbox')}
function move(i,s){if(!i||i.state===s)return;tSet(i,s);
  if(s!=='week'){i.today=null;if(i.day)i.day=null}
  if(s==='later'&&!i.back)i.back=addDays(7);
  if(s==='waiting'&&!i.wait)i.wait={who:'',since:today(),checkBack:addDays(3)}}
/* the weekly round closes the same way the classic one did: lastRound, the work ritual's "done this week" check */
function endRit(){const k=S.rit.kind;
  if(k==='round'){const R0=REAL();R0.town.lastRound=Date.now();R0.town.round=null;R0.pcheck={doneWeek:isoWeek(),skips:[]};S.peekPrio=0}
  S.rit=null;save();drawRit();
  if(k==='round'&&REAL().ui.resumeWork){resumeWorkIfDetoured();return}
  render();toast({round:'Good week. Your priorities are on the Town Hall.',move:'That’s today.',ai:'Handed off.',clear:'Queue cleared.'}[k]||'Done.')}
function pauseRit(){if(!S.rit)return;const k=S.rit.kind;S.rit.open=false;save();drawRit();
  if(k==='round'&&REAL().ui.resumeWork){resumeWorkIfDetoured();return}
  render();toast('paused — it picks up right here')}
function navHTML(){
  const od=overdueW().length,t=(p,l,n,red,attr)=>`<button class="tab ${S.page===p?'on':''}" ${attr||`data-page="${p}"`}>${l}${n!=null?`<span class="n ${red?'red':''}">${n}</span>`:''}</button>`;
  return `<div class="modesw"><button class="on">Personal</button><button data-gowork="1" title="Tab">Work</button></div>${t('hall','Town Hall')}${t('map','Town Map')}<span class="navsep"></span>
    ${t('','To sort',poolDue().length,0,'data-rit="clear"')}${t('','AI queue',inState('ai').length,0,'data-rit="ai"')}${t('waiting','Waiting',inState('waiting').length,od)}
    <label class="cap"><input id="cap" placeholder="On your mind? → queue"><span>⏎</span></label><button class="more2" data-menu="1" title="Sync, backup, done list">⋯</button>`}
function render(){
  APP.dataset.skin='1';APP.dataset.mode='town';
  ROOT.getElementById('nav').innerHTML=navHTML();
  const st=ROOT.getElementById('stage'),sc=st.scrollTop;
  if(!['hall','map','waiting'].includes(S.page))S.page='hall';
  st.innerHTML=S.page==='map'?mapBands():S.page==='waiting'?pageWaiting():hallHero();st.className='p-'+S.page;
  st.scrollTop=sc;
  const sp=ROOT.getElementById('spread');if(sp&&S.spreadX)sp.scrollLeft=S.spreadX;if(sp)sp.onscroll=()=>{UI().spreadX=sp.scrollLeft};
  wire(APP);wireBands(st);wireT2(APP);drawRit();
}
function goWork(){REAL().ui.mode='work';save();window.render()}
function wireT2(root){
  root.querySelectorAll('[data-gowork]').forEach(b=>b.onclick=goWork);
  root.querySelectorAll('[data-menu]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleMenu(b)});
}
function toggleMenu(btn){let m=ROOT.getElementById('menu2');if(m){m.remove();return}
  m=document.createElement('div');m.id='menu2';m.className='menu2';
  m.innerHTML=`<button data-m="sync">${esc(syncLabel())}</button><button data-m="done">Done list</button><button data-m="exp">↓ Export a backup</button><button data-m="imp">↑ Import a backup</button><button data-m="classic">Open the classic Personal tab</button><div class="mv">Daily Ritual ${APPVER} · ${T2VER}</div>`;
  APP.appendChild(m);const r=btn.getBoundingClientRect();m.style.top=(r.bottom+6)+'px';m.style.right=Math.max(8,innerWidth-r.right)+'px';
  m.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{m.remove();({sync:syncSheet,done:doneSheet,exp:()=>exportBackup(false),imp:importBackup,classic:()=>{location.search='?classic=1'}})[b.dataset.m]()});
  setTimeout(()=>{const c=ev=>{if(!m.contains(ev.composedPath()[0]))m.remove();ROOT.removeEventListener('click',c)};ROOT.addEventListener('click',c)},0)}

/* first visit: 'wife' items become “waiting on your wife” due today (so you can message her),
   and every waiting item gets a check-back day so nothing goes stale. Idempotent. */
function migrateT2(){let ch=0;
  REAL().town.items.forEach(i=>{
    if(i.state==='wife'){tSet(i,'waiting');i.wait={who:'Wife',since:today(),checkBack:today()};ch++}
    else if(i.state==='waiting'){if(!i.wait||typeof i.wait!=='object'){i.wait={who:'',since:today()};ch++}if(!i.wait.checkBack){i.wait.checkBack=addDays(3);ch++}if(!i.wait.since){i.wait.since=today();ch++}}});
  if(ch)window.save()}   /* plain save: no input stamp, so loading alone never pushes a sync */

/* ---------- hand-off with app_1 ---------- */
const active=()=>REAL().ui.mode==='personal';
const appEl=document.getElementById('app');
const appSheetOpen=()=>['layer','mlayer','dplayer'].some(id=>{const e=document.getElementById(id);return e&&e.innerHTML});
const _render=window.render;
window.render=function(){
  if(active()){appEl.style.display='none';host.style.display='block';document.body.dataset.mode='personal';render()}
  else{host.style.display='none';appEl.style.display='';_render()}};
const _startRound=window.startRound,_startMove=window.startMove;
window.startRound=function(){if(active()){window.render();startRit('round')}else _startRound()};
window.startMove=function(){if(active()){window.render();startRit('move')}else _startMove()};
/* keys: ours while the Personal tab is showing; app_1's keyboard handler never sees them */
function runKeys(e,target){LAST_INPUT=Date.now();
  const ev=new Proxy(e,{get(o,k){if(k==='target')return target;const v=o[k];return typeof v==='function'?v.bind(o):v}});
  if(e.key==='Tab'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&!(S.rit&&S.rit.open)&&!LAYER&&!/INPUT|TEXTAREA|SELECT/.test(target.tagName||'')){e.preventDefault();goWork();return}
  KH.forEach(fn=>fn(ev))}
window.addEventListener('keydown',e=>{
  if(!active()||appSheetOpen()||e.composedPath().includes(host))return;
  runKeys(e,document.body);e.stopImmediatePropagation()},true);
host.addEventListener('keydown',e=>{
  if(!active()||appSheetOpen())return;
  runKeys(e,e.composedPath()[0]||host);e.stopPropagation()});

migrateT2();
if(active())window.render();
window.__T2={ROOT,render:()=>window.render(),startRit:k=>startRit(k),S};
})();
