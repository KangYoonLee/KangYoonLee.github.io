/* CollectiveScope v2 — requestAnimationFrame-driven visual message transport.
   The model describes pedagogical communication rounds, not NCCL execution timing. */
(()=>{
'use strict';
const core=window.CollectiveCore;
if(!core) throw Error('CollectiveScope core.js did not load');
const el=id=>document.getElementById(id);
const svgNS='http://www.w3.org/2000/svg';
const labels={
 en:{brandTag:'GPU collective visualizer',conceptual:'Conceptual simulator',title:'Watch data move, step by step.',subtitle:'Choose a collective, press Play, and follow a message from GPU to GPU.',share:'Share setup',collective:'Collective',algorithm:'Algorithm',gpuCount:'GPUs',topology:'Topology',root:'Root',round:'CURRENT ROUND',physical:'Physical network',logical:'Algorithm',both:'Both',networkCanvas:'Network topology',logicalCanvas:'Logical communication',focusMsg:'Selected message',pathKey:'Selected route',notNCCL:'Illustrative paths · Not an NCCL trace',logicalKey:'Moving message',speed:'Speed',follow:'Follow a message',message:'Message',currentHop:'Current hop',focusHint:'Follow the blue marker. Other messages are shown as smaller dots.',whatsHappening:'What happens this round?',transfers:'Transfers',learnTitle:'What is this collective doing?',modelWarning:'Simplified teaching schedules and illustrative network routes. This is not OMNeT++, an NCCL execution trace, or a packet-level/performance simulation. NVLink/PCIe, queues, arbitration and congestion are not modeled.',nvidiaDocs:'Read NVIDIA collective documentation ↗',footerNote:'Made for understanding AI datacenter communication.',play:'Play',pause:'Pause',ready:'Ready — press Play',playing:'Messages moving',paused:'Paused',complete:'All rounds complete',roundLabel:'Round',of:'of',messages:'messages in this round',total:'total',copied:'Shareable URL copied',copyFailed:'Copy the address bar URL to share',single:'Single ToR',dual:'2 racks · Leaf–Spine',quad:'4 racks · Leaf–Spine',rack:'Rack',gpu:'GPU',tor:'ToR',spine:'Spine',selectEvent:'Select message'},
 ko:{brandTag:'GPU Collective 시각화',conceptual:'교육용 시뮬레이터',title:'데이터가 이동하는 모습을 직접 확인하세요.',subtitle:'Collective를 선택하고 재생을 누르면 GPU 간 메시지 이동을 따라갈 수 있어요.',share:'설정 공유',collective:'Collective 연산',algorithm:'알고리즘',gpuCount:'GPU 수',topology:'토폴로지',root:'Root',round:'현재 라운드',physical:'물리 네트워크',logical:'논리 알고리즘',both:'둘 다',networkCanvas:'네트워크 토폴로지',logicalCanvas:'논리적 통신',focusMsg:'선택한 메시지',pathKey:'강조된 경로',notNCCL:'교육용 경로 · 실제 NCCL Trace 아님',logicalKey:'이동 중인 메시지',speed:'속도',follow:'메시지 따라가기',message:'메시지',currentHop:'현재 구간',focusHint:'파란 데이터 마커를 따라가세요. 나머지 전송은 작은 점으로 표시됩니다.',whatsHappening:'현재 라운드에서는?',transfers:'전송 목록',learnTitle:'이 Collective는 무슨 일을 하나요?',modelWarning:'교육용 통신 스케줄과 단순화한 라우팅 모델입니다. OMNeT++, NCCL 실행 Trace, 패킷 수준·성능 시뮬레이션이 아닙니다. NVLink/PCIe, 큐잉, 링크 중재, 혼잡을 모델링하지 않습니다.',nvidiaDocs:'NVIDIA Collective 문서 ↗',footerNote:'AI 데이터센터 통신을 이해하기 위한 시각화 도구.',play:'재생',pause:'일시정지',ready:'준비 완료 — 재생을 누르세요',playing:'메시지 이동 중',paused:'일시정지',complete:'모든 라운드 완료',roundLabel:'라운드',of:'중',messages:'개 메시지 · 현재 라운드',total:'전체',copied:'설정 링크를 복사했습니다',copyFailed:'주소창 URL을 복사하세요',single:'단일 ToR',dual:'2개 Rack · Leaf–Spine',quad:'4개 Rack · Leaf–Spine',rack:'랙',gpu:'GPU',tor:'ToR',spine:'Spine',selectEvent:'메시지 선택'}
};
const algName={en:{ring:'Ring',tree:'Binary tree',direct:'Direct (teaching)',pairwise:'Pairwise'},ko:{ring:'Ring',tree:'이진 트리',direct:'Direct (교육용)',pairwise:'Pairwise'}};
const q=new URL(location.href).searchParams;
const op0=Object.hasOwn(core.OPTIONS,q.get('op'))?q.get('op'):'alltoall';
const s={op:op0,alg:core.OPTIONS[op0].includes(q.get('alg'))?q.get('alg'):core.OPTIONS[op0][0],n:[4,8].includes(+q.get('n'))?+q.get('n'):4,topology:['single','dual','quad'].includes(q.get('topology'))?q.get('topology'):'dual',root:Math.min(7,Math.max(0,Number(q.get('root'))||0)),lang:q.get('lang')==='ko'?'ko':'en',view:['physical','logical','both'].includes(q.get('view'))?q.get('view'):'physical',speed:1,step:0,focus:0,progress:0,playing:false};
s.root=Math.min(s.n-1,s.root);
let schedule=core.build(s),rafId=0,lastFrame=0,toastTimeout=0;
let physicalPositions={},logicalPositions={},physicalTokens=[],logicalTokens=[],lastHop=-1;
const duration=2600;
const tr=k=>labels[s.lang][k]||k;
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>schedule.steps[s.step];
const inStep=()=>current().events;
function chooseVisibleCrossRack(){const idx=inStep().findIndex(e=>core.route(e,s.topology,s.n).some(id=>id.startsWith('spine')));return idx<0?0:idx;}
const rootVisible=()=>['broadcast','reduce','gather','scatter'].includes(s.op)||s.alg==='tree'||(s.alg==='direct'&&['allreduce','reducescatter'].includes(s.op));
function initControls(){
 el('op').innerHTML=Object.keys(core.OPTIONS).map(op=>`<option value="${op}">${core.names[op][s.lang]}</option>`).join('');el('op').value=s.op;
 el('alg').innerHTML=core.OPTIONS[s.op].map(a=>`<option value="${a}">${algName[s.lang][a]}</option>`).join('');el('alg').value=s.alg;
 el('n').value=s.n;el('topology').value=s.topology;
 const opts={single:'single',dual:'dual',quad:'quad'};Array.from(el('topology').options).forEach(o=>{o.textContent=tr(opts[o.value]);});
 el('root').innerHTML=Array.from({length:s.n},(_,i)=>`<option value="${i}">R${i}</option>`).join('');el('root').value=s.root;el('rootField').hidden=!rootVisible();
 el('langBtn').textContent=s.lang==='en'?'한국어':'English';el('speed').value=s.speed;
 document.querySelectorAll('[data-t]').forEach(node=>{node.textContent=tr(node.dataset.t);});
 document.querySelectorAll('[data-view]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.view===s.view);btn.setAttribute('aria-pressed',String(btn.dataset.view===s.view));});
 document.documentElement.lang=s.lang;
}
function saveURL(){try{const u=new URL(location.href);for(const k of ['op','alg','n','topology','root','lang','view'])u.searchParams.set(k,s[k]);history.replaceState(null,'',u);}catch(_){}}
function mk(tag,attrs={},parent){const node=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));if(parent)parent.appendChild(node);return node;}
function st(text,x,y,attrs={},parent){const node=mk('text',{x,y,'text-anchor':'middle',class:'node-label',...attrs},parent);node.textContent=text;return node;}
const key=(a,b)=>[a,b].sort().join('|');
function computeFabric(){
 const racks=s.topology==='single'?1:s.topology==='dual'?2:4;
 const centers=racks===1?[460]:racks===2?[240,680]:[125,350,575,800];
 const pts={};const gpuRack=i=>Math.min(racks-1,Math.floor(i*racks/s.n));
 centers.forEach((x,r)=>{pts[`tor${r}`]={x,y:228,type:'tor',rack:r};const ranks=Array.from({length:s.n},(_,i)=>i).filter(i=>gpuRack(i)===r);const span=racks===1?670:racks===2?Math.min(280,88*(ranks.length-1)):92; ranks.forEach((rank,i)=>{pts[`gpu${rank}`]={x:x+(ranks.length===1?0:(i/(ranks.length-1)-.5)*span),y:370,type:'gpu',rank,rack:r};});});
 if(racks>1){pts.spine0={x:360,y:83,type:'spine'};pts.spine1={x:560,y:83,type:'spine'};}
 return {pts,racks,centers};
}
function computeLogical(){const pts={};if(s.alg==='tree'){
  const order=[s.root,...Array.from({length:s.n},(_,i)=>i).filter(i=>i!==s.root)];for(let i=0;i<s.n;i++){const depth=Math.floor(Math.log2(i+1)),index=i-(2**depth-1);pts[order[i]]={x:265+((index+.5)/2**depth-.5)*455,y:90+depth*110};}
 }else{for(let i=0;i<s.n;i++){const a=-Math.PI/2+2*Math.PI*i/s.n;pts[i]={x:265+177*Math.cos(a),y:232+162*Math.sin(a)};}}
 return pts;}
function coordsOfEvent(e){return core.route(e,s.topology,s.n).map(id=>physicalPositions[id]);}
function drawBaseFabric(svg,layout){
 const {pts,racks,centers}=layout;
 mk('title',{},svg).textContent='Physical network — animated message route';
 centers.forEach((x,r)=>{const width=racks===1?840:racks===2?386:195;mk('rect',{x:x-width/2,y:168,width,height:265,rx:11,fill:'#f6f8fc',stroke:'#e3e9f1','stroke-width':1.2},svg);st(`${tr('rack')} ${r}`,x,192,{class:'node-sub','font-size':12},svg);});
 const links=[];const add=(a,b)=>{const p=pts[a],q=pts[b];if(p&&q)links.push([a,b]);};
 for(let r=0;r<racks;r++){for(let i=0;i<s.n;i++){if(pts[`gpu${i}`].rack===r)add(`gpu${i}`,`tor${r}`);}if(racks>1){add(`tor${r}`,'spine0');add(`tor${r}`,'spine1');}}
 const active=core.loadMap(current(),s.topology,s.n),focus=inStep()[s.focus],focused=core.route(focus,s.topology,s.n),focusEdges=new Set(focused.slice(1).map((id,i)=>key(focused[i],id)));
 links.forEach(([a,b])=>{const p=pts[a],q=pts[b],k=key(a,b);mk('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:focusEdges.has(k)?'#2869ed':active[k]?'#a5bfe6':'#cbd5e1','stroke-width':focusEdges.has(k)?5:active[k]?2.3:1.8,'stroke-linecap':'round',opacity:focusEdges.has(k)?1:active[k]?.75:.66},svg);});
 // Rings show source/destination by color; link overlays remain visible behind nodes.
 Object.entries(pts).forEach(([id,p])=>{
  if(p.type==='gpu'){
   const isSource=focus.from===p.rank,isDest=focus.to===p.rank;
   mk('rect',{x:p.x-33,y:p.y-24,width:66,height:48,rx:10,fill:isSource?'#e9f1ff':isDest?'#e8f7f1':'#fff',stroke:isSource?'#2666ed':isDest?'#229f70':'#aabacf','stroke-width':isSource||isDest?2.6:1.5},svg);
   mk('rect',{x:p.x-23,y:p.y-9,width:12,height:18,rx:2,fill:isSource?'#2c68ef':isDest?'#2aa374':'#99acc4'},svg);
   st(`GPU ${p.rank}`,p.x+8,p.y+4,{'font-size':12},svg);
  }else{
   const isSpine=p.type==='spine';mk('rect',{x:p.x-43,y:p.y-21,width:86,height:42,rx:9,fill:'#fff',stroke:'#a6b7ca','stroke-width':1.7},svg);
   mk('rect',{x:p.x-30,y:p.y-8,width:9,height:5,rx:1,fill:'#94a8bf'},svg);mk('rect',{x:p.x-30,y:p.y+1,width:9,height:5,rx:1,fill:'#94a8bf'},svg);
   st(isSpine?`${tr('spine')} ${id.slice(-1)}`:`${tr('tor')} ${p.rack}`,p.x+11,p.y+4,{'font-size':12},svg);
  }
 });
 // Explicit path start/end markings aid interpretation when many messages coexist.
 const src=pts[`gpu${focus.from}`],dst=pts[`gpu${focus.to}`];
 st(s.lang==='ko'?'출발':'SOURCE',src.x,src.y+39,{class:'node-sub',fill:'#2563eb','font-size':11},svg);
 st(s.lang==='ko'?'도착':'DEST',dst.x,dst.y+39,{class:'node-sub',fill:'#14804b','font-size':11},svg);
}
function drawBaseLogical(svg,pts){
 mk('title',{},svg).textContent='Logical algorithm — moving selected communication message';
 const e=inStep()[s.focus];
 const edges=[];
 if(s.alg==='ring')for(let i=0;i<s.n;i++)edges.push([i,(i+1)%s.n]);
 if(s.alg==='tree')for(const level of core.treeFor(s.n,s.root))for(const p of level)edges.push([p.from,p.to]);
 edges.forEach(([a,b])=>mk('line',{x1:pts[a].x,y1:pts[a].y,x2:pts[b].x,y2:pts[b].y,stroke:'#ced9e7','stroke-width':2.1,'stroke-dasharray':'5 6'},svg));
 const active=inStep().slice(0,18);
 active.forEach(ev=>{if(ev===e)return;const a=pts[ev.from],b=pts[ev.to];mk('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#a3bceb','stroke-width':2,opacity:.5},svg);});
 const a=pts[e.from],b=pts[e.to];mk('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#2563eb','stroke-width':4,'stroke-linecap':'round'},svg);
 for(let i=0;i<s.n;i++){const p=pts[i];mk('circle',{cx:p.x,cy:p.y,r:28,fill:i===e.from?'#e9f1ff':i===e.to?'#e8f7f1':'#fff',stroke:i===e.from?'#2563eb':i===e.to?'#229f70':'#9caec5','stroke-width':i===e.from||i===e.to?2.7:1.7},svg);st(`R${i}`,p.x,p.y+5,{'font-size':16},svg);}
}
function pathPoint(coords,t){
 const seg=[];let total=0;
 for(let i=1;i<coords.length;i++){const a=coords[i-1],b=coords[i];const len=Math.hypot(b.x-a.x,b.y-a.y);seg.push(len);total+=len;}
 let remain=Math.max(0,Math.min(1,t))*total;
 for(let i=0;i<seg.length;i++){if(remain<=seg[i]||i===seg.length-1){const f=seg[i]?Math.min(1,remain/seg[i]):0;return {x:coords[i].x+(coords[i+1].x-coords[i].x)*f,y:coords[i].y+(coords[i+1].y-coords[i].y)*f,hop:i};}remain-=seg[i];}
 return {x:coords[0].x,y:coords[0].y,hop:0};
}
function drawToken(svg,isFocus,label,isLogical){const g=mk('g',{'data-packet':isFocus?'focus':'other', 'aria-hidden':'true'},svg);
 if(isFocus){mk('rect',{x:-21,y:-15,width:42,height:30,rx:8,fill:'#2563eb',stroke:'#fff','stroke-width':2,filter:'drop-shadow(0 2px 4px #0e4ca644)'},g);st(label.length>5?label.slice(0,5):label,0,4,{class:'flow-label','font-size':label.length>3?9:11},g);}else{mk('circle',{r:isLogical?6:6.5,fill:'#88abef',stroke:'#fff','stroke-width':1.8,opacity:.9},g);}return g;}
function drawCanvases(){
 const phys=el('fabricSvg'),log=el('logicalSvg');phys.replaceChildren();log.replaceChildren();
 const layout=computeFabric();physicalPositions=layout.pts;logicalPositions=computeLogical();
 drawBaseFabric(phys,layout);drawBaseLogical(log,logicalPositions);
 const evs=inStep();const limited=evs.map((_,i)=>i).filter(i=>i!==s.focus).slice(0,11);const indices=[...limited,s.focus];
 physicalTokens=[];logicalTokens=[];
 indices.forEach(i=>{
  const e=evs[i],f=i===s.focus;
  const points=coordsOfEvent(e);
  const token=drawToken(phys,f,shortLabel(e),false);physicalTokens.push({node:token,coords:points,focus:f});
  const logical=drawToken(log,f,shortLabel(e),true);logicalTokens.push({node:logical,coords:[logicalPositions[e.from],logicalPositions[e.to]],focus:f});
 });
 el('networkTag').textContent=s.topology==='single'?'1 TOR':s.topology==='dual'?'2 RACKS · 2 SPINES':'4 RACKS · 2 SPINES';
 el('logicalTag').textContent=s.alg.toUpperCase();
 updatePackets();
}
function shortLabel(e){return e.chunk.length>5?`${e.from}→${e.to}`:e.chunk;}
function nodeName(id){if(id.startsWith('gpu'))return `${tr('gpu')} ${id.slice(3)}`;if(id.startsWith('tor'))return `${tr('tor')} ${id.slice(3)}`;return `${tr('spine')} ${id.slice(5)}`;}
function updatePackets(){
 for(const o of physicalTokens){const p=pathPoint(o.coords,s.progress);o.node.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);}
 for(const o of logicalTokens){const p=pathPoint(o.coords,s.progress);o.node.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);}
 el('roundProgress').style.width=(s.progress*100).toFixed(2)+'%';
 const route=core.route(inStep()[s.focus],s.topology,s.n),point=pathPoint(route.map(id=>physicalPositions[id]),s.progress),hop=Math.min(point.hop,route.length-2);
 if(hop!==lastHop){lastHop=hop;el('hopText').textContent=`${nodeName(route[hop])} → ${nodeName(route[hop+1])}`;}
}
function renderStep(){
 const step=current(),events=step.events;
 el('stepCount').textContent=`${s.step+1} / ${schedule.steps.length}`;
 el('stepTitle').textContent=step.phase[s.lang];el('stepSub').textContent=step.summary[s.lang];
 el('timelineText').textContent=`${s.step+1} / ${schedule.steps.length}`;
 el('scrub').max=String(Math.max(0,schedule.steps.length-1));el('scrub').value=s.step;
 el('prevBtn').disabled=s.step===0;el('nextBtn').disabled=s.step===schedule.steps.length-1;
 el('eventCount').textContent=`${s.focus+1} ${tr('of')} ${events.length}`;el('stepBadge').textContent=`${tr('roundLabel')} ${s.step+1}`;
 el('eventSelect').innerHTML=events.map((e,i)=>`<option value="${i}">R${e.from} → R${e.to} · ${escapeHTML(e.chunk)}</option>`).join('');el('eventSelect').value=s.focus;
 el('transferCount').textContent=`${events.length} ${tr('total')}`;
 el('transferList').innerHTML=events.slice(0,24).map((e,i)=>`<button type="button" class="transfer-pill${i===s.focus?' selected':''}" data-event="${i}">R${e.from} <b>→</b> R${e.to}</button>`).join('')+(events.length>24?`<span class="transfer-pill">+${events.length-24}</span>`:'');
 el('stepExplain').textContent=step.detail[s.lang]||core.descriptions[s.op][s.lang];
 el('opExplain').textContent=core.descriptions[s.op][s.lang];
 el('messageCount').textContent=`${events.length} ${tr('messages')}`;
 const route=core.route(events[s.focus],s.topology,s.n);el('routeText').textContent=route.map(nodeName).join('  →  ');
 lastHop=-1;drawCanvases();renderControls();
}
function renderControls(){
 el('playText').textContent=tr(s.playing?'pause':'play');el('playGlyph').textContent=s.playing?'Ⅱ':'▶';
 el('playBtn').setAttribute('aria-label',tr(s.playing?'pause':'play'));
 el('playStatus').textContent=s.playing?`● ${tr('playing')}`:(s.step===schedule.steps.length-1&&s.progress>=1?tr('complete'):s.progress>0?tr('paused'):tr('ready'));
}
function syncView(){el('canvasGrid').className='canvas-grid '+(s.view==='physical'?'physical-only':s.view==='logical'?'logical-only':'both');document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===s.view);b.setAttribute('aria-pressed',String(b.dataset.view===s.view));});}
function restart(){pause();s.step=0;s.progress=0;s.focus=0;s.root=Math.min(s.n-1,s.root);schedule=core.build(s);s.focus=chooseVisibleCrossRack();initControls();syncView();renderStep();saveURL();}
function pause(){s.playing=false;if(rafId){cancelAnimationFrame(rafId);rafId=0;}lastFrame=0;renderControls();}
function stepTo(next){pause();s.step=Math.max(0,Math.min(schedule.steps.length-1,next));s.progress=0;s.focus=chooseVisibleCrossRack();renderStep();}
function animate(now){if(!s.playing)return;const diff=lastFrame?Math.min(100,now-lastFrame):0;lastFrame=now;s.progress=Math.min(1,s.progress+(diff*s.speed)/duration);
 updatePackets();
 if(s.progress>=1){if(s.step>=schedule.steps.length-1){pause();return;}s.step++;s.focus=chooseVisibleCrossRack();s.progress=0;renderStep();}
 if(s.playing)rafId=requestAnimationFrame(animate);
}
function play(){if(s.playing){pause();return;}
 if(s.step===schedule.steps.length-1 && s.progress>=1){s.step=0;s.progress=0;s.focus=chooseVisibleCrossRack();renderStep();}
 s.playing=true;lastFrame=0;renderControls();rafId=requestAnimationFrame(animate);
}
function changeFocus(index){s.focus=Math.max(0,Math.min(inStep().length-1,index));s.progress=0;renderStep();}
let toastId=0;function toast(txt){clearTimeout(toastId);el('toast').textContent=txt;el('toast').classList.add('show');toastId=setTimeout(()=>el('toast').classList.remove('show'),2200);}
// Controls
el('op').addEventListener('change',e=>{s.op=e.target.value;s.alg=core.OPTIONS[s.op][0];restart();});
el('alg').addEventListener('change',e=>{s.alg=e.target.value;restart();});
el('n').addEventListener('change',e=>{s.n=+e.target.value;restart();});
el('topology').addEventListener('change',e=>{s.topology=e.target.value;restart();});
el('root').addEventListener('change',e=>{s.root=+e.target.value;restart();});
el('langBtn').addEventListener('click',()=>{s.lang=s.lang==='en'?'ko':'en';const wasPlaying=s.playing;pause();initControls();renderStep();syncView();saveURL();if(wasPlaying)play();});
el('speed').addEventListener('change',e=>{s.speed=+e.target.value;});
el('playBtn').addEventListener('click',play);
el('resetBtn').addEventListener('click',()=>stepTo(0));
el('prevBtn').addEventListener('click',()=>stepTo(s.step-1));
el('nextBtn').addEventListener('click',()=>stepTo(s.step+1));
el('scrub').addEventListener('input',e=>stepTo(+e.target.value));
el('eventSelect').addEventListener('change',e=>changeFocus(+e.target.value));
el('transferList').addEventListener('click',e=>{const b=e.target.closest('[data-event]');if(b)changeFocus(+b.dataset.event);});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{s.view=b.dataset.view;syncView();saveURL();}));
el('shareBtn').addEventListener('click',async()=>{saveURL();try{await navigator.clipboard.writeText(location.href);toast(tr('copied'));}catch(_){toast(tr('copyFailed'));}});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();play();}else if(e.code==='ArrowRight'){stepTo(s.step+1);}else if(e.code==='ArrowLeft'){stepTo(s.step-1);}});
restart();
// Read-only diagnostics for the automated regression suite; no mutations exposed.
window.__collectiveScopeDebug=()=>({playing:s.playing,step:s.step,progress:s.progress,focus:s.focus,op:s.op,alg:s.alg,view:s.view,packetCount:physicalTokens.length,physicalMarkers:physicalTokens.map(p=>p.node.getAttribute('transform'))});
})();