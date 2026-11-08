const {chromium}=require('playwright');const RUNS=+(process.argv[2]||1);
(async()=>{const b=await chromium.launch();let res=[];
for(let run=0;run<RUNS;run++){
const ctx=await b.newContext({viewport:{width:1200,height:800}});await ctx.addInitScript({path:'../mock2.js'});
await ctx.addInitScript(()=>{Object.keys(localStorage).forEach(k=>{if(k.startsWith('za_bn_'))localStorage.setItem(k,'1')});localStorage.setItem('za_skipvid','1')});
const errs=[];const mkp=async(uid,nick)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(uid+': '+e.message));await p.addInitScript(([u,n])=>{window.__uid=u;localStorage.setItem('za_nick',n);localStorage.setItem('za_nick_ok','1')},[uid,nick]);await p.goto('file:///mnt/user-data/outputs/z-arena.html');await p.waitForTimeout(900);await p.evaluate(()=>{BQ=[];const x=document.getElementById('bnr');if(x)x.remove()});return p};
const A=await mkp('A'+run,'Ana'),S=await mkp('S'+run,'Sil');const ev=(P,f,a)=>P.evaluate(f,a);
await ev(A,async()=>{showOnline();while(O.st!='ready')await new Promise(r=>setTimeout(r,50));await oCreate()});await A.waitForTimeout(800);
const code=await ev(A,()=>O.code);if(run==0)await A.screenshot({path:'obot_lobby0.png'});await ev(A,()=>oAddBot());await A.waitForTimeout(1500);await ev(S,async c=>{showOnline();while(O.st!='ready')await new Promise(r=>setTimeout(r,50));await oJoin(c)},code);await S.waitForTimeout(700);
const lob=await ev(A,()=>({p1:O.d.p1,lr1:O.d.lr1,s0:O.d.s0}));if(run==0)await A.screenshot({path:'obot_lobby.png'});
await ev(A,()=>oLobbyReady(true));
const waitFor=async(f,ms=20000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await f())return true;await A.waitForTimeout(250)}return false};
let ok=await waitFor(async()=>(await ev(A,()=>G.scr))=="d");if(!ok){res.push(run+' draft nao comecou '+JSON.stringify(lob));await ctx.close();continue}
const drive=()=>ev(A,()=>{if(!D||!D.on||D.spec||O.busy)return null;const ph=D.ph,me=O.seat;const r=JSON.parse(O.d.dr);
  if(["field","prerev","banrev","fbanrev"].includes(ph)){if(!D.rd[me]){oReadyStep();return "ready:"+ph}return null}
  if(D.wait)return null;
  if(ph=="seq"){if(D.who!==me)return null;const o=oOpts(r,me);D.sel=[o[Math.floor(Math.random()*o.length)]];oConfirm();return "seq"}
  if(BLIND.includes(ph)){const o=oOpts(r,me).sort(()=>Math.random()-.5);D.sel=ph=="pre"?o.slice(0,need()):ph=="fvote"?o.slice(0,2):[o[0]];oConfirm();return ph}
  if(ph=="done"){dBattle();return "battle"}return null});
const t0=Date.now();const phs=new Set();
while(Date.now()-t0<120000){if((await ev(A,()=>G.scr))=="p")break;const r=await drive();if(r)phs.add(r);phs.add('ph:'+await ev(A,()=>D&&D.ph));await A.waitForTimeout(300)}
const dtime=((Date.now()-t0)/1000).toFixed(0);
if((await ev(A,()=>G.scr))!="p"){res.push(run+' draft travou em '+await ev(A,()=>D&&D.ph)+' '+[...phs].join(','));await A.screenshot({path:'obot_stuck.png'});await ctx.close();continue}
// batalha: humano joga com plan(0)
const b0=Date.now();let turns=0,botTurns=0;
while(Date.now()-b0<150000){const st=await ev(A,()=>({w:G.win,cur:G.cur,me:G.me,t:G.t}));if(st.w!=null)break;
 if(st.cur===st.me){await ev(A,()=>{if(G.inOn||G.g2v)return;{const so=G.online;G.online=0;try{plan(G.me)}finally{G.online=so}}endTurn()});turns++}else botTurns++;await A.waitForTimeout(700)}
const fin=await ev(A,()=>({w:G.win,t:G.t}));const spec=await ev(S,()=>({scr:G.scr,t:G.t,w:G.win}));
res.push(run+': draft '+dtime+'s, batalha win='+fin.w+' turno='+fin.t+' espectador scr='+spec.scr+' t='+spec.t+' w='+spec.w+' erros='+errs.length+(errs.length?' '+errs.slice(0,3).join(' | '):''));
if(run==0)await A.screenshot({path:'obot_bt.png'});
// revanche
if(fin.w!=null){await ev(A,()=>oRematch(true));const rk=await waitFor(async()=>(await ev(A,()=>O.d.ph))=="draft",15000);res[res.length-1]+=' revanche='+rk}
await ctx.close()}
console.log(res.join('\n'));await b.close()})();
