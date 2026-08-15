import React from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const C = THEME;

export const NAV_DIALOG_BACKDROP = { bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' };

export const getNavDialogPaperSx = (width) => ({
  position: 'fixed',
  bottom: 66,
  left: '50%',
  transform: 'translateX(-50%)',
  m: 0,
  width,
  maxHeight: '78vh',
  overflowY: 'auto',
  bgcolor: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 -4px 24px rgba(0,0,0,0.12), 0 0 0 1px #e2e8f0',
});

export function NavDialog({ open, onClose, width, children, ariaLabel }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label={ariaLabel}
      PaperProps={{ sx: getNavDialogPaperSx(width) }}
      BackdropProps={{ sx: NAV_DIALOG_BACKDROP }}
    >
      {children}
    </Dialog>
  );
}

export function NavDialogHeader({ icon, title, color = C.act, onClose }) {
  return (
    <Box sx={{
      px: 1.8, py: 1.2,
      borderBottom: `1px solid ${C.border}`,
      background: `linear-gradient(90deg,${color}12 0%,transparent 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <span className="material-icons" style={{ color, fontSize: '1.1rem' }}>{icon}</span>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.82rem', letterSpacing: 1 }}>
          {title}
        </Typography>
      </Box>
      <Box
        component="button"
        type="button"
        aria-label={`Fechar ${title.toLowerCase()}`}
        onClick={onClose}
        sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', p: 0.3, '&:active': { opacity: 0.6 } }}
      >
        <Typography sx={{ color: C.txt3, fontSize: '1.05rem', lineHeight: 1 }}>✕</Typography>
      </Box>
    </Box>
  );
}

export function NavMenuItem({ icon, label, sub, color, action, last = false }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={action}
      sx={{
        width: '100%', border: 0, textAlign: 'left', bgcolor: 'transparent',
        display: 'flex', alignItems: 'center', gap: 1.3,
        px: 1.8, py: 1.05, cursor: 'pointer',
        borderBottom: last ? 'none' : `1px solid ${C.border}`,
        transition: 'background 0.12s',
        '&:active': { bgcolor: `${color}0d` },
      }}
    >
      <Box sx={{
        width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
        bgcolor: `${color}12`, border: `1.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-icons" style={{ color, fontSize: '1.1rem' }}>{icon}</span>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.8rem', lineHeight: 1.15 }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ color: C.txt3, fontSize: '0.55rem', fontWeight: 700, mt: 0.18 }}>
            {sub}
          </Typography>
        )}
      </Box>
      <span className="material-icons" style={{ color: C.txt4, fontSize: '0.9rem' }}>chevron_right</span>
    </Box>
  );
}

export function NavDialogClose({ onClose }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClose}
      sx={{
        width: '100%', border: 0, bgcolor: 'transparent',
        py: 0.85, textAlign: 'center', cursor: 'pointer',
        borderTop: `1px solid ${C.border}`,
        '&:active': { bgcolor: '#f1f5f9' },
      }}
    >
      <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.62rem' }}>FECHAR</Typography>
    </Box>
  );
}
