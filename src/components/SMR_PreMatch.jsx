// @migrated to ES module
import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { getUserMatchSide } from '../engines/match/matchPresentationViewModel.js';

// SMR_PreMatch.jsx — Step -1: Tela de pré-jogo
// Exibe escalação inicial, dados do adversário e botão para iniciar a partida.
// Extraído de ScreenMatchResult.jsx para manter cada etapa em seu próprio arquivo.

const C = THEME;

const SMR_Card = ({ children, accent, sx: sxExtra }) => (
  <Box sx={{ bgcolor: C.bgCard, border: `1.5px solid ${accent || C.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2, ...sxExtra }}>
    {children}
  </Box>
);

const SMR_CardHead = ({ label, icon, color }) => (
  <Box sx={{ px: 1.5, py: 0.85, borderBottom: `1px solid ${C.border}`, bgcolor: color ? `${color}0f` : C.bgCardAlt, display: 'flex', alignItems: 'center', gap: 0.8 }}>
    {icon && <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</Typography>}
    <Typography sx={{ color: color || C.ink3, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 1.2 }}>{label}</Typography>
  </Box>
);

const SMR_PreMatch = ({ gameData, matchResultData, headerJSX, onStart }) => {
  if (!matchResultData) return null;

  const { homeName, awayName } = matchResultData;
  const userSide = getUserMatchSide(gameData, matchResultData);
  if (userSide !== 'home' && userSide !== 'away') {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', pb: 1 }}>
        {headerJSX}
        <Box sx={{ px: 1.5, pt: 1.5 }}>
          <SMR_Card accent={`${C.red}70`}>
            <SMR_CardHead label="PARTIDA BLOQUEADA" icon="🚫" color={C.red} />
            <Box sx={{ p: 1.5 }}>
              <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.78rem', mb: 0.5 }}>
                Não foi possível identificar com segurança qual equipe é o seu clube.
              </Typography>
              <Typography sx={{ color: C.ink2, fontSize: '0.62rem' }}>
                A escalação não será posicionada nem a partida iniciada para evitar associar seus jogadores ao adversário.
              </Typography>
            </Box>
          </SMR_Card>
        </Box>
      </Box>
    );
  }
  const isUserH = userSide === 'home';
  const opp = userSide === 'home' ? { name: awayName } : { name: homeName };
  const preMatchTable = matchResultData?.preMatchTable || gameData?.table || [];
  const oppRow  = preMatchTable.find(t => t.name === opp.name) || {};
  const oppPos  = preMatchTable.findIndex(t => t.name === opp.name) + 1;
  const userRoster = matchResultData?.rosters?.[userSide];
  const activeIds = new Set((matchResultData?.activeLineups?.[userSide] || []).map((id) => String(id)));
  const starters = Array.isArray(userRoster) && userRoster.length
    ? userRoster.filter(p => activeIds.size ? activeIds.has(String(p.id)) : p.isStarting)
    : (gameData?.players || []).filter(p => p.isStarting);

  const posColor = {
    GOL: '#f59e0b',
    ZAG: '#1d4ed8',
    LD:  '#0284c7', LE: '#0284c7',
    VOL: '#14532d', MC: '#15803d', MEI: '#166534',
    PD:  '#9a3412', PE: '#9a3412', CA: '#991b1b',
    // compat saves antigos
    LAT: '#0284c7', ATA: '#991b1b',
  };
  const POS_ORDER = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'];

  const sortedStarters = [...starters].sort((a, b) =>
    (POS_ORDER.indexOf(a.position) + 1 || 99) - (POS_ORDER.indexOf(b.position) + 1 || 99)
  );

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', pb: 1, background: `radial-gradient(ellipse at 50% 0%,rgba(34,197,94,0.05) 0%,transparent 40%),${C.bg}` }}>
      {headerJSX}
      <Box sx={{ px: 1.5, pt: 1.5 }}>

        {/* Info do jogo */}
        <SMR_Card accent={`${C.blue}50`}>
          <SMR_CardHead label="PRÉ-JOGO" icon="🏟️" color={C.blue} />
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography sx={{ color: C.ink3, fontSize: '0.56rem', fontWeight: 700 }}>LOCAL</Typography>
                <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.82rem' }}>
                  {isUserH ? gameData?.club?.stadium?.name || 'Estádio' : `Estádio do ${homeName}`}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: C.ink3, fontSize: '0.56rem', fontWeight: 700 }}>MANDO</Typography>
                <Typography sx={{ color: isUserH ? C.green : C.red, fontWeight: 900, fontSize: '0.8rem' }}>
                  {isUserH ? '🏠 MANDANTE' : '✈️ VISITANTE'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.8 }}>
              {[
                { l: 'RODADA',    v: matchResultData?.isCupMatch ? (matchResultData?.cupPhase || 'Copa') : (matchResultData?.leagueRound || 1) },
                { l: 'TEMPORADA', v: gameData?.season || 2026 },
                { l: 'SÉRIE',     v: `Série ${gameData?.serie}` },
              ].map((s, i) => (
                <Box key={i} sx={{ bgcolor: C.bgCardAlt, borderRadius: '8px', p: 0.8, textAlign: 'center' }}>
                  <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>{s.l}</Typography>
                  <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.78rem' }}>{s.v}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </SMR_Card>

        {/* Escalação */}
        <SMR_Card>
          <SMR_CardHead label="ESCALAÇÃO INICIAL" icon="👥" />
          <Box sx={{ p: 1.2, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
            {sortedStarters.map((p, i) => (
              <Box key={p.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: C.bgCardAlt, borderRadius: '6px', px: 0.7, py: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: posColor[p.position] || C.ink3, flexShrink: 0 }} />
                <Typography sx={{ color: C.ink, fontSize: '0.58rem', fontWeight: 700, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {p.name.split(' ')[0]}
                </Typography>
                <Typography sx={{ color: C.ink3, fontSize: '0.5rem' }}>{p.overall}</Typography>
              </Box>
            ))}
          </Box>
        </SMR_Card>

        {/* Adversário */}
        <SMR_Card>
          <SMR_CardHead label="ADVERSÁRIO" icon="⚔️" />
          <Box sx={{ p: 1.2, display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: C.bgCardAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {TeamIcon ? React.createElement(TeamIcon, { name: opp.name, size: 32 }) : <Typography sx={{ fontSize: '1.2rem' }}>⚽</Typography>}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.88rem' }}>{opp.name}</Typography>
              {oppPos > 0 && (
                <Typography sx={{ color: C.ink2, fontSize: '0.62rem', fontWeight: 700, mt: 0.2 }}>
                  {oppPos}º · {oppRow.pts || 0} pts · {oppRow.w || 0}V {oppRow.d || 0}E {oppRow.l || 0}D
                </Typography>
              )}
            </Box>
          </Box>
        </SMR_Card>

      </Box>

      {/* Botão Iniciar */}
      <Box sx={{ position: 'fixed', bottom: 62, left: 0, right: 0, zIndex: 50, px: 1.5, pb: 1.5, pt: 1.5, background: `linear-gradient(transparent 0%,${C.bg} 35%)`, boxShadow: `0 -12px 28px ${C.bg}` }}>
        <Box onClick={onStart} sx={{ bgcolor: C.green, borderRadius: '14px', py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', boxShadow: `0 0 28px ${C.green}50`, '&:active': { filter: 'brightness(0.88)' } }}>
          <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>▶</Typography>
          <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.95rem' }}>INICIAR PARTIDA</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SMR_PreMatch;
