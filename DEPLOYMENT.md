# ShareCode 部署文档

本文档提供 ShareCode 在本地、Docker、以及生产环境（单机 Docker Compose）的一套完整部署流程。

## 1. 架构说明

- 前端：React + Vite（构建后为静态资源）
- 后端：Node.js + Express（统一提供 API 与前端静态页面）
- 存储：Redis
- 编排：Docker Compose

部署后访问入口：
- 业务页面与 API 统一由 `http://<host>:3001` 提供
- 健康检查：`GET /api/health`

## 2. 前置要求

### 2.1 使用 Docker 部署（推荐）

- Docker 24+
- Docker Compose v2+

### 2.2 非 Docker（源码部署）

- Node.js 22+
- pnpm 10+
- Redis 6+

## 3. 环境变量说明

可在项目根目录创建 `.env`（参考 `.env.example`）。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务监听端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `REDIS_URL` | `redis://localhost:6379` | Redis 连接串 |
| `APP_URL` | `http://localhost:5173` | 前端来源地址（用于 CORS） |
| `API_URL` | `http://localhost:3001` | 后端对外 URL（用于返回分享链接） |
| `DEFAULT_EXPIRE_HOURS` | `168` | 默认过期时间（小时） |
| `MAX_CODES_PER_SHARE` | `1000` | 单次创建最大码数 |
| `SHORT_CODE_LENGTH` | `6` | 短码长度 |
| `RATE_LIMIT_CREATE_WINDOW_MS` | `60000` | 创建接口限流窗口（毫秒） |
| `RATE_LIMIT_CREATE_MAX` | `10` | 创建接口限流次数 |
| `RATE_LIMIT_CLAIM_WINDOW_MS` | `60000` | 领取接口限流窗口（毫秒） |
| `RATE_LIMIT_CLAIM_MAX` | `5` | 领取接口限流次数 |

> 生产环境建议：
> - 将 `APP_URL` 与 `API_URL` 设置为你的真实域名（含协议）。
> - 使用独立 Redis（云 Redis 或单独实例）并配置访问控制。

## 4. 一键部署（Docker Compose）

### 4.1 启动

在项目根目录执行：

```bash
docker compose up -d --build
```

该命令会：
- 构建应用镜像（前后端统一打包）
- 启动 `app` 服务（3001）
- 启动 `redis` 服务（6379）

### 4.2 查看状态

```bash
docker compose ps
docker compose logs -f app
```

### 4.3 验证可用性

```bash
curl http://localhost:3001/api/health
```

预期返回：

```json
{"status":"ok","timestamp":"..."}
```

浏览器访问：

- `http://localhost:3001`

### 4.4 停止与重启

```bash
docker compose stop
docker compose start
```

### 4.5 下线与清理

```bash
docker compose down
```

若要同时清理 Redis 持久卷：

```bash
docker compose down -v
```

## 5. 源码部署（不使用 Docker）

### 5.1 安装依赖

```bash
pnpm install
```

### 5.2 准备环境

```bash
cp .env.example .env
```

并按实际环境修改 `.env`。

### 5.3 启动 Redis

可使用本机 Redis，或执行：

```bash
docker compose up -d redis
```

### 5.4 构建

```bash
pnpm build
```

### 5.5 启动服务

```bash
pnpm --filter server start
```

启动后访问：
- `http://localhost:3001`
- `http://localhost:3001/api/health`

## 6. 打包后上传部署（推荐单机生产）

适用于“本地打包，服务器只解压运行”的场景。

### 6.1 本地生成部署包

在项目根目录执行：

```bash
pnpm package:release
```

产物为：

- `release/sharecode-server.tar.gz`

该压缩包已包含：

- 后端运行文件（`dist`）
- 后端生产依赖（`node_modules`）
- 前端构建静态资源（`public`）
- 环境变量模板（`.env.example`）

### 6.2 上传到服务器

示例（Linux 服务器）：

```bash
scp release/sharecode-server.tar.gz user@your-server:/opt/sharecode/
```

### 6.3 服务器解压与启动

```bash
cd /opt/sharecode
mkdir -p app
tar -xzf sharecode-server.tar.gz -C app
cd app
cp .env.example .env
```

按实际域名和 Redis 地址修改 `.env`（尤其 `APP_URL`、`API_URL`、`REDIS_URL`）。

启动服务：

```bash
node dist/app.js
```

建议使用 `pm2` 或 `systemd` 守护进程。

### 6.4 用 systemd 托管（示例）

创建 `/etc/systemd/system/sharecode.service`：

```ini
[Unit]
Description=ShareCode Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/sharecode/app
ExecStart=/usr/bin/node /opt/sharecode/app/dist/app.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/sharecode/app/.env
User=www-data

[Install]
WantedBy=multi-user.target
```

生效并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable sharecode
sudo systemctl start sharecode
sudo systemctl status sharecode
```

### 6.5 更新流程（上传新包）

```bash
cd /opt/sharecode
cp app/.env app/.env.bak
rm -rf app
mkdir -p app
tar -xzf sharecode-server.tar.gz -C app
cp app/.env.bak app/.env
sudo systemctl restart sharecode
```

## 7. 生产环境建议

- 反向代理（Nginx/Caddy）
  - 将 80/443 转发到 `app:3001`
  - 开启 HTTPS（Let’s Encrypt）
- 安全配置
  - Redis 不直接暴露公网端口
  - 仅放行业务所需端口
  - 配置日志轮转与备份策略
- 高可用
  - 应用与 Redis 分离部署
  - Redis 开启持久化（AOF/RDB）与监控告警

## 8. 升级流程

```bash
git pull
docker compose up -d --build
```

如仅重建应用服务：

```bash
docker compose up -d --build app
```

## 9. 故障排查

### 8.1 页面可访问但接口报错

- 检查 `REDIS_URL` 是否可达
- 查看日志：

```bash
docker compose logs -f app
```

### 8.2 接口返回限流

- 检查 `RATE_LIMIT_*` 相关配置
- 在压测场景中可适度调高限流阈值

### 8.3 容器启动失败

- 检查端口是否被占用（3001/6379）
- 执行 `docker compose config` 检查编排文件
- 执行 `docker compose logs` 查看具体错误

## 10. 当前打包验证结果

已在项目中执行并通过：

- `pnpm build`
- `pnpm package:release`
- `docker compose config`

说明当前项目可完成前后端打包，且 Docker Compose 配置有效。
