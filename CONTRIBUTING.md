# Contribuindo

## Fluxo recomendado

1. Crie uma branch para a mudança.
2. Faça mudanças pequenas e focadas.
3. Evite misturar refatoração estrutural com alteração de balanceamento na mesma mudança quando possível.
4. Execute o build antes de enviar:

```bash
npm ci
npm run build
```

5. Abra um pull request descrevendo o que mudou e se houve impacto na jogabilidade.

## Convenções

- Componentes React ficam em `src/components/`.
- Hooks ficam em `src/hooks/`.
- Regras de domínio ficam em `src/engines/`.
- Lógica específica do motor de partidas fica em `src/engines/match/`.
- Dados estáticos ficam em `src/data/`.
- Evite colocar novas regras de negócio diretamente em componentes de tela.
- Preserve compatibilidade com saves antigos sempre que possível.

## Versionamento

Durante a fase beta, mudanças incrementais devem avançar `1.0.0-beta.N`.
