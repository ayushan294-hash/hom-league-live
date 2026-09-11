const CACHE='hom-league-v2';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];
const MOBILE_FIX=`<style id="mobile-layout-fix">@media(max-width:650px){.top{align-items:flex-start;flex-direction:column}main{padding:10px}.chart{height:390px}.rank{padding:7px 8px 14px}.teamrow{grid-template-columns:32px minmax(0,1fr) 70px;gap:6px;padding:7px 7px}.rk{font-size:16px}.top4 .rk{padding:6px 0}.tband{padding:9px 8px;font-size:11px;line-height:1.15;white-space:normal;overflow-wrap:anywhere}.pt{font-size:12px}.pt small{font-size:8px}.tablewrap{padding:4px 6px 14px}.itable{min-width:940px}.itable .tr{grid-template-columns:34px 132px repeat(9,82px);gap:4px;padding:7px 4px}.itable .tr>:nth-child(3){display:none;position:static}.itable .tr>:nth-child(1),.itable .tr>:nth-child(2){position:sticky;z-index:6}.itable .tr>:nth-child(1){left:0}.itable .tr>:nth-child(2){left:38px}.itable .hdr>:nth-child(1),.itable .hdr>:nth-child(2){background:#171b20}.itable .data>:nth-child(1),.itable .data>:nth-child(2){background:#11151a}.band{padding:7px 7px;font-size:11px}.num{font-size:11px}.controls{padding:0 12px 12px}.head{padding:14px 12px 9px}.head h2{font-size:18px}.sub{font-size:10px}}</style>`;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes('docs.google.com')){e.respondWith(fetch(e.request));return;}
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:'no-store'});
        let html=await r.text();
        if(!html.includes('mobile-layout-fix'))html=html.replace('</head>',MOBILE_FIX+'</head>');
        const headers=new Headers(r.headers);headers.delete('content-length');headers.delete('content-encoding');
        const out=new Response(html,{status:r.status,statusText:r.statusText,headers});
        const c=await caches.open(CACHE);c.put(e.request,out.clone());
        return out;
      }catch(err){return (await caches.match(e.request))||(await caches.match('./index.html'));}
    })());return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
});