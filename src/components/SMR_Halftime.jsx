// @migrated to ES module
import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import { FORMATION_SLOTS } from '../engines/lineup/lineupRules.js';
import { parseMatchGoalEvent } from '../engines/match/matchEventViewModel.js';
import {
  buildHalftimeEventSummary,
  buildHalftimeSubstitutionSuggestions,
} from '../engines/match/matchHalftimeViewModel.js';
import { MAX_LIVE_SUBSTITUTIONS, normalizeLiveSubstitutions } from '../engines/match/matchSubstitutionViewModel.js';

// SMR_Halftime.jsx — Step 1: Tela de intervalo
// Mostra stats do 1T, permite substituições e ajuste tático antes do 2T.
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

const FORMATIONS = Object.keys(FORMATION_SLOTS);
const STYLES = [
  { id: 'Defensivo',   icon: '🛡️', desc: 'Bloco mais baixo' },
  { id: 'Equilibrado', icon: '⚖️',  desc: 'Postura neutra'    },
  { id: 'Ofensivo',    icon: '⚔️',  desc: 'Linhas mais altas' },
];

const SMR_Halftime = ({
  gameData,
  matchResultData,
  possession = { home:50, away:50 },
  goalEvts = [],
  yellowEvts = [],
  subsDone = [],
  isUserH,
  headerJSX,
  subsDialogJSX,
  setShowSubs,
  setSelectedStarter,
  liveFormation,
  liveStyle,
  livePlayers = [],
  onApplyTactics,
  onStart2T,
}) => {
  const homeName = String(matchResultData?.homeName ?? '');
  const awayName = String(matchResultData?.awayName ?? '');

  // Estado local das mudanças táticas do intervalo
  const currentFormation = liveFormation || gameData?.club?.formation || gameData?.club?.managerProfile?.formation || '4-4-2';
  const currentStyle = liveStyle || gameData?.club?.managerProfile?.style || 'Equilibrado';
  const [selForm, setSelForm] = React.useState(currentFormation);
  const [selStyle, setSelStyle] = React.useState(currentStyle);

  const substitutions = React.useMemo(() => normalizeLiveSubstitutions(subsDone), [subsDone]);
  const halftimeSummary = React.useMemo(() => buildHalftimeEventSummary({
    goalEvents:goalEvts,
    yellowEvents:yellowEvts,
    homeName,
    awayName,
  }), [goalEvts, yellowEvts, homeName, awayName]);
  const suggestions = React.useMemo(() => buildHalftimeSubstitutionSuggestions({
    players:livePlayers,
    subsDone:substitutions,
    matchRound:matchResultData?.calendarRound ?? 0,
  }), [livePlayers, substitutions, matchResultData?.calendarRound]);
  const goals1T = halftimeSummary.goals;
  const hGols1T = halftimeSummary.score.home;
  const aGols1T = halftimeSummary.score.away;
  const hPoss = Number.isFinite(Number(possession?.home)) ? Number(possession.home) : 50;
  const aPoss = Number.isFinite(Number(possession?.away)) ? Number(possession.away) : 50;
  const [startingSecondHalf, setStartingSecondHalf] = React.useState(false);

  const handleStart2T = () => {
    if (startingSecondHalf) return;
    setStartingSecondHalf(true);
    const started = onStart2T?.();
    if (started !== true) {
      setStartingSecondHalf(false);
      return;
    }
    if (selForm !== currentFormation || selStyle !== currentStyle) {
      onApplyTactics?.({ formation: selForm, style: selStyle });
    }
    setShowSubs?.(false);
  };

  const changed = selForm !== currentFormation || selStyle !== currentStyle;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh' }}>
      {headerJSX}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 14 }}>

        {/* Banner + Stats 1T */}
        <Box sx={{ background: `linear-gradient(135deg,rgba(234,179,8,0.1) 0%,transparent 60%)`, border: `1.5px solid ${C.gold}50`, borderRadius: '14px', p: 1.3, mb: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ bgcolor: `${C.gold}20`, borderRadius: '8px', px: 0.8, py: 0.4, border: `1px solid ${C.gold}40` }}>
                <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1 }}>⏸ INTERVALO</Typography>
              </Box>
              <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>45'</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography sx={{ color: C.ink3, fontWeight: 700, fontSize: '0.6rem' }}>1T</Typography>
              <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '7px', px: 1, py: 0.3, border: `1px solid ${C.border}` }}>
                <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.9rem', fontFamily: 'monospace' }}>{hGols1T} – {aGols1T}</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.5 }}>
            {[
              { l: 'POSSE',       v: `${hPoss}%`, v2: `${aPoss}%`, icon: '⚽' },
              { l: 'GOLS',        v: hGols1T,     v2: aGols1T,      icon: '🥅' },
              { l: 'FINALIZAÇÕES',v: Math.max(hGols1T, Math.floor(hPoss / 9)), v2: Math.max(aGols1T, Math.floor(aPoss / 9)), icon: '🎯' },
              { l: 'AMARELOS',    v: halftimeSummary.yellowCards.home, v2: halftimeSummary.yellowCards.away, icon: '🟨' },
            ].map((s, i) => (
              <Box key={i} sx={{ bgcolor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '8px', p: 0.6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.68rem', lineHeight: 1, mb: 0.15 }}>{s.icon}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.3 }}>
                  <Typography sx={{ color: isUserH ? C.green : C.blue, fontWeight: 900, fontSize: '0.7rem', lineHeight: 1 }}>{s.v}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.48rem' }}>–</Typography>
                  <Typography sx={{ color: isUserH ? C.blue : C.green, fontWeight: 900, fontSize: '0.7rem', lineHeight: 1 }}>{s.v2}</Typography>
                </Box>
                <Typography sx={{ color: C.ink3, fontWeight: 700, fontSize: '0.42rem', mt: 0.15 }}>{s.l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Gols do 1T */}
        {goals1T.length > 0 && (
          <SMR_Card>
            <SMR_CardHead label="GOLS DO 1º TEMPO" icon="⚽" />
            <Box sx={{ px: 1.5, py: 0.8 }}>
              {goals1T.map((g, i) => {
                const parsed = parseMatchGoalEvent(g, homeName, awayName);
                const min = parsed.minuteLabel || parsed.minute || '';
                const scorer = parsed.scorer;
                const isHome = parsed.side === 'home';
                return (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.45 }}>
                    <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                      <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.56rem', fontWeight: 700 }}>{min}'</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem' }}>⚽</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: isHome ? C.green : C.blue, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>{scorer || '—'}</Typography>
                      <Typography sx={{ color: C.ink3, fontSize: '0.54rem', fontWeight: 700 }}>{isHome ? homeName : awayName}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </SMR_Card>
        )}

        {/* Sugestões de substituição */}
        {suggestions.length > 0 && (
          <Box sx={{ bgcolor: `${C.red}08`, border: `1px solid ${C.red}30`, borderRadius: '10px', p: 1.1, mb: 1.2 }}>
            <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 0.8, mb: 0.6 }}>⚠️ SUBSTITUIÇÕES RECOMENDADAS</Typography>
            {suggestions.map(({ outgoing, incoming, energy, outgoingName, incomingName }) => (
              <Box key={outgoing?.id ?? outgoingName} sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.4 }}>
                <Typography sx={{ color: energy < 35 ? C.red : C.orange, fontWeight: 900, fontSize: '0.58rem', minWidth: 80 }}>
                  ↓ {outgoingName} ⚡{energy}%
                </Typography>
                <Typography sx={{ color: C.ink3, fontSize: '0.6rem' }}>→</Typography>
                {incoming
                  ? <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.58rem' }}>↑ {incomingName} ({Number.isFinite(Number(incoming.overall)) ? Number(incoming.overall) : 0})</Typography>
                  : <Typography sx={{ color: C.ink3, fontSize: '0.54rem', fontStyle: 'italic' }}>sem reserva disponível</Typography>}
              </Box>
            ))}
          </Box>
        )}

        {/* Botão de substituições */}
        {substitutions.length < MAX_LIVE_SUBSTITUTIONS && (
          <Box onClick={() => { setShowSubs?.(true); setSelectedStarter?.(null); }} sx={{ bgcolor: C.bgCard, border: `1.5px solid ${C.gold}50`, borderRadius: '12px', py: 0.9, mb: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.9, cursor: 'pointer', '&:active': { bgcolor: `${C.gold}08` } }}>
            <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.76rem' }}>🔄 Fazer Substituições</Typography>
            <Box sx={{ bgcolor: `${C.gold}20`, borderRadius: '10px', px: 0.7, py: 0.15 }}>
              <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.62rem' }}>{MAX_LIVE_SUBSTITUTIONS - substitutions.length} restante{MAX_LIVE_SUBSTITUTIONS - substitutions.length !== 1 ? 's' : ''}</Typography>
            </Box>
          </Box>
        )}

        {/* Ajuste Tático */}
        <SMR_Card>
          <SMR_CardHead label="AJUSTE TÁTICO — 2º TEMPO" icon="📋" color={C.blue} />
          <Box sx={{ px: 1.2, py: 1 }}>
            <Typography sx={{ color: C.ink3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8, mb: 0.55 }}>FORMAÇÃO</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {FORMATIONS.map(f => {
                const active  = selForm === f;
                const changed = active && f !== currentFormation;
                return (
                  <Box key={f} onClick={() => setSelForm(f)} sx={{ bgcolor: active ? C.green : C.bgCardAlt, border: `1.5px solid ${active ? C.green : C.border}`, borderRadius: '7px', px: 0.9, py: 0.4, cursor: 'pointer', position: 'relative', boxShadow: active ? `0 0 10px ${C.green}40` : 'none', transition: 'all 0.15s' }}>
                    <Typography sx={{ color: active ? '#000' : C.ink2, fontWeight: 900, fontSize: '0.7rem' }}>{f}</Typography>
                    {changed && <Box sx={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', bgcolor: C.gold }} />}
                  </Box>
                );
              })}
            </Box>

            <Typography sx={{ color: C.ink3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8, mb: 0.5 }}>ESTILO</Typography>
            <Box sx={{ display: 'flex', gap: 0.6 }}>
              {STYLES.map(s => {
                const active = selStyle === s.id;
                return (
                  <Box key={s.id} onClick={() => setSelStyle(s.id)} sx={{ flex: 1, bgcolor: active ? `${C.blue}15` : C.bgCardAlt, border: `1.5px solid ${active ? C.blue : C.border}`, borderRadius: '9px', py: 0.65, px: 0.5, cursor: 'pointer', textAlign: 'center', boxShadow: active ? `0 0 10px ${C.blue}30` : 'none' }}>
                    <Typography sx={{ fontSize: '1rem', lineHeight: 1, mb: 0.15 }}>{s.icon}</Typography>
                    <Typography sx={{ color: active ? C.blue : C.ink2, fontWeight: 900, fontSize: '0.56rem', lineHeight: 1 }}>{s.id}</Typography>
                    <Typography sx={{ color: C.ink3, fontSize: '0.42rem', fontWeight: 700, mt: 0.1 }}>{s.desc}</Typography>
                  </Box>
                );
              })}
            </Box>

            {changed && (
              <Box sx={{ mt: 0.7, bgcolor: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: '6px', px: 1, py: 0.45, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.7rem' }}>⚡</Typography>
                <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: '0.56rem' }}>Mudanças aplicadas no 2º tempo</Typography>
              </Box>
            )}
          </Box>
        </SMR_Card>
      </Box>

      {subsDialogJSX}

      {/* Botão INICIAR 2T */}
      <Box sx={{ position: 'fixed', bottom: 62, left: 0, right: 0, zIndex: 50, px: 1.5, pb: 1.5, pt: 1.5, background: `linear-gradient(transparent 0%,${C.bg} 35%)`, boxShadow: `0 -12px 28px ${C.bg}` }}>
        <Box onClick={startingSecondHalf ? undefined : handleStart2T} sx={{ bgcolor: C.green, borderRadius: '14px', py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: startingSecondHalf ? 'default' : 'pointer', opacity: startingSecondHalf ? 0.7 : 1, boxShadow: `0 0 28px ${C.green}50`, '&:active': { filter: 'brightness(0.88)' } }}>
          <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>▶</Typography>
          <Box>
            <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.92rem', lineHeight: 1 }}>{startingSecondHalf ? 'INICIANDO 2º TEMPO…' : 'INICIAR 2º TEMPO'}</Typography>
            {changed && <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.5rem', fontWeight: 700, lineHeight: 1, mt: 0.1 }}>Com mudanças táticas</Typography>}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SMR_Halftime;
