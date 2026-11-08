const assert=require('node:assert/strict');
const S=require('../core.js');
let cases=0;
for(const n of [4,8])for(const [op,meta] of Object.entries(S.OPS))for(const alg of meta.algs){
  const sim=S.build({n,op,alg});
  assert(S.validate(sim),`${op}/${alg}/${n}`);
  assert.equal(sim.snapshots.length,sim.frames.length+1);
  for(const frame of sim.frames){assert(frame.packets.every(p=>p.entries.every(x=>Number.isFinite(x.value))));}
  cases++;
}
console.log(`PASS: ${cases} configurations with numerical results and transfer packets`);