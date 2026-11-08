(()=>{const K="mockdb:";const rd=p=>{const v=localStorage.getItem(K+p);return v?JSON.parse(v):null};
const snap=p=>{const d=rd(p);return{id:p.split("/").pop(),exists:!!d,data:()=>d||undefined,metadata:{fromCache:false,hasPendingWrites:false}}};
const doc=p=>({id:p.split("/").pop(),path:p,get:async()=>snap(p),set:async d=>{localStorage.setItem(K+p,JSON.stringify(d))},
 update:async d=>{const c=rd(p);if(!c)throw{code:"invalid_argument",message:"missing"};const dm=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]=="object"&&!Array.isArray(b[k])&&a[k]&&typeof a[k]=="object")dm(a[k],b[k]);else a[k]=b[k]}return a};localStorage.setItem(K+p,JSON.stringify(dm(c,d)))},delete:async()=>localStorage.removeItem(K+p),
 onSnapshot:(n,e)=>{let last=null;const t=setInterval(()=>{const v=localStorage.getItem(K+p);if(v!==last){last=v;n(snap(p))}},150);return()=>clearInterval(t)}});
window.claude={use:async n=>{await new Promise(r=>setTimeout(r,30));if(n=="user")return{id:async()=>window.__uid||null};if(n=="db")return{doc,collection:()=>({})};return null}}})();
