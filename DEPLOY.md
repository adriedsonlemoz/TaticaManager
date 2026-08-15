# Deploy — Tática Manager

## Vercel

A versão atual é uma aplicação Vite estática e pode ser hospedada diretamente na Vercel.

### Configuração versionada

O arquivo `vercel.json` define:

- framework: Vite;
- build: `npm run build`;
- saída: `dist`.

O `package.json` fixa Node.js em `22.x`.

### Publicação pelo GitHub

1. Envie o projeto para um repositório GitHub.
2. Na Vercel, crie um novo projeto e importe o repositório.
3. A Vercel deve detectar Vite automaticamente.
4. Confirme o build `npm run build` e a saída `dist` caso a interface solicite.
5. Faça o deploy.

Não há variáveis de ambiente obrigatórias na versão atual.

## Render

Render não é necessário para a versão atual. Ele passa a ser útil caso o projeto receba backend/API, por exemplo:

- login e contas online;
- saves em nuvem;
- ranking global;
- painel administrativo;
- multiplayer;
- banco de dados centralizado.

Nesse cenário, uma arquitetura possível é:

```text
Vercel (React/Vite)
       │
       ▼
Render (API)
       │
       ▼
Banco de dados
```

## Verificação antes de publicar

```bash
npm ci
npm run build
```

O deploy só deve ser considerado pronto se o build terminar sem erros.
