const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [w,h,mob,nm] of [[1366,760,0,'pc'],[860,380,1,'ph'],[412,915,1,'php']]){const ctx=await b.newContext({viewport:{width:w,height:h},isMobile:!!mob,hasTouch:!!mob});await ctx.addInitScript({path:'../mock3.js'});await ctx.addInitScript(()=>{localStorage.setItem('za_nick_ok','1');localStorage.setItem('za_skipvid','1');sessionStorage.setItem('za_rot','1');for(const k of ['ft_stats','sn_jw','bal_Patch 0.2.7'])localStorage.setItem('za_bn2_'+k,String(Date.now()))});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file:///mnt/user-data/outputs/z-arena.html');await p.waitForTimeout(2500);
// go to draft vs bot and advance to pick phase where enemy picked zamasu
await p.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove();G.bot=1;startDraft()});await p.waitForTimeout(500);
for(let i=0;i<200;i++){const st=await p.evaluate(()=>{if(!D)return 'noD';if(D.ph=="seq"&&D.seq[D.si].t=="pick"&&D.who==0&&D.picks[1].length>=1)return 'ok';
  if(D.ph=="seq"&&D.seq[D.si].t=="pick"&&D.who==0&&D.picks[1].length==0&&D.picks[0].length==0){}
  if(!isBot(D.who)&&!D.hide){const o=dOpts();if(D.ph=="seq"&&D.seq[D.si].t=="pick"&&D.picks[1].length==0){}
   if(["fvote","pre"].includes(D.ph)){D.sel=o.slice(0,need())}else if(o.length){D.sel=[o.find(k=>k!="za"&&k!="cl")||o[0]]}if(D.sel.length)dConfirm();else if(D.ph=="seq"&&D.seq[D.si].t=="ban")dNoBan()}
  else if(D.hide){const b=document.querySelector('#dr .pss button, #dr .dgo');b&&b.click()}
  if(['prerev','banrev','fbanrev'].includes(D.ph)){if(!D.pra){D.pra=1;dRender()}const b=[...document.querySelectorAll('#dr button')].find(x=>/Continuar|Pr[oó]xim|Seguir|Ok/i.test(x.textContent));if(b)b.click();else if(D.ph=='prerev'&&typeof blindStart=='function'){}}
  return D.ph+':'+D.who+':'+(D.seq?D.seq[D.si]&&D.seq[D.si].t:'')});if(st=='ok')break;await p.waitForTimeout(400)}
await p.evaluate(()=>{pannOff(1);dRender()});await p.waitForTimeout(500);
const info=await p.evaluate(()=>({E:D.picks[1],sug:sugList().map(s=>s.k+': '+s.why.map(y=>y.t).join(' | '))}));console.log(nm,JSON.stringify(info,null,1));
await p.evaluate(()=>{const h=document.getElementById('och');if(h)h.style.display='none'});await p.screenshot({path:'tts/dsug_'+nm+'.png'});
await p.evaluate(()=>{const b=document.querySelector('.sugi');b&&b.click()});await p.waitForTimeout(400);await p.screenshot({path:'tts/dsug2_'+nm+'.png'});
await p.evaluate(()=>{const b=document.querySelector('.dresb');b&&b.click()});await p.waitForTimeout(500);await p.screenshot({path:'tts/dsug3_'+nm+'.png'});
console.log(nm,errs);await ctx.close()}await b.close()})();
