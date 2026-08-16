import React from 'react';
import { Box, Typography } from '@mui/material';
import { buildFieldViewModel, FIELD_LAYOUTS, POSITION_LEGEND } from '../engines/field/fieldViewModel.js';
import FieldHeader from './field/FieldHeader.jsx';
import FieldLegend from './field/FieldLegend.jsx';
import FieldPlayerMarker from './field/FieldPlayerMarker.jsx';
import { FieldPitch, FieldPitchHorizontal } from './field/FieldPitch.jsx';

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 140;

export { FIELD_LAYOUTS, POSITION_LEGEND, FieldPitch, FieldPitchHorizontal };

export default function FieldView({ starters = [], formation = '4-4-2', teamOvr = 0, gameData, onPlayerClick, C, showLegend = true }) {
  const viewModel = buildFieldViewModel({ starters, formation, teamOvr, gameData });

  return (
    <Box sx={{ px:1.5, pt:1, pb:1.5 }}>
      <FieldHeader formation={viewModel.formation} startersCount={viewModel.startersCount} teamOvr={viewModel.teamOvr} C={C} />
      <Box sx={{ position:'relative', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.18)' }}>
        <FieldPitch VW={VIEW_WIDTH} VH={VIEW_HEIGHT} />
        <Box sx={{ position:'absolute', inset:0 }}>
          {viewModel.markers.map((marker) => <FieldPlayerMarker key={marker.player.id ?? marker.index} marker={marker} viewWidth={VIEW_WIDTH} viewHeight={VIEW_HEIGHT} onPlayerClick={onPlayerClick} C={C} />)}
        </Box>
        <Box sx={{ position:'absolute', left:'50%', top:'7px', transform:'translateX(-50%)', pointerEvents:'none' }}><Typography sx={{ color:'rgba(255,255,255,0.28)', fontSize:'0.32rem', fontWeight:900, letterSpacing:2, whiteSpace:'nowrap' }}>ATAQUE</Typography></Box>
        <Box sx={{ position:'absolute', left:'50%', bottom:'7px', transform:'translateX(-50%)', pointerEvents:'none' }}><Typography sx={{ color:'rgba(255,255,255,0.28)', fontSize:'0.32rem', fontWeight:900, letterSpacing:2, whiteSpace:'nowrap' }}>DEFESA</Typography></Box>
      </Box>
      {showLegend && <FieldLegend C={C} />}
    </Box>
  );
}
