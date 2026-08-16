import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const AboutChangelog = ({ entries, theme }) => {
  const C = theme;
  const [expandedVersion, setExpandedVersion] = React.useState(null);

  return (
    <>
      <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 1.5, mb: 1 }}>📜 HISTÓRICO DE VERSÕES</Typography>
      {entries.map((entry, index) => {
        const current = index === 0;
        const expanded = current || expandedVersion === entry.v;
        return (
          <Paper key={`${entry.v}-${index}`} sx={{ mb: 1, bgcolor: C.card, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${current ? entry.color + '60' : C.border}` }}>
            <Box
              component="button"
              type="button"
              disabled={current}
              aria-expanded={expanded}
              onClick={() => !current && setExpandedVersion((value) => value === entry.v ? null : entry.v)}
              sx={{ width: '100%', border: 0, display: 'flex', alignItems: 'center', gap: 1, px: 1.4, py: 1, cursor: current ? 'default' : 'pointer', bgcolor: current ? `${entry.color}10` : 'transparent', borderBottom: expanded ? `1px solid ${C.border}` : 'none', textAlign: 'left', '&:disabled': { opacity: 1 } }}
            >
              <Box sx={{ bgcolor: entry.color, borderRadius: '6px', px: 0.7, py: 0.2, flexShrink: 0 }}>
                <Typography sx={{ color: current ? '#000' : '#fff', fontWeight: 900, fontSize: '0.62rem', lineHeight: 1 }}>{entry.v}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.75rem', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</Typography>
              </Box>
              {entry.tag && (
                <Box sx={{ bgcolor: `${entry.color}20`, border: `1px solid ${entry.color}50`, borderRadius: '4px', px: 0.6, py: 0.1, flexShrink: 0 }}>
                  <Typography sx={{ color: entry.color, fontWeight: 900, fontSize: '0.5rem' }}>{entry.tag}</Typography>
                </Box>
              )}
              {!current && <Typography sx={{ color: C.txt3, fontSize: '0.7rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</Typography>}
            </Box>

            {expanded && (
              <Box sx={{ px: 1.4, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {entry.items.map((item, itemIndex) => {
                  const separator = item.indexOf(' ');
                  const icon = separator > 0 ? item.slice(0, separator) : '•';
                  const text = separator > 0 ? item.slice(separator + 1) : item;
                  return (
                    <Box key={`${entry.v}-${itemIndex}`} sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                      <Typography sx={{ fontSize: '0.7rem', lineHeight: 1.5, flexShrink: 0, mt: 0.1 }}>{icon}</Typography>
                      <Typography sx={{ color: C.txt2, fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.5, flex: 1 }}>{text}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        );
      })}
    </>
  );
};

export default AboutChangelog;
