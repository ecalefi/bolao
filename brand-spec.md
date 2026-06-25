# Brand spec — Bolão Copa Brasil (redesign)

Extraído de:
- Tom solicitado: Premier League / ESPN — vibrante, bold
- Referência visual: Dribbble shot #26732724 — Tayne Costa (iGaming/Apostas)
- Produto: Bolão Copa Brasil — bolão privado para jogos do Brasil na Copa

## Paleta de cores

```css
:root {
  --bg:      oklch(98% 0.003 140);  /* off-white com leve tom verde */
  --surface: oklch(100% 0 0);       /* branco puro para cards */
  --fg:      oklch(15% 0.02 150);   /* preto-esverdeado para texto principal */
  --muted:   oklch(45% 0.025 150);  /* verde acinzentado para texto secundário */
  --border:  oklch(88% 0.008 140);  /* borda sutil esverdeada */
  --accent:  oklch(52% 0.17 145);   /* verde Brasil — vibrante, refinado */
  --gold:    oklch(78% 0.13 85);    /* ouro para wins/acertos/destaques */
}
```

Uso das cores:
- `--accent` (verde): botão primário, links, badges de acerto, bordas de destaque
- `--gold` (ouro): usado no máximo 1× por tela — placar exato, troféu, CTA especial
- Fundo sempre claro (`--bg`), nunca escuro. A energia vem do verde+ouro, não do fundo
- Cards usam `--surface` com borda sutil `--border`

## Tipografia

| Função | Família | Peso | Tamanho |
|---|---|---|---|
| Display (h1, h2) | `'Söhne'`, `'Avenir Next'`, `-apple-system`, sans-serif | Bold / ExtraBold | clamp(44px, 6vw, 76px) → clamp(32px, 4vw, 48px) |
| Body | `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, system-ui, sans-serif | Regular | 16px |
| Mono (numerics, metadata) | `ui-monospace`, `'JetBrains Mono'`, `Menlo`, monospace | — | 13px |

- Display e body são **famílias diferentes**: display bold/sporty, body limpo/legível
- Números de palpites, valores, odds usam `font-variant-numeric: tabular-nums` em mono
- Headlines curtas (≤12 palavras), esportivas, enérgicas

## Postura visual

- **Cards com borda sutil e cantos levemente arredondados** (10px–16px) — limpos, não cartoons
- **Acento verde usado no máximo 2× por tela** (ex: botão CTA + badge de acerto)
- **Ouro como flourish único** — troféu, prêmio, placar exato
- **Sem gradientes de fundo**, sem glow, sem scanlines, sem neon
- **Ícones em SVG monoline** (esportivos: bola, troféu, escudo, jogador)
- **Fotos/placeholders relativos a futebol** quando aplicável
- **Mobile-first**: tudo colapsa para 1 coluna em ≤920px
- **Sombra apenas em interactive cards** (elevação sutil no hover)
- **Sem bege/peach/pink** — fundo é off-white com viés verde
- **Componentes de aposta**: cards com input de placar, badge de status (aberto/fechado/acertou), timer regressivo
