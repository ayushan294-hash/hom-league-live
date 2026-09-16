(()=>{
  if(window.__homLeagueStatsV21)return;
  window.__homLeagueStatsV21=true;

  // 個人成績に追加する4指標
  Object.assign(defs,{
    tsumoRate:['ツモ率',0,v=>(v||0).toFixed(1)+'%'],
    riichiWinRate:['立直和了率',0,v=>(v||0).toFixed(1)+'%'],
    maxWin:['最大和了',0,v=>v?Math.round(v).toLocaleString():'—'],
    riichiNet:['立直収支',0,v=>{const x=Number(v||0);return (x>0?'+':'')+Math.round(x).toLocaleString()}]
  });

  ['tsumoRate','riichiWinRate','maxWin','riichiNet'].forEach(k=>{
    if(!order.includes(k))order.push(k);
  });

  const optionDefs=[
    ['tsumoRate','ツモ率'],
    ['riichiWinRate','立直和了率'],
    ['maxWin','最大和了'],
    ['riichiNet','立直収支']
  ];
  optionDefs.forEach(([value,label])=>{
    if(!metric.querySelector(`option[value="${value}"]`)){
      const o=document.createElement('option');
      o.value=value;o.textContent=label;metric.appendChild(o);
    }
  });

  // 既存buildを活かしつつ、Web_局から追加指標を計算
  const baseBuild=build;
  build=function(M,H,S){
    const out=baseBuild(M,H,S);
    const players=Object.fromEntries(out.ind.map(p=>[p.name,p]));

    out.ind.forEach(p=>{
      p.tsumoWins=0;
      p.riichiWins=0;
      p.maxWin=0;
      p.riichiNet=0;
    });

    H.forEach(r=>{
      const p=players[r['選手']];
      if(!p)return;
      const a=r['行動']||'';
      const win=n(r['和了点']);

      if(a.includes('ツモ和了'))p.tsumoWins++;
      if(a.includes('立直')&&a.includes('和了'))p.riichiWins++;
      if(a.includes('和了'))p.maxWin=Math.max(p.maxWin,win);

      if(a.includes('立直')){
        p.riichiNet+=win-n(r['失点'])+n(r['流局支出'])+n(r['立直棒支出'])+n(r['オーラス立直棒分配']);
      }
    });

    out.ind.forEach(p=>{
      p.tsumoRate=p.agari?p.tsumoWins/p.agari*100:0;
      p.riichiWinRate=p.riichi?p.riichiWins/p.riichi*100:0;
    });

    return out;
  };

  // 追加列ぶん横幅を拡張。PC/スマホの固定列仕様はそのまま維持。
  const style=document.createElement('style');
  style.id='individual-stats-v21-style';
  style.textContent=`
    .itable{min-width:2040px}
    .itable .tr{grid-template-columns:52px 190px 250px 130px repeat(12,116px)}
    @media(max-width:650px){
      .itable{min-width:1180px}
      .itable .tr{grid-template-columns:42px 168px 108px repeat(12,82px)}
    }
  `;
  document.head.appendChild(style);

  // 初回loadが先に走っていても、新しい計算ロジックでもう一度読み直す。
  setTimeout(()=>{if(typeof load==='function')load()},0);
})();
