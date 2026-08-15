// main.jsx — Vite entry point
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { pergaminhoTheme } from './theme.js';

// Shim: expose engines globally for legacy window.X reads in components
import { THEME } from './theme.js';
import { DisciplineEngine } from './engines/engine_discipline.js';
import { FatigueEngine } from './engines/engine_fatigue.js';
import { InjuryEngine } from './engines/engine_injuries.js';
import { AcademyEngine } from './engines/engine_academy.js';
import { SoundEngine } from './engines/engine_sound.js';
import { CupsEngine } from './engines/cups_engine.js';
import { CalendarEngine } from './engines/CalendarEngine.js';
import { CpuAI } from './engines/engine_cpu_ai.js';
import { TeamIcon, teamBrandingExtra, getTeamBrandingFull } from './data/database_branding.js';
import { diexDatabase } from './data/database.js';
import './data/database_extra.js'; // estende diexDatabase com copaBrasilExtras e conmebolTeams
import { realPlayers } from './data/realPlayers.js';
import { teamBranding, getTeamBranding } from './data/teamBranding.js';
import { clubsDatabase } from './data/database_clubs.js';
import { coachesDatabase, getTeamCoach, getTeamStadium } from './data/database_coaches.js';
import {
  JerseyBadge, posColor, ovrColor, getLineupValidation, calculateMorale,
  processFatigueAndInjuries, SMR_parseEvent, FORMATION_SLOTS,
} from './helpers.js';
import {
  generateNextSeason, sortLeagueTable, calcTeamRecentForm,
  calcCPUAvailableStrength, generatePlayer, generateSquad, getInitialGameState,
} from './engines/engine.js';

window.THEME                    = THEME;
window.DisciplineEngine         = DisciplineEngine;
window.FatigueEngine            = FatigueEngine;
window.InjuryEngine             = InjuryEngine;
window.AcademyEngine            = AcademyEngine;
window.SoundEngine              = SoundEngine;
window.CupsEngine               = CupsEngine;
window.CalendarEngine           = CalendarEngine;
window.CpuAI                    = CpuAI;
window.TeamIcon                 = TeamIcon;
window.diexDatabase             = diexDatabase;
window.realPlayers              = realPlayers;
window.teamBranding             = teamBranding;
window.teamBrandingExtra        = teamBrandingExtra;
window.getTeamBranding          = getTeamBranding;
window.getTeamBrandingFull      = getTeamBrandingFull;
window.clubsDatabase            = clubsDatabase;
window.coachesDatabase          = coachesDatabase;
window.getTeamCoach             = getTeamCoach;
window.getTeamStadium           = getTeamStadium;
window.JerseyBadge              = JerseyBadge;
window.posColor                 = posColor;
window.ovrColor                 = ovrColor;
window.getLineupValidation      = getLineupValidation;
window.calculateMorale          = calculateMorale;
window.processFatigueAndInjuries = processFatigueAndInjuries;
window.SMR_parseEvent           = SMR_parseEvent;
window.FORMATION_SLOTS          = FORMATION_SLOTS;
window.generateNextSeason       = generateNextSeason;
window.sortLeagueTable          = sortLeagueTable;
window.calcTeamRecentForm       = calcTeamRecentForm;
window.calcCPUAvailableStrength = calcCPUAvailableStrength;
window.generatePlayer           = generatePlayer;
window.generateSquad            = generateSquad;
window.getInitialGameState      = getInitialGameState;

import Game from './app.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './style.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={pergaminhoTheme}>
    <CssBaseline />
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  </ThemeProvider>
);
