/* Two devices syncing through Cloudflare's local simulator — the real Worker, a real (local) D1
   database and the real app in two browsers. Nothing here ships with the app.

   Run from the repo root:   npx wrangler dev --persist-to /tmp/cf-test     (leave it running)
   then from this folder:    node cloudflare.e2e.cjs
   It leaves a few test files in that local database; delete the folder to start fresh. */
let chromium;try{({chromium}=require("playwright"))}catch(e){({chromium}=require(require("child_process").execSync("npm root -g").toString().trim()+"/playwright"))}
const BASE=process.env.BASE||'http://localhost:8787';
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('  ✓ '+m)}else{fail++;console.log('  ✗ '+m)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(page,expr,ms=15000){const t=Date.now();while(Date.now()-t<ms){try{if(await page.evaluate(expr))return true}catch(e){}await sleep(150)}return false}
const PASS='correct horse battery '+Date.now();
(async()=>{
  const browser=await chromium.launch();
  const mac=await (await browser.newContext({viewport:{width:1280,height:850}})).newPage();
  const phone=await (await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
  const errs=[];for(const [n,p] of [['mac',mac],['phone',phone]]){p.on('pageerror',e=>errs.push(n+': '+e.message))}
  const net={mac:[],phone:[]};
  for(const [n,p] of [['mac',mac],['phone',phone]])p.on('response',async r=>{if(r.url().includes('/api/sync')){let b='';try{b=await r.text()}catch(e){}
    net[n].push({m:r.request().method(),s:r.status(),unchanged:b.includes('"unchanged":true'),len:b.length})}});
  await mac.goto(BASE);await phone.goto(BASE);
  ok(await mac.evaluate(()=>typeof syncSheet==='function'),'the app loads from Cloudflare');
  /* first device */
  await mac.evaluate(()=>{LAST_INPUT=Date.now();add('From Mac','work')});
  await mac.evaluate(()=>syncSheet());
  await mac.fill('#syp1',PASS);await mac.fill('#syp2',PASS);await mac.click('#sygo');
  await mac.waitForSelector('#syfirst',{timeout:30000});await mac.click('#syfirst');
  ok(await until(mac,()=>SY&&!SY.dirty&&SY.etag),'Mac: sync turned on, data uploaded');
  /* second device joins */
  await phone.evaluate(()=>syncSheet());
  await phone.fill('#syp1',PASS);await phone.fill('#syp2',PASS);await phone.click('#sygo');
  await phone.waitForLoadState();await sleep(1500);
  ok(await until(phone,()=>typeof S!=='undefined'&&S.items.some(i=>i.text==='From Mac'),30000),'phone: same passphrase brings the Mac’s data');
  /* phone edits, leaves the app → Mac comes back and sees it */
  await phone.evaluate(()=>{LAST_INPUT=Date.now();add('From phone','work')});
  ok(await phone.evaluate(()=>SY.dirty===true),'phone: an edit waits (no instant upload)');
  await phone.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  ok(await until(phone,()=>!SY.dirty),'phone: leaving the app uploads it');
  net.mac.length=0;
  await mac.evaluate(()=>{SYNC_CHECKED=0;window.dispatchEvent(new Event('focus'))});
  await mac.waitForLoadState();await sleep(1200);
  ok(await until(mac,()=>typeof S!=='undefined'&&S.items.some(i=>i.text==='From phone')),'Mac: coming back brings the phone’s edit');
  /* nothing new: a check is a tiny "unchanged" */
  net.mac.length=0;
  await mac.evaluate(()=>{SYNC_CHECKED=0;window.dispatchEvent(new Event('focus'))});await sleep(1200);
  ok(net.mac.length===1&&net.mac[0].unchanged&&net.mac[0].len<120,'Mac: checking again with nothing new is a tiny “unchanged” reply ('+(net.mac[0]&&net.mac[0].len)+' bytes)');
  await mac.evaluate(()=>{window.dispatchEvent(new Event('focus'))});await sleep(600);
  ok(net.mac.length===1,'Mac: clicking back in right away does not check again');
  /* both edit different things at once → merged, nobody asked */
  await mac.evaluate(()=>{LAST_INPUT=Date.now();add('Mac offline edit','work')});
  await phone.evaluate(()=>{LAST_INPUT=Date.now();add('Phone offline edit','work')});
  await mac.evaluate(()=>window.dispatchEvent(new Event('blur')));
  ok(await until(mac,()=>!SY.dirty),'Mac uploads first');
  await phone.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await phone.waitForLoadState();await sleep(2000);
  ok(await until(phone,()=>typeof S!=='undefined'&&S.items.some(i=>i.text==='Mac offline edit')&&S.items.some(i=>i.text==='Phone offline edit')&&!SY.dirty,20000),'phone: both edits merged, no question asked');
  ok(!(await phone.evaluate(()=>!!document.querySelector('.syncpick'))),'… and no “which version” pop-up');
  await mac.evaluate(()=>{SYNC_CHECKED=0;window.dispatchEvent(new Event('focus'))});await mac.waitForLoadState();await sleep(1500);
  ok(await until(mac,()=>typeof S!=='undefined'&&S.items.some(i=>i.text==='Phone offline edit')&&S.items.some(i=>i.text==='Mac offline edit')),'Mac: has both too');
  /* the stored copy is unreadable */
  const raw=await mac.evaluate(async()=>{const r=await fetch('/api/sync?id='+SY.id);return r.text()});
  ok(!raw.includes('From Mac')&&!raw.includes('Phone offline edit')&&raw.includes('"ct"'),'what Cloudflare stores is ciphertext only');
  /* limits */
  const big=await mac.evaluate(async()=>{const r=await fetch('/api/sync',{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id:SY.id,etag:SY.etag,doc:{v:1,iv:'x',ct:'A'.repeat(2000000),savedAt:1}})});return [r.status,await r.text()]});
  ok(big[0]===413,'a file over 1.9 MB is refused, not half-stored');
  const still=await mac.evaluate(async()=>{const r=await fetch('/api/sync?id='+SY.id);const j=await r.json();return j.etag===SY.etag});
  ok(still,'… and the stored copy is untouched');
  const ids=await mac.evaluate(async()=>{const out=[];for(let k=0;k<6;k++){const id=(k+'').repeat(64).slice(0,64).replace(/[^a-f0-9]/g,'b');
      const r=await fetch('/api/sync',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:('c'+k).padEnd(64,'d'),etag:null,doc:{v:1,iv:'x',ct:'y',savedAt:1}})});out.push(r.status)}return out});
  ok(ids.filter(s=>s===200).length===4&&ids.slice(4).every(s=>s===507),'strangers can create at most a few files, then “full” ('+ids.join(',')+')');
  const after=await mac.evaluate(async()=>{LAST_INPUT=Date.now();add('After the junk','work');window.dispatchEvent(new Event('blur'));
    await new Promise(r=>setTimeout(r,1500));return !SY.dirty});
  ok(after,'… while your own file keeps syncing');
  /* a too-big upload from the app itself says so */
  await phone.evaluate(()=>{syncPut=async()=>{const e=new Error('sync 413');e.kind='big';throw e};LAST_INPUT=Date.now();add('x','work');window.dispatchEvent(new Event('blur'))});
  ok(await until(phone,()=>SYNC_STATUS==='big'&&document.getElementById('syncbtn').textContent.includes('Too big')),'the app says “Too big to sync” instead of “offline”');
  ok(errs.length===0,'no page errors: '+errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();process.exit(fail?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(2)});
