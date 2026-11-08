/* CollectiveScope — deliberately simplified, deterministic teaching schedules.
   Not a reproduction of NCCL's runtime/channel/protocol choices. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CollectiveCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const OPTIONS = {
    allreduce: ['ring', 'tree', 'direct'],
    allgather: ['ring', 'direct'],
    reducescatter: ['ring', 'direct'],
    alltoall: ['pairwise', 'direct'],
    broadcast: ['tree', 'direct'],
    reduce: ['tree', 'direct'],
    gather: ['tree', 'direct'],
    scatter: ['tree', 'direct'],
  };
  const mod = (i, n) => ((i % n) + n) % n;
  const names = {
    allreduce: { en: 'AllReduce', ko: 'AllReduce' },
    allgather: { en: 'AllGather', ko: 'AllGather' },
    reducescatter: { en: 'ReduceScatter', ko: 'ReduceScatter' },
    alltoall: { en: 'AllToAll', ko: 'AllToAll' },
    broadcast: { en: 'Broadcast', ko: 'Broadcast' },
    reduce: { en: 'Reduce', ko: 'Reduce' },
    gather: { en: 'Gather', ko: 'Gather' },
    scatter: { en: 'Scatter', ko: 'Scatter' },
  };
  const descriptions = {
    allreduce: { en: 'Every rank receives a reduction of all input vectors.', ko: '모든 Rank가 전체 입력 벡터의 Reduce 결과를 받습니다.' },
    allgather: { en: 'Every rank collects one distinct chunk from each rank.', ko: '모든 Rank가 각 Rank의 고유 청크를 모읍니다.' },
    reducescatter: { en: 'Reduce all vectors, then partition the result among ranks.', ko: '모든 벡터를 합산한 뒤 결과를 Rank별로 나눕니다.' },
    alltoall: { en: 'Every rank sends a different chunk to every destination.', ko: '각 Rank가 목적지별로 다른 청크를 교환합니다.' },
    broadcast: { en: 'A root distributes its buffer to every rank.', ko: 'Root가 자신의 데이터를 모든 Rank에 배포합니다.' },
    reduce: { en: 'All rank values are combined at one root.', ko: '모든 Rank의 값을 Root로 모아 합칩니다.' },
    gather: { en: 'A root collects a distinct chunk from each rank.', ko: 'Root가 각 Rank의 고유 청크를 수집합니다.' },
    scatter: { en: 'A root distributes a distinct chunk to each rank.', ko: 'Root가 각 Rank에 서로 다른 청크를 배포합니다.' },
  };
  function treeFor(n, rootRank) {
    const order = [rootRank, ...Array.from({length:n},(_,i)=>i).filter(i=>i!==rootRank)];
    const byDepth = [];
    for (let i=1; i<n; i++) {
      const parentIdx = Math.floor((i - 1)/2), depth = Math.floor(Math.log2(i+1));
      (byDepth[depth] ||= []).push({from:order[parentIdx], to:order[i], subtree:subtreeAt(i,n,order)});
    }
    return byDepth.filter(Boolean);
  }
  function subtreeAt(index,n,order) {
    const out=[];
    function visit(i){if(i>=n)return;out.push(order[i]);visit(i*2+1);visit(i*2+2)}
    visit(index);return out;
  }
  function build(input) {
    const op = OPTIONS[input.op] ? input.op : 'allreduce';
    const n = [4,8].includes(Number(input.n)) ? Number(input.n) : 4;
    const alg = OPTIONS[op].includes(input.alg) ? input.alg : OPTIONS[op][0];
    const root = Math.min(n-1, Math.max(0, Number(input.root)||0));
    const steps = [];
    const rank = Array.from({length:n},(_,i)=>i);
    const e = (from,to,chunk,kind,units=1)=>({from,to,chunk,kind,units});
    const add = (phaseEn,phaseKo,summaryEn,summaryKo,events,detailEn='',detailKo='') => {
      steps.push({phase:{en:phaseEn,ko:phaseKo},summary:{en:summaryEn,ko:summaryKo},detail:{en:detailEn,ko:detailKo},events});
    };
    const all = r=>rank.filter(i=>i!==r);
    const sendAll = (sender,dest,kind='transfer')=>e(sender,dest,'FULL',kind,n);
    const tree = treeFor(n,root);
    if (op==='allreduce' && alg==='ring' || op==='reducescatter' && alg==='ring') {
      for (let s=0;s<n-1;s++) {
        add('Reduce-scatter', 'Reduce-scatter', `Ring reduction · round ${s+1}/${n-1}`, `Ring Reduce · ${s+1}/${n-1} 라운드`,
          rank.map(i=>e(i,(i+1)%n,`C${mod(i-1-s,n)}`,'reduce')),
          'Each receiver accumulates the incoming partial chunk. After the final round, rank i owns reduced chunk Ci.',
          '수신 Rank가 받은 부분 청크를 누적합니다. 마지막 라운드 후 Rank i는 합산된 Ci를 가집니다.');
      }
      if (op==='allreduce') {
        for (let s=0;s<n-1;s++) {
          add('All-gather', 'All-gather', `Ring distribution · round ${s+1}/${n-1}`, `Ring 분배 · ${s+1}/${n-1} 라운드`,
            rank.map(i=>e(i,(i+1)%n,`C${mod(i-s,n)}`,'gather')),
            'The fully reduced chunks circulate until all ranks hold the whole reduced vector.',
            '합산이 끝난 청크를 순환시키며 모든 Rank가 전체 결과를 갖게 합니다.');
        }
      }
    } else if (op==='allreduce' && alg==='tree' || op==='reduce' && alg==='tree') {
      for(let d=tree.length-1;d>=0;d--){
        add('Tree reduction','Tree Reduce',`Reduce level ${tree.length-d}/${tree.length}`,`트리 Reduce · ${tree.length-d}/${tree.length} 단계`,
          tree[d].map(x=>sendAll(x.to,x.from,'reduce')),
          'Children send combined vectors upward. Both children may reach one parent in the same round.',
          '자식의 합산 벡터가 부모로 전송됩니다. 같은 부모에 두 전송이 집중될 수 있습니다.');
      }
      if(op==='allreduce') for(let d=0;d<tree.length;d++){
        add('Tree broadcast','Tree Broadcast',`Broadcast level ${d+1}/${tree.length}`,`트리 Broadcast · ${d+1}/${tree.length} 단계`,
          tree[d].map(x=>sendAll(x.from,x.to,'broadcast')),
          'The root result propagates to its descendants.','Root의 합산 결과가 자식들에게 전파됩니다.');
      }
    } else if (op==='allreduce' && alg==='direct' || op==='reduce' && alg==='direct') {
      add('Root reduction','Root Reduce','Send inputs to the root','전체 벡터를 Root로 전송',all(root).map(i=>sendAll(i,root,'reduce')),
        'A simplified centralized alternative; not an NCCL algorithm guarantee.','중앙집중식 교육용 대안으로 NCCL 실행을 재현하지 않습니다.');
      if(op==='allreduce')add('Root distribution','Root 분배','Send reduced vector to all ranks','합산 결과를 모든 Rank에 전송',all(root).map(i=>sendAll(root,i,'broadcast')));
    } else if(op==='allgather') {
      if(alg==='ring')for(let s=0;s<n-1;s++){
        add('Ring all-gather','Ring All-gather',`Circulate gathered chunks · round ${s+1}/${n-1}`,`청크 순환 · ${s+1}/${n-1} 라운드`,
          rank.map(i=>e(i,(i+1)%n,`C${mod(i-s,n)}`,'gather')),
          'Each rank forwards a chunk it already holds to its next neighbor.','각 Rank가 보유한 청크를 다음 이웃에게 전달합니다.');
      } else {
        add('Direct all-gather','Direct All-gather','Exchange every rank’s chunk','각 Rank의 청크를 서로 교환',rank.flatMap(i=>all(i).map(j=>e(i,j,`C${i}`,'gather'))),
          'All transfers are grouped into one conceptual round, not one guaranteed NIC time slot.',
          '한 개념적 단계에 전송을 묶었으며 실제 NIC에서 동시에 실행됨을 뜻하지 않습니다.');
      }
    } else if(op==='reducescatter' && alg==='direct'){
      add('Root reduction','Root Reduce','Collect full vectors at the root','전체 벡터를 Root로 전송',all(root).map(i=>sendAll(i,root,'reduce')));
      add('Scatter results','결과 분배','Distribute reduced chunks','합산된 청크를 나눠 전송',all(root).map(i=>e(root,i,`C${i}`,'scatter')));
    } else if(op==='alltoall') {
      if(alg==='pairwise') for(let s=1;s<n;s++) {
        add('Pairwise exchange','Pairwise 교환',`Destination offset +${s} · round ${s}/${n-1}`,`목적지 Offset +${s} · ${s}/${n-1} 라운드`,
          rank.map(i=>e(i,(i+s)%n,`${i}→${(i+s)%n}`,'exchange')),
          'Every rank sends one destination-specific chunk; self-destined chunks stay local.',
          '각 Rank는 목적지별 청크 하나를 전송하고 자기 목적지 청크는 로컬에 둡니다.');
      } else {
        add('Direct exchange','Direct 교환','Show all rank-to-rank transfers','전체 Rank 간 교환 표시',rank.flatMap(i=>all(i).map(j=>e(i,j,`${i}→${j}`,'exchange'))),
          'Transfers are grouped conceptually; this is not a claim of simultaneous physical sends.',
          '개념적으로 묶은 전송이며 실제 동시 전송을 의미하지 않습니다.');
      }
    } else if(op==='broadcast'){
      if(alg==='tree')for(let d=0;d<tree.length;d++){
        add('Tree broadcast','Tree Broadcast',`Distribute level ${d+1}/${tree.length}`,`트리 전파 · ${d+1}/${tree.length} 단계`,tree[d].map(x=>e(x.from,x.to,'ROOT','broadcast')),
          'Only ranks already holding the root buffer send in the next round.',
          '이미 Root 데이터를 받은 Rank만 다음 라운드에 전송합니다.');
      } else add('Direct broadcast','Direct Broadcast','Root sends to all peers','Root가 모든 Rank에 전송',all(root).map(i=>e(root,i,'ROOT','broadcast')));
    } else if(op==='gather'){
      if(alg==='tree')for(let d=tree.length-1;d>=0;d--){
        add('Tree gather','Tree Gather',`Collect subtrees · level ${tree.length-d}/${tree.length}`,`서브트리 수집 · ${tree.length-d}/${tree.length} 단계`,
          tree[d].map(x=>e(x.to,x.from,x.subtree.map(i=>`C${i}`).join(','),'gather',x.subtree.length)),
          'Each parent receives a bundle representing data from the child subtree.',
          '부모가 자식 서브트리에서 모은 청크 묶음을 받습니다.');
      } else add('Direct gather','Direct Gather','Send unique chunks to root','고유 청크를 Root에 모으기',all(root).map(i=>e(i,root,`C${i}`,'gather')));
    } else if(op==='scatter'){
      if(alg==='tree')for(let d=0;d<tree.length;d++){
        add('Tree scatter','Tree Scatter',`Distribute subtree chunks · level ${d+1}/${tree.length}`,`서브트리 분배 · ${d+1}/${tree.length} 단계`,
          tree[d].map(x=>e(x.from,x.to,x.subtree.map(i=>`C${i}`).join(','),'scatter',x.subtree.length)),
          'Each parent forwards only the chunks destined for the child subtree.',
          '부모가 자식 서브트리에 속한 Rank들의 청크만 전송합니다.');
      } else add('Direct scatter','Direct Scatter','Root sends destination chunks','Root가 목적지별 청크 전송',all(root).map(i=>e(root,i,`C${i}`,'scatter')));
    }
    return {op,alg,n,root,steps,packetCount:steps.reduce((a,s)=>a+s.events.length,0),units:steps.reduce((a,s)=>a+s.events.reduce((b,x)=>b+x.units,0),0)};
  }
  function route(event, topology, n) {
    const racks=topology==='single'?1:topology==='dual'?2:4;
    const gpuRack = i=>Math.min(racks-1,Math.floor(i*racks/n));
    const a=gpuRack(event.from),b=gpuRack(event.to);
    const output=[`gpu${event.from}`,`tor${a}`];
    if(a!==b){
      const spine=((event.from*17+event.to*31)%2);
      output.push(`spine${spine}`,`tor${b}`);
    }
    output.push(`gpu${event.to}`);
    return output;
  }
  function loadMap(step,topology,n) {
    const links={};
    for(const event of step?.events||[]){
      const path=route(event,topology,n);
      for(let k=0;k<path.length-1;k++){
        const a=path[k],b=path[k+1],key=[a,b].sort().join('|');
        (links[key] ||= {a,b,units:0,messages:0}).units+=event.units;
        links[key].messages++;
      }
    }
    return links;
  }
  return { OPTIONS, names, descriptions, build, route, loadMap, treeFor };
});