/* ======================================================================
   Work 2 — the new Work Home (hero), the AI round and Work Waiting, in the Paper look.
   app_1.js stays the engine: same items (mode:'work'), same plan('work') (deep/batch/next/buffer),
   same goals, same rituals (startZen, startReset, startStepBack), same save → sync.
   New data is additive and underscore-prefixed: item._wait = {who,since,checkBack} on items in
   the Follow Up lane. Screen state lives in S.ui._w2 (never synced). Today, Backlog and Goals
   keep app_1's screens (every behaviour intact) under this file's top bar — the "strip": the bar
   stays, app_1 draws below it with its own header hidden. ?classic=1 turns this file off.
   ====================================================================== */
window.__W2REAL=()=>S;
(function(){
if(/[?&]classic\b/.test(location.search))return;
const R=()=>window.__W2REAL();
const host=document.createElement('div');host.id='work2';host.dataset.look=lookNow();host.style.cssText='position:fixed;inset:0;z-index:100;display:none';
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
.addin:focus{border-style:solid;border-color:var(--hot);background:var(--surface,#fff)}
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
.prow:hover{background:var(--surface,#fff)}
.prow .k{font:400 22px var(--serif);color:var(--ink-3)}
.prow .t{font-size:18px;font-weight:500}
.prow .a{font-size:13px;color:var(--ink-3);margin-top:1px;display:flex;align-items:center;gap:6px}
.prow .m{font-size:13.5px;color:var(--ink-3);white-space:nowrap}
.prow .m.red{color:var(--late);font-weight:600}
.prow.today .k{color:var(--hot)}
.att{display:flex;gap:12px;align-items:baseline;padding:10px 6px;border-bottom:1px solid var(--line-soft);cursor:pointer;font-size:16px}
.att:hover{background:var(--surface,#fff)}
.att .w{font:600 11.5px var(--mono);letter-spacing:.07em;text-transform:uppercase;width:86px;flex:none;color:var(--sc)}
.att .t{flex:1}
.att .why{color:var(--ink-3);font-size:14px}
.areas-t .ar{display:grid;grid-template-columns:200px 170px 1fr 20px;gap:14px;align-items:baseline;padding:13px 6px;border-bottom:1px solid var(--line-soft);cursor:pointer}
.areas-t .ar:hover{background:var(--surface,#fff)}
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
.catt{display:inline-flex;align-items:center;gap:8px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:999px;padding:7px 14px 7px 12px;font-size:14px}
.catt:hover{border-color:var(--sc)}
.catt .w{font:600 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--sc)}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}
.tile{background:var(--surface,#fff);border:1px solid var(--line);border-radius:18px;padding:16px 16px 14px;text-align:left;display:flex;flex-direction:column;gap:8px;min-height:150px}
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
.pchip{display:inline-flex;align-items:center;gap:9px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:999px;padding:8px 14px 8px 10px}
.pchip:hover{border-color:var(--hot-line)}
.pchip .ring{width:14px;height:14px;border-radius:50%;border:3px solid var(--sc);background:var(--surface,#fff)}
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
.arow:hover{background:var(--surface,#fff);border-color:var(--line-soft)}
.arow.on{background:var(--surface,#fff);border-color:var(--line);box-shadow:var(--shadow)}
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
.ref{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;min-height:120px;resize:vertical;outline:none;font-size:14.5px;line-height:1.5;background:var(--surface,#fff)}
.ref:focus{border-color:var(--hot)}
.cyc{display:flex;gap:10px;align-items:baseline;padding:8px 12px;font-size:14.5px;border-radius:10px}
.cyc .t{flex:1}.cyc .m{font-size:13px;color:var(--ink-3)}.cyc .m.red{color:var(--late)}
.box{background:var(--surface,#fff);border:1px solid var(--line);border-radius:18px;padding:16px 10px 10px;margin-bottom:16px}

/* ---------- MAP: 2 · LEDGER ---------- */
.ledger{max-width:1500px;margin:0 auto}
.ledger table{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface,#fff);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:var(--shadow)}
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
.tog{font-size:14px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface,#fff);color:var(--ink-3)}
.tog.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.jump{font-size:14px;padding:6px 10px;border-radius:10px;display:inline-flex;gap:7px;align-items:center}
.jump:hover{background:var(--surface,#fff)}
.spread{display:flex;gap:14px;overflow-x:auto;padding:4px 32px 40px;scroll-snap-type:x proximity;align-items:flex-start}
.scol{flex:0 0 330px;scroll-snap-align:start;background:var(--surface,#fff);border:1px solid var(--line);border-radius:22px;padding:18px 8px 12px;box-shadow:var(--shadow)}
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
.ailist{background:var(--surface,#fff);border:1px solid var(--line);border-radius:20px;padding:10px}
.ailist .grp{font:600 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);padding:12px 12px 4px;display:flex;gap:8px;align-items:center}
.ailist .it.on{background:var(--ink);color:#fff}
.ailist .it.on .m{color:rgba(255,255,255,.7)}
.aipane{background:var(--surface,#fff);border:1px solid var(--line);border-radius:22px;padding:26px 28px;position:sticky;top:0;box-shadow:var(--shadow)}
.aipane h2{font:400 30px/1.2 var(--serif);margin:6px 0 14px;cursor:pointer}
.aipane textarea{width:100%;min-height:280px;border:1px solid var(--line);border-radius:14px;padding:14px 16px;font:400 14.5px/1.6 var(--mono);outline:none;resize:vertical;background:#FBFDFB}
.aipane textarea:focus{border-color:var(--hot)}
.wrow{display:grid;grid-template-columns:1fr 160px 120px 150px auto;gap:14px;align-items:center;padding:13px 16px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;margin-bottom:8px}
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
.moveto button{font-weight:500;font-size:14px;padding:8px 12px;border-radius:11px;border:1px solid var(--line);background:var(--surface,#fff)}
.moveto button:hover{border-color:var(--hot-line)}
.moveto button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:500;padding:6px 12px;border-radius:999px;border:1px solid var(--line);color:var(--ink-2);background:var(--surface,#fff)}
.chip b{width:8px;height:8px;border-radius:50%;background:currentColor;display:inline-block}
.chip span{color:var(--ink)}
.chip.on{border-color:currentColor;background:color-mix(in srgb,currentColor 9%,#fff)}
.fld{border:1px solid var(--line);border-radius:10px;padding:8px 11px;outline:none;background:var(--surface,#fff);font-size:15px}
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
.r-step .b{width:24px;height:24px;border-radius:50%;border:1.5px solid #CBD2CD;display:flex;align-items:center;justify-content:center;font:600 11px var(--mono);flex:none;background:var(--surface,#fff)}
.r-step.done{color:var(--ink-2)}
.r-step.done .b{background:var(--hot);border-color:var(--hot);color:#fff}
.r-step.now{color:var(--ink);font-weight:600;background:var(--surface,#fff);box-shadow:var(--shadow)}
.r-step.now .b{border-color:var(--hot);color:var(--hot-ink);box-shadow:0 0 0 4px var(--hot-soft)}
.r-step:hover:not(.now){background:rgba(255,255,255,.7)}
.r-tally{margin-top:auto;background:var(--surface,#fff);border:1px solid var(--line);border-radius:18px;padding:16px 16px 14px}
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
.r-eyebrow .pill{letter-spacing:.06em;background:var(--surface,#fff);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink-2)}
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
kbd.k{font:600 11px var(--mono);border:1px solid var(--line);background:var(--surface,#fff);border-radius:6px;padding:2px 7px;color:var(--ink-3)}

.r-phrase{width:100%;border:none;border-bottom:2px solid var(--line);background:transparent;outline:none;font:italic 300 clamp(30px,3.6vw,48px)/1.25 var(--serif);padding:8px 0 14px}
.r-phrase:focus{border-color:var(--hot)}
.r-dump{width:100%;border:none;border-bottom:2px solid var(--line);background:transparent;outline:none;resize:none;font:300 clamp(26px,3vw,40px)/1.3 var(--serif);padding:6px 0 12px}
.r-dump:focus{border-color:var(--hot)}
.r-dump::placeholder,.r-phrase::placeholder{color:#B9BFC9;font-style:italic}
.caught{margin-top:26px}
.caught .mono{color:var(--ink-3)}
.caught .list{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.caught .list span{background:var(--surface,#fff);border:1px solid var(--line);border-radius:12px;padding:8px 13px;font-size:15.5px;animation:pop .35s}
.caught .list span:last-child{border-color:var(--hot-line);background:var(--hot-soft)}
@keyframes pop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}

.deck{position:relative;margin-top:4px}
.deck::before,.deck::after{content:'';position:absolute;left:18px;right:18px;height:100%;border-radius:28px;background:var(--surface,#fff);border:1px solid var(--line);z-index:0}
.deck::before{top:10px;opacity:.7}.deck::after{top:20px;left:36px;right:36px;opacity:.4}
.deck.single::before,.deck.single::after{display:none}
.r-card{position:relative;z-index:1;background:var(--surface,#fff);border:1px solid var(--line);border-radius:28px;padding:34px 38px 30px;box-shadow:var(--shadow-2);animation:cardin .28s cubic-bezier(.2,.8,.2,1)}
.r-card.out{animation:cardout .2s ease-in forwards}
@keyframes cardin{from{transform:translateY(18px) scale(.98);opacity:0}to{transform:none;opacity:1}}
@keyframes cardout{to{transform:translateX(60px) rotate(2deg);opacity:0}}
.r-card .from{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink-3);margin-bottom:10px}
.r-card .from .cnt{margin-left:auto;font:600 12px var(--mono);letter-spacing:.08em}
.r-card h3{font:400 clamp(30px,3.2vw,44px)/1.15 var(--serif);letter-spacing:-.02em;margin-bottom:6px;outline:none}
.r-card .meta{font-size:15px;color:var(--ink-3);margin-bottom:20px}
.r-card .q{font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin:20px 0 10px}
.r-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:10px}
.r-tile{display:flex;align-items:center;gap:11px;text-align:left;background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:14px 15px;font-size:16px;font-weight:500;transition:transform .1s,border-color .1s,background .1s}
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
.r-clear{background:var(--surface,#fff);border:1px solid var(--line);border-radius:28px;padding:40px;text-align:left;box-shadow:var(--shadow)}
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
.r-done .tl span{font-size:17px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:12px;padding:8px 14px;animation:pop .4s backwards}

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
.panel{background:var(--surface,#fff);border:1px solid var(--line);border-radius:22px;padding:20px 22px;box-shadow:var(--shadow);min-height:0;overflow:auto}
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
.tog.on{background:var(--surface,#fff);color:var(--ink);border-color:var(--bc)}
.tog.on i{opacity:1}
.spread{flex:1;overflow:auto;padding:4px 28px 40px;gap:16px}
.scol{flex:0 0 400px;padding:0;overflow:hidden;align-self:flex-start}
.ch{position:sticky;top:0;background:var(--surface,#fff);padding:18px 20px 14px;border-bottom:1px solid var(--line-soft);z-index:2}
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
.bands{display:grid;width:max-content;border-radius:20px;background:var(--surface,#fff);border:1px solid var(--line);box-shadow:var(--shadow)}
.bands .bhd{position:sticky;top:0;z-index:3;background:var(--surface,#fff);border-bottom:1px solid var(--line);border-left:1px solid var(--line-soft)}
.bands .bl{position:sticky;left:0;z-index:2;background:var(--bg,#fff);border-bottom:1px solid #fff;padding:16px 14px;border-left:5px solid var(--bc,transparent);box-shadow:1px 0 0 var(--line)}
.bands .bl span{display:block;font:600 12.5px var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--bc)}
.bands .bl small{font-size:12.5px;color:var(--ink-3)}
.bands .corner{top:0;z-index:4;background:var(--surface,#fff);border-bottom:1px solid var(--line)}
.bands .bc{background:var(--bg,#fff);border-bottom:3px solid #fff;border-left:1px solid #fff;padding:8px 6px}
.bands .bc.plain{background:var(--surface,#fff)}
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
.t2app[data-skin="1"]{ /* Sand & Ink */
  --bg:#EDE8DF;--surface:#FAF7F1;--card:#FAF7F1;--sunken:#E4DDD0;--line:#D6CDBD;--line-soft:#E3DCCF;
  --ink:#26221C;--ink-2:#5A5348;--ink-3:#93897A;--dark:#2E2A24;--dark-2:#3A352E;--dark-3:#4A443B;
  --serif:'Fraunces',Georgia,serif;--sans:'Instrument Sans',-apple-system,sans-serif;--rp:22px;
  --hp:#5E6B35;--hpi:#4A5527;--hps:#E7EBD9;--hpl:#B9C29A;--hw:#8A2E2A;--hwi:#6E201D;--hws:#F1E1DC;--hwl:#D4A9A2;
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
.wk1{background:var(--surface,#fff);border:1px solid var(--line);border-radius:var(--rp);padding:18px 22px;max-width:640px;box-shadow:var(--shadow)}
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
.slotbar .sb{font-size:14px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:999px;padding:6px 12px}
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

.t2app{height:100%}
.cap span{display:none}
.more2{font:600 18px var(--sans);color:var(--ink-2);width:38px;height:38px;border-radius:12px;border:1px solid var(--line);background:var(--surface);margin-left:6px;flex:none}
.menu2{position:fixed;z-index:150;background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-2);padding:6px;display:flex;flex-direction:column;min-width:230px}
.menu2 button{text-align:left;font:500 14.5px var(--sans);padding:10px 12px;border-radius:10px}
.menu2 button:hover{background:var(--hot-soft)}
.menu2 .mv{font:500 11.5px var(--mono);color:var(--ink-3);padding:8px 12px 4px;border-top:1px solid var(--line-soft);margin-top:4px}
.wsl.three{grid-template-columns:1fr 1fr 1fr}
.wrow .who{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}
@media (max-width:760px){.top{flex-wrap:wrap}.nav{overflow-x:auto;flex-wrap:nowrap;width:100%;padding-bottom:4px}.nav .tab,.modesw{flex:none}.cap{order:9;width:100%!important;margin:6px 0 0}.hall{height:auto}.hero3,.h3-row{grid-template-columns:1fr!important}.hb .nm{font-size:38px}.wrow,.whead{grid-template-columns:1fr!important}.hb .go{position:static;align-self:flex-start;margin-top:16px}}
@media (max-width:760px){#rit.open{grid-template-columns:1fr!important;grid-template-rows:auto 1fr}.r-rail{flex-direction:row!important;align-items:center;gap:12px;padding:12px 16px!important;border-right:0!important;border-bottom:1px solid var(--line)}.r-rail .ring,.r-rail .r-tally,.r-rail .r-steps,.r-rail .r-kind{display:none!important}.r-rail .r-title{font-size:22px;margin:0}.r-foot{margin:0 0 0 auto!important}.r-stage{overflow:auto;min-height:0}.r-inner{padding:22px 18px 40px!important}.r-name{font-size:40px!important}.r-tiles{grid-template-columns:1fr 1fr!important}}
}
</style><link rel="stylesheet" href="/frame2.css"><div class="t2app" data-skin="1" data-mode="work"><header class="top"><span class="brand">Daily Ritual</span><nav class="nav" id="nav"></nav></header><main id="stage"></main><div id="rit"></div><div id="toast"></div></div>`;
const APP=ROOT.querySelector('.t2app'),$=id=>ROOT.getElementById(id);
const UI=()=>{const u=R().ui;if(!u._w2||typeof u._w2!=='object')u._w2={page:'home'};return u._w2};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function save(){LAST_INPUT=Date.now();window.save()}
const addD=n=>{const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const dTo=s=>Math.round((new Date(s+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5);
const short=s=>new Date(s+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'});
const dl=s=>{const n=dTo(s);return n<0?(-n)+'d late':n===0?'today':n===1?'tomorrow':n<7?'in '+n+'d':short(s)};
const sinceD=ts=>Math.floor((Date.now()-ts)/864e5);
let TT;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('in');clearTimeout(TT);TT=setTimeout(()=>t.classList.remove('in'),3200)}
function cp(text){(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(()=>toast('copied')).catch(()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('copied')})}

/* ---------- real work data ---------- */
const live=()=>R().items.filter(i=>i.mode==='work'&&!i.done);
const lane=i=>LANES.find(l=>l.id===i.lane)||null;
const dot=i=>(lane(i)||{color:'#B8BCC6'}).color;
const P=()=>plan('work');
const waiting=()=>live().filter(i=>i.lane==='followup');
const wLate=i=>!!(i.lane==='followup'&&i._wait&&i._wait.checkBack&&i._wait.checkBack<=today());
const buffer=()=>P().buffer.map(byId).filter(i=>i&&!i.done);
const ritSteps=()=>zSteps('work'),ritDoneN=()=>(R().ritual.work||[]).filter(id=>ritSteps().some(x=>x.id===id)).length;
const ritualDone=()=>ritDoneN()>=ritSteps().length;
const cDay=i=>new Date(i.created||Date.now()).toISOString().slice(0,10);
function migrateW2(){let ch=0;R().items.forEach(i=>{if(i.mode!=='work')return;if(i.lane!=='followup'||i.done){if(i._wait&&!i.done){delete i._wait;ch++}return}
  if(!i._wait||!i._wait.checkBack){const s=(i._wait&&i._wait.since)||cDay(i),d=new Date(s+'T12:00:00');d.setDate(d.getDate()+3);i._wait=Object.assign({who:''},i._wait||{},{since:s,checkBack:d.toISOString().slice(0,10)});ch++}});if(ch)window.save()}
function toWait(i,who,days){clearFromPlan('work',i.id);i.lane='followup';i.bucket='board';i._wait={who:who||'',since:today(),checkBack:addD(days||3)};save()}
function finishIt(i){try{if(P().deep===i.id&&typeof markDeepHit==='function')markDeepHit('work',i.id)}catch(e){}clearFromPlan('work',i.id);i.done=true;i.doneAt=Date.now();save()}
function backToMe(i){i.lane='urgent';delete i._wait;save()}
const instr=i=>`Task: ${i.text}\nArea: ${(lane(i)||{name:'—'}).name}${i.steps&&i.steps.length?'\nSteps:\n'+i.steps.map(s=>'- '+(s.text||s)).join('\n'):''}\n\nPlease take care of this for me. Tell me what you did, what is still open, and anything you need from me.`;

/* ---------- what needs attention ---------- */
function attention(){const out=[];
  live().forEach(i=>{if(i.due&&i.due<today())out.push({id:i.id,k:'late',w:'Late',t:i.text,why:dl(i.due)+' past its deadline'});
    else if(wLate(i))out.push({id:i.id,k:'late',w:'Follow up',t:i.text,why:(i._wait.who||'someone')+' · was due '+dl(i._wait.checkBack)})});
  gActive().filter(g=>g.route==='stuck'&&(g.focus||!gFocus().length)).forEach(g=>out.push({goal:1,k:'stuck',w:'Goal',t:g.title,why:'stuck — step back'}));
  return out}
function ritState(){
  const b=buffer().length,od=waiting().filter(wLate).length,lc=R().goals.lastCheck,sb=lc?sinceD(lc):null,rd=ritualDone();
  const L=[
    {k:'work',name:ritDoneN()&&!rd?'Continue the ritual':'Work ritual',line:rd?'done today · '+(P().batch.length+(P().deep?1:0)+P().next.length)+' on the plan':ritDoneN()+' of '+ritSteps().length+' steps today',need:!rd,icon:'◐'},
    {k:'ai',name:'AI round',line:b?b+' to hand off today':'nothing to hand off',need:b>0,icon:'✦',n:b},
    {k:'follow',name:'Follow up',line:od?od+' overdue':waiting().length?waiting().length+' waiting, none overdue':'nobody to chase',need:od>0,icon:'↩',n:od,warn:od},
    {k:'step',name:'Step back',line:sb===null?'goals never checked':'goals checked '+sb+' days ago',need:sb===null||sb>=7,icon:'◎',warn:sb===null||sb>=7},
    {k:'reset',name:'Energy reset',line:'stuck? five steps back to focus',need:false,icon:'⚡'}];
  const next=['work','ai','follow','step'].map(k=>L.find(x=>x.k===k)).find(x=>x.need)||L.find(x=>x.k==='reset');
  return {L,next}}
function go(k){if(k==='work'){startZen();window.render()}else if(k==='reset'){startReset();window.render()}else if(k==='step'){R().ui.workView='goals';save();window.render();startStepBack()}
  else if(k==='follow'){UI().page='waiting';render()}else if(k==='ai')startAI()}

/* ---------- home ---------- */
/* Home's first box: this week's board, by lane — what you picked for today is marked */
function weekPanel(){
  const pl=P(),tod=new Set([pl.deep,...pl.batch,...pl.next,...pl.buffer].filter(Boolean));
  const L=onBoard('work').filter(i=>!PARKED.work.includes(i.lane));
  const order=['urgent','important','batch','followup'];
  const G=order.map(id=>({l:LANES.find(x=>x.id===id),L:L.filter(i=>i.lane===id).sort((a,b)=>(tod.has(b.id)-tod.has(a.id))||((a.ord||0)-(b.ord||0)))})).filter(g=>g.L.length);
  const other=L.filter(i=>!order.includes(i.lane));if(other.length)G.push({l:{name:'Unsorted',color:'#B8BCC6'},L:other});
  return `<div class="pp"><div class="pp-h"><span class="mono">This week’s plan</span><span class="pp-n">${L.length}</span><span class="grow"></span>${tod.size?'<button class="btn sm" data-copy="1">⧉ Copy today</button>':''}</div>
    ${G.length?`<div class="wkp">${G.map(g=>`<div class="wkg"><div class="wkl"><span class="dot" style="--c:${g.l.color}"></span>${g.l.name}<span>${g.L.length}</span></div>
      ${g.L.map(i=>`<button class="wli" data-open="${i.id}">${esc(i.text)}${tod.has(i.id)?' <b class="tod">today</b>':''}${i.due&&i.due<today()?' <b class="red">late</b>':''}</button>`).join('')}</div>`).join('')}</div>`
      :`<div class="note" style="margin-top:10px">Nothing on the board this week. The Work ritual picks it in a few minutes.</div>`}
    <button class="link" data-view="today" style="margin-top:12px">open Today →</button></div>`}
function planPanel(){
  if(!ritualDone()&&!UI().peek)return `<div class="pp-empty"><div class="mono">Today’s plan</div><div class="big serif">Today’s plan appears<br>after the Work ritual.</div>
    <div class="note">Music on, dump, sort, pick — then the day lands here, ready to copy.</div>
    <div style="display:flex;gap:10px;margin-top:18px;align-items:center"><button class="btn hot" data-go="work">◐ Start the Work ritual</button><button class="link" data-peek="1">peek at today’s plan</button></div></div>`;
  const p=P(),d=p.deep?byId(p.deep):null,li=ids=>ids.map(byId).filter(Boolean).map(i=>`<button class="wli" data-open="${i.id}">${esc(i.text)}${i.due&&i.due<today()?' <b class="red">late</b>':''}</button>`).join('')||'<div class="note">—</div>';
  return `<div class="pp"><div class="pp-h"><span class="mono">Today’s plan</span><span class="pp-n">${(d?1:0)+p.batch.length+p.next.length+p.buffer.length}</span><span class="grow"></span><button class="btn sm" data-copy="1">⧉ Copy today</button></div>
    <div class="wdeep" ${d?`data-open="${d.id}"`:''}><span class="mono">Deep</span><div class="t">${d?esc(d.text):'— nothing deep picked'}</div>${d?`<div class="a"><span class="dot" style="--c:${dot(d)}"></span>${(lane(d)||{name:''}).name}${d.due?' · due '+dl(d.due):''}</div>`:''}</div>
    <div class="wsl three"><div><span class="mono">Batch</span>${li(p.batch)}</div><div><span class="mono">Spare</span>${li(p.next)}</div><div><span class="mono">To AI</span>${li(p.buffer)}</div></div>
    ${!ritualDone()?'<button class="link" data-peek="0" style="margin-top:10px">hide — run the ritual first</button>':''}</div>`}
function attPanel(max){const A=attention();
  return `<div class="ap"><div class="mono">Needs your attention</div>${A.length?A.slice(0,max).map(a=>`<button class="ap-i st-${a.k}" ${a.id?`data-open="${a.id}"`:'data-view="goals"'}><span class="w">${a.w}</span><span class="t">${esc(a.t)}</span><span class="why">${esc(a.why)}</span></button>`).join('')+(A.length>max?`<div class="note" style="margin-top:6px">+ ${A.length-max} more</div>`:''):'<div class="note" style="margin-top:8px">Nothing late or stuck.</div>'}</div>`}
function goalsPanel(){const anyF=gFocus().length,G=gActive().slice().sort((a,b)=>!!b.focus-!!a.focus);
  return `<div class="arp"><div class="arp-h"><span class="mono">How your goals are doing</span><button class="link" data-view="goals">goals →</button></div>
    ${G.map(g=>{const rest=anyF&&!g.focus,r=rest?null:G_ROUTE.find(x=>x.id===g.route);return `<button class="arp-i ${rest?'rest':''}" data-view="goals" title="${esc(gNext(g))}"><span class="n" style="font-weight:500">${g.focus?'◎ ':''}${esc(g.title)}</span><span class="st" style="--sc:${r?r.color:'#8A909C'}"><span class="sdot"></span>${rest?'Resting':r?r.name:'Not checked'}</span></button>`}).join('')||'<div class="note">No active goals yet.</div>'}
    <div class="wcounts"><button data-view="today"><b>${onBoard('work').length}</b> on the board</button><button data-view="backlog"><b>${inBacklog('work').length}</b> backlog</button><button data-page="waiting"><b>${waiting().length}</b> waiting</button></div></div>`}
function home(){const {L,next}=ritState(),main=L[0],others=L.slice(1),isNext=r=>r===next;
  return `<div class="hall h3"><div class="hero3"><button class="hb ${isNext(main)?'next':'later'}" data-go="${main.k}"><span class="mono">${isNext(main)?'Up next':ritualDone()?'Today’s ritual · done ✓':'Today’s ritual'}</span><span class="nm">${main.icon} ${main.name}</span><span class="sub">Music, dump, sort, pick. The whole day in about 10 minutes.</span><span class="ln">${main.line}</span><span class="go">${isNext(main)?'Start <kbd>⏎</kbd>':ritualDone()?'Open again':'Start'}</span></button>
      <div class="hs">${others.map(r=>`<button class="hsr ${isNext(r)?'next':r.need?'':'calm'}" data-go="${r.k}">${isNext(r)?'<span class="upnext">Up next <kbd>⏎</kbd></span>':''}<span class="ic">${r.icon}</span><b>${r.name}</b><small class="${r.warn?'warn':''}">${r.line}</small></button>`).join('')}</div></div>
    <div class="h3-row"><div class="panel">${weekPanel()}</div><div class="panel">${attPanel(4)}</div><div class="panel">${goalsPanel()}</div></div></div>`}

/* ---------- waiting ---------- */
function pageWaiting(){const L=waiting().sort((a,b)=>(wLate(b)-wLate(a))||((a._wait||{}).checkBack<(b._wait||{}).checkBack?-1:1)),od=L.filter(wLate).length;
  return `<div class="page"><div class="ib"><h1>Waiting</h1><div class="lede">Work that’s with someone else — your Follow Up lane. Every item has a check-back day.${od?` <b style="color:var(--late)">${od} overdue.</b>`:''}</div>
    ${L.length?'<div class="whead"><span>What</span><span>Who has it</span><span>Since</span><span>Check back</span><span></span></div>':''}
    ${L.map(i=>{const w=i._wait||{},lt=wLate(i),n=w.checkBack?-dTo(w.checkBack):0;return `<div class="wrow ${lt?'over':''}"><div class="t" data-open="${i.id}">${esc(i.text)}<small><span class="dot" style="--c:${dot(i)}"></span>${i.project?esc(i.project):'Follow Up'}</small></div>
      <span class="c who" data-who="${i.id}">${w.who==='Claude'?'✦ Claude':esc(w.who||'who?')}</span><span class="c">${w.since?short(w.since):'—'}</span>
      <span class="c ${lt?'red':''}"><input type="date" class="fld" data-cb="${i.id}" value="${w.checkBack||''}" style="padding:5px 8px;font-size:13.5px">${lt?`<small style="display:block">${n>1?n+' days overdue':n===1?'1 day overdue':'due today'}</small>`:''}</span>
      <div class="acts"><button class="btn sm ${lt?'hot':''}" data-nudge="${i.id}">Nudged → +3d</button><button class="btn sm" data-land="${i.id}">Landed ✓</button><button class="btn sm ghost" data-back="${i.id}">Back to me</button></div></div>`}).join('')
    ||'<div class="empty"><h3>Nobody has the ball.</h3><p>Anything in your Follow Up lane shows up here.</p></div>'}</div></div>`}

/* ---------- AI round: one card at a time over today's AI slot ---------- */
function startAI(){if(!buffer().length){toast('nothing in today’s AI slot');return}UI().rit={started:Date.now(),tally:{},skipped:[],open:true};save();drawRit()}
const aiQ=()=>buffer().filter(i=>!UI().rit.skipped.includes(i.id));
const TL={sent:'sent to AI',done:'done',mine:'taken back',off:'off today'};
let RCLOCK=null;
function drawRit(){const el=$('rit'),r=UI().rit;
  if(!r||!r.open){el.className='';el.innerHTML='';clearInterval(RCLOCK);RCLOCK=null;return}
  const Q=aiQ(),i=Q[0],T=Object.entries(r.tally).filter(([,n])=>n),tot=T.reduce((n,[,v])=>n+v,0),all=tot+Q.length,C=2*Math.PI*58,prog=all?tot/all:1;
  el.className='open';el.dataset.r='wai';
  el.innerHTML=`<div class="aura"><i></i><i></i><i></i></div><div class="r-rail"><div class="r-kind">Work ritual</div><div class="r-title">AI round</div>
    <div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="58" class="trk"/><circle cx="66" cy="66" r="58" class="bar" style="stroke-dasharray:${C};stroke-dashoffset:${C*(1-prog)}"/></svg><div class="rc-in"><span id="rclock">00:00</span><small>${Q.length} to go</small></div></div>
    <div class="r-tally" style="margin-top:auto"><div class="mono">This session</div><div class="big">${tot||'—'}</div><div class="tl">${T.map(([k,n])=>`<span>${n} ${TL[k]}</span>`).join('')||'<span>decisions land here</span>'}</div></div>
    <div class="r-foot"><button class="r-pause" data-pause="1">Pause · esc</button></div></div>
    <div class="r-stage"><div class="r-inner"><div class="r-eyebrow">AI round · today’s slot</div><div class="r-name">${i?'Hand it to Claude':'The slot is empty'}</div>
      <div class="r-note">${i?'Copy it, send it, mark it sent. It waits in Follow Up until it lands.':'Everything sent waits in Waiting until it lands.'}</div>
      <div class="r-body">${i?`<div class="deck ${Q.length<2?'single':''}"><div class="r-card" id="rcard"><div class="from"><span class="dot" style="--c:${dot(i)}"></span>${(lane(i)||{name:'Unsorted'}).name}<span class="cnt">${Q.length} to go</span></div>
        <h3>${esc(i.text)}</h3><textarea class="r-instr" id="rinstr">${esc(instr(i))}</textarea>
        <div class="r-tiles" style="margin-top:14px"><button class="r-tile" data-ai="copy"><kbd>C</kbd>⧉ Copy</button><button class="r-tile" data-ai="open"><kbd>O</kbd>Open in Claude ↗</button>
          <button class="r-tile primary" data-ai="sent"><kbd>S</kbd>Sent → Waiting</button><button class="r-tile" data-ai="done"><kbd>D</kbd>✓ Already done</button><button class="r-tile" data-ai="mine"><kbd>M</kbd>I’ll do it myself</button><button class="r-tile" data-ai="off"><kbd>X</kbd>Not today</button><button class="r-tile" data-ai="skip"><kbd>→</kbd>Skip</button></div></div></div>`
        :`<div class="r-clear"><b>Handed off.</b><p>${tot} decided this round.</p></div>`}</div>
      <div class="r-bar"><button class="r-go" data-close="1">${i?'Stop here':'Back to Home'} <kbd>⏎</kbd></button><span class="r-hint">${i?'C copy · O open Claude · S sent · D done · M mine · X not today':''}</span></div></div></div>`;
  const tick=()=>{const c=$('rclock');if(c&&UI().rit){const s=Math.floor((Date.now()-UI().rit.started)/1000);c.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}};
  tick();if(!RCLOCK)RCLOCK=setInterval(tick,1000);
  el.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>aiAct(b.dataset.ai));
  el.querySelector('[data-pause]').onclick=closeRit;el.querySelector('[data-close]').onclick=closeRit;
  const ta=$('rinstr');if(ta)ta.onkeydown=e=>e.stopPropagation()}
let BUSY=false;
function aiAct(a){const r=UI().rit,i=aiQ()[0];if(!i||BUSY)return;const ta=$('rinstr'),text=ta?ta.value:instr(i);
  if(a==='copy'){cp(text);return}
  if(a==='open'){cp(text);window.open('https://claude.ai/new?q='+encodeURIComponent(text),'_blank');return}
  const c=$('rcard'),dir={sent:'right',done:'up',mine:'up',off:'down',skip:'left'}[a];
  const run=()=>{BUSY=false;if(a==='skip')r.skipped.push(i.id);
    else{if(a==='sent')toWait(i,'Claude',2);else if(a==='done')finishIt(i);
      else if(a==='mine'){if(!assign('work','batch',i.id,true)&&!assign('work','next',i.id,true))clearFromPlan('work',i.id);save()}
      else if(a==='off'){clearFromPlan('work',i.id);save()}
      r.tally[a]=(r.tally[a]||0)+1}
    save();drawRit()};
  if(c){BUSY=true;c.classList.add('out','to-'+dir);setTimeout(run,200)}else run()}
function closeRit(){if(UI().rit){UI().rit.open=false;UI().rit=null}save();drawRit();render()}

/* ---------- frame ---------- */
function navHTML(){const od=waiting().filter(wLate).length,pg=stripOn()?'':UI().page,wv=stripOn()?R().ui.workView:'';
  const t=(attr,l,on,n,red)=>`<button class="tab ${on?'on':''}" ${attr}>${l}${n!=null?`<span class="n ${red?'red':''}">${n}</span>`:''}</button>`;
  return `<div class="modesw"><button class="on">Work</button><button data-personal="1" title="Tab">Personal</button></div>
    <div class="tabs">${t('data-page="home"','Home',pg==='home')}${t('data-view="today"','Today',wv==='today')}${t('data-view="backlog"','Backlog',wv==='backlog',inBacklog('work').length||null)}${t('data-view="goals"','Goals',wv==='goals')}<span class="navsep"></span>
    ${t('data-go="ai"','AI round',false,buffer().length)}${t('data-page="waiting"','Waiting',pg==='waiting',waiting().length,od)}</div>
    <label class="cap"><input id="cap" placeholder="Dump it → work inbox"><span>⏎</span></label><button class="more2" data-menu="1" title="Sync, backup, done list">⋯</button>`}
function render(){
  migrateW2();
  APP.toggleAttribute('data-strip',stripOn());
  if(stripOn()){$('nav').innerHTML=navHTML();$('stage').innerHTML='';wire();return}
  if(!['home','waiting'].includes(UI().page))UI().page='home';
  $('nav').innerHTML=navHTML();
  const st=$('stage');st.innerHTML=UI().page==='waiting'?pageWaiting():home();st.className='w-'+UI().page;
  wire();drawRit()}
function wire(){const on=(s,f)=>APP.querySelectorAll(s).forEach(b=>b.onclick=e=>f(b,e));
  on('[data-go]',b=>go(b.dataset.go));
  on('[data-page]',b=>{UI().page=b.dataset.page;R().ui.workView='home';save();window.render()});
  on('[data-view]',b=>{R().ui.workView=b.dataset.view;save();window.render()});
  on('[data-personal]',()=>{R().ui.mode='personal';save();window.render()});
  on('[data-open]',b=>{const i=byId(b.dataset.open);if(!i)return;R().ui.workView=i.bucket==='backlog'?'backlog':'today';save();window.render();setTimeout(()=>{try{openDetail(i.id)}catch(e){}},50)});
  on('[data-copy]',()=>cp(planText('work')));
  on('[data-peek]',b=>{UI().peek=b.dataset.peek==='1';save();render()});
  on('[data-nudge]',b=>{const i=byId(b.dataset.nudge);i._wait.checkBack=addD(3);save();render();toast('check back '+dl(i._wait.checkBack))});
  on('[data-land]',b=>{finishIt(byId(b.dataset.land));render();toast('landed ✓')});
  on('[data-back]',b=>{backToMe(byId(b.dataset.back));render();toast('back to you — in Urgent')});
  on('[data-who]',b=>{const i=byId(b.dataset.who),v=prompt('Who has it?',i._wait.who||'');if(v!==null){i._wait.who=v.trim();save();render()}});
  on('[data-menu]',(b,e)=>{e.stopPropagation();menu(b)});
  APP.querySelectorAll('[data-cb]').forEach(t=>t.onchange=()=>{const i=byId(t.dataset.cb);if(!t.value){t.value=i._wait.checkBack;toast('waiting always needs a check-back day');return}i._wait.checkBack=t.value;save();render()});
  const cap=$('cap');if(cap)cap.onkeydown=e=>{if(e.key==='Enter'&&cap.value.trim()){add(cap.value.trim(),'work');cap.value='';save();render();toast('in the work inbox — the ritual sorts it')}}}
function menu(btn){let m=$('menu2');if(m){m.remove();return}
  m=document.createElement('div');m.id='menu2';m.className='menu2';
  m.innerHTML=`<button data-m="sync">${esc(syncLabel())}</button><button data-m="done">Done list</button><button data-m="exp">↓ Export a backup</button><button data-m="imp">↑ Import a backup</button><button data-m="look">${lookNow()==="classic"?"✦ Switch to the new look":"◐ Switch to the classic look"}</button><button data-m="classic">Open the classic app</button><div class="mv">Daily Ritual ${APPVER} · work2 · r5</div>`;
  APP.appendChild(m);const r=btn.getBoundingClientRect();m.style.top=(r.bottom+6)+'px';m.style.right=Math.max(8,innerWidth-r.right)+'px';
  m.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{m.remove();({sync:syncSheet,done:doneSheet,exp:()=>exportBackup(false),imp:importBackup,look:toggleLook,classic:()=>{location.search='?classic=1'}})[b.dataset.m]()});
  setTimeout(()=>{const c=ev=>{if(!m.contains(ev.composedPath()[0]))m.remove();ROOT.removeEventListener('click',c)};ROOT.addEventListener('click',c)},0)}

/* ---------- hand-off with app_1 (and town2, which wraps render first) ---------- */
const active=()=>R().ui.mode==='work'&&R().ui.workView==='home'&&!ZEN&&!TZ&&!BR;
const stripOn=()=>R().ui.mode==='work'&&['today','backlog','goals'].includes(R().ui.workView);
const appEl=document.getElementById('app'),prev=window.render;
window.render=function(){applyLook();   /* the look can change from the menu or another device */
  if(active()){delete document.body.dataset.w2strip;host.style.bottom='0';appEl.style.display='none';const t2=document.getElementById('town2');if(t2)t2.style.display='none';host.style.display='block';document.body.dataset.mode='work';render()}
  else if(stripOn()){prev();host.style.bottom='auto';host.style.display='block';render();
    document.body.dataset.w2strip='1';document.body.style.setProperty('--w2h',Math.ceil(host.getBoundingClientRect().height)+'px')}
  else{delete document.body.dataset.w2strip;host.style.display='none';prev()}};
/* the page under the bar starts where the bar ends — re-measured whenever the bar changes size:
   the window, a phone wrap, and the bar's stylesheet and fonts arriving after the first draw */
const w2h=()=>{if(stripOn()&&host.style.display!=='none')document.body.style.setProperty('--w2h',Math.ceil(host.getBoundingClientRect().height)+'px')};
window.addEventListener('resize',w2h);
if(window.ResizeObserver)new ResizeObserver(w2h).observe(host);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(w2h);
const appSheetOpen=()=>['layer','mlayer','dplayer'].some(id=>{const e=document.getElementById(id);return e&&e.innerHTML});
function keys(e,t){LAST_INPUT=Date.now();const typing=/INPUT|TEXTAREA|SELECT/.test(t.tagName||''),r=UI().rit,k=e.key.toLowerCase();
  if(r&&r.open){if(e.key==='Escape'||(e.key==='Enter'&&!typing)){e.preventDefault();closeRit();return}if(typing||e.repeat||e.metaKey||e.ctrlKey||e.altKey)return;
    const m={c:'copy',o:'open',s:'sent',d:'done',m:'mine',x:'off',arrowright:'skip'}[k];if(m){e.preventDefault();aiAct(m)}return}
  if(typing)return;
  if(e.key==='Tab'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){e.preventDefault();R().ui.mode='personal';save();window.render();return}
  if(e.key==='Enter'&&UI().page==='home'){e.preventDefault();go(ritState().next.k)}}
window.addEventListener('keydown',e=>{if(!active()||appSheetOpen()||e.composedPath().includes(host))return;keys(e,document.body);e.stopImmediatePropagation()},true);
host.addEventListener('keydown',e=>{if(!active()||appSheetOpen())return;keys(e,e.composedPath()[0]||host);e.stopPropagation()});

migrateW2();
/* draw at load on Home and also on Today / Backlog / Goals (the bar), so a refresh never shows the old header */
if(active()||stripOn())window.render();
window.__W2={ROOT,render:()=>window.render(),UI};
})();
