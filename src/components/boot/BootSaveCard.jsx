import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { getTeamBranding } from '../../data/teamBranding.js';
import BootRoundBar from './BootRoundBar.jsx';

const getToneColor = (tone, C) => {
  if (tone === 'greenLight') return C.greenLight;
  if (tone === 'orangeDark') return '#b05a10';
  if (tone === 'red') return C.red;
  return C.gold;
};

const getSerieColor = (serie, C) => {
  if (serie === 'A') return C.green;
  if (serie === 'B') return C.gold;
  if (serie === 'C') return C.blue;
  return C.ink3;
};

const CareerHistory = ({ save, theme }) => {
  const C = theme;
  const { career } = save;
  return (
    <Box sx={{ px: 1.5, pb: 1.2, bgcolor: C.bgCardAlt, borderTop: `1px solid ${C.border}55` }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.6, mt: 1, mb: 1 }}>
        {[
          { icon: '📅', label: 'TEMP.', value: career.seasons, color: C.ink },
          { icon: '✅', label: 'VITÓRIAS', value: career.wins, color: C.green },
          { icon: '🤝', label: 'EMPATES', value: career.draws, color: C.gold },
          { icon: '❌', label: 'DERROTAS', value: career.losses, color: C.red },
        ].map((item) => (
          <Box key={item.label} sx={{ bgcolor: C.bgCard, borderRadius: '8px', py: 0.8, textAlign: 'center', border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.shadow}` }}>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1, mb: 0.2 }}>{item.icon}</Typography>
            <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>{item.value}</Typography>
            <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700, mt: 0.15 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>

      {career.total > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', bgcolor: C.border }}>
            <Box sx={{ width: `${career.winPct}%`, bgcolor: C.green, transition: 'width 0.4s' }} />
            <Box sx={{ width: `${career.drawPct}%`, bgcolor: C.gold, transition: 'width 0.4s' }} />
            <Box sx={{ width: `${career.lossPct}%`, bgcolor: C.red, transition: 'width 0.4s' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.2, mt: 0.4 }}>
            {[
              { color: C.green, label: `${career.winPct}% V` },
              { color: C.gold, label: `${career.drawPct}% E` },
              { color: C.red, label: `${career.lossPct}% D` },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: item.color }} />
                <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.6 }}>
        <Box sx={{ bgcolor: C.bgCard, borderRadius: '8px', px: 0.9, py: 0.7, border: `1px solid ${C.border}` }}>
          <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>CAIXA</Typography>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.9rem', mt: 0.2, lineHeight: 1 }}>{save.moneyLabel}</Typography>
        </Box>
        <Box sx={{ bgcolor: C.bgCard, borderRadius: '8px', px: 0.9, py: 0.7, border: `1px solid ${C.border}` }}>
          <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>TROFÉUS</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>🏆</Typography>
            <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '1.2rem', lineHeight: 1 }}>{career.trophies}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const BootSaveCard = ({ save, featured, expanded, loading, onToggle, onLoad, onDelete, theme }) => {
  const C = theme;
  const branding = getTeamBranding(save.clubName);
  const serieColor = getSerieColor(save.serie, C);
  const difficultyColor = getToneColor(save.difficultyStyle.tone, C);
  const isLoading = loading === save.name;
  const incompatible = save.incompatible === true;

  return (
    <Box sx={{ bgcolor: featured ? '#fffdf7' : C.bgCard, border: `1.5px solid ${featured ? C.borderAcc : C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: featured ? `0 4px 20px ${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.7)` : `0 2px 8px ${C.shadow}` }}>
      {branding && <Box sx={{ height: 3, background: `linear-gradient(90deg,${branding.primary},${branding.secondary})` }} />}

      <Box sx={{ px: 1.5, pt: 1.3, pb: 1, display: 'flex', gap: 1.3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '10px', bgcolor: C.bgCardAlt, border: `1.5px solid ${featured ? C.borderAcc : C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.2, overflow: 'hidden' }}>
            <TeamIcon name={save.clubName} size={40} />
            <Typography sx={{ color: C.ink3, fontSize: '0.52rem', fontWeight: 700, px: 0.3, textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 56 }}>
              {save.clubName?.toUpperCase().substring(0, 11)}
            </Typography>
          </Box>
          <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: C.bgCardAlt, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{save.avatarEmoji}</Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '1.1rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1.1, mb: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(save.name || '').toUpperCase()}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.45, flexWrap: 'wrap' }}>
            <Box sx={{ bgcolor: `${serieColor}18`, border: `1px solid ${serieColor}40`, borderRadius: '4px', px: 0.6, py: 0.1 }}>
              <Typography sx={{ color: serieColor, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5 }}>SÉRIE {save.serie}</Typography>
            </Box>
            <Typography sx={{ color: C.ink2, fontSize: '0.7rem', fontWeight: 700 }}>Temp. {save.season}</Typography>
            {save.difficulty && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Typography sx={{ fontSize: '0.6rem', lineHeight: 1 }}>{save.difficultyStyle.icon}</Typography>
                <Typography sx={{ color: difficultyColor, fontWeight: 900, fontSize: '0.6rem' }}>{save.difficulty}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.2, mb: 0.4 }}>
            <Box>
              <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>POSIÇÃO</Typography>
              <Typography sx={{ color: save.position <= 4 ? C.green : save.position >= 17 ? C.red : C.ink, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>{save.positionLabel}</Typography>
            </Box>
            {save.pts !== null && save.pts !== undefined && (
              <Box>
                <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>PONTOS</Typography>
                <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>{save.pts}</Typography>
              </Box>
            )}
            <Box>
              <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>MANAGER</Typography>
              <Typography sx={{ color: C.ink2, fontWeight: 700, fontSize: '0.7rem', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 68 }}>{save.manager?.split(' ')[0] || '—'}</Typography>
            </Box>
          </Box>

          {save.objectiveInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.35 }}>
              <Typography sx={{ fontSize: '0.7rem' }}>{save.objectiveInfo.icon}</Typography>
              <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>Meta:</Typography>
              <Typography sx={{ color: C.ink2, fontSize: '0.6rem', fontWeight: 900 }}>{save.objectiveInfo.label}</Typography>
            </Box>
          )}

          {save.stadiumConstruction > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.35, bgcolor: `${C.gold}12`, border: `1px solid ${C.gold}40`, borderRadius: '5px', px: 0.6, py: 0.2 }}>
              <Typography sx={{ fontSize: '0.65rem' }}>🏗️</Typography>
              <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: '0.58rem' }}>Obras: {save.stadiumConstruction} rodada{save.stadiumConstruction > 1 ? 's' : ''} restante{save.stadiumConstruction > 1 ? 's' : ''}</Typography>
            </Box>
          )}

          {incompatible && (
            <Box sx={{ bgcolor:`${C.red}10`, border:`1px solid ${C.red}40`, borderRadius:'5px', px:0.6, py:0.25, mb:0.4 }}>
              <Typography sx={{ color:C.red, fontSize:'0.56rem', fontWeight:900 }}>⚠ SAVE DE VERSÃO MAIS NOVA · SCHEMA {save.saveSchemaVersion}</Typography>
            </Box>
          )}
          <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700, mb: 0.3 }}>🕐 {save.savedAtLabel}</Typography>
          <BootRoundBar progress={save.progress} theme={C} />
        </Box>
      </Box>

      <Box component="button" type="button" onClick={onToggle} aria-expanded={expanded} aria-label={`${expanded ? 'Ocultar' : 'Mostrar'} histórico da carreira ${save.name}`} sx={{ width: '100%', border: 0, borderTop: `1px solid ${C.border}`, px: 1.5, py: 0.65, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', bgcolor: expanded ? C.bgCardAlt : 'transparent', transition: 'background 0.15s', '&:hover': { bgcolor: C.bgCardAlt } }}>
        <Typography sx={{ color: C.ink3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1 }}>📊 HISTÓRICO DE CARREIRA</Typography>
        <Typography sx={{ color: C.ink3, fontSize: '0.8rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</Typography>
      </Box>

      {expanded && <CareerHistory save={save} theme={C} />}

      <Box sx={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
        <Button onClick={onLoad} disabled={Boolean(loading) || incompatible} sx={{ flex: 2, py: 1.2, borderRadius: 0, bgcolor: isLoading ? C.primaryDim : C.green, color: '#fff', fontWeight: 900, fontSize: '0.88rem', borderRight: '1px solid rgba(0,0,0,0.1)', '&:hover': { bgcolor: C.primaryDim }, '&:disabled': { bgcolor: C.bgDark, color: C.ink3 } }}>{incompatible ? '⚠ ATUALIZE O JOGO' : isLoading ? '⏳ Carregando...' : '▶ JOGAR'}</Button>
        <Button onClick={onDelete} disabled={Boolean(loading)} sx={{ flex: 0.8, py: 1.2, borderRadius: 0, bgcolor: 'transparent', color: C.red, fontWeight: 900, fontSize: '0.75rem', '&:hover': { bgcolor: `${C.red}10` } }}>🗑 DELETAR</Button>
      </Box>
    </Box>
  );
};

export default BootSaveCard;
