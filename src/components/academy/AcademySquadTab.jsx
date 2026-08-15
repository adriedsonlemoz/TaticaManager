import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import AcademyProspectCard from './AcademyProspectCard.jsx';
import { ACADEMY_ACCENT } from './academyPresentation.js';

export default function AcademySquadTab({
  viewModel,
  filter,
  onFilterChange,
  selectedProspectId,
  onToggleProspect,
  onRequestPromote,
  onRequestDispense,
  formatMoney,
}) {
  const C = THEME;
  const { stats, filteredProspects, filters, promoteAge } = viewModel;

  return (
    <>
      {stats.readyCount > 0 && (
        <Box sx={{ bgcolor: `${C.green}10`, border: `1.5px solid ${C.green}50`, borderRadius: '12px', px: 1.3, py: 1, mb: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${C.green}20`, border: `1.5px solid ${C.green}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>🌟</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.8rem' }}>
                {stats.readyCount} jogador{stats.readyCount > 1 ? 'es' : ''} pronto{stats.readyCount > 1 ? 's' : ''} para o profissional!
              </Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.56rem', fontWeight: 700 }}>Toque no garoto e promova ao elenco principal.</Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Box aria-label="Filtros da categoria de base" sx={{ display: 'flex', gap: 0.5, mb: 1.2, overflowX: 'auto', pb: 0.3 }}>
        {filters.map((item) => (
          <Box
            component="button"
            type="button"
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => onFilterChange(item.id)}
            sx={{
              flexShrink: 0, bgcolor: filter === item.id ? ACADEMY_ACCENT : C.card,
              border: `1px solid ${filter === item.id ? ACADEMY_ACCENT : C.border}`, borderRadius: '20px', px: 1, py: 0.35,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.4,
              boxShadow: filter === item.id ? '0 0 10px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.15s',
            }}
          >
            <Typography sx={{ color: filter === item.id ? '#fff' : C.txt2, fontWeight: 900, fontSize: '0.58rem' }}>{item.label}</Typography>
            <Box sx={{ bgcolor: filter === item.id ? 'rgba(255,255,255,0.2)' : C.cardAlt, borderRadius: '10px', px: 0.5, py: 0.05 }}>
              <Typography sx={{ color: filter === item.id ? '#fff' : C.txt3, fontWeight: 900, fontSize: '0.5rem' }}>{item.count}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {filteredProspects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1, opacity: 0.3 }}>🏟️</Typography>
          <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.9rem' }}>{filter === 'all' ? 'Academia vazia.' : 'Nenhum garoto nesse filtro.'}</Typography>
          <Typography sx={{ color: C.txt3, fontSize: '0.7rem', mt: 0.5 }}>Novos garotos chegam na renovação da temporada.</Typography>
        </Box>
      ) : filteredProspects.map((prospect) => (
        <AcademyProspectCard
          key={prospect.id}
          prospect={prospect}
          selected={selectedProspectId === prospect.id}
          promoteAge={promoteAge}
          formatMoney={formatMoney}
          onToggle={onToggleProspect}
          onRequestPromote={onRequestPromote}
          onRequestDispense={onRequestDispense}
        />
      ))}

      {viewModel.prospects.length > 0 && (
        <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', p: 1.3, mt: 0.5 }}>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.56rem', letterSpacing: 0.8, mb: 0.8 }}>📊 ESTATÍSTICAS DA BASE</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0.7 }}>
            {[
              { label: 'Valor Total', value: formatMoney(stats.totalValue), color: C.green },
              { label: 'Melhor OVR', value: stats.bestOverall || '—', color: ACADEMY_ACCENT },
              { label: 'Maior Potencial', value: stats.bestPotential || '—', color: C.yellow },
              { label: 'Posição +comum', value: stats.mostCommonPosition, color: C.blue },
            ].map((item) => (
              <Box key={item.label} sx={{ bgcolor: C.cardAlt, borderRadius: '8px', px: 1, py: 0.7, border: `1px solid ${C.border}` }}>
                <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1 }}>{item.value}</Typography>
                <Typography sx={{ color: C.txt3, fontWeight: 700, fontSize: '0.48rem', mt: 0.15 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}
