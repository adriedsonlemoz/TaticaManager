export const CAREER_OBJECTIVES = Object.freeze({
  champion: Object.freeze({
    id:'champion', icon:'🏆', label:'Ser Campeão', shortLabel:'Campeão',
    description:'Terminar a competição em 1º lugar.', pressure:'Alta', series:Object.freeze(['A','B','C','D']),
    inboxLabel:'ser campeão',
  }),
  promotion: Object.freeze({
    id:'promotion', icon:'⬆️', label:'Subir de Divisão', shortLabel:'Acesso',
    description:'Conquistar uma das vagas de acesso.', pressure:'Média', series:Object.freeze(['B','C','D']),
    inboxLabel:'subir de divisão',
  }),
  libertadores: Object.freeze({
    id:'libertadores', icon:'🌎', label:'Libertadores', shortLabel:'Libertadores',
    description:'Terminar a Série A na zona de Libertadores.', pressure:'Média', series:Object.freeze(['A']),
    inboxLabel:'chegar à Libertadores',
  }),
  sulamericana: Object.freeze({
    id:'sulamericana', icon:'🌐', label:'Sul-Americana', shortLabel:'Sul-Americana',
    description:'Garantir uma vaga continental pela Série A.', pressure:'Baixa', series:Object.freeze(['A']),
    inboxLabel:'chegar à Sul-Americana',
  }),
  survive: Object.freeze({
    id:'survive', icon:'🛡️', label:'Não Rebaixar', shortLabel:'Permanência',
    description:'Encerrar a temporada fora da zona de rebaixamento.', pressure:'Baixa', series:Object.freeze(['A','B','C']),
    inboxLabel:'não ser rebaixado',
  }),
  midtable: Object.freeze({
    id:'midtable', icon:'📊', label:'Meio da Tabela', shortLabel:'Meio da tabela',
    description:'Fazer uma campanha segura e estável.', pressure:'Baixa', series:Object.freeze(['A','B','C','D']),
    inboxLabel:'terminar no meio da tabela',
  }),
});

export const DEFAULT_CAREER_OBJECTIVE = Object.freeze({
  A:'survive', B:'promotion', C:'promotion', D:'promotion',
});

export function getCareerObjectivesForSerie(serie = 'A') {
  const normalized = String(serie || '').toUpperCase();
  return Object.values(CAREER_OBJECTIVES).filter((objective) => objective.series.includes(normalized));
}

export function getCareerObjective(id) {
  return CAREER_OBJECTIVES[String(id || '')] || null;
}

export function isCareerObjectiveAllowed(id, serie) {
  const objective = getCareerObjective(id);
  return Boolean(objective && objective.series.includes(String(serie || '').toUpperCase()));
}

export function getDefaultCareerObjective(serie = 'A') {
  return DEFAULT_CAREER_OBJECTIVE[String(serie || '').toUpperCase()] || null;
}
