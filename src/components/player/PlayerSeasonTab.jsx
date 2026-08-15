import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { FatigueEngine } from '../../engines/engine_fatigue.js';

const FILTERS = [
  { id: 'goals', label: 'Gols' },
  { id: 'assists', label: 'Assists' },
  { id: 'minutes', label: 'Minutos' },
  { id: 'energy', label: 'Físico' },
  { id: 'contract', label: 'Contrato' },
];

export default function PlayerSeasonTab({ player, formatMoney, onRenew }) {
  const C = THEME;
  const [filterStat, setFilterStat] = React.useState('goals');
  const energy = player.energy ?? 100;
  const contract = player.contract ?? 1;
  const goals = player.seasonGoals || 0;
  const energyColor = energy >= 75 ? C.primary : energy >= 50 ? '#f0a500' : C.red;
  const contractColor = contract <= 0 ? C.red : contract === 1 ? '#f0a500' : C.primary;
  const overallPenalty = FatigueEngine.getOverallPenalty?.(energy) || 0;

  return (
    <Box sx={{ p: 2 }}>
      {player.previousTeam && (
        <Box sx={{ bgcolor: `${C.blue}12`, border: `1px solid ${C.blue}30`, borderRadius: '10px', p: 1.2, mb: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.2rem' }}>🔄</Typography>
          <Box>
            <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.5 }}>CLUBE ANTERIOR</Typography>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.82rem' }}>{player.previousTeam}</Typography>
            {player.previousTeamGoals != null && (
              <Typography sx={{ color: C.txt2, fontSize: '0.6rem', fontWeight: 700 }}>
                ⚽ {player.previousTeamGoals} gols · 🅰️ {player.previousTeamAssists || 0} assists
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 0.5, mb: 1.2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        {FILTERS.map((filter) => (
          <Box
            key={filter.id}
            onClick={() => setFilterStat(filter.id)}
            sx={{
              flexShrink: 0,
              px: 1.2,
              py: 0.4,
              borderRadius: '20px',
              cursor: 'pointer',
              bgcolor: filterStat === filter.id ? C.primary : C.cardAlt,
              border: `1px solid ${filterStat === filter.id ? C.primary : C.border}`,
            }}
          >
            <Typography sx={{ color: filterStat === filter.id ? '#000' : C.txt2, fontWeight: 900, fontSize: '0.58rem' }}>{filter.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, mb: 1.5 }}>
        {[
          { label: 'GOLS', value: goals, color: goals > 0 ? C.primary : C.txt2 },
          { label: 'ASSIST.', value: player.assists || 0, color: (player.assists || 0) > 0 ? C.primary : C.txt2 },
          { label: 'MINUTOS', value: player.minutesPlayed || 0, color: C.txt1 },
          { label: 'CONTRATO', value: contract <= 0 ? 'Venc.' : `${contract}T`, color: contractColor },
        ].map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', py: 1.5, textAlign: 'center' }}>
            <Typography sx={{ color: stat.color, fontWeight: 900, fontSize: '1.2rem', lineHeight: 1 }}>{stat.value}</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.52rem', fontWeight: 700, mt: 0.3 }}>{stat.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, mb: 1.2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.7rem' }}>Energia</Typography>
          <Typography sx={{ color: energyColor, fontWeight: 900, fontSize: '0.7rem' }}>{energy}%</Typography>
        </Box>
        <Box sx={{ height: 8, bgcolor: C.bg, borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: energyColor, borderRadius: 4, transition: 'width 0.4s' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
          <Typography sx={{ color: C.txt3, fontSize: '0.58rem' }}>
            {energy >= 80 ? 'Em forma' : energy >= 65 ? 'Levemente cansado' : energy >= 50 ? 'Fatigado' : energy >= 30 ? 'Muito cansado' : 'Exausto'}
          </Typography>
          {overallPenalty > 0 && (
            <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem', bgcolor: `${C.red}12`, px: 0.6, py: 0.1, borderRadius: '4px' }}>
              -{overallPenalty} OVR efetivo
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ bgcolor: contract <= 1 ? `${contractColor}15` : C.cardAlt, border: `1px solid ${contractColor}40`, borderRadius: '10px', p: 1.2, mb: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.68rem' }}>Contrato</Typography>
          <Typography sx={{ color: contractColor, fontWeight: 900, fontSize: '0.8rem' }}>
            {contract <= 0 ? 'Encerrado — renovar ou liberar' : contract === 1 ? 'Último ano' : `${contract} temporadas restantes`}
          </Typography>
        </Box>
        {contract <= 1 && (
          <Box onClick={onRenew} sx={{ bgcolor: C.primary, borderRadius: '8px', px: 1, py: 0.5, cursor: 'pointer' }}>
            <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.65rem' }}>Renovar</Typography>
          </Box>
        )}
      </Box>

      {player.injuryHistory?.length > 0 && (
        <Box sx={{ bgcolor: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: '10px', p: 1.2, mb: 1.2 }}>
          <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 0.8, mb: 0.8 }}>🏥 HISTÓRICO DE LESÕES</Typography>
          {player.injuryHistory.slice(-4).reverse().map((injury, index) => (
            <Box key={`${injury.round}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, borderBottom: index < Math.min(player.injuryHistory.length, 4) - 1 ? `1px solid ${C.red}15` : 'none', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.6rem' }}>
                  {injury.type}
                  {injury.recaida && <Typography component="span" sx={{ color: C.orange, fontSize: '0.52rem', ml: 0.5 }}>(recaída)</Typography>}
                </Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.52rem' }}>Rodada {injury.round} · {injury.duration} jogo{injury.duration > 1 ? 's' : ''}</Typography>
              </Box>
              <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.6rem' }}>-{injury.duration} rod.</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.2 }}>
        {[
          { label: 'OVR Atual', value: player.overall, color: C.primary },
          { label: 'Valor de Mercado', value: formatMoney ? formatMoney(player.value || 0) : player.value, color: C.txt1 },
          { label: 'Posição / Idade', value: `${player.position} · ${player.age} anos`, color: C.txt1 },
        ].map((row, index, rows) => (
          <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: index < rows.length - 1 ? `1px solid ${C.bord2}` : 'none' }}>
            <Typography sx={{ color: C.txt2, fontSize: '0.7rem', fontWeight: 700 }}>{row.label}</Typography>
            <Typography sx={{ color: row.color, fontWeight: 900, fontSize: '0.7rem' }}>{row.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
