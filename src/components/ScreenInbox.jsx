// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';

// components/ScreenInbox.js — v5.0
// ─────────────────────────────────────────────────────────────────────────────
// BUGS CORRIGIDOS:
//   #1  readMsgIds/trashMsgIds/erasedMsgIds não sobreviviam à virada de temporada
//       → engine.js precisa preservá-los; aqui garantimos defaultRead fallback seguro
//   #2  app.js usa campo 'from', ScreenInbox usava 'sender' → unified: from||sender
//   #3  bgcolor 'rgba(255,255,255,0.3)' no header do e-mail deixava texto invisível
//   #4  Lixeira não chamava handleOpenMsg → não marcava como lido ao clicar na lixeira
//   #5  sort por String(id).localeCompare falhava com IDs numéricos/timestamp
//   #6  generatedMessages com dep=[gameData] inteiro causava re-cálculo excessivo
//   #7  wage_warning não tinha guarda de leitura por rodada — reaparecia infinito
//   #8  sellPlayer usava snapshot antigo do player (action.player) sem verificar OVR atual
//   #9  Proposta de venda não mostrava salário do jogador nem OVR atualizado
//   #10 Sem busca/filtro de mensagens
//   #11 Sem contador de mensagens por tipo (transferência, contrato, etc.)
//   #12 Header fora do tema padrão do jogo (dark azul/verde)
// ─────────────────────────────────────────────────────────────────────────────

