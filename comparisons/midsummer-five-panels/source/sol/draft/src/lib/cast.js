'use strict';
// Cast identity is shared; bodies below are drawn separately for each staging.
const MSCast = Object.freeze({schema_version:1,characters:[
  {id:'titania',name:'Titania',age:36,skin:MSColors.oliveSkin,light:MSColors.oliveLight,shade:MSColors.oliveShade,hair:MSColors.auburn,hairLight:MSColors.auburnLight,eye:'#7B793E',appearance:'Tall mature woman; warm olive skin, long deep auburn waves, defined cheekbones, almond hazel eyes, long straight nose, composed expressive mouth; gold leaf circlet and turquoise drop earrings.',costume:'Opaque jewel-magenta wrap gown, fitted waist, gold vine embroidery, bare shoulders, covered neckline, calf side slit and gold sandals.'},
  {id:'helena',name:'Helena',age:30,skin:MSColors.paleSkin,light:MSColors.paleLight,shade:MSColors.paleShade,hair:MSColors.honey,hairLight:MSColors.honeyLight,eye:'#647F95',appearance:'Tall mature woman; pale warm freckled skin, long honey-blonde hair, temple braid, long oval face, grey-blue eyes, arched brows, refined nose and sapphire hair clasp.',costume:'Opaque sapphire gown, turquoise trailing outer overskirt, gold waist sash, covered neckline, bare shoulders, tasteful side slit and blue flat slippers.'},
  {id:'hermia',name:'Hermia',age:28,skin:MSColors.brownSkin,light:MSColors.brownLight,shade:MSColors.brownShade,hair:MSColors.chestnut,hairLight:MSColors.chestnutLight,eye:'#4C3530',appearance:'Shorter mature woman; rich warm brown skin, partly tied shoulder-length dark chestnut curls, angular oval face, strong expressive brows, dark brown eyes, defined nose and lips, ruby flower pin.',costume:'Opaque emerald gown, ruby sash, narrow gold trim, fitted covered bodice and draped shawl.'},
  {id:'puck',name:'Puck',age:35,skin:MSColors.tanSkin,light:MSColors.tanLight,shade:MSColors.tanShade,hair:'#3D3540',hairLight:'#76594E',eye:'#5C603E',appearance:'Lean mature adult man, warm tan skin, curly dark hair, defined adult jaw, leaf-like pointed ears and amused attentive eyes.',costume:'Opaque violet and teal leaf-pattern tunic, fitted trousers and brown boots.'}
]});
function msPerson(id) { return MSCast.characters.find(c=>c.id===id); }
function msHair(id,x,y,s,dir=1,length=230,wind=0) {
  const c=msPerson(id); push(); translate(x,y); scale(s*dir,s);
  const end=(xx,yy)=>[xx+wind*Math.max(0,yy)/Math.max(1,length),yy];
  const P=[[-45,-63],[-61,-19],[-60,43],[-71,96],end(-66,157),end(-53,length),end(-23,length-21),end(2,length-62),end(35,length-9),end(63,length-23),end(56,145),[64,83],[57,13],[49,-54],[24,-85],[-13,-92],[-37,-78]];
  msSolid(P,c.hair,{sw:.24});
  msSolid([[-51,-12],[-54,65],end(-46,149),end(-36,length-15),end(-19,length-37),end(-28,139),[-33,70],[-32,-21]],c.hairLight,{washOp:110,ink:null});
  for(let k=0;k<12;k++) {
    const xx=-47+k*9;
    msLine([[xx,-62+Math.abs(k-5)*4],[xx-9,8],[xx+6,62],end(xx-10,118),end(xx+7,length-32-Math.abs(k-5)*5)],k%3===0?c.hairLight:MSColors.ink,.12);
  }
  if(id==='hermia'||id==='puck') {
    for(let i=0;i<15;i++) {
      const a=i/15*6.28,xx=Math.cos(a)*54,yy=-20+Math.sin(a)*77;
      msLine([[xx-8,yy-7],[xx+6,yy-13],[xx+14,yy-2],[xx+6,yy+10],[xx-4,yy+5]],i%3===0?c.hairLight:MSColors.ink,.18);
    }
  }
  pop();
}
function msEye(x,y,w,c,gaze=1,up=0) {
  const P=[[x-w*.52,y],[x-w*.2,y-4.7],[x+w*.18,y-4.1],[x+w*.5,y+.5],[x+w*.12,y+3.8],[x-w*.22,y+3.2]];
  msSolid(P,'#E4DCC8',{ink:null,curv:.66});
  msOval(x+gaze*2.4,y+up,3.6,4.05,c.eye,{ink:null});
  msOval(x+gaze*2.8,y+up,.95,2.5,MSColors.ink,{ink:null});
  msOval(x+gaze*2.1-1,y+up-1.6,.72,.78,MSColors.pearl,{ink:null});
  msLine(P.slice(0,4),MSColors.ink,.21);
  msLine([P[3],P[4],P[5],P[0]],c.shade,.14);
  msLine([[x-w*.5,y-6.4],[x-w*.12,y-8],[x+w*.35,y-6.7]],c.shade,.12);
}
function msFace(id,x,y,s,dir=1,expression='composed',tilt=0) {
  const c=msPerson(id),male=id==='puck',argue=expression==='disagree',listen=expression==='listen',up=expression==='reply';
  push(); translate(x,y); rotate(tilt); scale(s*dir,s);
  if(id==='helena') scale(.96,1.065);
  const jaw=male?[[45,39],[33,62],[9,69],[-14,62],[-36,37]]:[[45,39],[30,62],[8,73],[-14,63],[-34,39]];
  msSolid([[-42,-54],[-26,-76],[4,-85],[31,-74],[45,-52],[48,-21],[51,6],...jaw,[-42,7],[-45,-26]],c.skin,{sw:.2});
  msSolid([[-37,-27],[-23,-34],[-20,1],[-26,30],[-10,57],[-14,62],[-33,41],[-43,12]],c.shade,{ink:null,washOp:140});
  msWash([[-22,-45],[3,-64],[29,-52],[35,-31],[18,-8],[21,12],[6,27],[-10,12],[-21,-14]],c.light,85,{bleed:.06,tex:.48});
  msSolid([[23,8],[36,11],[43,23],[35,35],[19,33],[12,23]],id==='hermia'?'#BD775D':'#DC9C87',{washOp:75,ink:null});
  msSolid([[-40,-9],[-49,-16],[-53,-8],[-51,13],[-43,22],[-37,15]],c.skin,{sw:.16});
  msLine([[-47,-4],[-43,-6],[-42,8],[-46,11]],c.shade,.15);
  if(male) {
    msSolid([[-45,-12],[-69,-30],[-65,-9],[-57,8],[-43,16]],c.skin,{sw:.19});
    msLine([[-63,-22],[-55,-3],[-46,4]],c.shade,.15);
  }
  const nearY=argue?-13:-12,farY=listen?-14:-11,gaze=1,gazeUp=up?-1.8:argue?1.2:0;
  msEye(-12,nearY,23,c,gaze,gazeUp); msEye(32,farY,15,c,gaze,gazeUp);
  msLine([[-25,argue?-26:listen?-29:-25],[-16,argue?-29:listen?-34:-29],[-6,argue?-24:listen?-32:-28],[1,argue?-20:-24]],c.hair,.3);
  msLine([[23,listen?-32:argue?-20:-26],[32,listen?-35:argue?-24:-28],[39,listen?-32:argue?-29:-25]],c.hair,.27);
  msLine([[13,-19],[16,-4],[21,12],[30,20],[25,25],[17,24]],c.shade,.19);
  msLine([[27,22],[32,23],[34,20]],MSColors.fine,.13);
  msLine([[7,11],[5,21],[9,26]],c.shade,.12);
  msSolid([[19,-6],[22,6],[26,16],[23,18],[20,13]],c.light,{ink:null,washOp:180});
  const my=male?44:45,open=listen||argue||up;
  msSolid([[3,my],[12,my-3],[18,my-1],[23,my-3],[33,my],[24,my+(open?5:2)],[13,my+5]],id==='hermia'?'#733E42':'#AA6063',{ink:null,curv:.62});
  if(open) msSolid([[8,my+1],[19,my],[29,my+1],[23,my+3],[13,my+3]],'#633C48',{ink:null,curv:.4});
  else msLine([[5,my+1],[16,my+1],[29,my]],'#794956',.15);
  msLine([[11,my+5],[19,my+7],[26,my+5]],c.light,.15);
  msLine([[13,32],[14,36]],c.shade,.1);
  msLine([[-24,19],[-11,23],[-5,21]],c.shade,.12);
  msLine([[36,3],[41,6],[43,10]],c.shade,.1);
  msLine([[2,59],[13,62],[23,59]],c.shade,.12);
  for(let k=0;k<4;k++) msLine([[-30+k*3,29+k*2],[-25+k*3,37+k*2]],c.shade,.095);
  if(id==='helena') {
    for(const p of [[-20,3],[-13,5],[-6,4],[-22,9],[-10,10],[34,5],[38,9]]) msOval(p[0],p[1],.85,.65,'#A47766',{ink:null});
  }
  if(male) {
    msLine([[-27,41],[-19,53],[-5,60],[19,60],[34,48]],c.shade,.18);
    for(let i=0;i<9;i++) { const xx=-20+i*6; msLine([[xx,49+Math.abs(i-4)*.8],[xx+2,54+Math.abs(i-4)*.8]],c.hair,.095); }
    msLine([[-22,-37],[-6,-40],[13,-38]],c.shade,.13);
  }
  msSolid([[-43,-58],[-26,-80],[4,-88],[29,-77],[43,-58],[45,-40],[29,-50],[9,-57],[-13,-47],[-33,-26],[-41,-10]],c.hair,{sw:.18});
  msLines([[[-34,-54],[-17,-71],[8,-74],[30,-63]],[[-38,-35],[-27,-54],[-8,-64],[12,-65]]],c.hairLight,.14);
  if(id==='helena') {
    msSolid(ribbon([[-37,-45],[-42,-7],[-43,30],[-39,76]],10,7),c.hairLight,{sw:.13,curv:0});
    for(let k=0;k<9;k++) msLine([[-45,-39+k*12],[-37,-33+k*12],[-44,-26+k*12]],MSColors.goldDark,.13);
    msSolid([[-44,-45],[-36,-49],[-30,-43],[-35,-35],[-43,-36]],MSColors.sapphire,{sw:.13});
    msLine([[-41,-43],[-36,-46],[-34,-40]],MSColors.blueLight,.12);
  }
  if(id==='titania') {
    msLine([[-36,-56],[-12,-65],[14,-65],[39,-54]],MSColors.gold,.3);
    for(let k=0;k<6;k++) {
      const xx=-32+k*13,yy=-57-Math.sin(k/5*Math.PI)*10;
      msSolid(msLeafPts(xx,yy,12,3.4,k%2?-1.15:-2.12),MSColors.gold,{ink:null});
    }
    msLine([[-46,17],[-47,26]],MSColors.gold,.15);
    msSolid([[-47,25],[-53,35],[-49,45],[-43,41],[-42,32]],MSColors.turquoise,{sw:.12});
    msLine([[-49,30],[-50,38]],MSColors.aqua,.12);
    msSolid([[47,25],[43,35],[47,43],[51,35]],MSColors.turquoise,{sw:.12});
  }
  if(id==='hermia') {
    for(let k=0;k<5;k++) msSolid(msPetalPts(-43,-38,10,k*1.256),MSColors.magenta,{sw:.1,curv:.7});
    msOval(-43,-38,3,3,MSColors.gold,{ink:null});
    for(let k=0;k<7;k++) {
      const xx=-38+k*12,yy=-67-Math.sin(k*.55)*11;
      msLine([[xx-6,yy+4],[xx-5,yy-5],[xx+5,yy-7],[xx+8,yy+2],[xx+2,yy+7]],c.hairLight,.16);
    }
  }
  if(male) for(let k=0;k<8;k++) {
    const xx=-38+k*11,yy=-63-Math.sin(k/7*Math.PI)*15;
    msLine([[xx-5,yy+4],[xx-8,yy-5],[xx+1,yy-10],[xx+8,yy-3],[xx+3,yy+5]],c.hairLight,.17);
  }
  pop();
}
function msHand(x,y,s,a,skin,kind='open') {
  push(); translate(x,y); rotate(a); scale(s);
  let P,creases;
  if(kind==='open') {
    P=[[0,-9],[16,-12],[29,-17],[40,-31],[45,-34],[49,-32],[48,-28],[40,-15],[54,-22],[63,-25],[67,-23],[67,-19],[53,-9],[68,-14],[75,-14],[78,-11],[77,-7],[56,1],[70,0],[76,2],[77,6],[73,9],[52,14],[39,20],[29,17],[21,10],[0,10]];
    creases=[[[29,-9],[36,-5],[42,4]],[[40,-15],[44,-10]],[[53,-9],[54,-5]],[[56,1],[55,6]],[[31,9],[39,13],[48,11]]];
  } else if(kind==='rest') {
    P=[[0,-9],[19,-12],[34,-10],[46,-3],[58,4],[60,8],[57,11],[53,9],[40,2],[53,15],[55,20],[52,23],[48,21],[35,10],[46,26],[46,31],[43,33],[39,30],[27,14],[35,32],[34,37],[30,39],[26,34],[18,19],[12,17],[5,12],[0,10]];
    creases=[[[19,-2],[27,4],[30,12]],[[35,10],[31,8]],[[27,14],[23,11]],[[18,19],[15,12]]];
  } else {
    P=[[0,-9],[19,-10],[33,-7],[46,-2],[59,1],[64,4],[63,8],[57,9],[41,6],[57,12],[61,15],[60,19],[55,20],[37,13],[51,22],[53,26],[50,29],[45,28],[32,20],[40,31],[39,35],[35,37],[31,33],[20,24],[11,17],[0,11]];
    creases=[[[20,-1],[26,7],[27,14]],[[41,6],[37,4]],[[37,13],[32,11]],[[32,20],[27,17]]];
  }
  msSolid(P,skin,{sw:.16,curv:.22});
  msLines(creases,MSColors.fine,.11);
  msLine([[4,-4],[12,-3],[17,0]],MSColors.fine,.1);
  pop();
}
function msFoot(x,y,s,a,id,sandal=false) {
  const c=msPerson(id); push(); translate(x,y); rotate(a); scale(s);
  const P=[[-12,-29],[3,-31],[9,-15],[24,-8],[40,-4],[48,1],[46,7],[38,11],[17,12],[-3,9],[-13,3],[-15,-9]];
  msSolid(P,sandal?c.skin:MSColors.sapphire,{sw:.19,curv:.53});
  msLine([[-10,8],[12,13],[37,12],[48,6]],sandal?MSColors.goldDark:MSColors.blueDark,.21);
  if(sandal) {
    msSolid([[-12,-15],[6,-18],[10,-12],[-11,-9]],MSColors.gold,{ink:null,curv:.2});
    msSolid([[12,-10],[18,-8],[22,11],[15,11]],MSColors.gold,{ink:null,curv:.2});
    msSolid([[30,-6],[36,-4],[39,10],[33,11]],MSColors.gold,{ink:null,curv:.2});
    msLine([[40,0],[38,5]],c.shade,.1); msLine([[34,-1],[32,4]],c.shade,.1);
  } else {
    msLine([[-7,-14],[7,-17],[17,-9],[32,-5]],MSColors.blueLight,.16);
    msLine([[9,6],[24,8],[38,6]],MSColors.blueLight,.12);
  }
  pop();
}
function msBoot(x,y,s,a) {
  push(); translate(x,y); rotate(a); scale(s);
  msSolid([[-14,-46],[8,-46],[13,-16],[35,-9],[47,-4],[51,3],[45,10],[21,13],[-9,10],[-17,3]],MSColors.boot,{sw:.2});
  msLine([[-13,-39],[9,-40]],MSColors.goldDark,.2);
  msLine([[-7,-33],[-5,-10],[11,3],[36,4]],'#A7876A',.14);
  msLine([[-12,10],[17,15],[46,11]],MSColors.ink,.22);
  pop();
}
