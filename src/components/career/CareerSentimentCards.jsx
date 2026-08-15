import React from 'react';
import { Box, Typography } from '@mui/material';
import { getFanLoyaltySummary, getMoraleSummary } from '../../engines/career/careerViewModel.js';

const toneColor = (tone, C) => tone === 'green' ? C.green : tone === 'gold' ? C.gold : C.red;
const MetricCard = ({ title, emoji, summary, theme }) => {
  const C = theme;
  const color = toneColor(summary.tone, C);
  return <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', p:1.2 }}>
    <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5, mb:0.8 }}>{title}</Typography>
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.6 }}>
      <Typography sx={{ color, fontWeight:900, fontSize:'1rem' }}>{emoji}</Typography>
      <Typography sx={{ color, fontWeight:900, fontSize:'0.8rem' }}>{summary.label}</Typography>
    </Box>
    <Box sx={{ height:5, bgcolor:C.bgDark||'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
      <Box sx={{ height:'100%', width:`${summary.score}%`, bgcolor:color, borderRadius:3 }}/>
    </Box>
    <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700, mt:0.4 }}>{summary.score}/100</Typography>
  </Box>;
};

const CareerSentimentCards = ({ morale, fanLoyalty, theme }) => {
  if (morale === undefined && fanLoyalty == null) return null;
  return <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0.8, mb:1.5 }}>
    {morale !== undefined && <MetricCard title="MORAL" emoji={getMoraleSummary(morale).emoji} summary={getMoraleSummary(morale)} theme={theme} />}
    {fanLoyalty != null && <MetricCard title="TORCIDA" emoji="👥" summary={getFanLoyaltySummary(fanLoyalty)} theme={theme} />}
  </Box>;
};
export default CareerSentimentCards;
