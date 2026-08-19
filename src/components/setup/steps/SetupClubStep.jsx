import React from 'react';
import { Box, Typography } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupShirt } from '../SetupUi.jsx';
import { TeamIcon } from '../../../data/database_branding.js';
import { getTeamBranding } from '../../../data/teamBranding.js';
import { getTeamStadium } from '../../../data/database_coaches.js';
import { getClubInfo } from '../../../data/database_clubs.js';
import { getSerieD2026GroupForClub } from '../../../data/serieD2026.js';
import { getSetupTeamSelectionPatch } from '../setupService.js';

const SERIES_STYLE = {
  A: { color: P.green, light: P.greenLight },
  B: { color: P.gold, light: P.goldLight },
  C: { color: P.blue, light: P.blueLight },
  D: { color: P.purple, light: P.purpleLight },
};

const SetupClubStep = ({
  setupData, up, goCard, isCardValid, availableTeams,
  teamSearch, setTeamSearch, savesList, setScreen,
}) => {
  const [serieFilter, setSerieFilter] = React.useState('ALL');
  const TeamIconComp = TeamIcon;
  const selected = availableTeams.find((team) => team.id === setupData.teamId) || null;
  const query = teamSearch.trim().toLocaleLowerCase('pt-BR');
  const filteredTeams = availableTeams.filter((team) => {
    if (serieFilter !== 'ALL' && team.serie2026 !== serieFilter) return false;
    if (!query) return true;
    const info = getClubInfo(team.name);
    return [team.name, ...(team.aliases || []), info?.city]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(query));
  });
  const counts = Object.fromEntries(['A','B','C','D'].map((serie) => [serie, availableTeams.filter((team) => team.serie2026 === serie).length]));

  const selectTeam = (team) => {
    const patch = getSetupTeamSelectionPatch(team.id);
    if (patch) up(patch);
  };

  const selectedBrand = selected ? getTeamBranding(selected.name) : null;
  const selectedInfo = selected ? getClubInfo(selected.name) : null;
  const selectedStadium = selected ? getTeamStadium(selected.name) : null;
  const selectedSerieStyle = SERIES_STYLE[selected?.serie2026] || SERIES_STYLE.A;
  const selectedGroup = selected?.serie2026 === 'D' ? getSerieD2026GroupForClub(selected.id) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SetupCardHeader icon="🏟️" step={1} title="Escolha seu Clube" sub="A DIVISÃO É DEFINIDA AUTOMATICAMENTE PELO CLUBE" />

      {selected && (
        <Box sx={{ mb: 0.65, bgcolor: P.surface, border: `1.5px solid ${selectedSerieStyle.color}45`, borderRadius: '12px', overflow: 'hidden', boxShadow: `0 4px 18px ${selectedSerieStyle.color}12` }}>
          <Box sx={{ height: 3, background: `linear-gradient(90deg,${selectedBrand?.primary || selectedSerieStyle.color},${selectedBrand?.secondary || '#fff'})` }} />
          <Box sx={{ p: 0.8, display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <TeamIconComp name={selected.name} size={40} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.1 }}>{selected.name}</Typography>
              <Typography sx={{ color: P.txt3, fontSize: '0.62rem', fontWeight: 700, mt: 0.25 }}>
                {[selectedInfo?.city, selectedStadium].filter(Boolean).join(' · ') || 'Clube selecionado'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', bgcolor: selectedSerieStyle.light, border: `1px solid ${selectedSerieStyle.color}40`, borderRadius: '10px', px: 0.75, py: 0.4 }}>
              <Typography sx={{ color: selectedSerieStyle.color, fontWeight: 900, fontSize: '0.82rem', lineHeight: 1 }}>SÉRIE {selected.serie2026}</Typography>
              {selectedGroup && <Typography sx={{ color: P.txt3, fontWeight: 800, fontSize: '0.48rem', mt: 0.2 }}>GRUPO {selectedGroup}</Typography>}
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ position: 'relative', mb: 0.35 }}>
        <input
          className="setup-input"
          value={teamSearch}
          onChange={(event) => setTeamSearch(event.target.value)}
          placeholder="Buscar clube pelo nome..."
          style={{ ...inputStyle, paddingLeft: 34, paddingRight: teamSearch ? 34 : 12 }}
        />
        <Typography sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }}>🔎</Typography>
        {teamSearch && (
          <Box onClick={() => setTeamSearch('')} sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', bgcolor: P.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: P.txt3, fontWeight: 900, fontSize: '0.75rem' }}>×</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 0.4, mb: 0.35, overflowX: 'auto', pb: 0.2 }}>
        {[{ id:'ALL', label:'Todos', count:availableTeams.length }, ...['A','B','C','D'].map((serie) => ({ id:serie, label:`Série ${serie}`, count:counts[serie] }))].map((filter) => {
          const active = serieFilter === filter.id;
          const style = SERIES_STYLE[filter.id] || { color:P.green, light:P.greenLight };
          return (
            <Box key={filter.id} onClick={() => setSerieFilter(filter.id)} sx={{ flexShrink: 0, cursor: 'pointer', borderRadius: '10px', px: 0.7, py: 0.42, bgcolor: active ? style.light : P.surface, border: `1.5px solid ${active ? style.color : P.border}`, transition: 'all .15s' }}>
              <Typography sx={{ color: active ? style.color : P.txt2, fontWeight: 900, fontSize: '0.62rem' }}>{filter.label} <span style={{ opacity:.65 }}>({filter.count})</span></Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.35 }}>
        <Typography sx={{ color: P.txt3, fontWeight: 900, fontSize: '0.55rem', letterSpacing: .6 }}>{filteredTeams.length} CLUBES ENCONTRADOS</Typography>
        <Typography sx={{ color: P.txt4, fontWeight: 700, fontSize: '0.52rem' }}>Selecione para continuar</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', mb: 0.5, display: 'grid', gridTemplateColumns: '1fr 1fr', alignContent: 'start', gap: 0.5, pr: 0.2, '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { bgcolor: P.border, borderRadius: '4px' } }}>
        {filteredTeams.map((team) => {
          const isSelected = setupData.teamId === team.id;
          const branding = getTeamBranding(team.name);
          const serieStyle = SERIES_STYLE[team.serie2026] || SERIES_STYLE.A;
          const info = getClubInfo(team.name);
          return (
            <Box key={team.id} onClick={() => selectTeam(team)} sx={{ position: 'relative', minWidth: 0, cursor: 'pointer', bgcolor: isSelected ? `${branding?.primary || serieStyle.color}0C` : P.surface, border: `1.5px solid ${isSelected ? (branding?.primary || serieStyle.color) : P.border}`, borderRadius: '11px', p: 0.7, transition: 'all .13s', boxShadow: isSelected ? `0 3px 14px ${branding?.primary || serieStyle.color}18` : '0 1px 4px rgba(0,0,0,.035)', '&:active': { transform:'scale(.98)' } }}>
              <Box sx={{ display:'flex', gap:.6, alignItems:'center', mb:.45 }}>
                <TeamIconComp name={team.name} size={32} />
                <Box sx={{ minWidth:0, flex:1 }}>
                  <Typography sx={{ color:P.txt1, fontWeight:900, fontSize:'.68rem', lineHeight:1.05, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{team.name}</Typography>
                  {info?.city && <Typography sx={{ color:P.txt3, fontWeight:700, fontSize:'.48rem', mt:.18, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{info.city}</Typography>}
                </Box>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:.45 }}>
                <Box sx={{ bgcolor:serieStyle.light, border:`1px solid ${serieStyle.color}30`, borderRadius:'7px', px:.55, py:.25 }}><Typography sx={{ color:serieStyle.color, fontWeight:900, fontSize:'.48rem' }}>SÉRIE {team.serie2026}</Typography></Box>
                <Typography sx={{ color:P.txt3, fontWeight:800, fontSize:'.48rem', ml:'auto' }}>OVR {team.strength}</Typography>
              </Box>
              <Typography sx={{ color:P.txt4, fontWeight:700, fontSize:'.45rem', mt:.3 }}>{fmt(team.money || 0)}</Typography>
              {isSelected && <Box sx={{ position:'absolute', top:6, right:6, width:18, height:18, borderRadius:'50%', bgcolor:branding?.primary || serieStyle.color, display:'flex', alignItems:'center', justifyContent:'center' }}><Typography sx={{ color:'#fff', fontWeight:900, fontSize:'.55rem' }}>✓</Typography></Box>}
            </Box>
          );
        })}
        {!filteredTeams.length && (
          <Box sx={{ gridColumn:'1 / -1', bgcolor:P.surface, border:`1.5px dashed ${P.border}`, borderRadius:'14px', py:2.5, textAlign:'center' }}>
            <Typography sx={{ fontSize:'1.5rem', mb:.5 }}>🔍</Typography>
            <Typography sx={{ color:P.txt2, fontWeight:900, fontSize:'.8rem' }}>Nenhum clube encontrado</Typography>
            <Typography sx={{ color:P.txt3, fontWeight:700, fontSize:'.6rem', mt:.25 }}>Tente outro nome ou remova o filtro de Série.</Typography>
          </Box>
        )}
      </Box>

      <SetupNavRow
        onBack={savesList.length > 0 ? () => setScreen('boot') : undefined}
        onNext={() => goCard(2)}
        nextLabel={selected ? `CONTINUAR COM ${selected.name.toUpperCase()}` : 'SELECIONE UM CLUBE'}
        disabled={!isCardValid(1)}
      />
    </Box>
  );
};

export default SetupClubStep;
