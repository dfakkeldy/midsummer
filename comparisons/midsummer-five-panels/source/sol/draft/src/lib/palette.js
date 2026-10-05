'use strict';
// Original pigments and botanical drawing vocabulary for five independent stills.
const MSColors = Object.freeze({
  ink:'#362C48', fine:'#64536B', paper:'#EFEEDB', pearl:'#F8EED0',
  magenta:'#BB2477', pink:'#F263AE', plum:'#742459', rose:'#DF7B9D',
  sapphire:'#2754B3', blueLight:'#628DE0', blueDark:'#283B83',
  emerald:'#168365', jade:'#41B88A', greenDark:'#195F59',
  turquoise:'#27BEB9', aqua:'#8BDFD5', teal:'#267F88',
  violet:'#7952B9', lavender:'#B69ADE', purpleDark:'#443A78',
  gold:'#E6B64D', goldLight:'#F6D986', goldDark:'#A27A39',
  bark:'#70617D', barkLight:'#B39A99', barkDark:'#40536B', moss:'#66A66D',
  oliveSkin:'#C9926C', oliveLight:'#E4B18B', oliveShade:'#AC735E',
  paleSkin:'#ECC4A0', paleLight:'#F4D8B6', paleShade:'#C79383',
  brownSkin:'#A86A50', brownLight:'#C88B67', brownShade:'#805047',
  tanSkin:'#C18A5E', tanLight:'#DFA77A', tanShade:'#946B56',
  auburn:'#793F3E', auburnLight:'#B66B50', honey:'#CB974D', honeyLight:'#EAC373',
  chestnut:'#49363E', chestnutLight:'#80604F', boot:'#695344'
});
const msRnd = n => { const q = Math.sin(n*91.731+17.417)*39471.193; return q-Math.floor(q); };
function msSolid(P,c,o={}) { paint(P,{wash:c,ink:MSColors.ink,sw:.24,br:'inkfine',curv:.58,...o}); }
function msWash(P,c,op=110,o={}) { paint(P,{fill:c,fillOp:op,bleed:.12,tex:.66,border:.28,ink:null,curv:.58,...o}); }
function msLine(P,c=MSColors.ink,w=.22) { inkLine(P,w,c,'inkfine',.55); }
function msLines(list,c=MSColors.ink,w=.22) { for(const P of list) msLine(P,c,w); }
function msOval(x,y,rx,ry,c,o={}) { msSolid(ellPts(x,y,rx,ry,20,0),c,o); }
function msPatch(x,y,rx,ry,key) {
  const P=[]; for(let i=0;i<16;i++){ const a=i*Math.PI/8,q=.9+.13*msRnd(key+i*7); P.push([x+Math.cos(a)*rx*q,y+Math.sin(a)*ry*q]); } return P;
}
function msLeafPts(x,y,l,w,a) {
  const C=Math.cos(a),S=Math.sin(a),P=[[0,0],[l*.22,-w*.7],[l*.58,-w],[l,0],[l*.66,w*.68],[l*.25,w*.52]];
  return P.map(p=>[x+p[0]*C-p[1]*S,y+p[0]*S+p[1]*C]);
}
function msLeaf(x,y,l,w,a,c,vein=true) {
  msSolid(msLeafPts(x,y,l,w,a),c,{sw:.12,curv:.7});
  if(vein) msLine([[x,y],[x+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5],[x+Math.cos(a)*l*.93,y+Math.sin(a)*l*.93]],MSColors.greenDark,.11);
}
function msPetalPts(x,y,r,a,k=0) {
  const C=Math.cos(a),S=Math.sin(a),P=[[0,0],[r*.16,-r*.22],[r*.62,-r*(.34+k*.04)],[r*.97,-r*.12],[r*1.06,r*.05],[r*.78,r*.32],[r*.28,r*.24]];
  return P.map(p=>[x+p[0]*C-p[1]*S,y+p[0]*S+p[1]*C]);
}
function msFlowers(F) {
  for(const f of F) msLine([[f.x-4,f.y+f.r*2.6],[f.x+3,f.y+f.r],[f.x,f.y]],MSColors.greenDark,.17);
  for(const col of [MSColors.jade,MSColors.moss]) {
    for(let i=0;i<F.length;i++) if(i%2===(col===MSColors.jade?0:1)) {
      const f=F[i]; msSolid(msLeafPts(f.x,f.y+f.r*1.4,f.r*1.7,f.r*.35,-2.7),col,{ink:null});
      msSolid(msLeafPts(f.x,f.y+f.r*1.6,f.r*1.45,f.r*.29,-.35),col,{ink:null});
    }
  }
  const colors=[MSColors.pink,MSColors.violet,MSColors.sapphire,MSColors.goldLight];
  for(let j=0;j<colors.length;j++) for(let i=0;i<F.length;i++) if(i%4===j) {
    const f=F[i]; for(let k=0;k<5;k++) msSolid(msPetalPts(f.x,f.y,f.r,k*Math.PI*.4+f.a,k%2),colors[j],{ink:null,curv:.72});
  }
  for(const f of F) {
    for(let k=0;k<5;k++) {
      const a=k*Math.PI*.4+f.a;
      msLine([[f.x+Math.cos(a)*f.r*.2,f.y+Math.sin(a)*f.r*.2],[f.x+Math.cos(a+.1)*f.r*.7,f.y+Math.sin(a+.1)*f.r*.7]],MSColors.plum,.11);
    }
  }
  for(const f of F) msOval(f.x,f.y,f.r*.2,f.r*.16,MSColors.gold,{ink:null});
  for(const f of F) msLine([[f.x-f.r*.1,f.y],[f.x,f.y-f.r*.12],[f.x+f.r*.15,f.y+f.r*.05]],MSColors.goldDark,.12);
}
function msFlowerBank(x0,x1,y0,y1,n,key,r=17) {
  const F=[]; for(let i=0;i<n;i++) F.push({x:x0+(x1-x0)*msRnd(key+i*11),y:y0+(y1-y0)*msRnd(key+i*19+2),r:r*(.7+.5*msRnd(key+i*31)),a:msRnd(key+i*13)*6.28}); msFlowers(F);
}
function msFern(x,y,s,a=0,c=MSColors.jade) {
  const C=Math.cos(a),S=Math.sin(a),at=(u,v)=>[x+u*C-v*S,y+u*S+v*C];
  msLine([at(0,0),at(12*s,-75*s),at(35*s,-160*s)],MSColors.greenDark,.18);
  for(let k=0;k<7;k++) {
    const v=-20-k*19,u=k*k*.66,l=(31-k*2)*s;
    const A=at(u*s,v*s); msSolid(msLeafPts(A[0],A[1],l,7*s,a-2.9+k*.035),c,{ink:null});
    msSolid(msLeafPts(A[0],A[1],l*.94,6*s,a-.48-k*.04),c,{ink:null});
  }
}
function msBark(P,w0,w1,c=MSColors.bark,detail=7) {
  msSolid(ribbon(P,w0,w1),c,{sw:.28,curv:0});
  const side=P.map((p,i)=>[p[0]-w0*.13+Math.sin(i*1.9)*7,p[1]-w0*.08]);
  msWash(ribbon(side,w0*.36,w1*.24),MSColors.barkDark,78,{curv:0});
  for(let k=0;k<detail;k++) {
    const d=(k/(detail-1)-.5)*w0*.65;
    msLine(P.map((p,i)=>[p[0]+d*(1-i/P.length*.7)+Math.sin(i*2+k)*5,p[1]+d*.2]),k%3===0?MSColors.barkLight:MSColors.barkDark,.14+(k%2)*.035);
  }
}
function msTwigs(P,c=MSColors.goldDark,key=0) {
  msLine(P,c,.19);
  for(let i=1;i<P.length;i++) {
    const p=P[i],a=-1.5+.6*msRnd(key+i*9),L=26+28*msRnd(key+i*13);
    msLine([[p[0]-5,p[1]+4],[p[0]+Math.cos(a)*L*.5,p[1]+Math.sin(a)*L*.5],[p[0]+Math.cos(a)*L,p[1]+Math.sin(a)*L]],c,.13);
    msLeaf(p[0]+Math.cos(a)*L,p[1]+Math.sin(a)*L,24,6,a-.35,MSColors.moss,false);
  }
}
function msSky(mode='day',focus=960) {
  const night=mode==='night',pool=mode==='pool';
  msSolid([[-10,-10],[1930,-10],[1930,1090],[-10,1090]],night?'#334C80':pool?'#B7E0D5':'#C8E6D6',{ink:null,curv:0});
  msWash(msPatch(focus,380,690,500,101),night?'#8B87C8':'#F4D88D',night?100:115);
  msWash(msPatch(1450,360,570,480,105),night?MSColors.turquoise:'#75CFCB',night?75:110);
  msWash(msPatch(230,280,390,410,107),night?MSColors.violet:'#AFC789',95);
  msWash(msPatch(1100,100,600,190,109),night?'#6778C1':'#D4EDC4',110);
  for(let i=0;i<9;i++) {
    const x=70+i*225+msRnd(i+50)*45;
    msSolid([[x-18,0],[x+5,0],[x+27,240],[x+4,435],[x+37,760],[x-12,813],[x-31,471],[x-20,232]],night?'#496C86':'#8CB4A5',{washOp:140,ink:null});
    msLine([[x,742],[x-8,469],[x+4,229],[x-20,98]],night?'#738FA3':'#739C99',.13);
    msLine([[x+1,259],[x+59,184],[x+85,84]],night?'#657F9D':'#9EB6A6',.13);
  }
  msWash(msPatch(focus,460,360,380,131),night?'#AFB9CD':'#F6E5AD',night?80:100);
  glow(focus,430,380,night?'#ABD9F2':'#FFF0B2',night?.43:.35);
  glow(focus+300,620,220,'#88ECE1',.25);
  msSolid([[-20,788],[285,761],[592,813],[891,773],[1190,808],[1520,744],[1940,786],[1940,1090],[-20,1090]],night?'#347C78':'#70AE85',{ink:null});
  msWash([[-20,865],[420,804],[848,858],[1280,824],[1940,896],[1940,1090],[-20,1090]],night?MSColors.blueDark:MSColors.teal,75);
}
function msCanopyLeaves(key=0,night=false) {
  const colors=night?[MSColors.teal,MSColors.violet,MSColors.jade]:[MSColors.jade,MSColors.moss,MSColors.turquoise];
  for(let j=0;j<3;j++) for(let i=0;i<24;i++) {
    const n=key+i*17+j*503,x=msRnd(n)*1920,y=msRnd(n+4)*180;
    msSolid(msLeafPts(x,y,45+msRnd(n+2)*65,13+msRnd(n+7)*15,msRnd(n+9)*6.28),colors[j],{ink:null});
  }
  for(let i=0;i<23;i++) {
    const x=msRnd(key+i*47+3)*1920,y=msRnd(key+i*29+7)*164;
    msLine([[x-15,y-3],[x+5,y+9],[x+36,y+18]],night?'#79AE9D':MSColors.greenDark,.13);
  }
}
function msGroundLines(y=955,key=0,c=MSColors.greenDark) {
  for(let i=0;i<28;i++) {
    const x=100+1720*msRnd(key+i*31),yy=y+55*msRnd(key+i*13);
    msLine([[x-20,yy+8],[x,yy],[x+30,yy+3],[x+48,yy-5]],c,.14);
  }
}
function msLily(x,y,s,col=MSColors.pearl) {
  msSolid([[x-86*s,y+19*s],[x-38*s,y-4*s],[x+15*s,y-6*s],[x+65*s,y+12*s],[x+54*s,y+39*s],[x+8*s,y+53*s],[x-56*s,y+45*s]],MSColors.jade,{sw:.15});
  msLine([[x-68*s,y+27*s],[x-10*s,y+21*s],[x+47*s,y+24*s]],MSColors.greenDark,.13);
  for(let k=0;k<7;k++) {
    const a=-Math.PI/2+(k-3)*.38,rx=38*s+(k%2)*14*s;
    const C=Math.cos(a),S=Math.sin(a),P=[[0,0],[rx*.3,-12*s],[rx*.75,-13*s],[rx,0],[rx*.74,12*s],[rx*.18,8*s]];
    msSolid(P.map(p=>[x+p[0]*C-p[1]*S,y+p[0]*S+p[1]*C]),col,{ink:MSColors.plum,sw:.13,curv:.7});
  }
  msOval(x,y-6*s,15*s,9*s,MSColors.gold,{ink:null});
  for(let k=-2;k<=2;k++) msLine([[x+k*3*s,y-2*s],[x+k*6*s,y-20*s]],MSColors.goldDark,.13);
}
function msVine(P,s=1) {
  msLine(P,MSColors.gold,.21);
  for(let i=1;i<P.length;i++) {
    const p=P[i],a=i%2?-.65:-2.6;
    msSolid(msLeafPts(p[0],p[1],15*s,4.4*s,a),MSColors.gold,{ink:null});
    msLine([[p[0]-4*s,p[1]+5*s],[p[0]+2*s,p[1]+9*s],[p[0]+7*s,p[1]+3*s]],MSColors.goldLight,.12);
  }
}
