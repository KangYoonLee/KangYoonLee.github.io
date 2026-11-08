import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,summarizeProgress,chunkCount,nicSerializationFloorMs,makeTransferCSV,serverOf} from '../src/engine/insights.mjs';
test('4-GPU AllToAll has 12 directed transfers with 8 cross-server',()=>{
 const t=[];for(let src=0;src<4;src++)for(let dst=0;dst<4;dst++)if(src!==dst)t.push({src,dst,ci_src:dst,ci_dst:src});
 const s=summarize([{ph:'AllToAll',t}],4,4,'inter',1);
 assert.equal(s.whole.messages,12);assert.equal(s.whole.allMiB,12);assert.equal(s.whole.interMiB,8);assert.equal(s.whole.intraMiB,4);
 assert.deepEqual(s.whole.ranks.map(r=>r.tx),[3,3,3,3]);assert.deepEqual(s.whole.servers.map(r=>r.networkTx),[4,4]);
 assert.equal(s.whole.matrix[0][0],0);assert.equal(s.whole.matrix[0][3],1);
});
test('intra-server placement yields zero NIC bytes',()=>{
 const s=summarize([{ph:'Ring',t:[{src:0,dst:1,ci:1}]}],4,4,'intra',4);
 assert.equal(s.whole.interMiB,0);assert.equal(s.whole.intraMiB,4);assert.equal(serverOf(3,4,'intra'),0);
});
test('full-buffer tree send counts every chunk',()=>{
 const s=summarize([{ph:'Tree',t:[{src:1,dst:0,ci:-1}]}],4,4,'inter',2);
 assert.equal(s.whole.allMiB,8);assert.equal(chunkCount({ci:-1},4),4);
});
test('100G NIC serialization floor adds round peaks',()=>{
 const s=summarize([{t:[{src:0,dst:3,ci:0}]},{t:[{src:2,dst:1,ci:0}]}],4,4,'inter',1);
 const ms=nicSerializationFloorMs(s.rounds,100);assert.ok(ms>.16&&ms<.18);
});
test('CSV includes source, destination, and path type',()=>{
 const csv=makeTransferCSV([{ph:'demo',t:[{src:0,dst:2,ci_src:2,ci_dst:0}]}],4,4,'inter',1);
 assert.match(csv,/inter-server/);assert.match(csv,/"0","2"/);
});

test('animation progress starts at zero, moves, pauses and completes',()=>{
  const steps=[{ph:'AllToAll Exchange',t:[
    {src:0,dst:2,ci_src:2,ci_dst:0},
    {src:0,dst:3,ci_src:3,ci_dst:0},
    {src:2,dst:0,ci_src:0,ci_dst:2},
    {src:3,dst:0,ci_src:0,ci_dst:3}
  ]}];
  const idle=summarizeProgress(steps,4,4,'inter',1,-1,0,'idle','physical','whole');
  const halfway=summarizeProgress(steps,4,4,'inter',1,0,.5,'running','physical','whole');
  const paused=summarizeProgress(steps,4,4,'inter',1,0,.5,'paused','physical','whole');
  const done=summarizeProgress(steps,4,4,'inter',1,1,0,'done','physical','whole');
  assert.equal(idle.allMiB,0);
  assert.ok(halfway.allMiB>0 && halfway.allMiB<4);
  assert.equal(halfway.allMiB,paused.allMiB);
  assert.equal(done.allMiB,4);
  assert.equal(done.interMiB,4);
  assert.equal(done.messages,4);
  assert.equal(done.matrix[0][2],1);
});
test('current-round progress resets when next round begins; whole accumulates',()=>{
 const steps=[
  {t:[{src:0,dst:2,ci:0}]},
  {t:[{src:1,dst:3,ci:1}]}
 ];
 const current=summarizeProgress(steps,4,4,'inter',1,1,0,'running','physical','step');
 const whole=summarizeProgress(steps,4,4,'inter',1,1,0,'running','physical','whole');
 assert.equal(current.allMiB,0);
 assert.equal(whole.allMiB,1);
 assert.equal(whole.messages,1);
});
