import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { SETUP_PALETTE as P } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel, SetupShirt } from '../SetupUi.jsx';
import { TeamIcon } from '../../../data/database_branding.js';
import { getTeamKitIdentity, KIT_PATTERN_OPTIONS } from '../../../data/teamKitIdentity.js';

const SetupKitStep = ({ setupData, up, goCard }) => {
  const recommended = React.useMemo(() => getTeamKitIdentity(setupData.teamName), [setupData.teamName]);
  const pri = setupData.colorPrimary || recommended.primary;
  const sec = setupData.colorSecondary || recommended.secondary;
  const accent = setupData.kitAccent || recommended.accent;
  const pattern = setupData.kitPattern || recommended.pattern;

  const away = {
    primary:sec,
    secondary:pri,
    accent:recommended.away.accent || accent,
    pattern:recommended.away.pattern,
  };
  const third = {
    ...recommended.third,
    accent:recommended.third.accent || accent,
  };

  const restoreClubIdentity = () => up({
    colorPrimary:recommended.primary,
    colorSecondary:recommended.secondary,
    kitAccent:recommended.accent,
    kitPattern:recommended.pattern,
    _colorsSet:true,
    _kitSet:true,
  });

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <SetupCardHeader icon="👕" step={4} title="Uniformes do clube" sub="IDENTIDADE VISUAL BASEADA NAS CORES E NO ESTILO DO TIME" />

      <Box sx={{ flex:1, minHeight:0, overflowY:'auto', pr:.15, pb:.7, '&::-webkit-scrollbar':{ width:'4px' }, '&::-webkit-scrollbar-thumb':{ bgcolor:P.border, borderRadius:'4px' } }}>
        <Box sx={{ bgcolor:P.surface, border:`1.5px solid ${P.border}`, borderRadius:'16px', p:1.2, mb:1.35, boxShadow:'0 3px 14px rgba(0,0,0,.045)' }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.1 }}>
            <Box sx={{ width:45, height:45, borderRadius:'12px', bgcolor:P.bg, border:`1px solid ${P.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TeamIcon name={setupData.teamName} size={36} />
            </Box>
            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography sx={{ color:P.txt1, fontWeight:900, fontSize:'1rem', lineHeight:1.1 }}>{setupData.teamName}</Typography>
              <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.75rem', mt:.25 }}>Prévia dos três uniformes</Typography>
            </Box>
            <Button onClick={restoreClubIdentity} sx={{ color:P.greenDark, bgcolor:P.greenLight, border:`1px solid ${P.green}35`, borderRadius:'9px', fontWeight:900, fontSize:'.7rem', px:.8, py:.55 }}>
              Restaurar
            </Button>
          </Box>

          <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}>
            {[
              { label:'TITULAR', shirt:{ primary:pri, secondary:sec, accent, pattern, number:'10' } },
              { label:'RESERVA', shirt:{ ...away, number:'8' } },
              { label:'3º UNIFORME', shirt:{ ...third, number:'7' } },
            ].map(({ label, shirt }) => (
              <Box key={label} sx={{ bgcolor:P.bg, border:`1px solid ${P.border}`, borderRadius:'13px', py:1, px:.25, textAlign:'center' }}>
                <SetupShirt {...shirt} size={76} />
                <Typography sx={{ color:P.txt2, fontSize:'.66rem', fontWeight:900, mt:.45, letterSpacing:.6 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <SetupSectionLabel label="MODELO DO UNIFORME TITULAR" />
        <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.78rem', mb:.75 }}>
          O modelo recomendado já vem selecionado para aproximar a camisa da identidade do clube.
        </Typography>
        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:.7, mb:1.45 }}>
          {KIT_PATTERN_OPTIONS.map((option) => {
            const active = pattern === option.id;
            return (
              <Box
                key={option.id}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() => up({ kitPattern:option.id, _kitSet:true })}
                sx={{
                  minHeight:104, display:'flex', alignItems:'center', gap:.75, textAlign:'left',
                  bgcolor:active ? P.greenLight : P.surface, border:`1.5px solid ${active ? P.green : P.border}`,
                  borderRadius:'13px', p:.8, cursor:'pointer', transition:'all .14s', '&:active':{ transform:'scale(.985)' },
                }}
              >
                <Box sx={{ width:62, display:'flex', justifyContent:'center', flexShrink:0 }}>
                  <SetupShirt primary={pri} secondary={sec} accent={accent} pattern={option.id} number="" size={58} />
                </Box>
                <Box sx={{ minWidth:0 }}>
                  <Typography sx={{ color:active ? P.greenDark : P.txt1, fontWeight:900, fontSize:'.83rem', lineHeight:1.1 }}>{option.label}</Typography>
                  <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.66rem', lineHeight:1.25, mt:.3 }}>{option.description}</Typography>
                  {option.id === recommended.pattern && (
                    <Typography sx={{ color:P.green, fontWeight:900, fontSize:'.6rem', mt:.35 }}>★ RECOMENDADO</Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ bgcolor:P.surface, border:`1.5px solid ${P.border}`, borderRadius:'14px', p:1.1, mb:.5 }}>
          <SetupSectionLabel label="CORES DO UNIFORME" />
          <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.8 }}>
            {[
              { label:'Principal', key:'colorPrimary', value:pri },
              { label:'Secundária', key:'colorSecondary', value:sec },
              { label:'Detalhe', key:'kitAccent', value:accent },
            ].map((color) => (
              <Box key={color.key}>
                <Typography sx={{ color:P.txt2, fontWeight:800, fontSize:'.7rem', mb:.45 }}>{color.label}</Typography>
                <Box sx={{ display:'flex', alignItems:'center', gap:.45 }}>
                  <Box sx={{ width:34, height:34, borderRadius:'9px', bgcolor:color.value, border:`2px solid ${P.border}`, flexShrink:0 }} />
                  <input
                    type="color"
                    aria-label={`Cor ${color.label.toLowerCase()}`}
                    value={color.value}
                    onChange={(event) => up({ [color.key]:event.target.value, _colorsSet:true })}
                    style={{ width:'100%', minWidth:0, height:34, borderRadius:8, border:`1.5px solid ${P.border}`, cursor:'pointer', background:'transparent', padding:2 }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
          <Typography sx={{ color:P.txt3, fontWeight:700, fontSize:'.68rem', lineHeight:1.3, mt:.85 }}>
            Você ainda pode personalizar, mas “Restaurar” recupera a combinação recomendada do clube.
          </Typography>
        </Box>
      </Box>

      <SetupNavRow onBack={() => goCard(3)} onNext={() => goCard(5)} nextLabel="VER CONTRATO" />
    </Box>
  );
};

export default SetupKitStep;
