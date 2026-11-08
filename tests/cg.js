const {chromium}=require('playwright');const [W,H,MOB,NM]=process.argv[2]=='php'?[412,915,1,'php']:process.argv[2]=='ph'?[860,380,1,'ph']:[1366,768,0,'pc'];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H},isMobile:!!MOB,hasTouch:!!MOB});await ctx.addInitScript({path:'../mock3.js'});await ctx.addInitScript(()=>{localStorage.setItem('za_nick_ok','1');localStorage.setItem('za_skipvid','1');sessionStorage.setItem('za_rot','1');for(const k of ['ft_stats','sn_jw','bal_Patch 0.2.7'])localStorage.setItem('za_bn2_'+k,String(Date.now()))});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file:///mnt/user-data/outputs/z-arena.html');await p.waitForTimeout(2500);
await p.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove();showTut()});await p.waitForTimeout(400);
await p.click('.tcard[data-play]');
const st=()=>p.evaluate(()=>{const c=document.getElementById('coach');return c?c.dataset.k:'-'});
const clickSpot=async()=>{const r=await p.evaluate(()=>{const s=document.getElementById('cspot');if(!s)return null;const b=s.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2,b.width,b.height]});return r};
let n=0;const seen=[];
for(let i=0;i<80;i++){await p.waitForTimeout(700);const k=await st();if(!seen.includes(k)){seen.push(k);await p.screenshot({path:'cg/'+NM+'_'+(n++)+'_'+k+'.png'})}
 if(k=='-'){continue}
 if(k=='free')break;
 const vis=await p.evaluate(()=>{const c=document.getElementById('coach');return c&&c.style.visibility!='hidden'});if(!vis)continue;const btn=await p.$('#coach .cgo');if(btn){try{await btn.click({timeout:2000})}catch(e){}continue}
 if(['sk1','sk2','sk3','end'].includes(k)){const r=await clickSpot();if(r){if(MOB)await p.touchscreen.tap(r[0],r[1]);else await p.mouse.click(r[0],r[1])}continue}
 if(['tg1','tg2','tg3'].includes(k)){const el=await p.$(k=='tg2'?'#b .row.t0 .u.tg .fw':'#b .row.t1 .u.tg .fw');if(el)await el.click();continue}
 if(k=='ord'){await p.evaluate(()=>{const b=[...document.querySelectorAll('#qord button')].find(x=>/OK/.test(x.textContent));b&&b.click()});continue}
}
await p.screenshot({path:'cg/'+NM+'_final.png'});console.log(await p.evaluate(()=>{const s=document.getElementById('cspot');return s?JSON.stringify(s.getBoundingClientRect()):'nospot'}));console.log(NM,seen.join(' > '),errs);await b.close()})();
