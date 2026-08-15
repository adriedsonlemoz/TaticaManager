import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TeamIcon } from '../../data/database_branding.js';
import { NavDialog, NavDialogClose } from './NavDialogPrimitives.jsx';

const C = THEME;

const financeRows = (club) => [
  { label: 'Caixa', value: club.money, color: C.act },
  { label: 'Folha Salarial', value: club.wage, color: C.red },
  { label: 'Orç. Transferências', value: club.transferBudget, color: C.blue },
];

const formatMillions = (value) => `R$ ${(Number(value || 0) / 1e6).toFixed(1)}M`;

export default function ClubNavigationDialog({ open, onClose, onNavigate, club, unread }) {
  const stats = [
    { label: 'POSIÇÃO', value: club.positionLabel, color: club.position > 0 && club.position <= 4 ? C.act : club.position >= 17 ? C.red : C.txt1 },
    { label: 'PONTOS', value: club.points, color: C.txt1 },
    { label: 'V·E·D', value: `${club.wins}·${club.draws}·${club.losses}`, color: C.green },
    { label: 'SALDO', value: club.goalDifferenceLabel, color: club.goalDifference >= 0 ? C.green : C.red },
  ];

  return (
    <NavDialog open={open} onClose={onClose} width={318} ariaLabel="Menu do clube">
      <Box>
        <Box sx={{
          background: 'linear-gradient(135deg,#f8fafc 0%,#f4f7f6 100%)',
          borderBottom: `1px solid ${C.border}`,
          px: 1.8, py: 1.3,
          display: 'flex', alignItems: 'center', gap: 1.2,
        }}>
          <Box sx={{
            width: 46, height: 46, borderRadius: '11px', flexShrink: 0,
            background: '#f1f5f9', border: `2px solid ${C.act}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${C.act}20`,
          }}>
            {club.name ? <TeamIcon name={club.name} size={32} /> : <Typography sx={{ fontSize: '1.3rem' }}>⚽</Typography>}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              color: C.txt1, fontWeight: 900, fontSize: '0.95rem', lineHeight: 1.1,
              textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {club.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.6, mt: 0.3, flexWrap: 'wrap' }}>
              <Box sx={{ bgcolor: `${C.act}18`, border: `1px solid ${C.act}40`, borderRadius: '5px', px: 0.7, py: 0.1 }}>
                <Typography sx={{ color: C.act, fontWeight: 900, fontSize: '0.5rem' }}>Série {club.serie}</Typography>
              </Box>
              <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700, alignSelf: 'center' }}>
                Rod. {club.round}/{club.roundTotal}
              </Typography>
            </Box>
          </Box>
          <Box
            component="button" type="button" aria-label="Fechar menu do clube" onClick={onClose}
            sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', p: 0.3, '&:active': { opacity: 0.6 } }}
          >
            <Typography sx={{ color: C.txt3, fontSize: '1.05rem', lineHeight: 1 }}>✕</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.5, px: 1.2, py: 0.9 }}>
          {stats.map((stat) => (
            <Box key={stat.label} sx={{ bgcolor: C.cardB, borderRadius: '8px', py: 0.75, textAlign: 'center' }}>
              <Typography sx={{ color: stat.color, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>{stat.value}</Typography>
              <Typography sx={{ color: C.txt4, fontSize: '0.4rem', fontWeight: 700, mt: 0.12 }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mx: 1.2, mb: 0.8, bgcolor: C.cardB, borderRadius: '10px', px: 1.2, py: 0.85, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: '#f1f5f9', border: `2px solid ${C.act}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#0f172a', fontWeight: 900, fontSize: '0.7rem' }}>{club.managerInitials}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.78rem', lineHeight: 1 }}>{club.manager}</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.55rem', fontWeight: 700, mt: 0.12 }}>
              {club.managerStyle}{club.managerNationality ? ` · ${club.managerNationality}` : ''}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.65rem' }}>
              {club.managerWins}V {club.managerDraws}E {club.managerLosses}D
            </Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.43rem', fontWeight: 700 }}>Exp. {club.managerExperience}</Typography>
          </Box>
        </Box>

        <Box sx={{ mx: 1.2, mb: 0.8, bgcolor: C.cardB, borderRadius: '10px', px: 1.2, py: 0.8 }}>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.47rem', letterSpacing: 0.8, mb: 0.5 }}>SITUAÇÃO FINANCEIRA</Typography>
          {financeRows(club).map((row, index, rows) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3, borderBottom: index < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700 }}>{row.label}</Typography>
              <Typography sx={{ color: row.color, fontWeight: 900, fontSize: '0.62rem' }}>{formatMillions(row.value)}</Typography>
            </Box>
          ))}
        </Box>

        {unread.length > 0 && (
          <Box sx={{ mx: 1.2, mb: 0.8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
              <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.47rem', letterSpacing: 0.8 }}>MENSAGENS NÃO LIDAS</Typography>
              <Box sx={{ bgcolor: C.red, borderRadius: '10px', px: 0.55, minWidth: 15, textAlign: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.43rem' }}>{unread.length}</Typography>
              </Box>
            </Box>
            {unread.slice(0, 2).map((message) => (
              <Box
                key={message.id} component="button" type="button" onClick={() => onNavigate('inbox')}
                sx={{
                  width: '100%', border: 0, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 0.7,
                  bgcolor: C.cardB, borderRadius: '8px', px: 1, py: 0.6, mb: 0.35,
                  cursor: 'pointer', '&:active': { opacity: 0.7 },
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', flexShrink: 0 }}>{message.icon || '📨'}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.58rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {message.subject || 'Mensagem'}
                  </Typography>
                  <Typography sx={{ color: C.txt3, fontSize: '0.47rem', fontWeight: 700 }}>{message.displayDate}</Typography>
                </Box>
                <Typography sx={{ color: C.act, fontSize: '0.75rem' }}>›</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
          {[
            { label: '🏅 Carreira', screen: 'career' },
            { label: '📊 Tabela', screen: 'table' },
            { label: 'ℹ️ Sobre', screen: 'about' },
          ].map((button, index) => (
            <Box
              key={button.screen} component="button" type="button" onClick={() => onNavigate(button.screen)}
              sx={{
                flex: 1, border: 0, bgcolor: 'transparent', py: 1, textAlign: 'center', cursor: 'pointer',
                borderRight: index < 2 ? `1px solid ${C.border}` : 'none', '&:active': { bgcolor: `${C.act}0a` },
              }}
            >
              <Typography sx={{ color: C.act, fontWeight: 900, fontSize: '0.62rem' }}>{button.label}</Typography>
            </Box>
          ))}
        </Box>

        <NavDialogClose onClose={onClose} />
      </Box>
    </NavDialog>
  );
}
