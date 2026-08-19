import React from 'react';
import { Box, Dialog, Paper, Typography } from '@mui/material';
import { getMessageDate, getMessagePreview, getMessageSender, getMessageTypeLabel, getMessageTypeStyle, isMessageRead } from '../../engines/inbox/inboxService.js';

export default function InboxMailbox({ clubName, tab, search, messages, unreadCount, trashCount, typeCounts, readIds, confirmDialog, theme, onTabChange, onSearchChange, onOpenMessage, onRestore, onRequestDelete, onRequestEmptyTrash, onCloseConfirm, onConfirmDelete }) {
  return (
    <Box sx={{ bgcolor: theme.bg, minHeight: '100dvh', pb: 5.5 }}>
      <Box sx={{ background: 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)', borderBottom: `1px solid ${theme.border}`, px: 1.5, pt: 3.8, pb: 1.3, position: 'relative', overflow: 'hidden' }}>
        <Typography sx={{ position: 'absolute', right: -8, top: -5, fontSize: '6rem', opacity: 0.04, lineHeight: 1, pointerEvents: 'none' }}>{tab === 'inbox' ? '📬' : '🗑️'}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '10px', flexShrink: 0, bgcolor: `${theme.teal}15`, border: `1.5px solid ${theme.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{tab === 'inbox' ? '📬' : '🗑️'}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '1.05rem', letterSpacing: 0.5 }}>CAIXA DE ENTRADA</Typography>
            <Typography sx={{ color: theme.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.15 }}>{clubName}</Typography>
          </Box>
          {unreadCount > 0 && <Box sx={{ bgcolor: theme.red, borderRadius: '10px', px: 0.8, minWidth: 22, textAlign: 'center', py: 0.2 }}><Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>{unreadCount}</Typography></Box>}
        </Box>

        {Object.keys(typeCounts).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.6, mb: 1, flexWrap: 'wrap' }}>
            {Object.entries(typeCounts).map(([type, count]) => {
              const typeStyle = getMessageTypeStyle(type, theme);
              return <Box key={type} sx={{ bgcolor: typeStyle.bg, border: `1px solid ${typeStyle.color}40`, borderRadius: '6px', px: 0.7, py: 0.2 }}><Typography sx={{ color: typeStyle.color, fontWeight: 900, fontSize: '0.5rem' }}>{type} ({count})</Typography></Box>;
            })}
          </Box>
        )}

        <Box role="tablist" aria-label="Pastas de mensagens" sx={{ display: 'flex', gap: 0.6, mb: 1 }}>
          {[
            { id: 'inbox', label: `ENTRADA${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { id: 'trash', label: `LIXEIRA${trashCount > 0 ? ` (${trashCount})` : ''}` },
          ].map(item => (
            <Box key={item.id} component="button" type="button" role="tab" aria-selected={tab === item.id} onClick={() => onTabChange(item.id)} sx={{ flex: 1, py: 0.65, borderRadius: '8px', textAlign: 'center', cursor: 'pointer', bgcolor: tab === item.id ? (item.id === 'inbox' ? theme.teal : theme.red) : theme.cardAlt, border: `1px solid ${tab === item.id ? (item.id === 'inbox' ? theme.teal : theme.red) : theme.border}`, transition: 'all 0.15s' }}>
              <Typography component="span" sx={{ color: tab === item.id ? (item.id === 'trash' ? '#fff' : '#000') : theme.txt2, fontWeight: 900, fontSize: '0.68rem' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: '8px', px: 1.2, py: 0.6, gap: 0.8 }}>
          <Typography sx={{ color: theme.txt3, fontSize: '0.85rem' }}>🔍</Typography>
          <Box component="input" value={search} onChange={event => onSearchChange(event.target.value)} aria-label="Buscar mensagens" placeholder="Buscar mensagens..." sx={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: theme.txt1, fontSize: '0.72rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }} />
          {search && <Box component="button" type="button" aria-label="Limpar busca" onClick={() => onSearchChange('')} sx={{ color: theme.txt3, fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1, border: 0, bgcolor: 'transparent' }}>✕</Box>}
        </Box>
      </Box>

      {tab === 'trash' && trashCount > 0 && (
        <Box sx={{ px: 1.5, pt: 1.2 }}>
          <Box component="button" type="button" onClick={onRequestEmptyTrash} sx={{ width: '100%', bgcolor: 'transparent', border: `1px solid ${theme.red}`, borderRadius: '8px', py: 0.8, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
            <Typography component="span" sx={{ color: theme.red, fontWeight: 900, fontSize: '0.72rem' }}>🗑️ ESVAZIAR LIXEIRA COMPLETAMENTE</Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ px: 1.5, pt: 1.2 }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '3.5rem', mb: 1, opacity: 0.18 }}>{search ? '🔍' : tab === 'inbox' ? '📭' : '🍃'}</Typography>
            <Typography sx={{ color: theme.txt3, fontWeight: 900, fontSize: '0.85rem' }}>{search ? `Nenhum resultado para "${search}"` : tab === 'inbox' ? 'Caixa de entrada vazia.' : 'A lixeira está limpa.'}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {messages.map(message => <MessageCard key={message.id} message={message} tab={tab} readIds={readIds} theme={theme} onOpenMessage={onOpenMessage} onRestore={onRestore} onRequestDelete={onRequestDelete} />)}
          </Box>
        )}
      </Box>

      <ConfirmDeleteDialog confirmDialog={confirmDialog} theme={theme} onClose={onCloseConfirm} onConfirm={onConfirmDelete} />
    </Box>
  );
}

function MessageCard({ message, tab, readIds, theme, onOpenMessage, onRestore, onRequestDelete }) {
  const read = isMessageRead(message, readIds);
  const typeStyle = getMessageTypeStyle(message.type, theme);
  const action = message.actionData;

  return (
    <Paper sx={{ borderRadius: '11px', overflow: 'hidden', position: 'relative', bgcolor: read ? theme.card : theme.cardAlt, border: `1px solid ${!read ? `${typeStyle.color}55` : theme.border}`, boxShadow: !read ? `0 2px 8px ${typeStyle.color}18` : 'none' }}>
      <Box component="button" type="button" onClick={() => onOpenMessage(message)} sx={{ width: '100%', border: 0, bgcolor: 'transparent', textAlign: 'left', cursor: 'pointer', p: 0, transition: 'transform 0.1s', '&:active': { transform: 'scale(0.985)' } }}>
        {!read && <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: typeStyle.color, borderRadius: '11px 0 0 11px' }} />}
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', px: 1.4, py: 1.1, pl: !read ? 2 : 1.4 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '9px', bgcolor: typeStyle.bg, border: `1.5px solid ${typeStyle.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>{action?.type === 'sell' ? '🤝' : action?.type === 'managerOffer' ? '💼' : (message.icon || '✉️')}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.15 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0, flex: 1, mr: 0.5 }}>
                <Typography sx={{ color: read ? theme.txt2 : typeStyle.color, fontWeight: 900, fontSize: '0.6rem', flexShrink: 0, bgcolor: typeStyle.bg, border: `1px solid ${typeStyle.color}30`, borderRadius: '4px', px: 0.5, py: 0.1 }}>{getMessageTypeLabel(message.type) || 'MSG'}</Typography>
                <Typography sx={{ color: read ? theme.txt2 : theme.txt1, fontWeight: 700, fontSize: '0.65rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{getMessageSender(message)}</Typography>
              </Box>
              <Typography sx={{ color: theme.txt4, fontSize: '0.52rem', fontWeight: 700, flexShrink: 0 }}>{getMessageDate(message)}</Typography>
            </Box>
            <Typography sx={{ color: theme.txt1, fontWeight: read ? 700 : 900, fontSize: '0.82rem', lineHeight: 1.2, mb: 0.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{message.subject}</Typography>
            <Typography sx={{ color: theme.txt3, fontSize: '0.62rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{getMessagePreview(message)}</Typography>
          </Box>
        </Box>
      </Box>

      {tab === 'trash' && (
        <Box sx={{ display: 'flex', gap: 0.8, px: 1.4, pb: 1, pt: 0.3 }}>
          <InlineAction label="↩ RESTAURAR" color={theme.green} onClick={() => onRestore(message.id)} />
          <InlineAction label="🗑 EXCLUIR" color={theme.red} onClick={() => onRequestDelete(message)} />
        </Box>
      )}
    </Paper>
  );
}

function InlineAction({ label, color, onClick }) {
  return <Box component="button" type="button" onClick={onClick} sx={{ flex: 1, bgcolor: 'transparent', border: `1px solid ${color}`, borderRadius: '6px', py: 0.5, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}><Typography component="span" sx={{ color, fontWeight: 900, fontSize: '0.6rem' }}>{label}</Typography></Box>;
}

function ConfirmDeleteDialog({ confirmDialog, theme, onClose, onConfirm }) {
  return (
    <Dialog open={Boolean(confirmDialog)} onClose={onClose} PaperProps={{ sx: { bgcolor: theme.card, borderRadius: '14px', border: `2px solid ${theme.red}`, p: 2.5, textAlign: 'center', minWidth: 270, m: 2 } }}>
      <Typography sx={{ fontSize: '2.5rem', mb: 0.8, lineHeight: 1 }}>⚠️</Typography>
      <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '1rem', mb: 0.8 }}>Tem certeza?</Typography>
      <Typography sx={{ color: theme.txt2, fontSize: '0.8rem', mb: 2 }}>{confirmDialog?.type === 'emptyTrash' ? 'Todas as mensagens da lixeira serão excluídas permanentemente.' : 'Esta mensagem será excluída para sempre.'}</Typography>
      <Box sx={{ display: 'flex', gap: 0.8 }}>
        <Box component="button" type="button" onClick={onClose} sx={{ flex: 1, bgcolor: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer' }}><Typography component="span" sx={{ color: theme.txt2, fontWeight: 900, fontSize: '0.78rem' }}>CANCELAR</Typography></Box>
        <Box component="button" type="button" onClick={onConfirm} sx={{ flex: 1, border: 0, bgcolor: theme.red, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer', '&:active': { filter: 'brightness(0.85)' } }}><Typography component="span" sx={{ color: '#fff', fontWeight: 900, fontSize: '0.78rem' }}>EXCLUIR</Typography></Box>
      </Box>
    </Dialog>
  );
}
