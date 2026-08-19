import React from 'react';
import { Box, InputBase, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import { buildNewsViewModel } from '../engines/news/newsViewModel.js';
import NewsCard from './news/NewsCard.jsx';

export default function ScreenNews({ gameData, setScreen }) {
  const C = THEME;
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const vm = React.useMemo(() => buildNewsViewModel(gameData, { filter, query }), [gameData, filter, query]);

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100dvh', pb:7.3 }}>
      <Box sx={{ position:'sticky', top:0, zIndex:5, bgcolor:C.bg, borderBottom:`1px solid ${C.border}`, px:1.2, pt:1, pb:.8 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:.8 }}>
          <Box component="button" type="button" onClick={() => setScreen?.('home')} aria-label="Voltar" sx={{ border:0, bgcolor:'transparent', p:.3, cursor:'pointer', display:'flex' }}>
            <span className="material-icons" style={{ color:C.txt2, fontSize:'1.2rem' }}>arrow_back</span>
          </Box>
          <Box sx={{ flex:1 }}>
            <Typography sx={{ color:C.txt1, fontWeight:950, fontSize:'.92rem', lineHeight:1 }}>CENTRAL DE NOTÍCIAS</Typography>
            <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'.5rem', mt:.18 }}>{vm.total} notícia(s) da carreira</Typography>
          </Box>
          <span className="material-icons" style={{ color:C.act, fontSize:'1.2rem' }}>newspaper</span>
        </Box>

        <Box sx={{ mt:.8, display:'flex', alignItems:'center', gap:.6, bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'9px', px:.8 }}>
          <span className="material-icons" style={{ color:C.txt4, fontSize:'1rem' }}>search</span>
          <InputBase value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar notícia, jogador ou competição" fullWidth sx={{ color:C.txt1, fontSize:'.62rem', py:.5 }} inputProps={{ 'aria-label':'Buscar notícias' }} />
        </Box>

        <Box sx={{ display:'flex', gap:.45, overflowX:'auto', pt:.7, pb:.1, '&::-webkit-scrollbar':{ display:'none' } }}>
          {vm.filters.map((item) => {
            const active = filter === item.id;
            return <Box key={item.id} component="button" type="button" onClick={() => setFilter(item.id)} sx={{ border:`1px solid ${active ? C.act : C.border}`, bgcolor:active ? `${C.act}12` : C.card, borderRadius:'999px', px:.75, py:.38, cursor:'pointer', whiteSpace:'nowrap' }}>
              <Typography sx={{ color:active ? C.act : C.txt3, fontWeight:900, fontSize:'.48rem' }}>{item.label} · {item.count}</Typography>
            </Box>;
          })}
        </Box>
      </Box>

      <Box sx={{ px:1.15, pt:1, display:'grid', gap:.7 }}>
        {vm.filtered.length ? vm.filtered.map((item) => <NewsCard key={item.id} item={item} />) : (
          <Box sx={{ bgcolor:C.card, border:`1px dashed ${C.border}`, borderRadius:'12px', py:4, px:1.5, textAlign:'center' }}>
            <Typography sx={{ fontSize:'1.5rem' }}>📰</Typography>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'.75rem', mt:.4 }}>Nenhuma notícia encontrada</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'.55rem', mt:.3 }}>Novos resultados, transferências e acontecimentos aparecerão aqui.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
