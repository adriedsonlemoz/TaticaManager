// @migrated to ES module
// engine_sound.js — Motor de som via Web Audio API v2.0
// ────────────────────────────────────────────────────────────────
// v2 — problemas corrigidos:
//   • Chiado: ruído BRANCO substituído por ruído ROSA (pink noise)
//     O branco tem energia igual em todos os agudos → chia.
//     O rosa tem energia inversamente proporcional à frequência →
//     soa exatamente como multidão/torcida.
//   • Filtro: lowpass (corta agudos) em vez de bandpass estreito.
//   • Modulação LFO: volume do ambiente oscila devagar (0.18 Hz)
//     simulando a "respiração" natural de uma torcida em estádio.
//   • Bus compressor: evita distorção nos eventos fortes (gol).
//   • Buffer longo de 8s: elimina repetição audível no loop.
// ────────────────────────────────────────────────────────────────

export const SoundEngine = (() => {
  let _ctx         = null;
  let _enabled     = true;
  let _ambientNodes = null; // { src, lfo, masterGain }
  let _compressor  = null;

  // ── Contexto + bus compressor ─────────────────────────────────
  const _getCtx = () => {
    if (!_ctx) {
      try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { return null; }
    }
    if (_ctx.state === 'suspended') _ctx.resume();

    if (_ctx && !_compressor) {
      _compressor = _ctx.createDynamicsCompressor();
      _compressor.threshold.value = -18;
      _compressor.knee.value      = 8;
      _compressor.ratio.value     = 4;
      _compressor.attack.value    = 0.005;
      _compressor.release.value   = 0.15;
      _compressor.connect(_ctx.destination);
    }
    return _ctx;
  };

  const _dest = () => _compressor || (_ctx?.destination);

  // ── Ruído ROSA (Paul Kellet's algorithm) ─────────────────────
  // Energia ∝ 1/f — soa como torcida, chuva, natureza.
  // Muito menos chiante que o ruído branco.
  const _pinkBuffer = (ctx, seconds) => {
    const len = Math.ceil(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate); // estéreo
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + w*0.0555179;
        b1 = 0.99332*b1 + w*0.0750759;
        b2 = 0.96900*b2 + w*0.1538520;
        b3 = 0.86650*b3 + w*0.3104856;
        b4 = 0.55000*b4 + w*0.5329522;
        b5 = -0.7616*b5 - w*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return buf;
  };

  // Ruído rosa temporário (para eventos)
  const _pinkNoise = (ctx, start, dur, gainPeak, opts = {}) => {
    const seconds = Math.min(dur + 0.2, 4);
    const buf  = _pinkBuffer(ctx, seconds);
    const src  = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type            = opts.filterType || 'lowpass';
    filter.frequency.value = opts.filterFreq || 600;
    filter.Q.value         = opts.Q || 0.7;

    const gain = ctx.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(_dest());

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + (opts.attack || 0.06));
    gain.gain.setValueAtTime(gainPeak, start + dur * 0.65);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    src.start(start);
    src.stop(start + dur + 0.1);
  };

  // Oscilador com envelope (mantido)
  const _osc = (ctx, type, freq, start, dur, gainPeak, opts = {}) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(_dest());
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (opts.freqEnd) osc.frequency.linearRampToValueAtTime(opts.freqEnd, start + dur);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + (opts.attack || 0.02));
    gain.gain.setValueAtTime(gainPeak, start + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  };

  // ── Sons do jogo ──────────────────────────────────────────────

  const playGoal = (isUserGoal = true) => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    if (isUserGoal) {
      _pinkNoise(ctx, t,       2.5, 0.50, { filterFreq: 500,  Q: 0.6, attack: 0.04 });
      _pinkNoise(ctx, t+0.12,  3.0, 0.65, { filterFreq: 900,  Q: 0.5, attack: 0.05 });
      _pinkNoise(ctx, t+0.30,  3.5, 0.55, { filterFreq: 1200, Q: 0.4, attack: 0.08 });
      _osc(ctx, 'sawtooth', 440, t,       0.28, 0.35);
      _osc(ctx, 'sawtooth', 550, t+0.35,  0.28, 0.35);
      _osc(ctx, 'sawtooth', 440, t+0.68,  0.45, 0.40);
      _osc(ctx, 'sawtooth', 660, t+1.25,  0.55, 0.50);
      [523, 659, 784].forEach((f, i) => {
        _osc(ctx, 'triangle', f, t+0.85+i*0.09, 1.3, 0.20);
      });
    } else {
      _pinkNoise(ctx, t, 1.8, 0.25, { filterFreq: 350, filterType: 'lowpass', Q: 0.5 });
      _osc(ctx, 'sine', 220, t,      0.9,  0.13, { freqEnd: 140 });
      _osc(ctx, 'sine', 175, t+0.35, 0.65, 0.10, { freqEnd: 110 });
    }
  };

  const playWhistle = (type = 'single') => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    const apito = (start, dur) => {
      _osc(ctx, 'sine', 2800, start, dur, 0.32, { freqEnd: 2600, attack: 0.008 });
      _osc(ctx, 'sine', 2950, start, dur, 0.10, { freqEnd: 2750 });
    };
    if      (type === 'single') { apito(t, 0.22); }
    else if (type === 'double') { apito(t, 0.18); apito(t+0.32, 0.18); }
    else if (type === 'triple') {
      apito(t, 0.17); apito(t+0.28, 0.17); apito(t+0.56, 0.48);
      _pinkNoise(ctx, t+0.75, 2.8, 0.35, { filterFreq: 700, Q: 0.5, attack: 0.12 });
    }
  };

  const playYellowCard = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    _osc(ctx, 'sine', 900, t,      0.12, 0.28);
    _osc(ctx, 'sine', 680, t+0.15, 0.18, 0.18);
    _pinkNoise(ctx, t, 0.6, 0.10, { filterFreq: 500, Q: 0.4 });
  };

  const playRedCard = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    _osc(ctx, 'sawtooth', 440, t,      0.11, 0.38);
    _osc(ctx, 'sawtooth', 330, t+0.14, 0.11, 0.38);
    _osc(ctx, 'sawtooth', 220, t+0.28, 0.18, 0.32);
    _pinkNoise(ctx, t+0.10, 1.4, 0.22, { filterFreq: 450, filterType: 'lowpass', Q: 0.4 });
  };

  const playSub = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    _osc(ctx, 'sine', 880,  t,      0.09, 0.18);
    _osc(ctx, 'sine', 1100, t+0.11, 0.09, 0.18);
  };

  // Pênalti marcado — apito + suspense
  const playPenalty = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    _osc(ctx, 'sine', 3100, t, 0.20, 0.38, { freqEnd: 2900, attack: 0.006 });
    _pinkNoise(ctx, t+0.25, 1.8, 0.10, { filterFreq: 300, filterType: 'lowpass', Q: 0.3 });
  };

  // Pênalti defendido — gemido coletivo
  const playPenaltySaved = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    _pinkNoise(ctx, t, 1.2, 0.28, { filterFreq: 400, filterType: 'lowpass', Q: 0.4 });
    _osc(ctx, 'sine', 260, t, 0.9, 0.12, { freqEnd: 180 });
  };

  // Falta — bip seco de árbitro
  const playFoul = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled) return;
    const t = ctx.currentTime;
    _osc(ctx, 'sine', 1900, t, 0.10, 0.22, { freqEnd: 1700, attack: 0.004 });
  };

  // ── AMBIENTE — TORCIDA NO ESTÁDIO ─────────────────────────────
  // Ruído rosa + lowpass (480 Hz) + realce de grave (250 Hz) +
  // LFO de 0.18 Hz (período ~5.5s) → torcida "respira" naturalmente.
  // Buffer de 8s (estéreo) → nenhuma repetição audível no loop.
  const startAmbient = () => {
    const ctx = _getCtx();
    if (!ctx || !_enabled || _ambientNodes) return;

    const buf = _pinkBuffer(ctx, 8);
    const src = ctx.createBufferSource();
    src.buffer    = buf;
    src.loop      = true;
    src.loopStart = 0;
    src.loopEnd   = 8;

    // Filtro 1: corta tudo acima de 480 Hz → elimina o chiado
    const lp = ctx.createBiquadFilter();
    lp.type            = 'lowpass';
    lp.frequency.value = 480;
    lp.Q.value         = 0.6;

    // Filtro 2: realça o grave "corpulento" da torcida em 250 Hz
    const shelf = ctx.createBiquadFilter();
    shelf.type            = 'peaking';
    shelf.frequency.value = 250;
    shelf.gain.value      = 4;
    shelf.Q.value         = 0.8;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + 2.5);

    src.connect(lp);
    lp.connect(shelf);
    shelf.connect(masterGain);
    masterGain.connect(_dest());

    // LFO: modula o volume ±3.5% a cada ~5.5s → ondas naturais de torcida
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type            = 'sine';
    lfo.frequency.value = 0.18;
    lfoGain.gain.value  = 0.035;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();
    src.start();

    _ambientNodes = { src, lfo, masterGain };
  };

  const stopAmbient = () => {
    if (!_ambientNodes || !_ctx) return;
    try {
      const t = _ctx.currentTime;
      _ambientNodes.masterGain.gain.linearRampToValueAtTime(0, t + 1.2);
      setTimeout(() => {
        try { _ambientNodes?.src.stop(); } catch(e) {}
        try { _ambientNodes?.lfo.stop(); } catch(e) {}
        _ambientNodes = null;
      }, 1400);
    } catch(e) { _ambientNodes = null; }
  };

  const setEnabled = (v) => { _enabled = v; if (!v) stopAmbient(); };
  const isEnabled  = ()  => _enabled;

  return {
    playGoal, playWhistle, playYellowCard, playRedCard,
    playSub,  playPenalty, playPenaltySaved, playFoul,
    startAmbient, stopAmbient, setEnabled, isEnabled,
  };
})();

export default SoundEngine;

