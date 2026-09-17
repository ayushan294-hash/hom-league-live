(()=>{
  if(window.__homLeagueStatsV24)return;
  window.__homLeagueStatsV24=true;

  Object.assign(defs,{
    rank1:['1着',0,v=>Math.round(v||0).toLocaleString()],
    rank2:['2着',0,v=>Math.round(v||0).toLocaleString()],
    rank3:['3着',0,v=>Math.round(v||0).toLocaleString()],
    rank4:['4着',1,v=>Math.round(v||0).toLocaleString()],
    maxWin:['最高打点',0,v=>v?Math.round(v).toLocaleString():'—'],
    riichiWinRate:['立直和了率',0,v=>(v||0).toFixed(1)+'%'],
    tsumoRate:['ツモ率',0,v=>(v||0).toFixed(1)+'%']
  });

  const desiredOrder=[
    'points','highScore','avoid4',
    'rank1','rank2','rank3','rank4',
    'topRate','avgScore','maxWin',
    'riichiRate','agariRate','riichiWinRate','tsumoRate',
    'houjuRate','furoRate'
  ];
  order.splice(0,order.length,...desiredOrder);

  const currentMetric=metric.value;
  metric.innerHTML=order.map(k=>`<option value="${k}">${defs[k][0]}</option>`).join('');
  metric.value=order.includes(currentMetric)?currentMetric:'points';

  // RECORDS / UPDATE タブとページを追加
  const tabs=document.querySelector('.tabs');
  const main=document.querySelector('main');
  if(tabs&&!document.querySelector('[data-p="records"]')){
    tabs.insertAdjacentHTML('beforeend','<button class="tab" data-p="records">RECORDS</button><button class="tab" data-p="updates">UPDATE</button>');
    main.insertAdjacentHTML('beforeend',`
      <section id="records" class="page hide">
        <div class="card"><div class="head"><div><h2>RECORDS</h2><div class="sub">シーズン個人記録・LIVE更新</div></div><span class="badge">LIVE RECORDS</span></div><div id="recordGrid" class="recordgrid"></div></div>
      </section>
      <section id="updates" class="page hide">
        <div class="card"><div class="head"><div><h2>UPDATE</h2><div class="sub">HOM.LEAGUE LIVE DATA DASHBOARD 更新履歴</div></div><span class="badge">CHANGE LOG</span></div>
          <div class="updatelist">
            <div class="updategroup">
              <div class="updatedate">2026.09.17</div>
              <div class="updateentry"><span class="updatekind add">追加</span><span>個人成績に各着順・最高打点・立直和了率・ツモ率を追加。</span></div>
              <div class="updateentry"><span class="updatekind add">追加</span><span>トップ3 / ワースト3表示と、RECORDS・UPDATEページを追加。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>試合スタッツ表の横スクロール、列幅、見出し位置を調整。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>持ち点推移グラフの軸間隔を広げ、局名と点数の文字が細長くつぶれる表示を修正。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>更新後の表示が残らないよう、キャッシュ更新処理を改善。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>個人成績を横スクロールした際、数値が選手名・チーム名の下へ見える重なりを修正。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>試合スタッツ表の右端に残っていた余白を調整。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>個人成績の固定列に不透明な背景層を追加し、横スクロール時の沈み込み表示を再調整。</span></div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>アプリ版のホーム画面アイコンをHOM.LEAGUE 3rd seasonロゴへ変更。</span></div>
            </div>
            <div class="updategroup">
              <div class="updatedate">2026.09.16</div>
              <div class="updateentry"><span class="updatekind fix">修正</span><span>個人成績の表示順を整理し、スマホ版の固定列表示を改善。</span></div>
            </div>
          </div>
        </div>
      </section>`);
    document.querySelectorAll('.tab[data-p="records"],.tab[data-p="updates"]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.page').forEach(x=>x.classList.add('hide'));
      document.getElementById(b.dataset.p).classList.remove('hide');
      if(b.dataset.p==='records')renderRecords();
    });
  }

  const baseBuild=build;
  build=function(M,H,S){
    const out=baseBuild(M,H,S);
    const players=Object.fromEntries(out.ind.map(p=>[p.name,p]));

    out.ind.forEach(p=>{
      p.rank1=0;p.rank2=0;p.rank3=0;p.rank4=0;
      p.maxWin=0;p.tsumoWins=0;p.riichiWins=0;
      p.webWinCount=0;p.webWinSum=0;p.webRiichiCount=0;
    });

    M.forEach(r=>{
      const p=players[r['選手']];
      if(!p)return;
      const rk=n(r['着順']);
      if(rk===1)p.rank1++;
      else if(rk===2)p.rank2++;
      else if(rk===3)p.rank3++;
      else if(rk===4)p.rank4++;
    });

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
      p.avgScore=p.webWinCount?p.webWinSum/p.webWinCount:0;
      p.tsumoRate=p.webWinCount?p.tsumoWins/p.webWinCount*100:0;
      p.riichiWinRate=p.webRiichiCount?p.riichiWins/p.webRiichiCount*100:0;
    });
    return out;
  };

  function metricGroups(players,k){
    const asc=defs[k][1];
    const valid=players.filter(p=>Number.isFinite(metricVal(p,k))).sort((a,b)=>{
      const av=metricVal(a,k),bv=metricVal(b,k);
      return asc?av-bv:bv-av;
    });
    return {
      best:new Set(valid.slice(0,3).map(p=>p.name)),
      worst:new Set(valid.slice(-3).map(p=>p.name))
    };
  }

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
    const groups=Object.fromEntries(order.map(x=>[x,metricGroups(D.ind,x)]));
    const h=x=>x===k?' focus pickedMetric':'';
    const rankCls=(p,x)=>groups[x].best.has(p.name)?' stat-top3':groups[x].worst.has(p.name)?' stat-worst3':'';
    itable.innerHTML=`<div class="tr hdr"><div>順位</div><div>選手</div><div>チーム</div>${order.map(x=>`<div class="${h(x).trim()}">${defs[x][0]}</div>`).join('')}</div>`+
      a.map((p,i)=>{
        const c=colors[p.team]||'#777';
        return `<div class="tr data"><div class="pos">${i+1}</div><div class="band playerband" style="background:linear-gradient(90deg,${mix(c)},${c},#050505)"><span>${esc(p.name)}</span><small class="mobileTeam">${esc(p.team)}</small></div>${band(p.team,p.team)}${order.map(x=>`<div class="num${h(x)}${rankCls(p,x)}">${metricText(p,x)}</div>`).join('')}</div>`;
      }).join('');
    renderRecords();
  };

  function bestPlayer(k,asc=false,filter=()=>true){
    const arr=(D?.ind||[]).filter(filter).filter(p=>Number.isFinite(metricVal(p,k)));
    if(!arr.length)return null;
    return arr.sort((a,b)=>asc?metricVal(a,k)-metricVal(b,k):metricVal(b,k)-metricVal(a,k))[0];
  }

  function renderRecords(){
    const el=document.getElementById('recordGrid');
    if(!el||!D)return;
    const recs=[
      ['総ポイント',bestPlayer('points'),p=>metricText(p,'points')],
      ['最高スコア',bestPlayer('highScore',false,p=>p.highScore!=null),p=>metricText(p,'highScore')],
      ['最高平均打点',bestPlayer('avgScore',false,p=>p.avgScore>0),p=>metricText(p,'avgScore')],
      ['最高打点',bestPlayer('maxWin',false,p=>p.maxWin>0),p=>metricText(p,'maxWin')],
      ['最高トップ率',bestPlayer('topRate',false,p=>p.games>0),p=>metricText(p,'topRate')],
      ['最高立直和了率',bestPlayer('riichiWinRate',false,p=>p.webRiichiCount>0),p=>metricText(p,'riichiWinRate')],
      ['最低放銃率',bestPlayer('houjuRate',true,p=>p.hands>0),p=>metricText(p,'houjuRate')]
    ];
    el.innerHTML=recs.map(([label,p,fmt])=>p?`<div class="recordcard"><small>${label}</small><strong>${esc(p.name)}</strong><span>${fmt(p)}</span><em>${esc(p.team)}</em></div>`:`<div class="recordcard"><small>${label}</small><strong>—</strong><span>—</span></div>`).join('');
  }

  const style=document.createElement('style');
  style.id='individual-stats-v24-style';
  style.textContent=`
    .tablewrap{overflow-x:auto;overflow-y:auto}
    .itable{min-width:2490px;width:max-content}
    .itable .tr{width:2490px;grid-template-columns:52px 190px 250px repeat(16,116px)}
    .itable .data{background:#11151a}
    .itable .data>.num{background:#11151a}
    .itable .hdr>div{background:#171b20}
    .itable .data>:nth-child(3){box-shadow:-520px 0 0 #11151a}
    .itable .hdr>:nth-child(3){box-shadow:-520px 0 0 #171b20}
    .itable .tr>:nth-child(3)::after{content:"";position:absolute;top:-10px;bottom:-10px;right:-12px;width:12px;background:#11151a;pointer-events:none}
    .itable .hdr>:nth-child(3)::after{background:#171b20}
    .itable .data>.num.stat-top3{background:linear-gradient(90deg,rgba(176,35,55,.92),rgba(110,20,34,.78))!important;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(255,145,155,.25)}
    .itable .data>.num.stat-worst3{background:linear-gradient(90deg,rgba(38,128,170,.90),rgba(23,82,121,.78))!important;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(150,225,255,.24)}

    /* 試合スタッツは横スクロール可能。見出しとデータは完全に同じ列幅。 */
    .mwrap{overflow-x:auto;overflow-y:hidden;padding:5px 8px 16px;-webkit-overflow-scrolling:touch}
    .mtable{min-width:802px;width:802px}
    .mtable .tr{width:820px;grid-template-columns:44px 170px 220px 88px 70px 58px 58px 58px;gap:4px;padding-left:4px;padding-right:4px}
    .mtable .hdr>div,.mtable .data>div{min-width:0}
    .mtable .band{white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis;line-height:1.15}
    .mtable .hdr>div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    .recordgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;padding:8px 18px 20px}
    .recordcard{background:#11151a;border:1px solid #2b333d;border-radius:13px;padding:15px;min-height:126px;display:flex;flex-direction:column;gap:5px}
    .recordcard small{color:#929ba8;font-weight:800}.recordcard strong{font-size:18px}.recordcard span{font-size:25px;font-weight:950;font-variant-numeric:tabular-nums}.recordcard em{font-size:10px;color:#aeb7c3;font-style:normal}
    .updatelist{padding:8px 18px 20px;display:grid;gap:12px}.updategroup{background:#11151a;border:1px solid #2b333d;border-radius:12px;padding:14px;display:grid;gap:10px}.updatedate{font-weight:950;font-variant-numeric:tabular-nums;border-bottom:1px solid #2b333d;padding-bottom:9px}.updateentry{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:start;line-height:1.55}.updateentry>span:last-child{color:#cbd1d9}.updatekind{border-radius:999px;padding:3px 8px;text-align:center;font-size:10px;font-weight:950}.updatekind.add{background:#174d37;color:#8ff0bf}.updatekind.fix{background:#56331c;color:#ffc48e}

    @media(max-width:650px){
      .itable{min-width:1530px;width:1530px}
      .itable .tr{width:1530px;grid-template-columns:42px 168px repeat(16,82px);gap:0;padding-left:4px;padding-right:4px}
      .itable .tr>:nth-child(3){display:none}
      .itable .tr>:nth-child(1),.itable .tr>:nth-child(2){position:sticky;z-index:20;background:#11151a}
      .itable .hdr>:nth-child(1),.itable .hdr>:nth-child(2){background:#171b20;z-index:30}
      .itable .tr>:nth-child(1){left:0}
      .itable .tr>:nth-child(2){left:42px}
      .itable .data>:nth-child(2){box-shadow:-220px 0 0 #11151a}
      .itable .hdr>:nth-child(2){box-shadow:-220px 0 0 #171b20}
      .itable .tr>:nth-child(2)::after{content:"";position:absolute;top:-8px;bottom:-8px;right:-8px;width:8px;background:#11151a;pointer-events:none}
      .itable .hdr>:nth-child(2)::after{background:#171b20}
      .itable .data>:nth-child(1){border-radius:8px 0 0 8px}
      .itable .data>:nth-child(2){border-radius:0}
      .playerband .mobileTeam{display:block}

      /* スマホでもチーム列を隠さず、全8列を横スクロール */
      .mwrap{overflow-x:auto;padding-left:6px;padding-right:6px}
      .mtable{min-width:746px;width:746px}
      .mtable .tr{width:760px;grid-template-columns:40px 155px 205px 82px 66px 54px 54px 54px;gap:4px;padding-left:4px;padding-right:4px}
      .mtable .tr>:nth-child(3){display:block!important}
      .mtable .band{white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
      .recordgrid{grid-template-columns:1fr 1fr;padding:7px 10px 15px;gap:8px}.recordcard{min-height:112px;padding:12px}.recordcard strong{font-size:14px}.recordcard span{font-size:20px}
      .updatelist{padding:7px 10px 15px}.updategroup{padding:12px}.updateentry{grid-template-columns:48px 1fr;gap:8px}
    }
  `;
  document.head.appendChild(style);

  setTimeout(()=>{if(typeof load==='function')load()},0);
})();
