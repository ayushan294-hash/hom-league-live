const CACHE='hom-league-v6-individual-fix';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];

const INDIVIDUAL_FIX=`<style id="individual-sort-fix-style-v6">
@media(max-width:650px){
  .playerband .mobileMetric{display:block;margin-top:5px;font-size:10px;font-weight:950;color:#fff;opacity:.98;background:#0006;border:1px solid #ffffff2c;border-radius:999px;padding:3px 6px;width:max-content;max-width:100%}
}
</style><script id="individual-sort-fix-v6">
(()=>{
  const order=['points','avgScore','topRate','avoid4','highScore','riichiRate','agariRate','houjuRate','furoRate'];
  const labels={points:'総ポイント',avgScore:'平均打点',topRate:'トップ率',avoid4:'4着回避率',highScore:'最高スコア',riichiRate:'立直率',agariRate:'和了率',houjuRate:'放銃率',furoRate:'副露率'};
  const asc={houjuRate:true};
  const esc2=s=>String(s??'').replace(/[&<>\\"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;'}[x]));
  const mix2=(hex,a=.62)=>{try{let h=(hex||'#777777').slice(1),v=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return '#'+v.map(x=>Math.round(x+(255-x)*a).toString(16).padStart(2,'0')).join('')}catch(e){return '#999999'}};
  const fmt=(k,v)=>{
    if(k==='avgScore')return v?Math.round(v).toLocaleString():'—';
    if(k==='highScore')return v==null?'—':(v>0?'+':'')+Number(v).toFixed(1);
    if(k==='points')return (Number(v||0)>0?'+':'')+Number(v||0).toFixed(1);
    return Number(v||0).toFixed(1)+'%';
  };
  const val=(p,k)=>{let v=p?.[k];return v==null?NaN:Number(v)};
  const refreshHighScore=()=>{
    if(typeof D==='undefined'||!D||!D.ind||!D.matches)return;
    const hi={};
    Object.values(D.matches).forEach(m=>(m.players||[]).forEach(p=>{
      const v=Number(p.point);
      if(Number.isFinite(v))hi[p.name]=hi[p.name]==null?v:Math.max(hi[p.name],v);
    }));
    D.ind.forEach(p=>{p.highScore=hi[p.name]??null});
  };
  const render=()=>{
    if(typeof D==='undefined'||!D||!D.ind)return;
    const root=document.getElementById('itable'), sel=document.getElementById('metric');
    if(!root||!sel)return;
    refreshHighScore();
    const k=sel.value, columns=[k,...order.filter(x=>x!==k)];
    const rows=[...D.ind].sort((a,b)=>{
      let av=val(a,k), bv=val(b,k);
      if(!Number.isFinite(av))av=asc[k]?Infinity:-Infinity;
      if(!Number.isFinite(bv))bv=asc[k]?Infinity:-Infinity;
      const d=asc[k]?av-bv:bv-av;
      if(d)return d;
      return Number(b.points||0)-Number(a.points||0);
    });
    root.innerHTML='<div class="tr hdr"><div>順位</div><div>選手</div><div>チーム</div>'+columns.map((x,i)=>'<div class="'+(i?'':'focus')+'">'+labels[x]+'</div>').join('')+'</div>'+
      rows.map((p,i)=>{const c=(typeof colors!=='undefined'&&colors[p.team])||'#777777';const bg='background:linear-gradient(90deg,'+mix2(c)+','+c+',#050505)';return '<div class="tr data"><div class="pos">'+(i+1)+'</div><div class="band playerband" style="'+bg+'"><span>'+esc2(p.name)+'</span><small class="mobileTeam">'+esc2(p.team)+'</small><small class="mobileMetric">'+labels[k]+' '+fmt(k,p[k])+'</small></div><div class="band" style="'+bg+'">'+esc2(p.team)+'</div>'+columns.map((x,j)=>'<div class="num '+(j?'':'focus')+'">'+fmt(x,p[x])+'</div>').join('')+'</div>'}).join('');
  };
  const install=()=>{window.renderInd=render;const sel=document.getElementById('metric');if(sel)sel.onchange=render;render();};
  window.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,400);setTimeout(install,1400)});
  window.addEventListener('load',()=>{install();setTimeout(install,800);setTimeout(install,2000)});
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
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
      let html=await r.text();
      html=html.replace(/<style id="individual-sort-fix-style[^>]*>[\s\S]*?<\/style>/g,'');
      html=html.replace(/<script id="individual-sort-fix[^>]*>[\s\S]*?<\/script>/g,'');
      html=html.replace('</body>',INDIVIDUAL_FIX+'</body>');
      return new Response(html,{status:r.status,statusText:r.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
