// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import JerseyBadge from './player/JerseyBadge.jsx';
import { posColor, ovrColor } from '../utils/playerVisuals.js';

// components/ScreenStadium.js — v6.0 (Obras com prazo, progresso visual)
const ScreenStadium = ({ gameData, setGameData, formatMoney, showToast }) => {
  const [tab,           setTab]           = React.useState('overview');
  const [ticketPrice,   setTicketPrice]   = React.useState(gameData.club.stadium?.ticketPrice || 40);
  const [ticketDirty,   setTicketDirty]   = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [newName,       setNewName]       = React.useState(gameData.club.stadium?.name || '');
  const C = THEME;

  const stad = gameData.club.stadium || {}; const money = gameData.club.money || 0;
  const capacity = stad.capacity || 10000; const level = stad.level || 1;
  const upg = gameData.club.upgrades || {};
  // Obras em andamento (novo sistema com prazo de rodadas)
  const underConstruction = stad.underConstruction || 0;
  const pendingCapacity   = stad.pendingCapacity   || 0;
  const constructionPct   = underConstruction > 0 ? Math.round(((4 - underConstruction) / 4) * 100) : 0;

  const ticketPenalty    = ticketPrice > 80 ? 0.7 : ticketPrice < 20 ? 1.15 : 1;
  const avgOccupancy     = Math.min(99, Math.round((0.65 + (upg.amenities||0)*0.05) * ticketPenalty * 100));
  const projectedRevenue = Math.floor(capacity * (avgOccupancy/100) * ticketPrice);
  const fanSatisf        = Math.min(99, 60 + (upg.vip||0)*6 + (upg.amenities||0)*5 + (ticketPrice<50?12:ticketPrice>100?-8:0));
  const atmosphere       = Math.min(99, 50 + Math.floor(capacity/4000)*4 + (upg.vip||0)*5);
  const repPoints        = Math.min(10, level + (upg.training||0) + (upg.academy||0));
  const upgradeCost      = Math.floor(capacity * 180 * level);

  const TABS = [{ id:'overview',label:'Visão Geral',icon:'stadium'},{id:'tickets',label:'Ingressos',icon:'confirmation_number'},{id:'upgrade',label:'Melhorias',icon:'construction'}];

  const saveTicketPrice = () => { setGameData(prev=>({...prev,club:{...prev.club,stadium:{...prev.club.stadium,ticketPrice}}})); setTicketDirty(false); showToast(`Ingresso: ${formatMoney(ticketPrice)}!`,'success'); };
  const saveName = () => { if(!newName.trim())return; setGameData(prev=>({...prev,club:{...prev.club,stadium:{...prev.club.stadium,name:newName.trim()}}})); setIsEditingName(false); showToast('Nome atualizado!','success'); };
  const sellAds = () => { const cd=stad.adCooldown||0, round=gameData.round||0; if(round<cd)return showToast(`Disponível Rod ${cd}`,'warning'); const val=Math.floor(capacity*55+repPoints*80000); setGameData(prev=>({...prev,club:{...prev.club,money:prev.club.money+val,stadium:{...prev.club.stadium,adCooldown:round+5}},financialHistory:[{round,income:val,expense:0,total:val,detail:{description:'Publicidade Estádio'}},...(prev.financialHistory||[])].slice(0,30)})); showToast(`Anúncios: ${formatMoney(val)}!`,'success'); };
  const startUpgrade = () => {
    if (underConstruction > 0) return showToast(`🏗️ Obras em andamento! Conclusão em ${underConstruction} rodada${underConstruction>1?'s':''}.`,'warning');
    if (money < upgradeCost) return showToast('Verba insuficiente!','error');
    // Bug #2 fix: usa apenas o sistema de underConstruction (sem animação local)
    setGameData(prev=>({
      ...prev,
      club:{...prev.club,
        money:prev.club.money-upgradeCost,
        stadium:{...prev.club.stadium,
          underConstruction:4,
          pendingCapacity:Math.floor(capacity*0.25),
          pendingLevel:(prev.club.stadium?.level||1)+1,
        }
      },
      financialHistory:[{round:prev.round,income:0,expense:upgradeCost,total:-upgradeCost,detail:{description:'Obras: Expansão do Estádio (em andamento)'}},...(prev.financialHistory||[])].slice(0,30)
    }));
    showToast(`🏗️ Obras iniciadas! +${Math.floor(capacity*0.25).toLocaleString('pt-BR')} lugares em 4 rodadas.`,'success');
  };

  const StatBar = ({label,value,max=100,color=C.green}) => ( <Box sx={{mb:1.1}}><Box sx={{display:'flex',justifyContent:'space-between',mb:0.35}}><Typography sx={{color:C.txt3,fontSize:'0.6rem',fontWeight:700}}>{label}</Typography><Typography sx={{color,fontWeight:900,fontSize:'0.72rem'}}>{value}{max===100?'%':`/${max}`}</Typography></Box><Box sx={{height:5,bgcolor:C.cardAlt,borderRadius:2,overflow:'hidden'}}><Box sx={{height:'100%',width:`${(value/max)*100}%`,bgcolor:color,borderRadius:2,transition:'width 0.5s'}}/></Box></Box> );

  return (
    <Box sx={{bgcolor:C.bg,minHeight:'100vh',pb:10,background:`radial-gradient(ellipse at 50% 0%, #dcfce7 0%, transparent 40%), ${C.bg}`}}>
      {/* Hero */}
      <Box sx={{background:`linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,borderBottom:`1px solid ${C.border}`,px:1.5,pt:3.8,pb:2}}>
        <Box sx={{display:'flex',alignItems:'center',gap:1.5,mb:1.5}}>
          <Box sx={{width:56,height:56,borderRadius:'14px',flexShrink:0,background:C.bgDark,border:`1.5px solid ${C.borderG}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 8px ${C.shadow}`}}>
            <Typography sx={{fontSize:'2rem',lineHeight:1}}>🏟️</Typography>
          </Box>
          <Box sx={{flex:1,minWidth:0}}>
            {isEditingName ? (
              <Box sx={{display:'flex',gap:0.8,alignItems:'center'}}>
                <input value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1,background:C.bgCardAlt,border:`1.5px solid ${C.green}`,borderRadius:8,color:C.txt1,fontWeight:900,fontSize:'0.9rem',padding:'6px 10px',fontFamily:'Nunito',outline:'none'}}/>
                <Button onClick={saveName} sx={{bgcolor:C.green,color:'#fff',fontWeight:900,px:1.2,py:0.5,borderRadius:'6px',minWidth:0,fontSize:'0.7rem'}}>✓</Button>
                <Button onClick={()=>setIsEditingName(false)} sx={{color:C.txt3,px:1,py:0.5,borderRadius:'6px',minWidth:0,fontSize:'0.7rem'}}>✕</Button>
              </Box>
            ) : (
              <Box sx={{display:'flex',alignItems:'center',gap:0.8}}>
                <Typography sx={{color:C.txt1,fontWeight:900,fontSize:'1.05rem',fontFamily:'"Nunito",sans-serif',flex:1,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{stad.name||`Arena ${gameData.club.name}`}</Typography>
                <Box onClick={()=>{setNewName(stad.name||'');setIsEditingName(true);}} sx={{cursor:'pointer',p:0.4}}><span className="material-icons" style={{color:C.txt3,fontSize:'1rem'}}>edit</span></Box>
              </Box>
            )}
            <Typography sx={{color:C.txt3,fontSize:'0.65rem',fontWeight:700,mt:0.2}}>{gameData.club.name} · Nível {level}</Typography>
          </Box>
        </Box>
        <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:0.8}}>
          {[{l:'CAPACIDADE',v:capacity.toLocaleString('pt-BR'),icon:'👥',color:C.green},{l:'NÍVEL',v:`${level}/10`,icon:'⭐',color:C.yellow},{l:'ATMOSFERA',v:`${atmosphere}%`,icon:'🔊',color:C.blue}].map((s,i)=>(
            <Box key={i} sx={{bgcolor:C.card,border:`1px solid ${C.border}`,borderRadius:'10px',p:1,textAlign:'center'}}>
              <Typography sx={{fontSize:'1.1rem',lineHeight:1,mb:0.2}}>{s.icon}</Typography>
              <Typography sx={{color:s.color,fontWeight:900,fontSize:'0.88rem',lineHeight:1}}>{s.v}</Typography>
              <Typography sx={{color:C.txt3,fontSize:'0.48rem',fontWeight:700,letterSpacing:0.3}}>{s.l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{display:'flex',bgcolor:C.card,borderBottom:`1px solid ${C.border}`}}>
        {TABS.map(t=>(
          <Box key={t.id} onClick={()=>setTab(t.id)} sx={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:0.2,py:0.9,cursor:'pointer',borderBottom:`2.5px solid ${tab===t.id?C.green:'transparent'}`,bgcolor:tab===t.id?'rgba(34,197,94,0.05)':'transparent',transition:'all 0.15s'}}>
            <span className="material-icons" style={{color:tab===t.id?C.green:C.txt3,fontSize:'1.1rem'}}>{t.icon}</span>
            <Typography sx={{color:tab===t.id?C.green:C.txt3,fontWeight:900,fontSize:'0.52rem',letterSpacing:0.4}}>{t.label.toUpperCase()}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{px:1.5,pt:1.5}}>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <Box>
            {/* Banner de obras em andamento */}
            {underConstruction > 0 && (
              <Box sx={{bgcolor:`${C.gold}10`,border:`1.5px solid ${C.gold}60`,borderRadius:'12px',p:1.3,mb:1.2}}>
                <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',mb:0.8}}>
                  <Box sx={{display:'flex',alignItems:'center',gap:0.7}}>
                    <Typography sx={{fontSize:'1.2rem',lineHeight:1}}>🏗️</Typography>
                    <Box>
                      <Typography sx={{color:C.gold,fontWeight:900,fontSize:'0.72rem'}}>OBRAS EM ANDAMENTO</Typography>
                      <Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:700}}>
                        +{pendingCapacity.toLocaleString('pt-BR')} lugares · {underConstruction} rodada{underConstruction>1?'s':''} restante{underConstruction>1?'s':''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{bgcolor:`${C.gold}20`,borderRadius:'8px',px:0.8,py:0.4,textAlign:'center'}}>
                    <Typography sx={{color:C.gold,fontWeight:900,fontSize:'0.82rem',lineHeight:1}}>{constructionPct}%</Typography>
                    <Typography sx={{color:C.txt3,fontSize:'0.44rem',fontWeight:700}}>concluído</Typography>
                  </Box>
                </Box>
                <Box sx={{height:6,bgcolor:C.border,borderRadius:3,overflow:'hidden'}}>
                  <Box sx={{height:'100%',width:`${constructionPct}%`,bgcolor:C.gold,borderRadius:3,transition:'width 0.5s',boxShadow:`0 0 8px ${C.gold}60`}}/>
                </Box>
              </Box>
            )}
            <Box sx={{bgcolor:C.card,border:`1.5px solid ${C.borderG}`,borderRadius:'14px',p:1.5,mb:1.2,background:`linear-gradient(135deg,rgba(34,197,94,0.06) 0%,${C.card} 60%)`}}>
              <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',mb:1}}>
                <Box><Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:700,letterSpacing:0.5}}>RECEITA PROJETADA / JOGO</Typography><Typography sx={{color:C.green,fontWeight:900,fontSize:'1.4rem',lineHeight:1.1}}>{formatMoney(projectedRevenue)}</Typography></Box>
                <Box sx={{textAlign:'right'}}><Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:700}}>INGRESSO</Typography><Typography sx={{color:C.txt1,fontWeight:900,fontSize:'1rem'}}>{formatMoney(ticketPrice)}</Typography></Box>
              </Box>
              <StatBar label="Ocupação Estimada" value={avgOccupancy} color={avgOccupancy>=80?C.green:avgOccupancy>=55?C.yellow:C.red}/>
            </Box>
            <Box sx={{bgcolor:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',p:1.5,mb:1.2}}>
              <Typography sx={{color:C.txt3,fontWeight:900,fontSize:'0.6rem',letterSpacing:1,mb:1}}>📊 INDICADORES</Typography>
              <StatBar label="Satisfação dos Torcedores" value={fanSatisf} color={fanSatisf>=75?C.green:C.yellow}/>
              <StatBar label="Atmosfera" value={atmosphere} color={C.blue}/>
              <StatBar label="Reputação" value={repPoints} max={10} color={C.purple}/>
            </Box>
            <Box sx={{bgcolor:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',p:1.5,mb:1.2}}>
              <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}><Typography sx={{color:C.txt3,fontWeight:900,fontSize:'0.6rem',letterSpacing:1}}>📢 PUBLICIDADE</Typography>{(stad.adCooldown||0)>(gameData.round||0)&&<Typography sx={{color:C.txt3,fontSize:'0.6rem',fontWeight:700}}>Rod {stad.adCooldown}</Typography>}</Box>
              <Typography sx={{color:C.txt2,fontSize:'0.72rem',fontWeight:700,mb:0.8}}>Venda espaços publicitários por 5 rodadas.</Typography>
              <Typography sx={{color:C.green,fontWeight:900,fontSize:'0.82rem',mb:1}}>Estimado: {formatMoney(Math.floor(capacity*55+repPoints*80000))}</Typography>
              <Button fullWidth onClick={sellAds} disabled={(stad.adCooldown||0)>(gameData.round||0)} sx={{bgcolor:'rgba(34,197,94,0.1)',border:`1px solid ${C.borderG}`,color:C.green,fontWeight:900,borderRadius:'8px',py:1,'&:hover':{bgcolor:'rgba(34,197,94,0.18)'},'&:disabled':{opacity:0.35}}}>💼 Vender Publicidade</Button>
            </Box>
          </Box>
        )}

        {/* TICKETS */}
        {tab==='tickets'&&(
          <Box>
            <Box sx={{bgcolor:C.card,border:`1.5px solid ${ticketDirty?C.yellow:C.border}`,borderRadius:'14px',p:1.5,mb:1.2}}>
              <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}>
                <Typography sx={{color:C.txt3,fontWeight:900,fontSize:'0.62rem',letterSpacing:1}}>💎 PREÇO DO INGRESSO</Typography>
                <Typography sx={{color:ticketDirty?C.yellow:C.green,fontWeight:900,fontSize:'1.2rem'}}>{formatMoney(ticketPrice)}</Typography>
              </Box>
              <Slider value={ticketPrice} min={10} max={200} step={5} onChange={(_,v)=>{setTicketPrice(v);setTicketDirty(true);}} sx={{color:ticketPrice>100?C.red:ticketPrice>70?C.yellow:C.green,'& .MuiSlider-thumb':{width:20,height:20,bgcolor:C.txt1,border:'2px solid currentColor'},'& .MuiSlider-rail':{bgcolor:C.cardAlt},mb:0.5}}/>
              <Box sx={{display:'flex',justifyContent:'space-between',mb:1.5}}><Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:700}}>R$10</Typography><Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:700}}>R$200</Typography></Box>
              <Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:700,letterSpacing:0.5,mb:0.7}}>PREÇOS RÁPIDOS</Typography>
              <Box sx={{display:'flex',flexWrap:'wrap',gap:0.6,mb:1.5}}>
                {[20,40,60,80,100,120,150].map(p=>(
                  <Box key={p} onClick={()=>{setTicketPrice(p);setTicketDirty(true);}} sx={{bgcolor:ticketPrice===p?C.green:C.cardAlt,border:`1px solid ${ticketPrice===p?C.green:C.border}`,borderRadius:'7px',px:1,py:0.4,cursor:'pointer',transition:'all 0.12s'}}>
                    <Typography sx={{color:ticketPrice===p?'#000':C.txt2,fontWeight:900,fontSize:'0.7rem'}}>R${p}</Typography>
                  </Box>
                ))}
              </Box>
              {ticketDirty&&<Button fullWidth onClick={saveTicketPrice} sx={{bgcolor:C.green,color:'#fff',fontWeight:900,borderRadius:'10px',py:1.2,fontSize:'0.88rem',boxShadow:'0 0 12px rgba(34,197,94,0.3)','&:hover':{bgcolor:'#16a34a'}}}>💾 SALVAR INGRESSO</Button>}
            </Box>
            <Box sx={{bgcolor:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',p:1.5,mb:1.2}}>
              <Typography sx={{color:C.txt3,fontWeight:900,fontSize:'0.6rem',letterSpacing:1,mb:1}}>📈 IMPACTO</Typography>
              {[{l:'Receita/jogo',v:formatMoney(projectedRevenue),c:C.green},{l:'Ocupação',v:`${avgOccupancy}%`,c:avgOccupancy>=75?C.green:C.yellow},{l:'Satisfação',v:`${fanSatisf}%`,c:fanSatisf>=70?C.green:C.red}].map((r,i)=>(
                <Box key={i} sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:0.6}}><Typography sx={{color:C.txt2,fontSize:'0.72rem',fontWeight:700}}>{r.l}</Typography><Typography sx={{color:r.c,fontWeight:900,fontSize:'0.82rem'}}>{r.v}</Typography></Box>
              ))}
            </Box>
            <Box sx={{bgcolor:`${C.blue}0a`,border:`1px solid ${C.blue}30`,borderRadius:'10px',p:1.2}}>
              <Typography sx={{color:C.blue,fontWeight:900,fontSize:'0.6rem',mb:0.4}}>💡 DICA</Typography>
              <Typography sx={{color:C.txt3,fontSize:'0.65rem',fontWeight:700,lineHeight:1.5}}>Ingressos acima de R$80 reduzem ocupação em 30%. Ideal: R$40–R$70.</Typography>
            </Box>
          </Box>
        )}

        {/* MELHORIAS */}
        {tab==='upgrade'&&(
          <Box>
            <Box sx={{bgcolor:C.card,border:`1.5px solid ${C.borderG}`,borderRadius:'14px',overflow:'hidden',mb:1.2}}>
              <Box sx={{bgcolor:'rgba(34,197,94,0.07)',px:1.5,py:1,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:0.8}}><Typography sx={{fontSize:'1.1rem'}}>🏗️</Typography><Typography sx={{color:C.green,fontWeight:900,fontSize:'0.72rem',letterSpacing:0.5}}>EXPANSÃO DE CAPACIDADE</Typography></Box>
              <Box sx={{p:1.5}}>
                <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,mb:1.2}}>
                  <Box sx={{bgcolor:C.cardAlt,borderRadius:'8px',p:1,textAlign:'center'}}><Typography sx={{color:C.txt3,fontSize:'0.52rem',fontWeight:700}}>ATUAL</Typography><Typography sx={{color:C.txt1,fontWeight:900,fontSize:'1rem'}}>{capacity.toLocaleString('pt-BR')}</Typography></Box>
                  <Box sx={{bgcolor:C.cardAlt,borderRadius:'8px',p:1,textAlign:'center'}}><Typography sx={{color:C.txt3,fontSize:'0.52rem',fontWeight:700}}>APÓS (+25%)</Typography><Typography sx={{color:C.green,fontWeight:900,fontSize:'1rem'}}>{Math.floor(capacity*1.25).toLocaleString('pt-BR')}</Typography></Box>
                </Box>
                
                <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1}}><Typography sx={{color:C.txt2,fontSize:'0.72rem',fontWeight:700}}>Custo</Typography><Typography sx={{color:money>=upgradeCost?C.green:C.red,fontWeight:900,fontSize:'0.9rem'}}>{formatMoney(upgradeCost)}</Typography></Box>
                <Button fullWidth onClick={startUpgrade} disabled={underConstruction > 0 || money < upgradeCost} sx={{bgcolor:(underConstruction > 0 || money < upgradeCost)?C.cardAlt:C.green,color:(underConstruction > 0 || money < upgradeCost)?C.txt3:'#000',fontWeight:900,borderRadius:'10px',py:1.2,'&:hover':{bgcolor:(underConstruction===0&&money>=upgradeCost)?'#16a34a':C.cardAlt}}}>
                  {underConstruction > 0 ? `🏗️ Em obras (${underConstruction}R)` : money < upgradeCost ? '💸 Verba Insuficiente' : '🚀 Expandir Estádio'}
                </Button>
              </Box>
            </Box>
            {[{key:'vip',label:'Camarotes VIP',icon:'🥂',bonus:'+Receita +Atmosfera',cost:3000000,color:C.purple},{key:'amenities',label:'Conforto',icon:'🍺',bonus:'+Satisfação +Ocupação',cost:1500000,color:C.orange},{key:'training',label:'Centro de Treinamento',icon:'⚽',bonus:'+Reputação +OVR',cost:5000000,color:C.blue},{key:'academy',label:'Academia',icon:'🎓',bonus:'+Reputação +Jovens',cost:7000000,color:C.yellow}].map(ui=>{
              const lvl=upg[ui.key]||0; const maxed=lvl>=3; const cost=Math.floor(ui.cost*(lvl+1)); const afford=money>=cost;
              return(
                <Box key={ui.key} sx={{bgcolor:C.card,border:`1px solid ${C.border}`,borderRadius:'12px',p:1.4,mb:1}}>
                  <Box sx={{display:'flex',alignItems:'flex-start',gap:1,mb:1}}><Typography sx={{fontSize:'1.3rem',lineHeight:1}}>{ui.icon}</Typography><Box sx={{flex:1}}><Typography sx={{color:C.txt1,fontWeight:900,fontSize:'0.82rem'}}>{ui.label}</Typography><Typography sx={{color:C.txt3,fontSize:'0.6rem',fontWeight:700}}>{ui.bonus}</Typography></Box><Box sx={{display:'flex',gap:0.4}}>{Array.from({length:3},(_,i)=><Box key={i} sx={{width:8,height:8,borderRadius:'2px',bgcolor:i<lvl?ui.color:C.cardAlt}}/>)}</Box></Box>
                  <Button fullWidth disabled={maxed||!afford} onClick={()=>{if(!afford||maxed)return;setGameData(prev=>({...prev,club:{...prev.club,money:prev.club.money-cost,upgrades:{...prev.club.upgrades,[ui.key]:(prev.club.upgrades?.[ui.key]||0)+1}}}));showToast(`${ui.label} melhorado!`,'success');}} sx={{bgcolor:maxed?'rgba(34,197,94,0.08)':afford?`${ui.color}15`:C.cardAlt,border:`1px solid ${maxed?C.green:afford?ui.color+'40':C.border}`,color:maxed?C.green:afford?ui.color:C.txt3,fontWeight:900,borderRadius:'8px',py:0.8,fontSize:'0.72rem'}}>
                    {maxed?'✓ MÁXIMO':`MELHORAR — ${formatMoney(cost)}`}
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ScreenStadium;
