# ShareCode

Share codes instantly — no login required. Paste your codes, get a short link, each visitor claims one.

<!-- README-I18N:START -->

**English** | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

<!-- README-I18N:END -->

## Why ShareCode?

Sharing activation codes, invite codes, or redeem keys through group chats often leads to duplicates and confusion. ShareCode gives every visitor a unique code from a pool — fairly, atomically, and with full visibility into claim progress.

## Features

- One-click share creation — paste codes (one per line), get a claim link and a manage link
- Atomic claim — Redis Lua script prevents duplicate assignment, even under concurrency
- Live statistics — total / claimed / remaining with per-code timestamps and conversion rate
- Auto expiry — Redis TTL handles cleanup; configurable default (7 days)
- Rate limiting — IP-based throttling on create and claim endpoints
- Multilingual UI — Chinese, English, Japanese; auto-detects browser language with manual switch

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Redis (local or Docker)

### Install & Run

```bash
git clone https://github.com/deepmuse/ShareCode.git
cd ShareCode
cp .env.example .env
pnpm install

# Start Redis
docker compose up -d redis

# Start dev servers (frontend :5173 + backend :3001)
pnpm dev
```

### Production Build

```bash
pnpm build
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | Node.js · Express · TypeScript |
| Storage | Redis (atomic claim via Lua) |
| i18n | react-i18next · i18next-browser-languagedetector |
| Deploy | Docker · docker-compose |

## Project Structure

```
ShareCode/
├── packages/
│   ├── client/                 # Frontend (React + Vite)
│   │   └── src/
│   │       ├── components/      # UI components
│   │       ├── hooks/           # useLanguage etc.
│   │       ├── i18n/            # i18n config & locale JSON
│   │       ├── lib/             # API client, utilities
│   │       └── pages/           # Create / Claim / Manage
│   └── server/                 # Backend (Express)
│       └── src/
│           ├── middleware/      # validation, rate-limit, logger
│           ├── routes/         # share · claim · manage
│           └── utils/          # Redis, short code, errors
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── LICENSE
```

## API Reference

### Create Share

```http
POST /api/share
Content-Type: application/json

{ "codes": ["CODE_A", "CODE_B"], "expireHours": 168 }
```

```json
{ "shareId": "a1B2c3", "claimUrl": "https://domain/s/a1B2c3", "manageUrl": "https://domain/manage/a1B2c3?token=xxxx", "total": 2, "expiresAt": "2026-04-30T12:00:00Z" }
```

### Claim a Code

```http
POST /api/claim/:shareId
```

```json
{ "status": "ok", "code": "CODE_B", "remain": 1 }
```

### View Statistics

```http
GET /api/manage/:shareId?token=xxxx
```

```json
{
  "shareId": "a1B2c3",
  "total": 2,
  "claimed": 1,
  "remain": 1,
  "expiresAt": "2026-04-30T12:00:00Z",
  "items": [
    { "code": "CODE_B", "status": "claimed", "claimedAt": "2026-04-23T09:00:00Z" }
  ],
  "stats": { "visitCount": 5, "claimCount": 1, "lastClaimAt": "2026-04-23T09:00:00Z" }
}
```

### Health Check

```http
GET /api/health
```

```json
{ "status": "ok", "timestamp": "2026-04-23T12:00:00Z" }
```

## Error Responses

Every error includes `code`, `i18nKey`, and `message`. Frontend should use `i18nKey` for localization; `message` is a Chinese fallback.

```json
{ "status": "error", "code": 41002, "i18nKey": "codesExhausted", "message": "码已领完" }
```

| Code | i18nKey | Description |
|------|---------|-------------|
| 40001 | `invalidParams` | Invalid parameters |
| 40002 | `emptyCodes` | Empty code list |
| 40003 | `exceedLimit` | Exceeded maximum code limit |
| 40301 | `invalidToken` | Invalid management token |
| 40401 | `shareNotFound` | Share not found |
| 41001 | `shareExpired` | Share link has expired |
| 41002 | `codesExhausted` | All codes have been claimed |
| 42901 | `rateLimited` | Too many requests, slow down |
| 50001 | `internalError` | Internal server error |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `APP_URL` | `http://localhost:5173` | Frontend URL (CORS + link generation) |
| `DEFAULT_EXPIRE_HOURS` | `168` | Default share expiry (hours) |
| `MAX_CODES_PER_SHARE` | `1000` | Max codes per share |
| `SHORT_CODE_LENGTH` | `6` | Short code length (Base62) |
| `RATE_LIMIT_CREATE_MAX` | `10` | Create endpoint limit (req/min) |
| `RATE_LIMIT_CLAIM_MAX` | `5` | Claim endpoint limit (req/min) |

## Docker Deployment

```bash
docker compose up -d
```

## License

[MIT](./LICENSE)