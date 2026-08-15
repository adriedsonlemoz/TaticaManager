import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../../theme.js';
import { NavDialog, NavDialogClose, NavDialogHeader, NavMenuItem } from './NavDialogPrimitives.jsx';

const C = THEME;

export default function TeamNavigationDialog({ open, onClose, onNavigate, squad, academy }) {
  const medicalLabel = squad.unavailable > 0
    ? `${squad.injured} lesionado(s) · ${squad.suspended} suspenso(s)`
    : 'Elenco em plenas condições';

  return (
    <NavDialog open={open} onClose={onClose} width={290} ariaLabel="Menu do time">
      <Box>
        <NavDialogHeader icon="sports_soccer" title="TIME" color={C.green} onClose={onClose} />
        <NavMenuItem
          icon="dashboard_customize" label="Táticas & Escalação"
          sub="Formação, prancheta e titulares"
          color={C.green} action={() => onNavigate('lineup')}
        />
        <NavMenuItem
          icon="medical_services" label="Centro Médico"
          sub={medicalLabel}
          color={C.red} action={() => onNavigate('medical')}
        />
        <NavMenuItem
          icon="emoji_events" label="Copas e Torneios"
          sub="Copa do Brasil · Libertadores · Sul-Americana"
          color={C.gold} action={() => onNavigate('copas')}
        />
        <NavMenuItem
          icon="school" label="Categoria de Base"
          sub={academy.label}
          color="#7c3aed" action={() => onNavigate('academy')} last
        />
        <NavDialogClose onClose={onClose} />
      </Box>
    </NavDialog>
  );
}
