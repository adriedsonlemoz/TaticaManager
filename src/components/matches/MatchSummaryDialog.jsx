import React from 'react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { SMR_parseEvent } from '../../helpers.js';
import { C, N } from './matchesTheme.js';

const MatchSummaryDialog = ({ match, onClose }) => (
  <Dialog open={Boolean(match)} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: N.card, border: `2px solid ${N.accent}`, borderRadius: '16px', m: 2, overflow: 'hidden' } }}>
    <Box sx={{ p: 0 }}>
      <Box sx={{ bgcolor: N.cardAlt, px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${N.border}` }}>
        <Box>
          <Typography sx={{ color: N.accent, fontWeight: 900, fontSize: '0.82rem', letterSpacing: 1.5 }}>SÚMULA DA PARTIDA</Typography>
          {match?.cupLabel && (
            <Typography sx={{ color: N.teal, fontSize: '0.58rem', fontWeight: 700, mt: 0.2 }}>{match.cupLabel} · {match.legLabel}</Typography>
          )}
        </Box>
        <Box onClick={onClose} sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: C.bgDark, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: N.txt2, fontSize: '0.9rem', fontWeight: 900, '&:active': { bgcolor: C.border } }}>✕</Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.8, bgcolor: C.ink }}>
        <Typography sx={{ fontWeight: 900, color: match?.home?.isPlayer ? N.accent : C.bg, textAlign: 'right', flex: 1, fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{match?.home?.name}</Typography>
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.85)', border: `2px solid ${N.accent}60`, borderRadius: '10px', px: 1.8, py: 0.7, mx: 1.5, flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: N.accent, fontFamily: 'monospace', letterSpacing: 3 }}>{match?.result}</Typography>
        </Box>
        <Typography sx={{ fontWeight: 900, color: match?.away?.isPlayer ? N.accent : C.bg, flex: 1, fontSize: '0.8rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{match?.away?.name}</Typography>
      </Box>

      <Box sx={{ maxHeight: '50vh', overflowY: 'auto', px: 1.5, py: 1 }}>
        {match?.events?.length > 0 ? match.events.map((event, index) => {
          const parsed = SMR_parseEvent(event);
          const isGoal = parsed.type === 'goal';
          const isRed = parsed.type === 'red';
          const isYellow = parsed.type === 'yellow';
          const isEnd = parsed.type === 'end';
          const color = isGoal ? N.accent : isRed ? N.red : isYellow ? N.gold : isEnd ? N.green : N.txt2;
          const minuteMatch = event.match(/^(\d+)'/);
          return (
            <Box key={`${index}-${event}`} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.7, borderBottom: `1px solid ${N.border}40` }}>
              <Typography sx={{ fontSize: '0.62rem', color: N.txt3, fontWeight: 900, fontFamily: 'monospace', minWidth: 28, pt: 0.1, flexShrink: 0 }}>
                {minuteMatch?.[1] ? `${minuteMatch[1]}'` : ''}
              </Typography>
              <Typography sx={{ flex: 1, fontSize: '0.72rem', color, fontWeight: isGoal || isRed ? 900 : 700, lineHeight: 1.45 }}>
                {event.replace(/^\d+' /, '')}
              </Typography>
            </Box>
          );
        }) : (
          <Typography sx={{ textAlign: 'center', color: N.txt3, fontStyle: 'italic', py: 3 }}>Súmula não disponível.</Typography>
        )}
      </Box>

      <Box sx={{ p: 1.5, borderTop: `1px solid ${N.border}` }}>
        <Button fullWidth variant="contained" onClick={onClose} sx={{ bgcolor: N.accent, color: '#fff', fontWeight: 900, py: 1.2, borderRadius: '10px', fontSize: '0.78rem', letterSpacing: 1, '&:hover': { bgcolor: C.primaryDim } }}>
          FECHAR
        </Button>
      </Box>
    </Box>
  </Dialog>
);

export default MatchSummaryDialog;
