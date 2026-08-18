// @migrated to ES module
// teamBranding.js — Cores primárias/secundárias de todos os times
// Para logos reais e estádios, ver database_branding.js
import React from 'react';
import { resolveClub } from './clubCatalog.js';

export const teamBranding = {

  // ── SÉRIE A ──
  "Flamengo":      { primary: '#E30613', secondary: '#000000' },
  "Palmeiras":     { primary: '#006437', secondary: '#FFFFFF' },
  "Botafogo":      { primary: '#000000', secondary: '#FFFFFF' },
  "Atlético MG":   { primary: '#000000', secondary: '#FFFFFF' },
  "Corinthians":   { primary: '#000000', secondary: '#FFFFFF' },
  "Internacional": { primary: '#E30613', secondary: '#FFFFFF' },
  "São Paulo":     { primary: '#E30613', secondary: '#000000' },
  "Fluminense":    { primary: '#8B0000', secondary: '#006400' },
  "Grêmio":        { primary: '#0068B3', secondary: '#000000' },
  "Fortaleza":     { primary: '#0052A1', secondary: '#E30613' },
  "Cruzeiro":      { primary: '#0038A8', secondary: '#FFFFFF' },
  "Santos":        { primary: '#000000', secondary: '#FFFFFF' },
  "Vasco":         { primary: '#000000', secondary: '#FFFFFF' },
  "Athletico PR":  { primary: '#E30613', secondary: '#000000' },
  "Bahia":         { primary: '#0038A8', secondary: '#E30613' },
  "Bragantino":    { primary: '#E30613', secondary: '#FFFFFF' },
  "Criciúma":      { primary: '#F7B500', secondary: '#00823B' },
  "Juventude":     { primary: '#00823B', secondary: '#FFFFFF' },
  "Cuiabá":        { primary: '#F7B500', secondary: '#00823B' },
  "Atlético GO":   { primary: '#E30613', secondary: '#000000' },

  // ── SÉRIE B ──
  "Sport":         { primary: '#E30613', secondary: '#000000' },
  "Ceará":         { primary: '#000000', secondary: '#FFFFFF' },
  "Goiás":         { primary: '#006437', secondary: '#FFFFFF' },
  "Coritiba":      { primary: '#006437', secondary: '#FFFFFF' },
  "Avaí":          { primary: '#0038A8', secondary: '#FFFFFF' },
  "Paysandu":      { primary: '#0038A8', secondary: '#FFFFFF' },
  "Mirassol":      { primary: '#F7B500', secondary: '#000000' },
  "Operário PR":   { primary: '#000000', secondary: '#FFFFFF' },
  "Guarani":       { primary: '#00823B', secondary: '#FFFFFF' },
  "Ponte Preta":   { primary: '#000000', secondary: '#FFFFFF' },
  "Chapecoense":   { primary: '#006437', secondary: '#FFFFFF' },
  "Vila Nova":     { primary: '#E30613', secondary: '#000000' },
  "Botafogo SP":   { primary: '#000000', secondary: '#FFFFFF' },
  "Amazonas":      { primary: '#F7B500', secondary: '#000000' },
  "CRB":           { primary: '#E30613', secondary: '#000000' },
  "Sampaio Corrêa":{ primary: '#0038A8', secondary: '#E30613' },
  "Tombense":      { primary: '#000000', secondary: '#F7B500' },
  "ABC":           { primary: '#E30613', secondary: '#000000' },
  "Ferroviária":   { primary: '#E30613', secondary: '#000000' },
  "Novorizontino": { primary: '#E30613', secondary: '#000000' },

  // ── SÉRIE C ──
  "Londrina":      { primary: '#003087', secondary: '#FFFFFF' },
  "Figueirense":   { primary: '#000000', secondary: '#FFFFFF' },
  "CSA":           { primary: '#0038A8', secondary: '#FFFFFF' },
  "Náutico":       { primary: '#E30613', secondary: '#FFFFFF' },
  "Remo":          { primary: '#0038A8', secondary: '#FFFFFF' },
  "Brusque":       { primary: '#003087', secondary: '#FFFFFF' },
  "Botafogo PB":   { primary: '#000000', secondary: '#FFFFFF' },
  "Ituano":        { primary: '#006437', secondary: '#FFFFFF' },
  "Athletic Club": { primary: '#E30613', secondary: '#000000' },
  "Ferroviário":   { primary: '#E30613', secondary: '#000000' },
  "Volta Redonda": { primary: '#E30613', secondary: '#000000' },
  "Atlético AC":   { primary: '#E30613', secondary: '#FFFFFF' },
  "Floresta":      { primary: '#006437', secondary: '#FFFFFF' },
  "São Bernardo":  { primary: '#0038A8', secondary: '#FFFFFF' },
  "Confiança":     { primary: '#0038A8', secondary: '#FFFFFF' },
  "Maringá":       { primary: '#006437', secondary: '#000000' },
  "Caxias":        { primary: '#006437', secondary: '#FFFFFF' },
  "Campinense":    { primary: '#E30613', secondary: '#000000' },
  "Aparecidense":  { primary: '#006437', secondary: '#FFFFFF' },
  "Náutico AM":    { primary: '#E30613', secondary: '#FFFFFF' },

  // ── SÉRIE D ──
  "Dom Bosco":     { primary: '#0038A8', secondary: '#FFFFFF' },
  "Hercílio Luz":  { primary: '#E30613', secondary: '#FFFFFF' },
  "Trem":          { primary: '#006437', secondary: '#FFFFFF' },
  "GAS Rolim":     { primary: '#E30613', secondary: '#000000' },
  "Real Noroeste": { primary: '#006437', secondary: '#FFFFFF' },
  "Tocantinópolis":{ primary: '#0038A8', secondary: '#FFFFFF' },
  "Pouso Alegre":  { primary: '#006437', secondary: '#FFFFFF' },
  "Sergipe":       { primary: '#E30613', secondary: '#000000' },
  "Atlético MS":   { primary: '#000000', secondary: '#F7B500' },
  "Porto Velho":   { primary: '#E30613', secondary: '#000000' },
  "Treze":         { primary: '#006437', secondary: '#FFFFFF' },
  "Souza":         { primary: '#E30613', secondary: '#000000' },
  "Ceilandia":     { primary: '#0038A8', secondary: '#FFFFFF' },
  "Moto Club":     { primary: '#E30613', secondary: '#000000' },
  "Genus":         { primary: '#000000', secondary: '#F7B500' },
  "Manaus":        { primary: '#0038A8', secondary: '#FFFFFF' },
  "Iguatu":        { primary: '#006437', secondary: '#FFFFFF' },
  "Nacional AM":   { primary: '#E30613', secondary: '#000000' },
  "Humaitá":       { primary: '#006437', secondary: '#FFFFFF' },
  "Plácido Castro":{ primary: '#E30613', secondary: '#FFFFFF' },
  // ── CLUBES 2026 ADICIONAIS / NOMES CANÔNICOS ──
  "Vitória":             { primary: '#E30613', secondary: '#000000' },
  "América-MG":          { primary: '#006437', secondary: '#FFFFFF' },
  "Anápolis":            { primary: '#0057A8', secondary: '#FFFFFF' },
  "Barra-SC":            { primary: '#0038A8', secondary: '#F7B500' },
  "Inter de Limeira":    { primary: '#000000', secondary: '#FFFFFF' },
  "Itabaiana":           { primary: '#0038A8', secondary: '#E30613' },
  "Maranhão":            { primary: '#E30613', secondary: '#F7B500' },
  "Santa Cruz":          { primary: '#E30613', secondary: '#000000' },
  "Ypiranga-RS":         { primary: '#006437', secondary: '#F7B500' },
  "Gama":                { primary: '#006437', secondary: '#FFFFFF' },
  "Uberlândia":          { primary: '#006437', secondary: '#FFFFFF' },
  "ASA":                 { primary: '#000000', secondary: '#FFFFFF' },
  "São José-RS":         { primary: '#0038A8', secondary: '#FFFFFF' },
  "Goiatuba":            { primary: '#0038A8', secondary: '#FFFFFF' },
  "Luverdense":          { primary: '#006437', secondary: '#FFFFFF' },
  "Portuguesa-SP":       { primary: '#E30613', secondary: '#006437' },
  "São Luiz-RS":         { primary: '#E30613', secondary: '#FFFFFF' },
  "Cianorte":            { primary: '#F7B500', secondary: '#000000' },
  "América-RN":          { primary: '#E30613', secondary: '#FFFFFF' },

};

