// Educational model-based accounting, not NCCL runtime measurements.
export const serverOf=(rank,G,placement)=>placement==='intra'?0:Math.floor(rank/Math.ceil(G/2));
export const chunkCount=(t,C)=>t.ci===-1?C:1;

export function summarize(steps,G,C,placement='inter',chunkMiB=1){
  const rounds=(steps||[]).map((step,index)=>{
    const matrix=Array.from({length:G},()=>Array(G).fill(0));
    const ranks=Array.from({length:G},(_,rank)=>({rank,tx:0,rx:0,networkTx:0,networkRx:0,server:serverOf(rank,G,placement)}));
    const servers=Array.from({length:placement==='intra'?1:2},(_,id)=>({id,tx:0,rx:0,networkTx:0,networkRx:0}));
    let allMiB=0,interMiB=0,intraMiB=0,messages=0;
    for(const t of step.t||[]){
      if(t.src===t.dst)continue;
      const volume=chunkMiB*chunkCount(t,C),src=serverOf(t.src,G,placement),dst=serverOf(t.dst,G,placement);
      const cross=src!==dst;
      matrix[t.src][t.dst]+=volume;
      ranks[t.src].tx+=volume;ranks[t.dst].rx+=volume;
      servers[src].tx+=volume;servers[dst].rx+=volume;
      allMiB+=volume;messages++;
      if(cross){interMiB+=volume;ranks[t.src].networkTx+=volume;ranks[t.dst].networkRx+=volume;servers[src].networkTx+=volume;servers[dst].networkRx+=volume;}
      else intraMiB+=volume;
    }
    const peakNicMiB=Math.max(0,...servers.flatMap(s=>[s.networkTx,s.networkRx]));
    return {index,label:step.ph||'Transfer',messages,matrix,ranks,servers,allMiB,interMiB,intraMiB,peakNicMiB};
  });
  const matrix=Array.from({length:G},()=>Array(G).fill(0));
  const ranks=Array.from({length:G},(_,rank)=>({rank,tx:0,rx:0,networkTx:0,networkRx:0,server:serverOf(rank,G,placement)}));
  const servers=Array.from({length:placement==='intra'?1:2},(_,id)=>({id,tx:0,rx:0,networkTx:0,networkRx:0}));
  const total={messages:0,allMiB:0,interMiB:0,intraMiB:0};
  for(const r of rounds){
    for(const name of Object.keys(total))total[name]+=r[name];
    for(let i=0;i<G;i++){
      for(let j=0;j<G;j++)matrix[i][j]+=r.matrix[i][j];
      for(const key of ['tx','rx','networkTx','networkRx'])ranks[i][key]+=r.ranks[i][key];
    }
    servers.forEach((s,i)=>{for(const key of ['tx','rx','networkTx','networkRx'])s[key]+=r.servers[i][key];});
  }
  const whole={index:-1,label:'Full collective',matrix,ranks,servers,...total,peakNicMiB:Math.max(0,...rounds.map(r=>r.peakNicMiB))};
  return {rounds,whole};
}
// A line-rate lower bound for idealized one-direction NIC serialization only.
export function nicSerializationFloorMs(rounds,bandwidthGbps){
  if(!(bandwidthGbps>0))return null;
  const peakSumMiB=rounds.reduce((sum,r)=>sum+r.peakNicMiB,0);
  return peakSumMiB*(8*1024*1024/1e9)/bandwidthGbps*1000;
}
export function makeTransferCSV(steps,G,C,placement,chunkMiB){
  const rows=[['step','phase','source_gpu','destination_gpu','source_server','destination_server','path_type','source_chunk','destination_chunk','payload_mib']];
  (steps||[]).forEach((step,index)=>(step.t||[]).forEach(t=>{
    if(t.src===t.dst)return;
    const srcServer=serverOf(t.src,G,placement),dstServer=serverOf(t.dst,G,placement);
    rows.push([index+1,step.ph||'',t.src,t.dst,srcServer,dstServer,srcServer===dstServer?'intra-server':'inter-server',t.ci_src!==undefined?t.ci_src:t.ci,t.ci_dst!==undefined?t.ci_dst:t.ci,chunkMiB*chunkCount(t,C)]);
  }));
  const escape=value=>'"'+String(value).replaceAll('"','""')+'"';
  return rows.map(r=>r.map(escape).join(',')).join('\n')+'\n';
}