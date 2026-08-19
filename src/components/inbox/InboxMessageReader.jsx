import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { getMessageDate, getMessageSender, getMessageTypeLabel, getMessageTypeStyle } from '../../engines/inbox/inboxService.js';

function RichText({ text, theme }) {
  const parts = String(text || '').split(/(R\$ [\d.,]+)/g);
  return parts.map((part, index) => part.startsWith('R$') ? (
    <Typography key={`${part}-${index}`} component="span" sx={{ color: theme.green, fontWeight: 900, bgcolor: `${theme.green}15`, px: 0.5, py: 0.1, borderRadius: '4px', border: `1px solid ${theme.green}30` }}>
      {part}
    </Typography>
  ) : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>);
}

function ActionButton({ label, color, outlined = false, onClick, textColor = '#000' }) {
  return (
    <Box component="button" type="button" onClick={onClick} sx={{ flex: 1, border: outlined ? `1px solid ${color}` : 0, bgcolor: outlined ? 'transparent' : color, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer', '&:active': { filter: outlined ? 'none' : 'brightness(0.85)', opacity: outlined ? 0.7 : 1 } }}>
      <Typography component="span" sx={{ color: outlined ? color : textColor, fontWeight: 900, fontSize: '0.75rem' }}>{label}</Typography>
    </Box>
  );
}

export default function InboxMessageReader({ message, isInTrash, livePlayer, formatMoney, theme, onBack, onRestore, onTrash, onTakeAction, onRejectAction }) {
  const action = message.actionData;
  const typeStyle = getMessageTypeStyle(message.type, theme);
  const sender = getMessageSender(message);
  const typeLabel = getMessageTypeLabel(message.type);
  const managerClub = action?.type === 'managerOffer' ? action.offeringClub : null;
  const requiresResponse = ['link', 'sell', 'managerOffer', 'renew_contract'].includes(action?.type);

  return (
    <Box sx={{ bgcolor: theme.bg, minHeight: '100dvh', pb: 5.5 }}>
      <Box sx={{ background: 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)', borderBottom: `1px solid ${theme.border}`, px: 1.5, pt: 3.8, pb: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box component="button" type="button" aria-label="Voltar para a lista de mensagens" onClick={onBack} sx={{ cursor: 'pointer', color: theme.teal, fontSize: '1.3rem', lineHeight: 1, px: 0.3, border: 0, bgcolor: 'transparent' }}>❮</Box>
          <Box>
            <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '0.9rem' }}>{isInTrash ? '🗑️ LIXEIRA' : '📬 MENSAGEM'}</Typography>
            <Typography sx={{ color: theme.txt3, fontSize: '0.56rem', fontWeight: 700 }}>{sender}</Typography>
          </Box>
        </Box>
        <Box component="button" type="button" onClick={() => isInTrash ? onRestore(message.id) : onTrash(message.id)} sx={{ border: `1px solid ${isInTrash ? theme.green : theme.red}`, borderRadius: '7px', px: 1.2, py: 0.4, cursor: 'pointer', bgcolor: 'transparent', '&:active': { opacity: 0.7 } }}>
          <Typography component="span" sx={{ color: isInTrash ? theme.green : theme.red, fontWeight: 900, fontSize: '0.65rem' }}>{isInTrash ? '↩ RESTAURAR' : '🗑 APAGAR'}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 1.5, pt: 1.5 }}>
        <Box sx={{ bgcolor: theme.card, border: `1.5px solid ${typeStyle.color}40`, borderRadius: '12px 12px 0 0', overflow: 'hidden', borderBottom: `1px solid ${theme.border}` }}>
          <Box sx={{ px: 1.8, py: 1.4, background: `linear-gradient(90deg, ${typeStyle.color}15 0%, transparent 100%)` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
              <Box sx={{ bgcolor: typeStyle.bg, border: `1px solid ${typeStyle.color}40`, borderRadius: '5px', px: 0.8, py: 0.2 }}>
                <Typography sx={{ color: typeStyle.color, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 0.5 }}>{message.icon || '✉️'} {typeLabel || 'MENSAGEM'}</Typography>
              </Box>
              <Typography sx={{ color: theme.txt3, fontSize: '0.6rem', fontWeight: 700 }}>{getMessageDate(message)}</Typography>
            </Box>
            <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mb: 0.5 }}>{message.subject}</Typography>
            <Typography sx={{ color: theme.txt3, fontSize: '0.6rem', fontWeight: 700 }}>De: {sender}</Typography>
          </Box>
        </Box>

        {action?.type === 'sell' && livePlayer && (
          <Box sx={{ bgcolor: `${theme.blue}0d`, border: `1px solid ${theme.blue}35`, px: 1.8, py: 1.2, borderBottom: `1px solid ${theme.border}` }}>
            <Typography sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.8, mb: 0.8 }}>JOGADOR DISPONÍVEL</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.cardAlt, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ color: livePlayer.overall >= 80 ? theme.green : livePlayer.overall >= 70 ? theme.gold : theme.red, fontWeight: 900, fontSize: '0.9rem' }}>{livePlayer.overall}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1 }}>{livePlayer.name}</Typography>
                <Typography sx={{ color: theme.txt3, fontSize: '0.58rem', fontWeight: 700 }}>{livePlayer.position} · {livePlayer.age} anos · Salário: {formatMoney(livePlayer.wage || 0)}/rod</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: theme.teal, fontWeight: 900, fontSize: '0.82rem' }}>{formatMoney(action.value)}</Typography>
                <Typography sx={{ color: theme.txt3, fontSize: '0.5rem' }}>oferta</Typography>
              </Box>
            </Box>
          </Box>
        )}

        {action?.type === 'managerOffer' && managerClub && (
          <Box sx={{ bgcolor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.24)', px: 1.8, py: 1.2, borderBottom: `1px solid ${theme.border}` }}>
            <Typography sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.8, mb: 0.8 }}>PROPOSTA PARA O TREINADOR</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
              <TeamIcon name={managerClub.name} size={38} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '0.85rem' }}>{managerClub.name}</Typography>
                <Typography sx={{ color: theme.txt3, fontSize: '0.58rem', fontWeight: 700 }}>Assumir o clube na próxima temporada</Typography>
              </Box>
              {action.offeredSalary != null && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ color: '#7c3aed', fontWeight: 900, fontSize: '0.78rem' }}>{formatMoney(action.offeredSalary)}</Typography>
                  <Typography sx={{ color: theme.txt3, fontSize: '0.48rem' }}>salário</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ bgcolor: theme.card, borderRadius: '0 0 12px 12px', border: `1.5px solid ${typeStyle.color}25`, borderTop: 'none', px: 1.8, py: 1.6, minHeight: 180 }}>
          {String(message.body || '').split('\n').map((line, index) => (
            <Typography key={`${index}-${line}`} sx={{ color: theme.txt1, fontSize: '0.85rem', lineHeight: 1.9, mb: line === '' ? 0.8 : 0, fontWeight: 400 }}>
              <RichText text={line || '\u00A0'} theme={theme} />
            </Typography>
          ))}
        </Box>

        {requiresResponse && !isInTrash && (
          <Box sx={{ mt: 1, bgcolor: action.type === 'sell' ? `${theme.blue}0a` : `${theme.teal}0a`, border: `1.5px dashed ${action.type === 'sell' ? theme.blue : action.type === 'managerOffer' ? '#7c3aed' : theme.teal}50`, borderRadius: '10px', p: 1.5 }}>
            <Typography sx={{ color: action.type === 'sell' ? theme.blue : action.type === 'managerOffer' ? '#7c3aed' : theme.teal, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.8, mb: 1, textAlign: 'center' }}>↳ RESPOSTA DO MANAGER REQUERIDA</Typography>
            {action.type === 'link' && (
              <Box component="button" type="button" onClick={() => onTakeAction(message)} sx={{ width: '100%', border: 0, bgcolor: theme.teal, borderRadius: '8px', py: 1, textAlign: 'center', cursor: 'pointer', '&:active': { filter: 'brightness(0.85)' } }}>
                <Typography component="span" sx={{ color: '#000', fontWeight: 900, fontSize: '0.8rem' }}>{action.label} ➔</Typography>
              </Box>
            )}
            {action.type === 'sell' && message.isDynamic && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <ActionButton label="✗ REJEITAR" color={theme.red} outlined onClick={() => onRejectAction(message)} />
                <ActionButton label="✓ ACEITAR VENDA" color={theme.green} onClick={() => onTakeAction(message)} />
              </Box>
            )}
            {action.type === 'managerOffer' && message.isDynamic && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <ActionButton label="✗ RECUSAR" color={theme.red} outlined onClick={() => onRejectAction(message)} />
                <ActionButton label="✓ ACEITAR CLUBE" color="#7c3aed" onClick={() => onTakeAction(message)} textColor="#fff" />
              </Box>
            )}
            {action.type === 'renew_contract' && (
              <Box component="button" type="button" onClick={() => onTakeAction(message)} sx={{ width: '100%', border: 0, bgcolor: theme.gold, borderRadius: '8px', py: 1, textAlign: 'center', cursor: 'pointer', '&:active': { filter: 'brightness(0.85)' } }}>
                <Typography component="span" sx={{ color: '#000', fontWeight: 900, fontSize: '0.78rem' }}>📋 RENOVAR CONTRATO · {formatMoney(action.cost || 0)}</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
