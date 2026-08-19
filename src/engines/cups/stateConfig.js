// Campeonatos estaduais 2026 — configuração declarativa.
// A engine comum lê o formato de cada competição em vez de assumir que todos
// os estaduais têm duas chaves de seis clubes.
// Strength de equipes exclusivamente estaduais é parâmetro de gameplay, não dado factual.

const extra = (id, name, strength = 53) => Object.freeze({ id, name, strength });

export const STATE_EXTRA_TEAMS = Object.freeze({
  // RJ
  'state-bangu-rj': extra('state-bangu-rj', 'Bangu', 53),
  'state-boavista-rj': extra('state-boavista-rj', 'Boavista-RJ', 53),
  // RS
  'state-avenida-rs': extra('state-avenida-rs', 'Avenida', 52),
  'state-novo-hamburgo-rs': extra('state-novo-hamburgo-rs', 'Novo Hamburgo', 53),
  'state-monsoon-rs': extra('state-monsoon-rs', 'Monsoon', 52),
  'state-inter-sm': extra('state-inter-sm', 'Inter-SM', 52),
  // SP
  'state-primavera-sp': extra('state-primavera-sp', 'Primavera-SP', 54),
  'state-capivariano-sp': extra('state-capivariano-sp', 'Capivariano', 54),
  // MG
  'state-urt-mg': extra('state-urt-mg', 'URT', 53),
  'state-itabirito-mg': extra('state-itabirito-mg', 'Itabirito', 53),
  'state-north-mg': extra('state-north-mg', 'North', 54),
  // PR
  'state-foz-pr': extra('state-foz-pr', 'Foz do Iguaçu', 52),
  'state-andraus-pr': extra('state-andraus-pr', 'Andraus', 51),
  'state-galo-maringa-pr': extra('state-galo-maringa-pr', 'Galo Maringá', 51),
  // SC
  'state-camboriu-sc': extra('state-camboriu-sc', 'Camboriú', 53),
  'state-concordia-sc': extra('state-concordia-sc', 'Concórdia', 53),
  'state-carlos-renaux-sc': extra('state-carlos-renaux-sc', 'Carlos Renaux', 52),
  // BA
  'state-barcelona-ilheus-ba': extra('state-barcelona-ilheus-ba', 'Barcelona de Ilhéus', 52),
  'state-bahia-feira-ba': extra('state-bahia-feira-ba', 'Bahia de Feira', 54),
  'state-galicia-ba': extra('state-galicia-ba', 'Galícia', 51),
  'state-jequie-ba': extra('state-jequie-ba', 'Jequié', 53),
  // PE
  'state-jaguar-pe': extra('state-jaguar-pe', 'Jaguar', 51),
  'state-vitoria-tabocas-pe': extra('state-vitoria-tabocas-pe', 'Vitória das Tabocas', 52),
  // GO
  'state-anapolina-go': extra('state-anapolina-go', 'Anapolina', 53),
  'state-jataiense-go': extra('state-jataiense-go', 'Jataiense', 52),
  'state-centro-oeste-go': extra('state-centro-oeste-go', 'Centro Oeste', 51),
  // PA
  'state-cameta-pa': extra('state-cameta-pa', 'Cametá', 53),
  'state-capitao-poco-pa': extra('state-capitao-poco-pa', 'Capitão Poço', 51),
  'state-santa-rosa-pa': extra('state-santa-rosa-pa', 'Santa Rosa-PA', 51),
  'state-sao-raimundo-pa': extra('state-sao-raimundo-pa', 'São Raimundo-PA', 52),
  'state-amazonia-pa': extra('state-amazonia-pa', 'Amazônia Independente', 51),
  'state-bragantino-pa': extra('state-bragantino-pa', 'Bragantino-PA', 52),
  'state-castanhal-pa': extra('state-castanhal-pa', 'Castanhal', 52),
  'state-sao-francisco-pa': extra('state-sao-francisco-pa', 'São Francisco-PA', 52),
  // PB
  'state-atletico-pb': extra('state-atletico-pb', 'Atlético-PB', 51),
  'state-confianca-pb': extra('state-confianca-pb', 'Confiança-PB', 51),
  'state-esporte-patos-pb': extra('state-esporte-patos-pb', 'Esporte de Patos', 52),
  'state-nacional-patos-pb': extra('state-nacional-patos-pb', 'Nacional de Patos', 52),
  'state-pombal-pb': extra('state-pombal-pb', 'Pombal', 51),
  // AL
  'state-coruripe-al': extra('state-coruripe-al', 'Coruripe', 52),
  'state-cruzeiro-al': extra('state-cruzeiro-al', 'Cruzeiro-AL', 51),
  'state-murici-al': extra('state-murici-al', 'Murici', 52),
  'state-penedense-al': extra('state-penedense-al', 'Penedense', 51),
  // RN
  'state-potiguar-rn': extra('state-potiguar-rn', 'Potiguar de Mossoró', 53),
  'state-globo-rn': extra('state-globo-rn', 'Globo', 51),
  'state-santa-cruz-rn': extra('state-santa-cruz-rn', 'Santa Cruz-RN', 51),
  'state-qfc-rn': extra('state-qfc-rn', 'QFC', 51),
  'state-potyguar-rn': extra('state-potyguar-rn', 'Potyguar Seridoense', 51),
  // SE
  'state-america-propria-se': extra('state-america-propria-se', 'América de Propriá', 51),
  'state-guarany-se': extra('state-guarany-se', 'Guarany-SE', 51),
  'state-desportiva-aracaju-se': extra('state-desportiva-aracaju-se', 'Desportiva Aracaju', 50),
  'state-atletico-gloriense-se': extra('state-atletico-gloriense-se', 'Atlético Gloriense', 50),
  'state-dorense-se': extra('state-dorense-se', 'Dorense', 51),
  'state-falcon-se': extra('state-falcon-se', 'Falcon', 52),
});

