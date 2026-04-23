# ShareCode

无需登录，一键分享码。粘贴多个码，生成短链接，每位访问者领取一个。

<!-- README-I18N:START -->

[English](./README.md) | **简体中文** | [日本語](./README.ja.md)

<!-- README-I18N:END -->

## 为什么需要 ShareCode？

在群聊中分享激活码、邀请码或兑换码时，常出现重复领取、混乱不清的问题。ShareCode 从码池中为每位访问者公平地分配一个码——原子操作、无重复、全程可追踪。

## 功能特性

- 一键创建分享 — 粘贴码（每行一个），获取领取链接和管理链接
- 原子领取 — Redis Lua 脚本防止并发重复发放
- 实时统计 — 总数 / 已领取 / 剩余，逐码时间戳与转化率
- 自动过期 — Redis TTL 自动清理，默认 7 天（可配置）
- 限流防刷 — 创建和领取接口均支持 IP 维度限速
- 多语言界面 — 中文、英文、日文，自动检测浏览器语言并支持手动切换

## 快速开始

### 前置要求

- Node.js 22+
- pnpm 10+
- Redis（本地或 Docker）

### 安装与运行

```bash
git clone https://github.com/deepmuse/ShareCode.git
cd ShareCode
cp .env.example .env
pnpm install

# 启动 Redis
docker compose up -d redis

# 启动开发服务器（前端 :5173 + 后端 :3001）
pnpm dev
```

### 生产构建

```bash
pnpm build
```

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | React · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| 后端 | Node.js · Express · TypeScript |
| 存储 | Redis（Lua 原子领取） |
| 国际化 | react-i18next · i18next-browser-languagedetector |
| 部署 | Docker · docker-compose |

## 项目结构

```
ShareCode/
├── packages/
│   ├── client/                 # 前端 (React + Vite)
│   │   └── src/
│   │       ├── components/      # UI 组件
│   │       ├── hooks/           # useLanguage 等
│   │       ├── i18n/            # 国际化配置与语言 JSON
│   │       ├── lib/             # API 客户端、工具函数
│   │       └── pages/           # 创建 / 领取 / 统计
│   └── server/                 # 后端 (Express)
│       └── src/
│           ├── middleware/      # 校验、限流、日志
│           ├── routes/         # share · claim · manage
│           └── utils/          # Redis、短码、错误码
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── LICENSE
```

## API 参考

### 创建分享

```http
POST /api/share
Content-Type: application/json

{ "codes": ["CODE_A", "CODE_B"], "expireHours": 168 }
```

```json
{ "shareId": "a1B2c3", "claimUrl": "https://domain/s/a1B2c3", "manageUrl": "https://domain/manage/a1B2c3?token=xxxx", "total": 2, "expiresAt": "2026-04-30T12:00:00Z" }
```

### 领取码

```http
POST /api/claim/:shareId
```

```json
{ "status": "ok", "code": "CODE_B", "remain": 1 }
```

### 查看统计

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

### 健康检查

```http
GET /api/health
```

```json
{ "status": "ok", "timestamp": "2026-04-23T12:00:00Z" }
```

## 错误响应

所有错误响应包含 `code`、`i18nKey` 和 `message` 三个字段。前端应使用 `i18nKey` 翻译，`message` 为中文回退。

```json
{ "status": "error", "code": 41002, "i18nKey": "codesExhausted", "message": "码已领完" }
```

| 错误码 | i18nKey | 说明 |
|--------|---------|------|
| 40001 | `invalidParams` | 参数不合法 |
| 40002 | `emptyCodes` | 码列表为空 |
| 40003 | `exceedLimit` | 超出创建上限 |
| 40301 | `invalidToken` | 管理凭证无效 |
| 40401 | `shareNotFound` | 分享不存在 |
| 41001 | `shareExpired` | 分享已过期 |
| 41002 | `codesExhausted` | 码已领完 |
| 42901 | `rateLimited` | 请求过于频繁 |
| 50001 | `internalError` | 服务内部错误 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务端口 |
| `REDIS_URL` | `redis://localhost:6379` | Redis 连接地址 |
| `APP_URL` | `http://localhost:5173` | 前端 URL（CORS + 链接生成） |
| `DEFAULT_EXPIRE_HOURS` | `168` | 默认过期时间（小时） |
| `MAX_CODES_PER_SHARE` | `1000` | 单次创建上限 |
| `SHORT_CODE_LENGTH` | `6` | 短码长度（Base62） |
| `RATE_LIMIT_CREATE_MAX` | `10` | 创建接口限流（次/分钟） |
| `RATE_LIMIT_CLAIM_MAX` | `5` | 领取接口限流（次/分钟） |

## Docker 部署

```bash
docker compose up -d
```

## 许可证

[MIT](./LICENSE)