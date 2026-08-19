// @migrated to ES module
import React from 'react';

// components/ErrorBoundary.js — v2.0
// Captura erros de renderização em qualquer componente filho
// NOTA: usa apenas inline styles para nunca depender de MUI (evita loop de erro)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null, copied: false };
    this.handleCopy   = this.handleCopy.bind(this);
    this.handleRetry  = this.handleRetry.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[Tática Manager]', error, info);
  }

  handleCopy() {
    const { error, info } = this.state;
    const text = [
      '=== TÁTICA MANAGER — ERROR REPORT ===',
      'Data: ' + new Date().toISOString(),
      'URL: ' + (typeof window !== 'undefined' ? (window.location?.href || '—') : '—'),
      'UserAgent: ' + (typeof navigator !== 'undefined' ? (navigator.userAgent?.substring(0, 100) || '—') : '—'),
      '',
      'MENSAGEM:',
      error?.message || 'Desconhecido',
      '',
      'STACK:',
      (error?.stack || '—').split('\n').slice(0, 10).join('\n'),
      '',
      'COMPONENTE:',
      (info?.componentStack || '—').split('\n').slice(0, 5).join('\n'),
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.setState({ copied: true });
          setTimeout(() => this.setState({ copied: false }), 2500);
        })
        .catch(() => { if (typeof window !== 'undefined' && window.prompt) window.prompt('Copie o relatório abaixo:', text); });
    } else {
      if (typeof window !== 'undefined' && window.prompt) window.prompt('Copie o relatório abaixo:', text);
    }
  }

  handleRetry() {
    this.setState({ hasError: false, error: null, info: null, copied: false });
  }

  handleReload() {
    if (typeof window !== 'undefined') window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, copied } = this.state;

    const S = {
      wrap: {
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #0d1b2a 0%, #09131c 100%)',
        padding: '20px',
        fontFamily: '"Nunito", "Segoe UI", sans-serif',
      },
      card: {
        background: '#111e2d',
        border: '2px solid #ef4444',
        borderRadius: '18px',
        padding: '0',
        maxWidth: '440px',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(239,68,68,0.15), 0 20px 60px rgba(0,0,0,0.5)',
      },
      // Topo vermelho com ícone
      top: {
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
        padding: '24px 24px 20px',
        display: 'flex', alignItems: 'center', gap: '14px',
        borderBottom: '1px solid rgba(239,68,68,0.25)',
      },
      iconWrap: {
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: '1.6rem', lineHeight: 1,
      },
      badge: {
        display: 'inline-block',
        background: 'rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.7)',
        borderRadius: '6px', padding: '1px 8px',
        fontSize: '0.55rem', fontWeight: 900, letterSpacing: '2px',
        marginBottom: '4px',
      },
      title: {
        margin: 0,
        color: '#fff',
        fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2,
        fontFamily: '"Nunito", sans-serif',
      },
      body: { padding: '20px 24px 24px' },
      sub: {
        color: '#8daec8',
        fontSize: '0.78rem', lineHeight: 1.6,
        margin: '0 0 16px',
      },
      // Bloco de erro técnico
      pre: {
        background: '#060e08',
        color: '#e6edf3',
        borderRadius: '10px',
        padding: '12px 14px',
        fontSize: '0.62rem', lineHeight: 1.7,
        overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: '160px', overflowY: 'auto',
        margin: '0 0 18px',
        fontFamily: '"Courier New", monospace',
        border: '1px solid #1e3448',
      },
      // Linha de botões principais
      btnRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
      btnCopy: {
        flex: 1, padding: '11px 8px',
        borderRadius: '10px', border: 'none',
        background: copied ? '#16a34a' : '#22c55e',
        color: '#000',
        fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
        fontFamily: '"Nunito", sans-serif',
        transition: 'background 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      },
      btnRetry: {
        flex: 1, padding: '11px 8px',
        borderRadius: '10px',
        border: '1.5px solid #1e3448',
        background: '#162638',
        color: '#e8f4fd',
        fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
        fontFamily: '"Nunito", sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      },
      btnReload: {
        width: '100%', padding: '10px',
        borderRadius: '10px',
        border: '1px solid #1e3448',
        background: 'transparent',
        color: '#4d7a9e',
        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
        fontFamily: '"Nunito", sans-serif',
        transition: 'color 0.15s',
      },
      divider: {
        border: 'none', borderTop: '1px solid #1e3448',
        margin: '0 0 14px',
      },
    };

    return (
      <div style={S.wrap}>
        <div style={S.card}>

          {/* ── Cabeçalho ── */}
          <div style={S.top}>
            <div style={S.iconWrap}>💥</div>
            <div>
              <div style={S.badge}>ERRO CRÍTICO</div>
              <p style={S.title}>Algo quebrou por aqui</p>
            </div>
          </div>

          {/* ── Corpo ── */}
          <div style={S.body}>
            <p style={S.sub}>
              Um erro inesperado interrompeu a renderização. Use os botões abaixo
              para tentar continuar ou reiniciar o jogo.
            </p>

            {/* Stack trace */}
            <pre style={S.pre}>
              {error?.message || 'Erro desconhecido'}
              {'\n\n'}
              {(error?.stack || '').split('\n').slice(1, 8).join('\n')}
            </pre>

            <hr style={S.divider} />

            {/* Botões principais */}
            <div style={S.btnRow}>
              <button style={S.btnCopy} onClick={this.handleCopy}>
                {copied ? '✅ Copiado!' : '📋 Copiar relatório'}
              </button>
              <button style={S.btnRetry} onClick={this.handleRetry}>
                🔄 Tentar novamente
              </button>
            </div>

            {/* Reload */}
            <button style={S.btnReload} onClick={this.handleReload}>
              ↺ Recarregar a página
            </button>
          </div>

        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
