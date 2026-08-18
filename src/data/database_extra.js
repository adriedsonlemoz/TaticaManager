// @migrated to ES module
// Extensões do diexDatabase (times da Copa do Brasil e Conmebol)
import { diexDatabase } from './database.js';

diexDatabase.copaBrasilExtras = [
  ...(diexDatabase.serieCTeams || []),
  ...(diexDatabase.serieDTeams || []).slice(0, 4),
].map((team) => ({ id:team.id, name:team.name, strength:team.strength }));

diexDatabase.conmebolTeams = [
  { id:"arg1", name:"River Plate",    strength:88, country:"🇦🇷" },
  { id:"arg2", name:"Boca Juniors",   strength:86, country:"🇦🇷" },
  { id:"arg3", name:"Racing Club",    strength:83, country:"🇦🇷" },
  { id:"arg4", name:"San Lorenzo",    strength:80, country:"🇦🇷" },
  { id:"arg5", name:"Independiente",  strength:79, country:"🇦🇷" },
  { id:"arg6", name:"Estudiantes",    strength:78, country:"🇦🇷" },
  { id:"uru1", name:"Nacional",       strength:81, country:"🇺🇾" },
  { id:"uru2", name:"Peñarol",        strength:80, country:"🇺🇾" },
  { id:"par1", name:"Olimpia",        strength:78, country:"🇵🇾" },
  { id:"par2", name:"Cerro Porteño",  strength:77, country:"🇵🇾" },
  { id:"chi1", name:"Colo-Colo",      strength:80, country:"🇨🇱" },
  { id:"chi2", name:"U. de Chile",    strength:77, country:"🇨🇱" },
  { id:"ecu1", name:"LDU Quito",      strength:79, country:"🇪🇨" },
  { id:"ecu2", name:"Barcelona SC",   strength:77, country:"🇪🇨" },
  { id:"per1", name:"Alianza Lima",   strength:75, country:"🇵🇪" },
  { id:"per2", name:"Universitario",  strength:74, country:"🇵🇪" },
  { id:"bol1", name:"Bolívar",        strength:74, country:"🇧🇴" },
  { id:"bol2", name:"The Strongest",  strength:73, country:"🇧🇴" },
  { id:"col1", name:"Millonarios",    strength:76, country:"🇨🇴" },
  { id:"col2", name:"Atlético Nac.", strength:78, country:"🇨🇴" },
  { id:"ven1", name:"Caracas FC",     strength:71, country:"🇻🇪" },
  { id:"ven2", name:"Monagas",        strength:70, country:"🇻🇪" },
];
