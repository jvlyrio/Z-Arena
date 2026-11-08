const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const out=[];
for(const [W,H,M,n] of [[1366,768,0,'pc'],[412,915,1,'php']]){
const ctx=await b.newContext({viewport:{width:W,height:H},isMobile:!!M,hasTouch:!!M});
await ctx.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('fsb.js','utf8')}));
await ctx.addInitScript(()=>{sessionStorage.setItem('za_rot','1');localStorage.setItem('za_skipvid','1')});
const errs=[];const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__uid='U1'});
await p.goto('file:///home/claude/z-arena/index.html');await p.waitForTimeout(2500);
await p.screenshot({path:'site/'+n+'_1login.png'});
out.push(n+' login visible: '+await p.evaluate(()=>!!document.querySelector('.zlbox')));
await p.click('.zl-mail');await p.fill('.zlem input','teste@exemplo.com');await p.click('.zlem .nkok');await p.waitForTimeout(400);
await p.screenshot({path:'site/'+n+'_2email.png'});out.push(n+' otp: '+await p.evaluate(()=>window.__otp));
await p.click('.zlguest');await p.waitForTimeout(800);
out.push(n+' nick visible: '+await p.evaluate(()=>!!document.querySelector('#nkm input:not([type=email])')));
await p.screenshot({path:'site/'+n+'_3nick.png'});
await p.fill('#nkm input','Goku123');await p.click('#nkm .nkok');await p.waitForTimeout(800);
await p.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove();const r=document.getElementById('rotm');if(r)r.remove()});
await p.evaluate(()=>mmOpts());await p.waitForTimeout(500);
await p.evaluate(()=>{const z=document.querySelector('.zacc');z&&z.scrollIntoView()});
await p.screenshot({path:'site/'+n+'_4opts_guest.png'});
await p.fill('.zacc .zlem input','teste@exemplo.com');await p.click('.zacc .zlem .nkok');await p.waitForTimeout(400);
out.push(n+' linked: '+await p.evaluate(()=>window.__linked));
// simulate permanent login with stored profile on new device
const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push('p2 '+e.message));
await p2.goto('file:///home/claude/z-arena/index.html');await p2.waitForTimeout(1500);
await p2.evaluate(()=>{localStorage.setItem('fsb:prof',JSON.stringify({PERM:{uid:'PERM',nick:'Vegeta',data:{za_nick:'Vegeta',za_nick_ok:'1',za_blv:'2'}}}));localStorage.removeItem('za_sync_uid');ZSB.auth.__login({id:'PERM',is_anonymous:false,email:'x@y.com',identities:[{provider:'email'}]})});
await p2.waitForTimeout(5000);
out.push(n+' sess: '+await p2.evaluate(()=>JSON.stringify(ZSB_U())+' acc:'+(document.querySelector('.zlst')||{}).textContent+' url:'+location.href.slice(-20)));out.push(n+' restored nick: '+await p2.evaluate(()=>localStorage.getItem('za_nick')+' login:'+!!document.querySelector('.zlbox')));
await p2.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove();mmOpts()});await p2.waitForTimeout(600);
await p2.evaluate(()=>{const z=document.querySelector('.zacc');z&&z.scrollIntoView()});
await p2.screenshot({path:'site/'+n+'_5opts_perm.png'});
out.push(n+' errs '+JSON.stringify(errs));await ctx.close()}
console.log(out.join('\n'));await b.close()})();
