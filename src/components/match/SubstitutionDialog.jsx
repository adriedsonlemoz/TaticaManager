import React from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { SoundEngine } from '../../engines/engine_sound.js';
import {
  MAX_LIVE_SUBSTITUTIONS,
  buildLiveSubstitutionChange,
  getLiveSubstitutionMinute,
  getLiveSubstitutionSelection,
  livePlayerIdsEqual,
  normalizeLiveSubstitutions,
} from '../../engines/match/matchSubstitutionViewModel.js';

const C = THEME || {};
const POS_ORDER = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'];
const POS_COLORS = { GOL:'#b45309', ZAG:'#1d4ed8', LD:'#0369a1', LE:'#0369a1', VOL:'#15803d', MC:'#16a34a', MEI:'#16a34a', PD:'#9a3412', PE:'#9a3412', CA:'#b91c1c', LAT:'#0369a1', ATA:'#b91c1c' };

const SubstitutionDialog = ({
  open,
  onClose,
  step,
  minute,
  players = [],
  setPlayers,
  subsDone = [],
  setSubsDone,
  selectedStarter,
  setSelectedStarter,
  matchControlsRef,
  userSide = null,
  isUserH,
  homeName,
  awayName,
  matchRound = 0,
  canSubstitute = true,
}) => {
  const submittingRef = React.useRef(false);

  React.useEffect(() => {
    if (open) submittingRef.current = false;
  }, [open, selectedStarter]);

  if (!open) return null;

  const substitutions = normalizeLiveSubstitutions(subsDone);
  const maxSubs = MAX_LIVE_SUBSTITUTIONS;
  const subsLeft = Math.max(0, maxSubs - substitutions.length);
  const clock = getLiveSubstitutionMinute({ step, minute });
  const titulares = (Array.isArray(players) ? players : []).filter(p => p?.isStarting).sort((a,b) => {
    const ai = POS_ORDER.indexOf(a?.position); const bi = POS_ORDER.indexOf(b?.position);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  const posCol = pos => POS_COLORS[pos] || C.txt3;
  const { selectedPlayer: selPlayer, reserves: selReserves } = getLiveSubstitutionSelection({
    players,
    subsDone: substitutions,
    selectedStarter,
    matchRound,
  });
  const resolvedUserSide = userSide === 'home' || userSide === 'away'
    ? userSide
    : isUserH === true
      ? 'home'
      : isUserH === false
        ? 'away'
        : null;
  const userTeamName = resolvedUserSide === 'home' ? homeName : resolvedUserSide === 'away' ? awayName : '';
  const substitutionEnabled = Boolean(canSubstitute && resolvedUserSide && subsLeft > 0);

  const close = () => {
    submittingRef.current = false;
    setSelectedStarter?.(null);
    onClose?.();
  };

  const doSub = (reserve) => {
    if (submittingRef.current || !substitutionEnabled || !selPlayer) return;
    const change = buildLiveSubstitutionChange({
      players,
      subsDone: substitutions,
      outgoingId: selPlayer.id,
      incomingId: reserve?.id,
      matchRound,
      step,
      minute,
      maxSubs,
    });
    if (!change) return;

    submittingRef.current = true;
    const narration = `${change.clock.label} ${change.narration} (${userTeamName})`;
    const controls = matchControlsRef?.current;
    if (typeof controls?.registerLiveSubstitution === 'function') {
      const registered = controls.registerLiveSubstitution({
        record: change.record,
        narration,
        outgoing: change.outgoing,
        incoming: change.incoming,
      });
      if (registered !== true) {
        submittingRef.current = false;
        return;
      }
    }

    setPlayers?.(change.players);
    const alreadyRecorded = substitutions.some((entry) => (
      livePlayerIdsEqual(entry?.outId, change.record.outId)
      || livePlayerIdsEqual(entry?.inId, change.record.inId)
    ));
    const nextSubstitutions = alreadyRecorded || substitutions.length >= maxSubs
      ? substitutions
      : [...substitutions, change.record];
    setSubsDone?.(nextSubstitutions);
    if (controls && typeof controls === 'object') {
      controls.liveSubstitutions = nextSubstitutions;
      if (typeof controls.registerLiveSubstitution !== 'function') controls.addEvent?.(narration);
    }
    SoundEngine?.playSub();
    close();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" PaperProps={{sx:{bgcolor:C.bg,borderRadius:'16px',border:`2px solid ${C.yellow}`,m:1.5,maxHeight:'85vh'}}} BackdropProps={{sx:{backdropFilter:'blur(3px)',bgcolor:'rgba(0,0,0,0.5)'}}}>
      <Box sx={{px:1.5,py:1.2,bgcolor:C.yellow,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Box><Typography sx={{color:'#000',fontWeight:900,fontSize:'0.85rem'}}>🔄 SUBSTITUIÇÕES</Typography><Typography sx={{color:'rgba(0,0,0,0.6)',fontSize:'0.58rem',fontWeight:700}}>{subsLeft>0?`${subsLeft} restante(s) · ${clock.label}`:'Limite atingido'}</Typography></Box>
        <Box component="button" type="button" aria-label="Fechar substituições" onClick={close} sx={{cursor:'pointer',color:'rgba(0,0,0,0.7)',fontSize:'1.3rem',fontWeight:900,border:0,bgcolor:'transparent',fontFamily:'inherit',p:0}}>✕</Box>
      </Box>
      <Box sx={{p:1.4,overflowY:'auto'}}>
        {substitutions.length>0 && <Box sx={{bgcolor:`${C.yellow}0a`,border:`1px solid ${C.yellow}30`,borderRadius:'8px',p:1,mb:1}}><Typography sx={{color:C.yellow,fontSize:'0.56rem',fontWeight:900,letterSpacing:0.5,mb:0.4}}>FEITAS ({substitutions.length}/{maxSubs})</Typography>{substitutions.map((s,i)=><Box key={`${String(s?.outId ?? 'out')}-${String(s?.inId ?? 'in')}-${i}`} sx={{display:'flex',alignItems:'center',gap:0.6,mb:0.2}}><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontFamily:'monospace',minWidth:22}}>{s?.min==='HT'?'HT':`${s?.min ?? '?'}'`}</Typography><Typography sx={{color:C.red,fontWeight:900,fontSize:'0.6rem'}}>↓ {s?.out || '—'}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem'}}>→</Typography><Typography sx={{color:C.green,fontWeight:900,fontSize:'0.6rem'}}>↑ {s?.in || '—'}</Typography></Box>)}</Box>}
        {!substitutionEnabled && subsLeft > 0 ? <Box sx={{textAlign:'center',py:3}}><Typography sx={{fontSize:'1.8rem',mb:0.5}}>⏱️</Typography><Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.8rem'}}>Substituição indisponível neste momento</Typography></Box> : subsLeft===0 ? <Box sx={{textAlign:'center',py:3}}><Typography sx={{fontSize:'1.8rem',mb:0.5}}>✅</Typography><Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.8rem'}}>Limite atingido</Typography></Box> : !selPlayer ? <>
          <Typography sx={{color:C.txt3,fontSize:'0.6rem',fontWeight:900,letterSpacing:0.5,mb:0.8}}>TOQUE NO TITULAR QUE VAI SAIR:</Typography>
          {titulares.map(p=>{const pc=posCol(p?.position);const sel=livePlayerIdsEqual(selectedStarter,p?.id);return <Box key={String(p?.id)} onClick={()=>setSelectedStarter?.(sel?null:p?.id)} sx={{display:'flex',alignItems:'center',gap:0.8,mb:0.6,bgcolor:sel?`${C.yellow}15`:C.card,border:`1px solid ${sel?C.yellow:C.border}`,borderRadius:'8px',px:1.2,py:0.85,cursor:'pointer','&:active':{bgcolor:`${C.yellow}10`,borderColor:C.yellow}}}><Box sx={{width:26,height:26,borderRadius:'5px',bgcolor:pc+'20',border:`1px solid ${pc}50`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Typography sx={{color:pc,fontSize:'0.48rem',fontWeight:900}}>{p?.position || '?'}</Typography></Box><Box sx={{flex:1}}><Typography sx={{color:sel?C.yellow:C.txt1,fontWeight:900,fontSize:'0.78rem',lineHeight:1}}>{p?.name || 'Jogador'}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>OVR {p?.overall ?? '—'} · ⚡{p?.energy??100}%</Typography></Box><Typography sx={{color:sel?C.yellow:C.txt3,fontSize:'0.75rem'}}>{sel?'✕':'↕'}</Typography></Box>;})}
        </> : <>
          <Box sx={{bgcolor:`${C.red}0d`,border:`1.5px solid ${C.red}50`,borderRadius:'10px',p:1,mb:1}}><Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:900,letterSpacing:0.5,mb:0.5}}>SAI:</Typography><Box sx={{display:'flex',alignItems:'center',gap:0.8}}><Box sx={{width:26,height:26,borderRadius:'5px',bgcolor:posCol(selPlayer.position)+'25',border:`1px solid ${posCol(selPlayer.position)}50`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Typography sx={{color:posCol(selPlayer.position),fontSize:'0.48rem',fontWeight:900}}>{selPlayer.position || '?'}</Typography></Box><Box sx={{flex:1}}><Typography sx={{color:C.txt1,fontWeight:900,fontSize:'0.8rem',lineHeight:1}}>{selPlayer.name || 'Jogador'}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>OVR {selPlayer.overall ?? '—'} · ⚡{selPlayer.energy??100}%</Typography></Box><Box component="button" type="button" onClick={()=>setSelectedStarter?.(null)} sx={{bgcolor:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:'6px',px:0.9,py:0.45,cursor:'pointer','&:active':{opacity:0.7},flexShrink:0,fontFamily:'inherit'}}><Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.58rem'}}>✕ Cancelar</Typography></Box></Box></Box>
          <Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:900,letterSpacing:0.5,mb:0.6}}>ENTRA:</Typography>
          {selReserves.length===0 ? <Box sx={{textAlign:'center',py:1.5,bgcolor:C.cardAlt,borderRadius:'8px'}}><Typography sx={{color:C.txt3,fontSize:'0.65rem',fontStyle:'italic'}}>Sem reserva disponível para {selPlayer.adaptedPosition || selPlayer.position || 'a posição'}</Typography></Box> : selReserves.map(res=><Box component="button" type="button" key={String(res?.id)} onClick={()=>doSub(res)} sx={{width:'100%',display:'flex',alignItems:'center',gap:0.8,mb:0.6,bgcolor:`${C.green}0d`,border:`1.5px solid ${C.green}40`,borderRadius:'8px',px:1.2,py:0.85,cursor:'pointer','&:active':{bgcolor:`${C.green}20`,transform:'scale(0.98)'},transition:'all 0.12s',fontFamily:'inherit',textAlign:'left'}}><Box sx={{width:30,height:30,borderRadius:'7px',bgcolor:C.green+'18',border:`1px solid ${C.green}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Typography sx={{color:C.green,fontSize:'0.7rem',fontWeight:900}}>{res?.overall ?? '—'}</Typography></Box><Box sx={{flex:1,minWidth:0}}><Typography sx={{color:C.green,fontWeight:900,fontSize:'0.78rem',lineHeight:1}}>{res?.name || 'Jogador'}</Typography><Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>{res?.position || '?'} · ⚡{res?.energy??100}%</Typography></Box><Typography sx={{color:C.green,fontSize:'1rem',fontWeight:900}}>↑</Typography></Box>)}
        </>}
      </Box>
    </Dialog>
  );
};

export default SubstitutionDialog;
