import { APP_VERSION } from '../../config/appMeta.js';
import { reconcileLeagueState } from '../core/leagueEngine.js';
import { reconcileTransferState } from '../market/marketIntegrity.js';
import { reconcileClubIdentity } from './clubIdentity.js';
import { reconcileLeaguePyramid } from '../season/seasonPyramid.js';

export const CURRENT_SAVE_SCHEMA_VERSION = 6;
export const SAVE_SCHEMA_FIELD = 'saveSchemaVersion';

const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);
const ARRAY_FIELDS = Object.freeze([
  'players', 'teams', 'table', 'fixtures', 'market', 'inbox', 'financialHistory',
  'careerHistory', 'academy', 'academyReady', 'watchlist', 'pyramidReserve',
]);
const OBJECT_FIELDS = Object.freeze([
  'club', 'teamRosters', 'leagues', 'scorers', 'h2hHistory', 'transfersFromTeam',
]);

const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const asArray = (value) => (Array.isArray(value) ? value : []);
const asNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
};

const uniqueIds = (values = []) => {
  const seen = new Set();
  const result = [];
  asArray(values).forEach((value) => {
    if (value === null || value === undefined) return;
    const key = String(value);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(key);
  });
  return result;
};

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null;
  if (message.id === null || message.id === undefined) return { ...message };
  return { ...message, id:String(message.id) };
}

function deriveLeagueRound(state = {}) {
  if (Number.isFinite(Number(state.leagueRound))) return asNonNegativeInt(state.leagueRound);
  const round = asNonNegativeInt(state.round);
  if (Array.isArray(state.calendar) && state.calendar.length) {
    return state.calendar.slice(0, round).filter((entry) => entry?.type === 'league').length;
  }
  return round;
}

function normalizeRootShape(input = {}) {
  const next = { ...asObject(input) };
  ARRAY_FIELDS.forEach((field) => { next[field] = asArray(next[field]); });
  OBJECT_FIELDS.forEach((field) => { next[field] = asObject(next[field]); });
  next.leagues = {
    ...asObject(next.leagues),
    ...Object.fromEntries(SERIES_KEYS.map((serie) => [serie, asArray(next.leagues?.[serie])])),
  };
  if (next.calendar !== null && next.calendar !== undefined && !Array.isArray(next.calendar)) next.calendar = null;
  next.round = asNonNegativeInt(next.round);
  next.leagueRound = deriveLeagueRound(next);
  next.season = asNonNegativeInt(next.season, 2026) || 2026;
  next.serie = SERIES_KEYS.includes(String(next.serie || '').toUpperCase())
    ? String(next.serie).toUpperCase()
    : 'A';
  return next;
}

// Schema 0 representa qualquer save criado antes da beta.49: não havia versão
// explícita, e campos novos eram inferidos por cada tela/engine separadamente.
function migrateV0ToV1(input = {}) {
  return {
    ...normalizeRootShape(input),
    saveSchemaVersion: 1,
  };
}

// Schema 2 define a posse do atleta: players é o roster canônico do usuário e
// teamRosters é o roster canônico dos clubes CPU. squads em teams/leagues são
// somente espelhos sincronizados para consumidores legados.
function migrateV1ToV2(input = {}) {
  return {
    ...reconcileTransferState(input),
    saveSchemaVersion: 2,
  };
}

// Schema 3 centraliza bookkeeping transversal que antes podia divergir em saves
// antigos: IDs da Inbox, contadores de transferências, folha e classificação.
function migrateV2ToV3(input = {}) {
  const inbox = asArray(input.inbox).map(normalizeMessage).filter(Boolean);
  const transfersFromTeam = Object.fromEntries(
    Object.entries(asObject(input.transfersFromTeam))
      .map(([teamId, count]) => [String(teamId), asNonNegativeInt(count)])
      .filter(([, count]) => count > 0),
  );
  const next = reconcileLeagueState({
    ...input,
    inbox,
    readMsgIds: uniqueIds(input.readMsgIds),
    trashMsgIds: uniqueIds(input.trashMsgIds),
    erasedMsgIds: uniqueIds(input.erasedMsgIds),
    transfersFromTeam,
  });
  return {
    ...next,
    saveSchemaVersion: 3,
  };
}

