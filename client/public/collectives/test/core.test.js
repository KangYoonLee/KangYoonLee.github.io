const assert=require('node:assert/strict');
const c=require('../core.js');
for(const op of Object.keys(c.OPTIONS))for(const alg of c.OPTIONS[op])for(const n of [4,8]){
  const s=c.build({op,alg,n,root:2});
  assert(s.steps.length>0);
  assert.equal(s.packetCount,s.steps.reduce((x,st)=>x+st.events.length,0));
  for(const step of s.steps)for(const event of step.events){
    assert(event.from>=0&&event.from<n&&event.to>=0&&event.to<n);
    assert.notEqual(event.from,event.to);assert(event.units>0);
    for(const topology of ['single','dual','quad']) {
      const p=c.route(event,topology,n);assert.equal(p[0],`gpu${event.from}`);assert.equal(p.at(-1),`gpu${event.to}`);
      assert.equal(p.length,topology==='single'||(Math.floor(event.from*(topology==='dual'?2:4)/n)===Math.floor(event.to*(topology==='dual'?2:4)/n))?3:5);
    }
  }
  if(op==='alltoall'){
    const transfers=s.steps.flatMap(x=>x.events).map(x=>x.from+'-'+x.to);
    assert.equal(transfers.length,n*(n-1));assert.equal(new Set(transfers).size,n*(n-1));
  }
  if(op==='allreduce'&&alg==='ring')assert.equal(s.steps.length,2*(n-1));
  if(op==='allgather'&&alg==='ring')assert.equal(s.steps.length,n-1);
  if(op==='reducescatter'&&alg==='ring'){
    const last=s.steps.at(-1);for(const ev of last.events)assert.equal(ev.chunk,`C${(ev.to+n)%n}`);
  }
  if(['broadcast','reduce','gather','scatter'].includes(op)&&alg==='tree')assert.equal(s.packetCount,n-1);
}
console.log('PASS: all collective/algorithm/rank cases, routes, key invariants');