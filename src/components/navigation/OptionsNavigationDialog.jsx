import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../../theme.js';
import { NavDialog, NavDialogClose, NavDialogHeader, NavMenuItem } from './NavDialogPrimitives.jsx';

const C = THEME;

export default function OptionsNavigationDialog({ open, onClose, onNavigate, onSave, onBackup }) {
  return (
    <NavDialog open={open} onClose={onClose} width={268} ariaLabel="Opções do jogo">
      <Box>
        <NavDialogHeader icon="tune" title="OPÇÕES" color={C.act} onClose={onClose} />
        <NavMenuItem icon="save" label="Salvar Jogo" sub="Gravar progresso atual" color={C.green} action={onSave} />
        <NavMenuItem icon="file_download" label="Backup JSON" sub="Exportar save para arquivo" color={C.blue} action={onBackup} />
        <NavMenuItem icon="info_outline" label="Sobre o Jogo" sub="Versão, créditos e doação" color={C.gold} action={() => onNavigate('about')} last />
        <NavDialogClose onClose={onClose} />
      </Box>
    </NavDialog>
  );
}
