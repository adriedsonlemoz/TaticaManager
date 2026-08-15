// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Dialog } from '@mui/material';
import { THEME, pergaminhoTheme } from './theme.js';

// Hooks
import usePersistence from './hooks/hooks_persistence.js';
import useMatchSimulation from './hooks/hooks_simulation.js';
import useSquad from './hooks/hooks_squad.js';

import { FORMATION_SLOTS } from './helpers.js';

// Engines
import { DisciplineEngine } from './engines/engine_discipline.js';
import { FinanceEngine } from './engines/engine_finances.js';
import { CupsEngine } from './engines/cups_engine.js';
import { CalendarEngine } from './engines/CalendarEngine.js';
import { CpuAI } from './engines/engine_cpu_ai.js';
import { generateNextSeason, sortLeagueTable } from './engines/engine.js';

// Data
import { TeamIcon } from './data/database_branding.js';

// Components
import ErrorBoundary from './components/ErrorBoundary.jsx';
import BottomNav from './components/BottomNav.jsx';
import MenuPrincipal from './components/MenuPrincipal.jsx';
import PlayerModal from './components/PlayerModal.jsx';
import ScreenBoot from './components/ScreenBoot.jsx';
import ScreenSetup from './components/ScreenSetup.jsx';
import ScreenLineup from './components/ScreenLineup.jsx';
import ScreenSquad from './components/ScreenSquad.jsx';
import ScreenTable from './components/ScreenTable.jsx';
import ScreenMatches from './components/ScreenMatches.jsx';
import ScreenCareer from './components/ScreenCareer.jsx';
import ScreenMarket from './components/ScreenMarket.jsx';
import ScreenStadium from './components/ScreenStadium.jsx';
import ScreenFinances from './components/ScreenFinances.jsx';
import ScreenAbout from './components/ScreenAbout.jsx';
import ScreenNextMatch from './components/ScreenNextMatch.jsx';
import ScreenMatchResult from './components/ScreenMatchResult.jsx';
import ScreenMedical from './components/ScreenMedical.jsx';
import ScreenCopas from './components/ScreenCopas.jsx';
import ScreenInbox from './components/ScreenInbox.jsx';
import ScreenAcademy from './components/ScreenAcademy.jsx';
import ScreenGameOver from './components/ScreenGameOver.jsx';

// app.js — Controlador Principal v4.0 (Sistema de Transferências Realista e Anti-Crash)
// ══════════════════════════════════════════════════════════
// TELA DE FIM DE TEMPORADA — v2.0 (Rica com stats completas)
import ScreenSeasonEnd from './components/ScreenSeasonEnd.jsx';

