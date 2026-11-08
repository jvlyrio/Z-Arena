/* Supabase falso para testes (imita só o que o zsb.js usa). Dados em localStorage, compartilhados entre abas. */
(function(){
const K="fsb:docs",P="fsb:prof";
const rd=k=>JSON.parse(localStorage.getItem(k)||"{}"),wr=(k,v)=>{localStorage.setItem(k,JSON.stringify(v));fire()};
const subs=new Set();function fire(){setTimeout(()=>subs.forEach(f=>f()),5)}
addEventListener("storage",e=>{if(e.key===K)subs.forEach(f=>f())});
const merge=(a,b)=>{if(a&&b&&typeof a=="object"&&typeof b=="object"&&!Array.isArray(a)&&!Array.isArray(b)){const o=Object.assign({},a);for(const k in b)o[k]=k in a?merge(a[k],b[k]):b[k];return o}return b};
const ok=d=>Promise.resolve({data:d,error:null}),bad=m=>Promise.resolve({data:null,error:{message:m}});
const now=()=>new Date(Date.now()+Math.random()).toISOString();
window.__fsbStats={rpc:0,sel:0};
function createClient(){
 let user=null;try{user=JSON.parse(sessionStorage.getItem("fsb:user")||"null")}catch(e){}
 const ls=[];const emit=(ev)=>ls.forEach(f=>f(ev,user?{user}:null));
 const setU=(u,ev)=>{user=u;sessionStorage.setItem("fsb:user",JSON.stringify(u));setTimeout(()=>emit(ev),0)};
 const auth={
  getSession:async()=>({data:{session:user?{user}:null},error:null}),
  signInAnonymously:async()=>{setU({id:window.__uid||("anon-"+Math.random().toString(36).slice(2)),is_anonymous:true,identities:[]},"SIGNED_IN");return{data:{session:{user}},error:null}},
  onAuthStateChange:f=>{ls.push(f);return{data:{subscription:{unsubscribe(){}}}}},
  signInWithOtp:async({email})=>{window.__otp=email;return{data:{},error:null}},
  updateUser:async({email})=>{if(window.__emailTaken===email)return{data:null,error:{message:"A user with this email address has already been registered"}};window.__linked=email;return{data:{},error:null}},
  signOut:async()=>{user=null;sessionStorage.removeItem("fsb:user");setTimeout(()=>emit("SIGNED_OUT"),0);return{error:null}},
  linkIdentity:async({provider})=>{window.__link=provider;return{data:{},error:null}},
  signInWithOAuth:async({provider})=>{window.__oauth=provider;return{data:{},error:null}},
  __login:(u)=>setU(u,"SIGNED_IN")
 };
 function from(t){
  const st={t,f:{},ord:null,lim:0,op:"select",row:null};
  const b={
   select(){return b},eq(k,v){st.f[k]=v;return b},order(k,o){st.ord=[k,o&&o.ascending];return b},limit(n){st.lim=n;return b},
   insert(r){st.op="insert";st.row=r;return b},upsert(r){st.op="upsert";st.row=r;return b},delete(){st.op="delete";return b},
   maybeSingle(){st.single=1;return b},
   then(res,rej){return run().then(res,rej)}
  };
  async function run(){
   if(!user)return{data:null,error:{message:"not authenticated"}};
   if(t=="profiles"){const m=rd(P);if(st.op=="upsert"){m[st.row.uid]=st.row;wr(P,m);return{data:null,error:null}}const r=m[st.f.uid]||null;return{data:r,error:null}}
   const m=rd(K);
   if(st.op=="insert"){if(m[st.row.path])return{data:null,error:{message:"duplicate"}};m[st.row.path]=Object.assign({},st.row,{owner:user.id,updated_at:now()});wr(K,m);return{data:null,error:null}}
   if(st.op=="delete"){const r=m[st.f.path];if(r&&r.owner!==user.id&&!(r.parent=="rooms"))return{data:null,error:null};delete m[st.f.path];wr(K,m);return{data:null,error:null}}
   window.__fsbStats.sel++;
   let L=Object.values(m).filter(r=>Object.keys(st.f).every(k=>r[k]===st.f[k]));
   if(st.ord)L.sort((a,b)=>((a.data.at||0)-(b.data.at||0))*(st.ord[1]?1:-1));
   if(st.lim)L=L.slice(0,st.lim);
   L=L.map(r=>({id:r.id,path:r.path,data:JSON.parse(JSON.stringify(r.data)),updated_at:r.updated_at}));
   if(st.single)return{data:L[0]||null,error:null};return{data:L,error:null};
  }
  return b;
 }
 async function rpc(n,a){window.__fsbStats.rpc++;if(!user)return bad("auth");const m=rd(K);
  if(n=="doc_set"){const p=a.p,o=m[p];m[p]={path:p,parent:p.replace(/\/[^/]+$/,""),id:p.split("/").pop(),data:a.d,owner:o?o.owner:user.id,updated_at:now()};wr(K,m);return ok(null)}
  if(n=="doc_update"){const o=m[a.p];if(!o)return bad("not_found");o.data=merge(o.data,a.patch);o.updated_at=now();wr(K,m);return ok(null)}
  if(n=="is_admin")return ok(!!window.__admin);return bad("no fn")}
 function channel(){const ch={cbs:[],on(ev,flt,cb){ch.cbs.push([flt,cb]);return ch},subscribe(){ch.f=()=>ch.cbs.forEach(([f,cb])=>cb({}));subs.add(ch.f);return ch}};return ch}
 return{auth,from,rpc,channel,removeChannel(ch){subs.delete(ch.f)}};
}
window.supabase={createClient};
})();
