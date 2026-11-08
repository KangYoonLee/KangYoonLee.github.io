// Educational model-based accounting, not NCCL runtime measurements.
export const serverOf=(rank,G,placement)=>placement==='intra'?0:Math.floor(rank/Math.ceil(G/2));
export const chunkCount=(t,C)=>t.ci===-1?C:1;

export function summarize(steps,G,C,placement='inter',chunkMiB=1,weightForTransfer=null){
  const rounds=(steps||[]).map((step,index)=>{
    const matrix=Array.from({length:G},()=>Array(G).fill(0));
    const ranks=Array.from({length:G},(_,rank)=>({rank,tx:0,rx:0,networkTx:0,networkRx:0,server:serverOf(rank,G,placement)}));
    const servers=Array.from({length:placement==='intra'?1:2},(_,id)=>({id,tx:0,rx:0,networkTx:0,networkRx:0}));
    let allMiB=0,interMiB=0,intraMiB=0,messages=0;
    for(const [transferIndex,t] of (step.t||[]).entries()){
      if(t.src===t.dst)continue;
      const fraction=weightForTransfer?Math.max(0,Math.min(1,weightForTransfer(index,transferIndex,step.t.length))):1;
      const volume=chunkMiB*chunkCount(t,C)*fraction,src=serverOf(t.src,G,placement),dst=serverOf(t.dst,G,placement);
      const cross=src!==dst;
      matrix[t.src][t.dst]+=volume;
      ranks[t.src].tx+=volume;ranks[t.dst].rx+=volume;
      servers[src].tx+=volume;servers[dst].rx+=volume;
      allMiB+=volume;if(fraction>=1-1e-9)messages++;
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

/*
 * Estimates animated volume only. A floating value of 0.5 means a marker
 * traversed half its idealized route; it is NOT a wire byte counter.
 * The Physical view follows the existing per-transfer stagger in dcn.js.
 * The Logical AllToAll view follows the upstream marker stagger.
 */
export function animationFraction(anim,index,count,view='physical',allToAll=false){
  const v=Math.max(0,Math.min(1,Number(anim)||0));
  if(v===1)return 1;
  if(count<=1)return v;
  let stagger=0;
  if(view==='physical')stagger=Math.min(.06,.42/Math.max(1,count-1));
  else if(allToAll)stagger=Math.min(.08,.5/Math.max(1,count-1));
  if(!stagger)return v;
  const travel=Math.max(.1,1-(count-1)*stagger);
  return Math.max(0,Math.min(1,(v-index*stagger)/travel));
}

export function summarizeProgress(steps,G,C,placement,chunkMiB,curStep,anim,phase,view='physical',scope='step'){
  const count=steps.length;
  const selected=count?Math.max(0,Math.min(count-1,curStep<0?0:curStep)):0;
  const weights=(round,ti,length)=>{
    if(scope!=='whole'&&round!==selected)return 0;
    if(phase==='done')return 1;
    if(phase==='idle'||curStep<0)return 0;
    if(round<curStep)return 1;
    if(round>curStep)return 0;
    const allToAll=Boolean(steps[round]?.t?.[0]?.ci_src!==undefined);
    return animationFraction(anim,ti,length,view,allToAll);
  };
  return summarize(steps,G,C,placement,chunkMiB,weights).whole;
}

/*
 * The animation engine advances curStep to the NEXT round at a step boundary.
 * A paused, zero-animation boundary must instead show the last completed round,
 * and completed rounds can always be reviewed from their saved stepLog indices.
 */
export function resolveLensDisplay(stepCount,curStep,phase,anim,completedSteps=[],manualStep=null){
  const clamp=n=>Math.max(0,Math.min(Math.max(0,stepCount-1),n));
  const completed=completedSteps.filter(n=>Number.isInteger(n)&&n>=0&&n<stepCount);
  const recent=completed.length?completed[completed.length-1]:null;
  const review=manualStep!==null&&completed.includes(manualStep);
  if(review)return {index:manualStep,isCompleted:true,isManual:true};
  if(phase==='done'&&recent!==null)return {index:recent,isCompleted:true,isManual:false};
  if(phase==='paused'&&Number(anim)===0&&recent!==null&&curStep===recent+1){
    return {index:recent,isCompleted:true,isManual:false};
  }
  return {index:clamp(curStep<0?0:curStep),isCompleted:false,isManual:false};
}
