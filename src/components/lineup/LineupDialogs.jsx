import React from 'react';
import { Box, Typography, Button, Dialog } from '@mui/material';
import LineupPlayerCard from './LineupPlayerCard.jsx';

export function ShirtEditor({ edit, setEdit, onSave, C }) {
  if (!edit) return null;
  return <Box sx={{ position:'fixed', bottom:70, left:14, right:14, zIndex:200, bgcolor:C.card, border:`1.5px solid ${C.green}`, borderRadius:'14px', p:1.5, boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
    <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.8rem', mb:1 }}>✏️ Número da camisa</Typography>
    <Box sx={{display:'flex',gap:0.8}}><input type="number" value={edit.value} min="1" max="99" onChange={e=>setEdit(prev=>({...prev,value:e.target.value}))} style={{flex:1,padding:'8px 12px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontSize:'1rem',fontWeight:900,color:C.txt1,background:C.bg,outline:'none'}}/><Button variant="contained" onClick={onSave} sx={{bgcolor:C.green,color:'#fff',fontWeight:900,px:2,borderRadius:'8px'}}>✔</Button><Button variant="outlined" onClick={()=>setEdit(null)} sx={{borderColor:C.border,color:C.txt2,fontWeight:900,px:1.5,borderRadius:'8px'}}>✕</Button></Box>
  </Box>;
}

export function PlayerPickerDialog({ pickerSlot, setPickerSlot, available, currentRound, onSelect, C }) {
  return <Dialog open={Boolean(pickerSlot)} onClose={()=>setPickerSlot(null)} fullWidth maxWidth="xs" PaperProps={{sx:{bgcolor:C.bg,borderRadius:'16px',border:`2px solid ${C.primary}60`,boxShadow:'0 10px 40px rgba(0,0,0,0.2)',maxHeight:'80vh',backgroundImage:'none',m:1.5}}} BackdropProps={{sx:{backdropFilter:'blur(3px)',bgcolor:'rgba(0,0,0,0.35)'}}}>
    <Box sx={{px:2,py:1.4,bgcolor:C.primary,display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography sx={{color:'#fff',fontWeight:900,fontSize:'0.85rem',letterSpacing:1}}>ESCALAR: {pickerSlot?.role}</Typography><Typography onClick={()=>setPickerSlot(null)} sx={{color:'rgba(255,255,255,0.7)',cursor:'pointer',fontSize:'1.3rem',fontWeight:900}}>✕</Typography></Box>
    <Box sx={{p:1.5,overflowY:'auto'}}>{available.all.length===0?<Box sx={{textAlign:'center',py:5}}><Typography sx={{fontSize:'2.5rem',mb:1}}>🪑</Typography><Typography sx={{color:C.txt3,fontSize:'0.8rem',fontStyle:'italic',fontWeight:700}}>Nenhum jogador disponível para {pickerSlot?.role}.</Typography></Box>:<>{available.exact.length>0&&<><Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:900,mb:1}}>POSIÇÃO EXATA ({available.exact.length})</Typography>{available.exact.map(p=><LineupPlayerCard key={p.id} player={p} currentRound={currentRound} C={C} modal onClick={()=>onSelect(p,false)}/>)}</>}{available.adapted.length>0&&<><Typography sx={{color:'#f59e0b',fontSize:'0.58rem',fontWeight:900,mb:1,mt:available.exact.length?1.5:0}}>⚠️ COMPATÍVEIS — -10 OVR ({available.adapted.length})</Typography>{available.adapted.map(p=><LineupPlayerCard key={p.id} player={p} currentRound={currentRound} C={C} modal adapted adaptedRole={pickerSlot?.role} onClick={()=>onSelect(p,true)}/>)}</>}</>}</Box>
  </Dialog>;
}
