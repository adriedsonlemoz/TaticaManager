import { diexDatabase } from '../../data/database.js';
import { teamBranding } from '../../data/teamBranding.js';
import { getTeamStadium } from '../../data/database_coaches.js';

export const getAvailableSetupTeams = (serie = 'A') => diexDatabase?.[`serie${serie}Teams`] || [];
export const getSetupTeamBrand = teamName => teamBranding?.[teamName] || null;

export const getSetupTeamDefaults = setupData => {
  const brand = getSetupTeamBrand(setupData?.teamName);
  const stadium = getTeamStadium(setupData?.teamName);
  const patch = {};
  if (brand && !setupData?._colorsSet) {
    patch.colorPrimary = brand.primary;
    patch.colorSecondary = brand.secondary;
    patch._colorsSet = true;
  }
  if (stadium && !setupData?.stadiumName) patch.stadiumName = stadium;
  return patch;
};

export const isSetupStepValid = (step, setupData) => {
  if (step === 1) return Boolean(setupData?.serie);
  if (step === 2) return Boolean(setupData?.teamName?.trim());
  if (step === 3) return Boolean(setupData?.saveName?.trim() && setupData?.seasonObjective);
  if (step === 4) return Boolean(setupData?.managerName?.trim());
  return true;
};
