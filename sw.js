const CACHE='hom-league-v16-match-compact';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];

const MATCH_CSS=`
<style id="match-stats-compact-v16">
.mtable{width:max-content!important;min-width:0!important}
.mtable .tr{grid-template-columns:48px 175px 245px 90px 72px 60px 60px 60px!important}
.mtable .hdr{position:sticky;top:0;z-index:8;background:#171b20;padding-top:4px;padding-bottom:7px;border-bottom:1px solid var(--line)}
.mtable .hdr>div{background:#11151a;border:1px solid #252c34;border-radius:7px;padding:7px 8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mtable .data>div:nth-child(n+4){padding-right:8px}
@media(max-width:650px){
  .mwrap{padding:4px 6px 14px}
  .mtable{width:max-content!important;min-width:0!important}
  .mtable .tr{grid-template-columns:40px 150px 180px 78px 62px 54px 54px 54px!important;gap:4px;padding:7px 4px}
  .mtable .hdr>div{padding:6px 5px;font-size:9px;text-align:center}
  .mtable .data>div:nth-child(n+4){padding-right:5px}
}
</style>`;

function patchHtml(text){
  let out=text.replace('</head>',MATCH_CSS+'</head>');
  out=out.replace("navigator.serviceWorker.register('./sw.js?v=14')","navigator.serviceWorker.register('./sw.js?v=16')
         .then(r=>{if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'})})");
  out=out.replace("navigator.serviceWorker.register('./sw.js?v=15')","navigator.serviceWorker.register('./sw.js?v=16')
         .then(r=>{if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'})})");
  return out;
}

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes('docs.google.com')){
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
      const ct=r.headers.get('content-type')||'';
      if(!ct.includes('text/html'))return r;
      const headers=new Headers(r.headers);
      headers.set('content-type','text/html; charset=utf-8');
      const html=patchHtml(await r.text());
      const res=new Response(html,{status:r.status,statusText:r.statusText,headers});
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put('./index.html',copy));
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
});
