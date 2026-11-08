/* CollectiveScope v4: one canvas, simultaneous numbered data transfers.
 * Teaching illustration; not a packet trace or NCCL runtime reimplementation. */
(() => {
'use strict';
const S=window.CollectiveSim;
if(!S)throw new Error('CollectiveSim must load before app.js');
const ns='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const COLORS=['#6ba6ff','#ff9b65','#be8cf5','#58cba7','#ff7596','#ffc86f','#77d9ea','#a3be61'];
const I={
 en:{operation:'Collective',algorithm:'Algorithm',gpus:'GPUs',placement:'Placement',path:'View',speed:'Speed',model:'Interactive collective communication visualizer',hint:'Press Play to watch every GPU send simultaneously.',ready:'Ready',sending:'transfers moving',finished:'Complete',step:'STEP',play:'Play',pause:'Pause',result:'Show result →',complete:'Finished — all communication steps complete.',begin:'Start · all GPUs own their original numbered data.',input:'SEND',output:'RECEIVED',data:'DATA',own:'Initial / owned data',updated:'Received / updated',read:'How to read this',scope:'Each box is a GPU; each numbered cell is a logical data chunk. Colored tokens move together during a step. This is an explanatory animation—not an NCCL trace, measured latency, or Ethernet packets.',share:'Copy configuration link ↗',copied:'Link copied',server:'GPU SERVER',rack:'RACK',logical:'LOGICAL RANK CONNECTIONS',physical:'PHYSICAL ROUTE · ILLUSTRATIVE',server1:'1 server',server2:'2 servers',links:'transfers this step',noMessages:'No messages in this step',network:'Between servers: NIC → ToR → Spine → ToR → NIC',local:'Within one server: local GPU fabric',desc:{alltoall:'Each GPU sends a different numbered chunk to every other GPU.',allreduce:'Every GPU receives the sum of all contributions.',allgather:'Every GPU collects the unique chunk from every other GPU.',reducescatter:'Matching chunks are summed, then distributed to different GPUs.',broadcast:'GPU 0 copies its data to every other GPU.',reduce:'All GPUs add their data at GPU 0.',gather:'GPU 0 collects the individual chunks from all GPUs.',scatter:'GPU 0 distributes one distinct chunk to every GPU.'}},
 ko:{operation:'Collective',algorithm:'알고리즘',gpus:'GPU 개수',placement:'GPU 배치',path:'경로 보기',speed:'재생 속도',model:'GPU Collective Communication 시각화',hint:'Play를 누르면 모든 GPU의 데이터가 동시에 이동해요.',ready:'준비',sending:'개 전송 중',finished:'완료',step:'단계',play:'재생',pause:'일시정지',result:'최종 결과 보기 →',complete:'완료 — 모든 통신 단계가 끝났습니다.',begin:'시작 · 각 GPU는 고유한 숫자 데이터를 가지고 있습니다.',input:'송신 데이터',output:'수신 데이터',data:'보유 데이터',own:'초기 / 보유 데이터',updated:'새로 수신한 데이터',read:'그림 읽는 법',scope:'큰 박스는 GPU, 작은 숫자 칸은 논리적 데이터 청크입니다. 한 단계에서 색깔 숫자들이 동시에 이동합니다. NCCL 실행 추적, 실제 지연시간 또는 이더넷 패킷을 나타내는 그림은 아닙니다.',share:'설정 URL 복사 ↗',copied:'링크 복사 완료',server:'GPU 서버',rack:'랙',logical:'논리적 GPU 통신 관계',physical:'물리적 통신 경로 · 개념도',server1:'서버 1대',server2:'서버 2대',links:'개 전송 예정',noMessages:'이번 단계에는 전송이 없습니다',network:'서버 간: NIC → ToR → Spine → ToR → NIC',local:'서버 내부: GPU 연결망',desc:{alltoall:'모든 GPU가 목적지마다 다른 숫자 청크를 동시에 전송합니다.',allreduce:'모든 GPU의 값을 더한 결과를 각 GPU가 받습니다.',allgather:'모든 GPU가 다른 GPU의 고유 청크를 모읍니다.',reducescatter:'같은 위치의 청크를 합산한 후 GPU마다 다른 청크를 분배합니다.',broadcast:'GPU 0의 데이터를 모든 GPU에 복사합니다.',reduce:'모든 GPU의 값을 GPU 0에서 합산합니다.',gather:'GPU 0이 각 GPU의 청크를 모읍니다.',scatter:'GPU 0이 서로 다른 청크를 각 GPU에 분배합니다.'}}
};
const Q=new URLSearchParams(location.search);
const params={op:Q.get('op')||'alltoall',alg:Q.get('alg')||'pairwise',n:Number(Q.get('gpu'))===8?8:4,placement:Q.get('placement')==='inter'?'inter':'intra',view:Q.get('view')==='dcn'?'dcn':'logical',speed:[.5,1,2,4].includes(Number(Q.get('speed')))?Number(Q.get('speed')):1,lang:Q.get('lang')==='ko'?'ko':'en'};
if(!S.OPS[params.op])params.op='alltoall';
if(!S.OPS[params.op].algs.includes(params.alg))params.alg=S.OPS[params.op].algs[0];
let sim,step=0,playing=false,autoplay=false,progress=0,started=0,lastTs=0,frameId=0,pending=0,packetSprites=[];
const canvas=$('stage'), background=$('stage-backdrop'),links=$('stage-links'),nodes=$('stage-nodes'),packetLayer=$('stage-packets');
const xlink=(tag,attrs,parent)=>{const el=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs||{}))el.setAttribute(key,String(value));if(parent)parent.appendChild(el);return el};
const txt=(parent,x,y,value,cls,extra={})=>{const el=xlink('text',{x,y,class:cls,...extra},parent);el.textContent=String(value);return el};
const path=(parent,d,attrs={})=>xlink('path',{d,...attrs},parent);
const rect=(parent,x,y,w,h,attrs={})=>xlink('rect',{x,y,width:w,height:h,rx:attrs.rx??9,...attrs},parent);
const lines=(x,y,word,parent=background)=>txt(parent,x,y,word,'overlay-label');
const box={w:198,h:152};
const serverIndex=r=>params.placement==='intra'?0:(r<params.n/2?0:1);
function positions(){const p={};if(params.placement==='intra'&&params.alg==='tree'&&params.view==='logical'){
 const tree=params.n===4?[[600,165],[330,320],[800,320],[800,505]]:[[600,154],[250,292],[515,292],[515,433],[885,292],[775,433],[1045,433],[1045,548]];
 tree.forEach(([x,y],r)=>p[r]={x,y});return p;
 }if(params.placement==='intra'){
 const xx=params.n===4?[390,810]:[152,451,749,1048]; const top=205,bottom=475;
 for(let r=0;r<params.n;r++){let col=params.n===4?r%2:r%4;let row=params.n===4?Math.floor(r/2):Math.floor(r/4);
  if(params.alg==='ring'){if(params.n===4){const ordered=[[0,0],[1,0],[1,1],[0,1]];[col,row]=ordered[r];}else{const ordered=[[0,0],[1,0],[2,0],[3,0],[3,1],[2,1],[1,1],[0,1]];[col,row]=ordered[r];}}
  p[r]={x:xx[col],y:row?bottom:top};}
}else if(params.n===4){[[250,198],[250,470],[950,198],[950,470]].forEach(([x,y],r)=>p[r]={x,y});}
else{for(let r=0;r<8;r++){const left=r<4,k=r%4;p[r]={x:left?(k%2?403:175):(k%2?1025:797),y:k<2?205:470};}}
return p;}
function translated(){return I[params.lang];}
function syncURL(){const p=new URLSearchParams({op:params.op,alg:params.alg,gpu:String(params.n),placement:params.placement,view:params.view,speed:String(params.speed),lang:params.lang});try{history.replaceState(null,'',location.pathname+'?'+p.toString());}catch(_e){/* embedded/preview contexts without a navigable origin */}}
function applyOptions(){const algs=S.OPS[params.op].algs;const select=$('algorithm');select.innerHTML='';for(const alg of algs){const el=document.createElement('option');el.value=alg;el.textContent=alg==='pairwise'?'Pairwise':alg==='direct'?'Direct (Naive)':alg.charAt(0).toUpperCase()+alg.slice(1);select.appendChild(el);}if(!algs.includes(params.alg))params.alg=algs[0];select.value=params.alg;}
function applyLang(){const t=translated();document.documentElement.lang=params.lang;document.querySelectorAll('[data-t]').forEach(el=>{const k=el.getAttribute('data-t');if(t[k])el.textContent=t[k];});$('language').textContent=params.lang==='en'?'한국어':'English';$('education').textContent=t.model;$('complete').textContent=t.result;$('scope-title').textContent=t.read;$('scope-desc').textContent=t.scope;$('share').textContent=t.share;$('legend').innerHTML=`<span><i class="legend-color owned"></i>${t.own}</span><span><i class="legend-color updated"></i>${t.updated}</span>`;document.querySelector('[data-placement="intra"]').textContent=t.server1;document.querySelector('[data-placement="inter"]').textContent=t.server2;}
function applyControls(){applyOptions();$('operation').value=params.op;$('speed').value=String(params.speed);document.querySelectorAll('[data-n]').forEach(el=>el.classList.toggle('active',Number(el.dataset.n)===params.n));document.querySelectorAll('[data-placement]').forEach(el=>el.classList.toggle('active',el.dataset.placement===params.placement));document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===params.view));applyLang();syncURL();}
function stop(){playing=false;autoplay=false;if(frameId)cancelAnimationFrame(frameId);if(pending)clearTimeout(pending);frameId=0;pending=0;}
function rebuild(){stop();progress=0;step=0;sim=S.build(params);applyControls();render();}
function drawBackdrop(pos){background.replaceChildren();const t=translated();
 // One shared GPU enclosure or two physically distinct server enclosures.
 if(params.placement==='intra'){rect(background,20,66,1160,params.alg==='tree'&&params.view==='logical'?556:515,{class:'server-frame',rx:17});txt(background,40,93,`${t.server.toUpperCase()} 0  ·  GPU FABRIC`,'server-label');}
 else{rect(background,26,73,484,505,{class:'server-frame',rx:17});rect(background,690,73,484,505,{class:'server-frame',rx:17});txt(background,46,100,`${t.server.toUpperCase()} 0  ·  NVLINK`,'server-label');txt(background,710,100,`${t.server.toUpperCase()} 1  ·  NVLINK`,'server-label');}
 if(params.view==='dcn'&&params.placement==='inter'){
  path(background,'M 515 334 L 685 334',{class:'router-line'});
  for(const [x,name,sub] of [[539,'ToR 0','Leaf'],[600,'SPINE','Fabric'],[661,'ToR 1','Leaf']]){
   rect(background,x-28,305,56,58,{class:'router-node',rx:10});txt(background,x,327,name,'router-label');txt(background,x,343,sub,'router-sub');
  }
 }
 txt(background,600,37,params.view==='dcn'?t.physical:t.logical,'server-label',{'text-anchor':'middle'});
 if(params.view==='dcn')txt(background,600,625,params.placement==='inter'?t.network:t.local,'legend-slot',{'text-anchor':'middle'});
}
function drawGPU(r,pos,values,old){const {x,y}=pos;const g=xlink('g',{'data-rank':r},nodes);const w=box.w,h=box.h;rect(g,x-w/2,y-h/2,w,h,{class:'node-bg',rx:13});rect(g,x-w/2,y-h/2,w,32,{fill:'#203855',rx:12});rect(g,x-w/2,y-h/2+25,w,9,{fill:'#203855',rx:0});
 rect(g,x-w/2+11,y-h/2+10,10,10,{fill:COLORS[r],rx:3});txt(g,x-w/2+28,y-h/2+23,`GPU ${r}`,'node-title');txt(g,x+w/2-12,y-h/2+21,`RANK ${r}`,'node-sub',{'text-anchor':'end'});path(g,`M ${x-w/2+10} ${y-h/2+35} H ${x+w/2-10}`,{class:'node-divider'});
 const t=translated();const before=old&&old[r]?old[r].values:[];
 function valuesRow(label,arr,y0,comp,highlight){txt(g,x-w/2+12,y0-10,label,'mini-label');const gap=4,len=arr.length,width=Math.min(25,Math.floor((w-23-(len-1)*gap)/len));const total=width*len+gap*(len-1);const start=x-total/2;for(let i=0;i<len;i++){
  const v=arr[i],isNew=highlight&&v!=null&&v!==before[i];const c=v==null?'cell empty':isNew?'cell new':comp?'cell local':'cell';rect(g,start+i*(width+gap),y0,width,24,{class:c,rx:4});txt(g,start+i*(width+gap)+width/2,y0+12.3,v==null?'·':v,isNew?'cell-value new-text':v==null?'cell-value empty-text':'cell-value');
 }}
 if(params.op==='alltoall'){
  valuesRow(t.input,sim.initial[r].send,y-30,true,false);
  valuesRow(t.output,values[r].values,y+25,false,true);
 }else{
  valuesRow(t.data,values[r].values,y+3,false,true);
 }
}
const roundPaths=[];
function curve(a,b,from,to){const dx=b.x-a.x,dy=b.y-a.y;const gap=Math.hypot(dx,dy)||1;const start={x:a.x+dx/gap*(box.w/2+3),y:a.y+dy/gap*(box.h/2+2)},end={x:b.x-dx/gap*(box.w/2+3),y:b.y-dy/gap*(box.h/2+2)};
 const bump=(to-from)%2===0?-23:23;const mx=(start.x+end.x)/2,my=(start.y+end.y)/2;const cx=mx+(-dy/gap)*bump,cy=my+(dx/gap)*bump;
 return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}
