import { APP_VERSION } from '../../config/appMeta.js';
import { reconcileLeagueState } from '../core/leagueEngine.js';
import { reconcileTransferState } from '../market/marketIntegrity.js';
import { reconcileClubIdentity } from './clubIdentity.js';
import { reconcileLeaguePyramid } from '../season/seasonPyramid.js';
import { initializeSerieDCompetition } from '../serieD/serieDCompetition.js';
import { initializeSerieCCompetition } from '../serieC/serieCCompetition.js';
import { attachCanonicalDates, getInitialCareerDate } from '../calendar/calendarDateEngine.js';
import { buildAnnualCalendarTargets } from '../calendar/seasonCalendar.js';
import { initRegionalCompetition } from '../cups/regionalEngine.js';
import { initStateCompetition } from '../cups/stateEngine.js';
import { initCopaBrasil } from '../cups/copaBrasilEngine.js';
import { CalendarEngine } from '../CalendarEngine.js';
import { reconcileNewsFeed } from '../news/newsEngine.js';

export const CURRENT_SAVE_SCHEMA_VERSION = 13;
export const SAVE_SCHEMA_FIELD = 'saveSchemaVersion';

const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);
const ARRAY_FIELDS = Object.freeze([
  'players', 'teams', 'table', 'fixtures', 'market', 'inbox', 'financialHistory',
  'careerHistory', 'academy', 'academyReady', 'watchlist', 'pyramidReserve', 'newsFeed',
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


// Schema 7 ativa a Série D de 96 clubes. Saves na Série D que ainda não
// começaram a temporada são convertidos para grupos; temporadas antigas já em
// andamento mantêm o calendário legado até a próxima virada para não apagar resultados.
function migrateV6ToV7(input = {}) {
  const normalized = reconcileLeaguePyramid(input);
  if (normalized.serie !== 'D' || normalized.serieDCompetition) {
    return { ...normalized, saveSchemaVersion:7 };
  }
  const hasPlayed = (normalized.fixtures || []).flat().some((match) => match?.played === true);
  const alreadyStarted = (Number(normalized.round) || 0) > 0 || (Number(normalized.leagueRound) || 0) > 0 || hasPlayed;
  if (alreadyStarted) {
    return { ...normalized, serieDLegacyFormat:true, saveSchemaVersion:7 };
  }
  const userTeam = (normalized.teams || []).find((team) => team?.id === 'user') || {
    id:'user', teamId:normalized.club?.existingTeamId || normalized.club?.teamId || null,
    name:normalized.club?.name || 'Meu Clube', strength:normalized.club?.strength || 55, isPlayer:true,
  };
  const initialized = initializeSerieDCompetition({
    userTeam,
    userCanonicalId:normalized.club?.existingTeamId || normalized.club?.teamId || null,
    cpuTeams:normalized.leagues?.D || [],
    season:normalized.season || 2026,
  });
  return {
    ...normalized,
    teams:initialized.teams,
    table:initialized.table,
    fixtures:initialized.fixtures,
    serieDCompetition:initialized.competition,
    serieDLegacyFormat:false,
    calendar:null,
    round:0,
    leagueRound:0,
    saveSchemaVersion:7,
  };
}


function calendarDateForProgress(calendar = [], round = 0) {
  if (!Array.isArray(calendar) || calendar.length === 0) return null;
  const index = Math.max(0, Math.min(calendar.length - 1, Number(round) > 0 ? Number(round) - 1 : 0));
  if ((Number(round) || 0) <= 0) return getInitialCareerDate(calendar);
  return calendar[index]?.dateISO || calendar[index]?.calendarDate || getInitialCareerDate(calendar);
}

// Schema 8 introduz calendário civil canônico e o formato dedicado da Série C
// 2027. Temporadas legadas já iniciadas são preservadas até a virada para não
// apagar resultados; temporadas ainda zeradas podem ser migradas sem perda.
function migrateV7ToV8(input = {}) {
  let normalized = reconcileLeaguePyramid(input);
  if (normalized.serie === 'C' && Number(normalized.season) === 2027 && !normalized.serieCCompetition) {
    const hasPlayed = (normalized.fixtures || []).flat().some((match) => match?.played === true);
    const alreadyStarted = (Number(normalized.round) || 0) > 0 || (Number(normalized.leagueRound) || 0) > 0 || hasPlayed;
    if (alreadyStarted) {
      normalized = { ...normalized, serieCLegacyFormat:true };
    } else {
      const userTeam = (normalized.teams || []).find((team) => team?.id === 'user') || {
        id:'user', teamId:normalized.club?.existingTeamId || normalized.club?.teamId || null,
        name:normalized.club?.name || 'Meu Clube', strength:normalized.club?.strength || 60, isPlayer:true,
      };
      const initialized = initializeSerieCCompetition({
        userTeam,
        userCanonicalId:normalized.club?.existingTeamId || normalized.club?.teamId || null,
        cpuTeams:normalized.leagues?.C || [],
        season:2027,
      });
      if (initialized) {
        normalized = {
          ...normalized,
          teams:initialized.teams,
          table:initialized.table,
          fixtures:initialized.fixtures,
          serieCCompetition:initialized.competition,
          serieCLegacyFormat:false,
          calendar:null,
          round:0,
          leagueRound:0,
        };
      }
    }
  }

  let calendar = Array.isArray(normalized.calendar) && normalized.calendar.length
    ? attachCanonicalDates(normalized.calendar, { season:normalized.season, serie:normalized.serie })
    : normalized.calendar;
  const inferredDate = normalized.currentDateISO || normalized.currentDate || calendarDateForProgress(calendar, normalized.round);
  return {
    ...normalized,
    calendar,
    currentDateISO:inferredDate || null,
    currentDate:inferredDate || null,
    saveSchemaVersion:8,
  };
}


// Schema 9 introduz o calendário anual por janelas de competição. Saves que
// ainda não disputaram nenhum compromisso podem ser redistribuídos com segurança;
// carreiras em andamento preservam sua agenda civil já jogada e adotam o novo
// modelo automaticamente na próxima temporada.
function migrateV8ToV9(input = {}) {
  const normalized = reconcileLeaguePyramid(input);
  const calendar = Array.isArray(normalized.calendar) ? normalized.calendar : [];
  if (!calendar.length) {
    return { ...normalized, calendarModel:'annual-v1', saveSchemaVersion:9 };
  }
  const hasPlayed = (normalized.fixtures || []).flat().some((match) => match?.played === true);
  const alreadyStarted = (Number(normalized.round) || 0) > 0 || (Number(normalized.leagueRound) || 0) > 0 || hasPlayed;
  if (alreadyStarted) {
    return { ...normalized, calendarModel:'legacy-dated-v1', saveSchemaVersion:9 };
  }
  const leagueRounds = Math.max(
    Number(normalized.fixtures?.length) || 0,
    calendar.filter((entry) => entry?.type === 'league').length,
  );
  const cupEvents = calendar
    .filter((entry) => entry?.type === 'cup')
    .map(({ dateISO, calendarDate, targetDateISO, targetSource, ...entry }) => entry);
  const targeted = buildAnnualCalendarTargets({
    leagueRounds,
    cupEvents,
    season:normalized.season || 2026,
    serie:normalized.serie || 'A',
  });
  const annualCalendar = attachCanonicalDates(targeted, { season:normalized.season || 2026, serie:normalized.serie || 'A' });
  const initialDate = getInitialCareerDate(annualCalendar);
  return {
    ...normalized,
    calendar:annualCalendar,
    currentDateISO:initialDate,
    currentDate:initialDate,
    calendarModel:'annual-v1',
    saveSchemaVersion:9,
  };
}



function rebuildUnstartedCalendar(state = {}, cups = state?.cups || {}) {
  const existingLeagueRounds = Array.isArray(state.calendar)
    ? state.calendar.filter((entry) => entry?.type === 'league').length
    : 0;
  const leagueRounds = Math.max(Number(state.fixtures?.length) || 0, existingLeagueRounds);
  const calendar = CalendarEngine.buildCalendar(leagueRounds, cups, state.serie || 'A', { season:state.season || 2026 });
  const initialDate = getInitialCareerDate(calendar);
  return {
    calendar,
    currentDateISO:initialDate || null,
    currentDate:initialDate || null,
    round:0,
    leagueRound:0,
  };
}

// Schema 10 adiciona as competições regionais nacionais, migra a janela de
// mercado para data civil e corrige o formato 2026 da Copa do Brasil. Saves já
// em andamento preservam a Copa/calendário antigo até a virada; saves ainda
// zerados podem ser reconstruídos com segurança sem apagar qualquer resultado.
function migrateV9ToV10(input = {}) {
  const normalized = reconcileLeaguePyramid(input);
  const cups = asObject(normalized.cups);
  const hasPlayed = (normalized.fixtures || []).flat().some((match) => match?.played === true);
  const alreadyStarted = (Number(normalized.round) || 0) > 0 || (Number(normalized.leagueRound) || 0) > 0 || hasPlayed;

  if (alreadyStarted) {
    return {
      ...normalized,
      regionalCalendarModel:cups.regional ? 'cbf-regional-v1' : 'deferred-until-next-season',
      copaBrasilCalendarModel:'legacy-format-until-next-season',
      saveSchemaVersion:10,
    };
  }

  // Se o save já tinha Copa do Brasil, ela é recriada a partir dos dados
  // canônicos da carreira. Saves sem objeto de copas continuam sem inventar
  // competição e serão inicializados normalmente pelo ciclo de temporada.
  const copaBrasil = cups.copaBrasil ? initCopaBrasil(normalized) : null;
  const baseCups = copaBrasil ? { ...cups, copaBrasil } : { ...cups };
  const regional = initRegionalCompetition({ ...normalized, cups:baseCups }, {
    hasContinental:Boolean(baseCups.libertadores || baseCups.sulAmericana),
  });
  const nextCups = regional ? { ...baseCups, regional } : baseCups;
  const mustRebuildCalendar = Boolean(copaBrasil || regional);

  return {
    ...normalized,
    cups:nextCups,
    ...(mustRebuildCalendar ? rebuildUnstartedCalendar(normalized, nextCups) : {}),
    regionalCalendarModel: regional ? 'cbf-regional-v1' : (cups.regional ? 'cbf-regional-v1' : 'not-eligible'),
    copaBrasilCalendarModel: copaBrasil ? 'cbf-2026-v2' : 'not-initialized',
    saveSchemaVersion:10,
  };
}


// Schema 11 adiciona a primeira camada canônica de estaduais (Carioca/Gauchão)
// e os metadados de runtime da beta 57. Saves já em andamento não recebem uma
// competição nova no meio do calendário; ela entra na virada. Saves zerados
// podem ser reconstruídos com segurança, preservando os demais torneios.
function migrateV10ToV11(input = {}) {
  const normalized = reconcileLeaguePyramid(input);
  const cups = asObject(normalized.cups);
  const hasPlayed = (normalized.fixtures || []).flat().some((match) => match?.played === true);
  const alreadyStarted = (Number(normalized.round) || 0) > 0 || (Number(normalized.leagueRound) || 0) > 0 || hasPlayed;

  if (alreadyStarted) {
    return {
      ...normalized,
      stateChampionshipModel:cups.estadual ? 'state-v1' : 'deferred-until-next-season',
      saveSchemaVersion:11,
    };
  }

  const estadual = initStateCompetition(normalized);
  const nextCups = estadual ? { ...cups, estadual } : cups;
  return {
    ...normalized,
    cups:nextCups,
    ...(estadual ? rebuildUnstartedCalendar(normalized, nextCups) : {}),
    stateChampionshipModel:estadual ? 'state-v1' : 'not-eligible',
    saveSchemaVersion:11,
  };
}


// Schema 12 amplia a camada estadual de 2 para 8 campeonatos. Saves beta 57
// já iniciados não recebem uma competição no meio da temporada; saves ainda
// zerados podem inicializar o estadual recém-suportado e reconstruir a agenda
// imediatamente, sem deixar calendar=null entre migrações.
function migrateV11ToV12(input = {}) {
  const normalized = reconcileLeaguePyramid(input);
  const cups = asObject(normalized.cups);
  const hasPlayed = (normalized.fixtures || []).flat().some((match) => match?.played === true);
  const alreadyStarted = (Number(normalized.round) || 0) > 0 || (Number(normalized.leagueRound) || 0) > 0 || hasPlayed;

  if (alreadyStarted) {
    return {
      ...normalized,
      stateChampionshipModel:cups.estadual ? 'state-v2-8-championships' : 'deferred-until-next-season',
      saveSchemaVersion:12,
    };
  }

  if (cups.estadual) {
    return {
      ...normalized,
      stateChampionshipModel:'state-v2-8-championships',
      saveSchemaVersion:12,
    };
  }

  const estadual = initStateCompetition(normalized);
  const nextCups = estadual ? { ...cups, estadual } : cups;
  return {
    ...normalized,
    cups:nextCups,
    ...(estadual ? rebuildUnstartedCalendar(normalized, nextCups) : {}),
    stateChampionshipModel:estadual ? 'state-v2-8-championships' : 'not-eligible',
    saveSchemaVersion:12,
  };
}

// Schema 13 introduz a Central de Notícias persistente. Saves antigos recebem
// um backfill conservador com resultados/transferências já comprovados no estado;
// eventos futuros passam a ser gravados canonicamente sem duplicação por ID.
function migrateV12ToV13(input = {}) {
  const normalized = reconcileLeaguePyramid(input);
  return {
    ...normalized,
    newsFeed:reconcileNewsFeed(normalized),
    newsFeedModel:'career-news-v1',
    saveSchemaVersion:13,
  };
}


const MIGRATIONS = Object.freeze({
  0: migrateV0ToV1,
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
  6: migrateV6ToV7,
  7: migrateV7ToV8,
  8: migrateV8ToV9,
  9: migrateV9ToV10,
  10: migrateV10ToV11,
  11: migrateV11ToV12,
  12: migrateV12ToV13,
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
  const calendar = Array.isArray(league.calendar) && league.calendar.length
    ? attachCanonicalDates(league.calendar, { season:league.season, serie:league.serie })
    : league.calendar;
  const inferredDate = league.currentDateISO || league.currentDate || calendarDateForProgress(calendar, league.round);
  const newsFeed = reconcileNewsFeed({ ...league, calendar, currentDateISO:inferredDate || null });
  return {
    ...league,
    calendar,
    newsFeed,
    newsFeedModel:'career-news-v1',
    calendarModel: league.calendarModel || (Array.isArray(calendar) && calendar.some((entry) => entry?.targetSource) ? 'annual-v1' : 'legacy-dated-v1'),
    currentDateISO:inferredDate || null,
    currentDate:inferredDate || null,
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
