export const getCupStatusMeta = (status) => ({
  active: { label: 'EM ANDAMENTO', tone: 'primary' },
  eliminated: { label: 'ELIMINADO', tone: 'danger' },
  champion: { label: '🏆 CAMPEÃO', tone: 'gold' },
}[status] || { label: status || '—', tone: 'neutral' });

export const hasAggregateScore = (tie) => (
  Number.isFinite(tie?.homeAggr) && Number.isFinite(tie?.awayAggr)
);

export const getTieLegRows = (tie) => {
  if (!tie?.leg1) return [];

  const rows = [{
    key: 'leg1',
    label: tie.leg2 ? 'IDA' : 'JOGO ÚNICO',
    round: tie.leg1.round,
    played: Boolean(tie.leg1.played),
    score: tie.leg1.played ? `${tie.leg1.home ?? '?'} – ${tie.leg1.away ?? '?'}` : 'Não jogado',
  }];

  if (tie.leg2) {
    rows.push({
      key: 'leg2',
      label: 'VOLTA',
      round: tie.leg2.round,
      played: Boolean(tie.leg2.played),
      // O card mantém a ordem visual do confronto original (home x away).
      // Na volta, o mando se inverte; por isso o placar também é invertido aqui.
      score: tie.leg2.played ? `${tie.leg2.away ?? '?'} – ${tie.leg2.home ?? '?'}` : 'Não jogado',
    });
  }

  return rows;
};

export const getGroupMatchDisplay = (match) => ({
  leg1Score: match?.leg1?.played
    ? `${match.leg1.home ?? '?'} – ${match.leg1.away ?? '?'}`
    : '—',
  leg2Score: match?.leg2?.played
    ? `${match.leg2.away ?? '?'} – ${match.leg2.home ?? '?'}`
    : '—',
  rounds: `${match?.leg1?.round ?? '?'} / ${match?.leg2?.round ?? '?'}`,
  isUserGame: Boolean(match?.home?.isPlayer || match?.away?.isPlayer),
});

export const getCupByTab = (cups, tab) => ({
  copa: cups?.copaBrasil || null,
  liberta: cups?.libertadores || null,
  sulam: cups?.sulAmericana || null,
}[tab] || null);
