// @migrated to ES module
import { getPyramidSeriesTeams2026 } from './clubCatalog.js';
// data/database.js — v2.0
// ╔═══════════════════════════════════════════════════════════════╗
// ║  Banco de dados central do Tática Manager               ║
// ║  Alterações aqui afetam geração de jogadores, times e árbitros ║
// ╚═══════════════════════════════════════════════════════════════╝

export const diexDatabase = {

  // ── NOMES REAIS (prénomes comuns no futebol brasileiro) ──────
  firstNames: [
    "Gabriel", "Pedro", "Lucas", "Matheus", "Bruno",
    "Rafael", "João", "Carlos", "Felipe", "Daniel",
    "Thiago", "Rodrigo", "André", "Renato", "Victor",
    "Vinícius", "Caio", "Igor", "Alan", "Arthur",
    "Patrick", "Gustavo", "Wesley", "Marcos", "Diego",
    "Luiz", "Fernando", "Henrique", "Maycon", "Danilo",
    "Yuri", "Endrick", "Sávio", "Estêvão", "Paulinho",
    "Natan", "Rony", "Everton", "Oscar", "Bernard",
    "Alisson", "Ederson", "Léo", "Murilo", "Fabricio",
    "Guilherme", "William", "Luan", "Jadson", "Jandrei"
  ],

  // ── APELIDOS (forma como são chamados em campo) ──────────────
  nicknames: [
    "Juninho", "Pedrinho", "Vitinho", "Rafinha", "Fabinho",
    "Marcinho", "Luizinho", "Thiaguinho", "Renatinho",
    "Paulista", "Baiano", "Mineiro", "Gaúcho",
    "Tiquinho", "Marinho", "Negueba", "Careca",
    "Robinho", "Fred", "Pato", "Dodô",
    "Nenê", "Hulk", "Kaká", "Dudu"
  ],

  // ── NOMES DE ESTRELA (craque com nome único) ─────────────────
  starNames: [
    "Zico", "Ronaldo", "Romário", "Rivaldo", "Ronaldinho",
    "Kaká", "Hulk", "Neymar", "Vinicius", "Rodrygo",
    "Endrick", "Estêvão", "Sávio", "Antony", "Richarlison"
  ],

  // ── SOBRENOMES (sem duplicatas, todos acentuados) ────────────
  lastNames: [
    "Silva", "Santos", "Souza", "Oliveira", "Pereira",
    "Costa", "Rodrigues", "Almeida", "Gomes", "Barbosa",
    "Teixeira", "Martins", "Rocha", "Melo", "Moreira",
    "Batista", "Carvalho", "Ribeiro", "Monteiro", "Nunes",
    "Lima", "Freitas", "Campos", "Cardoso", "Correia",
    "Ferreira", "Farias", "Vieira", "Pinto", "Rezende",
    "Araújo", "Tavares", "Machado", "Queiroz", "Borges",
    "Duarte", "Peixoto", "Figueiredo", "Magalhães", "Assis",
    "Fernandes", "Morais", "Sousa", "Andrade", "Cunha",
    "Martinez", "González", "López", "Díaz", "Torres"
  ],

  positions: ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"],

  // ── ÁRBITROS — com rigor (0=permissivo … 1=rigoroso) ────────
  // rigor afeta yellowProb na simulação (ver hooks_simulation.js)
  referees: [
    { name: "Anderson Daronco",         rigor: 0.85 },
    { name: "Raphael Claus",            rigor: 0.70 },
    { name: "Wilton Pereira Sampaio",   rigor: 0.90 },
    { name: "Edina Alves Batista",      rigor: 0.65 },
    { name: "Bráulio da Silva Machado", rigor: 0.75 },
    { name: "Rodolpho Toski Marques",   rigor: 0.55 },
    { name: "Sandro Meira Ricci",       rigor: 0.80 },
    { name: "Marcelo de Lima Henrique", rigor: 0.60 },
    { name: "Leandro Pedro Vuaden",     rigor: 0.72 },
    { name: "Flávio Rodrigues de Souza",rigor: 0.68 }
  ],

  // ── CLUBES / SÉRIES 2026 ────────────────────────────────────
  // IDs permanentes e composição centralizados em clubCatalog.js.
  serieATeams: getPyramidSeriesTeams2026('A'),
  serieBTeams: getPyramidSeriesTeams2026('B'),
  serieCTeams: getPyramidSeriesTeams2026('C'),
  serieDTeams: getPyramidSeriesTeams2026('D'),

  // legado
  get teams() { return this.serieATeams; }
};


// ── FORMAÇÕES ────────────────────────────────────────────────
// Por posição (usado em getLineupValidation e toggleStarter)
export const formationsMap = {
  "4-4-2":   { GOL: 1, LAT: 2, ZAG: 2, VOL: 2, MEI: 2, ATA: 2 },
  "4-3-3":   { GOL: 1, LAT: 2, ZAG: 2, VOL: 2, MEI: 1, ATA: 3 },
  "4-2-3-1": { GOL: 1, LAT: 2, ZAG: 2, VOL: 2, MEI: 3, ATA: 1 },
  "3-5-2":   { GOL: 1, LAT: 2, ZAG: 3, VOL: 2, MEI: 1, ATA: 2 },
  // 3-4-3: ZAG=3 + LAT=2 = 5 DEF | VOL=1 + MEI=1 = 2 MID — correto
  "3-4-3":   { GOL: 1, LAT: 2, ZAG: 3, VOL: 1, MEI: 1, ATA: 3 },
  "5-3-2":   { GOL: 1, LAT: 2, ZAG: 3, VOL: 2, MEI: 1, ATA: 2 }
};

// Validação da engine (linhas defensiva/média/ofensiva)
// 3-4-3: DEF=5 (ZAG3+LAT2), MID=2 (VOL1+MEI1), ATA=3 ✅
export const formationsMapDef = {
  "4-4-2":   { GOL: 1, DEF: 4, MID: 4, ATA: 2 },
  "4-3-3":   { GOL: 1, DEF: 4, MID: 3, ATA: 3 },
  "4-2-3-1": { GOL: 1, DEF: 4, MID: 5, ATA: 1 },
  "3-5-2":   { GOL: 1, DEF: 5, MID: 3, ATA: 2 },
  "3-4-3":   { GOL: 1, DEF: 5, MID: 2, ATA: 3 },
  "5-3-2":   { GOL: 1, DEF: 5, MID: 3, ATA: 2 }
};
export default diexDatabase;
