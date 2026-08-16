import React from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import { TeamIcon } from '../../../data/database_branding.js';

export default function ClubsMarketTab({ leagueFilter, setLeagueFilter, displayClubs, selectedClubId, setSelectedClubId, selectedClub, cpuRoster, renderPlayerCard, setSelected, C }) {
  const close = () => { setSelectedClubId(null); setSelected(null); };
  return (
    <Box>
      <Box sx={{ display:'flex', mb:1.5, bgcolor:C.cardAlt, borderRadius:'9px', p:0.4, border:`1px solid ${C.border}` }}>
        {['A','B','C','D'].map((serie) => (
          <Box component="button" type="button" key={serie} onClick={() => setLeagueFilter(serie)} sx={{ flex:1, py:0.8, textAlign:'center', borderRadius:'7px', cursor:'pointer', bgcolor:leagueFilter === serie ? C.teal : 'transparent', border:0 }}>
            <Typography sx={{ color:leagueFilter === serie ? '#000' : C.txt2, fontWeight:900, fontSize:'0.75rem' }}>SÉRIE {serie}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(74px,1fr))', gap:1.2, pb:2 }}>
        {displayClubs.map((team) => (
          <Box component="button" type="button" key={team.id} onClick={() => setSelectedClubId(team.id)} sx={{ p:1.1, borderRadius:'12px', cursor:'pointer', bgcolor:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', '&:active':{transform:'scale(0.93)'}, transition:'all 0.12s' }}>
            <TeamIcon name={team?.name || '?'} size={44}/>
            <Typography sx={{ color:C.txt1, fontWeight:800, fontSize:'0.58rem', mt:0.7, textAlign:'center', lineHeight:1.1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{team?.name || '?'}</Typography>
          </Box>
        ))}
      </Box>

      <Dialog open={Boolean(selectedClubId)} onClose={close} fullWidth maxWidth="sm"
        PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.teal}`, maxHeight:'85vh', m:2 } }}
        BackdropProps={{ sx:{ backdropFilter:'blur(4px)', bgcolor:'rgba(0,0,0,0.55)' } }}>
        <Box sx={{ px:1.8, py:1.2, bgcolor:C.teal, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
            <TeamIcon name={selectedClub?.name || '?'} size={32}/>
            <Box>
              <Typography sx={{ color:'#000', fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{selectedClub?.name || 'Clube'}</Typography>
              <Typography sx={{ color:'rgba(0,0,0,0.6)', fontSize:'0.6rem', fontWeight:700 }}>ELENCO · {cpuRoster.length} jog.</Typography>
            </Box>
          </Box>
          <Box component="button" type="button" aria-label="Fechar elenco do clube" onClick={close} sx={{ cursor:'pointer', color:'rgba(0,0,0,0.7)', fontSize:'1.3rem', fontWeight:900, bgcolor:'transparent', border:0 }}>✕</Box>
        </Box>
        <Box sx={{ p:1.4, overflowY:'auto' }}>
          {cpuRoster.length > 0 ? cpuRoster.map(renderPlayerCard) : (
            <Box sx={{ textAlign:'center', py:5 }}>
              <Typography sx={{ fontSize:'2.5rem', mb:1, opacity:0.4 }}>🚷</Typography>
              <Typography sx={{ fontWeight:700, color:C.txt2, fontSize:'0.85rem' }}>Elenco indisponível.</Typography>
            </Box>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
