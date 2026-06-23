# Bolão Copa Brasil

MVP para bolão privado dos jogos do Brasil na Copa:

- cadastro do participante por **nome + WhatsApp**;
- grupos privados com link de convite;
- valor do PIX configurado pelo admin;
- PIX via Mercado Pago;
- palpites liberados até **5 minutos antes do jogo**;
- Supabase como banco central;
- API-Football para detectar gols ao vivo;
- webhooks para n8n enviar WhatsApp.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Crie o schema no Supabase executando:

```txt
supabase/schema.sql
```

## Variáveis importantes

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
API_FOOTBALL_KEY=
N8N_WEBHOOK_URL=
CRON_SECRET=
APP_BASE_URL=
```

> A chave API-Football exposta no chat deve ser rotacionada antes de produção.

## Fluxo de gol em tempo real

Como a API-Football v3 é REST, o alerta é feito por polling:

```txt
cron/n8n -> POST /api/jobs/monitor-goals?fixtureId=ID
         -> GET /fixtures/events?fixture=ID
         -> deduplica eventos Goal no Supabase
         -> POST n8n webhook único com { event: "goal_detected", ...payload }
         -> WhatsApp
```

Recomendação de polling em dia de jogo:

- 10 min antes: a cada 60s;
- durante jogo: a cada 15–30s;
- após status FT: parar.

## Rotas principais

- `GET /` — landing.
- `GET /admin` — criar grupo privado.
- `GET /bolao/[slug]?invite=TOKEN` — entrada do participante.
- `POST /api/participants/register` — nome + WhatsApp.
- `POST /api/payments/create` — gera PIX Mercado Pago.
- `POST /api/webhooks/mercadopago` — confirma pagamento.
- `POST /api/bets` — registra/edita palpite.
- `POST /api/jobs/sync-next-brazil-match` — sincroniza próximos jogos do Brasil.
- `POST /api/jobs/monitor-goals?fixtureId=...` — detecta gols e aciona n8n.

## Próximos passos

1. Configurar Supabase real e aplicar `schema.sql`.
2. Configurar Mercado Pago webhook para `/api/webhooks/mercadopago`.
3. Criar workflow n8n para `payment_confirmed`, `bet_registered` e `goal_detected`.
4. Amarrar jogos aos grupos em `group_matches` após sincronizar fixtures.
5. Adicionar tela de palpites/ranking após pagamento confirmado.
