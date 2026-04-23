# ShareCode

ログイン不要のコード共有プラットフォーム。コードを貼り付けてショートリンクを生成。訪問者は1回に1つのコードを受け取ります。

<!-- README-I18N:START -->

[English](./README.md) | [简体中文](./README.zh-CN.md) | **日本語**

<!-- README-I18N:END -->

## なぜ ShareCode が必要か？

グループチャットでアクティベーションコード、招待コード、交換コードを共有すると、重複受け取りや混乱が生じがちです。ShareCodeはコードプールから各訪問者に1つのコードを公平に割り当て——アトミック操作、重複なし、受け取り状況を完全に把握できます。

## 機能

- ワンクリック共有 — コードを貼り付け（1行に1つ）、受け取りリンクと管理リンクを取得
- アトミックな受け取り — Redis Luaスクリプトで同時アクセス時の重複割り当てを防止
- リアルタイム統計 — 合計/受け取り済み/残り、コードごとのタイムスタンプとコンバージョン率
- 自動有効期限 — Redis TTLで自動クリーンアップ、デフォルト7日間（設定可能）
- レート制限 — 作成・受け取りエンドポイントともIPベースのスロットリング
- 多言語UI — 中国語、英語、日本語に対応。ブラウザ言語を自動検出し手動切替も可能

## クイックスタート

### 前提条件

- Node.js 22+
- pnpm 10+
- Redis（ローカルまたはDocker）

### インストールと起動

```bash
git clone https://github.com/deepmuse/ShareCode.git
cd ShareCode
cp .env.example .env
pnpm install

# Redisを起動
docker compose up -d redis

# 開発サーバーを起動（フロントエンド :5173 + バックエンド :3001）
pnpm dev
```

### プロダクションビルド

```bash
pnpm build
```

## 技術スタック

| レイヤー | 技術 |
|-----------|------|
| フロントエンド | React · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| バックエンド | Node.js · Express · TypeScript |
| ストレージ | Redis（Luaによるアトミック受け取り） |
| 国際化 | react-i18next · i18next-browser-languagedetector |
| デプロイ | Docker · docker-compose |

## プロジェクト構造

```
ShareCode/
├── packages/
│   ├── client/                 # フロントエンド (React + Vite)
│   │   └── src/
│   │       ├── components/      # UIコンポーネント
│   │       ├── hooks/           # useLanguageなど
│   │       ├── i18n/            # i18n設定と言語JSON
│   │       ├── lib/             # APIクライアント、ユーティリティ
│   │       └── pages/           # 作成 / 受け取り / 統計
│   └── server/                 # バックエンド (Express)
│       └── src/
│           ├── middleware/      # バリデーション、レート制限、ロギング
│           ├── routes/         # share · claim · manage
│           └── utils/          # Redis、短縮コード、エラーコード
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── LICENSE
```

## APIリファレンス

### 共有を作成

```http
POST /api/share
Content-Type: application/json

{ "codes": ["CODE_A", "CODE_B"], "expireHours": 168 }
```

```json
{ "shareId": "a1B2c3", "claimUrl": "https://domain/s/a1B2c3", "manageUrl": "https://domain/manage/a1B2c3?token=xxxx", "total": 2, "expiresAt": "2026-04-30T12:00:00Z" }
```

### コードを受け取る

```http
POST /api/claim/:shareId
```

```json
{ "status": "ok", "code": "CODE_B", "remain": 1 }
```

### 統計を確認

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

### ヘルスチェック

```http
GET /api/health
```

```json
{ "status": "ok", "timestamp": "2026-04-23T12:00:00Z" }
```

## エラーレスポンス

すべてのエラーレスポンスには `code`、`i18nKey`、`message` の3フィールドが含まれます。フロントエンドは `i18nKey` で翻訳し、`message` は中国語のフォールバックです。

```json
{ "status": "error", "code": 41002, "i18nKey": "codesExhausted", "message": "码已领完" }
```

| コード | i18nKey | 説明 |
|--------|---------|------|
| 40001 | `invalidParams` | パラメータが不正です |
| 40002 | `emptyCodes` | コードリストが空です |
| 40003 | `exceedLimit` | 制限を超えています |
| 40301 | `invalidToken` | 管理トークンが無効です |
| 40401 | `shareNotFound` | 共有が見つかりません |
| 41001 | `shareExpired` | リンクが期限切れです |
| 41002 | `codesExhausted` | コードはすべて受け取られています |
| 42901 | `rateLimited` | リクエストが多すぎます |
| 50001 | `internalError` | サーバー内部エラー |

## 環境変数

| 変数 | デフォルト | 説明 |
|------|------------|------|
| `PORT` | `3001` | サーバーポート |
| `REDIS_URL` | `redis://localhost:6379` | Redis接続URL |
| `APP_URL` | `http://localhost:5173` | フロントエンドURL（CORS + リンク生成） |
| `DEFAULT_EXPIRE_HOURS` | `168` | デフォルト有効期限（時間） |
| `MAX_CODES_PER_SHARE` | `1000` | 1回あたりの作成上限 |
| `SHORT_CODE_LENGTH` | `6` | 短縮コードの長さ（Base62） |
| `RATE_LIMIT_CREATE_MAX` | `10` | 作成エンドポイントのレート制限（リクエスト/分） |
| `RATE_LIMIT_CLAIM_MAX` | `5` | 受け取りエンドポイントのレート制限（リクエスト/分） |

## Docker デプロイ

```bash
docker compose up -d
```

## ライセンス

[MIT](./LICENSE)