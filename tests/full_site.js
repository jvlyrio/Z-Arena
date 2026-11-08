const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [w,hh,mob,nm] of [[1366,760,0,'pc'],[780,360,1,'ph'],[390,780,1,'pt']]){
const ctx=await b.newContext({viewport:{width:w,height:hh},isMobile:!!mob,hasTouch:!!mob});await ctx.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:require('fs').readFileSync('fsb.js','utf8')}));await ctx.addInitScript(()=>{localStorage.setItem('za_nick_ok','1');localStorage.setItem('za_login','1');localStorage.setItem('za_chat','{}');localStorage.setItem('za_skipvid','1');sessionStorage.setItem('za_rot','1')});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file:///home/claude/z-arena/index.html');await p.waitForTimeout(2500);
await p.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove()});
await p.evaluate(()=>{const K=ROS.filter(k=>C[k]);for(let g=0;g<10;g++){const sh=K.slice().sort(()=>Math.random()-.5);G.bot=1;G.fd="r";G.tm=[sh.slice(0,4),sh.slice(4,8)];G.intro=0;newGame();G.annB=0;let n=0;while(G.win==null&&n++<70){botPlan(G.cur,2);endTurn()}}});
await p.waitForTimeout(1200);
const steps=[['menu',()=>showMenu()],['chars',()=>showChars()],['patch',()=>showPatch()],['tut',()=>showTut()],['online',()=>showOnline()],['draft',()=>startDraft()],['opts',()=>{showMenu();mmOpts()}]];
const res=[];for(const [n,f] of steps){await p.evaluate(f);await p.waitForTimeout(700);res.push(n+':'+await p.evaluate(()=>{const o=document.getElementById('pann');return o&&o.className?'PANN('+o.dataset.k+')':'ok'}))}
console.log(nm,res.join(' '),'errs',[...new Set(errs)].slice(0,5));await ctx.close()}
await b.close()})();
