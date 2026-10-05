const MS = (() => {
  const c={paper:'#F5EED8',ivory:'#FFF1CB',ink:'#342D4D',softInk:'#655069',aqua:'#67D7D0',turquoise:'#16B9B5',teal:'#167F85',deepTeal:'#22576B',emerald:'#158C64',leaf:'#49B778',lime:'#BADA76',pine:'#255D61',blue:'#235AC5',sapphire:'#2045A0',blueLight:'#6D9DEA',indigo:'#333C80',violet:'#7651AD',lilac:'#AE8AD5',pink:'#F184B8',magenta:'#C32B81',wine:'#7B285F',ruby:'#BC355B',gold:'#E5B54D',paleGold:'#FFE39B',bark:'#436E71',barkLight:'#81A48E',barkDark:'#294D64',moss:'#79B66C'};
  function rnd(n){const v=Math.sin(n*91.731+17.124)*41357.193;return v-Math.floor(v);}
  function path(s){
    if(Array.isArray(s))return s;
    const a=s.match(/[MLCQZ]|-?(?:\d*\.)?\d+/g)||[];
    const out=[];let i=0,x=0,y=0,sx=0,sy=0,cmd='M';
    while(i<a.length){
      if(/[A-Z]/.test(a[i]))cmd=a[i++];
      if(cmd==='Z'){if(x!==sx||y!==sy)out.push([sx,sy]);x=sx;y=sy;cmd='M';continue;}
      if(cmd==='M'||cmd==='L'){x=+a[i++];y=+a[i++];out.push([x,y]);if(cmd==='M'){sx=x;sy=y;cmd='L';}}
      else if(cmd==='Q'){
        const ax=+a[i++],ay=+a[i++],bx=+a[i++],by=+a[i++],ox=x,oy=y;
        for(let k=1;k<=10;k++){const t=k/10,u=1-t;out.push([u*u*ox+2*u*t*ax+t*t*bx,u*u*oy+2*u*t*ay+t*t*by]);}x=bx;y=by;
      }else if(cmd==='C'){
        const ax=+a[i++],ay=+a[i++],bx=+a[i++],by=+a[i++],ex=+a[i++],ey=+a[i++],ox=x,oy=y;
        for(let k=1;k<=14;k++){const t=k/14,u=1-t;out.push([u*u*u*ox+3*u*u*t*ax+3*u*t*t*bx+t*t*t*ex,u*u*u*oy+3*u*u*t*ay+3*u*t*t*by+t*t*t*ey]);}x=ex;y=ey;
      }else break;
    }return out;
  }
  function shape(d,col,edge=c.ink,sw=.22,op=255){paint(path(d),{wash:col,washOp:op,ink:edge,sw,br:'inkfine'});}
  function water(d,col,op=100){paint(path(d),{fill:col,fillOp:op,bleed:.12,tex:.68,border:.28,ink:null});}
  function line(d,col=c.ink,sw=.19){
    // Each pen lift is a separate stroke; disjoint facial features never acquire connecting bars.
    const runs=typeof d==='string'?(d.match(/M[^M]*/g)||[]):[d];
    for(const run of runs){const p=path(run);if(p.length>1)inkLine(p,sw,col,'inkfine',0);}
  }
  function curve(p,col=c.ink,sw=.19){inkLine(p,sw,col,'inkfine',.65);}
  function oval(x,y,rx,ry,col,edge=null,sw=.15){paint(ellPts(x,y,rx,ry,24,0),{wash:col,ink:edge,sw,br:'inkfine'});}
  function at(x,y,s,fn,a=0){push();translate(x,y);rotate(a);scale(s);fn();pop();}
  function leaf(x,y,l,a,col,vein=false){at(x,y,l,()=>{shape('M 0 0 C -.24 -.4 -.28 -.77 0 -1 C .29 -.66 .3 -.26 0 0',col,null);if(vein)line('M 0 -.02 Q .06 -.5 0 -.91',c.deepTeal,.10/l);},a);}
  function flower(x,y,r,col,kind=0){
    const n=kind===1?6:5;
    for(let j=0;j<n;j++)at(x,y,r,()=>{shape(kind===1?'M 0 .1 C -.5 -.2 -.3 -.81 -.05 -1.3 C .14 -.64 .52 -.23 0 .1':'M 0 .13 C -.35 -.14 -.59 -.5 -.33 -.7 C -.05 -.96 .43 -.76 .35 -.42 Q .22 -.12 0 .13',col,null);},j*Math.PI*2/n+.18);
    oval(x,y,r*.2,r*.16,c.gold);
    for(let j=0;j<3;j++){const a=j*2.1;line([[x,y],[x+Math.cos(a)*r*.32,y+Math.sin(a)*r*.32]],c.wine,.11);}
  }
  function spray(x,y,s,seed=1){
    const q=[];
    for(let i=0;i<7;i++){const dx=(rnd(seed+i*9)-.5)*150*s,dy=-35*s-rnd(seed+i*11)*125*s;q.push([x+dx,y+dy,13*s+rnd(seed+i*17)*11*s]);curve([[x,y],[x+dx*.35,y+dy*.45],[x+dx,y+dy]],c.pine,.15);}
    for(let j=0;j<2;j++)for(let i=0;i<7;i++){const a=q[i];leaf(a[0]+(j?8:-7)*s,a[1]+30*s,(23+i%3*6)*s,j?.9:-.9,j?c.emerald:c.leaf,true);}
    for(let group=0;group<3;group++)for(let i=group;i<7;i+=3)flower(...q[i],[c.magenta,c.pink,c.violet][group]);
  }
  function branch(p,w0,w1,col=c.bark,detail=true){
    const q=through(p,10),left=[],right=[],n=q.length;
    for(let i=0;i<n;i++){
      const a=q[Math.max(0,i-1)],b=q[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,t=i/(n-1);
      const w=(w0*(1-t)+w1*t)*(.5+.055*Math.sin(t*9));
      left.push([q[i][0]-dy/d*w,q[i][1]+dx/d*w]);right.push([q[i][0]+dy/d*w,q[i][1]-dx/d*w]);
    }
    // Filled junctions have no transverse outline: the bark grain flows through the fork.
    paint(left.concat(right.slice().reverse()),{wash:col,ink:null});
    if(detail){
      inkLine(left.slice(Math.floor(n*.16)),.21,c.deepTeal,'inkfine',.1);
      inkLine(right.slice(Math.floor(n*.18)),.17,c.deepTeal,'inkfine',.1);
      for(let j=0;j<3;j++)curve(p.map((a,i)=>[a[0]+(j-1)*w0*.15*(1-i/p.length),a[1]+Math.sin(i*1.2+j)*w0*.06]),j===1?c.barkLight:c.barkDark,j===1?.29:.15);
    }
  }
  function frond(x,y,s,a=0,col=c.emerald){at(x,y,s,()=>{curve([[0,0],[6,-55],[24,-115],[43,-175]],c.pine,.17);for(let k=0;k<7;k++){const yy=-20-k*21,xx=k*4;leaf(xx,yy,39-k*3,-.85,col);leaf(xx+2,yy-2,42-k*3,.94,col);}},a);}
  function grove(mode=0){
    const night=mode===3;
    shape([[-20,-20],[1940,-20],[1940,1100],[-20,1100]],night?'#394D93':'#B5E4D3',null);
    water('M -20 0 L 1940 0 L 1940 690 C 1510 552 1358 739 1032 652 C 651 484 285 776 -20 540 Z',night?c.violet:c.aqua,night?115:95);
    water('M 335 -30 C 569 142 564 459 506 676 Q 996 865 1526 609 C 1355 454 1391 144 1606 -30 Z',night?'#8EAFE0':'#FFF1B5',night?96:145);
    const trees=[[-80,190,143],[190,310,52],[408,436,29],[1490,1450,38],[1700,1580,58],[1980,1770,153]];
    trees.forEach((q,i)=>{const[a,b,w]=q;shape(`M ${a-w} -30 C ${a+w*.1} 235 ${b-w} 430 ${b-w*.9} 766 Q ${b} 820 ${b+w} 768 C ${b+w*.2} 390 ${a+w} 170 ${a+w*1.25} -30 Z`,night?'#466B91':['#4B9F9A','#72B5A1','#89C5B4'][i%3],null);curve([[a,0],[a+15,190],[b-9,436],[b,750]],night?'#809ED0':'#B2D6AD',.24);branch([[a,180],[a+(i%2?100:-80),120],[a+(i%2?240:-190),30]],w*.3,3,night?'#517098':'#80B6AA',false);});
    shape('M -20 796 C 344 702 584 848 849 781 C 1159 706 1462 763 1940 695 L 1940 1100 L -20 1100 Z',night?'#387C86':'#6CBA94',null);
    water('M -20 903 C 351 772 627 939 977 830 C 1343 750 1567 930 1940 803 L 1940 1100 L -20 1100 Z',night?'#245176':c.teal,115);
    water('M 298 1055 C 550 897 706 835 960 799 C 1209 816 1390 960 1542 1090 Z',night?'#80B5C4':'#DDE4A4',108);
    for(let band=0;band<3;band++)for(let i=0;i<22;i++){const x=rnd(i*13+band*77)*1920,y=35+rnd(i*21+band*51)*295;if(x>530&&x<1380&&y>135)continue;leaf(x,y,36+rnd(i+band*71)*47,(rnd(i*7)-.5)*4,[night?'#327F87':c.teal,night?'#479A9B':c.leaf,night?'#7798C3':c.lime][band]);}
    glow(night?990:1000,night?255:325,night?430:490,night?'#78BBDD':'#FFDB85',night?.38:.29);
    for(let i=0;i<25;i++){const x=70+rnd(i*17+4)*1780,y=600+rnd(i*23+7)*420;curve([[x-18,y+8],[x,y],[x+28,y-3]],night?'#69B3AF':'#A5D89A',.13);}
  }
  function foreground(seed=0,quiet=0){
    for(let k=0;k<7;k++){const x=k<4?48+k*118:1585+(k-4)*132;frond(x,1090,.72+rnd(k+seed)*.7,k<4?.3:-.3,k%2?c.teal:c.emerald);}
    if(!quiet){spray(228,1035,.85,seed+1);spray(1720,1024,.95,seed+50);}
    for(let i=0;i<18;i++){const x=70+rnd(i*19+seed)*1790,y=970+rnd(i*31+seed)*130;if(x>650&&x<1390)continue;leaf(x,y,28+rnd(i+2)*34,(rnd(i+seed)-.5)*4,i%2?c.lime:c.leaf);}
  }
  function embroidery(p,col=c.gold){curve(p,col,.22);for(let i=1;i<p.length-1;i++){const[x,y]=p[i];line([[x,y],[x-6,y-6],[x-9,y-12]],col,.12);line([[x,y],[x+6,y-3],[x+10,y-9]],col,.12);}}
  function clothLines(lines,col,sw=.18){lines.forEach(d=>line(d,col,sw));}
  function hatch(x,y,n,dx,dy,col=c.softInk){for(let i=0;i<n;i++)line([[x+i*5,y+i*2],[x+i*5+dx,y+i*2+dy]],col,.10);}
  return{c,rnd,path,shape,water,line,curve,oval,at,leaf,flower,spray,branch,frond,grove,foreground,embroidery,clothLines,hatch};
})();
