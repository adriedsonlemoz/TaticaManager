import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { getCareerTeamSelectionPatch } from '../src/engines/core/careerCreation.js';

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; console.log(`✅ ${name}`); };

check('splash não usa mais a marca legada Clube de Bolso', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /CLUBE DE|BOLSO/);
  assert.match(html, /id="msm-title">TÁTICA</);
  assert.match(html, /id="msm-subtitle">MANAGER</);
});

check('viewport do app está preparado para safe area nativa', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const nav = fs.readFileSync('src/components/navigation/BottomNavigationBar.jsx', 'utf8');
  assert.match(html, /viewport-fit=cover/);
  assert.match(nav, /safe-area-inset-bottom/);
});

check('ErrorBoundary de emergência não importa MUI nem componentes de domínio', () => {
  const source = fs.readFileSync('src/components/ErrorBoundary.jsx', 'utf8');
  assert.doesNotMatch(source, /@mui\/material|theme\.js|database_branding|JerseyBadge|playerVisuals/);
  assert.match(source, /^import React from 'react';/m);
});

check('stadium metadata existente é usado mesmo sem duplicação em database_coaches', () => {
  const patch = getCareerTeamSelectionPatch('br-manaus');
  assert.equal(patch?.stadiumName, 'Arena da Amazônia');
  const state = getInitialGameState('br-manaus', 'Treinador');
  assert.equal(state.club.stadium.name, 'Arena da Amazônia');
  assert.equal(state.club.stadium.capacity, 43988);
});

console.log(`\n✅ Erros atuais/runtime: ${checks}/${checks} verificações aprovadas.`);
