// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { APP_NAME, APP_VERSION_LABEL } from '../config/appMeta.js';

// components/ScreenAbout.js — v7.0
const ScreenAbout = ({ handleCopyPix, onBack }) => {
  const [pixCopied, setPixCopied] = React.useState(false);
  const [expandedV, setExpandedV] = React.useState(null);

  const doCopy = () => {
    handleCopyPix();
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const C = THEME;

  const changelog = [
    {
      v: APP_VERSION_LABEL, tag: 'ATUAL', color: C.green,
      title: 'Tática Manager · Perfil de jogador modular',
      items: [
        '👤 PlayerModal reduzido de 627 para cerca de 84 linhas',
        '🧩 Perfil, temporada, camisa, salário e disciplina separados em componentes próprios',
        '📋 Listar para venda deixa de poder cair acidentalmente na venda imediata',
        '🤝 Renovação por desempenho passa a atualizar também a duração do contrato',
        '⚡ Fadiga, disciplina e JerseyBadge usam imports ES diretos em vez de window.*',
        '🧪 Serviço de jogador validado com smoke tests de salário, potencial, camisas e mercado',
        '🚀 Versão 1.0.0-beta.14 pronta para continuidade no GitHub',
      ],
    },
    {
      v: 'v1.0 beta.13', tag: '', color: C.teal,
      title: 'Interface de Copas modular',
      items: [
        '🏆 ScreenCopas reduzida de 340 para cerca de 35 linhas',
        '🧩 Status, confrontos, grupos, histórico e navegação separados em componentes próprios',
        '🔁 Jogos de volta exibem o placar na mesma orientação visual do confronto',
      ],
    },
    {
      v: 'v1.0 beta.12', tag: '', color: C.teal,
      title: 'Copas modulares e calendário unificado',
      items: [
        '🏆 cups_engine reduzido de 690 para cerca de 86 linhas',
        '🌎 Grupos continentais completam os seis jogos de ida e volta',
        '🥇 Finais continentais corrigidas para jogo único',
      ],
    },
    {
      v: 'v1.0 beta.11', tag: '', color: C.teal,
      title: 'Escalação modular e consistente',
      items: [
        '📋 ScreenLineup reduzida de 663 para cerca de 167 linhas',
        '🧠 Autoescala e regras de titulares/adaptados centralizadas',
        '⚖️ 4-4-2 unificado entre campo visual e validação global',
      ],
    },
    {
      v: 'v1.0 beta.10', tag: '', color: C.teal,
      title: 'Finanças modulares e consistentes',
      items: [
        '💰 ScreenFinances reduzida de 721 para cerca de 74 linhas',
        '📊 Projeções e agregações centralizadas no financeViewModel',
        '🧾 Histórico moderno e legado normalizado por uma única camada',
      ],
    },
    {
      v: 'v1.0 beta.9', tag: '', color: C.teal,
      title: 'Calendário modular e consistente',
      items: [
        '📅 ScreenMatches reduzida de 930 para cerca de 112 linhas',
        '🏆 Liga e Copas normalizadas por calendarSlot',
        '🧾 Jogos de Copa encerrados permanecem acessíveis no calendário e na súmula',
      ],
    },
    {
      v: 'v1.0 beta.8', tag: '', color: C.teal,
      title: 'Pós-jogo modular e consistente',
      items: [
        '🧩 ScreenPostMatch reduzida de 805 para cerca de 195 linhas',
        '⚽ Súmula, finanças, tabela e desfalques separados em componentes próprios',
        '📊 Estatísticas persistidas pelo motor e finanças alinhadas ao histórico real',
      ],
    },
    {
      v: 'v1.0 beta.7', tag: '', color: C.teal,
      title: 'Partida ao vivo modular',
      items: [
        '⚽ ScreenMatchResult reduzida de 1.289 para cerca de 297 linhas',
        '🏟️ Campo e formações separados em MatchField.jsx',
        '🗣️ Narração, banco, overlays e substituições separados da orquestração',
        '👕 Corrigido fallback de número de camisa no mini-campo',
      ],
    },
    {
      v: 'v1.0 beta.5', tag: '', color: C.teal,
      title: 'Nova carreira modular',
      items: [
        '🧩 ScreenSetup reduzida de 935 para cerca de 48 linhas',
        '🗂️ Os seis passos da nova carreira agora são componentes independentes',
        '🎨 Cabeçalho, progresso, navegação e uniforme extraídos para SetupUi.jsx',
        '🧠 Validações e defaults de clube/estádio centralizados em setupService.js',
        '🔌 Setup não depende mais de dados globais em window.*',
      ],
    },
    {
      v: 'v1.0 beta.1', tag: '', color: C.teal,
      title: 'Beta pública · Refatoração estrutural · GitHub · Vercel',
      items: [
        '🧩 Motor de partida dividido em módulos de simulação, playback, estatísticas e pós-jogo',
        '🧹 useMatchEngine reduzido e focado em orquestração React',
        '☁️ Projeto preparado para deploy Vite na Vercel com Node.js 22',
        '📚 README, changelog, arquitetura e guia de deploy adicionados ao repositório',
        '🔁 CI do GitHub valida o build automaticamente em pushes e pull requests',
        '🏷️ Versionamento normalizado para SemVer a partir da série 1.0.0-beta',
      ],
    },
    {
      v: 'v8.0', tag: 'LEGADO', color: C.teal,
      title: '20 melhorias de realismo · H2H · Obras · Jornal · IA CPU',
      items: [
        '⚽ Pênalti in-game: 0.27/jogo com narração "CONVERTIDO/DEFENDIDO" e taxa por força',
        '😬 Gol contra: 3% dos gols viram autogol com narração específica',
        '🟥 Vermelhos calibrados: 0.00156/min → 0.28/jogo real; segundo amarelo automático',
        '🔄 Substituições CPU: entre min 60-75, CPU faz 1-2 subs com boost de força',
        '🧠 IA tática CPU: perdendo por 2+ abre jogo (+25%); ganhando fecha (-15%)',
        '📰 Jornal automático: manchete gerada após cada rodada com resultado e posição',
        '🗞️ Rumores de mercado: a cada 5 rodadas, clube CPU monitora seu jogador no inbox',
        '📋 Objetivo dinâmico da diretoria: cobrança a cada 5 rodadas se performance baixa',
        '😤 Pressão da torcida: 3 derrotas seguidas → -5 moral + mensagem no inbox',
        '🚑 Lesão em treino: 1% de chance por rodada para qualquer jogador',
        '⚔️ H2H histórico: V/E/D contra cada adversário acumulado e exibido no ScreenNextMatch e ScreenCareer',
        '💰 Inflação salarial: +8% em todos os salários na virada de temporada',
        '📉 Rebaixamento real: -55% do caixa (era -30%); acesso: +35% (era +25%)',
        '🏗️ Obras de estádio: barra de progresso por rodadas no ScreenStadium',
        '🔒 Multa rescisória: exibida no ScreenMarket e ScreenSquad',
        '🔄 Renovação automática CPU: times CPU renovam contratos expirados na virada',
        '⚽ Copa do Brasil Série D: adversário amador na 1ª Fase (força 35-46)',
        '💼 Bônus de performance: jogador com 8+ gols ganha +20% na renovação',
        '📊 ScreenCareer: seção "Histórico de Confrontos" com aproveitamento por adversário',
        '🏟️ ScreenFinances: folha salarial separada de custos op, aviso de inflação',
        '🛒 ScreenMarket: multa rescisória exibida no painel expandido do jogador',
        '👥 ScreenSquad: badge 🔒 com valor da multa rescisória',
      ],
    },
    {
      v: 'v7.0', tag: '', color: C.teal,
      title: 'Realismo total · Motor dinâmico · Reformas gerais',
      items: [
        '⚽ Probabilidade de gol corrigida: 0.0145→0.029/min — média real de 2.6 gols/jogo',
        '🟨 Amarelos rebalanceados: 0.0097→0.0194/min — média real de 3.5/jogo',
        '🏠 Vantagem do mandante dinâmica: fanBase do clube + pressão da torcida adversária (1.08–1.25)',
        '🟥 Cartão vermelho com impacto real: -12% força por expulsão, adversário +8% com superioridade',
        '💪 Força recalculada no 2º tempo (min 46) incorporando subs, cansaço e táticas do intervalo',
        '📋 Intervalo redesenhado: stats do 1T, grid posse/gols/finalizações/amarelos, mudança de formação e estilo com impacto real no 2T',
        '📅 Treino limitado a 1x por rodada; multiplicador por idade (jovens +40%, >30: sem evolução, >33: declínio possível)',
        '🔒 Validação de reputação: OVR≥86 recusa Série B/C/D, OVR≥78 recusa C/D, OVR≥70 recusa D',
        '⚡ Fadiga por idade: veteranos (+30a) perdem +12% energia por jogo e recuperam -3 no banco',
        '🏟️ Obras de estádio com prazo real de 4 rodadas — capacidade só aumenta após conclusão',
        '💰 club.wage separado de custos operacionais — runway financeiro calculado corretamente',
        '🧮 Confronto direto no desempate da tabela (critério real do Brasileirão)',
        '👶 Envelhecimento de jogadores na virada de temporada (+1 age) com decaimento OVR aos 32+',
        '🪦 Aposentadoria automática: jogadores não-titulares ≥38 anos deixam o clube',
        '🏆 Copa — fase de grupos com jogo de ida E volta (6 jogos, era 3)',
        '🎯 Pênaltis consideram força dos times: time mais forte tem melhor taxa de conversão',
        '📊 Posse de bola dinâmica: proporcional à força dos times (não mais 50/50 fixo)',
        '🎯 Finalizações reais: calculadas com chutes base + ajuste de posse',
        '😊 Moral com inércia (60/40 blend) — sem quedas bruscas após derrota isolada',
        '❤️ Moral individual conectado: média moralIndividual afeta força do time em 0.95–1.05×',
        '📋 Improvisação permitida: posição errada aplica -20% OVR em vez de bloquear',
        '⚽ Formação 3-4-3 corrigida: sem LAT, com VOL e MEI nas alas',
        '🛒 Venda via lista de transferências: "LISTAR P/ VENDA" → proposta chega no inbox',
        '💸 Multa rescisória adicionada a todos jogadores (releaseClause = 3× valor)',
        '🏗️ Academia evolui progressivamente a cada 8 rodadas durante a temporada',
        '👥 Público nunca ultrapassa capacidade do estádio (Math.min aplicado)',
        '🚑 DM barra lesionados; 🟥 Árbitro barra suspensos — mensagens separadas e corretas',
        '⚡ ScreenNextMatch: botões compactos no header, placar agregado da copa, auto-simular',
        '📱 ScreenSetup v9.0: tema escuro "estádio noturno", cards em tela cheia, info completa do clube',
        '🏫 ScreenAcademy v3.0: redesign completo com abas, filtros, projeção de desenvolvimento',
        '📋 ScreenLineup: OVR real (com penalidade de energia), impacto visual por formação (⚔️🛡️)',
        '🗒️ ScreenSquad: contrato expirado com animação pulsante, 4 níveis de alerta por cor',
        '📬 MenuPrincipal: inbox com preview do corpo da mensagem, badge de tipo colorido',
        '📅 ScreenMatches: copa nunca no mesmo dia da liga, pênaltis exibidos no placar (pen. X×Y)',
        '🔧 Fix React #310: useState de táticas movido para fora do if(step===1)',
        '🔧 Fix POS_ORDER: declaração movida para antes de sortPos no ScreenNextMatch',
      ],
    },
    {
      v: 'v6.0', tag: '', color: C.teal,
      title: 'Séries C e D · Orçamentos reais · Economia rebalanceada',
      items: [
        '🏆 Série C e Série D adicionadas — 40 novos times com força, orçamento e estádio reais',
        '💰 Cada time tem orçamento individual no database (Flamengo R$157M, Série D mín. R$10M)',
        '📺 Cota de TV rebalanceada: A=R$400K · B=R$60K · C=R$12K · D=R$6K por rodada',
        '🤝 30+ patrocinadores reais por série (Itaú, Bradesco, Petrobras, Betano, Unimed…)',
        '💸 Folha salarial recalculada por faixa de OVR — jogadores OVR 50 não têm mais salário zero',
        '🎮 Somente Série D permite criar time próprio; A/B/C exigem time existente',
        '🏟️ Seleção de nome de estádio para time criado, com 24 sugestões reais',
        '🖼️ database_branding.js — arquivo dedicado a logos reais e estádios de todos os 80 times',
        '📅 Calendário com datas reais: campeonato aos sábados e domingos, copa às terças/quartas',
        '⚽ Copa do Brasil entra em fases diferentes por série (Série D começa na 1ª Fase)',
      ],
    },
    {
      v: 'v5.0', tag: '', color: C.gold,
      title: 'Transferências · Finanças · Geração de jogadores',
      items: [
        '🔄 ScreenMarket v9: grade de escudos, separação visual de jogadores à venda, slider de negociação',
        '📊 ScreenFinances v7: patrocínio sincronizado, transferências no extrato, estimativas visuais',
        '⚙️ generatePlayer v2: fórmula exponencial de valor, IDs únicos via contador',
        '🌐 teamId propagado no buyPlayer — teamRosters do time vendedor sempre limpo após transferência',
        '📅 ScreenMatches v11: datas reais (sáb/dom), Copa sem conflito de datas, dots de copa',
        '💼 onUpdateWage recalcula club.wage atomicamente; renovação de contrato atualiza contract',
        '🏥 ScreenSquad: badges de lesionados/suspensos no header; PlayerModal com currentRound',
      ],
    },
    {
      v: 'v4.0', tag: '', color: C.blue,
      title: 'Simulação · Campo · Substituições · Fim de temporada',
      items: [
        '🟢 Campo SVG proporcional (160×100) com formações corretas por posição nomeada',
        '⏸️ Pausa na partida sem encerrar o jogo; substituições injetadas na narração ao vivo',
        '🏆 SeasonEndScreen v2 com 3 abas: Resultado, Elenco e Financeiro',
        '📋 ScreenNextMatch bloqueia simulação com jogadores inaptos (lesionados/suspensos)',
        '🔔 Inbox com mensagens de sistema (boas-vindas, alerta salarial, análise de elenco)',
        '📊 ScreenTable dark theme: Top 4 visível, escudos na classificação, 12 times mostrados',
        '🧭 BottomNav com 8 itens incluindo Finanças; MenuPrincipal com card de classificação rico',
        '⚽ Geração de copa automática por temporada; Libertadores/Sul-Americana bloqueadas para C/D',
      ],
    },
    {
      v: 'v3.0', tag: '', color: '#7c3aed',
      title: 'Mercado · Disciplina · Copas · Setup completo',
      items: [
        '🤝 Mercado de transferências com negociação, propostas no inbox e aceitação de venda',
        '🟨 DisciplineEngine: cartões amarelos, suspensões, histórico por jogador',
        '🏆 CupsEngine: Copa do Brasil, Libertadores e Sul-Americana com fases e premiações',
        '⚙️ ScreenSetup v4: seleção de país → série → escudos dos times, 4 passos completos',
        '🎨 Uniforme personalizável com paletas rápidas e preview em tempo real',
        '📋 Perfil do técnico com nacionalidade, estilo de jogo e formação preferida',
        '💊 ScreenMedical: departamento médico com teto de folha por série',
        '💰 Sistema de patrocínios com luvas + valor por rodada; Naming Rights do estádio',
      ],
    },
    {
      v: 'v2.0', tag: '', color: '#334155',
      title: 'Persistência · Live Score · Campo SVG',
      items: [
        '💾 Dexie.js: múltiplos saves, carregamento e exclusão de carreiras',
        '⚽ Campo SVG interativo com feed ao vivo e eventos animados',
        '📈 Motor de simulação com gols, faltas, cartões e substituições da IA',
        '👤 PlayerModal: perfil completo, temporada, camisa, salário e disciplina',
        '🗺️ Seletor tático visual com mini-campo e drag-and-drop de posições',
      ],
    },
    {
      v: 'v1.5', tag: '', color: '#334155',
      title: 'Fundação',
      items: [
        '🌱 Primeira versão jogável com motor round-robin, tabela e rodadas',
        '🎮 Série A com 20 times reais e geração de elencos híbridos',
      ],
    },
  ];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10 }}>
      {/* Botão voltar — aparece quando aberto inline do ScreenBoot */}
      {onBack && (
        <Box onClick={onBack} sx={{
          display: 'flex', alignItems: 'center', gap: 0.7,
          px: 1.5, pt: 3, pb: 0.5, cursor: 'pointer', width: 'fit-content',
          '&:active': { opacity: 0.6 },
        }}>
          <Typography sx={{ color: C.green, fontSize: '1rem', lineHeight: 1 }}>←</Typography>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.7rem' }}>VOLTAR</Typography>
        </Box>
      )}

      {/* ── HERO ── */}
      <Paper sx={{
        p: 3, textAlign: 'center', mb: 2,
        borderRadius: 0,
        background: 'linear-gradient(160deg, #f8fafc 0%, #ffffff 60%, #f4f7f6 100%)',
        borderBottom: `2px solid ${C.border}`,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <svg width="88" height="88" viewBox="0 0 96 96" fill="none">
            <defs>
              <radialGradient id="bg2" cx="38%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#2e7d32"/>
                <stop offset="55%" stopColor="#1b5e20"/>
                <stop offset="100%" stopColor="#0a2e0c"/>
              </radialGradient>
              <radialGradient id="shine2" cx="35%" cy="30%" r="60%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.32)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </radialGradient>
            </defs>
            <ellipse cx="48" cy="90" rx="26" ry="5" fill="rgba(0,0,0,0.18)"/>
            <circle cx="48" cy="47" r="43" fill="url(#bg2)" stroke="#1a3a22" strokeWidth="2.5"/>
            <polygon points="48,22 66,33 66,55 48,66 30,55 30,33" fill="#081a09" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {["48,6 59,14 56,27 40,27 37,14","76,24 85,35 79,47 66,43 65,30",
              "77,70 66,76 55,68 59,55 72,52","48,88 37,80 40,67 56,67 59,80",
              "19,70 24,57 37,55 41,68 30,76","11,35 20,24 33,30 32,43 19,47"]
              .map((pts, i) => React.createElement('polygon', { key: i, points: pts, fill: "#0d2e0f", stroke: "rgba(255,255,255,0.28)", strokeWidth: "1" }))}
            <circle cx="48" cy="47" r="43" fill="url(#shine2)"/>
            <text x="48" y="52" textAnchor="middle" dominantBaseline="middle"
              fontSize="18" fontWeight="900" fill="rgba(255,255,255,0.88)"
              fontFamily="Cinzel, serif" letterSpacing="3">CDB</text>
          </svg>
        </Box>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: '2rem',
          letterSpacing: 3, color: C.green, lineHeight: 1 }}>
          {APP_NAME.toUpperCase()}
        </Typography>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 4, mt: 0.3 }}>
          WEB · {APP_VERSION_LABEL}
        </Typography>
        <Typography sx={{ color: C.txt2, fontSize: '0.78rem', mt: 0.8 }}>
          O seu Football Manager de Bolso
        </Typography>

        {/* Stats do jogo */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.8, mt: 2 }}>
          {[
            { v: '4',    l: 'DIVISÕES' },
            { v: '80',   l: 'TIMES'    },
            { v: '38',   l: 'RODADAS'  },
            { v: 'BETA', l: 'STATUS'   },
          ].map((s,i) => (
            <Box key={i} sx={{ bgcolor: 'rgba(34,197,94,0.08)', border: `1px solid ${C.border}`,
              borderRadius: '8px', py: 0.8 }}>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.42rem', fontWeight: 700, letterSpacing: 0.5 }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>

        {/* Destaque v7 */}
        <Box sx={{ mt: 1.5, bgcolor: `${C.green}10`, border: `1px solid ${C.green}40`, borderRadius: '10px', px: 1.2, py: 0.9 }}>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.5 }}>
            🧩 {APP_VERSION_LABEL} — base reorganizada para facilitar evolução, testes e deploy
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ px: 1.5 }}>

        {/* ── PIX ── */}
        <Paper sx={{ p: 1.8, mb: 2, bgcolor: C.card,
          border: `2px dashed ${C.green}`, borderRadius: '12px' }}>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.82rem', mb: 0.4 }}>
            ☕ Apoie o projeto!
          </Typography>
          <Typography sx={{ color: C.txt2, fontSize: '0.7rem', mb: 1.2 }}>
            Gostou do Tática Manager? Um PIX ajuda muito a continuar o desenvolvimento.
          </Typography>
          <Box sx={{ bgcolor: 'rgba(34,197,94,0.08)', border: `1px solid ${C.border}`,
            borderRadius: '8px', px: 1.2, py: 0.8, mb: 1 }}>
            <Typography sx={{ color: C.green, fontWeight: 700, fontSize: '0.82rem', wordBreak: 'break-all' }}>
              suporte@brasfootweb.com
            </Typography>
          </Box>
          <Button variant="contained" color="success" fullWidth onClick={doCopy}
            sx={{ fontWeight: 900, borderRadius: '8px', py: 1 }}>
            {pixCopied ? '✅ Copiado!' : '📋 Copiar Chave PIX'}
          </Button>
        </Paper>

        {/* ── CHANGELOG ── */}
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.58rem',
          letterSpacing: 1.5, mb: 1 }}>
          📜 HISTÓRICO DE VERSÕES
        </Typography>

        {changelog.map((entry, ei) => {
          const isFirst  = ei === 0;
          const expanded = expandedV === ei || isFirst;
          return (
            <Paper key={ei} sx={{
              mb: 1, bgcolor: C.card, borderRadius: '12px', overflow: 'hidden',
              border: `1px solid ${isFirst ? entry.color + '60' : C.border}`,
            }}>
              <Box onClick={() => !isFirst && setExpandedV(expanded ? null : ei)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  px: 1.4, py: 1,
                  cursor: isFirst ? 'default' : 'pointer',
                  bgcolor: isFirst ? `${entry.color}10` : 'transparent',
                  borderBottom: expanded ? `1px solid ${C.border}` : 'none',
                }}>
                <Box sx={{ bgcolor: entry.color, borderRadius: '6px', px: 0.7, py: 0.2, flexShrink: 0 }}>
                  <Typography sx={{ color: isFirst ? '#000' : '#fff',
                    fontWeight: 900, fontSize: '0.62rem', lineHeight: 1 }}>
                    {entry.v}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.75rem',
                    lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.title}
                  </Typography>
                </Box>
                {entry.tag && (
                  <Box sx={{ bgcolor: `${entry.color}20`, border: `1px solid ${entry.color}50`,
                    borderRadius: '4px', px: 0.6, py: 0.1, flexShrink: 0 }}>
                    <Typography sx={{ color: entry.color, fontWeight: 900, fontSize: '0.5rem' }}>
                      {entry.tag}
                    </Typography>
                  </Box>
                )}
                {!isFirst && (
                  <Typography sx={{ color: C.txt3, fontSize: '0.7rem', flexShrink: 0 }}>
                    {expanded ? '▲' : '▼'}
                  </Typography>
                )}
              </Box>

              {expanded && (
                <Box sx={{ px: 1.4, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {entry.items.map((item, ii) => (
                    <Box key={ii} sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                      <Typography sx={{ fontSize: '0.7rem', lineHeight: 1.5, flexShrink: 0, mt: 0.1 }}>
                        {item.split(' ')[0]}
                      </Typography>
                      <Typography sx={{ color: C.txt2, fontSize: '0.68rem',
                        fontWeight: 700, lineHeight: 1.5, flex: 1 }}>
                        {item.substring(item.indexOf(' ') + 1)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          );
        })}

        {/* ── Rodapé ── */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography sx={{ color: C.txt3, fontSize: '0.62rem', fontWeight: 700 }}>
            Feito com ⚽ e muito café
          </Typography>
          <Typography sx={{ color: C.border, fontSize: '0.52rem', mt: 0.3 }}>
            TÁTICA MANAGER · 2026
          </Typography>
        </Box>

      </Box>
    </Box>
  );
};

export default ScreenAbout;
