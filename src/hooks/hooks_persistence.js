// @migrated to ES module
import React from 'react';
import Dexie from 'dexie';
import { getInitialGameState } from '../engines/engine.js';
import { CupsEngine } from '../engines/cups_engine.js';
import { APP_VERSION } from '../config/appMeta.js';
import { migrateSaveState, prepareSaveState } from '../engines/persistence/saveSchema.js';
import { assertCareerSaveNameAvailable, buildCareerCreationConfig } from '../engines/core/careerCreation.js';
import { getCareerObjective } from '../engines/core/careerObjectives.js';

// hooks/hooks_persistence.js — v6.4 (Instância Dexie única via useRef)
const usePersistence = (showToast) => {
  const [savesList, setSavesList] = React.useState([]);
  const [currentSave, setCurrentSave] = React.useState('');
  const saveQueueRef = React.useRef(Promise.resolve());

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
        const rawData = r.data || {};
        let d = rawData;
        let incompatible = false;
        try {
          d = prepareSaveState(rawData);
        } catch (error) {
          incompatible = error?.code === 'SAVE_SCHEMA_TOO_NEW';
        }
        const table = Array.isArray(d.table) ? d.table : [];
        const calendar = Array.isArray(d.calendar) ? d.calendar : [];
        const fixtures = Array.isArray(d.fixtures) ? d.fixtures : [];
        const tablePos = table.findIndex(t => String(t?.id) === 'user');
        const mp      = (d.club?.managerProfile && typeof d.club.managerProfile === 'object') ? d.club.managerProfile : {};
        // Troféus acumulados: usa mp.trophies se for número válido (≥0), senão infere do seasonResult
        const trophies = (typeof mp.trophies === 'number') ? mp.trophies : (d.seasonResult?.champion ? 1 : 0);
        return {
          name:            r.name,
          clubName:        d.club?.name            || r.name,
          serie:           d.serie                 || 'A',
          round:           d.round                 || 0,
          totalRounds:     calendar.length          || fixtures.length || 38,
          manager:         d.club?.manager          || '',
          season:          d.season                 || 2026,
          savedAt:         r.savedAt                || null,
          position:        tablePos >= 0 ? tablePos + 1 : null,
          pts:             table.find(t => String(t?.id) === 'user')?.pts ?? null,
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
          h2hOpponents:        (d.h2hHistory && typeof d.h2hHistory === 'object' && !Array.isArray(d.h2hHistory)) ? Object.keys(d.h2hHistory).length : 0,
          saveSchemaVersion:  d.saveSchemaVersion || rawData.saveSchemaVersion || 0,
          incompatible,
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

  const saveGame = React.useCallback((gameData) => {
    if (!gameData || !currentSave) return Promise.resolve(false);
    const saveName = currentSave;
    let payload;
    try {
      payload = prepareSaveState(gameData);
    } catch (error) {
      showToast(error?.code === 'SAVE_SCHEMA_TOO_NEW'
        ? 'Este save pertence a uma versão mais nova e não pode ser sobrescrito com segurança.'
        : 'Erro ao preparar o save para gravação.', 'error');
      return Promise.resolve(false);
    }
    const task = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await getDB().saves.put({ name: saveName, data: payload, savedAt: Date.now() });
          if (isMountedRef.current) reloadSavesList();
          return true;
        } catch (e) {
          showToast('Erro ao salvar!', 'error');
          return false;
        }
      });
    // Serializa gravações: uma chamada antiga nunca pode terminar depois de
    // uma mais nova e sobrescrever um commit de partida recém-confirmado.
    saveQueueRef.current = task.then(() => undefined, () => undefined);
    return task;
  }, [currentSave, showToast, reloadSavesList]);

  const loadGame = React.useCallback(async (saveName, onLoaded) => {
    try {
      const record = await getDB().saves.get(saveName);
      if (record?.data) {
        const migrated = migrateSaveState(record.data);
        const normalized = migrated.state;
        const changed = migrated.appliedMigrations.length > 0
          || record.data?.saveAppVersion !== APP_VERSION
          || JSON.stringify(normalized) !== JSON.stringify(record.data);
        setCurrentSave(saveName);
        onLoaded(normalized);
        if (changed) {
          await getDB().saves.put({ ...record, data:normalized, savedAt:record.savedAt || Date.now() });
          reloadSavesList();
        }
        showToast(`Carreira "${saveName}" carregada!`);
      } else { showToast('Save não encontrado.', 'error'); }
    } catch (e) {
      if (e?.code === 'SAVE_SCHEMA_TOO_NEW') {
        showToast('Este save foi criado por uma versão mais nova do Tática Manager e não pode ser aberto com segurança.', 'error');
        return;
      }
      showToast('Erro ao carregar save: ' + e.message, 'error');
    }
  }, [showToast, reloadSavesList]);

  const createGame = React.useCallback(async (setupData, onCreated) => {
    let config;
    try {
      config = buildCareerCreationConfig(setupData);
    } catch (error) {
      showToast(error?.message || 'Dados inválidos para criar a carreira.', 'error');
      return;
    }

    try {
      if (!getInitialGameState) {
        showToast('Erro crítico: Motor do jogo (engine.js) não foi carregado.', 'error');
        return;
      }
      await assertCareerSaveNameAvailable(config.saveName, name => getDB().saves.get(name));

      const newGame = getInitialGameState(config.teamId, config.managerName, config.managerProfile);
      newGame.difficulty = config.difficulty;
      newGame.difficultyMultipliers = config.difficultyMultipliers;
      newGame.seasonObjective = config.seasonObjective;
      if (CupsEngine?.autoInitCupsForSeason)
        newGame.cups = CupsEngine.autoInitCupsForSeason(newGame, true);

      const teamName = newGame.club?.name || config.teamName;
      const managerName = config.managerName;
      const _objLabel = getCareerObjective(newGame.seasonObjective)?.inboxLabel || 'alcançar o objetivo da temporada';
      newGame.inbox = [
        {
          id:'welcome_presidente',
          from:'Presidente do Clube',
          subject:`Bem-vindo ao ${teamName}, ${managerName}!`,
          date:'Pré-temporada',
          read:false,
          body:`Sr. ${managerName},\n\nFicamos muito felizes em tê-lo no comando do ${teamName}. A diretoria deposita total confiança em sua capacidade.\n\nSua missão para esta temporada é ${_objLabel}. Contamos com você.\n\n🏆 Boa sorte, Comandante.`,
        },
        {
          id:'welcome_assistente',
          from:'Assistente Técnico',
          subject:'Antes do primeiro treino — leia isto',
          date:'Pré-temporada',
          read:false,
          body:'Chefe,\n\nBem-vindo! Antes da estreia, precisamos definir o time titular.\n\n📋 COMO COMEÇAR:\n1. Vá em "Escalação" (ícone no menu principal)\n2. Toque em cada posição no campo para escalar um jogador\n3. Quando tiver 11 titulares, você estará pronto\n\nSem escalação completa, o botão de simular a partida fica bloqueado. Não se esqueça!\n\nEstarei ao seu lado em cada rodada. Pode contar comigo.',
        },
      ];

      const preparedGame = prepareSaveState(newGame);
      await getDB().saves.add({ name:config.saveName, data:preparedGame, savedAt:Date.now() });
      reloadSavesList();
      setCurrentSave(config.saveName);
      onCreated(preparedGame);
      showToast('Carreira iniciada! Boa sorte, Comandante! 🏆');
    } catch (error) {
      console.error('createGame error:', error);
      if (error?.code === 'DUPLICATE_SAVE_NAME' || error?.name === 'ConstraintError') {
        showToast(`Já existe uma carreira chamada "${config?.saveName || setupData?.saveName || ''}". Escolha outro nome para não sobrescrever o save.`, 'error');
        return;
      }
      showToast('Erro ao criar carreira: ' + error.message, 'error');
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
