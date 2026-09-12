const CACHE='hom-league-v15-match-header';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];
const MATCH_HEADER_CSS=`
/* match-stats-header-align-v15 */
.mtable .hdr{position:sticky;top:0;z-index:8;background:#171b20;padding-top:4px;padding-bottom:7px;border-bottom:1px solid var(--line)}
.mtable .hdr>div{background:#11151a;border:1px solid #252c34;border-radius:7px;padding:7px 8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mtable .data>div:nth-child(n+4){padding-right:8px}
@media(max-width:650px){.mwrap{padding:4px 6px 14px}.mtable .tr{gap:4px;padding:7px 4px}.mtable .hdr>div{padding:6px 5px;font-size:9px;text-align:center}.mtable .data>div:nth-child(n+4){padding-right:5px}}
`;

function enhanceIndex(html){
  if(!html || html.includes('match-stats-header-align-v15')) return html;
  return html.replace('</style>', MATCH_HEADER_CSS+'\n</style>');
}

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes('docs.google.com')){
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
      const html=await r.text();
      const body=enhanceIndex(html);
      const res=new Response(body,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      caches.open(CACHE).then(c=>c.put('./index.html',res.clone()));
      return res;
    }).catch(async()=>{
      const cached=await caches.match('./index.html');
      if(!cached) return cached;
      const html=await cached.text();
      return new Response(enhanceIndex(html),{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
});
