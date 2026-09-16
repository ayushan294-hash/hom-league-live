(()=>{
  if(window.__homLeagueStatsV22)return;
  window.__homLeagueStatsV22=true;

  Object.assign(defs,{
    rank1:['1着',0,v=>Math.round(v||0).toLocaleString()],
    rank2:['2着',0,v=>Math.round(v||0).toLocaleString()],
    rank3:['3着',0,v=>Math.round(v||0).toLocaleString()],
    rank4:['4着',1,v=>Math.round(v||0).toLocaleString()],
    maxWin:['最高打点',0,v=>v?Math.round(v).toLocaleString():'—'],
    riichiWinRate:['立直和了率',0,v=>(v||0).toFixed(1)+'%'],
    tsumoRate:['ツモ率',0,v=>(v||0).toFixed(1)+'%']
  });

  // 個人成績はこの順番で固定。並び替え指標を変えても列順は動かさない。
  order=[
    'points','highScore','avoid4',
    'rank1','rank2','rank3','rank4',
    'topRate','avgScore','maxWin',
    'riichiRate','agariRate','riichiWinRate','tsumoRate',
    'houjuRate','furoRate'
  ];

  const currentMetric=metric.value;
  metric.innerHTML=order.map(k=>`<option value="${k}">${defs[k][0]}</option>`).join('');
  metric.value=order.includes(currentMetric)?currentMetric:'points';

  const baseBuild=build;
  build=function(M,H,S){
    const out=baseBuild(M,H,S);
    const players=Object.fromEntries(out.ind.map(p=>[p.name,p]));

    out.ind.forEach(p=>{
      p.rank1=0;p.rank2=0;p.rank3=0;p.rank4=0;
      p.maxWin=0;p.tsumoWins=0;p.riichiWins=0;
      p.webWinCount=0;p.webWinSum=0;p.webRiichiCount=0;
    });

    // 試合入力から各選手の1〜4着回数を集計
    M.forEach(r=>{
      const p=players[r['選手']];
      if(!p)return;
      const rk=n(r['着順']);
      if(rk===1)p.rank1++;
      else if(rk===2)p.rank2++;
      else if(rk===3)p.rank3++;
      else if(rk===4)p.rank4++;
    });

    // 局入力から和了系の追加指標を集計
    H.forEach(r=>{
      const p=players[r['選手']];
      if(!p)return;
      const a=r['行動']||'';
      const win=n(r['和了点']);

      if(a.includes('立直'))p.webRiichiCount++;
      if(a.includes('和了')){
        p.webWinCount++;
        p.webWinSum+=win;
        p.maxWin=Math.max(p.maxWin,win);
      }
      if(a.includes('ツモ和了'))p.tsumoWins++;
      if(a.includes('立直')&&a.includes('和了'))p.riichiWins++;
    });

    out.ind.forEach(p=>{
      // Excelの「和了点合計 ÷ 和了回数」と同じ考え方
      p.avgScore=p.webWinCount?p.webWinSum/p.webWinCount:0;
      p.tsumoRate=p.webWinCount?p.tsumoWins/p.webWinCount*100:0;
      p.riichiWinRate=p.webRiichiCount?p.riichiWins/p.webRiichiCount*100:0;
    });

    return out;
  };

  // 選択中の指標だけ強調しつつ、列順は常に固定。
  renderInd=function(){
    const k=metric.value,asc=defs[k][1];
    const a=[...D.ind].sort((x,y)=>{
      let xv=metricVal(x,k),yv=metricVal(y,k);
      if(!Number.isFinite(xv))xv=asc?Infinity:-Infinity;
      if(!Number.isFinite(yv))yv=asc?Infinity:-Infinity;
      const d=asc?xv-yv:yv-xv;
      if(d)return d;
      return (y.points||0)-(x.points||0);
    });
    const h=(x)=>x===k?' focus pickedMetric':'';
    itable.innerHTML=`<div class="tr hdr"><div>順位</div><div>選手</div><div>チーム</div>${order.map(x=>`<div class="${h(x).trim()}">${defs[x][0]}</div>`).join('')}</div>`+
      a.map((p,i)=>{
        const c=colors[p.team]||'#777';
        return `<div class="tr data"><div class="pos">${i+1}</div><div class="band playerband" style="background:linear-gradient(90deg,${mix(c)},${c},#050505)"><span>${esc(p.name)}</span><small class="mobileTeam">${esc(p.team)}</small></div>${band(p.team,p.team)}${order.map(x=>`<div class="num${h(x)}">${metricText(p,x)}</div>`).join('')}</div>`;
      }).join('');
  };

  const style=document.createElement('style');
  style.id='individual-stats-v22-style';
  style.textContent=`
    .itable{min-width:2400px}
    .itable .tr{grid-template-columns:52px 190px 250px repeat(16,116px)}
    @media(max-width:650px){
      .itable{min-width:1650px}
      .itable .tr{grid-template-columns:42px 168px 108px repeat(16,82px)}
    }
  `;
  document.head.appendChild(style);

  setTimeout(()=>{if(typeof load==='function')load()},0);
})();