const ScreenInbox = ({ gameData, setGameData, setScreen, formatMoney, showToast, sellPlayer }) => {
  const [tab,           setTab]           = React.useState('inbox');
  const [selected,      setSelected]      = React.useState(null);
  const [confirmDialog, setConfirmDialog] = React.useState(null);
  const [search,        setSearch]        = React.useState('');

  // ── Paleta padrão do jogo ────────────────────────────────
  const C = THEME;

  // ── Conjuntos de IDs ─────────────────────────────────────
  const readIds   = new Set(gameData.readMsgIds   || []);
  const trashIds  = new Set(gameData.trashMsgIds  || []);
  const erasedIds = new Set(gameData.erasedMsgIds || []);

  // ── Mensagens fixas geradas pelo sistema ─────────────────
  // FIX #6: deps granulares para evitar re-cálculo desnecessário
  const generatedMessages = React.useMemo(() => {
    const msgs = [];
    const myPos      = (gameData.table?.findIndex(t => t.id === 'user') + 1) || 0;
    const round      = gameData.round || 0;
    const money      = gameData.club?.money || 0;
    const serie      = gameData.serie || 'A';
    const totalWage  = (gameData.players || []).reduce((s, p) => s + (p.wage || 0), 0);
    const wageLimit  = { A: 2100000, B: 600000, C: 200000, D: 60000 }[serie || 'A'] ?? 2100000;
    const starters   = (gameData.players || []).filter(p => p.isStarting).length;
    const managerName = gameData.club?.manager || 'Treinador';

    // Boas-vindas
    msgs.push({
      id: 'welcome', icon: '📋', type: 'DIRETORIA', defaultRead: round > 2,
      from: 'Presidente do Clube', subject: 'Metas para a Temporada', date: 'Pré-temporada',
      preview: 'Bem-vindo ao clube. Verifique as nossas expectativas...',
      body: `Sr. ${managerName},\n\nSeja bem-vindo ao ${gameData.club?.name}.\n\nA meta é terminar entre os ${myPos <= 10 ? 'primeiros 10' : 'primeiros 8'} da Série ${serie}.\n\nSeu orçamento inicial é de ${formatMoney(money)}.\n\nBoa sorte, Comandante.`,
      actionData: { type: 'link', target: 'squad', label: 'VER MEU ELENCO' }
    });

    // Escalação incompleta (só na rodada 0)
    if (starters < 11 && round === 0) {
      msgs.push({
        id: 'squad_analysis', icon: '⚠️', type: 'COMISSÃO', defaultRead: false,
        from: 'Assistente Técnico', subject: 'Escalação Incompleta', date: 'Rodada 1',
        preview: 'Ainda não temos 11 titulares definidos...',
        body: `Chefe,\n\nNotei que ainda não definimos os 11 titulares para a nossa estreia.\n\nPor favor, acesse a prancheta tática e ajuste a equipe antes do jogo.`,
        actionData: { type: 'link', target: 'lineup', label: 'AJUSTAR TÁTICA' }
      });
    }

    // FIX #7: alerta salarial com ID por rodada para não reaparecer
    if (totalWage > wageLimit * 0.85) {
      const warnId = `wage_warning_r${Math.floor(round / 5) * 5}`; // A cada 5 rodadas
      msgs.push({
        id: warnId, icon: '📉', type: 'FINANCEIRO', defaultRead: false,
        from: 'Diretor Financeiro', subject: 'Folha Salarial em Risco', date: `Rodada ${Math.max(round, 1)}`,
        preview: `Gastos mensais em ${formatMoney(totalWage)} — perto do limite.`,
        body: `Treinador,\n\nA folha salarial atingiu ${formatMoney(totalWage)}, muito próxima do limite de ${formatMoney(wageLimit)}.\n\nConsidere vender jogadores de alto salário que não estão sendo utilizados.\n\nA saúde financeira do clube depende desta decisão.`,
        actionData: { type: 'link', target: 'finances', label: 'ABRIR FINANÇAS' }
      });
    }

    return msgs;
  }, [
    gameData.round,
    gameData.serie,
    gameData.club?.money,
    gameData.club?.manager,
    gameData.club?.name,
    gameData.players?.length,
    gameData.table,
  ]);

  // ── Combina mensagens dinâmicas + fixas ──────────────────
  // FIX #5: sort por timestamp extraído do id, fallback para localeCompare
  const allMessages = React.useMemo(() => {
    const dynamicMsgs = (gameData.inbox || []).map(m => ({ ...m, isDynamic: true }));
    return [...dynamicMsgs, ...generatedMessages].sort((a, b) => {
      const aRead = readIds.has(a.id) || a.defaultRead;
      const bRead = readIds.has(b.id) || b.defaultRead;
      if (aRead !== bRead) return aRead ? 1 : -1;
      // Extrai timestamp do id se possível, senão ordena alfabético invertido
      const tsA = parseInt(String(a.id).replace(/\D/g, '').slice(-13)) || 0;
      const tsB = parseInt(String(b.id).replace(/\D/g, '').slice(-13)) || 0;
      return tsB - tsA || String(b.id).localeCompare(String(a.id));
    });
  }, [gameData.inbox, generatedMessages, gameData.readMsgIds]);

  const inboxMessages = allMessages.filter(m => !trashIds.has(m.id) && !erasedIds.has(m.id));
  const trashMessages = allMessages.filter(m => trashIds.has(m.id) && !erasedIds.has(m.id));
  const unreadCount   = inboxMessages.filter(m => !readIds.has(m.id) && !m.defaultRead).length;

  // FIX #2: unifica from/sender
  const getSender = (msg) => msg.from || msg.sender || msg.type || 'Sistema';
  const isRead    = (msg) => readIds.has(msg.id) || !!msg.defaultRead;

  // ── Filtro de busca ──────────────────────────────────────
  const filterList = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(m =>
      m.subject?.toLowerCase().includes(q) ||
      getSender(m).toLowerCase().includes(q) ||
      m.preview?.toLowerCase().includes(q) ||
      m.type?.toLowerCase().includes(q)
    );
  };

  // ── Contadores por tipo ──────────────────────────────────
  const typeCounts = React.useMemo(() => {
    const counts = {};
    inboxMessages.filter(m => !readIds.has(m.id) && !m.defaultRead).forEach(m => {
      const t = m.type || 'OUTRO';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [inboxMessages, gameData.readMsgIds]);

  // ── Ações ────────────────────────────────────────────────
  const handleMarkRead = (id) => {
    if (!readIds.has(id)) {
      setGameData(prev => ({ ...prev, readMsgIds: [...(prev.readMsgIds || []), id] }));
    }
  };

  // FIX #4: lixeira também marca como lido e abre detalhes
  const handleOpenMsg = (msg) => {
    setSelected(msg);
    handleMarkRead(msg.id);
  };

  const handleMoveToTrash = (id) => {
    setGameData(prev => ({ ...prev, trashMsgIds: [...(prev.trashMsgIds || []), id] }));
    setSelected(null);
    showToast('Mensagem enviada para a Lixeira.', 'info');
  };

  const handleRestore = (id, e) => {
    e?.stopPropagation();
    setGameData(prev => ({ ...prev, trashMsgIds: (prev.trashMsgIds || []).filter(t => t !== id) }));
    setSelected(null);
    showToast('Mensagem restaurada.', 'success');
  };

  const handlePermanentDelete = (id, isDynamic) => {
    setGameData(prev => {
      if (isDynamic) {
        return {
          ...prev,
          inbox:       (prev.inbox || []).filter(m => m.id !== id),
          trashMsgIds: (prev.trashMsgIds || []).filter(t => t !== id),
        };
      }
      return {
        ...prev,
        erasedMsgIds: [...(prev.erasedMsgIds || []), id],
        trashMsgIds:  (prev.trashMsgIds || []).filter(t => t !== id),
      };
    });
    setConfirmDialog(null);
    setSelected(null);
    showToast('Mensagem excluída permanentemente.', 'success');
  };

  const handleEmptyTrash = () => {
    setGameData(prev => {
      const dynamicIds = new Set(trashMessages.filter(m => m.isDynamic).map(m => m.id));
      const staticIds  = trashMessages.filter(m => !m.isDynamic).map(m => m.id);
      return {
        ...prev,
        inbox:        (prev.inbox || []).filter(m => !dynamicIds.has(m.id)),
        erasedMsgIds: [...(prev.erasedMsgIds || []), ...staticIds],
        trashMsgIds:  [],
      };
    });
    setConfirmDialog(null);
    showToast('Lixeira esvaziada.', 'success');
  };

  // FIX #8: sellPlayer busca o player atualizado do gameData, não o snapshot da proposta
  const handleTakeAction = (msg) => {
    const action = msg.actionData;
    if (!action) return;

    if (action.type === 'link') {
      setScreen(action.target);
    } else if (action.type === 'sell') {
      const playerExists = gameData.players.find(p => p.id === action.player?.id);
      if (!playerExists) {
        showToast('Esta proposta expirou ou o jogador já saiu do clube.', 'error');
        handleMoveToTrash(msg.id);
        return;
      }
      sellPlayer(playerExists, action.value);
      showToast(`✅ NEGÓCIO FECHADO! ${playerExists.name} vendido por ${formatMoney(action.value)}.`, 'success');
      handleMoveToTrash(msg.id);
    } else if (action.type === 'managerOffer') {
      // Aceitar proposta: marca flag no gameData para trocar de clube na virada de temporada
      setGameData(prev => ({
        ...prev,
        pendingManagerTransfer: {
          accepted: true,
          offeringClub: action.offeringClub,
          offeredSalary: action.offeredSalary,
          acceptedAtRound: prev.round,
        },
      }));
      showToast(`✅ Proposta aceita! Você assumirá o ${action.offeringClub.name} na próxima temporada.`, 'success');
      handleMoveToTrash(msg.id);
    }
  };

  // ── Texto rico: destaca valores em dinheiro ───────────────
  const renderRichText = (text) => {
    const parts = text.split(/(R\$ [\d.,]+)/g);
    return parts.map((part, i) =>
      part.startsWith('R$')
        ? <Typography key={i} component="span" sx={{ color: C.green, fontWeight: 900, bgcolor: `${C.green}15`, px: 0.5, py: 0.1, borderRadius: '4px', border: `1px solid ${C.green}30` }}>{part}</Typography>
        : <React.Fragment key={i}>{part}</React.Fragment>
    );
  };

  // ── Cor / ícone por tipo de mensagem ─────────────────────
  const typeStyle = (type) => ({
    'TRANSFERÊNCIA': { color: C.blue,    bg: `${C.blue}15`    },
    'CONTRATO':      { color: C.gold,    bg: `${C.gold}15`    },
    'FINANCEIRO':    { color: C.teal,    bg: `${C.teal}15`    },
    'DIRETORIA':     { color: C.primary, bg: `${C.primary}15` },
    'COMISSÃO':      { color: C.gold,    bg: `${C.gold}15`    },
    'PROPOSTA':      { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  }[type] || { color: C.txt2, bg: C.cardAlt });

  // ════════════════════════════════════════════════════════
  // TELA DE LEITURA
  // ════════════════════════════════════════════════════════
  if (selected) {
    const action    = selected.actionData;
    const isInTrash = trashIds.has(selected.id);
    const ts        = typeStyle(selected.type);
    // FIX #9: mostra dados atualizados do jogador quando é proposta de venda
    const livePlayer = action?.type === 'sell'
      ? gameData.players.find(p => p.id === action.player?.id)
      : null;

    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10 }}>
        {/* Header leitura */}
        <Box sx={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)',
          borderBottom: `1px solid ${C.border}`,
          px: 1.5, pt: 3.8, pb: 1.2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box onClick={() => setSelected(null)} sx={{ cursor: 'pointer', color: C.teal, fontSize: '1.3rem', lineHeight: 1, px: 0.3 }}>❮</Box>
            <Box>
              <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.9rem' }}>
                {isInTrash ? '🗑️ LIXEIRA' : '📬 MENSAGEM'}
              </Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.56rem', fontWeight: 700 }}>{getSender(selected)}</Typography>
            </Box>
          </Box>
          {isInTrash ? (
            <Box onClick={(e) => handleRestore(selected.id, e)} sx={{ border: `1px solid ${C.green}`, borderRadius: '7px', px: 1.2, py: 0.4, cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.65rem' }}>↩ RESTAURAR</Typography>
            </Box>
          ) : (
            <Box onClick={() => handleMoveToTrash(selected.id)} sx={{ border: `1px solid ${C.red}`, borderRadius: '7px', px: 1.2, py: 0.4, cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
              <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.65rem' }}>🗑 APAGAR</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ px: 1.5, pt: 1.5 }}>
          {/* Cabeçalho da mensagem — FIX #3: fundo escuro */}
          <Box sx={{
            bgcolor: C.card, border: `1.5px solid ${ts.color}40`,
            borderRadius: '12px 12px 0 0', overflow: 'hidden',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <Box sx={{ px: 1.8, py: 1.4, background: `linear-gradient(90deg, ${ts.color}15 0%, transparent 100%)` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                <Box sx={{ bgcolor: ts.bg, border: `1px solid ${ts.color}40`, borderRadius: '5px', px: 0.8, py: 0.2 }}>
                  <Typography sx={{ color: ts.color, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 0.5 }}>
                    {selected.icon} {selected.type || 'MENSAGEM'}
                  </Typography>
                </Box>
                <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700 }}>{selected.date}</Typography>
              </Box>
              <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mb: 0.5 }}>
                {selected.subject}
              </Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700 }}>
                De: {getSender(selected)}
              </Typography>
            </Box>
          </Box>

          {/* FIX #9: card especial para proposta de venda com dados atualizados */}
          {action?.type === 'sell' && livePlayer && (
            <Box sx={{ bgcolor: `${C.blue}0d`, border: `1px solid ${C.blue}35`, borderRadius: '0', px: 1.8, py: 1.2, borderBottom: `1px solid ${C.border}` }}>
              <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.8, mb: 0.8 }}>JOGADOR DISPONÍVEL</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: C.cardAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: livePlayer.overall >= 80 ? C.green : livePlayer.overall >= 70 ? C.gold : C.red, fontWeight: 900, fontSize: '0.9rem' }}>{livePlayer.overall}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1 }}>{livePlayer.name}</Typography>
                  <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>
                    {livePlayer.position} · {livePlayer.age} anos · Salário: {formatMoney(livePlayer.wage || 0)}/rod
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '0.82rem' }}>{formatMoney(action.value)}</Typography>
                  <Typography sx={{ color: C.txt3, fontSize: '0.5rem' }}>oferta</Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Corpo da mensagem */}
          <Box sx={{ bgcolor: C.card, borderRadius: action?.type === 'sell' && livePlayer ? '0 0 12px 12px' : '0 0 12px 12px', border: `1.5px solid ${ts.color}25`, borderTop: 'none', px: 1.8, py: 1.6, minHeight: 180 }}>
            {selected.body.split('\n').map((line, i) => (
              <Typography key={i} sx={{ color: C.txt1, fontSize: '0.85rem', lineHeight: 1.9, mb: line === '' ? 0.8 : 0, fontWeight: 400 }}>
                {renderRichText(line || '\u00A0')}
              </Typography>
            ))}
          </Box>

          {/* Área de ação */}
          {action && !isInTrash && (
            <Box sx={{ mt: 1, bgcolor: action.type === 'sell' ? `${C.blue}0a` : `${C.teal}0a`, border: `1.5px dashed ${action.type === 'sell' ? C.blue : C.teal}50`, borderRadius: '10px', p: 1.5 }}>
              <Typography sx={{ color: action.type === 'sell' ? C.blue : C.teal, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.8, mb: 1, textAlign: 'center' }}>
                ↳ RESPOSTA DO MANAGER REQUERIDA
              </Typography>
              {action.type === 'link' && (
                <Box onClick={() => handleTakeAction(selected)} sx={{ bgcolor: C.teal, borderRadius: '8px', py: 1, textAlign: 'center', cursor: 'pointer', '&:active': { filter: 'brightness(0.85)' } }}>
                  <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.8rem' }}>{action.label} ➔</Typography>
                </Box>
              )}
              {action.type === 'sell' && selected.isDynamic && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box onClick={() => handleMoveToTrash(selected.id)} sx={{ flex: 1, border: `1px solid ${C.red}`, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
                    <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.75rem' }}>✗ REJEITAR</Typography>
                  </Box>
                  <Box onClick={() => handleTakeAction(selected)} sx={{ flex: 1, bgcolor: C.green, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer', '&:active': { filter: 'brightness(0.85)' } }}>
                    <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.75rem' }}>✓ ACEITAR VENDA</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ════════════════════════════════════════════════════════
  // LISTA DE MENSAGENS
  // ════════════════════════════════════════════════════════
  const currentList = filterList(tab === 'inbox' ? inboxMessages : trashMessages);

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10 }}>

      {/* HEADER — padrão do jogo */}
      <Box sx={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)',
        borderBottom: `1px solid ${C.border}`,
        px: 1.5, pt: 3.8, pb: 1.3,
        position: 'relative', overflow: 'hidden',
      }}>
        <Typography sx={{ position: 'absolute', right: -8, top: -5, fontSize: '6rem', opacity: 0.04, lineHeight: 1, pointerEvents: 'none' }}>
          {tab === 'inbox' ? '📬' : '🗑️'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '10px', flexShrink: 0, bgcolor: `${C.teal}15`, border: `1.5px solid ${C.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{tab === 'inbox' ? '📬' : '🗑️'}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.05rem', letterSpacing: 0.5 }}>CAIXA DE ENTRADA</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.15 }}>{gameData.club?.name}</Typography>
          </Box>
          {unreadCount > 0 && (
            <Box sx={{ bgcolor: C.red, borderRadius: '10px', px: 0.8, minWidth: 22, textAlign: 'center', py: 0.2 }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>{unreadCount}</Typography>
            </Box>
          )}
        </Box>

        {/* Contadores por tipo */}
        {Object.keys(typeCounts).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.6, mb: 1, flexWrap: 'wrap' }}>
            {Object.entries(typeCounts).map(([type, count]) => {
              const ts = typeStyle(type);
              return (
                <Box key={type} sx={{ bgcolor: ts.bg, border: `1px solid ${ts.color}40`, borderRadius: '6px', px: 0.7, py: 0.2 }}>
                  <Typography sx={{ color: ts.color, fontWeight: 900, fontSize: '0.5rem' }}>{type} ({count})</Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Abas */}
        <Box sx={{ display: 'flex', gap: 0.6, mb: 1 }}>
          {[
            { id: 'inbox', label: `ENTRADA${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { id: 'trash', label: `LIXEIRA${trashMessages.length > 0 ? ` (${trashMessages.length})` : ''}` },
          ].map(t => (
            <Box key={t.id} onClick={() => { setTab(t.id); setSearch(''); }} sx={{
              flex: 1, py: 0.65, borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
              bgcolor: tab === t.id ? (t.id === 'inbox' ? C.teal : C.red) : C.cardAlt,
              border: `1px solid ${tab === t.id ? (t.id === 'inbox' ? C.teal : C.red) : C.border}`,
              transition: 'all 0.15s',
            }}>
              <Typography sx={{ color: tab === t.id ? '#000' : C.txt2, fontWeight: 900, fontSize: '0.68rem' }}>{t.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Busca */}
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '8px', px: 1.2, py: 0.6, gap: 0.8 }}>
          <Typography sx={{ color: C.txt3, fontSize: '0.85rem' }}>🔍</Typography>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar mensagens..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#0f172a', fontSize: '0.72rem', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
          />
          {search && (
            <Typography onClick={() => setSearch('')} sx={{ color: C.txt3, fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1 }}>✕</Typography>
          )}
        </Box>
      </Box>

      {/* Ação esvaziar lixeira */}
      {tab === 'trash' && trashMessages.length > 0 && (
        <Box sx={{ px: 1.5, pt: 1.2 }}>
          <Box onClick={() => setConfirmDialog({ type: 'emptyTrash' })} sx={{ border: `1px solid ${C.red}`, borderRadius: '8px', py: 0.8, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
            <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem' }}>🗑️ ESVAZIAR LIXEIRA COMPLETAMENTE</Typography>
          </Box>
        </Box>
      )}

      {/* Lista */}
      <Box sx={{ px: 1.5, pt: 1.2 }}>
        {currentList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '3.5rem', mb: 1, opacity: 0.18 }}>
              {search ? '🔍' : tab === 'inbox' ? '📭' : '🍃'}
            </Typography>
            <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.85rem' }}>
              {search ? `Nenhum resultado para "${search}"` : tab === 'inbox' ? 'Caixa de entrada vazia.' : 'A lixeira está limpa.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {currentList.map((msg) => {
              const read   = isRead(msg);
              const action = msg.actionData;
              const ts     = typeStyle(msg.type);

              return (
                <Paper key={msg.id} onClick={() => handleOpenMsg(msg)} sx={{
                  borderRadius: '11px', cursor: 'pointer', overflow: 'hidden',
                  position: 'relative', bgcolor: read ? C.card : C.cardAlt,
                  border: `1px solid ${!read ? ts.color + '55' : C.border}`,
                  boxShadow: !read ? `0 2px 8px ${ts.color}18` : 'none',
                  transition: 'transform 0.1s',
                  '&:active': { transform: 'scale(0.985)' },
                }}>
                  {/* Barra lateral não lida */}
                  {!read && <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: ts.color, borderRadius: '11px 0 0 11px' }} />}

                  <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', px: 1.4, py: 1.1, pl: !read ? 2 : 1.4 }}>
                    {/* Avatar tipo */}
                    <Box sx={{ width: 40, height: 40, borderRadius: '9px', bgcolor: ts.bg, border: `1.5px solid ${ts.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                      {action?.type === 'sell' ? '🤝' : msg.icon}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.15 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0, flex: 1, mr: 0.5 }}>
                          <Typography sx={{ color: read ? C.txt2 : ts.color, fontWeight: 900, fontSize: '0.6rem', flexShrink: 0, bgcolor: ts.bg, border: `1px solid ${ts.color}30`, borderRadius: '4px', px: 0.5, py: 0.1 }}>
                            {msg.type || 'MSG'}
                          </Typography>
                          <Typography sx={{ color: read ? C.txt2 : C.txt1, fontWeight: 700, fontSize: '0.65rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {getSender(msg)}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: C.txt4, fontSize: '0.52rem', fontWeight: 700, flexShrink: 0 }}>{msg.date}</Typography>
                      </Box>

                      <Typography sx={{ color: read ? C.txt1 : C.txt1, fontWeight: read ? 700 : 900, fontSize: '0.82rem', lineHeight: 1.2, mb: 0.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {msg.subject}
                      </Typography>
                      <Typography sx={{ color: C.txt3, fontSize: '0.62rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {msg.preview}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ações da lixeira inline */}
                  {tab === 'trash' && (
                    <Box sx={{ display: 'flex', gap: 0.8, px: 1.4, pb: 1, pt: 0.3 }}>
                      <Box onClick={(e) => { e.stopPropagation(); handleRestore(msg.id, e); }} sx={{ flex: 1, border: `1px solid ${C.green}`, borderRadius: '6px', py: 0.5, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
                        <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.6rem' }}>↩ RESTAURAR</Typography>
                      </Box>
                      <Box onClick={(e) => { e.stopPropagation(); setConfirmDialog({ type: 'single', id: msg.id, isDynamic: msg.isDynamic }); }} sx={{ flex: 1, border: `1px solid ${C.red}`, borderRadius: '6px', py: 0.5, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}>
                        <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.6rem' }}>🗑 EXCLUIR</Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Modal confirmação */}
      <Dialog open={Boolean(confirmDialog)} onClose={() => setConfirmDialog(null)}
        PaperProps={{ sx: { bgcolor: C.card, borderRadius: '14px', border: `2px solid ${C.red}`, p: 2.5, textAlign: 'center', minWidth: 270, m: 2 } }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 0.8, lineHeight: 1 }}>⚠️</Typography>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1rem', mb: 0.8 }}>Tem certeza?</Typography>
        <Typography sx={{ color: C.txt2, fontSize: '0.8rem', mb: 2 }}>
          {confirmDialog?.type === 'emptyTrash'
            ? 'Todas as mensagens da lixeira serão excluídas permanentemente.'
            : 'Esta mensagem será excluída para sempre.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.8 }}>
          <Box onClick={() => setConfirmDialog(null)} sx={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer' }}>
            <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.78rem' }}>CANCELAR</Typography>
          </Box>
          <Box onClick={() => confirmDialog.type === 'emptyTrash' ? handleEmptyTrash() : handlePermanentDelete(confirmDialog.id, confirmDialog.isDynamic)}
            sx={{ flex: 1, bgcolor: C.red, borderRadius: '8px', py: 0.9, textAlign: 'center', cursor: 'pointer', '&:active': { filter: 'brightness(0.85)' } }}>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.78rem' }}>EXCLUIR</Typography>
          </Box>
        </Box>
      </Dialog>

    </Box>
  );
};

export default ScreenInbox;
