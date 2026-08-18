// @migrated to ES module
// database_branding.js — Logos reais e estádios dos times
// ─────────────────────────────────────────────────────────────────────────────
// ESTRUTURA DE CADA TIME:
//   logo   : URL de imagem (PNG/SVG). Deixe null para usar o escudo SVG gerado.
import React from 'react';
import { getTeamBranding } from './teamBranding.js';
//            Ex: logo: 'https://upload.wikimedia.org/...flamengo.svg'
//   stadium: Nome oficial do estádio
//   city   : Cidade sede
//   capacity: Capacidade oficial
//
// Para adicionar logos reais basta preencher o campo `logo` com a URL pública.
// O TeamIcon usa automaticamente a imagem se disponível, senão gera o escudo SVG.
// ─────────────────────────────────────────────────────────────────────────────

export { teamBrandingExtra } from './teamStadiumData.js';
import { getTeamStadiumData } from './teamStadiumData.js';

// ── Estádios disponíveis para time criado na Série D ──────────────────────────
// O jogador pode escolher um nome para seu estádio entre os nomes reais abaixo,
// ou digitar um nome personalizado.
export const stadiumNameSuggestions = [
  // Nomes genéricos / clássicos do futebol brasileiro
  "Arena Central",       "Estádio Municipal",    "Arena do Povo",
  "Complexo Esportivo",  "Estádio Olímpico",     "Arena da Cidade",
  "Estádio Metropolitano","Arena do Norte",       "Estádio Nacional",
  "Arena Sul-Americana", "Estádio da Vila",      "Arena Esportiva",
  // Nomes com referência geográfica (personalizáveis)
  "Arena Nordeste",      "Estádio da Fronteira", "Arena do Cerrado",
  "Estádio Amazônia",    "Arena Pantaneira",     "Estádio do Vale",
  "Arena Litoral",       "Estádio Planalto",     "Arena do Interior",
  // Nomes honoríficos clássicos
  "Estádio João Pessoa", "Arena Carlos Magno",   "Estádio Pedro Álvares",
  "Arena Tiradentes",    "Estádio Santos Dumont","Arena Zumbi",
];

// ── Helper: retorna branding completo (cores + logo + estádio) ────────────────
export const getTeamBrandingFull = (name) => {
  const base  = getTeamBranding(name) || { primary: '#555', secondary: '#FFF', emoji: '⚽' };
  const extra = getTeamStadiumData(name) || {};
  return { ...base, ...extra };
};

// ── TeamIcon atualizado: usa logo real se disponível ──────────────────────────
export const TeamIcon = ({ name, size = 40 }) => {
  const brand = getTeamBrandingFull(name);

  // Se tiver logo real (URL), renderizar como <img>
  if (brand.logo) {
    return React.createElement('img', {
      src:   brand.logo,
      alt:   name,
      width: size,
      height: size,
      style: { objectFit: 'contain', flexShrink: 0, borderRadius: 4 },
      onError: (e) => { e.target.style.display = 'none'; },
    });
  }

  // Fallback: escudo SVG gerado com as cores do clube
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase().substring(0, 2);
  return React.createElement('svg', {
    width: size, height: size,
    viewBox: '0 0 40 40',
    style: { flexShrink: 0 },
  },
    React.createElement('path', {
      d: 'M20 2 L36 8 L36 22 Q36 32 20 38 Q4 32 4 22 L4 8 Z',
      fill: brand.primary,
      stroke: 'rgba(255,255,255,0.25)',
      strokeWidth: '1',
    }),
    brand.secondary !== '#FFFFFF' && brand.secondary !== brand.primary
      ? React.createElement('path', {
          d: 'M20 2 L36 8 L36 22 Q36 32 20 38 Z',
          fill: brand.secondary,
          opacity: '0.6',
        })
      : null,
    React.createElement('text', {
      x: '20', y: '23',
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      fontSize: initials.length > 1 ? '11' : '14',
      fontWeight: '900',
      fill: '#FFFFFF',
      fontFamily: 'Nunito, sans-serif',
    }, initials)
  );
};
TeamIcon.displayName = 'TeamIcon';