const brandCandidates = (name) => {
  const club = resolveClub(name);
  return club ? [club.name, ...(club.aliases || []), name] : [name];
};

export const getTeamBranding = (name) => {
  for (const key of brandCandidates(name)) {
    if (teamBranding[key]) return teamBranding[key];
  }
  return { primary: '#374151', secondary: '#FFFFFF' };
};

export const TeamIcon = ({ name, size = 40 }) => {
  const brand = getTeamBranding(name);
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase().substring(0, 2);
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 40 40', style: { flexShrink: 0 },
  },
    React.createElement('path', {
      d: 'M20 2 L36 8 L36 22 Q36 32 20 38 Q4 32 4 22 L4 8 Z',
      fill: brand.primary, stroke: 'rgba(255,255,255,0.25)', strokeWidth: '1',
    }),
    brand.secondary !== '#FFFFFF' && brand.secondary !== brand.primary
      ? React.createElement('path', {
          d: 'M20 2 L36 8 L36 22 Q36 32 20 38 Z',
          fill: brand.secondary, opacity: '0.6',
        })
      : null,
    React.createElement('text', {
      x: '20', y: '23', textAnchor: 'middle', dominantBaseline: 'middle',
      fontSize: initials.length > 1 ? '11' : '14',
      fontWeight: '900', fill: '#FFFFFF', fontFamily: 'Nunito, sans-serif',
    }, initials)
  );
};
TeamIcon.displayName = 'TeamIcon';
