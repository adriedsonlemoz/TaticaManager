import { resolveClub } from '../../data/clubCatalog.js';
import { getCareerSelectableTeams, getCareerTeamSelectionPatch, isCareerTeamIdValid } from '../../engines/core/careerCreation.js';
import { getTeamBranding } from '../../data/teamBranding.js';
import { getTeamStadium } from '../../data/database_coaches.js';

export const getAvailableSetupTeams = () => getCareerSelectableTeams();

export const getSetupTeamBrand = teamRef => getTeamBranding(resolveClub(teamRef)?.name || teamRef);

export const getSetupTeamSelectionPatch = teamId => getCareerTeamSelectionPatch(teamId);

export const getSetupTeamDefaults = setupData => {
  const team = resolveClub(setupData?.teamId);
  if (!team) return {};
  const brand = getSetupTeamBrand(team.id);
  const stadium = getTeamStadium(team.name);
  const patch = {};
  if (setupData?.teamName !== team.name) patch.teamName = team.name;
  if (setupData?.serie !== team.serie2026) patch.serie = team.serie2026;
  if (setupData?.existingTeamId !== team.id) patch.existingTeamId = team.id;
  if (brand && !setupData?._colorsSet) {
    patch.colorPrimary = brand.primary;
    patch.colorSecondary = brand.secondary;
    patch._colorsSet = true;
  }
  if (stadium && !setupData?.stadiumName) patch.stadiumName = stadium;
  if (team.money != null && setupData?.initialMoney !== team.money) patch.initialMoney = team.money;
  return patch;
};

export const isSetupTeamIdValid = teamId => isCareerTeamIdValid(teamId);

export const isSetupStepValid = (step, setupData) => {
  if (step === 1) return isSetupTeamIdValid(setupData?.teamId);
  if (step === 2) return Boolean(setupData?.saveName?.trim() && setupData?.seasonObjective && setupData?.difficulty);
  if (step === 3) return Boolean(setupData?.managerName?.trim());
  return true;
};
