import assert from 'node:assert/strict';
import { diexDatabase } from '../src/data/database.js';
import {
  CLUB_CATALOG,
  CURRENT_2026_CLUBS,
  LEGACY_CLUB_ID_MAP,
  SERIES_2026,
  canonicalClubId,
  canonicalClubName,
  getSeriesTeams2026,
  getPyramidSeriesTeams2026,
  getCareerSelectableClubs2026,
  resolveClub,
} from '../src/data/clubCatalog.js';
import { reconcileClubIdentity } from '../src/engines/persistence/clubIdentity.js';

let checks = 0;
const check = (fn) => { fn(); checks += 1; };
const names = (serie) => getSeriesTeams2026(serie).map((team) => team.name);

const EXPECTED = {
  A: ['Flamengo','Palmeiras','Cruzeiro','Mirassol','Fluminense','Bahia','Botafogo','São Paulo','Red Bull Bragantino','Corinthians','Grêmio','Vasco da Gama','Atlético-MG','Santos','Vitória','Internacional','Coritiba','Athletico-PR','Chapecoense','Remo'],
  B: ['América-MG','Athletic','Atlético-GO','Avaí','Botafogo-SP','Ceará','CRB','Criciúma','Cuiabá','Fortaleza','Goiás','Juventude','Londrina','Náutico','Novorizontino','Operário Ferroviário','Ponte Preta','São Bernardo','Sport','Vila Nova'],
  C: ['Amazonas','Anápolis','Barra-SC','Botafogo-PB','Brusque','Caxias','Confiança','Ferroviária','Figueirense','Floresta','Guarani','Inter de Limeira','Itabaiana','Ituano','Maranhão','Maringá','Paysandu','Santa Cruz','Volta Redonda','Ypiranga-RS'],
};

for (const serie of ['A','B','C']) {
  check(() => assert.equal(SERIES_2026[serie].length, 20));
  check(() => assert.deepEqual(names(serie), EXPECTED[serie]));
  check(() => assert.deepEqual(diexDatabase[`serie${serie}Teams`].map((team) => team.id), SERIES_2026[serie]));
}
check(() => assert.equal(SERIES_2026.D.length, 96));
check(() => assert.equal(new Set(SERIES_2026.D).size, 96));
check(() => assert.equal(getPyramidSeriesTeams2026('D').length, 96));
check(() => assert.equal(new Set(getPyramidSeriesTeams2026('D').map((team) => team.id)).size, 96));
check(() => ['Brasiliense','ABC','Manaus','Portuguesa-SP'].forEach((name) => assert.equal(getPyramidSeriesTeams2026('D').some((team) => team.name === name), true)));
check(() => assert.deepEqual(diexDatabase.serieDTeams.map((team) => team.id), getPyramidSeriesTeams2026('D').map((team) => team.id)));

check(() => assert.equal(CURRENT_2026_CLUBS.length, 156));
check(() => assert.equal(getCareerSelectableClubs2026().length, 156));
check(() => assert.equal(new Set(CURRENT_2026_CLUBS.map((club) => club.id)).size, 156));
check(() => assert.equal(new Set(CLUB_CATALOG.map((club) => club.id)).size, CLUB_CATALOG.length));
check(() => assert.ok(CURRENT_2026_CLUBS.every((club) => club.id.startsWith('br-'))));
check(() => assert.ok(CURRENT_2026_CLUBS.every((club) => club.name && Number.isFinite(club.strength))));
check(() => assert.equal(Object.keys(LEGACY_CLUB_ID_MAP).length, 80));
check(() => assert.ok(Object.values(LEGACY_CLUB_ID_MAP).every((id) => resolveClub(id)?.id === id)));

