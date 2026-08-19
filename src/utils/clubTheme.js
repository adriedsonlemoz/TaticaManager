import { getTeamBranding } from '../data/teamBranding.js';

const valid = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
const rgb = (hex) => {
  const value = (valid(hex) ? hex : '#16a34a').slice(1);
  return [0,2,4].map((i) => parseInt(value.slice(i, i + 2), 16));
};
const toHex = (values) => `#${values.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2,'0')).join('')}`;
export const mixClubColor = (a, b, amount=.5) => {
  const ar=rgb(a), br=rgb(b), t=Math.max(0,Math.min(1,amount));
  return toHex(ar.map((value,index)=>value+((br[index]-value)*t)));
};
export const colorLuminance = (hex) => {
  const c=rgb(hex).map((value)=>{ const v=value/255; return v<=.03928 ? v/12.92 : ((v+.055)/1.055)**2.4; });
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
};
export const getClubAccent = (clubName, fallback='#16a34a') => {
  const brand=getTeamBranding(clubName);
  const primary=valid(brand.primary) ? brand.primary : fallback;
  return colorLuminance(primary) > .72 ? mixClubColor(primary,'#000000',.42) : primary;
};
export const getClubAccentTheme = (base, clubName) => {
  const primary=getClubAccent(clubName, base?.primary || '#16a34a');
  return {
    ...base,
    primary,
    primaryDim:mixClubColor(primary,'#000000',.22),
    act:primary,
    borderBright:primary,
    clubTint:mixClubColor(primary,'#ffffff',.93),
    clubBorder:mixClubColor(primary,'#ffffff',.80),
  };
};
