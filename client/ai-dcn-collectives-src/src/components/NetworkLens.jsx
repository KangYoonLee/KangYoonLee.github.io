import React,{useEffect,useMemo,useState} from 'react';
import {summarize,summarizeProgress,resolveLensDisplay,nicSerializationFloorMs,makeTransferCSV} from '../engine/insights.mjs';

const T={
 en:{title:'Network Lens',subtitle:'Model-derived — not measured',scope:'Traffic interval',step:'Current round',whole:'Full collective',payload:'Payload per chunk',bandwidth:'NIC line rate',logical:'Logical payload',inter:'Inter-server payload',intra:'Intra-server payload',messages:'Transfers',ranks:'Per-GPU traffic',matrix:'GPU-to-GPU traffic matrix',links:'Modeled NIC demand',floor:'Idealized serialization floor',no:'No inter-server NIC traffic in this scenario.',export:'Export transfer schedule (CSV)',note:'Teaching assumptions: equal payload per chunk, concurrent sends within each logical round. Excludes packet headers, transport overhead, retransmissions, real NCCL channel/protocol selection, and queue contention.',floorNote:'Lower bound = busiest modeled NIC-direction bytes divided by selected line rate; for a full collective, round bounds are summed. Not a prediction of NCCL duration.',tx:'TX',rx:'RX',server:'Server',route:'Same-server transfers use GPU fabric; cross-server transfers use a NIC. Actual hardware routing varies.',preview:'First round preview',eyebrow:'AI DCN / MODEL INSPECTOR'},
 ko:{title:'네트워크 분석',subtitle:'실제 측정이 아닌 모델 기반 추정',scope:'집계 범위',step:'현재 라운드',whole:'전체 Collective',payload:'청크당 페이로드',bandwidth:'NIC 링크 속도',logical:'논리 전송량',inter:'서버 간 전송량',intra:'서버 내부 전송량',messages:'전송 횟수',ranks:'GPU별 송수신',matrix:'GPU 간 트래픽 행렬',links:'NIC 송수신량 모델',floor:'이상적 직렬화 시간 하한',no:'이 구성에서는 서버 간 NIC 전송이 없습니다.',export:'전송 스케줄 CSV 내보내기',note:'교육용 가정: 청크 크기가 모두 같고 같은 라운드의 전송은 동시에 시작합니다. 헤더, 전송 오버헤드, 재전송, 실제 NCCL 채널·프로토콜 선택 및 큐 경합은 반영되지 않습니다.',floorNote:'이론적 하한 = 최대 NIC 방향별 바이트 ÷ 선택한 링크 속도. 전체 Collective에서는 라운드별 하한을 합산합니다. 실제 NCCL 실행시간 예측은 아닙니다.',tx:'송신',rx:'수신',server:'서버',route:'서버 내부 통신은 GPU 패브릭, 서버 간 통신은 NIC로 분류합니다. 실제 하드웨어 경로는 달라질 수 있습니다.',preview:'첫 라운드 미리보기',eyebrow:'AI DCN / 모델 분석'}
};
function fmt(n){return Number(n.toFixed(2)).toString();}
function volume(n){if(n>=1024)return fmt(n/1024)+' GiB';return fmt(n)+' MiB';}
function Stat({label,value}){return <div className="cs-stat"><span>{label}</span><strong>{value}</strong></div>;}