check(() => assert.equal(canonicalClubId('a4'), 'br-atletico-mg'));
check(() => assert.equal(canonicalClubId('b8'), 'br-operario-pr'));
check(() => assert.equal(canonicalClubId('c9'), 'br-athletic'));
check(() => assert.equal(canonicalClubId('d18'), 'br-nacional-am'));
check(() => assert.equal(canonicalClubId('user'), 'user'));
check(() => assert.equal(canonicalClubName('Atlético MG'), 'Atlético-MG'));
check(() => assert.equal(canonicalClubName('Bragantino'), 'Red Bull Bragantino'));
check(() => assert.equal(canonicalClubName('Vasco'), 'Vasco da Gama'));
check(() => assert.equal(canonicalClubName('Operário PR'), 'Operário Ferroviário'));
check(() => assert.equal(canonicalClubName('Nacional AM'), 'Nacional-AM'));
check(() => assert.equal(resolveClub('c20')?.name, 'Manauara'));
check(() => assert.equal(resolveClub('Plácido Castro')?.name, 'Plácido de Castro'));

check(() => {
  const state = reconcileClubIdentity({
    club:{ name:'Vasco', existingTeamId:'a13' },
    players:[{ id:'p1', name:'Jogador', position:'CA', teamId:'user', teamName:'Vasco' }],
    teams:[{ id:'user', name:'Vasco', isPlayer:true }, { id:'a4', name:'Atlético MG', strength:80 }],
    table:[{ id:'a4', name:'Atlético MG', pts:1 }],
    fixtures:[[{ home:{ id:'user', name:'Vasco' }, away:{ id:'a4', name:'Atlético MG' } }]],
    teamRosters:{ user:[], a4:[{ id:'p2', name:'CPU', position:'CA', teamId:'a4', teamName:'Atlético MG' }] },
    leagues:{ A:[{ id:'a4', name:'Atlético MG', squad:[] }] },
    transfersFromTeam:{ a4:1, 'br-atletico-mg':2 },
    pendingManagerTransfer:{ accepted:true, offeringClub:{ id:'b8', name:'Operário PR' } },
  });
  assert.equal(state.club.existingTeamId, 'br-vasco-da-gama');
  assert.equal(state.club.name, 'Vasco da Gama');
  assert.equal(state.teams[0].id, 'user');
  assert.equal(state.teams[0].name, 'Vasco da Gama');
  assert.equal(state.teams[1].id, 'br-atletico-mg');
  assert.equal(state.table[0].id, 'br-atletico-mg');
  assert.equal(state.fixtures[0][0].away.name, 'Atlético-MG');
  assert.equal(state.teamRosters['br-atletico-mg'][0].teamId, 'br-atletico-mg');
  assert.equal(state.teamRosters['br-atletico-mg'][0].teamName, 'Atlético-MG');
  assert.equal(Object.hasOwn(state.teamRosters, 'a4'), false);
  assert.equal(state.transfersFromTeam['br-atletico-mg'], 3);
  assert.equal(state.pendingManagerTransfer.offeringClub.id, 'br-operario-pr');
  assert.equal(state.pendingManagerTransfer.offeringClub.name, 'Operário Ferroviário');
});

check(() => {
  const playerNamedLikeClub = reconcileClubIdentity({ market:[{ id:'player-x', name:'Santos', position:'CA', overall:70, teamId:null, teamName:'Livre' }] });
  assert.equal(playerNamedLikeClub.market[0].id, 'player-x');
  assert.equal(playerNamedLikeClub.market[0].name, 'Santos');
});

check(() => {
  const custom = reconcileClubIdentity({
    club:{ name:'Bragantino', existingTeamId:null },
    players:[{ id:'p-custom', name:'Atleta', position:'CA', teamId:'user', teamName:'Bragantino' }],
    teams:[{ id:'user', name:'Bragantino', isPlayer:true }],
    teamRosters:{ user:[{ id:'p-custom', name:'Atleta', position:'CA', teamId:'user', teamName:'Bragantino' }] },
  });
  assert.equal(custom.club.name, 'Bragantino');
  assert.equal(custom.players[0].teamName, 'Bragantino');
  assert.equal(custom.teams[0].name, 'Bragantino');
});

console.log(`Club identity smoke: ${checks}/${checks} verificações aprovadas.`);
