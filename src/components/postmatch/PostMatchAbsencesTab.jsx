import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { THEME } from '../../theme.js';
import { PostMatchAgent } from '../../engines/PostMatchAgent.js';
import { PostMatchCard, PostMatchCardHead } from './PostMatchUi.jsx';

const C = THEME;

const PostMatchAbsencesTab = ({ desfalques, acknowledged, onAcknowledge }) => {
  if (!desfalques?.suspensions?.length && !desfalques?.injuries?.length) return null;

  return (
    <>
      {desfalques.hasBlockers && !acknowledged && (
        <Box sx={{ bgcolor: `${C.red}0e`, border: `2px solid ${C.red}60`, borderRadius: '14px', p: 1.5, mb: 1.2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography sx={{ fontSize: '1.4rem', lineHeight: 1.2, flexShrink: 0 }}>🚨</Typography>
          <Box>
            <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.82rem', lineHeight: 1.2, mb: 0.3 }}>TITULARES INDISPONÍVEIS</Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.4 }}>
              Jogadores que estavam no time foram suspensos ou lesionados neste jogo. Você precisa ajustar a escalação antes de continuar.
            </Typography>
          </Box>
        </Box>
      )}

      {desfalques.suspensions.length > 0 && (
        <PostMatchCard accent={`${C.red}50`}>
          <PostMatchCardHead label="SUSPENSOS" icon="🟥" color={C.red} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {desfalques.suspensions.map((suspension, index) => (
              <Box key={suspension.player?.id || index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.85, borderBottom: index < desfalques.suspensions.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '9px', flexShrink: 0, bgcolor: `${C.red}15`, border: `1.5px solid ${C.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{suspension.icon}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.82rem', color: C.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{suspension.player.name}</Typography>
                    {suspension.wasStarter && (
                      <Box sx={{ bgcolor: `${C.red}20`, border: `1px solid ${C.red}40`, borderRadius: '4px', px: 0.5, py: 0.05, flexShrink: 0 }}>
                        <Typography sx={{ color: C.red, fontSize: '0.4rem', fontWeight: 900 }}>ERA TITULAR</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>{suspension.reason}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem' }}>Fora do</Typography>
                  <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem' }}>{PostMatchAgent.formatRoundsLeft(suspension.roundsLeft)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </PostMatchCard>
      )}

      {desfalques.injuries.length > 0 && (
        <PostMatchCard accent={`${C.gold}50`}>
          <PostMatchCardHead label="LESIONADOS" icon="🚑" color={C.gold} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {desfalques.injuries.map((injury, index) => (
              <Box key={injury.player?.id || index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.85, borderBottom: index < desfalques.injuries.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '9px', flexShrink: 0, bgcolor: `${C.gold}15`, border: `1.5px solid ${C.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>🚑</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.82rem', color: C.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{injury.player.name}</Typography>
                    {injury.wasStarter && (
                      <Box sx={{ bgcolor: `${C.gold}20`, border: `1px solid ${C.gold}40`, borderRadius: '4px', px: 0.5, py: 0.05, flexShrink: 0 }}>
                        <Typography sx={{ color: C.gold, fontSize: '0.4rem', fontWeight: 900 }}>ERA TITULAR</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>{injury.injuryType} · {PostMatchAgent.formatRoundsLeft(injury.roundsLeft)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Box sx={{ bgcolor: injury.severity === 'high' ? `${C.red}15` : `${C.gold}15`, border: `1px solid ${injury.severity === 'high' ? C.red : C.gold}40`, borderRadius: '6px', px: 0.8, py: 0.3 }}>
                    <Typography sx={{ color: injury.severity === 'high' ? C.red : C.gold, fontWeight: 900, fontSize: '0.62rem' }}>{injury.roundsLeft} rod.</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </PostMatchCard>
      )}

      {desfalques.hasBlockers && !acknowledged && (
        <Button fullWidth onClick={onAcknowledge} sx={{ py: 1.4, borderRadius: '12px', fontWeight: 900, fontSize: '0.88rem', bgcolor: C.red, color: '#fff', boxShadow: `0 4px 16px ${C.red}40`, '&:hover': { bgcolor: '#b91c1c' }, mb: 1 }}>
          📋 ENTENDIDO — IR PARA ESCALAÇÃO
        </Button>
      )}
      {desfalques.hasBlockers && acknowledged && (
        <Box sx={{ bgcolor: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: '10px', p: 1.2, mb: 1, textAlign: 'center' }}>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.72rem' }}>✅ Lembrete reconhecido — ajuste a escalação antes do próximo jogo</Typography>
        </Box>
      )}
    </>
  );
};

export default PostMatchAbsencesTab;
