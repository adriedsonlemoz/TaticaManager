import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel, SetupShirt } from '../SetupUi.jsx';
import { TeamIcon } from '../../../data/database_branding.js';
import { teamBranding } from '../../../data/teamBranding.js';
import { getTeamStadium } from '../../../data/database_coaches.js';
import { clubsDatabase } from '../../../data/database_clubs.js';

const SetupClubStep = ({
  setupData, up, goCard, isCardValid, availableTeams, brand,
  useExistingTeam, setUseExistingTeam, teamSearch, setTeamSearch,
  signing, setSigning, signed, setSigned, handleStartNewGame, savesList, setScreen,
}) => {
    const TeamIconComp = TeamIcon;

    const selTeam = availableTeams.find(t => t.name === setupData.teamName);
    const filteredTeams = teamSearch.trim()
      ? availableTeams.filter(t => t.name.toLowerCase().includes(teamSearch.trim().toLowerCase()))
      : availableTeams;

    const ovrColor = ovr => ovr >= 80 ? P.green : ovr >= 72 ? P.gold : ovr >= 65 ? '#f97316' : P.red;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SetupCardHeader icon="🏟️" step={2} title="Escolha seu Clube" sub={`SÉRIE ${setupData.serie} · ${availableTeams.length} TIMES DISPONÍVEIS`} />

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
                const b   = teamBranding?.[team.name];
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
                      <SetupShirt primary={pri} secondary={sec} number="10" size={44} />
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
              const b    = teamBranding?.[selTeam.name];
              const pri  = b?.primary   || P.green;
              const sec  = b?.secondary || '#ffffff';
              const info = clubsDatabase?.[selTeam.name];
              const st   = getTeamStadium?.(selTeam.name);
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
                      <SetupShirt primary={pri} secondary={sec} number="10" size={32} />
                      <SetupShirt primary={sec} secondary={pri} number="1" size={32} />
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
              <SetupSectionLabel label="NOME DO CLUBE" />
              <input className="setup-input" value={setupData.teamName || ''} onChange={e => up({ teamName: e.target.value })} placeholder="Ex: Esporte Clube Guerreiro" style={inputStyle} />
            </Box>
            <Box>
              <SetupSectionLabel label="NOME DO ESTÁDIO" />
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
                    <SetupSectionLabel label="ORÇAMENTO INICIAL" />
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

        <SetupNavRow onBack={() => goCard(1)} onNext={() => goCard(3)} disabled={!isCardValid(2)} nextLabel="OBJETIVOS" />
      </Box>
    );
  };

export default SetupClubStep;
