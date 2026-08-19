import React from 'react';
import { Box, Typography } from '@mui/material';
import { APP_NAME, APP_VERSION_LABEL } from '../../config/appMeta.js';

const Stat = ({ icon, label, value, theme }) => (
  <Box sx={{ textAlign:'center', minWidth:58 }}>
    <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>{icon}</Typography>
    <Typography sx={{ color:theme.ink, fontWeight:900, fontSize:'.95rem', lineHeight:1.25, mt:.15 }}>{value}</Typography>
    <Typography sx={{ color:theme.ink2, fontSize:'.62rem', fontWeight:800 }}>{label}</Typography>
  </Box>
);

const BootHeader = ({ stats, theme }) => {
  const C = theme;
  return (
    <Box sx={{ background:`linear-gradient(180deg,#ede4d4 0%,${C.bg} 100%)`, borderBottom:`1.5px solid ${C.border}`, px:1.4, pt:{ xs:1.4, sm:2 }, pb:1.1 }}>
      <Box sx={{ maxWidth:560, mx:'auto' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <Box sx={{ width:46, height:46, borderRadius:'13px', background:`linear-gradient(135deg,${C.green} 0%,#0f4a22 100%)`, border:`2px solid ${C.borderAcc}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px ${C.shadow}` }}>
            <Typography sx={{ fontSize:'1.8rem', lineHeight:1 }}>⚽</Typography>
          </Box>
          <Box sx={{ flex:1 }}>
            <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'1.3rem', lineHeight:1, fontFamily:'"Nunito",sans-serif' }}>{APP_NAME.toUpperCase()}</Typography>
            <Typography sx={{ color:C.ink2, fontWeight:800, fontSize:'.74rem', mt:.35 }}>Suas carreiras</Typography>
          </Box>
          <Box sx={{ bgcolor:`${C.green}14`, border:`1px solid ${C.green}35`, borderRadius:'8px', px:.65, py:.35 }}>
            <Typography sx={{ color:C.green, fontWeight:900, fontSize:'.6rem' }}>{APP_VERSION_LABEL}</Typography>
          </Box>
        </Box>

        {stats.saves > 0 && (
          <Box sx={{ display:'flex', justifyContent:'space-between', gap:.6, mt:1, bgcolor:'rgba(255,255,255,.55)', border:`1px solid ${C.border}`, borderRadius:'12px', px:.8, py:.65 }}>
            <Stat icon="📁" label="SAVES" value={stats.saves} theme={C} />
            <Stat icon="📅" label="TEMP." value={stats.seasons} theme={C} />
            <Stat icon="✅" label="VITÓRIAS" value={stats.wins} theme={C} />
            <Stat icon="🏆" label="TROFÉUS" value={stats.trophies} theme={C} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BootHeader;
