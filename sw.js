const CACHE='hom-league-v4';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];

const MOBILE_FIX=`<style id="mobile-layout-fix-v4">
@media(max-width:650px){
  .top{align-items:flex-start;flex-direction:column}
  main{padding:10px}
  .chart{height:430px!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;padding:4px 8px 14px!important;position:relative}
  .chart:after{content:'横にスクロールできます →';position:sticky;left:8px;bottom:0;display:inline-block;margin-top:4px;color:#9aa4b2;font-size:10px;font-weight:800;letter-spacing:.03em}
  .chart svg{height:390px!important;max-width:none!important}
  .chart svg text{font-size:15px!important;font-weight:900!important;fill:#d7dde7!important;paint-order:stroke;stroke:#0b0d10;stroke-width:3px;stroke-linejoin:round}
  .rank{padding:7px 8px 14px}
  .teamrow{grid-template-columns:32px minmax(0,1fr) 78px;gap:6px;padding:7px 7px}
  .rk{font-size:16px}
  .top4 .rk{padding:6px 0}
  .tband{padding:9px 8px;font-size:11px;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
  .pt{font-size:12px}
  .pt small{font-size:8px}
  .tablewrap{padding:4px 6px 14px;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .itable{min-width:760px!important}
  .itable .tr{grid-template-columns:34px 184px repeat(9,78px)!important;gap:4px;padding:7px 4px}
  .itable .tr>:nth-child(3){display:none!important;position:static!important}
  .itable .tr>:nth-child(1),.itable .tr>:nth-child(2){position:sticky!important;z-index:6}
  .itable .tr>:nth-child(1){left:0}
  .itable .tr>:nth-child(2){left:38px}
  .itable .hdr>:nth-child(1),.itable .hdr>:nth-child(2){background:#171b20}
  .itable .data>:nth-child(1),.itable .data>:nth-child(2){background:#11151a}
  .band{padding:7px 7px;font-size:11px;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
  .num{font-size:11px;font-weight:850}
  .focus{outline:2px solid #ffffff44;background:#1b2027!important;border-radius:7px}
  .controls{padding:0 12px 12px}
  .head{padding:14px 12px 9px}
  .head h2{font-size:18px}
  .sub{font-size:10px}
  .mobile-team-label{display:flex;align-items:center;gap:5px;margin-top:5px;font-size:9px;font-weight:850;color:#fff;opacity:.9;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
  .mobile-team-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:0 0 8px;box-shadow:0 0 0 1px #ffffff55}
  .mobile-scroll-note{padding:0 12px 10px;color:#9aa4b2;font-size:10px;font-weight:800}
}
</style>`;

const MOBILE_SCRIPT=`<script id="mobile-layout-script-v4">
(()=>{
  const isMobile=()=>window.innerWidth<=650;
  const teamColorFromCell=cell=>{
    const div=cell&&cell.querySelector('.band');
    return div?getComputedStyle(div).backgroundColor:'#999';
  };
  const enhanceIndividual=()=>{
    if(!isMobile())return;
    const root=document.getElementById('itable');
    if(!root)return;
    const wrap=root.closest('.tablewrap');
    if(wrap&&!wrap.previousElementSibling?.classList?.contains('mobile-scroll-note')){
      const note=document.createElement('div');
      note.className='mobile-scroll-note';
      note.textContent='選手名の下にチーム名を表示。成績は横スクロールで確認できます →';
      wrap.parentNode.insertBefore(note,wrap);
    }
    root.querySelectorAll('.tr.data').forEach(row=>{
      const cells=row.children;
      if(cells.length<3)return;
      const player=cells[1],team=cells[2];
      if(!player||!team||player.querySelector('.mobile-team-label'))return;
      const label=document.createElement('small');
      label.className='mobile-team-label';
      const dot=document.createElement('i');
      dot.className='mobile-team-dot';
      dot.style.background=teamColorFromCell(team);
      label.appendChild(dot);
      label.appendChild(document.createTextNode(team.textContent.trim()));
      player.appendChild(label);
    });
  };
  const widenChart=svg=>{
    if(!svg||!isMobile())return;
    const xLabels=[...svg.querySelectorAll('text')].filter(t=>{
      const y=parseFloat(t.getAttribute('y')||'0');
      return y>500&&t.textContent.trim();
    });
    const w=Math.max(980,xLabels.length*116);
    svg.style.width=w+'px';
    svg.style.minWidth=w+'px';
  };
  const refresh=()=>{
    enhanceIndividual();
    widenChart(document.getElementById('teamChart'));
    widenChart(document.getElementById('mchart'));
  };
  const obs=new MutationObserver(refresh);
  window.addEventListener('DOMContentLoaded',()=>{
    ['itable','teamChart','mchart'].forEach(id=>{const el=document.getElementById(id);if(el)obs.observe(el,{childList:true,subtree:true});});
    refresh();
    setTimeout(refresh,400);
    setTimeout(refresh,1200);
    setTimeout(refresh,2500);
  });
  window.addEventListener('resize',refresh);
})();
</script>`;

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
    e.respondWith(fetch(e.request));
    return;
  }
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:'no-store'});
        let html=await r.text();
        html=html.replace(/<style id="mobile-layout-fix[^>]*>[\s\S]*?<\/style>/g,'');
        html=html.replace(/<script id="mobile-layout-script[^>]*>[\s\S]*?<\/script>/g,'');
        html=html.replace('</head>',MOBILE_FIX+'</head>');
        html=html.replace('</body>',MOBILE_SCRIPT+'</body>');
        const headers=new Headers(r.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');
        const out=new Response(html,{status:r.status,statusText:r.statusText,headers});
        const c=await caches.open(CACHE);
        c.put(e.request,out.clone());
        return out;
      }catch(err){
        return (await caches.match(e.request))||(await caches.match('./index.html'));
      }
    })());
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
    return r;
  }).catch(()=>caches.match(e.request)));
});