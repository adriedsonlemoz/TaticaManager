#!/usr/bin/env bash

set -e

echo "========================================="
echo "⚽ Tática Manager — Build Vite"
echo "========================================="

# ── 1. Migração automática do storage Android → Termux ──────
if pwd | grep -q -E "storage|sdcard"; then
    echo "⚠️  Armazenamento Android detectado."
    echo "🚀 Transferindo para ~/projetos/tatica-manager ..."

    TARGET_DIR="$HOME/projetos/tatica-manager"
    mkdir -p "$TARGET_DIR"

    set +e
    cp -r * "$TARGET_DIR/" 2>/dev/null
    cp -r .[a-zA-Z0-9]* "$TARGET_DIR/" 2>/dev/null
    set -e

    rm -rf "$TARGET_DIR/dist" "$TARGET_DIR/node_modules"

    echo "✅ Arquivos transferidos!"
    echo "🔄 Reiniciando na pasta correta..."

    cd "$TARGET_DIR"
    chmod +x build.sh 2>/dev/null || true
    exec bash ./build.sh "$@"
fi

# ── 2. Verificar Node.js ─────────────────────────────────────
echo "🔍 [1/5] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js não encontrado. Instalando..."
    pkg update -y && pkg install nodejs -y
fi

NODE_VER=$(node -v)
echo "   Node.js $NODE_VER ✅"

# ── 3. Instalar dependências ─────────────────────────────────
echo "📦 [2/5] Instalando dependências (npm install)..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "   Dependências instaladas ✅"
else
    echo "   node_modules já existe, pulando instalação."
    echo "   (Para forçar reinstalação: rm -rf node_modules && bash build.sh)"
fi

# ── 4. Modo: dev ou build ────────────────────────────────────
MODE="${1:-dev}"   # padrão: dev (servidor com hot-reload)
                   # use: bash build.sh build  → para gerar dist/

if [ "$MODE" = "build" ]; then
    echo "🏗️  [3/5] Gerando build de produção (npm run build)..."
    npm run build

    echo ""
    echo "========================================="
    echo "✅ BUILD CONCLUÍDA!"
    echo "Arquivos prontos em: dist/"
    echo ""
    echo "Para testar localmente:"
    echo "  npm run preview"
    echo ""
    echo "Para gerar APK (requer Android Studio):"
    echo "  npx cap sync"
    echo "  npx cap open android"
    echo "========================================="

elif [ "$MODE" = "preview" ]; then
    echo "👁️  [3/5] Pré-visualizando build de produção..."
    if [ ! -d "dist" ]; then
        echo "❌ Pasta dist/ não encontrada. Rode primeiro: bash build.sh build"
        exit 1
    fi

    echo ""
    echo "========================================="
    echo "🌐 Servidor de preview iniciado!"
    echo "Acesse: http://localhost:3000"
    echo "Ctrl+C para parar."
    echo "========================================="
    npm run preview

else
    # DEV — servidor com hot-reload (padrão)
    echo "🚀 [3/5] Iniciando servidor de desenvolvimento..."
    echo ""
    echo "========================================="
    echo "🌐 Servidor Vite iniciado!"
    echo "Acesse no navegador: http://localhost:3000"
    echo "Hot-reload ativo: salvar um arquivo atualiza"
    echo "automaticamente sem precisar recompilar."
    echo ""
    echo "Ctrl+C para parar."
    echo "========================================="
    echo ""
    npm run dev
fi