// Schema 4 desacopla a identidade do clube da divisão. IDs legados como a1/b7
// são convertidos para IDs permanentes (br-*) e nomes/aliases são normalizados
// sem alterar a divisão conquistada dentro da carreira existente.
function migrateV3ToV4(input = {}) {
  return {
    ...reconcileClubIdentity(input),
    saveSchemaVersion: 4,
  };
}

// Schema 5 transforma leagues.A/B/C/D na composição persistente da pirâmide.
// A série atual mantém 19 clubes CPU + usuário; as demais mantêm 20 CPU.
// O clube oculto de carreiras customizadas é preservado em pyramidReserve.
function migrateV4ToV5(input = {}) {
  return {
    ...reconcileLeaguePyramid(input),
    saveSchemaVersion: 5,
  };
}


// Schema 6 fixa a identidade canônica do clube controlado em club.teamId.
// Saves antigos continuam compatíveis: carreiras de clube real derivam o ID de
// existingTeamId; clubes personalizados legados permanecem sem teamId canônico.
function migrateV5ToV6(input = {}) {
  const normalized = reconcileClubIdentity(input);
  const existingTeamId = normalized.club?.existingTeamId ?? null;
  return {
    ...normalized,
    club: {
      ...(normalized.club || {}),
      teamId: normalized.club?.teamId ?? existingTeamId,
    },
    saveSchemaVersion: 6,
  };
}

const MIGRATIONS = Object.freeze({
  0: migrateV0ToV1,
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
});

function normalizeCurrentSchema(input = {}) {
  // Mesmo em saves já migrados, cada persistência passa pelos invariantes
  // derivados. Isso impede que uma mutação de UI volte a gravar cópias divergentes.
  const root = normalizeRootShape(input);
  const identity = reconcileClubIdentity(root);
  const pyramid = reconcileLeaguePyramid(identity);
  const ownership = reconcileTransferState(pyramid);
  const league = reconcileLeagueState(ownership);
  const inbox = asArray(league.inbox).map(normalizeMessage).filter(Boolean);
  const transfersFromTeam = Object.fromEntries(
    Object.entries(asObject(league.transfersFromTeam))
      .map(([teamId, count]) => [String(teamId), asNonNegativeInt(count)])
      .filter(([, count]) => count > 0),
  );
  return {
    ...league,
    inbox,
    readMsgIds: uniqueIds(league.readMsgIds),
    trashMsgIds: uniqueIds(league.trashMsgIds),
    erasedMsgIds: uniqueIds(league.erasedMsgIds),
    transfersFromTeam,
    saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    saveAppVersion: APP_VERSION,
  };
}

export function getSaveSchemaVersion(state = {}) {
  const parsed = Number(state?.saveSchemaVersion);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

export function migrateSaveState(input = {}) {
  let state = { ...asObject(input) };
  let version = getSaveSchemaVersion(state);
  const appliedMigrations = [];

  if (version > CURRENT_SAVE_SCHEMA_VERSION) {
    const error = new Error(`Save usa schema ${version}, mas esta versão suporta até ${CURRENT_SAVE_SCHEMA_VERSION}.`);
    error.code = 'SAVE_SCHEMA_TOO_NEW';
    error.saveSchemaVersion = version;
    throw error;
  }

  while (version < CURRENT_SAVE_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (typeof migrate !== 'function') {
      const error = new Error(`Migração de save ausente: schema ${version} → ${version + 1}.`);
      error.code = 'SAVE_SCHEMA_MIGRATION_MISSING';
      throw error;
    }
    state = migrate(state);
    appliedMigrations.push(`${version}->${version + 1}`);
    version = getSaveSchemaVersion(state);
  }

  state = normalizeCurrentSchema(state);
  return { state, appliedMigrations, fromVersion:getSaveSchemaVersion(input), toVersion:CURRENT_SAVE_SCHEMA_VERSION };
}

export function prepareSaveState(input = {}) {
  return migrateSaveState(input).state;
}

export function isSaveSchemaSupported(input = {}) {
  return getSaveSchemaVersion(input) <= CURRENT_SAVE_SCHEMA_VERSION;
}
