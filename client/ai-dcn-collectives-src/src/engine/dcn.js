
/* AI DCN extension of Hyojun Jeon's MIT-licensed gpu-comm-visualizer.
 * Illustrative paths, not actual NCCL topology/packet traces.
 */
import {CC} from './constants.js';
import {cellGeo} from './layout.js';
import {drawGPUs} from './renderer.js';

function card(C){const w=C<=6?28:C<=9?22:18;return{w:C*(w+(C<=6?3:2))+14,h:w+40};}
export function computeDcnLayout(s,W,H){
 const {w,h}=card(s.C),count=s.placement==='inter'?2:1,per=Math.ceil(s.G/count);
 const dx=w+35,dy=h+50,span=dx*2+55;
 for(let i=0;i<s.G;i++){
  const server=Math.floor(i/per), local=i%per;
  const cx=count===2?W/2+(server===0?-1:1)*(span/2+55):W/2;
  s.gpus[i].x=cx+(local%2-.5)*dx;
  s.gpus[i].y=H*.2+Math.floor(local/2)*dy;
 }
}
function topo(s){
 const groups=[],count=s.placement==='inter'?2:1,per=Math.ceil(s.G/count),{w,h}=card(s.C);
 for(let k=0;k<count;k++){
  const ids=Array.from({length:Math.min(per,s.G-k*per)},(_,j)=>k*per+j);
  const arr=ids.map(i=>s.gpus[i]),x=arr.reduce((sum,g)=>sum+g.x,0)/arr.length;
  const low=Math.max(...arr.map(g=>g.y)),top=Math.min(...arr.map(g=>g.y));
  const nv={x,y:low+h/2+70}, nic={x,y:nv.y+60},tor={x,y:nic.y+60};
  groups.push({ids,x,nv,nic,tor,minx:Math.min(...arr.map(g=>g.x))-w/2-24,
    maxx:Math.max(...arr.map(g=>g.x))+w/2+24,miny:top-h/2-40});
 }
 const spine=count===2?{x:groups.reduce((a,g)=>a+g.x,0)/2,y:Math.max(...groups.map(g=>g.tor.y))+72}:null;
 return {groups,spine};
}
export function autoFitDcn(s,W,H){
 const d=topo(s); let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const g of s.gpus){
  const a=cellGeo(s.gpus,s.C,g.gi,0);
  x0=Math.min(x0,a.rx-20);x1=Math.max(x1,a.rx+a.cardW+20);
  y0=Math.min(y0,a.ry-40);y1=Math.max(y1,a.ry+a.cardH+22);
 }
 for(const g of d.groups){
  x0=Math.min(x0,g.minx-12);x1=Math.max(x1,g.maxx+12);
  y0=Math.min(y0,g.miny-7);y1=Math.max(y1,(s.placement==='inter'?g.tor:g.nv).y+35);
 }
 if(d.spine){x0=Math.min(x0,d.spine.x-65);x1=Math.max(x1,d.spine.x+65);y1=Math.max(y1,d.spine.y+35);}
 const sw=x1-x0,sh=y1-y0,z=Math.min(1,(W-34)/sw,(H-56)/sh);
 return{zoom:z,panX:(W-sw*z)/2-x0*z,panY:(H-sh*z)/2-y0*z};
}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function box(ctx,p,txt,width=67){
 ctx.save();ctx.fillStyle='#243558';ctx.strokeStyle='#52749c';ctx.lineWidth=1;
 ctx.beginPath();ctx.roundRect(p.x-width/2,p.y-14,width,28,5);ctx.fill();ctx.stroke();
 ctx.fillStyle='#e1edff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,p.x,p.y);ctx.restore();
}
function route(s,t,geo){
 const ix=t.ci_src!==undefined?t.ci_src:Math.max(0,t.ci);
 const jx=t.ci_dst!==undefined?t.ci_dst:Math.max(0,t.ci);
 const a=cellGeo(s.gpus,s.C,t.src,ix),b=cellGeo(s.gpus,s.C,t.dst,jx);
 const start={x:a.x+a.w/2,y:a.y+a.h/2},end={x:b.x+b.w/2,y:b.y+b.h/2};
 const gs=geo.groups.find(g=>g.ids.includes(t.src)), gd=geo.groups.find(g=>g.ids.includes(t.dst));
 if(!gs||!gd||t.src===t.dst)return[start,end];
 if(gs===gd)return[start,gs.nv,end];
 return[start,gs.nv,gs.nic,gs.tor,geo.spine,gd.tor,gd.nic,gd.nv,end];
}
function at(pts,v){
 const ls=[];let total=0;
 for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);ls.push(l);total+=l;}
 let target=v*total;
 for(let i=0;i<ls.length;i++){
  if(target<=ls[i]||i===ls.length-1){const r=ls[i]?Math.max(0,Math.min(1,target/ls[i])):0;
   return{x:pts[i].x+(pts[i+1].x-pts[i].x)*r,y:pts[i].y+(pts[i+1].y-pts[i].y)*r};}
  target-=ls[i];
 }
 return pts[pts.length-1];
}
export function drawDcnScene(ctx,s){
 const W=ctx.canvas.width/devicePixelRatio,H=ctx.canvas.height/devicePixelRatio;
 ctx.clearRect(0,0,W,H);
 const geo=topo(s);
 ctx.save();ctx.translate(s.panX,s.panY);ctx.scale(s.zoom,s.zoom);
 for(const g of geo.groups){
  const bottom=(s.placement==='inter'?g.nic:g.nv).y+26;
  ctx.save();ctx.strokeStyle='rgba(160,194,230,.32)';ctx.setLineDash([6,5]);
  ctx.beginPath();ctx.roundRect(g.minx,g.miny,g.maxx-g.minx,bottom-g.miny,12);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#95a9c7';ctx.font='bold 12px sans-serif';ctx.fillText('GPU SERVER '+geo.groups.indexOf(g),g.minx+10,g.miny+18);
  ctx.restore();
  ctx.save();ctx.strokeStyle='rgba(180,210,250,.27)';ctx.lineWidth=2;
  for(const id of g.ids)line(ctx,{x:s.gpus[id].x,y:s.gpus[id].y},g.nv);
  if(s.placement==='inter'){line(ctx,g.nv,g.nic);line(ctx,g.nic,g.tor);line(ctx,g.tor,geo.spine);}
  ctx.restore();
  box(ctx,g.nv,'NVSwitch',90);
  if(s.placement==='inter'){box(ctx,g.nic,'NIC');box(ctx,g.tor,'ToR');}
 }
 if(geo.spine)box(ctx,geo.spine,'Spine',90);
 drawGPUs(ctx,s.gpus,s.G,s.C,s.op);
 if(s.curStep>=0 && s.curStep<s.steps.length && s.phase!=='idle'){
  const xs=s.steps[s.curStep].t;
  for(let i=0;i<xs.length;i++){
   const t=xs[i],inf=s.snapInfo[i];if(!inf)continue;
   const pts=route(s,t,geo);
   const col=CC[(t.ci_src!==undefined?t.ci_src:Math.max(0,t.ci))%CC.length];
   const stagger=Math.min(.06,.42/Math.max(1,xs.length-1));
   const p=Math.max(0,Math.min(1,(s.anim-i*stagger)/Math.max(.1,1-(xs.length-1)*stagger)));
   if(p<=0)continue;
   ctx.save();ctx.lineWidth=2.5;ctx.strokeStyle=col;ctx.globalAlpha=.26;
   ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
   for(let n=1;n<pts.length;n++)ctx.lineTo(pts[n].x,pts[n].y);
   ctx.stroke();ctx.globalAlpha=1;
   const pos=at(pts,p);
   ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(pos.x,pos.y,12,0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;ctx.fillStyle='#07121f';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 10px monospace';
   const value=Array.isArray(inf.sv)?inf.sv.join(','):String(inf.sv);
   ctx.fillText(value.length>5?value.slice(0,4)+'…':value,pos.x,pos.y);
   ctx.restore();
  }
 }
 ctx.restore();
 ctx.save();ctx.fillStyle='#8b9db8';ctx.font='11px sans-serif';
 ctx.fillText(s.placement==='inter'?'Illustrative path: NVSwitch → NIC → ToR → Spine → ToR → NIC → NVSwitch':'Illustrative intra-server path: GPU → NVSwitch → GPU',12,H-12);ctx.restore();
}
