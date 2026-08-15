import React from 'react';
import { Box, Dialog, Paper, Typography } from '@mui/material';
import { getNegotiationPreview, getWatchlistPlayerState } from '../../engines/market/marketService.js';
import { CpuAI } from '../../engines/engine_cpu_ai.js';
import { JerseyBadge } from '../../helpers.js';

export function TransferMarketHeader({ gameData, formatMoney, tab, setTab, salesCount, watchCount, C }) {
  const windowInfo = CpuAI.getTransferWindowInfo?.(gameData.round || 0) || null;
  const tabs = [
    { id: 'market', label: 'LIVRES' },
    { id: 'clubs', label: 'CLUBES' },
    { id: 'scout', label: 'SCOUT' },
    { id: 'sales', label: 'VENDAS' },
    { id: 'watch', label: '⭐' },
  ];

  return (
    <Box sx={{ background:`linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,
      borderBottom:`1px solid ${C.border}`, px:1.5, pt:3.8, pb:1.3, position:'relative', overflow:'hidden' }}>
      <Typography sx={{ position:'absolute', right:-8, top:-5, fontSize:'6rem', opacity:0.04, lineHeight:1, pointerEvents:'none' }}>🤝</Typography>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.2 }}>
        <Box sx={{ width:44, height:44, borderRadius:'10px', flexShrink:0, bgcolor:`${C.blue}15`, border:`1.5px solid ${C.blue}40`,
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
          <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.88rem', lineHeight:1.2 }}>{formatMoney(gameData.club.money)}</Typography>
        </Box>
        <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'8px', px:1, py:0.7 }}>
          <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700, letterSpacing:0.5 }}>FOLHA ({gameData.players.length} jog.)</Typography>
          <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.88rem', lineHeight:1.2 }}>
            {formatMoney(gameData.players.reduce((sum, player) => sum + (player.wage || 0), 0))}/rod
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display:'flex', gap:0.6 }}>
        {tabs.map(item => (
          <Box key={item.id} onClick={() => setTab(item.id)} sx={{
            flex:1, py:0.7, borderRadius:'8px', textAlign:'center', cursor:'pointer',
            bgcolor: tab === item.id ? (item.id === 'watch' ? C.gold : C.teal) : C.cardAlt,
            border:`1px solid ${tab === item.id ? (item.id === 'watch' ? C.gold : C.teal) : C.border}`,
            transition:'all 0.15s', position:'relative',
          }}>
            <Typography sx={{ color:tab === item.id ? '#000' : C.txt2, fontWeight:900, fontSize:'0.68rem' }}>
              {item.label}
              {item.id === 'sales' && salesCount > 0 && (
                <Typography component="span" sx={{ ml:0.5, bgcolor:C.blue, color:'#fff', fontSize:'0.42rem', fontWeight:900, borderRadius:'10px', px:0.5, py:0.1 }}>
                  {salesCount}
                </Typography>
              )}
              {item.id === 'watch' && watchCount > 0 && (
                <Typography component="span" sx={{ ml:0.3, bgcolor:C.gold, color:'#000', fontSize:'0.42rem', fontWeight:900, borderRadius:'10px', px:0.4, py:0.1 }}>
                  {watchCount}
                </Typography>
              )}
            </Typography>
          </Box>
        ))}
      </Box>

      {windowInfo && (
        <Box sx={{ mt:0.8, bgcolor:windowInfo.open ? 'rgba(34,197,94,0.08)' : `${C.red}08`,
          border:`1px solid ${windowInfo.open ? `${C.green}40` : `${C.red}30`}`, borderRadius:'8px', px:1.2, py:0.6,
          display:'flex', alignItems:'center', gap:0.8 }}>
          <Typography sx={{ fontSize:'0.8rem' }}>{windowInfo.open ? '🟢' : '🔴'}</Typography>
          <Box sx={{ flex:1 }}>
            <Typography sx={{ color:windowInfo.open ? C.green : C.red, fontWeight:900, fontSize:'0.65rem' }}>
              {windowInfo.open ? `JANELA ABERTA — ${windowInfo.label}` : 'JANELA FECHADA'}
            </Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>
              {windowInfo.open ? `Fecha em ${windowInfo.closesIn} rodada(s)` : `${windowInfo.label} abre em ${windowInfo.opensIn} rodada(s)`}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export function NegotiationPanel({ negotiating, gameData, offerPct, setOfferPct, setNegotiating, onSubmit, formatMoney, ovrColor, C }) {
  if (!negotiating) return null;
  const preview = getNegotiationPreview(gameData, negotiating.player, offerPct);
  if (!preview) return null;
  const { player, minPct, offerVal, minVal, aboveMin } = preview;
  const canAfford = gameData.club.money >= offerVal;

  return (
    <Paper sx={{ mb:1.5, border:`1.5px solid ${C.teal}`, borderRadius:'12px', overflow:'hidden' }}>
      <Box sx={{ bgcolor:C.teal, px:1.8, py:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.82rem' }}>🤝 NEGOCIAR PROPOSTA</Typography>
        <Box onClick={() => setNegotiating(null)} sx={{ cursor:'pointer', color:'rgba(0,0,0,0.6)', fontSize:'1.1rem', fontWeight:900 }}>✕</Box>
      </Box>
      <Box sx={{ p:1.5, bgcolor:C.bg }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.2 }}>
          <Box>
            <Typography sx={{ fontWeight:900, color:C.txt1, fontSize:'0.95rem' }}>{player.name}</Typography>
            <Typography sx={{ fontSize:'0.65rem', color:C.txt3, fontWeight:700 }}>{player.teamName || 'Livre'}</Typography>
          </Box>
          <Box sx={{ bgcolor:ovrColor(player.overall), borderRadius:'8px', px:1, py:0.4 }}>
            <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.95rem' }}>{player.overall}</Typography>
          </Box>
        </Box>
        <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.2 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.6 }}>
            <Typography sx={{ color:C.txt2, fontSize:'0.68rem', fontWeight:700 }}>Valor de mercado:</Typography>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.75rem' }}>{formatMoney(player.value)}</Typography>
          </Box>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
            <Typography sx={{ color:C.txt2, fontSize:'0.68rem', fontWeight:900 }}>Sua oferta ({offerPct}%):</Typography>
            <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'0.95rem' }}>{formatMoney(offerVal)}</Typography>
          </Box>
          <Box>
            <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.4 }}>
              <Typography sx={{ color:C.txt3, fontSize:'0.52rem', fontWeight:700 }}>50%</Typography>
              <Typography sx={{ color:aboveMin ? C.green : C.red, fontSize:'0.55rem', fontWeight:900 }}>
                {aboveMin ? '✅ Aceitável' : `❌ Mínimo: ${minPct}% (${formatMoney(minVal)})`}
              </Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.52rem', fontWeight:700 }}>100%</Typography>
            </Box>
            <Box sx={{ position:'relative', height:16, mb:1 }}>
              <Box sx={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:0, right:0, height:4, bgcolor:C.cardAlt, borderRadius:2, overflow:'hidden' }}>
                <Box sx={{ height:'100%', width:`${(offerPct - 50) * 2}%`, bgcolor:aboveMin ? C.green : C.red,
                  transition:'width 0.1s, background-color 0.2s', borderRadius:2 }}/>
              </Box>
              <Box sx={{ position:'absolute', top:0, bottom:0, left:`${(minPct - 50) * 2}%`, width:2, bgcolor:C.red, borderRadius:1, opacity:0.8 }}/>
              <input type="range" min={50} max={100} value={offerPct} onChange={event => setOfferPct(Number(event.target.value))}
                style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer', margin:0 }}/>
            </Box>
          </Box>
        </Box>
        <Box onClick={canAfford ? onSubmit : undefined} sx={{ bgcolor:canAfford ? C.teal : C.cardAlt, borderRadius:'9px', py:1,
          textAlign:'center', cursor:'pointer', opacity:canAfford ? 1 : 0.5, '&:active':{ filter:'brightness(0.85)' } }}>
          <Typography sx={{ color:canAfford ? '#000' : C.txt3, fontWeight:900, fontSize:'0.82rem' }}>ENVIAR PROPOSTA</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export function FreeMarketTab({ positions, filterPos, setFilterPos, ovrRanges, filterOvr, setFilterOvr, marketPlayers, onRefresh, renderPlayerCard, C }) {
  return (
    <>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.8 }}>
        <Box sx={{ display:'flex', gap:0.5, overflowX:'auto', '&::-webkit-scrollbar':{display:'none'} }}>
          {positions.map(position => (
            <Box key={position} onClick={() => setFilterPos(position)} sx={{ flexShrink:0, px:1.4, py:0.5, borderRadius:'20px', cursor:'pointer',
              bgcolor:filterPos === position ? C.teal : C.card, border:`1.5px solid ${filterPos === position ? C.teal : C.border}` }}>
              <Typography sx={{ color:filterPos === position ? '#000' : C.txt2, fontWeight:900, fontSize:'0.6rem' }}>{position}</Typography>
            </Box>
          ))}
        </Box>
        <Box onClick={onRefresh} sx={{ ml:0.8, flexShrink:0, bgcolor:C.cardAlt, border:`1px solid ${C.border}`,
          borderRadius:'8px', px:1, py:0.5, cursor:'pointer', '&:active':{opacity:0.7} }}>
          <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.6rem' }}>🔄 R$200K</Typography>
        </Box>
      </Box>
      <Box sx={{ display:'flex', gap:0.6, mb:1.2 }}>
        {ovrRanges.map(range => (
          <Box key={range.label} onClick={() => setFilterOvr(range.label)} sx={{ flex:1, py:0.5, textAlign:'center', borderRadius:'7px', cursor:'pointer',
            bgcolor:filterOvr === range.label ? C.cardAlt : C.card, border:`1.5px solid ${filterOvr === range.label ? C.bord2 : C.border}` }}>
            <Typography sx={{ color:filterOvr === range.label ? C.txt1 : C.txt3, fontWeight:filterOvr === range.label ? 900 : 700, fontSize:'0.6rem' }}>
              {range.label}
            </Typography>
          </Box>
        ))}
      </Box>
      {marketPlayers.length === 0 && (
        <Typography sx={{ textAlign:'center', color:C.txt3, mt:4, fontStyle:'italic', fontWeight:700 }}>Nenhum jogador encontrado.</Typography>
      )}
      {marketPlayers.map(renderPlayerCard)}
    </>
  );
}

export function ClubsMarketTab({ leagueFilter, setLeagueFilter, displayClubs, selectedClubId, setSelectedClubId, selectedClub, cpuRoster, TeamIcon, renderPlayerCard, setSelected, C }) {
  return (
    <Box>
      <Box sx={{ display:'flex', mb:1.5, bgcolor:C.cardAlt, borderRadius:'9px', p:0.4, border:`1px solid ${C.border}` }}>
        {['A','B','C','D'].map(serie => (
          <Box key={serie} onClick={() => setLeagueFilter(serie)} sx={{ flex:1, py:0.8, textAlign:'center', borderRadius:'7px', cursor:'pointer', bgcolor:leagueFilter === serie ? C.teal : 'transparent' }}>
            <Typography sx={{ color:leagueFilter === serie ? '#000' : C.txt2, fontWeight:900, fontSize:'0.75rem' }}>SÉRIE {serie}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(74px,1fr))', gap:1.2, pb:2 }}>
        {displayClubs.map(team => (
          <Box key={team.id} onClick={() => setSelectedClubId(team.id)} sx={{ p:1.1, borderRadius:'12px', cursor:'pointer', bgcolor:C.card,
            border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', '&:active':{transform:'scale(0.93)'}, transition:'all 0.12s' }}>
            <TeamIcon name={team?.name || '?'} size={44}/>
            <Typography sx={{ color:C.txt1, fontWeight:800, fontSize:'0.58rem', mt:0.7, textAlign:'center', lineHeight:1.1,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{team?.name || '?'}</Typography>
          </Box>
        ))}
      </Box>

      <Dialog open={Boolean(selectedClubId)} onClose={() => { setSelectedClubId(null); setSelected(null); }} fullWidth maxWidth="sm"
        PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.teal}`, maxHeight:'85vh', m:2 } }}
        BackdropProps={{ sx:{ backdropFilter:'blur(4px)', bgcolor:'rgba(0,0,0,0.55)' } }}>
        <Box sx={{ px:1.8, py:1.2, bgcolor:C.teal, display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
            <TeamIcon name={selectedClub?.name || '?'} size={32}/>
            <Box>
              <Typography sx={{ color:'#000', fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{selectedClub?.name || 'Clube'}</Typography>
              <Typography sx={{ color:'rgba(0,0,0,0.6)', fontSize:'0.6rem', fontWeight:700 }}>ELENCO · {cpuRoster.length} jog.</Typography>
            </Box>
          </Box>
          <Box onClick={() => { setSelectedClubId(null); setSelected(null); }} sx={{ cursor:'pointer', color:'rgba(0,0,0,0.7)', fontSize:'1.3rem', fontWeight:900 }}>✕</Box>
        </Box>
        <Box sx={{ p:1.4, overflowY:'auto' }}>
          {cpuRoster.length > 0 ? cpuRoster.map(renderPlayerCard) : (
            <Box sx={{ textAlign:'center', py:5 }}>
              <Typography sx={{ fontSize:'2.5rem', mb:1, opacity:0.4 }}>🚷</Typography>
              <Typography sx={{ fontWeight:700, color:C.txt2, fontSize:'0.85rem' }}>Elenco indisponível.</Typography>
            </Box>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}

function SalesSectionTitle({ textColor, lineColor, children }) {
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.6 }}>
      <Box sx={{ flex:1, height:1, bgcolor:lineColor }}/>
      <Typography sx={{ color:textColor, fontWeight:900, fontSize:'0.58rem', letterSpacing:0.5 }}>{children}</Typography>
      <Box sx={{ flex:1, height:1, bgcolor:lineColor }}/>
    </Box>
  );
}

export function SalesMarketTab({ salesData, playerCount, renderMyPlayerCard, C }) {
  return (
    <Box>
      <Box sx={{ bgcolor:C.cardAlt, p:1.1, borderRadius:'10px', border:`1px dashed ${C.border}`, mb:1.2, textAlign:'center' }}>
        <Typography sx={{ color:C.txt1, fontSize:'0.7rem', fontWeight:900, mb:0.2 }}>GERENCIE SUAS VENDAS</Typography>
        <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:600 }}>Expanda um jogador para colocá-lo na lista ou aceitar propostas.</Typography>
      </Box>

      {salesData.withOffer.length > 0 && (
        <Box sx={{ mb:1.2 }}>
          <SalesSectionTitle textColor={C.blue} lineColor={`${C.blue}40`}>📩 PROPOSTAS RECEBIDAS ({salesData.withOffer.length})</SalesSectionTitle>
          {salesData.withOffer.map(renderMyPlayerCard)}
        </Box>
      )}
      {salesData.listed.length > 0 && (
        <Box sx={{ mb:1.2 }}>
          <SalesSectionTitle textColor={C.orange} lineColor={`${C.orange}40`}>📋 À VENDA ({salesData.listed.length})</SalesSectionTitle>
          {salesData.listed.map(renderMyPlayerCard)}
        </Box>
      )}
      {salesData.rest.length > 0 && (
        <Box>
          <SalesSectionTitle textColor={C.txt3} lineColor={C.border}>ELENCO ({salesData.rest.length})</SalesSectionTitle>
          {salesData.rest.map(renderMyPlayerCard)}
        </Box>
      )}
      {playerCount === 0 && <Typography sx={{ textAlign:'center', color:C.txt3, mt:4, fontStyle:'italic' }}>Sem jogadores no elenco.</Typography>}
    </Box>
  );
}

export function ScoutMarketTab({ scoutData, selected, setSelected, onBuy, formatMoney, posColor, ovrColor, C }) {
  const { myOvr, myPlayersCount, budget, weakPos, recommendations } = scoutData;
  return (
    <Box>
      <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.2 }}>
        <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.72rem', mb:0.8 }}>📊 ANÁLISE DO ELENCO</Typography>
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.6, mb:0.8 }}>
          {[
            { l:'OVR MÉDIO', v:myOvr, c:myOvr >= 75 ? C.green : myOvr >= 65 ? C.yellow : C.red },
            { l:'JOGADORES', v:myPlayersCount, c:myPlayersCount >= 22 ? C.green : C.yellow },
            { l:'VERBA', v:formatMoney(budget), c:C.teal },
          ].map((stat, index) => (
            <Box key={index} sx={{ bgcolor:C.card, borderRadius:'7px', p:0.7, textAlign:'center' }}>
              <Typography sx={{ color:stat.c, fontWeight:900, fontSize:'0.82rem', lineHeight:1 }}>{stat.v}</Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700, mt:0.2 }}>{stat.l}</Typography>
            </Box>
          ))}
        </Box>
        {weakPos.length > 0 && (
          <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap' }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>Posições fracas:</Typography>
            {weakPos.slice(0,4).map(position => (
              <Box key={position} sx={{ bgcolor:`${C.red}18`, border:`1px solid ${C.red}40`, borderRadius:'5px', px:0.7, py:0.1 }}>
                <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.58rem' }}>{position}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:0.8, mb:0.8 }}>🔍 RECOMENDAÇÕES DE REFORÇO</Typography>
      {recommendations.length === 0 ? (
        <Box sx={{ textAlign:'center', py:5 }}>
          <Typography sx={{ fontSize:'2.5rem', mb:1, opacity:0.4 }}>🔭</Typography>
          <Typography sx={{ color:C.txt2, fontWeight:700, fontSize:'0.82rem' }}>Sem candidatos encontrados.</Typography>
        </Box>
      ) : recommendations.map(player => {
        const afford = budget >= (player.value || 0);
        const pc = posColor(player.position);
        const isYoung = player.age <= 21;
        const expanded = selected?.id === player.id;
        return (
          <Paper key={player.id} onClick={() => setSelected(expanded ? null : player)} elevation={0} sx={{ overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
            border:expanded ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`, bgcolor:expanded ? `${C.teal}08` : C.card,
            transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' } }}>
            <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
              {JerseyBadge ? React.createElement(JerseyBadge, { pos:player.position, num:player.shirt ?? '?', size:40 }) : (
                <Box sx={{ width:38, height:38, borderRadius:'50%', flexShrink:0, bgcolor:pc.bg, color:pc.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900 }}>
                  {player.position}
                </Box>
              )}
              <Box sx={{ flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                  <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:afford ? C.txt1 : C.red, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.name}</Typography>
                  {isYoung && <Box sx={{ bgcolor:'#7c3aed20', border:'1px solid #7c3aed60', borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}><Typography sx={{ color:'#7c3aed', fontSize:'0.42rem', fontWeight:900 }}>⭐ JOVEM</Typography></Box>}
                  {weakPos.includes(player.position) && <Box sx={{ bgcolor:`${C.red}15`, border:`1px solid ${C.red}40`, borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}><Typography sx={{ color:C.red, fontSize:'0.42rem', fontWeight:900 }}>URGENTE</Typography></Box>}
                </Box>
                <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.1 }}>{player.age} anos · {player.teamName || 'Livre'}</Typography>
              </Box>
              <Box sx={{ textAlign:'right', flexShrink:0 }}>
                <Box sx={{ bgcolor:ovrColor(player.overall), borderRadius:'6px', px:0.9, py:0.2, mb:0.3 }}><Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{player.overall}</Typography></Box>
                <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:afford ? C.teal : C.red }}>{formatMoney(player.value || 0)}</Typography>
              </Box>
            </Box>
            {expanded && (
              <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
                <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.5, mb:0.9 }}>
                  {[
                    { l:'ENERGIA', v:`${player.energy ?? 100}%`, c:(player.energy ?? 100) >= 70 ? C.green : (player.energy ?? 100) >= 50 ? C.yellow : C.red },
                    { l:'SALÁRIO', v:formatMoney(player.wage || 0), c:C.txt2 },
                    { l:'CONTRATO', v:`${player.contract ?? 2} ano(s)`, c:(player.contract ?? 2) <= 1 ? C.red : C.txt2 },
                  ].map((stat, index) => (
                    <Box key={index} sx={{ bgcolor:C.cardAlt, borderRadius:'6px', px:0.6, py:0.45, textAlign:'center' }}>
                      <Typography sx={{ color:stat.c, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{stat.v}</Typography>
                      <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, mt:0.1 }}>{stat.l}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box onClick={event => { event.stopPropagation(); if (afford) { onBuy(player, player.value || 0); setSelected(null); } }}
                  sx={{ bgcolor:afford ? C.teal : C.cardAlt, borderRadius:'8px', py:0.85, textAlign:'center', cursor:afford ? 'pointer' : 'not-allowed', opacity:afford ? 1 : 0.5 }}>
                  <Typography sx={{ color:afford ? '#000' : C.txt3, fontWeight:900, fontSize:'0.76rem' }}>{afford ? `💰 CONTRATAR — ${formatMoney(player.value || 0)}` : 'SEM VERBA'}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}

export function WatchlistMarketTab({ watchlist, gameData, setGameData, onBuy, toggleWatchlist, formatMoney, posColor, ovrColor, C }) {
  if (watchlist.length === 0) {
    return (
      <Box sx={{ textAlign:'center', py:8 }}>
        <Typography sx={{ fontSize:'3rem', mb:1.5, opacity:0.3 }}>☆</Typography>
        <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.88rem', mb:0.5 }}>Nenhum favorito ainda</Typography>
        <Typography sx={{ color:C.txt3, fontSize:'0.7rem', fontWeight:700 }}>Toque em ☆ nos cards dos jogadores para acompanhá-los</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.2 }}>
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:1 }}>
          {watchlist.length} JOGADOR{watchlist.length > 1 ? 'ES' : ''} MONITORADO{watchlist.length > 1 ? 'S' : ''}
        </Typography>
        <Box onClick={() => setGameData(prev => ({ ...prev, watchlist: [] }))} sx={{ cursor:'pointer', color:C.txt3, fontSize:'0.58rem', fontWeight:700, '&:active':{ opacity:0.6 } }}>
          Limpar tudo
        </Box>
      </Box>
      {watchlist.map(item => {
        const { live, isOwned, afford } = getWatchlistPlayerState(gameData, item);
        const pc = posColor(item.position);
        return (
          <Paper key={item.id} elevation={0} sx={{ overflow:'hidden', borderRadius:'12px', mb:0.8,
            border:`1px solid ${isOwned ? `${C.green}50` : `${C.gold}30`}`, bgcolor:isOwned ? `${C.green}06` : `${C.gold}04` }}>
            <Box sx={{ px:1.3, py:0.9, display:'flex', alignItems:'center', gap:1 }}>
              {JerseyBadge ? React.createElement(JerseyBadge, { pos:item.position, num:'?', size:40 }) : (
                <Box sx={{ width:38, height:38, borderRadius:'50%', flexShrink:0, bgcolor:pc.bg, color:pc.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900 }}>{item.position}</Box>
              )}
              <Box sx={{ flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.1 }}>
                  <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</Typography>
                  {isOwned && <Box sx={{ bgcolor:`${C.green}25`, border:`1px solid ${C.green}50`, borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}><Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.green }}>NO ELENCO</Typography></Box>}
                </Box>
                <Typography sx={{ color:C.txt3, fontSize:'0.56rem', fontWeight:700 }}>
                  {item.age}a · {live?.teamName || item.teamName}
                  {live && live.overall !== item.overall && <span style={{ color:live.overall > item.overall ? C.green : C.red, marginLeft:6 }}>OVR {live.overall > item.overall ? '↑' : '↓'}{live.overall}</span>}
                </Typography>
              </Box>
              <Box sx={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.3, flexShrink:0 }}>
                <Box sx={{ bgcolor:ovrColor(live?.overall ?? item.overall), borderRadius:'6px', px:0.8, py:0.15 }}>
                  <Typography sx={{ fontWeight:900, fontSize:'0.78rem', color:'#000' }}>{live?.overall ?? item.overall}</Typography>
                </Box>
                <Typography sx={{ fontWeight:900, fontSize:'0.65rem', color:afford ? C.teal : C.red }}>{formatMoney(live?.value ?? item.value)}</Typography>
              </Box>
              <Box onClick={event => toggleWatchlist(item, event)} sx={{ flexShrink:0, width:26, height:26, borderRadius:'50%', bgcolor:`${C.gold}20`,
                border:`1px solid ${C.gold}50`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', ml:0.5, '&:active':{ transform:'scale(0.85)' } }}>
                <Typography sx={{ fontSize:'0.7rem', lineHeight:1 }}>⭐</Typography>
              </Box>
            </Box>
            {!isOwned && live && afford && (
              <Box onClick={() => onBuy(live, live.value || item.value)} sx={{ borderTop:`1px solid ${C.border}`, px:1.3, py:0.7, textAlign:'center', cursor:'pointer', bgcolor:`${C.teal}06`, '&:active':{ opacity:0.7 } }}>
                <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'0.72rem' }}>💰 CONTRATAR — {formatMoney(live.value || item.value)}</Typography>
              </Box>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