function networkRoute(a,b,from,to){if(params.placement==='intra'||serverIndex(from)===serverIndex(to))return curve(a,b,from,to);
 const left=serverIndex(from)===0;
 const sx=left?a.x+box.w/2+5:a.x-box.w/2-5;
 const ex=left?b.x-box.w/2-5:b.x+box.w/2+5;
 const srcRouter=left?539:661,dstRouter=left?661:539;
 return `M ${sx} ${a.y} L ${srcRouter} 334 L 600 334 L ${dstRouter} 334 L ${ex} ${b.y}`;
}
function renderLinks(pos){links.replaceChildren();roundPaths.length=0;if(step>=sim.frames.length)return;
 const packets=sim.frames[step].packets.filter(p=>p.entries.length);
 // Skeleton edges communicate ring/tree topology without adding a second plot.
 if(params.view==='logical' && params.alg==='ring')for(let r=0;r<params.n;r++)path(links,curve(pos[r],pos[(r+1)%params.n],r,(r+1)%params.n),{class:'skeleton'});
 if(params.view==='logical' && params.alg==='tree'){
  for(const edgeGroup of S.stages(params.n))for(const {from,to}of edgeGroup)path(links,curve(pos[from],pos[to],from,to),{class:'skeleton'});
 }
 for(const [i,p]of packets.entries()){
  const d=params.view==='dcn'?networkRoute(pos[p.from],pos[p.to],p.from,p.to):curve(pos[p.from],pos[p.to],p.from,p.to);
  const el=path(links,d,{class:'active-line',stroke:COLORS[p.from],opacity:params.n===8&&packets.length>20?.14:.52,'data-transfer':`${p.from}-${p.to}`});
  roundPaths.push({p,el,i});
 }
}
function buildPackets(){packetLayer.replaceChildren();packetSprites=[];
 if(step>=sim.frames.length)return;
 const count=roundPaths.length;for(const {p,el,i} of roundPaths){
  const g=xlink('g',{class:'packet-token','data-from':p.from,'data-to':p.to},packetLayer);
  const color=COLORS[p.from],entries=p.entries;
  xlink('circle',{cx:0,cy:0,r:count>22?16:20,fill:color,class:'packet-bg'},g);
  const num=entries.length===1?String(entries[0].value):entries.length===0?'·':entries.length>3?`${entries.length}×`:entries.map(x=>x.value).join(',');
  txt(g,0,0,num,'packet-num',{'font-size':num.length>3?10:13});
  g.style.display='none';packetSprites.push({g,path:el,packet:p});
 }
}
function locate(progressValue){for(const item of packetSprites){if(progressValue<=0){item.g.style.display='none';continue;}item.g.style.display='';const length=item.path.getTotalLength();const pos=item.path.getPointAtLength(length*Math.max(0,Math.min(1,progressValue)));item.g.setAttribute('transform',`translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`);}}
function render(){box.h=params.placement==='intra'&&params.alg==='tree'&&params.view==='logical'?104:152;const t=translated();const pos=positions();const values=sim.snapshots[step];const old=sim.snapshots[Math.max(0,step-1)];drawBackdrop(pos);renderLinks(pos);nodes.replaceChildren();for(let r=0;r<params.n;r++)drawGPU(r,pos[r],values,old);buildPackets();locate(progress);
 $('opname').innerHTML=`${sim.options.name} <small>· ${params.alg==='direct'?'Direct':params.alg.charAt(0).toUpperCase()+params.alg.slice(1)}</small>`;
 $('explanation').textContent=t.desc[params.op];$('step-indicator').textContent=`${t.step.toUpperCase()} ${step} / ${sim.frames.length}`;
 $('time-steps').textContent=`${step} / ${sim.frames.length}`;$('timeline').max=String(sim.frames.length);$('timeline').value=String(step);
 if(step>=sim.frames.length){$('active-counter').textContent=t.finished;$('round-heading').textContent=t.finished;$('round-explainer').textContent=t.complete;}
 else{const frame=sim.frames[step];$('active-counter').textContent=`${frame.packets.filter(p=>p.entries.length).length} ${playing?t.sending:t.links}`;
 $('round-heading').textContent=step===0?t.ready:`${t.step} ${step+1}`;
 $('round-explainer').textContent=step===0&&!playing?t.begin:(params.lang==='ko'?frame.ko:frame.label);
 }
 $('play-icon').textContent=playing?'Ⅱ':'▶';$('play-label').textContent=playing?t.pause:t.play;$('canvas-hint').textContent=step>=sim.frames.length?t.complete:t.hint;
 $('prev').disabled=step===0&&!progress;$('next').disabled=step>=sim.frames.length;$('complete').disabled=step>=sim.frames.length;
}
function updateUIForPlaying(){const t=translated();$('play-icon').textContent=playing?'Ⅱ':'▶';$('play-label').textContent=playing?t.pause:t.play;if(step<sim.frames.length){$('round-heading').textContent=sim.frames[step].phase.toUpperCase();$('round-explainer').textContent=params.lang==='ko'?sim.frames[step].ko:sim.frames[step].label;$('active-counter').textContent=`${packetSprites.length} ${t.sending}`;}}
function duration(){return 1900/params.speed;}
function animate(now){if(!playing)return;lastTs=now;progress=Math.max(0,Math.min(1,(now-started)/duration()));locate(progress);
 if(progress>=1){step+=1;progress=0;if(step>=sim.frames.length){stop();render();return;}render();if(autoplay){pending=setTimeout(()=>{pending=0;if(playing){started=performance.now();frameId=requestAnimationFrame(animate);}},260/params.speed);}else{stop();render();}return;}
 frameId=requestAnimationFrame(animate);
}
function begin(auto){if(playing){stop();render();return;}
 if(step>=sim.frames.length){step=0;progress=0;}
 playing=true;autoplay=auto;render();updateUIForPlaying();started=performance.now()-progress*duration();frameId=requestAnimationFrame(animate);
}
function move(to){stop();progress=0;step=Math.max(0,Math.min(sim.frames.length,to));render();}
function toggleLang(){params.lang=params.lang==='en'?'ko':'en';applyControls();render();}
$('play').addEventListener('click',()=>{if(playing){stop();render();}else begin(true);});
$('next').addEventListener('click',()=>{if(step<sim.frames.length){stop();begin(false);}});
$('prev').addEventListener('click',()=>move(step-1));$('reset').addEventListener('click',()=>move(0));$('complete').addEventListener('click',()=>move(sim.frames.length));
$('timeline').addEventListener('input',e=>move(Number(e.target.value)));
$('operation').addEventListener('change',e=>{params.op=e.target.value;params.alg=S.OPS[params.op].algs[0];rebuild();});
$('algorithm').addEventListener('change',e=>{params.alg=e.target.value;rebuild();});$('speed').addEventListener('change',e=>{params.speed=Number(e.target.value);rebuild();});
document.querySelectorAll('[data-n]').forEach(el=>el.addEventListener('click',()=>{params.n=Number(el.dataset.n);rebuild();}));
document.querySelectorAll('[data-placement]').forEach(el=>el.addEventListener('click',()=>{params.placement=el.dataset.placement;rebuild();}));
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{params.view=el.dataset.view;rebuild();}));
$('language').addEventListener('click',toggleLang);
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('toast').textContent=translated().copied;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1400);}catch(e){window.prompt('Copy URL',location.href);}});
window.addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();$('play').click();}else if(e.code==='ArrowRight')$('next').click();else if(e.code==='ArrowLeft')$('prev').click();});
rebuild();
// Only used for browser-level regression checks; no UI dependence.
window.__collectiveDebug=()=>({step,playing,progress,particles:packetSprites.length,visible:packetSprites.filter(x=>x.g.style.display!=='none').length,final:S.validate(sim),n:params.n,op:params.op});
})();