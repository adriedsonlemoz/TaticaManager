// Competições regionais CBF 2026.
// Participantes e grupos seguem as tabelas/sorteios oficiais da temporada-base.
// Valores de strength para clubes fora do catálogo nacional são apenas parâmetros de gameplay.

export const REGIONAL_2026_WINDOW = Object.freeze({ start:'2026-03-24', end:'2026-06-07' });

const extra = (id, name, strength = 54) => Object.freeze({ id, name, strength });

export const REGIONAL_EXTRA_TEAMS = Object.freeze({
  'regional-porto-vitoria-es': extra('regional-porto-vitoria-es', 'Porto Vitória-ES', 54),
});

export const REGIONAL_2026_CONFIGS = Object.freeze({
  copaNordeste: Object.freeze({
    key:'copaNordeste',
    label:'🌵 Copa do Nordeste',
    shortLabel:'Nordeste',
    color:'#e07a2d',
    groupMode:'cross',
    groupPairs:Object.freeze([['A','B'], ['C','D']]),
    groups:Object.freeze({
      A:Object.freeze(['br-vitoria','br-asa','br-sousa','br-itabaiana','br-fluminense-pi']),
      B:Object.freeze(['br-juazeirense','br-crb','br-botafogo-pb','br-confianca','br-piaui']),
      C:Object.freeze(['br-ceara','br-sport','br-america-rn','br-imperatriz','br-ferroviario']),
      D:Object.freeze(['br-fortaleza','br-retro','br-abc','br-maranhao','br-jacuipense']),
    }),
    knockout:Object.freeze([
      Object.freeze({ phase:'Quartas', legs:1, label:'Quartas de Final' }),
      Object.freeze({ phase:'Semifinal', legs:2, label:'Semifinal' }),
      Object.freeze({ phase:'Final', legs:2, label:'Final' }),
    ]),
  }),

  copaSulSudeste: Object.freeze({
    key:'copaSulSudeste',
    label:'🧭 Copa Sul-Sudeste',
    shortLabel:'Sul-Sudeste',
    color:'#5f6caf',
    groupMode:'cross',
    groupPairs:Object.freeze([['A','B']]),
    groups:Object.freeze({
      A:Object.freeze(['br-caxias','br-chapecoense','br-cianorte','br-novorizontino','br-sampaio-correa-rj','br-tombense']),
      B:Object.freeze(['br-volta-redonda','br-sao-bernardo','br-juventude','br-america-mg','br-operario-pr','br-avai']),
    }),
    knockout:Object.freeze([
      Object.freeze({ phase:'Semifinal', legs:2, label:'Semifinal' }),
      Object.freeze({ phase:'Final', legs:2, label:'Final' }),
    ]),
  }),

  copaVerde: Object.freeze({
    key:'copaVerde',
    label:'🌿 Copa Verde',
    shortLabel:'Copa Verde',
    color:'#2e7d32',
    groupMode:'round-robin',
    groupPairs:Object.freeze([['N_A','N_B'], ['CO_A','CO_B']]),
    regionalBlocks:Object.freeze({ N:Object.freeze(['N_A','N_B']), CO:Object.freeze(['CO_A','CO_B']) }),
    groups:Object.freeze({
      N_A:Object.freeze(['br-gas','br-guapore','br-independencia-ac','br-nacional-am','br-paysandu','br-trem']),
      N_B:Object.freeze(['br-aguia-de-maraba','br-amazonas','br-galvez','br-monte-roraima','br-porto-velho','br-remo']),
      CO_A:Object.freeze(['br-araguaina','br-capital-df','br-operario-ms','br-primavera-mt','br-rio-branco-es','br-vila-nova']),
      CO_B:Object.freeze(['br-anapolis','br-atletico-go','br-cuiaba','br-gama','regional-porto-vitoria-es','br-tocantinopolis']),
    }),
    knockout:Object.freeze([
      Object.freeze({ phase:'Quartas', legs:1, label:'Semifinal Regional' }),
      Object.freeze({ phase:'Final Regional', legs:2, label:'Final Regional' }),
      Object.freeze({ phase:'Final', legs:2, label:'Final da Copa Verde' }),
    ]),
  }),
});

export const REGIONAL_CUP_KEYS = Object.freeze(Object.keys(REGIONAL_2026_CONFIGS));

export function getRegionalConfigForTeam(teamId) {
  const id = String(teamId || '');
  return Object.values(REGIONAL_2026_CONFIGS).find((config) => (
    Object.values(config.groups).some((ids) => ids.includes(id))
  )) || null;
}

export function getRegionalGroupForTeam(config, teamId) {
  if (!config) return null;
  const id = String(teamId || '');
  return Object.entries(config.groups).find(([, ids]) => ids.includes(id))?.[0] || null;
}

export function getPairedRegionalGroup(config, groupKey) {
  for (const pair of config?.groupPairs || []) {
    if (pair[0] === groupKey) return pair[1];
    if (pair[1] === groupKey) return pair[0];
  }
  return null;
}
