import { getCareerSelectableClubs2026, resolveClub } from '../../data/clubCatalog.js';
import { getTeamStadium } from '../../data/database_coaches.js';


const CAREER_SERIES = new Set(['A','B','C','D']);
const isCanonicalCareerTeamId = (teamId, team) => Boolean(team?.id && String(teamId ?? '') === String(team.id));

export function getCareerSelectableTeams() {
  return getCareerSelectableClubs2026()
    .filter((team) => CAREER_SERIES.has(String(team?.serie2026 || '').toUpperCase()))
    .sort((a, b) => {
      const bySerie = String(a.serie2026).localeCompare(String(b.serie2026));
      return bySerie || String(a.name).localeCompare(String(b.name), 'pt-BR');
    });
}

export function getCareerTeamSelectionPatch(teamId) {
  const team = resolveClub(teamId);
  if (!team || !isCanonicalCareerTeamId(teamId, team) || !CAREER_SERIES.has(String(team.serie2026 || '').toUpperCase())) return null;
  return {
    teamId:team.id,
    existingTeamId:team.id,
    teamName:team.name,
    serie:team.serie2026,
    initialMoney:team.money ?? null,
    stadiumName:getTeamStadium(team.name) || '',
    _colorsSet:false,
  };
}

export function isCareerTeamIdValid(teamId) {
  return Boolean(getCareerTeamSelectionPatch(teamId));
}

export const DIFFICULTY_PROFILES = Object.freeze({
  'Fácil': Object.freeze({ injuryChance:0.4, rivalStrength:0.88, moneyBonus:1.3, fatigueLoss:0.7 }),
  'Normal': Object.freeze({ injuryChance:1.0, rivalStrength:1.0, moneyBonus:1.0, fatigueLoss:1.0 }),
  'Difícil': Object.freeze({ injuryChance:1.8, rivalStrength:1.1, moneyBonus:0.85, fatigueLoss:1.3 }),
  'Lendário': Object.freeze({ injuryChance:2.8, rivalStrength:1.2, moneyBonus:0.7, fatigueLoss:1.6 }),
});

const OBJECTIVES_BY_SERIE = Object.freeze({
  A: Object.freeze(['champion','libertadores','sulamericana','survive','midtable']),
  B: Object.freeze(['champion','promotion','survive','midtable']),
  C: Object.freeze(['champion','promotion','survive','midtable']),
  D: Object.freeze(['champion','promotion','midtable']),
});
const DEFAULT_OBJECTIVE = Object.freeze({ A:'survive', B:'promotion', C:'promotion', D:'promotion' });
const FORMATIONS = new Set(['4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3','5-3-2']);
const STYLES = new Set(['Defensivo','Equilibrado','Ofensivo','Direto']);

const cleanText = (value, max = 80) => String(value ?? '').trim().slice(0, max);
const clamp = (value, min, max, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};

export function resolveCareerClubSelection(selection = {}) {
  // Ponto de extensão futuro: `selection.type === 'custom'` poderá ser tratado
  // aqui, exclusivamente para a Série D. Nesta versão apenas clubes de catálogo.
  const selectionType = selection?.type || 'existing';
  if (selectionType !== 'existing') {
    const error = new Error('Criação de clube personalizado ainda não está disponível.');
    error.code = 'CUSTOM_CLUB_DISABLED';
    throw error;
  }
  const team = resolveClub(selection?.teamId);
  if (!team || !isCanonicalCareerTeamId(selection?.teamId, team) || !CAREER_SERIES.has(String(team.serie2026 || '').toUpperCase())) {
    const error = new Error('Selecione um clube existente válido.');
    error.code = 'INVALID_CAREER_CLUB';
    throw error;
  }
  return team;
}


export async function assertCareerSaveNameAvailable(saveName, findSave) {
  if (typeof findSave !== 'function') return true;
  const existing = await findSave(saveName);
  if (!existing) return true;
  const error = new Error(`Já existe uma carreira chamada "${saveName}". Escolha outro nome para não sobrescrever o save.`);
  error.code = 'DUPLICATE_SAVE_NAME';
  throw error;
}

export function buildCareerCreationConfig(setupData = {}) {
  const saveName = cleanText(setupData.saveName, 80);
  const managerName = cleanText(setupData.managerName, 60);
  if (!saveName) {
    const error = new Error('Dê um nome para a carreira!');
    error.code = 'INVALID_SAVE_NAME';
    throw error;
  }
  if (!managerName) {
    const error = new Error('Informe o nome do treinador!');
    error.code = 'INVALID_MANAGER_NAME';
    throw error;
  }

  const team = resolveCareerClubSelection({ type:'existing', teamId:setupData.teamId });
  const serie = String(team.serie2026).toUpperCase();
  const difficulty = Object.hasOwn(DIFFICULTY_PROFILES, setupData.difficulty) ? setupData.difficulty : 'Normal';
  const requestedObjective = String(setupData.seasonObjective || '');
  const seasonObjective = OBJECTIVES_BY_SERIE[serie].includes(requestedObjective)
    ? requestedObjective
    : DEFAULT_OBJECTIVE[serie];

  return {
    saveName,
    managerName,
    teamId:team.id,
    teamName:team.name,
    serie,
    difficulty,
    difficultyMultipliers:{ ...DIFFICULTY_PROFILES[difficulty] },
    seasonObjective,
    managerProfile:{
      age:clamp(setupData.managerAge, 25, 75, 40),
      nationality:cleanText(setupData.managerNationality || 'Brasileiro', 40) || 'Brasileiro',
      formation:FORMATIONS.has(setupData.managerFormation) ? setupData.managerFormation : '4-4-2',
      style:STYLES.has(setupData.managerStyle) ? setupData.managerStyle : 'Equilibrado',
      colorPrimary:/^#[0-9a-f]{6}$/i.test(setupData.colorPrimary || '') ? setupData.colorPrimary : '#118a8b',
      colorSecondary:/^#[0-9a-f]{6}$/i.test(setupData.colorSecondary || '') ? setupData.colorSecondary : '#ffffff',
      stadiumName:getTeamStadium(team.name) || null,
      avatarStyle:cleanText(setupData.avatarStyle || 'suit', 24) || 'suit',
      wins:0, draws:0, losses:0, experience:0, seasonsTotal:0, trophies:0,
    },
  };
}
