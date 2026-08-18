export function getMoraleMultiplier(morale) {
  const value = morale ?? 60;
  if (value >= 85) return 1.08;
  if (value >= 70) return 1.04;
  if (value >= 55) return 1.00;
  if (value >= 40) return 0.96;
  if (value >= 25) return 0.92;
  return 0.87;
}
