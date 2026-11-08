const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [w,hh,mob,nm] of [[1366,760,0,'pc'],[780,360,1,'ph']]){
const ctx=await b.newContext({viewport:{width:w,height:hh},isMobile:!!mob,hasTouch:!!mob});await ctx.addInitScript({path:'../mock3.js'});await ctx.addInitScript(()=>{localStorage.setItem('za_nick_ok','1');localStorage.setItem('za_chat','{}');localStorage.setItem('za_skipvid','1');sessionStorage.setItem('za_rot','1')});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file:///mnt/user-data/outputs/z-arena.html');await p.waitForTimeout(2500);
await p.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove()});await p.screenshot({path:'live_menu_'+nm+'.png'});
const r=await p.evaluate(()=>{let games=0,bad=[];const K=ROS.filter(k=>C[k]);for(let g=0;g<25;g++){try{const sh=()=>K.slice().sort(()=>Math.random()-.5).slice(0,4);G.bot=1;G.fd="r";G.tm=[sh(),sh()];G.intro=0;newGame();G.annB=0;let n=0;while(G.win==null&&n++<70){botPlan(G.cur,2);endTurn()}games++}catch(e){bad.push(e.message)}}return {games,bad:bad.slice(0,5)}});
console.log(nm,JSON.stringify(r));
await p.evaluate(()=>{G.bot=1;G.fd="namek";G.tm=[["gu","za","beast","rd"],["black","tu","kf","mv"]];G.intro=0;newGame();G.annB=0;render()});await p.waitForTimeout(2500);await p.screenshot({path:'live_bt_'+nm+'.png'});
await p.evaluate(()=>showChars());await p.waitForTimeout(500);await p.screenshot({path:'live_ch_'+nm+'.png'});
await p.evaluate(()=>startDraft());await p.waitForTimeout(1500);await p.screenshot({path:'live_dr_'+nm+'.png'});
console.log(nm,'page errors',errs.length,[...new Set(errs)].slice(0,6));await ctx.close()}
await b.close()})();
