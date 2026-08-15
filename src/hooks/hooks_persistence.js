// @migrated to ES module
import React from 'react';
import Dexie from 'dexie';
import { getInitialGameState } from '../engines/engine.js';
import { CupsEngine } from '../engines/cups_engine.js';

// hooks/hooks_persistence.js — v6.4 (Instância Dexie única via useRef)
const usePersistence = (showToast) => {
  const [savesList, setSavesList] = React.useState([]);
  const [currentSave, setCurrentSave] = React.useState('');

  // FIX #1: Uma unica instancia do Dexie durante todo o ciclo de vida do hook.
  // Antes, getDB() criava uma nova conexao a cada chamada, causando conflitos.
  const dbRef = React.useRef(null);
  const getDB = React.useCallback(() => {
    if (!dbRef.current) {
      const db = new Dexie('BrasfootDB');
      db.version(1).stores({ saves: 'name' });
      dbRef.current = db;
    }
    return dbRef.current;
  }, []);

  // FIX 9.1: inicializa o Dexie eagerly na montagem, antes de qualquer leitura.
  // Sem isso, chamadas a getDB() durante a inicializacao do React (StrictMode
  // double-invoke) podiam criar instancias concorrentes do banco.
  React.useEffect(() => {
    getDB();
  }, [getDB]);

  // Carrega lista com metadados completos de cada save
  const reloadSavesList = React.useCallback(() => {
    getDB().saves.toArray().then(items => {
      const metas = items.map(r => {
        const d       = r.data || {};
        const tablePos = (d.table || []).findIndex(t => t.id === 'user');
        const mp      = d.club?.managerProfile || {};
        // Troféus acumulados: usa mp.trophies se for número válido (≥0), senão infere do seasonResult
        const trophies = (typeof mp.trophies === 'number') ? mp.trophies : (d.seasonResult?.champion ? 1 : 0);
        return {
          name:            r.name,
          clubName:        d.club?.name            || r.name,
          serie:           d.serie                 || 'A',
          round:           d.round                 || 0,
          totalRounds:     d.fixtures?.length       || 38,
          manager:         d.club?.manager          || '',
          season:          d.season                 || 2026,
          savedAt:         r.savedAt                || null,
          position:        tablePos >= 0 ? tablePos + 1 : null,
          pts:             (d.table || []).find(t => t.id === 'user')?.pts ?? null,
          money:           d.club?.money            || 0,
          // ── Novos campos ──
          difficulty:          d.difficulty                       || null,
          seasonObjective:     d.seasonObjective                  || null,
          avatarStyle:         mp.avatarStyle                     || null,
          managerProfile:      mp,
          trophies,
          // Bug #1 fix: campos novos para ScreenBoot
          stadiumConstruction: d.club?.stadium?.underConstruction || 0,
          stadiumPending:      d.club?.stadium?.pendingCapacity   || 0,
          h2hOpponents:        Object.keys(d.h2hHistory || {}).length,
        };
      });
      setSavesList(metas);
    }).catch(() => setSavesList([]));
  }, []);

  // ✅ FIX #3 (aplicado aqui): ref de montagem para evitar setState após unmount
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    reloadSavesList();
    return () => { isMountedRef.current = false; };
  }, []);

  const saveGame = React.useCallback(async (gameData) => {
    if (!gameData || !currentSave) return;
    try {
      await getDB().saves.put({ name: currentSave, data: gameData, savedAt: Date.now() });
      reloadSavesList(); // Atualiza metadados após salvar
    } catch (e) { showToast('Erro ao salvar!', 'error'); }
  }, [currentSave, showToast, reloadSavesList]);

  const loadGame = React.useCallback(async (saveName, onLoaded) => {
    try {
      const record = await getDB().saves.get(saveName);
      if (record?.data) {
        setCurrentSave(saveName);
        onLoaded(record.data);
        showToast(`Carreira "${saveName}" carregada!`);
      } else { showToast('Save não encontrado.', 'error'); }
    } catch (e) { showToast('Erro ao carregar save: ' + e.message, 'error'); }
  }, [showToast]);

  const createGame = React.useCallback(async (setupData, onCreated) => {
    const { saveName, teamName, managerName, serie } = setupData || {};
    if (!saveName?.trim())    { showToast('Dê um nome para a carreira!', 'error'); return; }
    if (!teamName?.trim())    { showToast('Informe o nome do clube!', 'error'); return; }
    if (!managerName?.trim()) { showToast('Informe o nome do treinador!', 'error'); return; }

    try {
      if (!getInitialGameState) {
        showToast('Erro crítico: Motor do jogo (engine.js) não foi carregado.', 'error');
        return;
      }
      const managerProfile = {
        age:            setupData.managerAge          || 40,
        nationality:    setupData.managerNationality  || 'Brasileiro',
        formation:      setupData.managerFormation    || '4-4-2',
        style:          setupData.managerStyle        || 'Equilibrado',
        colorPrimary:   setupData.colorPrimary        || '#118a8b',
        colorSecondary: setupData.colorSecondary      || '#ffffff',
        initialMoney:   setupData.initialMoney        || null,
        stadiumName:    setupData.stadiumName         || null,
        avatarStyle:    setupData.avatarStyle         || 'suit',
        wins:        0, draws: 0, losses: 0, experience: 0, seasonsTotal: 0, trophies: 0,
      };
      const newGame = getInitialGameState(teamName, managerName, serie || 'A', managerProfile);
      // Propagar dificuldade e objetivo ao estado global do jogo
      newGame.difficulty             = setupData.difficulty             || 'Normal';
      newGame.difficultyMultipliers  = setupData.difficultyMultipliers  || { injuryChance:1, rivalStrength:1, moneyBonus:1, fatigueLoss:1 };
      newGame.seasonObjective        = setupData.seasonObjective        || 'survive';
      if (CupsEngine?.autoInitCupsForSeason)
        newGame.cups = CupsEngine.autoInitCupsForSeason(newGame, true);

      // ── Mensagens de boas-vindas no Inbox ───────────────────
      const _objLabel = {
        champion:'ser campeão', promotion:'subir de divisão',
        libertadores:'chegar à Libertadores', sulamericana:'chegar à Sul-Americana',
        survive:'não ser rebaixado', midtable:'terminar no meio da tabela',
      }[newGame.seasonObjective] || 'alcançar o objetivo da temporada';
      newGame.inbox = [
        {
          id: 'welcome_presidente',
          from: 'Presidente do Clube',
          subject: `Bem-vindo ao ${teamName}, ${managerName}!`,
          date: 'Pré-temporada',
          read: false,
          body: `Sr. ${managerName},\n\nFicamos muito felizes em tê-lo no comando do ${teamName}. A diretoria deposita total confiança em sua capacidade.\n\nSua missão para esta temporada é ${_objLabel}. Contamos com você.\n\n🏆 Boa sorte, Comandante.`,
        },
        {
          id: 'welcome_assistente',
          from: 'Assistente Técnico',
          subject: 'Antes do primeiro treino — leia isto',
          date: 'Pré-temporada',
          read: false,
          body: `Chefe,\n\nBem-vindo! Antes da estreia, precisamos definir o time titular.\n\n📋 COMO COMEÇAR:\n1. Vá em "Escalação" (ícone no menu principal)\n2. Toque em cada posição no campo para escalar um jogador\n3. Quando tiver 11 titulares, você estará pronto\n\nSem escalação completa, o botão de simular a partida fica bloqueado. Não se esqueça!\n\nEstarei ao seu lado em cada rodada. Pode contar comigo.`,
        },
      ];

      await getDB().saves.put({ name: saveName, data: newGame, savedAt: Date.now() });
      reloadSavesList();
      setCurrentSave(saveName);
      onCreated(newGame);
      showToast('Carreira iniciada! Boa sorte, Comandante! 🏆');
    } catch (e) {
      console.error('createGame error:', e);
      showToast('Erro ao criar carreira: ' + e.message, 'error');
    }
  }, [showToast, reloadSavesList]);

  const deleteSave = React.useCallback(async (saveName) => {
    try {
      await getDB().saves.delete(saveName);
      reloadSavesList();
      showToast(`Carreira "${saveName}" deletada.`, 'info');
    } catch (e) { showToast('Erro ao deletar.', 'error'); }
  }, [showToast, reloadSavesList]);

  return { savesList, currentSave, saveGame, loadGame, createGame, deleteSave };
};

export { usePersistence };
export default usePersistence;
