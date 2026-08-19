import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const C = THEME;

export default function BottomNavigationBar({ items, onItemClick }) {
  return (
    <Paper elevation={0} component="nav" aria-label="Navegação principal" sx={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'calc(54px + env(safe-area-inset-bottom, 0px))', zIndex: 1200,
      pb: 'env(safe-area-inset-bottom, 0px)', boxSizing: 'border-box',
      bgcolor: C.bg, borderTop: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'stretch',
    }}>
      {items.map((item) => (
        <Box
          key={item.id}
          component="button"
          type="button"
          aria-current={item.active ? 'page' : undefined}
          aria-disabled={item.disabled || undefined}
          disabled={item.disabled}
          onClick={() => onItemClick(item)}
          sx={{
            flex: 1, border: 0, bgcolor: 'transparent', p: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 0.25, position: 'relative',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? 0.2 : 1,
            transition: 'opacity 0.15s',
            '&:active': item.disabled ? {} : { opacity: 0.7 },
          }}
        >
          {item.active && (
            <Box sx={{
              position: 'absolute', top: 0, left: '14%', right: '14%',
              height: 2.5, bgcolor: C.act,
              borderRadius: '0 0 3px 3px',
              boxShadow: `0 0 8px ${C.act}`,
            }} />
          )}

          {item.badge > 0 && (
            <Box aria-label={`${item.badge} alerta(s)`} sx={{
              position: 'absolute', top: 5, right: '10%',
              bgcolor: C.red, borderRadius: '8px',
              minWidth: 14, height: 14, px: 0.3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${C.bg}`,
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.38rem' }}>{item.badge}</Typography>
            </Box>
          )}

          <span className="material-icons" aria-hidden="true" style={{
            fontSize: '1.05rem',
            color: item.active ? C.act : C.inact,
            filter: item.active ? `drop-shadow(0 0 5px ${C.act}80)` : 'none',
            transition: 'color 0.15s',
          }}>
            {item.icon}
          </span>
          <Typography sx={{
            color: item.active ? C.act : C.inact,
            fontSize: '0.34rem', fontWeight: 900,
            letterSpacing: 0.1, textTransform: 'uppercase', lineHeight: 1,
          }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
