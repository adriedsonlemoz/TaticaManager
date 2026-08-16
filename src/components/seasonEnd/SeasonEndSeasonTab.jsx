import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';
import { SeasonEndSectionTitle, SeasonEndStatCard } from './SeasonEndPrimitives.jsx';

export default function SeasonEndSeasonTab({ vm, color, formatMoney }) {
  const scorer = vm.squad.topScorer;
  const assister = vm.squad.topAssist;
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.7, mb: 1.2 }}>
        <SeasonEndStatCard label="VITÓRIAS" value={vm.league.wins} color={D.green} />
        <SeasonEndStatCard label="EMPATES" value={vm.league.draws} color={D.gold} />
        <SeasonEndStatCard label="DERROTAS" value={vm.league.losses} color={D.red} />
        <SeasonEndStatCard label="SALDO GOL" value={`${vm.league.goalDifference >= 0 ? '+' : ''}${vm.league.goalDifference}`} color={vm.league.goalDifference >= 0 ? D.green : D.red} />
      </Box>

      <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', px: 1.4, py: 1, mb: 1.2 }}>
        <SeasonEndSectionTitle>GOLS DA TEMPORADA</SeasonEndSectionTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography sx={{ color: D.green, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1 }}>{vm.league.goalsFor}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>MARCADOS</Typography>
          </Box>
          <Box sx={{ width: 1, bgcolor: D.border }} />
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography sx={{ color: D.red, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1 }}>{vm.league.goalsAgainst}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>SOFRIDOS</Typography>
          </Box>
        </Box>
      </Box>

      {scorer && (
        <Box sx={{ bgcolor: D.card, border: `1px solid ${D.gold}30`, borderRadius: '10px', px: 1.4, py: 1, mb: 1.2 }}>
          <SeasonEndSectionTitle>🌟 DESTAQUES DA TEMPORADA</SeasonEndSectionTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: D.cardAlt, border: `1.5px solid ${D.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Typography sx={{ color: D.gold, fontWeight: 900, fontSize: '1rem' }}>{scorer.overall}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: D.txt1, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scorer.name}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.6rem', fontWeight: 700 }}>{scorer.position} · Artilheiro</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: D.gold, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>{scorer.goals || 0}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>GOLS</Typography>
            </Box>
          </Box>
          {assister && assister.id !== scorer.id && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, pt: 0.8, borderTop: `1px solid ${D.border}` }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: D.cardAlt, border: `1px solid ${D.blue}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ color: D.blue, fontWeight: 900, fontSize: '0.85rem' }}>{assister.overall}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: D.txt1, fontWeight: 700, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assister.name}</Typography>
                <Typography sx={{ color: D.txt3, fontSize: '0.55rem' }}>Garçom da temporada</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: D.blue, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{assister.assists || 0}</Typography>
                <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>ASSIST.</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ bgcolor: `${color}0d`, border: `1px solid ${color}35`, borderRadius: '10px', px: 1.4, py: 1 }}>
        <SeasonEndSectionTitle>PRÓXIMA TEMPORADA</SeasonEndSectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.7 }}>
          {[
            { label: 'TEMPORADA', value: `Nº ${vm.nextSeason.season}`, color: D.txt1 },
            { label: 'SÉRIE', value: `Série ${vm.nextSeason.serie}`, color },
            { label: 'JOGADORES', value: vm.nextSeason.playerCount, color: D.txt1 },
            { label: 'CAIXA', value: formatMoney(vm.nextSeason.money), color: D.green },
          ].map((stat) => (
            <Box key={stat.label} sx={{ bgcolor: D.card, borderRadius: '8px', p: 0.9, textAlign: 'center' }}>
              <Typography sx={{ color: stat.color, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>{stat.value}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.15 }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
