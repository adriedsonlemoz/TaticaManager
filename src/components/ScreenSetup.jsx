// @migrated to ES module
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { TeamIcon } from '../data/database_branding.js';
import { teamBranding } from '../data/teamBranding.js';
import { diexDatabase } from '../data/database.js';

// components/ScreenSetup.jsx — v10.0
// Visual: light sage-green, editorial cards, jersey-style team selector

const ScreenSetup = ({ setupData, setSetupData, handleStartNewGame, savesList, setScreen }) => {
  const TOTAL_CARDS = 6;

  const [card,             setCard]             = React.useState(1);
  const [useExistingTeam,  setUseExistingTeam]  = React.useState(false);
  const [signing,          setSigning]           = React.useState(false);
  const [signed,           setSigned]            = React.useState(false);
  const [entering,         setEntering]          = React.useState(false);
  const [teamSearch,       setTeamSearch]        = React.useState('');

  const goCard = (n) => {
    setEntering(true);
    setTimeout(() => { setCard(n); setEntering(false); }, 170);
  };

  React.useEffect(() => {
    if (card !== 5) return;
    const brand   = window.teamBranding?.[setupData.teamName];
    const stadium = window.getTeamStadium?.(setupData.teamName);
    const patch   = {};
    if (brand && !setupData._colorsSet) {
      patch.colorPrimary   = brand.primary;
      patch.colorSecondary = brand.secondary;
      patch._colorsSet     = true;
    }
    if (stadium && !setupData.stadiumName) patch.stadiumName = stadium;
    if (Object.keys(patch).length) up(patch);
  }, [card, setupData.teamName]);

  const P = {
    bg:          '#f2f7f4',
    surface:     '#ffffff',
    border:      '#ddeae3',
    green:       '#10b981',
    greenMid:    '#34d399',
    greenLight:  '#d1fae5',
    greenDark:   '#059669',
    txt1:        '#0d1f17',
    txt2:        '#3d5c4a',
    txt3:        '#7eaa90',
    txt4:        '#b5d4c2',
    gold:        '#d97706',
    goldLight:   '#fef3c7',
    red:         '#dc2626',
    redLight:    '#fee2e2',
    blue:        '#2563eb',
    blueLight:   '#dbeafe',
    purple:      '#7c3aed',
    purpleLight: '#ede9fe',
    shadow:      'rgba(16,185,129,0.10)',
  };

  const up = fields => setSetupData(prev => ({ ...prev, ...fields }));

  const availableTeams = React.useMemo(() => {
    const s = setupData.serie || 'A';
    return window.diexDatabase?.[`serie${s}Teams`] || [];
  }, [setupData.serie]);

  const brand = React.useMemo(() =>
    window.teamBranding?.[setupData.teamName] || null,
  [setupData.teamName]);

  const isCardValid = (n) => {
    if (n === 1) return !!setupData.serie;
    if (n === 2) return !!setupData.teamName?.trim();
    if (n === 3) return !!setupData.saveName?.trim() && !!setupData.seasonObjective;
    if (n === 4) return !!setupData.managerName?.trim();
    return true;
  };

  const fmt = v =>
    !v ? 'Padrão' :
    v >= 1e6 ? `R$ ${(v / 1e6).toFixed(1).replace('.0', '')}M` :
    `R$ ${(v / 1e3).toFixed(0)}K`;

  const ShirtSVG = ({ primary = '#10b981', secondary = '#ffffff', number = '10', size = 64 }) => {
    const uid = `ss_${(primary + secondary + number + size).replace(/[^a-z0-9]/gi, '')}`;
    return (
      <svg viewBox="0 0 80 80" style={{ width: size, height: size, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.18))' }}>
        <defs>
          <linearGradient id={`g${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="1" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.82" />
          </linearGradient>
          <clipPath id={`c${uid}`}>
            <path d="M20 15 L10 30 L22 35 L22 65 L58 65 L58 35 L70 30 L60 15 L50 22 Q40 28 30 22 Z" />
          </clipPath>
        </defs>
        <path d="M20 15 L10 30 L22 35 L22 65 L58 65 L58 35 L70 30 L60 15 L50 22 Q40 28 30 22 Z"
          fill={`url(#g${uid})`} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <rect x="28" y="14" width="10" height="52" fill={secondary} opacity="0.10"
          transform="rotate(-5 40 40)" clipPath={`url(#c${uid})`} />
        <path d="M32 23 Q40 29 48 23 Q46 17 40 16 Q34 17 32 23 Z" fill={secondary} opacity="0.55" />
        <text x="40" y="48" textAnchor="middle" dominantBaseline="middle"
          fontSize="18" fontWeight="900" fill={secondary} fontFamily='"Nunito",sans-serif'>{number}</text>
      </svg>
    );
  };

  const ProgressBar = () => (
    <Box sx={{ display: 'flex', gap: 0.5, mb: 2.5 }}>
      {Array.from({ length: TOTAL_CARDS }).map((_, i) => {
        const n = i + 1;
        const done   = card > n;
        const active = card === n;
        return (
          <Box key={n} sx={{
            flex: active ? 2.5 : 1, height: 4, borderRadius: 2,
            bgcolor: done ? P.green : active ? P.green : P.border,
            opacity: done ? 0.55 : 1,
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: active ? `0 0 8px ${P.green}60` : 'none',
          }} />
        );
      })}
    </Box>
  );

  const CardHeader = ({ icon, step, title, sub }) => (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px', bgcolor: P.greenLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{icon}</Typography>
        </Box>
        <Box>
          <Typography sx={{ color: P.txt3, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 2, lineHeight: 1 }}>
            PASSO {step} DE {TOTAL_CARDS}
          </Typography>
          <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.15rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1.1, mt: 0.15 }}>
            {title}
          </Typography>
        </Box>
      </Box>
      {sub && <Typography sx={{ color: P.txt3, fontSize: '0.65rem', fontWeight: 700 }}>{sub}</Typography>}
      <Box sx={{ height: 1, bgcolor: P.border, mt: 1.5 }} />
    </Box>
  );

  const NavRow = ({ onBack, onNext, nextLabel = 'CONTINUAR', disabled = false }) => (
    <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2 }}>
      {onBack && (
        <Button onClick={onBack} sx={{
          color: P.txt3, border: `1.5px solid ${P.border}`, borderRadius: '12px',
          fontWeight: 900, px: 2.5, minWidth: 80, bgcolor: 'transparent', fontSize: '0.85rem',
          '&:hover': { borderColor: P.green, color: P.green },
        }}>← Voltar</Button>
      )}
      <Button fullWidth disabled={disabled} onClick={onNext} sx={{
        py: 1.4, fontWeight: 900, fontSize: '0.95rem', borderRadius: '12px', letterSpacing: 0.5,
        bgcolor: disabled ? P.bg : P.green, color: disabled ? P.txt4 : '#fff',
        boxShadow: disabled ? 'none' : `0 4px 20px ${P.shadow}`,
        border: `1.5px solid ${disabled ? P.border : P.green}`,
        '&:hover': { bgcolor: disabled ? P.bg : P.greenDark },
        transition: 'all 0.2s',
      }}>{disabled ? nextLabel : `${nextLabel} →`}</Button>
    </Box>
  );

  const SectionLabel = ({ label }) => (
    <Typography sx={{ color: P.txt3, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 2, mb: 0.8, mt: 0.5 }}>
      {label}
    </Typography>
  );

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: `1.5px solid ${P.border}`, background: P.surface,
    color: P.txt1, fontSize: '0.95rem', fontFamily: '"Nunito",sans-serif',
    fontWeight: 700, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s',
  };

  // ── CARD 1 — Divisão & Dificuldade ───────────────────────────────────
  const Card1 = () => {
    const LEAGUES = [
      { id: 'A', label: 'Série A', sub: 'G4 Libertadores · Z4 Rebaixamento',    money: 'R$ 18M', color: P.green,  light: P.greenLight,  badge: 'A' },
      { id: 'B', label: 'Série B', sub: 'G4 Acesso à Série A · Z4 Rebaixamento', money: 'R$ 8M',  color: P.gold,   light: P.goldLight,   badge: 'B' },
      { id: 'C', label: 'Série C', sub: 'G4 Acesso à Série B · Z4 Rebaixamento', money: 'R$ 3M',  color: P.blue,   light: P.blueLight,   badge: 'C' },
      { id: 'D', label: 'Série D', sub: 'G4 Acesso à Série C · Criar clube',     money: 'R$ 1M',  color: P.purple, light: P.purpleLight, badge: 'D' },
    ];
    const DIFFS = [
      { id: 'Fácil',    icon: '🟢', mult: { injuryChance: 0.4, rivalStrength: 0.88, moneyBonus: 1.3,  fatigueLoss: 0.7 } },
      { id: 'Normal',   icon: '🟡', mult: { injuryChance: 1.0, rivalStrength: 1.0,  moneyBonus: 1.0,  fatigueLoss: 1.0 } },
      { id: 'Difícil',  icon: '🟠', mult: { injuryChance: 1.8, rivalStrength: 1.1,  moneyBonus: 0.85, fatigueLoss: 1.3 } },
      { id: 'Lendário', icon: '🔴', mult: { injuryChance: 2.8, rivalStrength: 1.2,  moneyBonus: 0.7,  fatigueLoss: 1.6 } },
    ];
    const selSerie = setupData.serie;
    const selDiff  = setupData.difficulty || 'Normal';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardHeader icon="🌎" step={1} title="Escolha a Divisão" />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.9, mb: 2 }}>
          {LEAGUES.map(lg => {
            const active = selSerie === lg.id;
            return (
              <Box key={lg.id}
                onClick={() => { up({ serie: lg.id }); setUseExistingTeam(lg.id !== 'D'); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: active ? lg.light : P.surface,
                  border: `1.5px solid ${active ? lg.color : P.border}`,
                  borderRadius: '14px', px: 1.5, py: 1.1, cursor: 'pointer',
                  transition: 'all 0.15s', '&:active': { transform: 'scale(0.985)' },
                  boxShadow: active ? `0 2px 16px ${lg.color}18` : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <Box sx={{
                  width: 48, height: 48, borderRadius: '12px',
                  bgcolor: active ? lg.color : P.bg,
                  border: `1.5px solid ${active ? lg.color : P.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  <Typography sx={{ color: active ? '#fff' : P.txt3, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, fontFamily: '"Nunito",sans-serif' }}>
                    {lg.badge}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: active ? lg.color : P.txt1, fontWeight: 900, fontSize: '0.97rem', lineHeight: 1 }}>
                    {lg.label}
                  </Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.62rem', fontWeight: 700, mt: 0.25 }}>{lg.sub}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ color: active ? lg.color : P.txt3, fontWeight: 900, fontSize: '0.78rem' }}>
                    💰 {lg.money}
                  </Typography>
                  {active && (
                    <Box sx={{ mt: 0.4, bgcolor: lg.color, borderRadius: '20px', px: 0.7, py: 0.15, display: 'inline-block' }}>
                      <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.45rem' }}>SELECIONADO</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {selSerie && (
          <>
            <Box sx={{ height: 1, bgcolor: P.border, mb: 1.8 }} />
            <SectionLabel label="DIFICULDADE" />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.7, mb: 2 }}>
              {DIFFS.map(d => {
                const active = selDiff === d.id;
                return (
                  <Box key={d.id}
                    onClick={() => up({ difficulty: d.id, difficultyMultipliers: d.mult })}
                    sx={{
                      bgcolor: P.surface, border: `1.5px solid ${active ? P.green : P.border}`,
                      borderRadius: '12px', py: 1, px: 0.5, cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.15s', boxShadow: active ? `0 2px 12px ${P.shadow}` : 'none',
                      '&:active': { transform: 'scale(0.94)' },
                    }}
                  >
                    <Typography sx={{ fontSize: '1.2rem', lineHeight: 1, mb: 0.4 }}>{d.icon}</Typography>
                    <Typography sx={{ color: active ? P.green : P.txt2, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.3 }}>
                      {d.id.toUpperCase()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        <NavRow
          onBack={savesList.length > 0 ? () => setScreen('boot') : undefined}
          onNext={() => goCard(2)}
          nextLabel="ESCOLHER CLUBE"
          disabled={!selSerie}
        />
      </Box>
    );
  };

  // ── CARD 2 — Clube ────────────────────────────────────────────────────
  const Card2 = () => {
    const TeamIconComp = window.TeamIcon || (({ name, size }) => (
      <Box sx={{
        width: size, height: size, borderRadius: '50%', bgcolor: P.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.55rem', fontWeight: 900, color: P.txt2,
        border: `1.5px solid ${P.border}`, flexShrink: 0,
      }}>
        {(name || '?').substring(0, 3).toUpperCase()}
      </Box>
    ));

    const selTeam = availableTeams.find(t => t.name === setupData.teamName);
    const filteredTeams = teamSearch.trim()
      ? availableTeams.filter(t => t.name.toLowerCase().includes(teamSearch.trim().toLowerCase()))
      : availableTeams;

    const ovrColor = ovr => ovr >= 80 ? P.green : ovr >= 72 ? P.gold : ovr >= 65 ? '#f97316' : P.red;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardHeader icon="🏟️" step={2} title="Escolha seu Clube" sub={`SÉRIE ${setupData.serie} · ${availableTeams.length} TIMES DISPONÍVEIS`} />

        {setupData.serie === 'D' && (
          <Box sx={{ display: 'flex', mb: 1.5, bgcolor: P.bg, borderRadius: '12px', p: 0.4, gap: 0.4, border: `1px solid ${P.border}` }}>
            {[{ label: '✏️ Criar clube', val: false }, { label: '🏛️ Time existente', val: true }].map(opt => (
              <Box key={String(opt.val)}
                onClick={() => { setUseExistingTeam(opt.val); if (!opt.val) up({ teamName: '', existingTeamId: null }); }}
                sx={{
                  flex: 1, textAlign: 'center', py: 0.9, borderRadius: '9px', cursor: 'pointer',
                  bgcolor: useExistingTeam === opt.val ? P.surface : 'transparent',
                  color: useExistingTeam === opt.val ? P.green : P.txt3,
                  fontWeight: 900, fontSize: '0.8rem',
                  boxShadow: useExistingTeam === opt.val ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </Box>
            ))}
          </Box>
        )}

        {useExistingTeam && (
          <>
            <Box sx={{ position: 'relative', mb: 1 }}>
              <input
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                placeholder="Buscar clube..."
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
              <Typography sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}>🔍</Typography>
            </Box>

            <Box sx={{
              flex: 1, overflowY: 'auto', mb: 1,
              display: 'flex', flexDirection: 'column', gap: 0.6,
              '&::-webkit-scrollbar': { width: '3px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: P.border, borderRadius: '4px' },
            }}>
              {filteredTeams.map(team => {
                const sel = setupData.teamName === team.name;
                const b   = window.teamBranding?.[team.name];
                const pri = b?.primary   || P.green;
                const sec = b?.secondary || '#ffffff';
                const oClr = ovrColor(team.strength);

                return (
                  <Box key={team.id}
                    onClick={() => up({ teamName: team.name, existingTeamId: team.id, stadiumName: '', _colorsSet: false })}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.2,
                      bgcolor: sel ? `${pri}10` : P.surface,
                      border: `1.5px solid ${sel ? pri : P.border}`,
                      borderRadius: '14px', px: 1.2, py: 0.8, cursor: 'pointer',
                      transition: 'all 0.12s',
                      boxShadow: sel ? `0 2px 12px ${pri}20` : '0 1px 3px rgba(0,0,0,0.04)',
                      '&:active': { transform: 'scale(0.985)' },
                    }}
                  >
                    <Box sx={{ flexShrink: 0 }}>
                      <ShirtSVG primary={pri} secondary={sec} number="10" size={44} />
                    </Box>
                    <Box sx={{ flexShrink: 0 }}>
                      <TeamIconComp name={team.name} size={32} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        color: sel ? pri : P.txt1, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1.1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {team.name}
                      </Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>
                        {fmt(team.money || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: `${oClr}15`, border: `1.5px solid ${oClr}40`, borderRadius: '8px', px: 0.8, py: 0.4, flexShrink: 0 }}>
                      <Typography sx={{ color: oClr, fontWeight: 900, fontSize: '0.78rem', lineHeight: 1 }}>{team.strength}</Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.4rem', fontWeight: 700 }}>OVR</Typography>
                    </Box>
                    {sel && (
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: pri, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 900 }}>✓</Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {selTeam && (() => {
              const b    = window.teamBranding?.[selTeam.name];
              const pri  = b?.primary   || P.green;
              const sec  = b?.secondary || '#ffffff';
              const info = window.clubsDatabase?.[selTeam.name];
              const st   = window.getTeamStadium?.(selTeam.name);
              return (
                <Box sx={{ bgcolor: P.surface, border: `1.5px solid ${pri}30`, borderRadius: '14px', overflow: 'hidden', mb: 1, boxShadow: `0 2px 16px ${pri}12` }}>
                  <Box sx={{ height: 3, background: `linear-gradient(90deg,${pri},${sec})` }} />
                  <Box sx={{ px: 1.4, py: 1, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <TeamIconComp name={selTeam.name} size={42} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>{selTeam.name}</Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.6rem', fontWeight: 700 }}>OVR {selTeam.strength} · {fmt(selTeam.money || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <ShirtSVG primary={pri} secondary={sec} number="10" size={32} />
                      <ShirtSVG primary={sec} secondary={pri} number="1" size={32} />
                    </Box>
                  </Box>
                  {st && (
                    <Box sx={{ px: 1.4, py: 0.6, display: 'flex', gap: 0.8, borderTop: `1px solid ${P.border}` }}>
                      <Typography sx={{ fontSize: '0.8rem' }}>🏟️</Typography>
                      <Typography sx={{ color: P.txt2, fontSize: '0.68rem', fontWeight: 700 }}>{st}</Typography>
                    </Box>
                  )}
                  {info?.titles && (
                    <Box sx={{ px: 1.4, pb: 1, pt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.4, borderTop: `1px solid ${P.border}` }}>
                      {[
                        { icon: '🏆', label: 'Brasileirão',    v: info.titles.brasileirao },
                        { icon: '🌎', label: 'Libertadores',   v: info.titles.libertadores },
                        { icon: '🥇', label: 'Copa do Brasil', v: info.titles.copaBrasil },
                      ].filter(t => t.v > 0).map((t, i) => (
                        <Box key={i} sx={{ bgcolor: P.goldLight, border: `1px solid ${P.gold}30`, borderRadius: '20px', px: 0.8, py: 0.25, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <Typography sx={{ fontSize: '0.6rem' }}>{t.icon}</Typography>
                          <Typography sx={{ color: P.gold, fontWeight: 900, fontSize: '0.58rem' }}>{t.v}× {t.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })()}
          </>
        )}

        {!useExistingTeam && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, flex: 1, mb: 1 }}>
            <Box>
              <SectionLabel label="NOME DO CLUBE" />
              <input className="setup-input" value={setupData.teamName || ''} onChange={e => up({ teamName: e.target.value })} placeholder="Ex: Esporte Clube Guerreiro" style={inputStyle} />
            </Box>
            <Box>
              <SectionLabel label="NOME DO ESTÁDIO" />
              <input className="setup-input" value={setupData.stadiumName || ''} onChange={e => up({ stadiumName: e.target.value })} placeholder="Ex: Arena do Povo" style={inputStyle} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.7 }}>
                {['Arena Central', 'Arena do Povo', 'Estádio Municipal', 'Arena da Cidade', 'Estádio Olímpico'].map(s => (
                  <Box key={s} onClick={() => up({ stadiumName: s })} sx={{
                    bgcolor: setupData.stadiumName === s ? P.greenLight : P.bg,
                    border: `1px solid ${setupData.stadiumName === s ? P.green : P.border}`,
                    borderRadius: '8px', px: 0.9, py: 0.35, cursor: 'pointer',
                  }}>
                    <Typography sx={{ color: setupData.stadiumName === s ? P.greenDark : P.txt3, fontWeight: 900, fontSize: '0.6rem' }}>{s}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            {(() => {
              const s = setupData.serie || 'D';
              const mins = { A: 10e6, B: 10e6, C: 10e6, D: 10e6 };
              const maxs = { A: 160e6, B: 40e6, C: 20e6, D: 15e6 };
              const stps = { A: 5e6, B: 2e6, C: 1e6, D: 1e6 };
              const cur  = setupData.initialMoney ?? 10e6;
              const mn = mins[s], mx = maxs[s], st = stps[s];
              const pct = ((cur - mn) / (mx - mn)) * 100;
              return (
                <Box sx={{ bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '12px', p: 1.3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <SectionLabel label="ORÇAMENTO INICIAL" />
                    <Typography sx={{ color: P.green, fontWeight: 900, fontSize: '0.88rem' }}>{fmt(cur)}</Typography>
                  </Box>
                  <Box sx={{ position: 'relative', height: 20 }}>
                    <Box sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, height: 6, bgcolor: P.bg, borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: P.green, borderRadius: 3 }} />
                    </Box>
                    <input type="range" min={mn} max={mx} step={st} value={cur}
                      onChange={e => up({ initialMoney: Number(e.target.value) })}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
                  </Box>
                </Box>
              );
            })()}
          </Box>
        )}

        <NavRow onBack={() => goCard(1)} onNext={() => goCard(3)} disabled={!isCardValid(2)} nextLabel="OBJETIVOS" />
      </Box>
    );
  };

  // ── CARD 3 — Save & Objetivos ─────────────────────────────────────────
  const Card3 = () => {
    const serie = setupData.serie || 'A';
    const OBJECTIVES = [
      { id: 'champion',     icon: '🏆', label: 'Ser Campeão',      desc: '1º lugar na tabela',           pressure: 'Alta',  available: ['A','B','C','D'] },
      { id: 'promotion',    icon: '⬆️', label: 'Subir de Divisão', desc: 'Terminar no Top 4',             pressure: 'Média', available: ['B','C','D'] },
      { id: 'libertadores', icon: '🌎', label: 'Libertadores',     desc: 'Top 6 na Série A',              pressure: 'Média', available: ['A'] },
      { id: 'sulamericana', icon: '🌐', label: 'Sul-Americana',    desc: 'Entre 7º e 12º na Série A',     pressure: 'Baixa', available: ['A'] },
      { id: 'survive',      icon: '🛡️', label: 'Não Rebaixar',     desc: 'Fora da zona de rebaixamento',  pressure: 'Baixa', available: ['A','B','C','D'] },
      { id: 'midtable',     icon: '📊', label: 'Meio da Tabela',   desc: 'Entre 7º e 14º lugar',          pressure: 'Baixa', available: ['A','B','C','D'] },
    ].filter(o => o.available.includes(serie));

    const pressColor = { 'Alta': P.red,  'Média': P.gold,     'Baixa': P.green       };
    const pressLight = { 'Alta': P.redLight, 'Média': P.goldLight, 'Baixa': P.greenLight };
    const sel = setupData.seasonObjective;

    React.useEffect(() => {
      if (!setupData.saveName && setupData.teamName) up({ saveName: setupData.teamName });
    }, []);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardHeader icon="📋" step={3} title="Save & Objetivos" />

        <Box sx={{ mb: 2 }}>
          <SectionLabel label="NOME DO SAVE" />
          <input className="setup-input" value={setupData.saveName || ''} onChange={e => up({ saveName: e.target.value })} placeholder="Ex: Rumo ao Acesso, Glória Eterna..." style={inputStyle} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.7 }}>
            {[setupData.teamName, `${setupData.teamName} — Glória`, 'Rumo ao Topo', 'A Grande Virada'].filter(Boolean).map(s => (
              <Box key={s} onClick={() => up({ saveName: s })} sx={{
                bgcolor: setupData.saveName === s ? P.greenLight : P.bg,
                border: `1px solid ${setupData.saveName === s ? P.green : P.border}`,
                borderRadius: '8px', px: 0.9, py: 0.35, cursor: 'pointer',
              }}>
                <Typography sx={{ color: setupData.saveName === s ? P.greenDark : P.txt3, fontWeight: 900, fontSize: '0.6rem' }}>{s}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ height: 1, bgcolor: P.border, mb: 1.5 }} />
        <SectionLabel label="OBJETIVO DA TEMPORADA" />

        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.7, mb: 1, '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { bgcolor: P.border, borderRadius: '4px' } }}>
          {OBJECTIVES.map(obj => {
            const active = sel === obj.id;
            const pClr   = pressColor[obj.pressure];
            const pLt    = pressLight[obj.pressure];
            return (
              <Box key={obj.id} onClick={() => up({ seasonObjective: obj.id })} sx={{
                display: 'flex', alignItems: 'center', gap: 1.2,
                bgcolor: active ? `${pClr}08` : P.surface,
                border: `1.5px solid ${active ? pClr : P.border}`,
                borderRadius: '14px', px: 1.3, py: 1, cursor: 'pointer',
                transition: 'all 0.15s', boxShadow: active ? `0 2px 14px ${pClr}15` : '0 1px 3px rgba(0,0,0,0.04)',
                '&:active': { transform: 'scale(0.99)' },
              }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', flexShrink: 0, bgcolor: active ? `${pClr}15` : P.bg, border: `1.5px solid ${active ? pClr + '40' : P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{obj.icon}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: active ? pClr : P.txt1, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>{obj.label}</Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>{obj.desc}</Typography>
                </Box>
                <Box sx={{ bgcolor: pLt, border: `1px solid ${pClr}30`, borderRadius: '8px', px: 0.7, py: 0.4, flexShrink: 0, textAlign: 'center' }}>
                  <Typography sx={{ color: pClr, fontWeight: 900, fontSize: '0.52rem' }}>{obj.pressure}</Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.4rem', fontWeight: 700 }}>PRESSÃO</Typography>
                </Box>
                {active && (
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: pClr, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>✓</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <NavRow onBack={() => goCard(2)} onNext={() => goCard(4)} disabled={!isCardValid(3)} nextLabel="PERFIL DO TÉCNICO" />
      </Box>
    );
  };

  // ── CARD 4 — Técnico ─────────────────────────────────────────────────
  const Card4 = () => {
    const NATS = ['Brasileiro','Argentino','Português','Espanhol','Italiano','Alemão','Francês','Inglês','Uruguaio','Colombiano','Chileno','Paraguaio','Holandês','Belga','Croata','Japonês'];
    const STLS = [
      { id: 'Defensivo',   icon: '🛡️', desc: 'Solidez defensiva' },
      { id: 'Equilibrado', icon: '⚖️', desc: 'Equilíbrio tático'  },
      { id: 'Ofensivo',    icon: '⚔️', desc: 'Alta pressão'        },
      { id: 'Direto',      icon: '🎯', desc: 'Bola direta'         },
    ];
    const FMTS = ['4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3','5-3-2'];
    const AVST = [
      { id: 'suit',    emoji: '🤵', label: 'Terno'   },
      { id: 'jacket',  emoji: '🧥', label: 'Jaqueta' },
      { id: 'glasses', emoji: '🕶️', label: 'Óculos'  },
      { id: 'cap',     emoji: '🧢', label: 'Boné'    },
      { id: 'beard',   emoji: '🧔', label: 'Barba'   },
      { id: 'headset', emoji: '🎧', label: 'Fone'    },
    ];
    const selSt = setupData.avatarStyle || 'suit';
    const emoji = AVST.find(s => s.id === selSt)?.emoji || '🤵';
    const name  = setupData.managerName || '';
    const inits = name.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '??';
    const natColors = { 'Brasileiro': '#009c3b', 'Argentino': '#74acdf', 'Português': '#006600', 'Espanhol': '#c60b1e', 'Italiano': '#009246', 'Alemão': '#4a4a4a', 'Francês': '#0055a4', 'Inglês': '#cf142b' };
    const avBg = natColors[setupData.managerNationality] || '#1a3a5f';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardHeader icon="👔" step={4} title="Perfil do Técnico" sub="PERSONALIZE O TREINADOR" />

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ width: 76, height: 76, borderRadius: '22px', background: `linear-gradient(135deg,${avBg},${avBg}aa)`, border: `2.5px solid ${P.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 24px ${P.shadow}` }}>
              <Typography sx={{ fontSize: '2.8rem', lineHeight: 1 }}>{emoji}</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: P.green, borderRadius: '10px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${P.bg}`, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>{inits}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.6, mb: 1.5 }}>
          {AVST.map(s => {
            const active = selSt === s.id;
            return (
              <Box key={s.id} onClick={() => up({ avatarStyle: s.id })} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                bgcolor: active ? P.greenLight : P.surface,
                border: `1.5px solid ${active ? P.green : P.border}`,
                borderRadius: '10px', px: 0.7, py: 0.6, cursor: 'pointer',
                boxShadow: active ? `0 2px 10px ${P.shadow}` : 'none', transition: 'all 0.15s',
              }}>
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{s.emoji}</Typography>
                <Typography sx={{ color: active ? P.greenDark : P.txt3, fontWeight: 900, fontSize: '0.46rem' }}>{s.label.toUpperCase()}</Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ height: 1, bgcolor: P.border, mb: 1.5 }} />

        <Box sx={{ mb: 1.2 }}>
          <SectionLabel label="NOME DO TREINADOR" />
          <input className="setup-input" value={setupData.managerName || ''} onChange={e => up({ managerName: e.target.value })} placeholder="Ex: José Mourinho" style={inputStyle} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.2 }}>
          <Box>
            <SectionLabel label="IDADE" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '10px', px: 1, py: 0.6 }}>
              <Button onClick={() => up({ managerAge: Math.max(25, (setupData.managerAge || 40) - 1) })} sx={{ minWidth: 0, p: 0, color: P.green, fontWeight: 900, fontSize: '1.2rem' }}>−</Button>
              <Typography sx={{ flex: 1, textAlign: 'center', color: P.txt1, fontWeight: 900, fontSize: '1.15rem' }}>{setupData.managerAge || 40}</Typography>
              <Button onClick={() => up({ managerAge: Math.min(75, (setupData.managerAge || 40) + 1) })} sx={{ minWidth: 0, p: 0, color: P.green, fontWeight: 900, fontSize: '1.2rem' }}>+</Button>
            </Box>
          </Box>
          <Box>
            <SectionLabel label="NACIONALIDADE" />
            <select value={setupData.managerNationality || 'Brasileiro'} onChange={e => up({ managerNationality: e.target.value })} style={{ ...inputStyle, padding: '9px 10px', appearance: 'none', cursor: 'pointer' }}>
              {NATS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Box>
        </Box>

        <Box sx={{ mb: 1.2 }}>
          <SectionLabel label="ESTILO DE JOGO" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.6 }}>
            {STLS.map(s => {
              const active = setupData.managerStyle === s.id;
              return (
                <Box key={s.id} onClick={() => up({ managerStyle: s.id })} sx={{
                  bgcolor: active ? P.greenLight : P.surface,
                  border: `1.5px solid ${active ? P.green : P.border}`,
                  borderRadius: '10px', p: 0.9, cursor: 'pointer', textAlign: 'center',
                  boxShadow: active ? `0 2px 10px ${P.shadow}` : 'none', transition: 'all 0.15s',
                }}>
                  <Typography sx={{ fontSize: '1.15rem', lineHeight: 1, mb: 0.3 }}>{s.icon}</Typography>
                  <Typography sx={{ color: active ? P.greenDark : P.txt2, fontWeight: 900, fontSize: '0.6rem' }}>{s.id}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <SectionLabel label="FORMAÇÃO PREFERIDA" />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {FMTS.map(f => {
              const active = setupData.managerFormation === f;
              return (
                <Box key={f} onClick={() => up({ managerFormation: f })} sx={{
                  bgcolor: active ? P.green : P.surface,
                  border: `1.5px solid ${active ? P.green : P.border}`,
                  borderRadius: '8px', px: 1.1, py: 0.5, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <Typography sx={{ color: active ? '#fff' : P.txt2, fontWeight: 900, fontSize: '0.8rem' }}>{f}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <NavRow onBack={() => goCard(3)} onNext={() => goCard(5)} disabled={!isCardValid(4)} nextLabel="VER UNIFORME" />
      </Box>
    );
  };

  // ── CARD 5 — Uniforme ─────────────────────────────────────────────────
  const Card5 = () => {
    const b   = brand;
    const pri = setupData.colorPrimary   || b?.primary   || '#10b981';
    const sec = setupData.colorSecondary || b?.secondary || '#ffffff';
    const PALETTES = [
      { name: 'Rubro-Negro',  p: '#cc0000', s: '#1a1a1a' },
      { name: 'Alviverde',    p: '#006600', s: '#ffffff'  },
      { name: 'Tricolor',     p: '#cc0000', s: '#ffffff'  },
      { name: 'Alviceleste',  p: '#0044cc', s: '#ffffff'  },
      { name: 'Azul-Preto',   p: '#001a66', s: '#1a1a1a'  },
      { name: 'Alvinegro',    p: '#1a1a1a', s: '#ffffff'  },
      { name: 'Dourado',      p: '#c8920f', s: '#1a1a1a'  },
      { name: 'Roxo',         p: '#7b2d8b', s: '#ffffff'  },
      { name: 'Laranja',      p: '#d14f00', s: '#ffffff'  },
      { name: 'Marinho',      p: '#003580', s: '#ffffff'  },
    ];
    const UNIFORMS = [
      { primary: pri, secondary: sec,       number: '10', label: 'TITULAR'  },
      { primary: sec, secondary: pri,       number: '1',  label: 'RESERVA'  },
      { primary: '#1e2430', secondary: pri, number: '7',  label: '3º UNIF.' },
    ];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardHeader icon="👕" step={5} title="Uniforme do Clube" sub="AS CORES QUE REPRESENTAM SEU TIME" />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mb: 2.5, bgcolor: P.surface, borderRadius: '16px', py: 2.5, px: 1.5, border: `1.5px solid ${P.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          {UNIFORMS.map((sh, i) => (
            <Box key={i} sx={{ textAlign: 'center', opacity: i === 2 ? 0.5 : 1 }}>
              <ShirtSVG primary={sh.primary} secondary={sh.secondary} number={sh.number} size={80} />
              <Typography sx={{ color: P.txt3, fontSize: '0.55rem', fontWeight: 900, mt: 0.7, letterSpacing: 1 }}>{sh.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '14px', p: 1.4, mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.2, mb: 1.2 }}>
            {[{ label: 'COR PRINCIPAL', key: 'colorPrimary', val: pri }, { label: 'COR SECUNDÁRIA', key: 'colorSecondary', val: sec }].map(c => (
              <Box key={c.key} sx={{ flex: 1 }}>
                <SectionLabel label={c.label} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '9px', flexShrink: 0, bgcolor: c.val, border: `2px solid ${P.border}`, boxShadow: `0 2px 8px ${c.val}30` }} />
                  <input type="color" value={c.val} onChange={e => up({ [c.key]: e.target.value })} style={{ flex: 1, height: 36, borderRadius: '9px', border: `1.5px solid ${P.border}`, cursor: 'pointer', background: 'transparent', padding: 2 }} />
                </Box>
              </Box>
            ))}
          </Box>
          <SectionLabel label="PALETAS RÁPIDAS" />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {PALETTES.map(pr => {
              const isActive = setupData.colorPrimary === pr.p && setupData.colorSecondary === pr.s;
              return (
                <Box key={pr.name} onClick={() => up({ colorPrimary: pr.p, colorSecondary: pr.s })} title={pr.name}
                  sx={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${isActive ? P.green : P.border}`, cursor: 'pointer', transition: 'transform 0.12s, border-color 0.12s', '&:hover': { transform: 'scale(1.1)', borderColor: P.green } }}>
                  <Box sx={{ width: 22, height: 22, bgcolor: pr.p }} />
                  <Box sx={{ width: 22, height: 22, bgcolor: pr.s }} />
                </Box>
              );
            })}
          </Box>
        </Box>

        <NavRow onBack={() => goCard(4)} onNext={() => goCard(6)} nextLabel="VER CONTRATO" />
      </Box>
    );
  };

  // ── CARD 6 — Contrato ─────────────────────────────────────────────────
  const Card6 = () => {
    const b   = brand;
    const pri = setupData.colorPrimary   || b?.primary   || P.green;
    const sec = setupData.colorSecondary || b?.secondary || '#ffffff';
    const OBJ = {
      champion: '🏆 Ser Campeão', promotion: '⬆️ Subir de Divisão',
      libertadores: '🌎 Libertadores', sulamericana: '🌐 Sul-Americana',
      survive: '🛡️ Não Rebaixar', midtable: '📊 Meio da Tabela',
    };
    const STLS = [{ id: 'Defensivo', icon: '🛡️' }, { id: 'Equilibrado', icon: '⚖️' }, { id: 'Ofensivo', icon: '⚔️' }, { id: 'Direto', icon: '🎯' }];

    const handleSign = () => {
      setSigning(true);
      setTimeout(() => setSigned(true), 1600);
      setTimeout(() => handleStartNewGame(setupData), 3100);
    };

    if (signed) return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
        <Box sx={{ fontSize: '4.5rem', mb: 1.5, animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', '@keyframes popIn': { '0%': { transform: 'scale(0)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } } }}>🎉</Box>
        <Typography sx={{ color: P.green, fontWeight: 900, fontSize: '1.5rem', fontFamily: '"Nunito",sans-serif', mb: 0.5 }}>CONTRATO ASSINADO!</Typography>
        <Typography sx={{ color: P.txt3, fontSize: '0.88rem', mb: 2.5 }}>Iniciando em {setupData.teamName}...</Typography>
        <Box sx={{ width: 200, height: 5, bgcolor: P.border, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', bgcolor: P.green, borderRadius: 3, animation: 'barFill 1.5s ease forwards', '@keyframes barFill': { from: { width: '0%' }, to: { width: '100%' } } }} />
        </Box>
      </Box>
    );

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardHeader icon="✍️" step={6} title="Assinar Contrato" sub="REVISE TODOS OS DETALHES" />

        <Box sx={{ flex: 1, overflowY: 'auto', mb: 1 }}>
          <Box sx={{ bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg,${pri},${sec})` }} />

            <Box sx={{ px: 1.6, py: 1.3, bgcolor: `${pri}08`, borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box>
                <Typography sx={{ color: P.txt3, fontSize: '0.48rem', fontWeight: 700, letterSpacing: 1.5, mb: 0.2 }}>CONTRATO DE TRABALHO — TÉCNICO DE FUTEBOL</Typography>
                <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.2rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1 }}>{setupData.teamName}</Typography>
                <Typography sx={{ color: P.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>Série {setupData.serie} · Temporada 2026</Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                <ShirtSVG primary={pri} secondary={sec} number="10" size={36} />
                <ShirtSVG primary={sec} secondary={pri} number="1" size={36} />
              </Box>
            </Box>

            <Box sx={{ px: 1.6, py: 1.2 }}>
              {[
                { icon: '🎯', label: 'OBJETIVO',    value: OBJ[setupData.seasonObjective] || '—' },
                { icon: '⚙️', label: 'DIFICULDADE', value: setupData.difficulty || 'Normal' },
                { icon: '🎮', label: 'ESTILO',       value: `${STLS.find(s => s.id === setupData.managerStyle)?.icon || ''} ${setupData.managerStyle || 'Equilibrado'}` },
                { icon: '📐', label: 'FORMAÇÃO',     value: setupData.managerFormation || '4-4-2' },
                { icon: '🏟️', label: 'ESTÁDIO',      value: setupData.stadiumName || `Arena ${setupData.teamName}` },
                { icon: '💰', label: 'ORÇAMENTO',    value: fmt(setupData.initialMoney) },
                { icon: '💾', label: 'SAVE',         value: `"${setupData.saveName}"` },
              ].map((row, i, arr) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.7, borderBottom: i < arr.length - 1 ? `1px solid ${P.bg}` : 'none' }}>
                  <Typography sx={{ fontSize: '0.85rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{row.icon}</Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.58rem', fontWeight: 900, width: 76, flexShrink: 0, letterSpacing: 0.5 }}>{row.label}</Typography>
                  <Typography sx={{ color: P.txt1, fontSize: '0.72rem', fontWeight: 900 }}>{row.value}</Typography>
                </Box>
              ))}

              <Box sx={{ mt: 1.8, pt: 1.2, borderTop: `1.5px dashed ${P.border}` }}>
                {signing ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: P.green, fontSize: '0.7rem', fontWeight: 700, mb: 0.8 }}>✍️ Registrando assinatura...</Typography>
                    <Box sx={{ height: 4, bgcolor: P.bg, borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', bgcolor: P.green, borderRadius: 2, animation: 'signAnim 1.6s ease forwards', '@keyframes signAnim': { from: { width: '0%' }, to: { width: '100%' } } }} />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.05rem', fontStyle: 'italic', fontFamily: '"Nunito",sans-serif', borderBottom: `2px solid ${P.border}`, pb: 0.3, mb: 0.3 }}>
                        {setupData.managerName || '_________________'}
                      </Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.48rem', fontWeight: 900, letterSpacing: 1 }}>TÉCNICO</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.05rem', fontStyle: 'italic', fontFamily: '"Nunito",sans-serif', borderBottom: `2px solid ${P.border}`, pb: 0.3, mb: 0.3 }}>
                        {setupData.teamName || '_________________'}
                      </Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.48rem', fontWeight: 900, letterSpacing: 1 }}>CLUBE</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => goCard(5)} disabled={signing} sx={{ color: P.txt3, border: `1.5px solid ${P.border}`, borderRadius: '12px', fontWeight: 900, px: 2.5, minWidth: 80, bgcolor: 'transparent', '&:hover': { borderColor: P.green, color: P.green } }}>← Voltar</Button>
          <Button fullWidth disabled={signing} onClick={handleSign} sx={{ py: 1.5, fontWeight: 900, fontSize: '1.05rem', borderRadius: '12px', bgcolor: signing ? P.bg : P.green, color: signing ? P.txt3 : '#fff', boxShadow: signing ? 'none' : `0 4px 20px ${P.shadow}`, border: `1.5px solid ${signing ? P.border : P.green}`, '&:hover': { bgcolor: signing ? P.bg : P.greenDark }, transition: 'all 0.2s' }}>
            {signing ? '⌛ Assinando...' : '✍️ ASSINAR CONTRATO'}
          </Button>
        </Box>
      </Box>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: P.bg,
      background: `radial-gradient(ellipse at 60% 0%, rgba(16,185,129,0.07) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(16,185,129,0.04) 0%, transparent 40%), ${P.bg}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto',
    }}>
      <style>{`
        .setup-input:focus { border-color: #10b981 !important; }
        .setup-input::placeholder { color: #b5d4c2; }
        select option { background: #fff; color: #0d1f17; }
      `}</style>

      <Box sx={{ width: '100%', maxWidth: 440, px: 2, pt: 4, pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: P.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${P.shadow}` }}>
              <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>⚽</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.0rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1 }}>TÁTICA MANAGER</Typography>
              <Typography sx={{ color: P.green, fontWeight: 900, fontSize: '0.46rem', letterSpacing: 3, lineHeight: 1 }}>MANAGER · NOVA CARREIRA</Typography>
            </Box>
          </Box>
          <Box sx={{ bgcolor: P.surface, border: `1px solid ${P.border}`, borderRadius: '8px', px: 1.1, py: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Typography sx={{ color: P.green, fontWeight: 900, fontSize: '0.68rem' }}>{card}/{TOTAL_CARDS}</Typography>
          </Box>
        </Box>
        <ProgressBar />
      </Box>

      <Box sx={{
        width: '100%', maxWidth: 440, px: 2, pb: 3,
        flex: 1, display: 'flex', flexDirection: 'column',
        opacity: entering ? 0 : 1,
        transform: entering ? 'translateY(10px)' : 'translateY(0px)',
        transition: 'opacity 0.17s ease, transform 0.17s ease',
      }}>
        {card === 1 && <Card1 />}
        {card === 2 && <Card2 />}
        {card === 3 && <Card3 />}
        {card === 4 && <Card4 />}
        {card === 5 && <Card5 />}
        {card === 6 && <Card6 />}
      </Box>
    </Box>
  );
};

export default ScreenSetup;
