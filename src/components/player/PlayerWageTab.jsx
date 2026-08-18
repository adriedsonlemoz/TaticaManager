import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { validateWage } from '../../engines/player/playerProfileService.js';
import { calculateRenewalCost } from '../../engines/cpu/cpuContracts.js';

const QUICK_WAGES = [
  { pct: 0.03, label: 'Baixo' },
  { pct: 0.05, label: 'Padrão' },
  { pct: 0.07, label: 'Alto' },
  { pct: 0.10, label: 'Estrela' },
];

export default function PlayerWageTab({ player, allPlayers, formatMoney, onUpdateWage, onRenewContract, onClose, onSaved }) {
  const C = THEME;
  const [wageInput, setWageInput] = React.useState(String(player.wage || 0));
  const [wageError, setWageError] = React.useState('');

  React.useEffect(() => {
    setWageInput(String(player.wage || 0));
    setWageError('');
  }, [player.id, player.wage]);

  const handleSave = () => {
    const parsed = validateWage(wageInput);
    if (parsed.error) {
      setWageError(parsed.error);
      return;
    }
    const currentWage = Math.max(0, Number(player.wage) || 0);
    if (parsed.value < currentWage) {
      setWageError('O salário vigente não pode ser reduzido durante o contrato atual.');
      return;
    }
    const totalWage = (allPlayers || []).reduce((sum, candidate) => (
      sum + (String(candidate.id) === String(player.id) ? parsed.value : (Number(candidate.wage) || 0))
    ), 0);
    void totalWage;
    onUpdateWage(player.id, parsed.value);
    setWageError('');
    onSaved?.();
  };

  const renewalCost = calculateRenewalCost(player);
  const canRenew = (Number(player.contract) || 0) <= 1;
  const handleRenew = () => {
    if (!canRenew) return;
    const renewed = onRenewContract?.(player.id);
    if (renewed) onClose();
  };

  const renewalLabel = canRenew
    ? `🤝 RENOVAR CONTRATO · ${formatMoney(renewalCost)}`
    : '✅ CONTRATO VÁLIDO';

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ bgcolor: C.bgCard, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, mb: 1.5, textAlign: 'center' }}>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>SALÁRIO ATUAL</Typography>
        <Typography sx={{ fontWeight: 900, color: C.primary, fontSize: '1.4rem' }}>{formatMoney(player.wage || 0)}</Typography>
        <Typography sx={{ color: C.txt2, fontSize: '0.6rem' }}>por partida</Typography>
      </Box>

      <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1, mb: 0.5 }}>REAJUSTE RÁPIDO</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 1.5 }}>
        {QUICK_WAGES.map(({ pct, label }) => {
          const suggestion = Math.floor(player.value * pct);
          const current = Number.parseInt(wageInput, 10) === suggestion;
          return (
            <Box
              key={pct}
              onClick={() => { setWageInput(String(suggestion)); setWageError(''); }}
              sx={{ p: 0.8, borderRadius: '8px', cursor: 'pointer', textAlign: 'center', bgcolor: current ? C.primary : C.card, border: `1.5px solid ${current ? C.prim2 : C.bord2}`, color: current ? '#fff' : C.txt1, transition: 'all 0.1s' }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: '0.75rem' }}>{formatMoney(suggestion)}</Typography>
              <Typography sx={{ fontSize: '0.55rem', opacity: 0.8 }}>{label}</Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: wageError ? 0.5 : 1 }}>
        <input
          type="number"
          min="0"
          max="5000000"
          value={wageInput}
          onChange={(event) => { setWageInput(event.target.value); setWageError(''); }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: `2px solid ${wageError ? C.red : C.border}`,
            background: C.cardAlt,
            color: C.txt1,
            fontSize: '0.9rem',
            fontWeight: 900,
            outline: 'none',
            fontFamily: 'Nunito, sans-serif',
          }}
        />
        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: C.primary, fontWeight: 900, px: 2, borderRadius: '8px' }}>SALVAR</Button>
      </Box>
      {wageError && <Typography sx={{ color: C.red, fontWeight: 700, fontSize: '0.65rem', mb: 1 }}>{wageError}</Typography>}

      <Button fullWidth variant="outlined" disabled={!canRenew} onClick={handleRenew} sx={{ mt: 1, py: 1.2, fontWeight: 900, color: C.green, borderColor: C.green, borderRadius: '8px', '&:hover': { bgcolor: 'rgba(50,168,82,0.1)' } }}>
        {renewalLabel}
      </Button>
    </Box>
  );
}
