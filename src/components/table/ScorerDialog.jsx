import React from 'react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { ovrColor, posColor } from '../../helpers.js';
import { getScorerPurchaseStatus } from '../../engines/table/tableViewModel.js';

const C = THEME;

const fallbackFormatMoney = value => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`;

const ScorerDialog = ({ player, gameData, buyPlayer, formatMoney, onBuy, onClose }) => {
  const open = Boolean(player);
  if (!open) return null;

  const pc = posColor(player.position);
  const purchase = getScorerPurchaseStatus(gameData, player);
  const fmt = formatMoney || fallbackFormatMoney;
  const money = Number(gameData.club?.money) || 0;
  const budget = Number(gameData.club?.transferBudget) || 0;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ bgcolor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
        <Box sx={{ background: `linear-gradient(135deg, ${C.bgDark}, ${C.bgCardAlt})`, px: 2, py: 2, textAlign: 'center' }}>
          <Box sx={{ bgcolor: pc.bg, color: pc.text, display: 'inline-block', borderRadius: '6px', px: 1, py: 0.2, fontSize: '0.65rem', fontWeight: 900, mb: 0.5 }}>
            {player.position}
          </Box>
          <Typography sx={{ fontFamily: '"Nunito",sans-serif', fontWeight: 900, color: '#fff', fontSize: '1.2rem', lineHeight: 1.2 }}>
            {player.name}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', mt: 0.3 }}>
            {player.team}
          </Typography>
        </Box>

        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1.5 }}>
            {[
              { label: 'OVR', val: player.overall || '?', color: ovrColor(player.overall || 70) },
              { label: 'IDADE', val: `${player.age || '?'}a`, color: C.ink },
              { label: 'GOLS', val: player.goals, color: C.zGreen },
            ].map(stat => (
              <Box key={stat.label} sx={{ textAlign: 'center', bgcolor: C.bgCardAlt, borderRadius: '8px', py: 1, border: `1px solid ${C.border}` }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: stat.color, lineHeight: 1 }}>{stat.val}</Typography>
                <Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color: C.ink3, letterSpacing: 0.5 }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '8px', p: 1.2, mb: 1.5, border: `1px solid ${C.border}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#8b949e', fontWeight: 700 }}>Valor de mercado</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: '#22c55e' }}>{fmt(player.value || 0)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#8b949e', fontWeight: 700 }}>Salário/rodada</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: '#f85149' }}>{fmt(player.wage || 0)}</Typography>
            </Box>
          </Box>

          <Box sx={{ px: 0.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#8b949e', fontWeight: 700 }}>Seu saldo:</Typography>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 900, color: money >= (player.value || 0) ? C.zGreen : C.zRed }}>
                {fmt(money)}
              </Typography>
            </Box>
            {budget > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#8b949e', fontWeight: 700 }}>Orçamento de transferências:</Typography>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 900, color: budget >= (player.value || 0) ? C.zGreen : C.zRed }}>
                  {fmt(budget)}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={onClose} sx={{ flex: 1, borderColor: '#1a3a22', color: '#8b949e', fontWeight: 900, borderRadius: '8px' }}>
              Fechar
            </Button>
            {purchase.alreadyInSquad ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(46,139,69,0.1)', borderRadius: '8px', border: `1px solid ${C.zGreen}` }}>
                <Typography sx={{ color: C.zGreen, fontWeight: 900, fontSize: '0.72rem' }}>{purchase.label}</Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                disabled={!purchase.canBuy || !buyPlayer}
                onClick={() => onBuy(player)}
                sx={{ flex: 1, bgcolor: C.fieldDark, color: '#fff', fontWeight: 900, borderRadius: '8px', '&:hover': { bgcolor: C.headerBg }, '&:disabled': { bgcolor: 'rgba(0,0,0,0.12)' } }}
              >
                {!buyPlayer && purchase.canBuy ? 'Mercado indisponível' : purchase.label}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ScorerDialog;
