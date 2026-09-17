const CACHE='hom-league-v26-match-layout';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png','./individual-stats-v24.js'];

function patchHtml(text){
  text=text.replace(/<script src="\.\/individual-stats-v2[1-3]\.js\?v=2[1-3]"><\/script>/g,'');
  if(text.includes('individual-stats-v24.js'))return text;
  return text.replace('</body>','<script src="./individual-stats-v24.js?v=24"></script></body>');
}

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
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
    e.respondWith(
      fetch(e.request,{cache:'no-store'}).then(async r=>{
        const ct=r.headers.get('content-type')||'';
        if(!ct.includes('text/html'))return r;
        const headers=new Headers(r.headers);
        headers.set('content-type','text/html; charset=utf-8');
        const html=patchHtml(await r.text());
        const res=new Response(html,{status:r.status,statusText:r.statusText,headers});
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy));
        return res;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
});
