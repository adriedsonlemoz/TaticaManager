// utils/matchDateUtils.js — v2.0
// ─────────────────────────────────────────────────────────────────
// Utilitários de data/hora compartilhados para exibir quando cada
// jogo acontece. Mesma lógica do ScreenMatches v2, mas exportável.
//
// Regras:
//   • Campeonato: Sáb/Qua alternados a partir de 04/abr/2026 (gap 3–4d)
//       Sáb(+4d)→Qua(+3d)→Sáb → nunca dois fins de semana seguidos
//   • Copa: dia útil livre ENTRE rodada anterior e rodada seguinte
//   • Horários:
//       Liga sábado  → 18h30 ou 20h00 (50/50)
//       Liga quarta  → 19h00 ou 21h30 (50/50)
//       Copa         → 19h30 ou 21h30 (50/50)
// ─────────────────────────────────────────────────────────────────

export const SEASON_START = new Date(2026, 3, 4); // Sáb 04/abr/2026

const MONTH_PT    = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const WEEKDAY_PT  = ['dom','seg','ter','qua','qui','sex','sáb'];
const WEEKDAY_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

// ── Gera array de datas das rodadas: Sáb/Qua alternados, gap 3–4d ─
export const buildRoundDates = (totalRounds) => {
  const dates = [];
  let cur = new Date(SEASON_START);
  for (let r = 0; r < totalRounds; r++) {
    dates.push(new Date(cur));
    cur = new Date(cur);
    const dow = cur.getDay();
    if (dow === 6) cur.setDate(cur.getDate() + 4); // sáb → qua
    else if (dow === 3) cur.setDate(cur.getDate() + 3); // qua → sáb
    else cur.setDate(cur.getDate() + 3);
  }
  return dates;
};

// ── Data de um jogo de copa ────────────────────────────────────────
// afterLeagueIdx: índice 1-based da rodada de liga (ex: 4 = após 4ª rodada)
// Copa ocorre ENTRE leagueRoundDates[afterLeagueIdx-1] e leagueRoundDates[afterLeagueIdx]
export const getCupDate = (leagueRoundDates, afterLeagueIdx) => {
  const prevLeague = leagueRoundDates[afterLeagueIdx - 1];
  const nextLeague = leagueRoundDates[afterLeagueIdx];
  const occupied   = new Set(leagueRoundDates.map(d => d?.toDateString()));

  if (prevLeague && nextLeague) {
    const gap = Math.round((nextLeague - prevLeague) / (1000 * 60 * 60 * 24));
    for (let back = 1; back < gap; back++) {
      const c = new Date(nextLeague); c.setDate(c.getDate() - back);
      const d = c.getDay();
      if (d >= 1 && d <= 5 && !occupied.has(c.toDateString())) return c;
    }
  }
  // Pós-temporada: copa depois da última rodada
  if (prevLeague && !nextLeague) {
    for (let fwd = 2; fwd <= 7; fwd++) {
      const c = new Date(prevLeague); c.setDate(c.getDate() + fwd);
      const d = c.getDay();
      if (d >= 1 && d <= 5 && !occupied.has(c.toDateString())) return c;
    }
  }
  if (prevLeague) { const f = new Date(prevLeague); f.setDate(f.getDate() + 2); return f; }
  return null;
};

// ── Horário do jogo ────────────────────────────────────────────────
// Usa o índice do slot como semente determinística (mesmo horário toda vez)
export const getMatchTime = (isCup, slotIndex, leagueRoundDate) => {
  const seed = (slotIndex ?? 0) % 2;
  if (isCup) return seed === 0 ? '19h30' : '21h30';
  const dow = leagueRoundDate ? leagueRoundDate.getDay() : 6;
  // Padrão Sáb/Qua: 6=sáb, 3=qua
  if (dow === 6) return seed === 0 ? '18h30' : '20h00'; // sábado
  if (dow === 3) return seed === 0 ? '19h00' : '21h30'; // quarta
  return seed === 0 ? '19h00' : '21h00'; // fallback
};

// ── Formata a data como string curta ─────────────────────────────
// Ex: "sáb, 11 abr" | "ter, 14 abr"
export const formatMatchDate = (date, includeYear = false) => {
  if (!date) return '';
  const wd = WEEKDAY_PT[date.getDay()];
  const d  = date.getDate();
  const m  = MONTH_PT[date.getMonth()];
  return includeYear
    ? `${wd}, ${d} ${m} ${date.getFullYear()}`
    : `${wd}, ${d} ${m}`;
};

// ── Formata data + hora juntos ─────────────────────────────────────
// Ex: "sáb, 11 abr · 18h30"
export const formatMatchDateTime = (date, time) => {
  if (!date) return '';
  return `${formatMatchDate(date)} · ${time}`;
};

// ── Resolve data e hora do jogo a partir do gameData ──────────────
// Retorna { date, time, dateStr, timeStr, fullStr }
export const resolveMatchInfo = (gameData, slotIndex) => {
  const calendar  = gameData?.calendar || [];
  const round     = slotIndex ?? gameData?.round ?? 0;
  const entry     = calendar[round];
  const fixtures  = gameData?.fixtures || [];
  const totalRounds = fixtures.length;
  const roundDates  = buildRoundDates(totalRounds);

  let date, time, isCup;

  if (entry?.type === 'cup') {
    isCup = true;
    const afterLeague = entry.afterLeague ?? 0;
    date  = getCupDate(roundDates, afterLeague);
    time  = getMatchTime(true, round, null);
  } else {
    isCup = false;
    const li = entry?.leagueIdx ?? round;
    date     = roundDates[li] || null;
    time     = getMatchTime(false, round, date);
  }

  return {
    date,
    time,
    isCup,
    dateStr:  formatMatchDate(date),
    timeStr:  time,
    fullStr:  formatMatchDateTime(date, time),
    fullStrWithYear: date ? `${formatMatchDate(date, true)} · ${time}` : '',
  };
};
