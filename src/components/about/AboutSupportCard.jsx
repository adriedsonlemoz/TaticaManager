import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { PIX_KEY } from '../../config/support.js';

const AboutSupportCard = ({ theme }) => {
  const C = theme;
  const [copyState, setCopyState] = React.useState('idle');
  const timerRef = React.useRef(null);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const copyPix = async () => {
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error('Clipboard API indisponível');
      await globalThis.navigator.clipboard.writeText(PIX_KEY);
      setCopyState('copied');
    } catch (error) {
      console.warn('Não foi possível copiar a chave PIX:', error);
      setCopyState('error');
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <Paper sx={{ p: 1.8, mb: 2, bgcolor: C.card, border: `2px dashed ${C.green}`, borderRadius: '12px' }}>
      <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.82rem', mb: 0.4 }}>☕ Apoie o projeto!</Typography>
      <Typography sx={{ color: C.txt2, fontSize: '0.7rem', mb: 1.2 }}>Gostou do Tática Manager? Um PIX ajuda muito a continuar o desenvolvimento.</Typography>
      <Box sx={{ bgcolor: 'rgba(34,197,94,0.08)', border: `1px solid ${C.border}`, borderRadius: '8px', px: 1.2, py: 0.8, mb: 1 }}>
        <Typography sx={{ color: C.green, fontWeight: 700, fontSize: '0.82rem', wordBreak: 'break-all' }}>{PIX_KEY}</Typography>
      </Box>
      <Button variant="contained" color="success" fullWidth onClick={copyPix} sx={{ fontWeight: 900, borderRadius: '8px', py: 1 }}>
        {copyState === 'copied' ? '✅ Copiado!' : copyState === 'error' ? '⚠️ Não foi possível copiar' : '📋 Copiar Chave PIX'}
      </Button>
    </Paper>
  );
};

export default AboutSupportCard;
