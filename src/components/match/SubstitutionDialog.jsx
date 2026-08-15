import React from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { SoundEngine } from '../../engines/engine_sound.js';

const C = THEME || {};
const POS_ORDER = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'];
const POS_COLORS = { GOL:'#b45309', ZAG:'#1d4ed8', LD:'#0369a1', LE:'#0369a1', VOL:'#15803d', MC:'#16a34a', MEI:'#16a34a', PD:'#9a3412', PE:'#9a3412', CA:'#b91c1c', LAT:'#0369a1', ATA:'#b91c1c' };

const SubstitutionDialog = ({ open, onClose, step, minute, players = [], setGameData, subsDone, setSubsDone, selectedStarter, setSelectedStarter, matchControlsRef, isUserH, homeName, awayName }) => {
  if (!open) return null;
  const maxSubs = 3;
  const subsLeft = maxSubs - subsDone.length;
  const subMinuteNumber = step === 1 ? 45 : Math.floor(minute);
  const subMinuteLabel = step === 1 ? 'HT' : `${subMinuteNumber}'`;
  const titulares = players.filter(p => p.isStarting).sort((a,b) => {
    const ai = POS_ORDER.indexOf(a.position); const bi = POS_ORDER.indexOf(b.position);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  const posCol = pos => POS_COLORS[pos] || C.txt3;
  const selPlayer = titulares.find(p => p.id === selectedStarter) || null;
  const selReserves = selPlayer ? players.filter(q => !q.isStarting && q.position === selPlayer.position && !q.injury).sort((a,b)=>(b.overall||0)-(a.overall||0)).slice(0,5) : [];

  const close = () => { setSelectedStarter(null); onClose(); };
  const doSub = (res) => {
    if (!selPlayer || subsDone.length >= maxSubs) return;
    setGameData(prev => ({ ...prev, players:prev.players.map(pl => {
      if (pl.id === selPlayer.id) return { ...pl, isStarting:false, minutesPlayed:(pl.minutesPlayed||0)+subMinuteNumber };
      if (pl.id === res.id) return { ...pl, isStarting:true, minutesPlayed:(pl.minutesPlayed||0)+(90-subMinuteNumber) };
      return pl;
    }) }));
    setSubsDone(prev => [...prev, { out:selPlayer.name.split(' ')[0], in:res.name.split(' ')[0], min:step === 1 ? 'HT' : String(subMinuteNumber) }]);
    matchControlsRef.current?.addEvent?.(`${subMinuteLabel} 🔄 SUBSTITUIÇÃO: ↓ ${selPlayer.name} → ↑ ${res.name} (${isUserH ? homeName : awayName})`);
    close();
    SoundEngine?.playSub();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" PaperProps={{sx:{bgcolor:C.bg,borderRadius:'16px',border:`2px solid ${C.yellow}`,m:1.5,maxHeight:'85vh'}}} BackdropProps={{sx:{backdropFilter:'blur(3px)',bgcolor:'rgba(0,0,0,0.5)'}}}>
      <Box sx={{px:1.5,py:1.2,bgcolor:C.yellow,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Box><Typography sx={{color:'#000',fontWeight:900,fontSize:'0.85rem'}}>🔄 SUBSTITUIÇÕES</Typography><Typography sx={{color:'rgba(0,0,0,0.6)',fontSize:'0.58rem',fontWeight:700}}>{subsLeft>0?`${subsLeft} restante(s) · ${subMinuteLabel}`:'Limite atingido'}</Typography></Box>
        <Box onClick={close} sx={{cursor:'pointer',color:'rgba(0,0,0,0.7)',fontSize:'1.3rem',fontWeight:900}}>✕</Box>
      </Box>
      <Box sx={{p:1.4,overflowY:'auto'}}>
        {subsDone.length>0 && <Box sx={{bgcolor:`${C.yellow}0a`,border:`1px solid ${C.yellow}30`,borderRadius:'8px',p:1,mb:1}}><Typography sx={{color:C.yellow,fontSize:'0.56rem',fontWeight:900,letterSpacing:0.5,mb:0.4}}>FEITAS ({subsDone.length}/{maxSubs})</Typography>{subsDone.map((s,i)=><Box key={i} sx={{display:'flex',alignItems:'center',gap:0.6,mb:0.2}}><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontFamily:'monospace',minWidth:22}}>{s.min==='HT'?'HT':`${s.min}'`}</Typography><Typography sx={{color:C.red,fontWeight:900,fontSize:'0.6rem'}}>↓ {s.out}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem'}}>→</Typography><Typography sx={{color:C.green,fontWeight:900,fontSize:'0.6rem'}}>↑ {s.in}</Typography></Box>)}</Box>}
        {subsLeft===0 ? <Box sx={{textAlign:'center',py:3}}><Typography sx={{fontSize:'1.8rem',mb:0.5}}>✅</Typography><Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.8rem'}}>Limite atingido</Typography></Box> : !selPlayer ? <>
          <Typography sx={{color:C.txt3,fontSize:'0.6rem',fontWeight:900,letterSpacing:0.5,mb:0.8}}>TOQUE NO TITULAR QUE VAI SAIR:</Typography>
          {titulares.map(p=>{const pc=posCol(p.position);const sel=selectedStarter===p.id;return <Box key={p.id} onClick={()=>setSelectedStarter(sel?null:p.id)} sx={{display:'flex',alignItems:'center',gap:0.8,mb:0.6,bgcolor:sel?`${C.yellow}15`:C.card,border:`1px solid ${sel?C.yellow:C.border}`,borderRadius:'8px',px:1.2,py:0.85,cursor:'pointer','&:active':{bgcolor:`${C.yellow}10`,borderColor:C.yellow}}}><Box sx={{width:26,height:26,borderRadius:'5px',bgcolor:pc+'20',border:`1px solid ${pc}50`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Typography sx={{color:pc,fontSize:'0.48rem',fontWeight:900}}>{p.position}</Typography></Box><Box sx={{flex:1}}><Typography sx={{color:sel?C.yellow:C.txt1,fontWeight:900,fontSize:'0.78rem',lineHeight:1}}>{p.name}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>OVR {p.overall} · ⚡{p.energy??100}%</Typography></Box><Typography sx={{color:sel?C.yellow:C.txt3,fontSize:'0.75rem'}}>{sel?'✕':'↕'}</Typography></Box>;})}
        </> : <>
          <Box sx={{bgcolor:`${C.red}0d`,border:`1.5px solid ${C.red}50`,borderRadius:'10px',p:1,mb:1}}><Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:900,letterSpacing:0.5,mb:0.5}}>SAI:</Typography><Box sx={{display:'flex',alignItems:'center',gap:0.8}}><Box sx={{width:26,height:26,borderRadius:'5px',bgcolor:posCol(selPlayer.position)+'25',border:`1px solid ${posCol(selPlayer.position)}50`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Typography sx={{color:posCol(selPlayer.position),fontSize:'0.48rem',fontWeight:900}}>{selPlayer.position}</Typography></Box><Box sx={{flex:1}}><Typography sx={{color:C.txt1,fontWeight:900,fontSize:'0.8rem',lineHeight:1}}>{selPlayer.name}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>OVR {selPlayer.overall} · ⚡{selPlayer.energy??100}%</Typography></Box><Box onClick={()=>setSelectedStarter(null)} sx={{bgcolor:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:'6px',px:0.9,py:0.45,cursor:'pointer','&:active':{opacity:0.7},flexShrink:0}}><Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.58rem'}}>✕ Cancelar</Typography></Box></Box></Box>
          <Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:900,letterSpacing:0.5,mb:0.6}}>ENTRA:</Typography>
          {selReserves.length===0 ? <Box sx={{textAlign:'center',py:1.5,bgcolor:C.cardAlt,borderRadius:'8px'}}><Typography sx={{color:C.txt3,fontSize:'0.65rem',fontStyle:'italic'}}>Sem reserva disponível para {selPlayer.position}</Typography></Box> : selReserves.map(res=><Box key={res.id} onClick={()=>doSub(res)} sx={{display:'flex',alignItems:'center',gap:0.8,mb:0.6,bgcolor:`${C.green}0d`,border:`1.5px solid ${C.green}40`,borderRadius:'8px',px:1.2,py:0.85,cursor:'pointer','&:active':{bgcolor:`${C.green}20`,transform:'scale(0.98)'},transition:'all 0.12s'}}><Box sx={{width:30,height:30,borderRadius:'7px',bgcolor:C.green+'18',border:`1px solid ${C.green}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Typography sx={{color:C.green,fontSize:'0.7rem',fontWeight:900}}>{res.overall}</Typography></Box><Box sx={{flex:1,minWidth:0}}><Typography sx={{color:C.green,fontWeight:900,fontSize:'0.78rem',lineHeight:1}}>{res.name}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>{res.position} · ⚡{res.energy??100}%</Typography></Box><Typography sx={{color:C.green,fontSize:'1rem',fontWeight:900}}>↑</Typography></Box>)}
        </>}
      </Box>
    </Dialog>
  );
};

export default SubstitutionDialog;
