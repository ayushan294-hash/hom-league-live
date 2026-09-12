const CACHE='hom-league-v17-match-no-right-gap';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];

const MATCH_CSS=`
<style id="match-stats-no-right-gap-v17">
#match .matchgrid>.card:last-child{width:max-content!important;max-width:100%!important;justify-self:start!important}
.mwrap{overflow:auto!important;padding:5px 4px 16px!important;width:max-content!important;max-width:100%!important;margin-left:12px!important;margin-right:0!important}
.mtable{display:inline-block!important;width:max-content!important;min-width:0!important;max-width:none!important}
.mtable .tr{width:max-content!important;grid-template-columns:44px 160px 218px 82px 62px 52px 52px 52px!important;gap:5px!important;padding:8px 6px!important}
.mtable .hdr{position:sticky!important;top:0!important;z-index:8!important;background:#171b20!important;padding-top:4px!important;padding-bottom:7px!important;border-bottom:1px solid var(--line)!important}
.mtable .hdr>div{background:#11151a!important;border:1px solid #252c34!important;border-radius:7px!important;padding:7px 6px!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.mtable .data>div:nth-child(n+4){padding-right:5px!important}
@media(max-width:650px){
  #match .matchgrid>.card:last-child{width:max-content!important;max-width:100%!important;justify-self:start!important}
  .mwrap{padding:4px 2px 14px!important;width:max-content!important;max-width:100%!important;margin-left:6px!important;margin-right:0!important}
  .mtable{display:inline-block!important;width:max-content!important;min-width:0!important;max-width:none!important}
  .mtable .tr{width:max-content!important;grid-template-columns:34px 132px 146px 66px 50px 42px 42px 42px!important;gap:3px!important;padding:6px 4px!important}
  .mtable .hdr>div{padding:6px 3px!important;font-size:9px!important;text-align:center!important}
  .mtable .data>div:nth-child(n+4){padding-right:3px!important}
}
</style>`;

function patchHtml(text){
  let out=text;
  out=out.replace(/<style id="match-stats-[\s\S]*?<\/style>/g,'');
  out=out.replace('</head>',MATCH_CSS+'</head>');
  out=out.replace(/navigator\.serviceWorker\.register\('\.\/sw\.js\?v=\d+'\)/g,"navigator.serviceWorker.register('./sw.js?v=17')");
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
