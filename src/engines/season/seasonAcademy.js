import { AcademyEngine } from '../engine_academy.js';

export function advanceSeasonAcademies(prevState = {}, pools = {}, teamRosters = {}, updatedPlayers = []) {
  if (!AcademyEngine) return {};
  const userAcademy = prevState.academy || [];
  const userLevel = prevState.club?.academyLevel || 'basic';
  const { ready: userReady, remaining: userRemaining } = userAcademy.length
    ? AcademyEngine.evolveAcademy(userAcademy, prevState.club?.name, 'user', userLevel)
    : { ready: [], remaining: AcademyEngine.initUserAcademy(prevState.club?.name, 'user', userLevel) };
  const cpuResult = AcademyEngine.processCpuAcademies(
    pools,
    teamRosters,
    prevState.academies || {},
  );
  const currentIds = new Set(updatedPlayers.map((player) => player.id));
  const carriedReady = AcademyEngine.mergeProspectPools(prevState.academyReady, userReady)
    .filter((prospect) => !currentIds.has(prospect.id));

  return {
    academy: userRemaining,
    academyReady: carriedReady,
    academies: cpuResult.academies,
  };
}
