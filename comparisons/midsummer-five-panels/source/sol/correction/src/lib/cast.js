'use strict';
// Fixed adult identities. The five bodies are individually staged in panels.js.
const MSCast = Object.freeze({schema_version:1,characters:[
  {id:'titania',name:'Titania',age:36,skin:MSColors.oliveSkin,light:MSColors.oliveLight,shade:MSColors.oliveShade,hair:MSColors.auburn,hairLight:MSColors.auburnLight,eye:'#7B793E',appearance:'Tall mature woman, warm olive skin, long deep auburn waves, defined cheekbones, almond hazel eyes, long straight nose, composed expressive mouth. Gold leaf circlet and turquoise drop earrings.',costume:'Opaque jewel-magenta wrap gown, fitted waist, gold vine embroidery, bare shoulders, covered neckline, elegant calf side slit, gold sandals.'},
  {id:'helena',name:'Helena',age:30,skin:MSColors.paleSkin,light:MSColors.paleLight,shade:MSColors.paleShade,hair:MSColors.honey,hairLight:MSColors.honeyLight,eye:'#647F95',appearance:'Tall mature woman, pale warm freckled skin, long honey-blonde hair, temple braid, long oval face, grey-blue eyes, arched brows, refined nose. Sapphire hair clasp.',costume:'Opaque sapphire gown, turquoise trailing outer overskirt, gold waist sash, covered neckline, bare shoulders, tasteful side slit, blue flat slippers.'},
  {id:'hermia',name:'Hermia',age:28,skin:MSColors.brownSkin,light:MSColors.brownLight,shade:MSColors.brownShade,hair:MSColors.chestnut,hairLight:MSColors.chestnutLight,eye:'#4C3530',appearance:'Shorter mature woman, rich warm brown skin, shoulder-length dark chestnut curls partly tied back, angular oval face, strong expressive brows, dark brown eyes, defined nose and lips. Ruby flower pin.',costume:'Opaque emerald gown, ruby sash, narrow gold trim, fitted covered bodice and draped sleeve or shawl.'},
  {id:'puck',name:'Puck',age:35,skin:MSColors.tanSkin,light:MSColors.tanLight,shade:MSColors.tanShade,hair:'#3D3540',hairLight:'#76594E',eye:'#5C603E',appearance:'Lean unmistakably mature adult man, warm tan skin, curly dark hair, defined adult jaw, pointed leaf-like ears, amused attentive eyes.',costume:'Opaque violet-and-teal leaf-patterned tunic, fitted trousers and brown boots.'}
]});
function msPerson(id) { return MSCast.characters.find(c=>c.id===id); }
function msCurl(x,y,r,c,w=.16) {
  const Q=[];
  for(let k=0;k<15;k++) {const a=-1.1+k*.41,q=r*(1-k*.042);Q.push([x+Math.cos(a)*q,y+Math.sin(a)*q]);}
  msLine(Q,c,w);
}
function msHair(id,x,y,s,dir=1,length=230,wind=0) {
  const c=msPerson(id);push();translate(x,y);scale(s*dir,s);
  if(id==='hermia') {
    msSolid([[-45,-67],[-61,-42],[-62,-9],[-68,18],[-64,45],[-72,69],[-66,90],[-54,109],[-48,128],[-30,137],[-12,127],[3,119],[21,133],[43,128],[54,111],[67,101],[67,78],[73,61],[67,39],[65,12],[57,-19],[52,-53],[32,-77],[7,-88],[-22,-86]],c.hair,{sw:.2,curv:.82});
    msSolid([[-51,-36],[-56,3],[-48,35],[-58,64],[-47,94],[-35,116],[-24,109],[-33,84],[-32,52],[-39,17],[-34,-34]],c.hairLight,{washOp:95,ink:null});
    msSolid([[47,-25],[56,4],[49,34],[58,59],[46,86],[35,109],[25,118],[40,124],[58,105],[64,79],[61,43],[65,14]],c.hairLight,{washOp:70,ink:null});
    for(let i=0;i<16;i++) {
      const side=i<8?-1:1,j=i%8,xx=side*(48+7*Math.sin(j*1.8)),yy=-25+j*20;
      msCurl(xx,yy,10+(j%3)*2,i%3===0?c.hairLight:MSColors.ink,.155);
    }
    for(let i=0;i<6;i++) msCurl(-31+i*13,-67-Math.sin(i*.58)*12,11,c.hairLight,.14);
    msLine([[-47,106],[-32,118],[-13,121],[4,115]],MSColors.ink,.15);
    pop();return;
  }
  if(id==='puck') {
    msSolid([[-48,26],[-57,5],[-54,-13],[-62,-31],[-54,-46],[-49,-66],[-30,-76],[-16,-90],[6,-92],[22,-84],[41,-81],[53,-66],[59,-50],[56,-33],[62,-16],[51,7],[44,24],[32,34],[21,20],[-24,18]],c.hair,{sw:.2,curv:.8});
    for(let i=0;i<12;i++) {
      const a=-Math.PI+i/11*Math.PI,xx=Math.cos(a)*48,yy=-40+Math.sin(a)*38;
      msCurl(xx,yy,11+(i%2)*2,i%3===0?c.hairLight:MSColors.ink,.16);
    }
    msCurl(-47,-12,12,c.hairLight,.15);msCurl(43,-7,11,c.hairLight,.15);
    pop();return;
  }
  const end=(xx,yy)=>[xx+wind*Math.max(0,yy)/Math.max(1,length),yy];
  msSolid([[-45,-63],[-61,-19],[-60,43],[-71,96],end(-66,157),end(-53,length),end(-23,length-21),end(2,length-62),end(35,length-9),end(63,length-23),end(56,145),[64,83],[57,13],[49,-54],[24,-85],[-13,-92],[-37,-78]],c.hair,{sw:.21,curv:.8});
  msSolid([[-51,-12],[-54,65],end(-46,149),end(-36,length-15),end(-19,length-37),end(-28,139),[-33,70],[-32,-21]],c.hairLight,{washOp:110,ink:null});
  msWash([[-39,0],[-31,49],end(-23,112),end(-10,length-47),end(15,length-36),end(25,167),[18,78],[6,4]],c.hairLight,65,{bleed:.06});
  for(let k=0;k<12;k++) {
    const xx=-47+k*9;
    msLine([[xx,-62+Math.abs(k-5)*4],[xx-9,8],[xx+6,62],end(xx-10,118),end(xx+7,length-32-Math.abs(k-5)*5)],k%3===0?c.hairLight:MSColors.ink,.115);
  }
  pop();
}
function msEye(x,y,w,c,gaze=1,up=0,tense=false) {
  const h=tense?.7:1,P=[[x-w*.52,y],[x-w*.2,y-4.7*h],[x+w*.18,y-4.1*h],[x+w*.5,y+.5],[x+w*.12,y+3.8*h],[x-w*.22,y+3.2*h]];
  msSolid(P,'#E4DCC8',{ink:null,curv:.52});
  msOval(x+gaze*3.3,y+up,3.5,3.9*h,c.eye,{ink:null});
  msOval(x+gaze*3.6,y+up,.95,2.5*h,MSColors.ink,{ink:null});
  msOval(x+gaze*3.2-1,y+up-1.4,.7,.75,MSColors.pearl,{ink:null});
  msLine(P.slice(0,4),MSColors.ink,.2);
  msLine([P[3],P[4],P[5],P[0]],c.shade,.13);
  msLine([[x-w*.5,y-6.4],[x-w*.12,y-8],[x+w*.35,y-6.7]],c.shade,.11);
}
function msFace(id,x,y,s,dir=1,expression='composed',tilt=0) {
  const c=msPerson(id),male=id==='puck',argue=expression==='disagree',listen=expression==='listen',reply=expression==='reply';
  push();translate(x,y);rotate(tilt);scale(s*dir,s);
  if(id==='helena') scale(.96,1.065);
  const jaw=male?[[46,35],[37,54],[23,67],[-1,68],[-25,57],[-39,35]]:[[45,39],[30,62],[8,73],[-14,63],[-34,39]];
  msSolid([[-42,-54],[-26,-76],[4,-85],[31,-74],[45,-52],[48,-21],[51,6],...jaw,[-42,7],[-45,-26]],c.skin,{sw:.18,curv:.75});
  msSolid([[-37,-27],[-23,-34],[-20,1],[-26,30],[-10,57],[-14,62],[-33,41],[-43,12]],c.shade,{ink:null,washOp:130});
  msWash([[-22,-45],[3,-64],[29,-52],[35,-31],[18,-8],[21,12],[6,27],[-10,12],[-21,-14]],c.light,90,{bleed:.05,tex:.55});
  msWash([[-31,10],[-13,14],[-5,24],[-15,32],[-29,25]],c.shade,48,{bleed:.06});
  msSolid([[23,8],[36,11],[43,23],[35,35],[19,33],[12,23]],id==='hermia'?'#BD775D':'#DC9C87',{washOp:65,ink:null});
  msSolid([[-40,-9],[-49,-16],[-53,-8],[-51,13],[-43,22],[-37,15]],c.skin,{sw:.14});
  msLine([[-47,-4],[-43,-6],[-42,8],[-46,11]],c.shade,.13);
  if(male) {
    msSolid([[-45,-12],[-69,-30],[-65,-9],[-57,8],[-43,16]],c.skin,{sw:.17,curv:.32});
    msLine([[-63,-22],[-55,-3],[-46,4]],c.shade,.14);
    msSolid([[46,-12],[64,-28],[60,-8],[50,12],[44,16]],c.skin,{sw:.15,curv:.32});
  }
  msEye(-12,argue?-12:-12,23,c,listen?1.15:1,reply?-1:argue?.6:0,argue||reply);
  msEye(32,listen?-14:-11,15,c,listen?1.05:1,reply?-1:0,argue||reply);
  if(argue) {
    msLine([[-26,-29],[-17,-29],[-7,-24],[1,-18]],c.hair,.29);
    msLine([[23,-18],[31,-22],[40,-28]],c.hair,.26);
    msLine([[3,-25],[6,-18],[5,-12]],c.shade,.13);
    msLine([[10,-26],[9,-20]],c.shade,.11);
  } else if(reply) {
    msLine([[-26,-32],[-16,-33],[-5,-28],[1,-22]],c.hair,.29);
    msLine([[23,-22],[32,-26],[40,-30]],c.hair,.27);
    msLine([[3,-28],[6,-20]],c.shade,.12);
  } else {
    msLine([[-25,listen?-32:-25],[-16,listen?-38:-29],[-6,listen?-36:-28],[1,listen?-29:-24]],c.hair,.27);
    msLine([[23,listen?-28:-26],[32,listen?-30:-28],[39,listen?-27:-25]],c.hair,.24);
  }
  msLine([[13,-19],[16,-4],[21,12],[30,20],[25,25],[17,24]],c.shade,.18);
  msLine([[27,22],[32,23],[34,20]],MSColors.fine,.12);
  msLine([[7,11],[5,21],[9,26]],c.shade,.11);
  msSolid([[19,-6],[22,6],[26,16],[23,18],[20,13]],c.light,{ink:null,washOp:175});
  const my=male?44:45;
  if(argue||reply) {
    msSolid([[2,my+3],[11,my-1],[19,my],[25,my+1],[34,my+6],[24,my+7],[14,my+6],[7,my+5]],id==='hermia'?'#733E42':'#AA6063',{ink:null});
    msSolid([[7,my+3],[17,my+2],[28,my+5],[22,my+6],[12,my+5]],'#633C48',{ink:null});
    msLine([[2,my+3],[0,my+6]],c.shade,.12);
    msLine([[33,my+5],[35,my+9]],c.shade,.12);
  } else {
    msSolid([[3,my],[12,my-3],[18,my-1],[23,my-3],[33,my],[24,my+(listen?7:2)],[13,my+5]],id==='hermia'?'#733E42':'#AA6063',{ink:null});
    if(listen) msSolid([[7,my+1],[18,my],[29,my+1],[24,my+5],[13,my+4]],'#633C48',{ink:null});
    else msLine([[5,my+1],[16,my+1],[29,my]],'#794956',.14);
  }
  msLine([[11,my+6],[19,my+8],[26,my+6]],c.light,.14);
  msLine([[13,32],[14,36]],c.shade,.095);
  msLine([[-24,19],[-11,23],[-5,21]],c.shade,.11);
  msLine([[36,3],[41,6],[43,10]],c.shade,.095);
  msLine([[2,59],[13,62],[23,59]],c.shade,.11);
  msHatching(-30,29,4,3,2,9,1.05,c.shade,.09);
  if(id==='helena') for(const p of [[-20,3],[-13,5],[-6,4],[-22,9],[-10,10],[34,5],[38,9]]) msOval(p[0],p[1],.85,.65,'#A47766',{ink:null});
  if(male) {
    msLine([[-30,36],[-24,49],[-8,59],[17,61],[34,47]],c.shade,.18);
    msHatching(-23,48,10,5,.2,5,.95,c.hair,.09);
    msLine([[-23,-38],[-7,-41],[12,-38]],c.shade,.12);
    msLine([[-32,24],[-29,31]],c.shade,.13);
  }
  if(id==='hermia') {
    msSolid([[-44,-54],[-49,-65],[-39,-78],[-28,-79],[-20,-88],[-5,-87],[5,-91],[21,-86],[33,-79],[39,-66],[47,-57],[46,-38],[34,-45],[22,-51],[9,-48],[-1,-57],[-12,-49],[-22,-47],[-27,-32],[-36,-26],[-42,-9]],c.hair,{sw:.17,curv:.8});
    for(let k=0;k<7;k++) msCurl(-37+k*12,-65-Math.sin(k*.55)*12,10,c.hairLight,.145);
    msCurl(-34,-31,10,c.hairLight,.14);
    for(let k=0;k<5;k++) msSolid(msPetalPts(-43,-38,10,k*1.256),MSColors.magenta,{sw:.095,curv:.7});
    msOval(-43,-38,3,3,MSColors.gold,{ink:null});
  } else if(male) {
    msSolid([[-44,-49],[-49,-65],[-36,-77],[-21,-77],[-12,-87],[5,-86],[17,-79],[32,-79],[43,-67],[48,-52],[42,-37],[28,-43],[18,-51],[4,-47],[-8,-54],[-20,-42],[-34,-29],[-42,-12]],c.hair,{sw:.17,curv:.8});
    for(let k=0;k<8;k++) msCurl(-37+k*10,-61-Math.sin(k/7*Math.PI)*14,10,c.hairLight,.15);
    msCurl(-38,-27,9,c.hairLight,.14);
  } else {
    msSolid([[-43,-58],[-26,-80],[4,-88],[29,-77],[43,-58],[45,-40],[29,-50],[9,-57],[-13,-47],[-33,-26],[-41,-10]],c.hair,{sw:.17,curv:.8});
    msLines([[[-34,-54],[-17,-71],[8,-74],[30,-63]],[[-38,-35],[-27,-54],[-8,-64],[12,-65]]],c.hairLight,.13);
  }
  if(id==='helena') {
    msSolid(ribbon([[-37,-45],[-42,-7],[-43,30],[-39,76]],10,7),c.hairLight,{sw:.12,curv:0});
    for(let k=0;k<9;k++) msLine([[-45,-39+k*12],[-37,-33+k*12],[-44,-26+k*12]],MSColors.goldDark,.12);
    msSolid([[-44,-45],[-36,-49],[-30,-43],[-35,-35],[-43,-36]],MSColors.sapphire,{sw:.12});
    msLine([[-41,-43],[-36,-46],[-34,-40]],MSColors.blueLight,.11);
  }
  if(id==='titania') {
    msLine([[-36,-56],[-12,-65],[14,-65],[39,-54]],MSColors.gold,.27);
    for(let k=0;k<6;k++) {
      const xx=-32+k*13,yy=-57-Math.sin(k/5*Math.PI)*10;
      msSolid(msLeafPts(xx,yy,12,3.4,k%2?-1.15:-2.12),MSColors.gold,{ink:null});
    }
    msLine([[-46,17],[-47,26]],MSColors.gold,.14);
    msSolid([[-47,25],[-53,35],[-49,45],[-43,41],[-42,32]],MSColors.turquoise,{sw:.11});
    msLine([[-49,30],[-50,38]],MSColors.aqua,.11);
    msSolid([[47,25],[43,35],[47,43],[51,35]],MSColors.turquoise,{sw:.11});
  }
  pop();
}
function msHand(x,y,s,a,skin,kind='open') {
  const c=MSCast.characters.find(q=>q.skin===skin)||msPerson('titania');
  push();translate(x,y);rotate(a);scale(s);
  let P,creases,nails;
  if(kind==='open') {
    P=[[-14,-8],[2,-10],[17,-12],[26,-16],[34,-27],[39,-32],[44,-32],[47,-28],[45,-23],[38,-13],[45,-13],[57,-20],[65,-23],[69,-22],[71,-18],[68,-14],[53,-5],[59,-7],[70,-10],[76,-9],[79,-6],[77,-2],[72,1],[56,5],[67,5],[73,6],[76,9],[74,13],[69,15],[52,17],[59,18],[65,20],[67,24],[64,27],[58,27],[43,24],[32,23],[24,19],[15,12],[2,9],[-14,8]];
    creases=[[[25,-7],[32,-2],[36,7]],[[39,-12],[42,-7]],[[53,-5],[54,0]],[[55,6],[54,11]],[[28,12],[36,17],[44,17]]];
    nails=[[[39,-29],[42,-30],[44,-28]],[[64,-20],[67,-20],[68,-17]],[[73,-7],[76,-6],[76,-3]],[[70,9],[72,10],[72,12]],[[61,22],[64,23],[63,25]]];
  } else if(kind==='rest') {
    P=[[-14,-8],[1,-10],[15,-11],[27,-8],[38,-4],[51,1],[58,5],[59,9],[56,11],[51,9],[37,3],[40,9],[49,17],[52,22],[51,25],[47,26],[43,23],[31,12],[34,19],[41,28],[42,33],[39,35],[35,33],[24,19],[26,28],[30,36],[28,40],[24,40],[21,36],[15,24],[10,18],[2,12],[-14,9]];
    creases=[[[17,-3],[24,3],[27,10]],[[34,10],[30,7]],[[26,17],[22,13]],[[16,23],[13,15]]];
    nails=[[[53,6],[56,7],[56,9]],[[47,22],[49,23]],[[37,31],[39,32]],[[25,36],[26,38]]];
  } else {
    P=[[-14,-8],[3,-10],[18,-9],[31,-6],[43,-2],[57,1],[63,4],[64,7],[61,10],[56,10],[40,6],[46,10],[56,14],[60,17],[59,21],[55,23],[50,21],[35,13],[40,20],[49,25],[51,29],[49,32],[44,32],[30,23],[33,29],[37,34],[36,38],[32,39],[28,35],[20,26],[13,22],[5,15],[-14,10]];
    creases=[[[20,-2],[25,6],[26,14]],[[40,6],[36,3]],[[35,13],[31,11]],[[30,23],[26,18]]];
    nails=[[[57,5],[60,6]],[[54,17],[57,19]],[[45,28],[48,29]],[[32,35],[34,36]]];
  }
  msSolid(P,skin,{sw:.145,curv:.48});
  msSolid([[-10,3],[7,4],[18,9],[27,17],[33,22],[25,21],[15,15],[1,10],[-10,9]],c.shade,{ink:null,washOp:80,curv:.7});
  msWash([[9,-5],[20,-6],[29,-1],[29,7],[20,12],[11,5]],c.light,62,{bleed:.03,tex:.5});
  msLines(creases,c.shade,.105);
  msLines(nails,c.shade,.09);
  msLine([[-7,-2],[0,-1],[7,1]],c.shade,.095);
  msLine([[15,8],[19,11],[22,14]],c.shade,.09);
  pop();
}
function msFoot(x,y,s,a,id,sandal=false) {
  const c=msPerson(id);push();translate(x,y);rotate(a);scale(s);
  msSolid([[-12,-29],[3,-31],[9,-15],[24,-8],[40,-4],[48,1],[46,7],[38,11],[17,12],[-3,9],[-13,3],[-15,-9]],sandal?c.skin:MSColors.sapphire,{sw:.17,curv:.7});
  msLine([[-10,8],[12,13],[37,12],[48,6]],sandal?MSColors.goldDark:MSColors.blueDark,.2);
  if(sandal) {
    msSolid([[-12,-15],[6,-18],[10,-12],[-11,-9]],MSColors.gold,{ink:null,curv:.35});
    msSolid([[12,-10],[18,-8],[22,11],[15,11]],MSColors.gold,{ink:null,curv:.3});
    msSolid([[30,-6],[36,-4],[39,10],[33,11]],MSColors.gold,{ink:null,curv:.3});
    msLine([[40,0],[38,5]],c.shade,.095);msLine([[34,-1],[32,4]],c.shade,.095);
  } else {
    msLine([[-7,-14],[7,-17],[17,-9],[32,-5]],MSColors.blueLight,.15);
    msLine([[9,6],[24,8],[38,6]],MSColors.blueLight,.11);
  }
  pop();
}
function msBoot(x,y,s,a) {
  push();translate(x,y);rotate(a);scale(s);
  msSolid([[-14,-46],[8,-46],[13,-16],[35,-9],[47,-4],[51,3],[45,10],[21,13],[-9,10],[-17,3]],MSColors.boot,{sw:.18,curv:.6});
  msLine([[-13,-39],[9,-40]],MSColors.goldDark,.18);
  msLine([[-7,-33],[-5,-10],[11,3],[36,4]],'#A7876A',.13);
  msLine([[-12,10],[17,15],[46,11]],MSColors.ink,.2);
  pop();
}
