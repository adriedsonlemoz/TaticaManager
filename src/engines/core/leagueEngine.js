// League scheduling, standings and table-zone helpers.

const getTableZoneColorA = (idx) => {
  if (idx < 4)   return '#32a852'; // Libertadores
  if (idx < 6)   return '#118a8b'; // Pré-Libertadores
  if (idx < 12)  return '#b87a00'; // Sul-Americana
  if (idx >= 16) return '#941818'; // Rebaixamento → Série B
  return 'transparent';
};
const getTableZoneColorB = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série A
  if (idx >= 16) return '#941818'; // Rebaixamento → Série C
  return 'transparent';
};
const getTableZoneColorC = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série B
  if (idx >= 16) return '#941818'; // Rebaixamento → Série D
  return 'transparent';
};
const getTableZoneColorD = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série C
  if (idx >= 16) return '#941818'; // Eliminação (sem divisão abaixo)
  return 'transparent';
};
const getTableZoneColor = (idx, serie) => {
  if (serie === 'B') return getTableZoneColorB(idx);
  if (serie === 'C') return getTableZoneColorC(idx);
  if (serie === 'D') return getTableZoneColorD(idx);
  return getTableZoneColorA(idx);
};

const generateFixtures = (teams) => {
  let fixtures = []; const n = teams.length; let roundTeams = [...teams];
  for (let r = 0; r < n - 1; r++) {
    let roundMatches = [];
    for (let m = 0; m < n / 2; m++) {
      const home = roundTeams[m], away = roundTeams[n - 1 - m];
      if (r % 2 === 0 && m === 0) roundMatches.push({ home: away, away: home, played: false, result: null });
      else roundMatches.push({ home, away, played: false, result: null });
    }
    fixtures.push(roundMatches); roundTeams.splice(1, 0, roundTeams.pop());
  }
  const firstHalf = [...fixtures];
  firstHalf.forEach(round => { fixtures.push(round.map(m => ({ home: m.away, away: m.home, played: false, result: null }))); });
  return fixtures;
};

const generateInitialTable = (teams) => teams.map(t => ({ id: t.id, name: t.name, pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }));

const sortLeagueTable = (table, fixtures) => {
  // Critério Brasileirão: PTS → V → Confronto Direto → SG → GF → Nome (alfabético)
  const _h2h = (a, b) => {
    if (!fixtures) return 0;
    let aGols = 0, bGols = 0;
    fixtures.forEach(round => {
      (round || []).forEach(match => {
        const hId = match.home?.id, aId = match.away?.id;
        if (!match.played || !match.result) return;
        const [hg, ag] = (match.result || '0-0').split('-').map(n => parseInt(n.trim()) || 0);
        if (hId === a.id && aId === b.id) { aGols += hg; bGols += ag; }
        if (hId === b.id && aId === a.id) { bGols += hg; aGols += ag; }
      });
    });
    return bGols !== aGols ? bGols - aGols : 0; // positivo = b tem menos gols, a sobe
  };

  return [...table].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w   !== a.w)   return b.w - a.w;
    // Confronto direto (só entre os dois)
    const h2h = _h2h(a, b);
    if (h2h !== 0) return h2h;
    // Saldo de gols geral
    const saldoA = a.gf - a.ga, saldoB = b.gf - b.ga;
    if (saldoB !== saldoA) return saldoB - saldoA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return (a.name || '').localeCompare(b.name || '');
  });
};

export {
  generateFixtures,
  generateInitialTable,
  sortLeagueTable,
  getTableZoneColor,
};
