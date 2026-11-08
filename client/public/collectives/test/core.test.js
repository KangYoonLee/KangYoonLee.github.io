const test=require('node:test');
const assert=require('node:assert/strict');
const sim=require('../core.js');
for(const n of [4,8])for(const op of Object.keys(sim.OPS))for(const alg of sim.OPS[op].algs){
  test(`${n} GPUs — ${op}/${alg}: final values match collective semantics`,()=>{
    const result=sim.build({n,op,alg});
    assert.equal(result.n,n);assert.equal(result.op,op);assert.equal(result.alg,alg);
    assert.equal(result.snapshots.length,result.frames.length+1);
    assert.ok(result.frames.every(x=>x.packets.every(p=>p.entries.length)));
    assert.ok(sim.validate(result));
  });
}
test('4 GPUs all-to-all pairwise: all four send in every round',()=>{
  const result=sim.build({n:4,op:'alltoall',alg:'pairwise'});
  assert.equal(result.frames.length,3);
  for(const frame of result.frames){assert.equal(frame.packets.length,4);assert.deepEqual(frame.packets.map(p=>p.from),[0,1,2,3]);}
  assert.deepEqual(result.final.map(x=>x.values),[[1,5,9,13],[2,6,10,14],[3,7,11,15],[4,8,12,16]]);
});
test('4 GPUs ring AllReduce: correct phase count and partial-sum snapshots',()=>{
  const result=sim.build({n:4,op:'allreduce',alg:'ring'});
  assert.deepEqual(result.frames.map(x=>x.phase),['reduce-scatter','reduce-scatter','reduce-scatter','allgather','allgather','allgather']);
  assert.deepEqual(result.final.map(x=>x.values),Array.from({length:4},()=>[10,10,10,10]));
});
test('4 GPUs inter-server all-to-all pairwise round 1 sends local and remote',()=>{
  const result=sim.build({n:4,op:'alltoall',alg:'pairwise'});
  const events=result.frames[0].packets;
  assert.deepEqual(events.map(e=>[e.from,e.to,e.valueLabel]),[[0,1,'2'],[1,2,'7'],[2,3,'12'],[3,0,'13']]);
});