const Game = () => {
  const [screen, setScreen] = React.useState('boot');
  const [gameData, setGameData] = React.useState(null);
  const [setupData, setSetupData] = React.useState({ saveName: '', teamName: '', managerName: '', serie: 'A', managerAge: 40, managerNationality: 'Brasileiro', managerFormation: '4-4-2', managerStyle: 'Equilibrado', colorPrimary: '#22c55e', colorSecondary: '#ffffff' });
  const [lineupDialog, setLineupDialog] = React.useState({ open: false, n: 0 });
  const [isDirtyLineup, setIsDirtyLineup] = React.useState(false);
  const [deleteSaveModal, setDeleteSaveModal] = React.useState(null);
  const [dirtyNavTarget, setDirtyNavTarget] = React.useState(null); // alvo pendente ao sair de lineup com alterações
  
  const [toast, setToast] = React.useState({ open: false, message: '', severity: 'success' });
  const [playerModalData, setPlayerModalData] = React.useState(null); 
  const prevRoundRef = React.useRef(null);

  const showToast = React.useCallback((m, s = 'success', detail = '') => {
    setToast({ open: true, message: m, severity: s, detail });
    const delay = detail ? 4000 : 2500; // more time when there's a subtitle to read
    setTimeout(() => setToast(prev => prev.message === m ? { ...prev, open: false } : prev), delay);
  }, []);

  const formatMoney = React.useCallback((val) => `R$ ${Number(val || 0).toLocaleString('pt-BR')}`, []);

  const persistence = usePersistence(showToast);
  const simulation  = useMatchSimulation(gameData, setGameData, setScreen, showToast, setLineupDialog);
  const squad       = useSquad(gameData, setGameData, showToast, formatMoney);

  // FIX 6.1: garante que a simulacao e interrompida se o componente Game for desmontado.
  // Sem isso, o setInterval do match engine continua rodando apos logout/reset de save,
  // chamando setGameData em componente ja desmontado e causando memory leak.
  React.useEffect(() => {
    return () => {
      simulation.matchControlsRef?.current?.forceEnd?.();
    };
  }, []);

  const handleNav = (target) => {
    // Bloqueia navegação durante partida EXCETO para 'home'
    if (screen === 'match_result' && target !== 'home') return;
    // Ao sair de match_result, encerra qualquer simulação em andamento
    if (screen === 'match_result') {
      simulation.matchControlsRef?.current?.forceEnd?.();
    }
    // Na tela de fim de temporada, só permite ir para home ou table
    if (screen === 'season_end' && !['home','table'].includes(target)) return;
    if (isDirtyLineup && screen === 'lineup') {
      setDirtyNavTarget(target);
      return;
    }
    setScreen(target);
  };

  // 🌟 MOTOR CENTRAL ATUALIZADO (Propostas apenas para listados na aba Vendas)
  React.useEffect(() => {
    if (!gameData) return;
    if (prevRoundRef.current !== null && gameData.round > prevRoundRef.current) {
      setGameData(prev => {
        let hasBenched = false;
        
        // 1. AUTO-BENCHER: Varredura de Suspensos e Lesionados após a rodada
        const updatedPlayers = prev.players.map(p => {
          if (p.isStarting) {
            const isSusp = DisciplineEngine ? DisciplineEngine.isPlayerSuspended(p, prev.round + 1) : (p.discipline?.suspendedUntilRound !== null && (prev.round + 1) <= p.discipline?.suspendedUntilRound);
            if (isSusp || p.injury) { hasBenched = true; return { ...p, isStarting: false }; }
          }
          return p;
        });

        // 2. GERADOR DE PROPOSTAS REALISTAS NO CORREIO
        let newInbox = prev.inbox || [];
        const listedPlayers = updatedPlayers.filter(p => p.isListed);

        // 80% de chance de chegar proposta pra alguem da Lista de Transferencias
        if (listedPlayers.length > 0 && Math.random() > 0.2) {
           const target = listedPlayers[Math.floor(Math.random() * listedPlayers.length)];

           // FIX 6.2: re-valida que o jogador ainda existe e esta listado no estado atual.
           // Evita proposta para jogador ja vendido ou deslistado entre renders.
           const stillListed = updatedPlayers.find(p => p.id === target.id && p.isListed);
           if (stillListed) {
             // Proposta realista baseada no valor dele (80% a 120%)
             const offerValue = Math.floor(target.value * (0.8 + (Math.random() * 0.4))); 
             const clubs = ["Real Madrid", "Manchester City", "Chelsea", "PSG", "Al-Hilal", "Bayern de Munique", "Boca Juniors", "Inter de Milão", "Al-Nassr", "Milan"];
             const buyer = clubs[Math.floor(Math.random() * clubs.length)];
             
             const newMsg = {
                 id: 'msg_transfer_' + Date.now(), icon: '🤝', type: 'TRANSFERÊNCIA', from: buyer,
                 subject: `Proposta de Compra: ${target.name}`, date: `Rodada ${prev.round}`,
                 preview: `Proposta oficial no valor de ${formatMoney(offerValue)}...`,
                 body: `Ao Departamento de Futebol,\n\nO clube ${buyer} formalizou uma proposta oficial para adquirir em definitivo os direitos do atleta ${target.name}.\n\nValor oferecido: ${formatMoney(offerValue)}\n\nAguardamos a decisão da diretoria e do Manager.\n\nAtenciosamente,\nDiretoria do ${buyer}`,
                 read: false, actionData: { type: 'sell', player: target, value: offerValue } 
             };
             newInbox = [newMsg, ...newInbox];
             setTimeout(() => showToast(`📬 Uma proposta por ${target.name} chegou no e-mail!`, 'info'), 1500);
           }
        }

        // 3. ALERTAS DE CONTRATO — avisa quando jogadores estão no último ano ou vencidos
        const contractWarnings = updatedPlayers.filter(p => (p.contract ?? 2) <= 1);
        if (contractWarnings.length > 0) {
          const expiring = contractWarnings.filter(p => (p.contract ?? 2) === 1);
          const expired  = contractWarnings.filter(p => (p.contract ?? 2) <= 0);

          if (expired.length > 0) {
            const names = expired.map(p => p.name.split(' ')[0]).join(', ');
            newInbox = [{
              id: `contract_expired_${prev.round}_${Date.now()}`,
              icon: '🔴', type: 'CONTRATO', from: 'Departamento Jurídico',
              subject: `Contratos vencidos: ${names}`,
              date: `Rodada ${prev.round}`,
              preview: `${expired.length} jogador(es) com contrato vencido. Renove ou libere.`,
              body: 'Os seguintes jogadores estão com contrato encerrado:\n\n' + expired.map(function(p){ return '• ' + p.name + ' (' + p.position + ' · OVR ' + p.overall + ')'; }).join('\n') + '\n\nAcesse o PlayerModal para renovar.',
              read: false,
            }, ...newInbox];
          }

          if (expiring.length > 0 && prev.round % 5 === 0) { // lembra a cada 5 rodadas
            const names = expiring.map(p => p.name.split(' ')[0]).join(', ');
            newInbox = [{
              id: `contract_warn_${prev.round}_${Date.now()}`,
              icon: '🟡', type: 'CONTRATO', from: 'Departamento Jurídico',
              subject: `Último ano de contrato: ${names}`,
              date: `Rodada ${prev.round}`,
              preview: `${expiring.length} jogador(es) no último ano de contrato.`,
              body: 'Atenção: no último ano de contrato:\n\n' + expiring.map(function(p){ return '• ' + p.name + ' (' + p.position + ' · OVR ' + p.overall + ')'; }).join('\n') + '\n\nAcesse o PlayerModal para renovar.',
              read: false,
            }, ...newInbox];
          }
        }

        if (hasBenched) setTimeout(() => showToast('⚠️ Escalação incompleta! Suspensos/Lesionados foram barrados.', 'warning'), 2000);
        return { ...prev, players: updatedPlayers, inbox: newInbox };
      });
    }
    prevRoundRef.current = gameData.round;
  }, [gameData?.round, showToast, formatMoney]);

  const handleLoadGame = React.useCallback((saveNameOrMeta) => { const name = typeof saveNameOrMeta === 'object' ? saveNameOrMeta.name : saveNameOrMeta; persistence.loadGame(name, (data) => { setGameData(data); setScreen('home'); }); }, [persistence.loadGame]);
  const handleConfirmDelete = React.useCallback(async () => { if (!deleteSaveModal) return; const name = typeof deleteSaveModal === 'object' ? deleteSaveModal.name : deleteSaveModal; await persistence.deleteSave(name); setDeleteSaveModal(null); }, [deleteSaveModal, persistence.deleteSave]);

  // 🌟 VENDA CONSOLIDADA NAS FINANÇAS
  const sellPlayer = React.useCallback((player, salePrice) => {
    if (!gameData) return;
    setGameData(prev => {
      const transaction = { 
        round: prev.round, 
        income: salePrice, 
        expense: 0, 
        total: salePrice, 
        detail: { transfer: salePrice, description: `Venda: ${player.name}` } 
      };
      // FIX 1.2 / 6.3: ao vender, decrementa o contador do time de origem no transfersFromTeam.
      // Evita que o limite de compras por clube fique inflado após uma venda de devolução.
      const updatedTransfers = (() => {
        const curr = { ...(prev.transfersFromTeam || {}) };
        if (player.previousTeam) {
          const key = player.previousTeam;
          if (curr[key] > 1) curr[key] -= 1;
          else delete curr[key];
        }
        return curr;
      })();
      return { 
        ...prev, 
        players: prev.players.filter(p => p.id !== player.id),
        club: {
          ...prev.club,
          money: prev.club.money + salePrice,
          transferBudget: (prev.club.transferBudget || 0) + salePrice,
          wage: Math.max(0, (prev.club.wage || 0) - (player.wage || 0)),
        },
        financialHistory: [transaction, ...(prev.financialHistory || [])].slice(0, 50),
        transfersFromTeam: updatedTransfers,
      };
    });
  }, [gameData]);

  const toggleStarter = React.useCallback((player) => {
    if (!gameData) return;
    const starters = gameData.players.filter(p => p.isStarting);
    if (!player.isStarting) {
      if (starters.length >= 11) { showToast('Já há 11 titulares. Remova um antes de adicionar.', 'warning'); return; }
      if (player.injury) { showToast(`${player.name.split(' ')[0]} está lesionado!`, 'error'); return; }
      if (DisciplineEngine?.isPlayerSuspended(player, gameData.round)) { showToast(`${player.name.split(' ')[0]} está suspenso!`, 'error'); return; }

      const formation = gameData.club?.formation || '4-4-2';
      const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
      // Usa adaptedPosition se definida (jogador adaptado já tem slot garantido pelo handlePickerSelect)
      const effectivePos = player.adaptedPosition || player.position;
      const maxForPos = slots[effectivePos] ?? 0;
      const currentForPos = starters.filter(p => (p.adaptedPosition || p.position) === effectivePos).length;
      if (maxForPos === 0) {
        showToast(`A formação ${formation} não tem posição para ${player.position}!`, 'warning');
        return;
      }
      if (currentForPos >= maxForPos) {
        showToast(`Já há ${maxForPos} ${effectivePos}(s) escalado(s) na formação ${formation}.`, 'warning');
        return;
      }
    }
    setGameData(prev => ({ ...prev, players: prev.players.map(p => p.id === player.id ? { ...p, isStarting: !p.isStarting } : p) }));
  }, [gameData, showToast]);

  const saveGameCb = React.useCallback(() => {
    persistence.saveGame(gameData);
    showToast('Jogo salvo com sucesso!', 'success');
    setIsDirtyLineup(false);
  }, [gameData, persistence, showToast]);

  const sharedProps = React.useMemo(() => ({
    gameData, setGameData,
    setScreen: handleNav,
    showToast, formatMoney, sellPlayer,
    ...simulation, ...squad,
    toggleStarter, setIsDirtyLineup,
    setPlayerModal: setPlayerModalData,
    saveGame: saveGameCb,
    persistence,
  }), [gameData, setGameData, handleNav, showToast, formatMoney, sellPlayer, simulation, squad, toggleStarter, setIsDirtyLineup, setPlayerModalData, saveGameCb, persistence]);

  React.useEffect(() => {
    if (!gameData && screen !== 'boot' && screen !== 'setup' && screen !== 'about') setScreen('boot');
  }, [gameData, screen]);

  // 🌟 COMPONENTE ANTI-CRASH 🌟
  const Fallback = ({ name }) => (
    <Box sx={{ p: 4, textAlign: 'center', mt: 10, bgcolor: '#0f2214', mx: 2, borderRadius: '12px', border: '2px solid #941818', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <Typography sx={{ fontSize: '4rem', mb: 2 }}>🚧</Typography>
      <Typography sx={{ color: '#941818', fontWeight: 900, fontSize: '1.2rem', mb: 1 }}>TELA QUEBRADA</Typography>
      <Typography sx={{ color: '#e6edf3', fontWeight: 700 }}>O componente <b>{name}</b> não foi encontrado ou falhou.</Typography>
      <Typography sx={{ color: '#8b949e', fontSize: '0.8rem', mt: 2 }}>Verifique se o arquivo existe e não possui erros de sintaxe.</Typography>
    </Box>
  );

  return (
    <>
    <Box sx={{ height: '100vh', overflowY: 'auto', bgcolor: 'background.default' }}>
        
        {screen === 'boot'         && <ScreenBoot savesList={persistence.savesList} loadSpecificGame={handleLoadGame} setScreen={setScreen} setDeleteSaveModal={setDeleteSaveModal} />}
        {screen === 'setup'        && (<ScreenSetup setupData={setupData} setSetupData={setSetupData} setScreen={setScreen} savesList={persistence.savesList} handleStartNewGame={d => persistence.createGame(d, g => { setGameData(g); setSetupData({ saveName: '', teamName: '', managerName: '', serie: 'A', managerAge: 40, managerNationality: 'Brasileiro', managerFormation: '4-4-2', managerStyle: 'Equilibrado', colorPrimary: '#22c55e', colorSecondary: '#ffffff' }); setScreen('home'); })} />)}
        
        {screen === 'home'         && <MenuPrincipal {...sharedProps} />}
        {screen === 'lineup'       && (<ScreenLineup {...sharedProps} updateShirt={(id, n) => { setGameData(prev => ({...prev, players: prev.players.map(p => p.id === id ? { ...p, shirt: parseInt(n) } : p)})); showToast('Camisa definida!'); }} />)}
        {screen === 'squad'        && <ScreenSquad {...sharedProps} />}
        {screen === 'medical'      && <ScreenMedical {...sharedProps} />}
        {screen === 'table'        && <ScreenTable gameData={gameData} />}
        {screen === 'match_result' && <ScreenMatchResult {...sharedProps} />}
        {screen === 'next_match'   && <ScreenNextMatch {...sharedProps} />}
        {screen === 'season_end'   && <ScreenSeasonEnd {...sharedProps} />}
        {screen === 'matches'      && <ScreenMatches {...sharedProps} />}
        {screen === 'finances'     && <ScreenFinances {...sharedProps} />}
        {screen === 'market'       && <ScreenMarket {...sharedProps} />}
        {screen === 'stadium'      && <ScreenStadium {...sharedProps} />}
        {screen === 'copas'        && <ScreenCopas {...sharedProps} />}
        {screen === 'academy'      && <ScreenAcademy {...sharedProps} />}
        {screen === 'inbox'        && <ScreenInbox {...sharedProps} />}
        {screen === 'career'       && <ScreenCareer {...sharedProps} />}
        {screen === 'about'        && (<ScreenAbout setScreen={setScreen} handleCopyPix={() => { try { navigator.clipboard.writeText('brasfoot@pix.com'); } catch(e){} }} />)}
        {screen === 'game_over'   && <ScreenGameOver gameData={gameData} setScreen={handleNav} setGameData={setGameData} persistence={persistence} />}
        
        {playerModalData && (
          <PlayerModal
            player={playerModalData} allPlayers={gameData.players} onClose={() => setPlayerModalData(null)}
            currentRound={gameData.round}
            onSell={(playerOrId) => {
              const id = typeof playerOrId === 'string' ? playerOrId : playerOrId?.id;
              const fresh = (gameData.players || []).find(p => p.id === id) || playerOrId;
              sellPlayer(fresh, Math.floor(Math.max(50000, fresh.value || 0) * 0.8));
              setPlayerModalData(null);
            }}
            onUpdateShirt={(id, n) => { setGameData(prev => ({...prev, players: prev.players.map(p => p.id === id ? { ...p, shirt: n } : p)})); showToast("Camisa atualizada!"); }}
            onUpdateWage={(id, val, newContract) => {
              setGameData(prev => {
                const updatedPlayers = prev.players.map(p => {
                  if (p.id !== id) return p;
                  const updated = { ...p, wage: val };
                  if (newContract !== undefined) updated.contract = newContract;
                  return updated;
                });
                const newTotalWage = updatedPlayers.reduce((s, p) => s + (p.wage || 0), 0);
                return { ...prev, players: updatedPlayers, club: { ...prev.club, wage: newTotalWage } };
              });
              showToast(newContract !== undefined ? 'Contrato renovado!' : 'Salário atualizado!');
            }}
            formatMoney={formatMoney}
            showToast={showToast}
            onSetGameData={setGameData}
          />
        )}
      </Box>

      {gameData && screen !== 'boot' && screen !== 'setup' && (<BottomNav screen={screen} setScreen={handleNav} simulating={simulation.simulating} saveGame={() => { persistence.saveGame(gameData); showToast('Jogo salvo!', 'success'); }} gameData={gameData} />)}

      <Dialog open={toast.open} onClose={() => setToast(t => ({ ...t, open: false }))} PaperProps={{ sx: { bgcolor: '#0f2214', border: `3px solid ${toast.severity === 'error' ? '#941818' : toast.severity === 'warning' ? '#b87a00' : toast.severity === 'info' ? '#22c55e' : '#32a852'}`, borderRadius: '16px', p: 3, textAlign: 'center', minWidth: '280px', maxWidth: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' } }}>
        <Typography sx={{ fontSize: '3rem', mb: 1, lineHeight: 1 }}>{toast.severity === 'error' ? '❌' : toast.severity === 'warning' ? '⚠️' : toast.severity === 'info' ? 'ℹ️' : '✅'}</Typography>
        <Typography sx={{ color: '#e6edf3', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.3 }}>{toast.message}</Typography>
        {toast.detail && <Typography sx={{ color: '#8b949e', fontSize: '0.75rem', mt: 1.2, lineHeight: 1.5 }}>{toast.detail}</Typography>}
      </Dialog>

      <Dialog open={lineupDialog.open} onClose={() => setLineupDialog({ open: false })}><Box sx={{ p: 3, textAlign: 'center', bgcolor: '#0f2214', borderRadius: '12px' }}><Typography sx={{ mb: 2, color: '#e6edf3', fontWeight: 700 }}>⚠️ Você precisa de exatamente <strong>11 titulares</strong>.<br />Atual: <strong>{lineupDialog.n}</strong> jogadores.</Typography><Button variant="contained" onClick={() => setLineupDialog({ open: false })} sx={{ bgcolor: '#22c55e', fontWeight: 900 }}>OK</Button></Box></Dialog>
      <Dialog open={!!deleteSaveModal} onClose={() => setDeleteSaveModal(null)}>
        <Box sx={{ p: 3, textAlign: 'center', minWidth: 280, bgcolor: '#0d1117', border: '2px solid #f85149', borderRadius: '12px' }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>🗑️</Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#e6edf3' }}>Deletar carreira?</Typography>
          <Typography sx={{ color: '#8b949e', fontSize: '0.9rem', mb: 3 }}>
            "{typeof deleteSaveModal === 'object' ? deleteSaveModal?.name : deleteSaveModal}" será deletada permanentemente.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => setDeleteSaveModal(null)} sx={{ borderColor: '#30363d', color: '#8b949e', fontWeight: 900 }}>Cancelar</Button>
            <Button variant="contained" onClick={handleConfirmDelete} sx={{ bgcolor: '#f85149', fontWeight: 900, '&:hover': { bgcolor: '#da3633' } }}>Deletar</Button>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog: alterações táticas não salvas */}
      <Dialog open={!!dirtyNavTarget} onClose={() => setDirtyNavTarget(null)}>
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#0f2214', borderRadius: '12px', minWidth: 280 }}>
          <Typography sx={{ mb: 2, color: '#e6edf3', fontWeight: 700 }}>
            ⚠️ Alterações táticas não salvas.<br />Sair mesmo assim?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => setDirtyNavTarget(null)}
              sx={{ color: '#94a3b8', borderColor: '#94a3b8' }}>Cancelar</Button>
            <Button variant="contained"
              onClick={() => { setIsDirtyLineup(false); setScreen(dirtyNavTarget); setDirtyNavTarget(null); }}
              sx={{ bgcolor: '#941818', fontWeight: 900, '&:hover': { bgcolor: '#b91c1c' } }}>
              Sair sem salvar
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default Game;

