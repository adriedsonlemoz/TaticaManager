import React from 'react';
import { Box, Typography } from '@mui/material';
import JerseyBadge from '../player/JerseyBadge.jsx';

const Marker = ({ marker, opponent = false }) => (
  <Box sx={{
    position:'absolute',
    left:`${(marker.x / 160) * 100}%`,
    top:`${(marker.y / 100) * 100}%`,
    transform:'translate(-50%, -50%)',
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
  }}>
    <JerseyBadge pos={marker.pos} num={marker.shirt} size={20} />
    <Box sx={{ bgcolor:'rgba(0,0,0,0.6)', borderRadius:'3px', px:'2.5px', py:'1px', mt:'1px', backdropFilter:'blur(2px)' }}>
      <Typography sx={{ color:opponent?'rgba(255,255,255,0.85)':'#fff', fontSize:'0.3rem', fontWeight:900, lineHeight:1, whiteSpace:'nowrap' }}>
        {marker.name}
      </Typography>
    </Box>
  </Box>
);

const MatchPlayerMarkers = ({ homeDots = [], awayDots = [] }) => (
  <Box sx={{ position:'absolute', inset:0, pointerEvents:'none' }}>
    {homeDots.map((marker) => <Marker key={`h_${marker.id}`} marker={marker} />)}
    {awayDots.map((marker) => <Marker key={`a_${marker.id}`} marker={marker} opponent />)}
  </Box>
);

export default MatchPlayerMarkers;
