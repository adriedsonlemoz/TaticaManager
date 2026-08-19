import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow } from '../SetupUi.jsx';
import { TeamIcon } from '../../../data/database_branding.js';
import { getTeamBranding } from '../../../data/teamBranding.js';
import { getTeamStadium } from '../../../data/database_coaches.js';
import { getClubInfo } from '../../../data/database_clubs.js';
import { getSerieD2026GroupForClub } from '../../../data/serieD2026.js';
import { getSetupTeamSelectionPatch } from '../setupService.js';

const SERIES_STYLE = {
  A: { color:P.green, light:P.greenLight, icon:'🏆', title:'Série A', desc:'Elite nacional · 20 clubes' },
  B: { color:P.gold, light:P.goldLight, icon:'⬆️', title:'Série B', desc:'Disputa pelo acesso · 20 clubes' },
  C: { color:P.blue, light:P.blueLight, icon:'⚔️', title:'Série C', desc:'Campeonato nacional · 20 clubes' },
  D: { color:P.purple, light:P.purpleLight, icon:'🗺️', title:'Série D', desc:'16 grupos regionais · 96 clubes' },
};

const SetupClubStep = ({
  setupData, up, goCard, isCardValid, availableTeams,
  teamSearch, setTeamSearch, savesList, setScreen,
}) => {
  const [selectedSerie, setSelectedSerie] = React.useState(setupData.serie || null);
  const selected = availableTeams.find((team) => team.id === setupData.teamId) || null;
  const query = teamSearch.trim().toLocaleLowerCase('pt-BR');
  const counts = React.useMemo(() => Object.fromEntries(
    ['A','B','C','D'].map((serie) => [serie, availableTeams.filter((team) => team.serie2026 === serie).length]),
  ), [availableTeams]);

  const filteredTeams = React.useMemo(() => {
    if (!selectedSerie) return [];
    return availableTeams.filter((team) => {
      if (team.serie2026 !== selectedSerie) return false;
      if (!query) return true;
      const info = getClubInfo(team.name);
      return [team.name, ...(team.aliases || []), info?.city]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(query));
    });
  }, [availableTeams, query, selectedSerie]);

  const chooseSerie = (serie) => {
    if (selected && selected.serie2026 !== serie) {
      up({
        teamId:null, existingTeamId:null, teamName:'', serie:null,
        seasonObjective:null, stadiumName:'', _colorsSet:false, _kitSet:false,
      });
    }
    setSelectedSerie(serie);
    setTeamSearch('');
  };

  const selectTeam = (team) => {
    if (setupData.teamId === team.id) return;
    const patch = getSetupTeamSelectionPatch(team.id);
    if (patch) up({ ...patch, seasonObjective:null });
  };

  if (!selectedSerie) {
    return (
      <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
        <SetupCardHeader icon="🏟️" step={1} title="Escolha a divisão" sub="PRIMEIRO ESCOLHA A SÉRIE. DEPOIS VOCÊ VERÁ SOMENTE OS CLUBES DELA." />

        <Box sx={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:1.05, pr:.2, pb:1 }}>
          {['A','B','C','D'].map((serie) => {
            const style = SERIES_STYLE[serie];
            return (
              <Box
                key={serie}
                component="button"
                type="button"
                onClick={() => chooseSerie(serie)}
                sx={{
                  width:'100%', border:`1.5px solid ${style.color}40`, bgcolor:P.surface,
                  borderRadius:'16px', p:1.35, cursor:'pointer', display:'flex', alignItems:'center', gap:1.2,
                  textAlign:'left', boxShadow:'0 3px 12px rgba(0,0,0,.045)', transition:'transform .14s, border-color .14s, box-shadow .14s',
                  '&:hover':{ borderColor:style.color, boxShadow:`0 5px 18px ${style.color}18` }, '&:active':{ transform:'scale(.985)' },
                }}
              >
                <Box sx={{ width:52, height:52, borderRadius:'14px', bgcolor:style.light, border:`1px solid ${style.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Typography sx={{ fontSize:'1.55rem', lineHeight:1 }}>{style.icon}</Typography>
                </Box>
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography sx={{ color:P.txt1, fontWeight:900, fontSize:'1.08rem', lineHeight:1.1 }}>{style.title}</Typography>
                  <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.82rem', mt:.35 }}>{style.desc}</Typography>
                </Box>
                <Box sx={{ textAlign:'right', flexShrink:0 }}>
                  <Typography sx={{ color:style.color, fontWeight:900, fontSize:'1.05rem', lineHeight:1 }}>{counts[serie]}</Typography>
                  <Typography sx={{ color:P.txt3, fontWeight:800, fontSize:'.68rem', mt:.25 }}>CLUBES</Typography>
                </Box>
                <Typography sx={{ color:style.color, fontWeight:900, fontSize:'1.35rem' }}>›</Typography>
              </Box>
            );
          })}
        </Box>

        <Button
          onClick={() => setScreen('boot')}
          sx={{ alignSelf:'flex-start', color:P.txt2, border:`1.5px solid ${P.border}`, borderRadius:'11px', fontWeight:900, px:1.6, py:.9, fontSize:'.9rem' }}
        >
          ← {savesList?.length ? 'Carreiras' : 'Voltar'}
        </Button>
      </Box>
    );
  }

  const serieStyle = SERIES_STYLE[selectedSerie];
  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <SetupCardHeader icon={serieStyle.icon} step={1} title={`Escolha seu clube · Série ${selectedSerie}`} sub={`${counts[selectedSerie]} CLUBES DISPONÍVEIS`} />

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:1, mb:.85 }}>
        <Button
          onClick={() => { setSelectedSerie(null); setTeamSearch(''); }}
          sx={{ color:serieStyle.color, bgcolor:serieStyle.light, border:`1px solid ${serieStyle.color}35`, borderRadius:'10px', fontWeight:900, px:1.1, py:.65, fontSize:'.82rem' }}
        >
          ← Trocar divisão
        </Button>
        <Typography sx={{ color:P.txt2, fontWeight:900, fontSize:'.78rem' }}>SÉRIE {selectedSerie}</Typography>
      </Box>

      <Box sx={{ position:'relative', mb:.85 }}>
        <input
          className="setup-input"
          value={teamSearch}
          onChange={(event) => setTeamSearch(event.target.value)}
          placeholder={`Buscar clube da Série ${selectedSerie}...`}
          style={{ ...inputStyle, paddingLeft:38, paddingRight:teamSearch ? 38 : 12 }}
        />
        <Typography sx={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:'1rem' }}>🔎</Typography>
        {teamSearch && (
          <Box component="button" type="button" onClick={() => setTeamSearch('')} sx={{ position:'absolute', border:0, right:9, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', bgcolor:P.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Typography sx={{ color:P.txt2, fontWeight:900, fontSize:'1rem' }}>×</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:.6 }}>
        <Typography sx={{ color:P.txt2, fontWeight:900, fontSize:'.76rem' }}>{filteredTeams.length} clube{filteredTeams.length === 1 ? '' : 's'}</Typography>
        <Typography sx={{ color:P.txt3, fontWeight:700, fontSize:'.74rem' }}>Toque para selecionar</Typography>
      </Box>

      <Box sx={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:.7, mb:.8, pr:.15, '&::-webkit-scrollbar':{ width:'4px' }, '&::-webkit-scrollbar-thumb':{ bgcolor:P.border, borderRadius:'4px' } }}>
        {filteredTeams.map((team) => {
          const isSelected = setupData.teamId === team.id;
          const branding = getTeamBranding(team.name);
          const info = getClubInfo(team.name);
          const stadium = getTeamStadium(team.name);
          const group = team.serie2026 === 'D' ? getSerieD2026GroupForClub(team.id) : null;
          return (
            <Box
              key={team.id}
              component="button"
              type="button"
              aria-pressed={isSelected}
              onClick={() => selectTeam(team)}
              sx={{
                width:'100%', border:`1.5px solid ${isSelected ? (branding?.primary || serieStyle.color) : P.border}`,
                bgcolor:isSelected ? `${branding?.primary || serieStyle.color}0D` : P.surface,
                borderRadius:'14px', p:1, cursor:'pointer', display:'flex', alignItems:'center', gap:1,
                textAlign:'left', boxShadow:isSelected ? `0 4px 18px ${branding?.primary || serieStyle.color}18` : '0 2px 8px rgba(0,0,0,.035)',
                transition:'all .14s', '&:active':{ transform:'scale(.988)' },
              }}
            >
              <Box sx={{ width:54, height:54, borderRadius:'13px', bgcolor:P.bg, border:`1px solid ${P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <TeamIcon name={team.name} size={42} />
              </Box>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Typography sx={{ color:P.txt1, fontWeight:900, fontSize:'.98rem', lineHeight:1.15 }}>{team.name}</Typography>
                <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.76rem', mt:.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {[info?.city, stadium].filter(Boolean).join(' · ') || 'Clube oficial'}
                </Typography>
                <Box sx={{ display:'flex', alignItems:'center', gap:.7, flexWrap:'wrap', mt:.5 }}>
                  <Typography sx={{ color:serieStyle.color, bgcolor:serieStyle.light, borderRadius:'7px', px:.6, py:.2, fontWeight:900, fontSize:'.68rem' }}>OVR {team.strength}</Typography>
                  <Typography sx={{ color:P.txt2, fontWeight:800, fontSize:'.72rem' }}>{fmt(team.money || 0)}</Typography>
                  {group && <Typography sx={{ color:P.purple, fontWeight:900, fontSize:'.7rem' }}>Grupo {group}</Typography>}
                </Box>
              </Box>
              <Box sx={{ width:32, height:32, borderRadius:'50%', bgcolor:isSelected ? (branding?.primary || serieStyle.color) : P.bg, border:`1.5px solid ${isSelected ? (branding?.primary || serieStyle.color) : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Typography sx={{ color:isSelected ? '#fff' : P.txt3, fontWeight:900, fontSize:'1rem' }}>{isSelected ? '✓' : '›'}</Typography>
              </Box>
            </Box>
          );
        })}

        {!filteredTeams.length && (
          <Box sx={{ bgcolor:P.surface, border:`1.5px dashed ${P.border}`, borderRadius:'14px', py:3, px:1.5, textAlign:'center' }}>
            <Typography sx={{ fontSize:'1.8rem', mb:.6 }}>🔍</Typography>
            <Typography sx={{ color:P.txt1, fontWeight:900, fontSize:'.95rem' }}>Nenhum clube encontrado</Typography>
            <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.78rem', mt:.35 }}>Tente outro nome na busca.</Typography>
          </Box>
        )}
      </Box>

      <SetupNavRow
        onBack={() => { setSelectedSerie(null); setTeamSearch(''); }}
        onNext={() => goCard(2)}
        nextLabel={selected ? `CONTINUAR COM ${selected.name.toUpperCase()}` : 'SELECIONE UM CLUBE'}
        disabled={!isCardValid(1)}
      />
    </Box>
  );
};

export default SetupClubStep;
