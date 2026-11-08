(()=>{const K="mockdb:";const rd=p=>{const v=localStorage.getItem(K+p);return v?JSON.parse(v):null};
const snap=p=>{const d=rd(p);return{id:p.split("/").pop(),exists:!!d,data:()=>d||undefined,metadata:{fromCache:false,hasPendingWrites:false}}};
const doc=p=>({id:p.split("/").pop(),path:p,get:async()=>snap(p),set:async d=>{localStorage.setItem(K+p,JSON.stringify(d))},
 update:async d=>{const c=rd(p);if(!c)throw{code:"invalid_argument",message:"missing"};const dm=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]=="object"&&!Array.isArray(b[k])&&a[k]&&typeof a[k]=="object")dm(a[k],b[k]);else a[k]=b[k]}return a};localStorage.setItem(K+p,JSON.stringify(dm(c,d)))},delete:async()=>localStorage.removeItem(K+p),
 onSnapshot:(n,e)=>{let last=null;const t=setInterval(()=>{const v=localStorage.getItem(K+p);if(v!==last){last=v;n(snap(p))}},150);return()=>clearInterval(t)}});
window.claude={use:async n=>{await new Promise(r=>setTimeout(r,30));if(n=="user")return{id:async()=>window.__uid||null};if(n=="db")return{doc,collection:()=>({})};return null}}})();
(()=>{const K="mockcol:";const rd=p=>JSON.parse(localStorage.getItem(K+p)||"{}"),wr=(p,v)=>localStorage.setItem(K+p,JSON.stringify(v));
const Q=(path,f=[],ob=null,lim=0)=>{const run=()=>{let L=Object.entries(rd(path)).map(([id,d])=>({id,d}));f.forEach(([k,op,v])=>{L=L.filter(x=>op=="=="?x.d[k]===v:true)});if(ob)L.sort((a,b)=>(a.d[ob[0]]-b.d[ob[0]])*(ob[1]=="desc"?-1:1));if(lim)L=L.slice(0,lim);return{docs:L.map(x=>({id:x.id,exists:true,data:()=>x.d}))}};
 return{path,where:(k,op,v)=>Q(path,f.concat([[k,op,v]]),ob,lim),orderBy:(k,d)=>Q(path,f,[k,d||"asc"],lim),limit:n=>Q(path,f,ob,n),get:async()=>run(),
  onSnapshot:(n)=>{let last=null;const t=setInterval(()=>{const v=localStorage.getItem(K+path);if(v!==last){last=v;n(run())}},150);return()=>clearInterval(t)},
  doc:id=>{id=id||Math.random().toString(36).slice(2);return{id,set:async d=>{const m=rd(path);m[id]=d;wr(path,m)},delete:async()=>{const m=rd(path);delete m[id];wr(path,m)},get:async()=>({exists:!!rd(path)[id],data:()=>rd(path)[id]})}},
  add:async d=>{const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);const m=rd(path);m[id]=d;wr(path,m);return{id}}}};
const ou=window.claude.use;window.claude={use:async n=>{const r=await ou(n);if(n=="db"&&r)return Object.assign({},r,{collection:p=>Q(p)});return r}}})();
