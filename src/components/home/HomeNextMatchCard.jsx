import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import HomeSectionTitle from './HomeSectionTitle.jsx';
import { HOME_THEME, getSerieColor } from './homeTheme.js';

const teamLabel = (team) => team?.name || 'Adversário';
const standingLabel = (summary) => summary?.position > 0 ? `${summary.position}º · ${summary.points || 0}pts` : '—';

function TeamSide({ team, summary, color }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Box sx={{
        width: 50, height: 50, borderRadius: '14px', bgcolor: `${color}12`, border: `1.5px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {team?.name
          ? React.createElement(TeamIcon, { name: team.name, size: 36 })
          : <Typography sx={{ fontSize: '1.5rem' }}>⚽</Typography>}
      </Box>
      <Typography sx={{
        color: HOME_THEME.ink, fontWeight: 900, fontSize: '0.62rem', textAlign: 'center', lineHeight: 1.1,
        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {teamLabel(team)}
      </Typography>
      <Typography sx={{ color: HOME_THEME.ink3, fontSize: '0.48rem', fontWeight: 700 }}>
        {standingLabel(summary)}
      </Typography>
    </Box>
  );
}

export default function HomeNextMatchCard({ viewModel, onNavigate }) {
  const { season, nextMatch, recentForm } = viewModel;
  const serieColor = getSerieColor(viewModel.clubSummary.serie);

  return (
    <Box sx={{ px: 2, mb: 1.5 }}>
      <HomeSectionTitle>PRÓXIMA PARTIDA</HomeSectionTitle>

      {season.seasonOver ? (
        <Box component="button" type="button" onClick={() => onNavigate('table')} sx={{
          width: '100%', bgcolor: HOME_THEME.card, border: `1.5px solid ${HOME_THEME.border}`, borderRadius: '14px',
          px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer', textAlign: 'left',
          boxShadow: HOME_THEME.shadow, font: 'inherit',
        }}>
          <Typography sx={{ fontSize: '2rem' }}>🏁</Typography>
          <Box>
            <Typography sx={{ color: HOME_THEME.grass, fontWeight: 900, fontSize: '0.9rem' }}>Temporada Encerrada!</Typography>
            <Typography sx={{ color: HOME_THEME.ink3, fontSize: '0.6rem', fontWeight: 700 }}>Ver tabela final →</Typography>
          </Box>
        </Box>
      ) : nextMatch ? (
        <Box component="button" type="button" onClick={() => onNavigate('next_match')} sx={{
          width: '100%', p: 0, bgcolor: HOME_THEME.card, border: `2px solid ${serieColor}40`, borderRadius: '16px',
          overflow: 'hidden', cursor: 'pointer', boxShadow: `0 4px 24px ${serieColor}15`, font: 'inherit', textAlign: 'initial',
          '&:active': { transform: 'scale(0.98)' }, transition: 'transform .15s',
        }}>
          <Box sx={{
            background: `linear-gradient(90deg, ${serieColor}, ${serieColor}cc)`, px: 1.5, py: 0.55,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1,
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5, textAlign: 'left' }}>
              {nextMatch.competitionLabel}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.5rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {nextMatch.isUserHome ? '🏠 Mandante' : '✈️ Visitante'}
            </Typography>
          </Box>

          {nextMatch.skippedSlots > 0 && (
            <Box sx={{ px: 1.5, py: 0.45, bgcolor: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
              <Typography sx={{ color: '#92400e', fontSize: '0.48rem', fontWeight: 800 }}>
                ⏭️ {nextMatch.skippedSlots} compromisso(s) de Copa inativo(s) serão ignorados automaticamente.
              </Typography>
            </Box>
          )}

          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TeamSide
              team={nextMatch.displayHome}
              summary={nextMatch.displayHome?.isPlayer ? nextMatch.userSummary : nextMatch.opponentSummary}
              color={serieColor}
            />

            <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
              <Box sx={{ bgcolor: HOME_THEME.cardAlt, border: `1.5px solid ${HOME_THEME.border}`, borderRadius: '12px', px: 1.2, py: 0.6 }}>
                <Typography sx={{ color: HOME_THEME.grass, fontWeight: 900, fontSize: '1rem', letterSpacing: 3, fontFamily: '"Cinzel",serif' }}>VS</Typography>
              </Box>
              {nextMatch.matchInfo?.fullStr && (
                <Typography sx={{ color: HOME_THEME.ink3, fontSize: '0.44rem', fontWeight: 700, mt: 0.5 }}>
                  {nextMatch.matchInfo.fullStr}
                </Typography>
              )}
            </Box>

            <TeamSide
              team={nextMatch.displayAway}
              summary={nextMatch.displayAway?.isPlayer ? nextMatch.userSummary : nextMatch.opponentSummary}
              color={HOME_THEME.ink3}
            />
          </Box>

          <Box sx={{
            borderTop: `1px solid ${serieColor}20`, px: 2, py: 0.8,
            background: `linear-gradient(90deg, ${serieColor}08, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography sx={{ color: serieColor, fontWeight: 900, fontSize: '0.72rem', fontFamily: '"Cinzel",serif' }}>
              ▶ {nextMatch.type === 'cup' ? 'JOGAR COPA' : 'IR PARA A PARTIDA'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.4 }} aria-label={`Forma recente: ${recentForm.join(', ') || 'sem partidas'}`}>
              {recentForm.slice(0, 5).map((result, index) => (
                <Box key={`${result}-${index}`} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: result === 'V' ? HOME_THEME.grass : result === 'D' ? HOME_THEME.red : HOME_THEME.yellow }} />
              ))}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{
          bgcolor: HOME_THEME.card, border: `1.5px solid ${HOME_THEME.border}`, borderRadius: '14px', px: 2, py: 1.5,
          boxShadow: HOME_THEME.shadow,
        }}>
          <Typography sx={{ color: HOME_THEME.ink2, fontWeight: 900, fontSize: '0.75rem' }}>Nenhuma partida pendente encontrada.</Typography>
          <Typography sx={{ color: HOME_THEME.ink3, fontSize: '0.55rem', fontWeight: 700, mt: 0.2 }}>Consulte o calendário para revisar a temporada.</Typography>
        </Box>
      )}
    </Box>
  );
}
