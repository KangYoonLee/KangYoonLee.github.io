/* CollectiveScope UI. No external dependencies; safe for static hosting. */
(() => {
'use strict';
const core = window.CollectiveCore;
if(!core) return;
const $ = id => document.getElementById(id);
const defs = {
  en: {
    navExplorer:'Explorer',navGuide:'Field guide',educational:'Educational model',
    heroTitle:'See the collective.<br><em>Trace the fabric.</em>',heroCopy:'Go beyond GPU-to-GPU arrows. Explore how collective algorithms schedule messages—and how those messages traverse a physical datacenter network.',openExplorer:'Open interactive explorer',
    explorerTitle:'Collective explorer',explorerSub:'One communication schedule. Two synchronized perspectives.',share:'Share setup',interactive:'INTERACTIVE',
    operation:'Collective operation',algorithm:'Logical algorithm',algHint:'Teaching schedules, not an NCCL execution trace.',ranks:'GPU ranks',root:'Root rank',fabricTopology:'Physical topology',single:'Single ToR',dual:'2 racks · Leaf–Spine',quad:'4 racks · Leaf–Spine',speed:'Playback speed',modelNotice:'Illustrative routing (fixed source/destination path) and message-equivalent link loads. Not a performance simulator.',stepLabel:'STEP',physical:'PHYSICAL NETWORK VIEW',logical:'LOGICAL ALGORITHM VIEW',activePath:'Active link',idlePath:'Idle link',illustrative:'Illustrative, not packet capture',currentTransfers:'Current transfers',underHood:'WHAT IS HAPPENING',linkPressure:'LINK PRESSURE',normalized:'NORMALIZED',loadHint:'Units represent chunk-sized payloads traversing each link in this conceptual step. They are not bytes, throughput, or measured congestion.',
    statOps:'PRIMITIVES',statSteps:'SCHEDULE STEPS',statMessages:'LOGICAL MESSAGES',statUnits:'PAYLOAD UNITS',statsHint:'The number of logical messages and payload units is computed from the illustrated teaching schedule—not actual NCCL counters.',guideTitle:'A field guide to collectives',guideSub:'Start with the operation semantics, then follow its algorithm and network path.',accuracyTitle:'What this model does—and doesn’t do',accuracyCopy:'This tool illustrates abstract, deterministic communication schedules and physical routing. It does not execute NCCL, infer NCCL channels/protocols, model PCIe/NVLink, simulate NIC queuing or PFC, or predict real-time congestion. For research, compare with instrumented NCCL traces and switch/NIC counters.',readDocs:'Algorithm reference ↗',footerCopy:'A visual learning tool for distributed AI systems and datacenter networking.',play:'Play',pause:'Pause',transfers:'transfers',more:'more',noLoad:'No inter-rank traffic in this step.',copied:'Shareable link copied.',copyFailed:'Copy this URL to share your setup.',
    rootData:'root buffer',whole:'full vector',tipAllreduce:'Synchronization / gradient sum',tipAllgather:'Gather sharded parameters',tipReducescatter:'Shard reduced gradients',tipAlltoall:'MoE token exchange',tipBroadcast:'Parameter distribution',tipReduce:'Aggregate to a root',tipGather:'Collect rank-local chunks',tipScatter:'Partition root data'
  },
  ko: {
    navExplorer:'시각화',navGuide:'학습 가이드',educational:'교육용 모델',
    heroTitle:'Collective를 이해하고.<br><em>네트워크 경로를 추적하세요.</em>',heroCopy:'GPU 사이의 화살표를 넘어, Collective 알고리즘의 전송 순서와 실제 데이터센터 토폴로지에서의 경로를 함께 살펴보세요.',openExplorer:'인터랙티브 시각화 열기',
    explorerTitle:'Collective 탐색기',explorerSub:'하나의 통신 스케줄을 두 가지 관점에서 동시에 살펴보세요.',share:'설정 공유',interactive:'조작 가능',
    operation:'Collective 연산',algorithm:'논리적 알고리즘',algHint:'교육용 통신 스케줄이며 NCCL 실제 실행 Trace는 아닙니다.',ranks:'GPU Rank 수',root:'Root Rank',fabricTopology:'물리적 토폴로지',single:'단일 ToR',dual:'2개 Rack · Leaf–Spine',quad:'4개 Rack · Leaf–Spine',speed:'재생 속도',modelNotice:'출발지/목적지별 고정 경로 및 청크 단위 링크 부하를 보여주는 설명용 모델입니다. 성능 시뮬레이터가 아닙니다.',stepLabel:'단계',physical:'물리적 네트워크 관점',logical:'논리적 알고리즘 관점',activePath:'활성 링크',idlePath:'비활성 링크',illustrative:'개념도이며 실제 패킷 캡처가 아닙니다',currentTransfers:'현재 전송',underHood:'현재 단계 설명',linkPressure:'링크 부하',normalized:'정규화 단위',loadHint:'수치는 현재 개념적 단계의 각 링크를 지나는 청크 크기 기준 페이로드 양입니다. 실제 바이트/처리량/측정된 혼잡이 아닙니다.',
    statOps:'연산 종류',statSteps:'전체 단계',statMessages:'논리적 메시지 수',statUnits:'페이로드 단위',statsHint:'논리적 메시지 수와 페이로드 단위는 교육용 스케줄에 따라 계산한 것이며 NCCL 실제 카운터가 아닙니다.',guideTitle:'Collective 학습 가이드',guideSub:'연산 의미를 먼저 확인하고 알고리즘 및 물리적 경로를 따라가세요.',accuracyTitle:'이 모델이 다루는 것과 다루지 않는 것',accuracyCopy:'이 도구는 결정적인 교육용 통신 스케줄과 물리적 라우팅을 나타냅니다. NCCL을 실행하거나 NCCL 채널/프로토콜을 추정하지 않으며, PCIe/NVLink, NIC 큐잉, PFC, 실제 혼잡 성능을 시뮬레이션하지 않습니다. 연구 목적이라면 계측한 NCCL Trace와 NIC/스위치 카운터를 비교해야 합니다.',readDocs:'알고리즘 참고 ↗',footerCopy:'분산 AI 시스템과 데이터센터 네트워크를 위한 시각적 학습 도구입니다.',play:'재생',pause:'일시정지',transfers:'개 전송',more:'개 더 있음',noLoad:'이 단계에는 Rank 간 전송이 없습니다.',copied:'공유 링크를 복사했습니다.',copyFailed:'URL을 복사하여 설정을 공유하세요.',
    rootData:'Root 버퍼',whole:'전체 벡터',tipAllreduce:'동기화 / Gradient 합산',tipAllgather:'분할된 파라미터 수집',tipReducescatter:'합산된 Gradient 분산',tipAlltoall:'MoE 토큰 교환',tipBroadcast:'파라미터 전파',tipReduce:'Root에서 집계',tipGather:'Rank별 청크 수집',tipScatter:'Root 데이터 분할'
  }
};
const tips={allreduce:'tipAllreduce',allgather:'tipAllgather',reducescatter:'tipReducescatter',alltoall:'tipAlltoall',broadcast:'tipBroadcast',reduce:'tipReduce',gather:'tipGather',scatter:'tipScatter'};
const algNames={ring:'Ring (pipelined)',tree:'Binary tree',direct:'Direct / centralized',pairwise:'Pairwise exchange'};
const algNamesKo={ring:'Ring (순환)',tree:'Binary tree (이진 트리)',direct:'Direct / 중앙집중식',pairwise:'Pairwise (쌍별 교환)'};
const params = new URL(location.href).searchParams;
const initOp = core.OPTIONS[params.get('op')]?params.get('op'):'allreduce';
let state={op:initOp,alg:core.OPTIONS[initOp].includes(params.get('alg'))?params.get('alg'):core.OPTIONS[initOp][0],n:[4,8].includes(+params.get('n'))?+params.get('n'):4,topology:['single','dual','quad'].includes(params.get('topology'))?params.get('topology'):'dual',root:Number.isInteger(+params.get('root'))?Math.max(0,+params.get('root')):0,speed:1,lang:params.get('lang')==='ko'?'ko':'en',playing:false,index:0};
state.root=Math.min(state.root,state.n-1);
let simulation=core.build(state),timer=null,toastTimer=null;
const t=key=>defs[state.lang][key]||key;
const svgText=(x,y,txt,size=11,color='#adbed2',attrs='')=>`<text x="${x}" y="${y}" fill="${color}" font-family="Space Mono, monospace" font-size="${size}" ${attrs}>${txt}</text>`;
const path=(nodes,coords)=>nodes.map((id,i)=>`${i?'L':'M'}${coords[id].x.toFixed(1)} ${coords[id].y.toFixed(1)}`).join(' ');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function configureControls(){
  $('op').innerHTML=Object.keys(core.OPTIONS).map(op=>`<option value="${op}">${core.names[op][state.lang]}</option>`).join('');
  $('op').value=state.op;
  $('alg').innerHTML=core.OPTIONS[state.op].map(a=>`<option value="${a}">${(state.lang==='ko'?algNamesKo:algNames)[a]}</option>`).join('');
  $('alg').value=state.alg;
  $('n').value=String(state.n);$('topology').value=state.topology;
  $('root').innerHTML=Array.from({length:state.n},(_,i)=>`<option value="${i}">Rank ${i}</option>`).join('');
  $('root').value=String(state.root);
  $('rootGroup').style.display=['broadcast','reduce','gather','scatter'].includes(state.op)?'block':'none';
  $('opDescription').textContent=core.descriptions[state.op][state.lang];
  $('langBtn').textContent=state.lang==='en'?'한국어':'English';
  $('speed').value=String(state.speed);$('speedValue').textContent=state.speed+'×';
}
function renderTranslations(){
  document.documentElement.lang=state.lang;
  document.querySelectorAll('[data-i]').forEach(el=>{
    const k=el.getAttribute('data-i');if(!defs[state.lang][k])return;
    if(k==='heroTitle')el.innerHTML=t(k);else el.textContent=t(k);
  });
  $('playText').textContent=t(state.playing?'pause':'play');
  configureControls();renderGuide();
}
function renderGuide(){
  $('guideGrid').innerHTML=Object.keys(core.OPTIONS).map((op,i)=>`<button class="guide-item" type="button" data-guide="${op}"><span class="guide-number">${String(i+1).padStart(2,'0')} / 08</span><h3>${core.names[op][state.lang]}</h3><p>${esc(core.descriptions[op][state.lang])}<br><span style="color:#5af4c6">${t(tips[op])} ↗</span></p></button>`).join('');
  $('guideGrid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{state.op=b.dataset.guide;state.alg=core.OPTIONS[state.op][0];restart();$('explorer').scrollIntoView({behavior:'smooth'});}));
}
function fabricPositions(){
  const racks=state.topology==='single'?1:state.topology==='dual'?2:4;
  const points={},gpuRack=i=>Math.min(racks-1,Math.floor(i*racks/state.n));
  const centers=Array.from({length:racks},(_,i)=>390+(i-(racks-1)/2)*(racks===1?0:racks===2?352:171));
  for(let r=0;r<racks;r++){
    points['tor'+r]={x:centers[r],y:175,kind:'tor',rack:r};
    const gpus=Array.from({length:state.n},(_,i)=>i).filter(i=>gpuRack(i)===r);
    const span=racks===1?Math.min(600,85*(gpus.length-1)):racks===2?Math.min(235,73*(gpus.length-1)):68*(gpus.length-1);
    for(let k=0;k<gpus.length;k++)points['gpu'+gpus[k]]={x:centers[r]+(gpus.length===1?0:(k/(gpus.length-1)-.5)*span),y:304,kind:'gpu',rank:gpus[k],rack:r};
  }
  if(racks>1){points.spine0={x:316,y:59,kind:'spine'};points.spine1={x:464,y:59,kind:'spine'};}
  return {points,racks,centers};
}
function renderFabric(){
  const {points,racks,centers}=fabricPositions(),step=simulation.steps[state.index];
  const loads=core.loadMap(step,state.topology,state.n);
  const max=Math.max(1,...Object.values(loads).map(l=>l.units));
  let s=`<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><marker id="send-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#5af4c6"/></marker></defs>`;
  for(let r=0;r<racks;r++){
    const x=racks===1?26:centers[r]-(racks===2?165:77),w=racks===1?728:racks===2?330:154;
    s+=`<rect x="${x}" y="145" width="${w}" height="222" rx="12" fill="#10223866" stroke="#2e4960" stroke-dasharray="4 5"/>`;
    s+=svgText(x+14,161,`RACK ${r}`,10,'#608ba7');
  }
  const linkPairs=[];
  for(let i=0;i<state.n;i++)linkPairs.push(['gpu'+i,'tor'+points['gpu'+i].rack]);
  if(racks>1)for(let r=0;r<racks;r++)for(let j=0;j<2;j++)linkPairs.push(['tor'+r,'spine'+j]);
  for(const [a,b] of linkPairs){
    const k=[a,b].sort().join('|'),load=loads[k]?.units||0,pa=points[a],pb=points[b];
    const highlighted=load>0,thick=highlighted?2.5+Math.min(6,load/max*5):1.6;
    s+=`<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="${highlighted?'#48bfae':'#314962'}" stroke-width="${thick}" stroke-opacity="${highlighted?.6+.35*load/max:.67}" stroke-linecap="round"/>`;
  }
  const routeLimit=12;
  step.events.slice(0,routeLimit).forEach((ev,i)=>{
    const ids=core.route(ev,state.topology,state.n),d=path(ids,points),dur=Math.max(.8,2.1/state.speed)+i*.015;
    s+=`<path d="${d}" fill="none" stroke="#5af4c6" stroke-width="${ev.units>1?2.6:1.8}" stroke-opacity=".49" stroke-dasharray="5 7"/>`;
    s+=`<circle r="${ev.units>1?4.2:3.2}" fill="${i%3===1?'#73a6ff':'#5af4c6'}" filter="url(#glow)"><animateMotion dur="${dur}s" begin="-${(i%6)*.13}s" repeatCount="indefinite" path="${d}"/></circle>`;
  });
  for(const [id,p] of Object.entries(points)){
    const highlight = step.events.some(e=>id===`gpu${e.from}`||id===`gpu${e.to}`);
    if(p.kind==='gpu'){
      s+=`<rect x="${p.x-28}" y="${p.y-22}" width="56" height="44" rx="9" fill="${highlight?'#174c54':'#17273d'}" stroke="${highlight?'#5af4c6':'#54738e'}" stroke-width="1.7"/>`;
      s+=`<rect x="${p.x-19}" y="${p.y-14}" width="14" height="11" rx="2" fill="${highlight?'#5af4c6':'#42617a'}"/>`;
      s+=svgText(p.x+5,p.y-4,`GPU`,10,'#caddec',`text-anchor="middle"`)+svgText(p.x,p.y+13,`R${p.rank}`,10,'#8dacc6',`text-anchor="middle"`);
    } else {
      s+=`<rect x="${p.x-35}" y="${p.y-18}" width="70" height="36" rx="7" fill="#173447" stroke="${p.kind==='spine'?'#6b89b6':'#5e9ea9'}" stroke-width="1.6"/>`;
      s+=svgText(p.x,p.y+4,p.kind==='spine'?`SPINE ${id.slice(-1)}`:`ToR ${p.rack}`,11,'#c5dce9',`text-anchor="middle"`);
    }
  }
  if(racks===1)s+=svgText(390,85,'GPU ↔ ToR ↔ GPU',11,'#6e9cbb','text-anchor="middle"');
  if(step.events.length>routeLimit)s+=`<rect x="510" y="16" width="252" height="28" rx="6" fill="#1a3046" stroke="#355974"/>`+svgText(636,34,`${routeLimit} / ${step.events.length} animated; all in link loads`,9,'#bdd7e3','text-anchor="middle"');
  $('fabricSvg').innerHTML=s;
  $('topologyTag').textContent=state.topology==='single'?'SINGLE TOR':state.topology==='dual'?'2 RACKS / 2 SPINES':'4 RACKS / 2 SPINES';
  renderLoad(loads);
}
function logicalPositions(){
  const n=state.n,p={};
  if(state.alg==='tree'){
    const root=state.root,order=[root,...Array.from({length:n},(_,i)=>i).filter(i=>i!==root)];
    for(let i=0;i<n;i++){
      const depth=Math.floor(Math.log2(i+1)),first=2**depth-1,at=i-first,count=Math.min(2**depth,n-first);
      p[order[i]]={x:195+((at+.5)/2**depth-.5)*332,y:79+depth*100};
    }
  } else for(let i=0;i<n;i++){
    const theta=2*Math.PI*i/n-Math.PI/2;
    p[i]={x:195+123*Math.cos(theta),y:195+124*Math.sin(theta)};
  }
  return p;
}
function renderLogical(){
  const n=state.n,steps=simulation.steps,evs=steps[state.index].events,pts=logicalPositions();
  let s=`<defs><marker id="logical-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10" fill="#5af4c6"/></marker></defs>`;
  if(state.alg==='ring')for(let i=0;i<n;i++){
    const a=pts[i],b=pts[(i+1)%n];s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2d435e" stroke-width="2" stroke-dasharray="4 5"/>`;
  }
  if(state.alg==='tree')for(const lev of core.treeFor(n,state.root))for(const tr of lev){
    const a=pts[tr.from],b=pts[tr.to];s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2d435e" stroke-width="2" stroke-dasharray="4 5"/>`;
  }
  const pairs=new Map();for(const e of evs){let key=e.from+'|'+e.to;if(!pairs.has(key))pairs.set(key,{...e,count:0});pairs.get(key).count++;}
  Array.from(pairs.values()).slice(0,28).forEach((e,j)=>{
    const a=pts[e.from],b=pts[e.to],vx=b.x-a.x,vy=b.y-a.y,L=Math.hypot(vx,vy)||1;
    const x1=a.x+vx/L*30,y1=a.y+vy/L*30,x2=b.x-vx/L*31,y2=b.y-vy/L*31;
    s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${e.kind==='reduce'?'#729aff':'#5af4c6'}" stroke-opacity=".9" stroke-width="${Math.min(5,2+e.count*.45)}" marker-end="url(#logical-arrow)"/>`;
  });
  for(let i=0;i<n;i++){
    const p=pts[i],active=evs.some(e=>e.from===i||e.to===i),isRoot=state.root===i&&['scatter','gather','reduce','broadcast'].includes(state.op);
    s+=`<circle cx="${p.x}" cy="${p.y}" r="27" fill="${active?'#163b48':'#1a2a41'}" stroke="${active?'#5af4c6':'#5d7799'}" stroke-width="${active?2.2:1.5}"/>`;
    s+=svgText(p.x,p.y+4,`R${i}`,14,'#e6f4ff','text-anchor="middle"');
    if(isRoot)s+=svgText(p.x,p.y+44,'ROOT',9,'#f8b56b','text-anchor="middle"');
  }
  const info=state.alg==='ring'?'RING ORDER →':state.alg==='tree'?'ROOTED BINARY TREE':state.alg==='pairwise'?'CYCLIC PAIRWISE':'DIRECT COMMUNICATION';
  s+=svgText(195,360,info,10,'#698aa6','text-anchor="middle"');
  $('logicalSvg').innerHTML=s;$('algorithmTag').textContent=state.alg.toUpperCase();
}
function renderLoad(loads){
  const items=Object.entries(loads).sort((a,b)=>b[1].units-a[1].units).slice(0,5),max=items[0]?.[1].units||1;
  $('linkLoad').innerHTML=items.length?items.map(([key,item])=>{
    const title=key.replace(/gpu/g,'GPU ').replace(/tor/g,'ToR ').replace(/spine/g,'Spine ').replace('|',' ↔ ');
    return `<div class="load-row"><span class="load-label" title="${esc(title)}">${esc(title)}</span><div class="load-track"><div class="load-fill" style="width:${Math.max(5,item.units/max*100)}%"></div></div><span class="load-num">${item.units}u</span></div>`;
  }).join(''):`<p>${t('noLoad')}</p>`;
}
function renderStep(){
  const step=simulation.steps[state.index];
  $('stageBreadcrumb').textContent=`${state.op.toUpperCase()} · ${state.alg.toUpperCase()}`;
  $('stageTitle').textContent=step.phase[state.lang];$('stageSummary').textContent=step.summary[state.lang];
  $('stepIndex').textContent=String(state.index+1).padStart(2,'0');$('stepTotal').textContent=' / '+String(simulation.steps.length).padStart(2,'0');
  $('explainTitle').textContent=step.summary[state.lang];$('explainText').textContent=step.detail[state.lang]||core.descriptions[state.op][state.lang];
  $('transferList').innerHTML=step.events.slice(0,10).map(ev=>`<span class="transfer">R${ev.from} <b>→</b> R${ev.to} <b>${esc(ev.chunk)}</b></span>`).join('')+(step.events.length>10?`<span class="transfer">+${step.events.length-10} ${t('more')}</span>`:'');
  $('scrub').max=String(simulation.steps.length-1);$('scrub').value=String(state.index);
  $('fraction').textContent=`${state.index+1} / ${simulation.steps.length}`;
  $('prevBtn').disabled=state.index===0;$('nextBtn').disabled=state.index===simulation.steps.length-1;
  renderFabric();renderLogical();
}
function pushParams(){
  try{const url=new URL(location.href);for(const k of ['op','alg','n','topology','root','lang'])url.searchParams.set(k,String(state[k]));history.replaceState(null,'',url.toString());}catch(_){/* file URLs */}
}
function stop(){if(timer!==null){clearInterval(timer);timer=null;}state.playing=false;$('playText').textContent=t('play');$('playIcon').textContent='▶';}
function run(){stop();if(state.index===simulation.steps.length-1){state.index=0;renderStep();}state.playing=true;$('playText').textContent=t('pause');$('playIcon').textContent='Ⅱ';timer=setInterval(()=>{if(state.index+1<simulation.steps.length){state.index++;renderStep();}else stop();},Math.round(1500/state.speed));}
function restart(){stop();state.index=0;state.root=Math.min(state.n-1,state.root);simulation=core.build(state);renderTranslations();renderStep();$('metricSteps').textContent=String(simulation.steps.length).padStart(2,'0');$('metricMessages').textContent=simulation.packetCount.toLocaleString();$('metricUnits').textContent=simulation.units.toLocaleString();pushParams();}
function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
$('op').addEventListener('change',e=>{state.op=e.target.value;state.alg=core.OPTIONS[state.op][0];restart();});
$('alg').addEventListener('change',e=>{state.alg=e.target.value;restart();});
$('n').addEventListener('change',e=>{state.n=+e.target.value;restart();});
$('root').addEventListener('change',e=>{state.root=+e.target.value;restart();});
$('topology').addEventListener('change',e=>{state.topology=e.target.value;restart();});
$('langBtn').addEventListener('click',()=>{state.lang=state.lang==='en'?'ko':'en';restart();});
$('speed').addEventListener('input',e=>{state.speed=+e.target.value;$('speedValue').textContent=state.speed+'×';if(state.playing)run();else renderFabric();});
$('playBtn').addEventListener('click',()=>state.playing?stop():run());
$('prevBtn').addEventListener('click',()=>{stop();state.index=Math.max(0,state.index-1);renderStep();});
$('nextBtn').addEventListener('click',()=>{stop();state.index=Math.min(simulation.steps.length-1,state.index+1);renderStep();});
$('resetBtn').addEventListener('click',()=>{stop();state.index=0;renderStep();});
$('scrub').addEventListener('input',e=>{stop();state.index=+e.target.value;renderStep();});
$('shareBtn').addEventListener('click',async()=>{pushParams();try{await navigator.clipboard.writeText(location.href);toast(t('copied'));}catch(_){toast(t('copyFailed'));}});
window.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;
  if(e.key===' '){e.preventDefault();state.playing?stop():run();}
  if(e.key==='ArrowRight'){e.preventDefault();stop();state.index=Math.min(simulation.steps.length-1,state.index+1);renderStep();}
  if(e.key==='ArrowLeft'){e.preventDefault();stop();state.index=Math.max(0,state.index-1);renderStep();}
});
restart();
})();