export const getNextMatchColor = (competition, theme) => {
  if (competition === 'copa_brasil') return '#00695c';
  if (competition === 'libertadores') return '#1a237e';
  if (competition === 'sulamericana') return '#b71c1c';
  return theme.blue;
};

export const getNextMatchPositionAccent = (position) => {
  if (position === 'GOL') return '#f59e0b';
  if (['ZAG', 'LD', 'LE', 'LAT'].includes(position)) return '#3b82f6';
  if (['VOL', 'MC', 'MEI'].includes(position)) return '#22c55e';
  return '#ef4444';
};
