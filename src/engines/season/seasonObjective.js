const OBJECTIVE_LABELS = Object.freeze({
  champion: 'Ser campeão',
  top4: 'Top 4',
  promotion: 'Subir de divisão',
  libertadores: 'Classificar à Libertadores',
  sulamericana: 'Classificar à Sul-Americana',
  survive: 'Não ser rebaixado',
  midtable: 'Meio da tabela',
});

const failMessage = (label, position, detail) => (
  `Objetivo: ${label.toUpperCase()}. Você terminou em ${position}º.${detail ? ` ${detail}` : ''}`
);

export function evaluateSeasonObjective({ objective = 'survive', serie = 'A', position = 0 } = {}) {
  const pos = Number(position) || 0;
  const label = OBJECTIVE_LABELS[objective] || 'Objetivo da temporada';

  // Objetivos continentais e de acesso só são oferecidos nas séries compatíveis.
  // Em saves antigos que carreguem um objetivo incompatível para a nova divisão,
  // tratamos como não aplicável para não demitir o técnico injustamente.
  if (objective === 'promotion' && serie === 'A') {
    return { objective, label, applicable: false, success: true, position: pos, message: null };
  }
  if (['libertadores', 'sulamericana'].includes(objective) && serie !== 'A') {
    return { objective, label, applicable: false, success: true, position: pos, message: null };
  }

  let success = true;
  let requirement = '';

  switch (objective) {
    case 'champion':
      success = pos === 1;
      requirement = 'Era necessário terminar em 1º.';
      break;
    case 'top4': // compatibilidade com saves antigos
    case 'promotion':
      success = pos > 0 && pos <= 4;
      requirement = 'Era necessário terminar no G4.';
      break;
    case 'libertadores':
      success = pos > 0 && pos <= 6;
      requirement = 'Era necessário terminar no G6.';
      break;
    case 'sulamericana':
      // Um G6 é um resultado superior à Sul-Americana e também cumpre a meta.
      success = pos > 0 && pos <= 12;
      requirement = 'Era necessário terminar no Top 12.';
      break;
    case 'midtable':
      // Resultado melhor que 7º não deve ser punido; 14º é o piso da meta.
      success = pos > 0 && pos <= 14;
      requirement = 'Era necessário terminar até a 14ª posição.';
      break;
    case 'survive':
    default:
      success = pos > 0 && pos < 17;
      requirement = 'Era necessário ficar fora do Z4.';
      break;
  }

  return {
    objective,
    label,
    applicable: true,
    success,
    position: pos,
    requirement,
    message: success ? null : failMessage(label, pos || '—', requirement),
  };
}

export { OBJECTIVE_LABELS };
