/* CollectiveScope v3 — original deterministic teaching model, not NCCL tracing. */
(function(root, factory){const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CollectiveSim=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';
const OPS={
 alltoall:{name:'AllToAll',algs:['pairwise','direct'],desc:'Each GPU has a different numbered value for every destination.',ko:'각 GPU가 목적지별로 서로 다른 숫자 데이터를 전송합니다.'},
 allreduce:{name:'AllReduce',algs:['ring','tree','direct'],desc:'Sum every GPU’s contribution, then give the result to every GPU.',ko:'모든 GPU의 값을 합산하고 그 결과를 모든 GPU에 전달합니다.'},
 allgather:{name:'AllGather',algs:['ring'],desc:'Every GPU collects the unique value owned by every other GPU.',ko:'모든 GPU가 다른 GPU의 고유 데이터를 모읍니다.'},
 reducescatter:{name:'ReduceScatter',algs:['ring','direct'],desc:'Sum matching chunks, then leave one reduced chunk at each GPU.',ko:'청크별 합계를 계산하고 GPU마다 합산된 청크 하나를 남깁니다.'},
 broadcast:{name:'Broadcast',algs:['tree','direct'],desc:'GPU 0 sends the same value to all other GPUs.',ko:'GPU 0이 같은 값을 모든 GPU로 배포합니다.'},
 reduce:{name:'Reduce',algs:['tree','direct'],desc:'All GPUs contribute values; GPU 0 receives the sum.',ko:'모든 GPU가 값을 보내고 GPU 0이 합계를 받습니다.'},
 gather:{name:'Gather',algs:['tree','direct'],desc:'GPU 0 collects one unique value from each GPU.',ko:'GPU 0이 각 GPU의 고유 값을 모읍니다.'},
 scatter:{name:'Scatter',algs:['tree','direct'],desc:'GPU 0 starts with all values and distributes one to each GPU.',ko:'GPU 0이 모든 데이터를 가지고 시작하여 GPU별로 하나씩 나눠줍니다.'}
};
const mod=(x,n)=>(x%n+n)%n;
const pairs=n=>Array.from({length:n},(_,i)=>i);
const evt=(from,to,indices,kind)=>({from,to,indices:Array.isArray(indices)?indices:[indices],kind});
// Binomial tree: child -> parent in reverse stages, then parent -> child for broadcast.
function stages(n){const rounds=[];for(let s=0;(1<<s)<n;s++){const stride=1<<s;const edges=[];for(let p=0;p<n;p+=2*stride)if(p+stride<n)edges.push({from:p,to:p+stride});rounds.push(edges);}return rounds;}
function makeSchedule(op,alg,n){const result=[];const ranks=pairs(n);const tree=stages(n);
 const add=(phase,events,label,ko)=>result.push({phase,events,label,ko});
 if(op==='alltoall'){
  if(alg==='pairwise')for(let s=1;s<n;s++)add('exchange',ranks.map(r=>evt(r,(r+s)%n,(r+s)%n,'copy')),`Every GPU sends to the next destination (+${s}).`,`모든 GPU가 목적지 +${s}로 동시에 보냅니다.`);
  else add('exchange',ranks.flatMap(r=>ranks.filter(t=>t!==r).map(t=>evt(r,t,t,'copy'))),'All GPU pairs exchange personalized data (conceptual simultaneous round).','모든 GPU 쌍이 목적지별 데이터를 동시에 교환합니다 (개념적 단계).');
 }else if(op==='allgather'){
  for(let s=0;s<n-1;s++)add('allgather',ranks.map(r=>evt(r,(r+1)%n,mod(r-s,n),'copy')),`Each GPU forwards one value around the ring (${s+1}/${n-1}).`,`각 GPU가 Ring을 따라 청크 하나를 전달합니다 (${s+1}/${n-1}).`);
 }else if(op==='reducescatter'||(op==='allreduce'&&alg==='ring')){
  if(alg==='direct'){
   add('reduce',ranks.filter(r=>r!==0).map(r=>evt(r,0,ranks,'sum')),'All GPUs send their vectors to GPU 0.','모든 GPU가 자신의 벡터를 GPU 0으로 보냅니다.');
   add('scatter',ranks.filter(r=>r!==0).map(r=>evt(0,r,r,'set')),'GPU 0 distributes each reduced chunk.','GPU 0이 합산한 청크를 각 GPU에 나눠줍니다.');
  }else{
   for(let s=0;s<n-1;s++)add('reduce-scatter',ranks.map(r=>evt(r,(r+1)%n,mod(r-s-1,n),'sum')),`Each GPU sends and adds one partial sum (${s+1}/${n-1}).`,`모든 GPU가 부분합 하나를 보내고 수신 GPU가 더합니다 (${s+1}/${n-1}).`);
   if(op==='allreduce')for(let s=0;s<n-1;s++)add('allgather',ranks.map(r=>evt(r,(r+1)%n,mod(r-s,n),'set')),`Finished sums circulate to every GPU (${s+1}/${n-1}).`,`완성된 합계가 모든 GPU로 순환합니다 (${s+1}/${n-1}).`);
  }
 }else if((op==='allreduce'&&alg!=='ring')||op==='reduce'){
  if(alg==='tree'){
   for(let s=0;s<tree.length;s++)add('reduce',tree[s].map(e=>evt(e.to,e.from,0,'sum')),`Tree reduce: combine values at level ${s+1}.`,`Tree Reduce: ${s+1}단계에서 합산합니다.`);
   if(op==='allreduce')for(let s=tree.length-1;s>=0;s--)add('broadcast',tree[s].map(e=>evt(e.from,e.to,0,'set')),`Tree broadcast: share total at level ${s+1}.`,`Tree Broadcast: ${s+1}단계에서 합계를 전파합니다.`);
  }else{
   add('reduce',ranks.slice(1).map(r=>evt(r,0,0,'sum')),'All GPUs send their values to GPU 0.','모든 GPU가 GPU 0으로 값을 보냅니다.');
   if(op==='allreduce')add('broadcast',ranks.slice(1).map(r=>evt(0,r,0,'set')),'GPU 0 sends the sum to all others.','GPU 0이 합계를 전체 GPU에 배포합니다.');
  }
 }else if(op==='broadcast'){
  if(alg==='tree')for(let s=tree.length-1;s>=0;s--)add('broadcast',tree[s].map(e=>evt(e.from,e.to,0,'set')),`Tree broadcast · level ${s+1}.`,`Tree Broadcast · ${s+1}단계.`);
  else add('broadcast',ranks.slice(1).map(r=>evt(0,r,0,'set')),'GPU 0 broadcasts to every peer.','GPU 0이 모든 GPU에 데이터를 보냅니다.');
 }else if(op==='gather'){
  if(alg==='tree')for(let s=0;s<tree.length;s++)add('gather',tree[s].map(e=>evt(e.to,e.from,ranks,'merge')),`Tree gather: combine subtree data at level ${tree.length-s}.`,`Tree Gather: ${tree.length-s}단계에서 서브트리 데이터를 모읍니다.`);
  else add('gather',ranks.slice(1).map(r=>evt(r,0,r,'merge')),'Every GPU sends its value to GPU 0.','각 GPU가 자기 값을 GPU 0으로 보냅니다.');
 }else if(op==='scatter'){
  if(alg==='tree')for(let s=tree.length-1;s>=0;s--)add('scatter',tree[s].map(e=>evt(e.from,e.to,subtreeRanks(e.to,n),'merge')),`Tree scatter: forward destination chunks at level ${s+1}.`,`Tree Scatter: ${s+1}단계에서 목적지 청크를 전달합니다.`);
  else add('scatter',ranks.slice(1).map(r=>evt(0,r,r,'merge')),'GPU 0 sends each GPU its own value.','GPU 0이 GPU별 데이터를 나눠서 보냅니다.');
 }
 return result;
}
// Edges are binomial: parent p sends to p+2^s; descendant ranks are those reached below this node.
function subtreeRanks(start,n){ // Subtree for binomial broadcast tree; descendants have p as bit-cleared ancestor.
 const seen=new Set([start]);for(let s=Math.ceil(Math.log2(n))-1;s>=0;s--){for(const p of [...seen]){const to=p+(1<<s);if((p%(2*(1<<s)))===0&&to<n)seen.add(to);}}return [...seen].sort((a,b)=>a-b);
}
// For scatter we instead send all chunks known by sender which belong to the target's binomial subtree.
function init(op,n,alg){const data=[];for(let r=0;r<n;r++){
 if(op==='alltoall')data.push({send:ranksValues(r,n),values:Array.from({length:n},(_,k)=>k===r?r*n+r+1:null)});
 else if(op==='allgather'||op==='gather')data.push({values:Array.from({length:n},(_,k)=>k===r?r+1:null)});
 else if(op==='scatter')data.push({values:r===0?Array.from({length:n},(_,k)=>k+1):Array(n).fill(null)});
 else if(op==='broadcast')data.push({values:[r===0?42:null]});
 else if(op==='reduce'||(op==='allreduce'&&alg!=='ring'))data.push({values:[r+1]});
 else data.push({values:Array.from({length:n},()=>r+1)});
 }return data;}
function ranksValues(r,n){return Array.from({length:n},(_,d)=>r*n+d+1);}
const clone=d=>d.map(x=>({values:x.values.slice(),...(x.send?{send:x.send.slice()}:{})}));
function build(input){const op=OPS[input.op]?input.op:'alltoall';const n=input.n===8?8:4;const alg=OPS[op].algs.includes(input.alg)?input.alg:OPS[op].algs[0];const schedule=makeSchedule(op,alg,n);
 let state=init(op,n,alg);const frames=[];const snapshots=[clone(state)];
 for(const step of schedule){
  const before=clone(state), after=clone(state);
  const packets=step.events.map(event=>{
   const source=before[event.from];
   let entries=[];
   if(op==='alltoall')entries=[{index:event.from,value:source.send[event.to]}];
   else if(op==='gather'||op==='scatter')entries=event.indices.filter(k=>source.values[k]!==null).map(k=>({index:k,value:source.values[k]}));
   else entries=event.indices.filter(k=>source.values[k]!==null).map(k=>({index:k,value:source.values[k]}));
   return {...event,entries,valueLabel:entries.length===1?String(entries[0].value):entries.length>1?entries.map(e=>e.value).join(','):'—'};
  });
  for(const packet of packets){const dest=after[packet.to];
   for(const {index,value} of packet.entries){
    if(op==='alltoall')dest.values[index]=value;
    else if(packet.kind==='sum')dest.values[index]=(dest.values[index]||0)+value;
    else dest.values[index]=value;
   }
  }
  state=after;frames.push({...step,packets,before,after:clone(after)});snapshots.push(clone(after));
 }
 return {op,n,alg,frames,snapshots,initial:snapshots[0],final:snapshots.at(-1),options:OPS[op]};
}
function validate(sim){const {n,op,final}=sim;const sum=n*(n+1)/2;const fail=(r,msg)=>{throw Error(`${op}/${sim.alg}/${n} gpu${r}: ${msg}`)};
 for(let r=0;r<n;r++){
  const a=final[r].values;
  if(op==='alltoall'){if(a.length!==n||a.some((v,s)=>v!==s*n+r+1))fail(r,'alltoall mismatch');}
  else if(op==='allgather'||op==='gather'&&r===0){if(a.length!==n||a.some((v,i)=>v!==i+1))fail(r,'gather mismatch');}
  else if(op==='allreduce'){if(a.length===(sim.alg==='ring'?n:1)&&a.every(v=>v===sum)){}else fail(r,'allreduce mismatch');}
  else if(op==='reducescatter'){if(a[r]!==sum)fail(r,'reducescatter mismatch');}
  else if(op==='broadcast'&&a[0]!==42)fail(r,'broadcast mismatch');
  else if(op==='reduce'&&r===0&&a[0]!==sum)fail(r,'reduce mismatch');
  else if(op==='scatter'&&a[r]!==r+1)fail(r,'scatter mismatch');
 }return true;
}
return {OPS,build,validate,makeSchedule,stages};
});