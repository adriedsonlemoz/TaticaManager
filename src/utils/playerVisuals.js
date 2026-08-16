export const POSITION_COLORS = Object.freeze({
  GOL: '#c8920f',
  ZAG: '#1d4ed8',
  LD: '#0369a1',
  LE: '#0369a1',
  LAT: '#0369a1',
  VOL: '#14532d',
  MC: '#15803d',
  MEI: '#15803d',
  PD: '#9a3412',
  PE: '#9a3412',
  CA: '#b91c1c',
  ATA: '#b91c1c',
});

export const getPositionColor = (position) => POSITION_COLORS[position] || '#374151';

export const posColor = (position) => ({
  bg: getPositionColor(position),
  text: position === 'GOL' ? '#000' : '#fff',
});

export const ovrColor = (overall) => {
  const value = Number(overall) || 0;
  return value >= 80 ? '#32a852' : value >= 70 ? '#b87a00' : '#941818';
};

export const getAgeColor = (age) => {
  const value = Number(age) || 0;
  if (value <= 21) return 'success';
  if (value >= 30) return 'warning';
  return 'primary';
};
