// @migrated to ES module
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

  // ── SÉRIE A 2026 (20 clubes) ─────────────────────────────────
  // style: "ofensivo" | "defensivo" | "equilibrado"
  // fanBase: 0–1 (pressão da torcida sobre o técnico)
  serieATeams: [
    { id:"a1",  name:"Flamengo",      strength:87, money:157000000, budget:125000000, style:"ofensivo",    fanBase:1.00 },
    { id:"a2",  name:"Palmeiras",     strength:86, money:146000000, budget:116000000, style:"equilibrado", fanBase:0.92 },
    { id:"a3",  name:"Botafogo",      strength:85, money:136000000, budget:108000000, style:"ofensivo",    fanBase:0.75 },
    { id:"a4",  name:"Atlético MG",   strength:84, money:126000000, budget:100000000, style:"ofensivo",    fanBase:0.85 },
    { id:"a5",  name:"Corinthians",   strength:83, money:115000000, budget: 92000000, style:"equilibrado", fanBase:0.95 },
    { id:"a6",  name:"Internacional", strength:83, money:115000000, budget: 92000000, style:"equilibrado", fanBase:0.80 },
    { id:"a7",  name:"São Paulo",     strength:82, money:104000000, budget: 83000000, style:"equilibrado", fanBase:0.88 },
    { id:"a8",  name:"Fluminense",    strength:81, money: 94000000, budget: 75000000, style:"defensivo",   fanBase:0.72 },
    { id:"a9",  name:"Grêmio",        strength:81, money: 94000000, budget: 75000000, style:"equilibrado", fanBase:0.82 },
    { id:"a10", name:"Fortaleza",     strength:80, money: 84000000, budget: 67000000, style:"defensivo",   fanBase:0.70 },
    { id:"a11", name:"Cruzeiro",      strength:80, money: 84000000, budget: 67000000, style:"equilibrado", fanBase:0.78 },
    { id:"a12", name:"Santos",        strength:79, money: 73000000, budget: 58000000, style:"ofensivo",    fanBase:0.76 },
    { id:"a13", name:"Vasco",         strength:79, money: 73000000, budget: 58000000, style:"equilibrado", fanBase:0.74 },
    { id:"a14", name:"Athletico PR",  strength:79, money: 73000000, budget: 58000000, style:"defensivo",   fanBase:0.65 },
    { id:"a15", name:"Bahia",         strength:78, money: 62000000, budget: 49000000, style:"ofensivo",    fanBase:0.68 },
    { id:"a16", name:"Bragantino",    strength:78, money: 62000000, budget: 49000000, style:"ofensivo",    fanBase:0.55 },
    { id:"a17", name:"Criciúma",      strength:75, money: 31000000, budget: 24000000, style:"defensivo",   fanBase:0.50 },
    { id:"a18", name:"Juventude",     strength:74, money: 20000000, budget: 15000000, style:"defensivo",   fanBase:0.45 },
    { id:"a19", name:"Cuiabá",        strength:73, money: 12000000, budget:  9000000, style:"defensivo",   fanBase:0.40 },
    { id:"a20", name:"Atlético GO",   strength:73, money: 10000000, budget:  7000000, style:"equilibrado", fanBase:0.42 }
  ],

  // ── SÉRIE B 2026 (20 clubes) ─────────────────────────────────
  serieBTeams: [
    { id:"b1",  name:"Sport",         strength:74, money:25000000, budget:19000000, style:"equilibrado", fanBase:0.68 },
    { id:"b2",  name:"Ceará",         strength:74, money:24000000, budget:18000000, style:"defensivo",   fanBase:0.65 },
    { id:"b3",  name:"Goiás",         strength:73, money:23000000, budget:17000000, style:"ofensivo",    fanBase:0.58 },
    { id:"b4",  name:"Coritiba",      strength:73, money:22000000, budget:17000000, style:"equilibrado", fanBase:0.60 },
    { id:"b5",  name:"Avaí",          strength:72, money:21000000, budget:16000000, style:"defensivo",   fanBase:0.50 },
    { id:"b6",  name:"Paysandu",      strength:72, money:20000000, budget:15000000, style:"equilibrado", fanBase:0.55 },
    { id:"b7",  name:"Mirassol",      strength:71, money:19000000, budget:14000000, style:"ofensivo",    fanBase:0.45 },
    { id:"b8",  name:"Operário PR",   strength:71, money:18000000, budget:13000000, style:"defensivo",   fanBase:0.48 },
    { id:"b9",  name:"Guarani",       strength:70, money:17000000, budget:13000000, style:"equilibrado", fanBase:0.52 },
    { id:"b10", name:"Ponte Preta",   strength:70, money:16000000, budget:12000000, style:"ofensivo",    fanBase:0.54 },
    { id:"b11", name:"Chapecoense",   strength:70, money:16000000, budget:12000000, style:"defensivo",   fanBase:0.50 },
    { id:"b12", name:"Vila Nova",     strength:69, money:15000000, budget:11000000, style:"equilibrado", fanBase:0.42 },
    { id:"b13", name:"Botafogo SP",   strength:69, money:14000000, budget:10000000, style:"ofensivo",    fanBase:0.40 },
    { id:"b14", name:"Amazonas",      strength:68, money:13000000, budget: 9000000, style:"defensivo",   fanBase:0.38 },
    { id:"b15", name:"CRB",           strength:68, money:13000000, budget: 9000000, style:"equilibrado", fanBase:0.42 },
    { id:"b16", name:"Sampaio Corrêa",strength:68, money:12000000, budget: 9000000, style:"defensivo",   fanBase:0.40 },
    { id:"b17", name:"Tombense",      strength:67, money:11000000, budget: 8000000, style:"equilibrado", fanBase:0.35 },
    { id:"b18", name:"ABC",           strength:67, money:10000000, budget: 7000000, style:"defensivo",   fanBase:0.38 },
    { id:"b19", name:"Ferroviária",   strength:66, money: 9000000, budget: 7000000, style:"equilibrado", fanBase:0.32 },
    { id:"b20", name:"Novorizontino", strength:66, money: 9000000, budget: 7000000, style:"ofensivo",    fanBase:0.35 }
  ],

  // ── SÉRIE C 2026 (20 clubes) ─────────────────────────────────
  serieCTeams: [
    { id:"c1",  name:"Londrina",      strength:64, money:15000000, budget:11000000, style:"equilibrado", fanBase:0.52 },
    { id:"c2",  name:"Figueirense",   strength:64, money:14000000, budget:10000000, style:"defensivo",   fanBase:0.48 },
    { id:"c3",  name:"CSA",           strength:63, money:13000000, budget: 9000000, style:"equilibrado", fanBase:0.45 },
    { id:"c4",  name:"Náutico",       strength:63, money:13000000, budget: 9000000, style:"ofensivo",    fanBase:0.50 },
    { id:"c5",  name:"Remo",          strength:62, money:12000000, budget: 9000000, style:"equilibrado", fanBase:0.48 },
    { id:"c6",  name:"Brusque",       strength:62, money:11000000, budget: 8000000, style:"defensivo",   fanBase:0.38 },
    { id:"c7",  name:"Botafogo PB",   strength:61, money:11000000, budget: 8000000, style:"equilibrado", fanBase:0.40 },
    { id:"c8",  name:"Ituano",        strength:61, money:10000000, budget: 7000000, style:"ofensivo",    fanBase:0.35 },
    { id:"c9",  name:"Athletic Club", strength:60, money:10000000, budget: 7000000, style:"equilibrado", fanBase:0.32 },
    { id:"c10", name:"Ferroviário",   strength:60, money: 9000000, budget: 7000000, style:"defensivo",   fanBase:0.35 },
    { id:"c11", name:"Volta Redonda", strength:59, money: 9000000, budget: 6000000, style:"equilibrado", fanBase:0.32 },
    { id:"c12", name:"Atlético AC",   strength:59, money: 9000000, budget: 6000000, style:"defensivo",   fanBase:0.30 },
    { id:"c13", name:"Floresta",      strength:58, money: 8000000, budget: 6000000, style:"defensivo",   fanBase:0.28 },
    { id:"c14", name:"São Bernardo",  strength:58, money: 8000000, budget: 6000000, style:"ofensivo",    fanBase:0.30 },
    { id:"c15", name:"Confiança",     strength:57, money: 8000000, budget: 6000000, style:"equilibrado", fanBase:0.28 },
    { id:"c16", name:"Maringá",       strength:57, money: 7000000, budget: 5000000, style:"ofensivo",    fanBase:0.30 },
    { id:"c17", name:"Caxias",        strength:56, money: 7000000, budget: 5000000, style:"defensivo",   fanBase:0.32 },
    { id:"c18", name:"Campinense",    strength:56, money: 7000000, budget: 5000000, style:"equilibrado", fanBase:0.30 },
    { id:"c19", name:"Aparecidense",  strength:55, money: 6000000, budget: 4000000, style:"defensivo",   fanBase:0.25 },
    // "Náutico AM" não existe oficialmente — substituído por Manauara (clube real do AM)
    { id:"c20", name:"Manauara",      strength:55, money: 6000000, budget: 4000000, style:"equilibrado", fanBase:0.25 }
  ],

  // ── SÉRIE D 2026 (20 clubes) — valores variados e proporcionais ──
  serieDTeams: [
    { id:"d1",  name:"Dom Bosco",      strength:52, money: 5000000, budget: 3500000, style:"ofensivo",    fanBase:0.35 },
    { id:"d2",  name:"Hercílio Luz",   strength:52, money: 4800000, budget: 3300000, style:"equilibrado", fanBase:0.32 },
    { id:"d3",  name:"Trem",           strength:51, money: 4600000, budget: 3200000, style:"defensivo",   fanBase:0.28 },
    { id:"d4",  name:"GAS Rolim",      strength:51, money: 4400000, budget: 3000000, style:"equilibrado", fanBase:0.25 },
    { id:"d5",  name:"Real Noroeste",  strength:50, money: 4200000, budget: 2900000, style:"defensivo",   fanBase:0.28 },
    { id:"d6",  name:"Tocantinópolis", strength:50, money: 4000000, budget: 2800000, style:"equilibrado", fanBase:0.22 },
    { id:"d7",  name:"Pouso Alegre",   strength:49, money: 3800000, budget: 2600000, style:"ofensivo",    fanBase:0.28 },
    { id:"d8",  name:"Sergipe",        strength:49, money: 3600000, budget: 2500000, style:"equilibrado", fanBase:0.30 },
    { id:"d9",  name:"Atlético MS",    strength:48, money: 3400000, budget: 2400000, style:"defensivo",   fanBase:0.22 },
    { id:"d10", name:"Porto Velho",    strength:48, money: 3200000, budget: 2200000, style:"equilibrado", fanBase:0.20 },
    { id:"d11", name:"Treze",          strength:47, money: 3000000, budget: 2100000, style:"ofensivo",    fanBase:0.32 },
    // "Souza" → "Sousa" (nome oficial do município e do clube PB)
    { id:"d12", name:"Sousa",          strength:47, money: 2900000, budget: 2000000, style:"defensivo",   fanBase:0.28 },
    { id:"d13", name:"Ceilândia",      strength:46, money: 2800000, budget: 1900000, style:"equilibrado", fanBase:0.30 },
    { id:"d14", name:"Moto Club",      strength:46, money: 2700000, budget: 1900000, style:"ofensivo",    fanBase:0.28 },
    { id:"d15", name:"Genus",          strength:45, money: 2600000, budget: 1800000, style:"defensivo",   fanBase:0.20 },
    { id:"d16", name:"Manaus",         strength:45, money: 2500000, budget: 1700000, style:"equilibrado", fanBase:0.25 },
    { id:"d17", name:"Iguatu",         strength:44, money: 2400000, budget: 1700000, style:"defensivo",   fanBase:0.22 },
    { id:"d18", name:"Nacional AM",    strength:44, money: 2300000, budget: 1600000, style:"equilibrado", fanBase:0.20 },
    { id:"d19", name:"Humaitá",        strength:43, money: 2200000, budget: 1500000, style:"defensivo",   fanBase:0.18 },
    { id:"d20", name:"Plácido Castro", strength:43, money: 2000000, budget: 1400000, style:"equilibrado", fanBase:0.15 }
  ],

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