const phase = (name, label, legs = 1) => Object.freeze({ phase:name, label, legs });

export const STATE_2026_CONFIGS = Object.freeze({
  carioca: Object.freeze({
    key:'carioca', label:'🏟️ Campeonato Carioca', shortLabel:'Carioca', color:'#1565c0', qualifyCount:4,
    firstStage:Object.freeze({ mode:'cross-groups', tableMode:'groups', qualify:Object.freeze({ type:'top-per-group', count:4 }), firstPairing:'same-group' }),
    groups:Object.freeze({
      A:Object.freeze(['state-bangu-rj','br-fluminense','br-portuguesa-rj','br-sampaio-correa-rj','br-vasco-da-gama','br-volta-redonda']),
      B:Object.freeze(['state-boavista-rj','br-botafogo','br-flamengo','br-madureira','br-marica','br-nova-iguacu']),
    }),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',1), phase('Semifinal','Semifinal',2), phase('Final','Final',1)]),
  }),
  gauchao: Object.freeze({
    key:'gauchao', label:'🏟️ Campeonato Gaúcho', shortLabel:'Gauchão', color:'#8e24aa', qualifyCount:4,
    firstStage:Object.freeze({ mode:'cross-groups', tableMode:'groups', qualify:Object.freeze({ type:'top-per-group', count:4 }), firstPairing:'same-group' }),
    groups:Object.freeze({
      A:Object.freeze(['br-internacional','br-juventude','state-avenida-rs','br-sao-jose-rs','br-guarany-de-bage','br-sao-luiz-rs']),
      B:Object.freeze(['br-gremio','br-caxias','state-novo-hamburgo-rs','state-monsoon-rs','state-inter-sm','br-ypiranga-rs']),
    }),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',1), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  paulista: Object.freeze({
    key:'paulista', label:'🏟️ Campeonato Paulista', shortLabel:'Paulistão', color:'#d32f2f',
    firstStage:Object.freeze({ mode:'partial-league', tableMode:'global', rounds:8, qualify:Object.freeze({ type:'global-top', count:8 }), firstPairing:'global-seeded' }),
    participants:Object.freeze([
      'br-corinthians','br-ponte-preta','br-palmeiras','br-portuguesa-sp','br-sao-paulo','br-mirassol','br-santos','br-novorizontino',
      'state-primavera-sp','br-guarani','br-noroeste','br-sao-bernardo','br-velo-clube','br-red-bull-bragantino','state-capivariano-sp','br-botafogo-sp',
    ]),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',1), phase('Semifinal','Semifinal',1), phase('Final','Final',1)]),
  }),
  mineiro: Object.freeze({
    key:'mineiro', label:'🏟️ Campeonato Mineiro', shortLabel:'Mineiro', color:'#6a1b9a',
    firstStage:Object.freeze({ mode:'outside-groups', tableMode:'groups', qualify:Object.freeze({ type:'group-winners-plus-best-runner-up', count:4 }), firstPairing:'qualified-seeded' }),
    groups:Object.freeze({
      A:Object.freeze(['br-atletico-mg','br-uberlandia','br-democrata-gv','state-urt-mg']),
      B:Object.freeze(['br-america-mg','br-tombense','br-betim','br-pouso-alegre']),
      C:Object.freeze(['br-cruzeiro','br-athletic','state-itabirito-mg','state-north-mg']),
    }),
    knockout:Object.freeze([phase('Semifinal','Semifinal',2), phase('Final','Final',1)]),
  }),
  paranaense: Object.freeze({
    key:'paranaense', label:'🏟️ Campeonato Paranaense', shortLabel:'Paranaense', color:'#2e7d32',
    firstStage:Object.freeze({ mode:'cross-groups', tableMode:'groups', qualify:Object.freeze({ type:'top-per-group', count:4 }), firstPairing:'same-group' }),
    groups:Object.freeze({
      A:Object.freeze(['br-athletico-pr','br-fc-cascavel','state-foz-pr','br-londrina','br-maringa','br-sao-joseense-pr']),
      B:Object.freeze(['state-andraus-pr','br-azuriz','br-cianorte','br-coritiba','state-galo-maringa-pr','br-operario-pr']),
    }),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',2), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  catarinense: Object.freeze({
    key:'catarinense', label:'🏟️ Campeonato Catarinense', shortLabel:'Catarinense', color:'#0277bd',
    firstStage:Object.freeze({ mode:'cross-groups', tableMode:'groups', qualify:Object.freeze({ type:'top-per-group', count:4 }), firstPairing:'same-group' }),
    groups:Object.freeze({
      A:Object.freeze(['br-avai','state-camboriu-sc','state-concordia-sc','br-marcilio-dias','br-brusque','br-joinville']),
      B:Object.freeze(['br-chapecoense','state-carlos-renaux-sc','br-barra-sc','br-figueirense','br-criciuma','br-santa-catarina']),
    }),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',2), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  baiano: Object.freeze({
    key:'baiano', label:'🏟️ Campeonato Baiano', shortLabel:'Baianão', color:'#ef6c00',
    firstStage:Object.freeze({ mode:'round-robin', tableMode:'global', qualify:Object.freeze({ type:'global-top', count:4 }), firstPairing:'global-seeded' }),
    participants:Object.freeze(['br-atletico-ba','br-bahia','state-barcelona-ilheus-ba','state-bahia-feira-ba','state-galicia-ba','br-jacuipense','state-jequie-ba','br-juazeirense','br-porto-ba','br-vitoria']),
    knockout:Object.freeze([phase('Semifinal','Semifinal',1), phase('Final','Final',1)]),
  }),
  pernambucano: Object.freeze({
    key:'pernambucano', label:'🏟️ Campeonato Pernambucano', shortLabel:'Pernambucano', color:'#c62828',
    firstStage:Object.freeze({
      mode:'round-robin', tableMode:'global',
      qualify:Object.freeze({ type:'direct-semi-playoff', directSemi:2, playoffFrom:3, playoffTo:6 }),
      firstPairing:'direct-semi-playoff',
    }),
    participants:Object.freeze(['br-decisao','state-jaguar-pe','br-maguary','br-nautico','br-retro','br-santa-cruz','br-sport','state-vitoria-tabocas-pe']),
    knockout:Object.freeze([phase('Playoff','Fase Eliminatória',2), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  goiano: Object.freeze({
    key:'goiano', label:'🏟️ Campeonato Goiano', shortLabel:'Goiano', color:'#00897b',
    firstStage:Object.freeze({ mode:'outside-groups', tableMode:'global', qualify:Object.freeze({ type:'global-top', count:8 }), firstPairing:'global-seeded' }),
    groups:Object.freeze({
      A:Object.freeze(['br-vila-nova','br-crac','br-inhumas','br-goiatuba']),
      B:Object.freeze(['br-anapolis','br-goias','state-jataiense-go','br-aparecidense']),
      C:Object.freeze(['br-atletico-go','br-abecat','state-centro-oeste-go','state-anapolina-go']),
    }),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',2), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  paraense: Object.freeze({
    key:'paraense', label:'🏟️ Campeonato Paraense', shortLabel:'Paraense', color:'#1565c0',
    firstStage:Object.freeze({ mode:'cross-groups', tableMode:'global', qualify:Object.freeze({ type:'global-top', count:8 }), firstPairing:'global-seeded' }),
    groups:Object.freeze({
      A:Object.freeze(['br-remo','state-cameta-pa','state-capitao-poco-pa','state-santa-rosa-pa','state-sao-raimundo-pa','br-tuna-luso']),
      B:Object.freeze(['br-paysandu','state-amazonia-pa','br-aguia-de-maraba','state-bragantino-pa','state-castanhal-pa','state-sao-francisco-pa']),
    }),
    knockout:Object.freeze([phase('Quartas','Quartas de Final',1), phase('Semifinal','Semifinal',1), phase('Final','Final',2)]),
  }),
  paraibano: Object.freeze({
    key:'paraibano', label:'🏟️ Campeonato Paraibano', shortLabel:'Paraibano', color:'#3949ab',
    firstStage:Object.freeze({ mode:'round-robin', tableMode:'global', qualify:Object.freeze({ type:'global-top', count:4 }), firstPairing:'global-seeded' }),
    participants:Object.freeze(['state-atletico-pb','br-botafogo-pb','br-campinense','state-confianca-pb','state-esporte-patos-pb','state-nacional-patos-pb','state-pombal-pb','br-serra-branca','br-sousa','br-treze']),
    knockout:Object.freeze([phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  alagoano: Object.freeze({
    key:'alagoano', label:'🏟️ Campeonato Alagoano', shortLabel:'Alagoano', color:'#2e7d32',
    firstStage:Object.freeze({ mode:'round-robin', tableMode:'global', qualify:Object.freeze({ type:'global-top', count:4 }), firstPairing:'global-seeded' }),
    participants:Object.freeze(['br-asa','state-coruripe-al','br-csa','br-crb','br-cse','state-cruzeiro-al','state-murici-al','state-penedense-al']),
    knockout:Object.freeze([phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  potiguar: Object.freeze({
    key:'potiguar', label:'🏟️ Campeonato Potiguar', shortLabel:'Potiguar', color:'#558b2f',
    firstStage:Object.freeze({
      mode:'round-robin', tableMode:'global',
      qualify:Object.freeze({ type:'direct-semi-playoff', directSemi:2, playoffFrom:3, playoffTo:6 }),
      firstPairing:'direct-semi-playoff',
    }),
    participants:Object.freeze(['br-abc','br-america-rn','state-potiguar-rn','br-laguna','state-globo-rn','state-santa-cruz-rn','state-qfc-rn','state-potyguar-rn']),
    knockout:Object.freeze([phase('Playoff','Mata-Mata Classificatório',2), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
  sergipano: Object.freeze({
    key:'sergipano', label:'🏟️ Campeonato Sergipano', shortLabel:'Sergipano', color:'#f9a825',
    firstStage:Object.freeze({
      mode:'round-robin', tableMode:'global',
      qualify:Object.freeze({ type:'direct-semi-playoff', directSemi:1, playoffFrom:2, playoffTo:7 }),
      firstPairing:'direct-semi-playoff',
    }),
    participants:Object.freeze(['state-america-propria-se','state-guarany-se','state-desportiva-aracaju-se','state-atletico-gloriense-se','br-confianca','br-itabaiana','br-sergipe','state-dorense-se','state-falcon-se','br-lagarto']),
    knockout:Object.freeze([phase('Playoff','Fase Eliminatória',1), phase('Semifinal','Semifinal',2), phase('Final','Final',2)]),
  }),
});

export const STATE_CUP_KEYS = Object.freeze(Object.keys(STATE_2026_CONFIGS));

const participantIds = (config) => config?.participants || Object.values(config?.groups || {}).flat();

export function getStateConfigForTeam(teamId) {
  const id = String(teamId || '');
  return Object.values(STATE_2026_CONFIGS).find((config) => participantIds(config).includes(id)) || null;
}

export function getStateGroupForTeam(config, teamId) {
  if (!config?.groups) return config ? 'Geral' : null;
  const id = String(teamId || '');
  return Object.entries(config.groups).find(([, ids]) => ids.includes(id))?.[0] || null;
}

export function getStateParticipantIds(config) {
  return [...participantIds(config)];
}
