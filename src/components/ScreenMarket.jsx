// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { MARKET_REFRESH_COST, applyPlayerSale, collectCpuTeams, createRefreshedMarket, enrichTransferPlayer, getMinimumAcceptedOffer, getTeamSerie, normalizeAndFilterMarket, resolveNegotiationPlayer } from '../engines/market/marketService.js';

// components/ScreenMarket.js — v9.0
// ─────────────────────────────────────────────────────────────────────────────
// CORREÇÕES v9:
//   #12 teamName undefined em jogadores do mercado livre → garantido 'Livre'
//   #13 slider de negociação sem indicador do mínimo aceitável → linha vermelha no slider
//   #7  aba VENDAS não separava jogadores à venda dos demais → seção separada
//   #8  card do jogador à venda não mostrava OVR/salário/contrato inline → adicionado
// ─────────────────────────────────────────────────────────────────────────────

const ScreenMarket = ({ gameData, setGameData, buyPlayer, formatMoney, showToast }) => {
  const FallbackTeamIcon = ({ name, size }) => (
    <Box sx={{ width:size||40, height:size||40, borderRadius:'50%', bgcolor:C.green,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size > 30 ? '0.8rem' : '0.5rem', color:'#fff', fontWeight:900,
      border:'2px solid rgba(255,255,255,0.2)', flexShrink:0 }}>
      {(name||'?').substring(0,3).toUpperCase()}
    </Box>
  );
  const TeamIcon = window.TeamIcon || FallbackTeamIcon;

  const [tab,            setTab]            = React.useState('market');
  const [filterPos,      setFilterPos]      = React.useState('TODOS');
  const [filterOvr,      setFilterOvr]      = React.useState('TODOS');
  const [selected,       setSelected]       = React.useState(null);
  const [negotiating,    setNegotiating]    = React.useState(null);
  const [offerPct,       setOfferPct]       = React.useState(85);
  const [leagueFilter,   setLeagueFilter]   = React.useState('A');
  const [selectedClubId, setSelectedClubId] = React.useState(null);

  // ── Watchlist (favoritos) ─────────────────────────────────
  // Armazenada em gameData.watchlist: array de { id, name, position, overall, age, value, teamName, addedAt }
  const watchlist = gameData.watchlist || [];
  const isWatched = (id) => watchlist.some(w => w.id === id);

  const toggleWatchlist = (p, e) => {
    e.stopPropagation();
    setGameData(prev => {
      const wl = prev.watchlist || [];
      if (wl.some(w => w.id === p.id)) {
        return { ...prev, watchlist: wl.filter(w => w.id !== p.id) };
      }
      return {
        ...prev,
        watchlist: [
          { id: p.id, name: p.name, position: p.position, overall: p.overall,
            age: p.age, value: p.value, wage: p.wage, teamName: p.teamName || 'Livre',
            addedAt: Date.now() },
          ...wl,
        ].slice(0, 30), // máx 30 favoritos
      };
    });
  };

  const C = THEME;

  const posColor = (pos) => {
    const T = THEME;
    if (pos==='GOL')                              return {bg:T.posGol,  text:'#fff'};
    if (['ZAG','LD','LE','LAT'].includes(pos))    return {bg:T.posZag,  text:'#fff'};
    if (['VOL','MC','MEI'].includes(pos))         return {bg:T.posVol,  text:'#fff'};
    return {bg:T.posAta, text:'#fff'};
  };
  const ovrColor = (o) => o>=80 ? C.green : o>=70 ? C.gold : C.red;

  const positions  = ['TODOS','GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'];
  const ovrRanges  = [
    { label:'TODOS', min:0,  max:99 },
    { label:'60-69', min:60, max:69 },
    { label:'70-79', min:70, max:79 },
    { label:'80+',   min:80, max:99 },
  ];
  const activeRange = ovrRanges.find(r => r.label===filterOvr) || ovrRanges[0];

  // Dados de domínio do mercado ficam fora da camada visual.
  const marketPlayers = normalizeAndFilterMarket(gameData.market, { position: filterPos, range: activeRange });

  // ── Atualizar mercado ──────────────────────────────────────
  const handleRefreshMarket = () => {
    if ((gameData.club?.money||0) < MARKET_REFRESH_COST) {
      showToast?.('Verba insuficiente para atualizar o mercado!', 'error');
      return;
    }
    const newMarket = createRefreshedMarket(gameData, window.generatePlayer);
    setGameData(prev => ({
      ...prev, market: newMarket,
      club: { ...prev.club, money: prev.club.money - MARKET_REFRESH_COST },
      financialHistory: [{ round: prev.round, income:0, expense:MARKET_REFRESH_COST, total:-MARKET_REFRESH_COST, detail: { description: 'Taxa: Atualização do Mercado' } }, ...(prev.financialHistory||[])].slice(0,50),
    }));
    showToast?.('Mercado atualizado com novos jogadores!', 'success');
  };

  // ── Times CPU ─────────────────────────────────────────────
  const allCpuTeams = React.useMemo(() => collectCpuTeams(gameData), [gameData.teams, gameData.leagues]);
  const displayClubs  = allCpuTeams.filter(t => getTeamSerie(gameData, t) === leagueFilter);
  const selectedClub  = allCpuTeams.find(t => String(t.id)===String(selectedClubId));
  const cpuRoster     = selectedClub?.squad || [];

  // ── Compra direta ─────────────────────────────────────────
  const handleCPUTransfer = (player, finalPrice) => {
    buyPlayer(enrichTransferPlayer(gameData, player, finalPrice));
  };

  const handleBuyDirect = (p, e) => {
    e?.stopPropagation();
    handleCPUTransfer(p, p.value);
    setSelected(null);
    setNegotiating(null);
  };

  // ── Negociação ────────────────────────────────────────────
  const handleNegotiateSubmit = () => {
    const stale = negotiating.player;

    // Verificar disponibilidade e buscar a versão atualizada do jogador.
    const freshPlayer = resolveNegotiationPlayer(gameData, stale);

    if (!freshPlayer) {
      showToast?.(`❌ ${stale.name} não está mais disponível.`, 'error');
      setNegotiating(null);
      return;
    }

    // Usar dados frescos do jogador (value, wage corretos)
    const p         = { ...freshPlayer, teamName: stale.teamName };
    const offer     = Math.round(p.value * offerPct / 100);
    const minAccept = getMinimumAcceptedOffer(p);

    if (offer >= minAccept) {
      handleCPUTransfer(p, offer);
      showToast?.(`✅ Negócio fechado! ${p.name} assinou contrato.`, 'success');
      setNegotiating(null);
      setSelectedClubId(null);
    } else {
      showToast?.(`❌ Proposta recusada. Mínimo: ${formatMoney(minAccept)}`, 'error');
    }
  };

  // ── Listar / Retirar da lista ─────────────────────────────
  const handleToggleList = (p, e) => {
    e?.stopPropagation();
    if (!p.isListed && p.isStarting) {
      showToast?.(`⚠️ ${p.name.split(' ')[0]} é titular. Remova da escalação antes de listar.`, 'warning');
      return;
    }
    setGameData(prev => ({
      ...prev,
      players: prev.players.map(pl => pl.id===p.id ? { ...pl, isListed: !pl.isListed } : pl),
    }));
    showToast?.(p.isListed
      ? `${p.name} removido da lista.`
      : `${p.name} colocado à venda!`, 'info');
    setSelected(null);
  };

  // ── Aceitar venda ─────────────────────────────────────────
  const handleAcceptSell = (p, offerData) => {
    showToast?.(`${p.name} vendido por ${formatMoney(offerData.value)}!`, 'success');
    setGameData(prev => applyPlayerSale(prev, p, offerData));
    setSelected(null);
  };

  // ── Card de jogador (mercado/cpu) ─────────────────────────
  const renderPlayerCard = (p, type='market') => {
    const afford   = gameData.club.money >= p.value;
    const expanded = selected?.id === p.id;
    const pc = posColor(p.position);

    return (
      <Paper key={p.id} onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{
        overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
        border: expanded ? `1.5px solid ${C.teal}` : afford ? `1px solid ${C.border}` : `1px solid ${C.red}40`,
        bgcolor: expanded ? `${C.teal}08` : !afford ? `${C.red}04` : C.card,
        transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' },
      }}>
        <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
          <Box sx={{ position:'relative', flexShrink:0 }}>
            {window.JerseyBadge
              ? React.createElement(window.JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 40 })
              : <Box sx={{ width:40, height:40, borderRadius:'50%', bgcolor:pc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900, color:pc.text }}>{p.position}</Box>
            }
            {p.injury && (
              <Box sx={{ position:'absolute', bottom:-2, right:-2, bgcolor:C.card, borderRadius:'50%',
                width:13, height:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Typography sx={{fontSize:'0.5rem'}}>🚑</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color: afford?C.txt1:C.red,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.1 }}>
              {p.age} anos · {p.teamName || 'Livre'}
            </Typography>
          </Box>
          <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.25 }}>
            <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}>
              <Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography>
            </Box>
            <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color: afford?C.teal:C.red }}>
              {formatMoney(p.value)}
            </Typography>
          </Box>
          {/* Botão de favorito */}
          <Box onClick={e => toggleWatchlist(p, e)} sx={{
            flexShrink:0, width:28, height:28, borderRadius:'50%',
            bgcolor: isWatched(p.id) ? `${C.gold}25` : C.cardAlt,
            border: `1px solid ${isWatched(p.id) ? C.gold : C.border}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', transition:'all 0.15s',
            '&:active':{ transform:'scale(0.85)' },
          }}>
            <Typography sx={{ fontSize:'0.75rem', lineHeight:1 }}>
              {isWatched(p.id) ? '⭐' : '☆'}
            </Typography>
          </Box>
        </Box>

        {expanded && (
          <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
            <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.5, mb:0.9 }}>
              {[
                { l:'ENERGIA', v:`${p.energy??100}%`, c:(p.energy??100)>=70?C.green:(p.energy??100)>=50?C.gold:C.red },
                { l:'SALÁRIO', v:formatMoney(p.wage||0), c:C.txt2 },
                { l:'CONTRATO', v:`${p.contract??2} ano(s)`, c:(p.contract??2)<=1?C.red:C.txt2 },
              ].map((s,i) => (
                <Box key={i} sx={{ bgcolor:C.cardAlt, borderRadius:'6px', px:0.6, py:0.45, textAlign:'center' }}>
                  <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{s.v}</Typography>
                  <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, mt:0.1 }}>{s.l}</Typography>
                </Box>
              ))}
            </Box>
            {/* Multa rescisória */}
            {p.releaseClause > 0 && (
              <Box sx={{ bgcolor:`${C.red}08`, border:`1px solid ${C.red}25`, borderRadius:'6px', px:0.9, py:0.5, mb:0.7, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                  <Typography sx={{ fontSize:'0.75rem' }}>🔒</Typography>
                  <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.56rem' }}>Multa rescisória</Typography>
                </Box>
                <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.68rem' }}>{formatMoney(p.releaseClause)}</Typography>
              </Box>
            )}
            <Box sx={{ display:'flex', flexDirection:'column', gap:0.6 }}>
              <Box onClick={e => { e.stopPropagation(); if(afford) handleBuyDirect(p,e); }}
                sx={{ bgcolor:afford?C.teal:C.cardAlt, borderRadius:'8px', py:0.85,
                  textAlign:'center', cursor:afford?'pointer':'not-allowed', opacity:afford?1:0.5 }}>
                <Typography sx={{ color:afford?'#000':C.txt3, fontWeight:900, fontSize:'0.76rem' }}>
                  {afford ? `💰 COMPRAR — ${formatMoney(p.value)}` : 'SEM VERBA'}
                </Typography>
              </Box>
              <Box onClick={e => { e.stopPropagation(); setNegotiating({player:p}); setOfferPct(85); setSelected(null); }}
                sx={{ border:`1px solid ${C.border}`, borderRadius:'8px', py:0.85,
                  textAlign:'center', cursor:'pointer', '&:active':{opacity:0.7} }}>
                <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.76rem' }}>🤝 NEGOCIAR</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  // ── Card do meu jogador (aba VENDAS) ─────────────────────
  // FIX #7 + #8: separação visual e stats inline
  const renderMyPlayerCard = (p) => {
    const expanded = selected?.id === p.id;
    const inboxMsg = (gameData.inbox||[]).find(m =>
      m.actionData?.type==='sell' && m.actionData?.player?.id===p.id
    );
    const offerData = inboxMsg
      ? { team: inboxMsg.from||inboxMsg.sender, value: inboxMsg.actionData.value, msgId: inboxMsg.id }
      : null;
    const pc = posColor(p.position);

    return (
      <Paper key={p.id} onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{
        overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
        border: expanded ? `1.5px solid ${offerData?C.blue:C.teal}`
          : offerData ? `1px solid ${C.blue}50`
          : p.isListed ? `1px solid ${C.orange}40`
          : `1px solid ${C.border}`,
        bgcolor: expanded ? `${offerData?C.blue:C.teal}08`
          : offerData ? `${C.blue}06`
          : p.isListed ? `${C.orange}05`
          : C.card,
        transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' },
      }}>
        {/* Linha principal */}
        <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
          {/* Camisa */}
          {window.JerseyBadge
            ? React.createElement(window.JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 40 })
            : <Box sx={{ width:38, height:38, borderRadius:'50%', flexShrink:0, bgcolor:pc.bg,
                color:pc.text, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.62rem', fontWeight:900 }}>{p.position}</Box>
          }

          {/* Nome + info */}
          <Box sx={{ flex:1, minWidth:0 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.1 }}>
              <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
              {offerData && (
                <Box sx={{ bgcolor:`${C.blue}30`, border:`1px solid ${C.blue}60`,
                  borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                  <Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.blue }}>📩 PROPOSTA</Typography>
                </Box>
              )}
              {!offerData && p.isListed && (
                <Box sx={{ bgcolor:`${C.orange}25`, border:`1px solid ${C.orange}50`,
                  borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                  <Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.orange }}>À VENDA</Typography>
                </Box>
              )}
            </Box>
            {/* FIX #8: stats inline — sempre visíveis */}
            <Box sx={{ display:'flex', gap:0.6, alignItems:'center' }}>
              <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>
                {p.age}a
              </Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
              <Typography sx={{ color:(p.energy??100)>=70?C.green:(p.energy??100)>=50?C.gold:C.red, fontSize:'0.54rem', fontWeight:700 }}>
                ⚡{p.energy??100}%
              </Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
              <Typography sx={{ color:C.txt2, fontSize:'0.54rem', fontWeight:700 }}>
                {formatMoney(p.wage||0)}/rod
              </Typography>
              {(p.contract??2) <= 1 && (
                <>
                  <Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
                  <Typography sx={{ color:C.red, fontSize:'0.52rem', fontWeight:900 }}>
                    {p.contract??0}a contr.
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* OVR + Valor */}
          <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.25 }}>
            <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}>
              <Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography>
            </Box>
            <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:C.txt2 }}>
              {formatMoney(p.value)}
            </Typography>
          </Box>
        </Box>

        {/* Área expandida */}
        {expanded && (
          <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
            {offerData ? (
              /* Proposta recebida */
              <Box sx={{ bgcolor:`${C.blue}0a`, border:`1.5px dashed ${C.blue}50`,
                p:1.2, borderRadius:'10px', textAlign:'center' }}>
                <Typography sx={{ color:C.txt3, fontSize:'0.62rem', fontWeight:700, mb:0.3 }}>
                  Proposta de <strong style={{color:C.txt1}}>{offerData.team}</strong>
                </Typography>
                <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'1.15rem', mb:1 }}>
                  {formatMoney(offerData.value)}
                </Typography>
                <Box sx={{ display:'flex', gap:0.8 }}>
                  <Box onClick={e => { e.stopPropagation();
                    setGameData(prev => ({ ...prev, inbox: prev.inbox.filter(m => m.id!==offerData.msgId) })); }}
                    sx={{ flex:1, border:`1px solid ${C.red}`, borderRadius:'7px', py:0.7,
                      textAlign:'center', cursor:'pointer', '&:active':{opacity:0.7} }}>
                    <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.72rem' }}>RECUSAR</Typography>
                  </Box>
                  <Box onClick={e => { e.stopPropagation(); handleAcceptSell(p, offerData); }}
                    sx={{ flex:1, bgcolor:C.green, borderRadius:'7px', py:0.7,
                      textAlign:'center', cursor:'pointer', '&:active':{filter:'brightness(0.85)'} }}>
                    <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.72rem' }}>VENDER</Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              /* Botão listar / retirar */
              <Box onClick={e => handleToggleList(p,e)}
                sx={{ border:`1px solid ${p.isListed?C.red:C.teal}`, borderRadius:'8px',
                  py:0.9, textAlign:'center', cursor:'pointer', '&:active':{opacity:0.7} }}>
                <Typography sx={{ color:p.isListed?C.red:C.teal, fontWeight:900, fontSize:'0.76rem' }}>
                  {p.isListed ? '❌ RETIRAR DA LISTA' : '📢 COLOCAR À VENDA'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    );
  };

  // ── Dados da aba VENDAS ───────────────────────────────────
  const salesData = React.useMemo(() => {
    const withOffer   = [];
    const listed      = [];
    const rest        = [];
    const inboxOfferIds = new Set(
      (gameData.inbox||[])
        .filter(m => m.actionData?.type==='sell')
        .map(m => m.actionData?.player?.id)
    );
    [...gameData.players]
      .sort((a,b) => (b.overall||0) - (a.overall||0))
      .forEach(p => {
        if (inboxOfferIds.has(p.id))      withOffer.push(p);
        else if (p.isListed)              listed.push(p);
        else                              rest.push(p);
      });
    return { withOffer, listed, rest };
  }, [gameData.players, gameData.inbox]);

  // ─────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:10 }}>

      {/* HEADER */}
      <Box sx={{ background:`linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,
        borderBottom:`1px solid ${C.border}`, px:1.5, pt:3.8, pb:1.3, position:'relative', overflow:'hidden' }}>
        <Typography sx={{ position:'absolute', right:-8, top:-5, fontSize:'6rem',
          opacity:0.04, lineHeight:1, pointerEvents:'none' }}>🤝</Typography>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.2 }}>
          <Box sx={{ width:44, height:44, borderRadius:'10px', flexShrink:0,
            bgcolor:`${C.blue}15`, border:`1.5px solid ${C.blue}40`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Typography sx={{ fontSize:'1.5rem', lineHeight:1 }}>🤝</Typography>
          </Box>
          <Box sx={{ flex:1 }}>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.05rem', letterSpacing:0.5 }}>TRANSFERÊNCIAS</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700, mt:0.15 }}>{gameData.club.name}</Typography>
          </Box>
        </Box>

        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0.8, mb:1.2 }}>
          <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'8px', px:1, py:0.7 }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700, letterSpacing:0.5 }}>VERBA DISPONÍVEL</Typography>
            <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.88rem', lineHeight:1.2 }}>
              {formatMoney(gameData.club.money)}
            </Typography>
          </Box>
          <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'8px', px:1, py:0.7 }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700, letterSpacing:0.5 }}>
              FOLHA ({gameData.players.length} jog.)
            </Typography>
            <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.88rem', lineHeight:1.2 }}>
              {formatMoney(gameData.players.reduce((s,p)=>s+(p.wage||0),0))}/rod
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display:'flex', gap:0.6 }}>
          {[
            {id:'market', label:'LIVRES'},
            {id:'clubs',  label:'CLUBES'},
            {id:'scout',  label:'SCOUT'},
            {id:'sales',  label:'VENDAS'},
            {id:'watch',  label:'⭐', title:'Favoritos'},
          ].map(t=>(
            <Box key={t.id} onClick={()=>{ setTab(t.id); setSelected(null); }} sx={{
              flex:1, py:0.7, borderRadius:'8px', textAlign:'center', cursor:'pointer',
              bgcolor: tab===t.id ? (t.id==='watch' ? C.gold : C.teal) : C.cardAlt,
              border:`1px solid ${tab===t.id?(t.id==='watch'?C.gold:C.teal):C.border}`,
              transition:'all 0.15s', position:'relative',
            }}>
              <Typography sx={{ color:tab===t.id?'#000':C.txt2, fontWeight:900, fontSize:'0.68rem' }}>
                {t.label}
                {t.id==='sales' && salesData.withOffer.length > 0 && (
                  <Typography component="span" sx={{ ml:0.5, bgcolor:C.blue, color:'#fff',
                    fontSize:'0.42rem', fontWeight:900, borderRadius:'10px', px:0.5, py:0.1 }}>
                    {salesData.withOffer.length}
                  </Typography>
                )}
                {t.id==='watch' && watchlist.length > 0 && (
                  <Typography component="span" sx={{ ml:0.3, bgcolor:C.gold, color:'#000',
                    fontSize:'0.42rem', fontWeight:900, borderRadius:'10px', px:0.4, py:0.1 }}>
                    {watchlist.length}
                  </Typography>
                )}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Banner de janela de transferências */}
        {(() => {
          if (!window.CpuAI?.getTransferWindowInfo) return null;
          const info = window.CpuAI.getTransferWindowInfo(gameData.round || 0);
          if (info.open) return (
            <Box sx={{ mt:0.8, bgcolor:'rgba(34,197,94,0.08)', border:`1px solid ${C.green}40`,
              borderRadius:'8px', px:1.2, py:0.6, display:'flex', alignItems:'center', gap:0.8 }}>
              <Typography sx={{ fontSize:'0.8rem' }}>🟢</Typography>
              <Box sx={{ flex:1 }}>
                <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.65rem' }}>
                  JANELA ABERTA — {info.label}
                </Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>
                  Fecha em {info.closesIn} rodada(s)
                </Typography>
              </Box>
            </Box>
          );
          return (
            <Box sx={{ mt:0.8, bgcolor:`${C.red}08`, border:`1px solid ${C.red}30`,
              borderRadius:'8px', px:1.2, py:0.6, display:'flex', alignItems:'center', gap:0.8 }}>
              <Typography sx={{ fontSize:'0.8rem' }}>🔴</Typography>
              <Box sx={{ flex:1 }}>
                <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.65rem' }}>
                  JANELA FECHADA
                </Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>
                  {info.label} abre em {info.opensIn} rodada(s)
                </Typography>
              </Box>
            </Box>
          );
        })()}
      </Box>

      <Box sx={{ px:1.5, pt:1.5 }}>

        {/* Painel de negociação */}
        {negotiating && (() => {
          // Sempre usar a versão mais atualizada do jogador para exibir valor/OVR corretos
          const staleP = negotiating.player;
          const freshP = staleP.teamName === 'Livre'
            ? ((gameData.market || []).find(m => m.id === staleP.id) || staleP)
            : (() => {
                const all = [...(gameData.teams||[]),...(gameData.leagues?.A||[]),...(gameData.leagues?.B||[])];
                return all.find(t => t.name === staleP.teamName)?.squad?.find(s => s.id === staleP.id) || staleP;
              })();
          const dispP = { ...freshP, teamName: staleP.teamName };
          const minPct   = dispP.teamName === 'Livre' ? 85 : 92;
          const offerVal = Math.round(dispP.value * offerPct / 100);
          const minVal   = Math.round(dispP.value * minPct / 100);
          const aboveMin = offerPct >= minPct;
          return (
          <Paper sx={{ mb:1.5, border:`1.5px solid ${C.teal}`, borderRadius:'12px', overflow:'hidden' }}>
            <Box sx={{ bgcolor:C.teal, px:1.8, py:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.82rem' }}>🤝 NEGOCIAR PROPOSTA</Typography>
              <Box onClick={()=>setNegotiating(null)} sx={{ cursor:'pointer', color:'rgba(0,0,0,0.6)', fontSize:'1.1rem', fontWeight:900 }}>✕</Box>
            </Box>
            <Box sx={{ p:1.5, bgcolor:C.bg }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.2 }}>
                <Box>
                  <Typography sx={{ fontWeight:900, color:C.txt1, fontSize:'0.95rem' }}>{dispP.name}</Typography>
                  <Typography sx={{ fontSize:'0.65rem', color:C.txt3, fontWeight:700 }}>{dispP.teamName||'Livre'}</Typography>
                </Box>
                <Box sx={{ bgcolor:ovrColor(dispP.overall), borderRadius:'8px', px:1, py:0.4 }}>
                  <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.95rem' }}>{dispP.overall}</Typography>
                </Box>
              </Box>
              <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.6 }}>
                  <Typography sx={{ color:C.txt2, fontSize:'0.68rem', fontWeight:700 }}>Valor de mercado:</Typography>
                  <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.75rem' }}>{formatMoney(dispP.value)}</Typography>
                </Box>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                  <Typography sx={{ color:C.txt2, fontSize:'0.68rem', fontWeight:900 }}>Sua oferta ({offerPct}%):</Typography>
                  <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'0.95rem' }}>{formatMoney(offerVal)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.4 }}>
                    <Typography sx={{ color:C.txt3, fontSize:'0.52rem', fontWeight:700 }}>50%</Typography>
                    <Typography sx={{ color:aboveMin?C.green:C.red, fontSize:'0.55rem', fontWeight:900 }}>
                      {aboveMin ? '✅ Aceitável' : `❌ Mínimo: ${minPct}% (${formatMoney(minVal)})`}
                    </Typography>
                    <Typography sx={{ color:C.txt3, fontSize:'0.52rem', fontWeight:700 }}>100%</Typography>
                  </Box>
                  <Box sx={{ position:'relative', height:16, mb:1 }}>
                    <Box sx={{ position:'absolute', top:'50%', transform:'translateY(-50%)',
                      left:0, right:0, height:4, bgcolor:C.cardAlt, borderRadius:2, overflow:'hidden' }}>
                      <Box sx={{ height:'100%', width:`${(offerPct-50)*2}%`,
                        bgcolor: aboveMin ? C.green : C.red,
                        transition:'width 0.1s, background-color 0.2s', borderRadius:2 }}/>
                    </Box>
                    <Box sx={{ position:'absolute', top:0, bottom:0,
                      left:`${(minPct-50)*2}%`, width:2,
                      bgcolor:C.red, borderRadius:1, opacity:0.8 }}/>
                    <input type="range" min={50} max={100} value={offerPct}
                      onChange={e=>setOfferPct(Number(e.target.value))}
                      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%',
                        opacity:0, cursor:'pointer', margin:0 }}/>
                  </Box>
                </Box>
              </Box>
              <Box
                onClick={gameData.club.money >= offerVal ? handleNegotiateSubmit : undefined}
                sx={{
                  bgcolor: gameData.club.money >= offerVal ? C.teal : C.cardAlt,
                  borderRadius:'9px', py:1, textAlign:'center', cursor:'pointer',
                  opacity: gameData.club.money < offerVal ? 0.5 : 1,
                  '&:active':{ filter:'brightness(0.85)' },
                }}>
                <Typography sx={{ color: gameData.club.money >= offerVal ? '#000' : C.txt3, fontWeight:900, fontSize:'0.82rem' }}>
                  ENVIAR PROPOSTA
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
        })()}

        {/* ── ABA LIVRES ──────────────────────────────── */}
        {tab==='market' && (
          <>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.8 }}>
              <Box sx={{ display:'flex', gap:0.5, overflowX:'auto', '&::-webkit-scrollbar':{display:'none'} }}>
                {positions.map(pos=>(
                  <Box key={pos} onClick={()=>setFilterPos(pos)} sx={{ flexShrink:0, px:1.4, py:0.5,
                    borderRadius:'20px', cursor:'pointer',
                    bgcolor:filterPos===pos?C.teal:C.card, border:`1.5px solid ${filterPos===pos?C.teal:C.border}` }}>
                    <Typography sx={{ color:filterPos===pos?'#000':C.txt2, fontWeight:900, fontSize:'0.6rem' }}>{pos}</Typography>
                  </Box>
                ))}
              </Box>
              <Box onClick={handleRefreshMarket} sx={{ ml:0.8, flexShrink:0, bgcolor:C.cardAlt,
                border:`1px solid ${C.border}`, borderRadius:'8px', px:1, py:0.5, cursor:'pointer', '&:active':{opacity:0.7} }}>
                <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.6rem' }}>🔄 R$200K</Typography>
              </Box>
            </Box>
            <Box sx={{ display:'flex', gap:0.6, mb:1.2 }}>
              {ovrRanges.map(r=>(
                <Box key={r.label} onClick={()=>setFilterOvr(r.label)} sx={{ flex:1, py:0.5,
                  textAlign:'center', borderRadius:'7px', cursor:'pointer',
                  bgcolor:filterOvr===r.label?C.cardAlt:C.card,
                  border:`1.5px solid ${filterOvr===r.label?C.bord2:C.border}` }}>
                  <Typography sx={{ color:filterOvr===r.label?C.txt1:C.txt3, fontWeight:filterOvr===r.label?900:700, fontSize:'0.6rem' }}>{r.label}</Typography>
                </Box>
              ))}
            </Box>
            {marketPlayers.length===0 && (
              <Typography sx={{ textAlign:'center', color:C.txt3, mt:4, fontStyle:'italic', fontWeight:700 }}>Nenhum jogador encontrado.</Typography>
            )}
            {marketPlayers.map(p => renderPlayerCard(p,'market'))}
          </>
        )}

        {/* ── ABA CLUBES ──────────────────────────────── */}
        {tab==='clubs' && (
          <Box>
            <Box sx={{ display:'flex', mb:1.5, bgcolor:C.cardAlt, borderRadius:'9px', p:0.4, border:`1px solid ${C.border}` }}>
              {['A','B','C','D'].map(s => (
                <Box key={s} onClick={()=>setLeagueFilter(s)} sx={{ flex:1, py:0.8, textAlign:'center', borderRadius:'7px', cursor:'pointer', bgcolor:leagueFilter===s?C.teal:'transparent' }}>
                  <Typography sx={{ color:leagueFilter===s?'#000':C.txt2, fontWeight:900, fontSize:'0.75rem' }}>SÉRIE {s}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(74px,1fr))', gap:1.2, pb:2 }}>
              {displayClubs.map(t=>(
                <Box key={t.id} onClick={()=>setSelectedClubId(t.id)} sx={{ p:1.1, borderRadius:'12px', cursor:'pointer',
                  bgcolor:C.card, border:`1px solid ${C.border}`, display:'flex', flexDirection:'column',
                  alignItems:'center', '&:active':{transform:'scale(0.93)'}, transition:'all 0.12s' }}>
                  <TeamIcon name={t?.name||'?'} size={44}/>
                  <Typography sx={{ color:C.txt1, fontWeight:800, fontSize:'0.58rem', mt:0.7, textAlign:'center',
                    lineHeight:1.1, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {t?.name||'?'}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Dialog open={Boolean(selectedClubId)} onClose={()=>{setSelectedClubId(null);setSelected(null);}}
              fullWidth maxWidth="sm"
              PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.teal}`, maxHeight:'85vh', m:2 } }}
              BackdropProps={{ sx:{ backdropFilter:'blur(4px)', bgcolor:'rgba(0,0,0,0.55)' } }}>
              <Box sx={{ px:1.8, py:1.2, bgcolor:C.teal, display:'flex', justifyContent:'space-between',
                alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                  <TeamIcon name={selectedClub?.name||'?'} size={32}/>
                  <Box>
                    <Typography sx={{ color:'#000', fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{selectedClub?.name||'Clube'}</Typography>
                    <Typography sx={{ color:'rgba(0,0,0,0.6)', fontSize:'0.6rem', fontWeight:700 }}>ELENCO · {cpuRoster.length} jog.</Typography>
                  </Box>
                </Box>
                <Box onClick={()=>{setSelectedClubId(null);setSelected(null);}} sx={{ cursor:'pointer', color:'rgba(0,0,0,0.7)', fontSize:'1.3rem', fontWeight:900 }}>✕</Box>
              </Box>
              <Box sx={{ p:1.4, overflowY:'auto' }}>
                {cpuRoster.length > 0
                  ? cpuRoster.map(p => renderPlayerCard(p,'cpu'))
                  : <Box sx={{ textAlign:'center', py:5 }}>
                      <Typography sx={{ fontSize:'2.5rem', mb:1, opacity:0.4 }}>🚷</Typography>
                      <Typography sx={{ fontWeight:700, color:C.txt2, fontSize:'0.85rem' }}>Elenco indisponível.</Typography>
                    </Box>
                }
              </Box>
            </Dialog>
          </Box>
        )}

        {/* ── ABA VENDAS ──────────────────────────────── */}
        {tab==='sales' && (
          <Box>
            {/* Instrução */}
            <Box sx={{ bgcolor:C.cardAlt, p:1.1, borderRadius:'10px',
              border:`1px dashed ${C.border}`, mb:1.2, textAlign:'center' }}>
              <Typography sx={{ color:C.txt1, fontSize:'0.7rem', fontWeight:900, mb:0.2 }}>GERENCIE SUAS VENDAS</Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:600 }}>
                Expanda um jogador para colocá-lo na lista ou aceitar propostas.
              </Typography>
            </Box>

            {/* FIX #7: Seção — Propostas recebidas */}
            {salesData.withOffer.length > 0 && (
              <Box sx={{ mb:1.2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.6 }}>
                  <Box sx={{ flex:1, height:1, bgcolor:`${C.blue}40` }}/>
                  <Typography sx={{ color:C.blue, fontWeight:900, fontSize:'0.58rem', letterSpacing:0.5 }}>
                    📩 PROPOSTAS RECEBIDAS ({salesData.withOffer.length})
                  </Typography>
                  <Box sx={{ flex:1, height:1, bgcolor:`${C.blue}40` }}/>
                </Box>
                {salesData.withOffer.map(p => renderMyPlayerCard(p))}
              </Box>
            )}

            {/* FIX #7: Seção — À venda */}
            {salesData.listed.length > 0 && (
              <Box sx={{ mb:1.2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.6 }}>
                  <Box sx={{ flex:1, height:1, bgcolor:`${C.orange}40` }}/>
                  <Typography sx={{ color:C.orange, fontWeight:900, fontSize:'0.58rem', letterSpacing:0.5 }}>
                    📋 À VENDA ({salesData.listed.length})
                  </Typography>
                  <Box sx={{ flex:1, height:1, bgcolor:`${C.orange}40` }}/>
                </Box>
                {salesData.listed.map(p => renderMyPlayerCard(p))}
              </Box>
            )}

            {/* FIX #7: Seção — Restante do elenco */}
            {salesData.rest.length > 0 && (
              <Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.6 }}>
                  <Box sx={{ flex:1, height:1, bgcolor:C.border }}/>
                  <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.58rem', letterSpacing:0.5 }}>
                    ELENCO ({salesData.rest.length})
                  </Typography>
                  <Box sx={{ flex:1, height:1, bgcolor:C.border }}/>
                </Box>
                {salesData.rest.map(p => renderMyPlayerCard(p))}
              </Box>
            )}

            {gameData.players.length === 0 && (
              <Typography sx={{ textAlign:'center', color:C.txt3, mt:4, fontStyle:'italic' }}>Sem jogadores no elenco.</Typography>
            )}
          </Box>
        )}

        {/* ── ABA SCOUT ──────────────────────────────── */}
        {tab==='scout' && (() => {
          // Analisa o elenco e recomenda até 5 reforços ideais
          const myPlayers = gameData.players || [];
          const myOvr     = myPlayers.length > 0
            ? Math.round(myPlayers.reduce((s,p) => s + (p.overall||0), 0) / myPlayers.length)
            : 70;

          // Conta posições no elenco
          const posCounts = {};
          myPlayers.forEach(p => { posCounts[p.position] = (posCounts[p.position]||0)+1; });
          const allPos = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'];
          // Posições deficitárias (< 3 jogadores) em ordem de urgência
          const weakPos = allPos.filter(pos => (posCounts[pos]||0) < 3)
            .sort((a,b) => (posCounts[a]||0) - (posCounts[b]||0));

          // Candidatos: mercado livre + elencos de clubes
          const allSources = [
            ...(gameData.market || []),
            ...(gameData.leagues?.A || []).flatMap(t => t.squad || []),
            ...(gameData.leagues?.B || []).flatMap(t => t.squad || []),
          ].filter(p => p && p.id && p.overall);

          // Deduplicar por id
          const seen = new Set(myPlayers.map(p => p.id));
          const candidates = allSources.filter(p => !seen.has(p.id));

          // Pontuar cada candidato: OVR acima da média + posição deficitária + valor acessível
          const budget = gameData.club.money || 0;
          const scored = candidates.map(p => {
            let score = 0;
            const posUrgency = weakPos.indexOf(p.position);
            if (posUrgency === 0) score += 40;
            else if (posUrgency === 1) score += 25;
            else if (posUrgency >= 0) score += 10;
            if (p.overall > myOvr + 5) score += 30;
            else if (p.overall > myOvr) score += 15;
            if (p.age <= 21) score += 20; // jovem promessa
            if ((p.value || 0) <= budget * 0.3) score += 10; // acessível
            return { ...p, _score: score };
          }).filter(p => p._score > 0)
            .sort((a,b) => b._score - a._score)
            .slice(0, 6);

          return (
            <Box>
              {/* Resumo do elenco */}
              <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.2 }}>
                <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.72rem', mb:0.8 }}>📊 ANÁLISE DO ELENCO</Typography>
                <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.6, mb:0.8 }}>
                  {[
                    { l:'OVR MÉDIO', v: myOvr, c: myOvr>=75?C.green:myOvr>=65?C.yellow:C.red },
                    { l:'JOGADORES', v: myPlayers.length, c: myPlayers.length >= 22 ? C.green : C.yellow },
                    { l:'VERBA', v: formatMoney(budget), c: C.teal },
                  ].map((s,i) => (
                    <Box key={i} sx={{ bgcolor:C.card, borderRadius:'7px', p:0.7, textAlign:'center' }}>
                      <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.82rem', lineHeight:1 }}>{s.v}</Typography>
                      <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700, mt:0.2 }}>{s.l}</Typography>
                    </Box>
                  ))}
                </Box>
                {weakPos.length > 0 && (
                  <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap' }}>
                    <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>Posições fracas:</Typography>
                    {weakPos.slice(0,4).map(pos => (
                      <Box key={pos} sx={{ bgcolor:`${C.red}18`, border:`1px solid ${C.red}40`, borderRadius:'5px', px:0.7, py:0.1 }}>
                        <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.58rem' }}>{pos}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:0.8, mb:0.8 }}>
                🔍 RECOMENDAÇÕES DE REFORÇO
              </Typography>

              {scored.length === 0 ? (
                <Box sx={{ textAlign:'center', py:5 }}>
                  <Typography sx={{ fontSize:'2.5rem', mb:1, opacity:0.4 }}>🔭</Typography>
                  <Typography sx={{ color:C.txt2, fontWeight:700, fontSize:'0.82rem' }}>Sem candidatos encontrados.</Typography>
                </Box>
              ) : scored.map(p => {
                const afford   = budget >= (p.value||0);
                const pc       = posColor(p.position);
                const isYoung  = p.age <= 21;
                const expanded = selected?.id === p.id;
                return (
                  <Paper key={p.id} onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{
                    overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
                    border: expanded ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                    bgcolor: expanded ? `${C.teal}08` : C.card,
                    transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' },
                  }}>
                    <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
                      {window.JerseyBadge
                        ? React.createElement(window.JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 40 })
                        : <Box sx={{ width:38, height:38, borderRadius:'50%', flexShrink:0, bgcolor:pc.bg,
                            color:pc.text, display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.62rem', fontWeight:900 }}>{p.position}</Box>
                      }
                      <Box sx={{ flex:1, minWidth:0 }}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                          <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:afford?C.txt1:C.red,
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
                          {isYoung && <Box sx={{ bgcolor:'#7c3aed20', border:'1px solid #7c3aed60', borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                            <Typography sx={{ color:'#7c3aed', fontSize:'0.42rem', fontWeight:900 }}>⭐ JOVEM</Typography>
                          </Box>}
                          {weakPos.includes(p.position) && <Box sx={{ bgcolor:`${C.red}15`, border:`1px solid ${C.red}40`, borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                            <Typography sx={{ color:C.red, fontSize:'0.42rem', fontWeight:900 }}>URGENTE</Typography>
                          </Box>}
                        </Box>
                        <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.1 }}>
                          {p.age} anos · {p.teamName || 'Livre'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign:'right', flexShrink:0 }}>
                        <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2, mb:0.3 }}>
                          <Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography>
                        </Box>
                        <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:afford?C.teal:C.red }}>
                          {formatMoney(p.value||0)}
                        </Typography>
                      </Box>
                    </Box>
                    {expanded && (
                      <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
                        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.5, mb:0.9 }}>
                          {[
                            { l:'ENERGIA', v:`${p.energy??100}%`, c:(p.energy??100)>=70?C.green:(p.energy??100)>=50?C.yellow:C.red },
                            { l:'SALÁRIO', v:formatMoney(p.wage||0), c:C.txt2 },
                            { l:'CONTRATO', v:`${p.contract??2} ano(s)`, c:(p.contract??2)<=1?C.red:C.txt2 },
                          ].map((s,i) => (
                            <Box key={i} sx={{ bgcolor:C.cardAlt, borderRadius:'6px', px:0.6, py:0.45, textAlign:'center' }}>
                              <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{s.v}</Typography>
                              <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, mt:0.1 }}>{s.l}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Box onClick={e => { e.stopPropagation(); if(afford) { handleCPUTransfer(p, p.value||0); setSelected(null); } }}
                          sx={{ bgcolor:afford?C.teal:C.cardAlt, borderRadius:'8px', py:0.85,
                            textAlign:'center', cursor:afford?'pointer':'not-allowed', opacity:afford?1:0.5 }}>
                          <Typography sx={{ color:afford?'#000':C.txt3, fontWeight:900, fontSize:'0.76rem' }}>
                            {afford ? `💰 CONTRATAR — ${formatMoney(p.value||0)}` : 'SEM VERBA'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          );
        })()}

        {/* ── ABA FAVORITOS ⭐ ── */}
        {tab==='watch' && (
          <Box>
            {watchlist.length === 0 ? (
              <Box sx={{ textAlign:'center', py:8 }}>
                <Typography sx={{ fontSize:'3rem', mb:1.5, opacity:0.3 }}>☆</Typography>
                <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.88rem', mb:0.5 }}>
                  Nenhum favorito ainda
                </Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.7rem', fontWeight:700 }}>
                  Toque em ☆ nos cards dos jogadores para acompanhá-los
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.2 }}>
                  <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:1 }}>
                    {watchlist.length} JOGADOR{watchlist.length > 1 ? 'ES' : ''} MONITORADO{watchlist.length > 1 ? 'S' : ''}
                  </Typography>
                  <Box onClick={() => setGameData(prev => ({ ...prev, watchlist: [] }))}
                    sx={{ cursor:'pointer', color:C.txt3, fontSize:'0.58rem', fontWeight:700,
                      '&:active':{ opacity:0.6 } }}>
                    Limpar tudo
                  </Box>
                </Box>
                {watchlist.map(w => {
                  const pc      = posColor(w.position);
                  const afford  = gameData.club.money >= (w.value || 0);
                  const isOwned = (gameData.players || []).some(p => p.id === w.id);
                  // Tenta encontrar o jogador atualizado no mercado / elencos
                  const live = [
                    ...(gameData.market || []),
                    ...(gameData.leagues?.A || []).flatMap(t => t.squad || []),
                    ...(gameData.leagues?.B || []).flatMap(t => t.squad || []),
                    ...(gameData.leagues?.C || []).flatMap(t => t.squad || []),
                    ...(gameData.players || []),
                  ].find(p => p?.id === w.id);

                  return (
                    <Paper key={w.id} elevation={0} sx={{
                      overflow:'hidden', borderRadius:'12px', mb:0.8,
                      border: `1px solid ${isOwned ? `${C.green}50` : `${C.gold}30`}`,
                      bgcolor: isOwned ? `${C.green}06` : `${C.gold}04`,
                    }}>
                      <Box sx={{ px:1.3, py:0.9, display:'flex', alignItems:'center', gap:1 }}>
                        {/* Camisa */}
                        {window.JerseyBadge
                          ? React.createElement(window.JerseyBadge, { pos: w.position, num: '?', size: 40 })
                          : <Box sx={{ width:38, height:38, borderRadius:'50%', flexShrink:0, bgcolor:pc.bg,
                              color:pc.text, display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'0.62rem', fontWeight:900 }}>{w.position}</Box>
                        }
                        {/* Nome + info */}
                        <Box sx={{ flex:1, minWidth:0 }}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.1 }}>
                            <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1,
                              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{w.name}</Typography>
                            {isOwned && (
                              <Box sx={{ bgcolor:`${C.green}25`, border:`1px solid ${C.green}50`,
                                borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                                <Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.green }}>NO ELENCO</Typography>
                              </Box>
                            )}
                          </Box>
                          <Typography sx={{ color:C.txt3, fontSize:'0.56rem', fontWeight:700 }}>
                            {w.age}a · {live?.teamName || w.teamName}
                            {live && live.overall !== w.overall && (
                              <span style={{ color: live.overall > w.overall ? C.green : C.red, marginLeft:6 }}>
                                OVR {live.overall > w.overall ? '↑' : '↓'}{live.overall}
                              </span>
                            )}
                          </Typography>
                        </Box>
                        {/* OVR + valor + remover */}
                        <Box sx={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.3, flexShrink:0 }}>
                          <Box sx={{ bgcolor:ovrColor(live?.overall ?? w.overall), borderRadius:'6px', px:0.8, py:0.15 }}>
                            <Typography sx={{ fontWeight:900, fontSize:'0.78rem', color:'#000' }}>
                              {live?.overall ?? w.overall}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontWeight:900, fontSize:'0.65rem', color: afford ? C.teal : C.red }}>
                            {formatMoney(live?.value ?? w.value)}
                          </Typography>
                        </Box>
                        {/* Remover dos favoritos */}
                        <Box onClick={e => toggleWatchlist(w, e)} sx={{
                          flexShrink:0, width:26, height:26, borderRadius:'50%',
                          bgcolor:`${C.gold}20`, border:`1px solid ${C.gold}50`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', ml:0.5, '&:active':{ transform:'scale(0.85)' },
                        }}>
                          <Typography sx={{ fontSize:'0.7rem', lineHeight:1 }}>⭐</Typography>
                        </Box>
                      </Box>
                      {/* Botão comprar se disponível no mercado e não é do elenco */}
                      {!isOwned && live && afford && (
                        <Box onClick={() => { handleCPUTransfer(live, live.value || w.value); }}
                          sx={{ borderTop:`1px solid ${C.border}`, px:1.3, py:0.7, textAlign:'center',
                            cursor:'pointer', bgcolor:`${C.teal}06`,
                            '&:active':{ opacity:0.7 } }}>
                          <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'0.72rem' }}>
                            💰 CONTRATAR — {formatMoney(live.value || w.value)}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </>
            )}
          </Box>
        )}

      </Box>
    </Box>
  );
};

export default ScreenMarket;