export default function NetworkLens({stateRef,lang}){
 const s=stateRef.current;
 const [payload,setPayload]=useState(1),[rate,setRate]=useState(100),[scope,setScope]=useState('step');
 const [reviewStep,setReviewStep]=useState(null);
 useEffect(()=>setReviewStep(null),[s.steps]);
 const [,setFrame]=useState(0);
 useEffect(()=>{
   const onFrame=()=>setFrame(n=>n+1);
   stateRef.onLensFrame=onFrame;
   return ()=>{if(stateRef.onLensFrame===onFrame)delete stateRef.onLensFrame;};
 },[stateRef]);
 const t=T[lang]||T.en;
 const data=useMemo(()=>summarize(s.steps,s.G,s.C,s.placement,payload),[s.steps,s.G,s.C,s.placement,payload]);
 const completedSteps=s.stepLog.map(entry=>entry.si);
 const display=resolveLensDisplay(s.steps.length,s.curStep,s.phase,s.anim,completedSteps,reviewStep);
 const index=display.index;
 const current=scope==='whole'?data.whole:(data.rounds[index]||data.whole);
 // A finished step is a saved, complete snapshot until the next step starts.
 // Whole-collective mode instead continues accumulating all completed work.
 const live=scope==='step'&&display.isCompleted
   ? current
   : summarizeProgress(s.steps,s.G,s.C,s.placement,payload,s.curStep,s.anim,s.phase,s.view,scope);
 const percent=current.allMiB>0?Math.max(0,Math.min(100,live.allMiB/current.allMiB*100)):(s.phase==='done'?100:0);
 const floor=nicSerializationFloorMs(scope==='whole'?data.rounds:[current],rate);
 const matrixMax=Math.max(1,...current.matrix.flat());
 const rankMax=Math.max(1,...current.ranks.flatMap(r=>[r.tx,r.rx]));
 function exportCSV(){
  const csv=makeTransferCSV(s.steps,s.G,s.C,s.placement,payload);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;
  a.download='collectivescope-'+s.op+'-'+s.placement+'-'+s.G+'gpus.csv';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <aside className="cs-lens" aria-label={t.title}>
  <div className="cs-lens-top"><small>{t.eyebrow}</small><h2>{t.title}</h2><p>{t.subtitle}</p></div>
  <div className="cs-lens-scroll">
   <label className="cs-field">{t.scope}
    <select value={scope} onChange={e=>setScope(e.target.value)}>
     <option value="step">{t.step}</option><option value="whole">{t.whole}</option>
    </select>
   </label>
   <div className="cs-field-row">
    <label className="cs-field">{t.payload}
     <select value={payload} onChange={e=>setPayload(Number(e.target.value))}>
      {[.25,1,4,16].map(v=><option value={v} key={v}>{v} MiB</option>)}
     </select>
    </label>
    <label className="cs-field">{t.bandwidth}
     <select value={rate} onChange={e=>setRate(Number(e.target.value))}>
      {[25,100,200,400,800].map(v=><option value={v} key={v}>{v} Gb/s</option>)}
     </select>
    </label>
   </div>
   <p className="cs-step-meta">{scope==='whole'?data.rounds.length+' rounds':(s.curStep<0?t.preview:t.step)+' '+(index+1)+' / '+data.rounds.length} · {current.label}{scope==='step'&&display.isCompleted?' · '+(lang==='ko'?'완료된 Step 통계':'Completed step snapshot'):''}</p>
   <div className="cs-live-panel" aria-live="off">
      <div className="cs-live-heading"><strong>{lang==='ko'?'애니메이션 진행률':'Animation progress'}</strong><b>{percent.toFixed(0)}%</b></div>
      <div className="cs-progress-track"><div className="cs-progress-fill" style={{width:percent+'%'}}/></div>
      <p>{lang==='ko'?'진행된 모델 전송량 / 예정된 전송량':'Modeled progress / scheduled payload'} · {scope==='step'&&display.isCompleted?(lang==='ko'?'Step 완료 · 결과 유지':'Step completed · result saved'):s.phase==='paused'?(lang==='ko'?'일시정지':'Paused'):s.phase==='running'||s.phase==='stepping'?(lang==='ko'?'재생 중':'Playing'):s.phase==='done'?(lang==='ko'?'완료':'Complete'):(lang==='ko'?'재생 대기':'Ready')}</p>
   </div>
   {scope==='step'&&completedSteps.length>0&&<div className="cs-history">
     <div className="cs-history-title"><strong>{lang==='ko'?'완료한 Step 기록':'Completed step history'}</strong><span>{completedSteps.length} / {s.steps.length}</span></div>
     <div className="cs-history-steps" role="group" aria-label={lang==='ko'?'완료한 Step 통계':'Saved step statistics'}>
       <button type="button" className={reviewStep===null?'cs-history-active':''} aria-pressed={reviewStep===null} onClick={()=>setReviewStep(null)}>{lang==='ko'?'자동 · 최신':'Auto · latest'}</button>
       {completedSteps.map(si=><button key={si} type="button" aria-pressed={index===si&&display.isCompleted}
         className={index===si&&display.isCompleted?'cs-history-active':''} onClick={()=>setReviewStep(si)}>
         ✓ Step {si+1}
       </button>)}
     </div>
     <p>{lang==='ko'?'완료된 Step의 TX/RX, 행렬, NIC 통계를 다시 선택해 확인할 수 있습니다.':'Select a completed step to review its TX/RX, matrix and NIC totals.'}</p>
   </div>}
   <div className="cs-statgrid">
    <Stat label={t.logical} value={volume(live.allMiB)+' / '+volume(current.allMiB)}/>
    <Stat label={t.inter} value={volume(live.interMiB)+' / '+volume(current.interMiB)}/>
    <Stat label={t.intra} value={volume(live.intraMiB)+' / '+volume(current.intraMiB)}/>
    <Stat label={t.messages} value={live.messages+' / '+current.messages}/>
   </div>
   <section className="cs-lens-section"><h3>{t.ranks}</h3>
    <div className="cs-key"><i className="cs-swatch cs-swatch-tx"/> {t.tx} <i className="cs-swatch cs-swatch-rx"/> {t.rx}</div>
    {live.ranks.map(r=><div className="cs-rank" key={r.rank}>
     <div className="cs-rank-h"><b>GPU {r.rank}</b><span>{volume(r.tx)} / {volume(r.rx)}</span></div>
     <div className="cs-rank-track"><span className="cs-rank-tx" style={{width:(r.tx/rankMax*100)+'%'}}/><span className="cs-rank-rx" style={{width:(r.rx/rankMax*100)+'%'}}/></div>
    </div>)}
   </section>
   <section className="cs-lens-section"><h3>{t.matrix}</h3>
    <div className="cs-matrix-scroll"><table className="cs-matrix"><thead><tr><th>TX / RX</th>{current.ranks.map(r=><th key={r.rank}>G{r.rank}</th>)}</tr></thead>
     <tbody>{live.matrix.map((r,i)=><tr key={i}><th>G{i}</th>
      {r.map((v,j)=><td key={j} title={'GPU '+i+' → GPU '+j+': '+volume(v)} style={{background:v?'rgba(37,99,235,'+(.10+.72*v/matrixMax)+')':'transparent',color:v/matrixMax>.52?'#fff':'#334155'}}>{v?fmt(v):'—'}</td>)}
     </tr>)}</tbody></table></div>
    <p className="cs-note">{t.route}</p>
   </section>
   <section className="cs-lens-section"><h3>{t.links}</h3>
    {current.interMiB===0?<p className="cs-note">{t.no}</p>:live.servers.map(server=><div className="cs-server" key={server.id}>
      <b>{t.server} {server.id}</b><span>NIC ↑ {volume(server.networkTx)}</span><span>NIC ↓ {volume(server.networkRx)}</span>
    </div>)}
    <div className="cs-floor"><span>{t.floor} ({lang==='ko'?'예정량 기준':'scheduled'})</span><strong>{floor===null?'—':fmt(floor)+' ms'}</strong></div>
    <p className="cs-note">{t.floorNote}</p>
   </section>
   <button type="button" className="cs-export" onClick={exportCSV}>{t.export} ↓</button>
   <p className="cs-caveat">{lang==='ko'?'진행된 양은 점의 위치로 계산한 시각화 모델이며 실제 NIC byte counter 또는 실측 throughput이 아닙니다.':'Progress is inferred from dot positions, not real NIC byte counters or observed throughput.'} {t.note}</p>
  </div>
 </aside>;
}