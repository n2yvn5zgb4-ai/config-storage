# 远程存储订阅服务

[English](./README_EN.md) | 简体中文

该项目为 RayBoxUI 配套项目，提供基于 Cloudflare Workers 和 KV 数据库的配置存储和订阅服务。

## 下载 RayBoxUI
[![Download on the App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/us/app/rayboxui/id6751304782)

## 部署方法

点击下方按钮一键部署到 Cloudflare Workers：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jekylor/Remote-Storage-Subscription)

### 配置页面填写指南

点击部署按钮后，你将看到 Cloudflare Workers 的配置页面，请按以下说明填写：

#### 1. 账号设置
- **Account** - 选择你的 Cloudflare 账号（如果没有账号，需要先注册）

#### 2. 创建 KV 命名空间
在部署前，需要先创建 KV 命名空间：

1. 点击 **Create a namespace**
2. 命名空间名称输入：`config-storage`

#### 3. 环境变量设置

在配置页面的 **Environment Variables** 部分，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SECRET` | `your-secret-key-here` | 用于生成和验证 Token 的密钥，请设置为强密码 |

#### 4. 完成部署

填写完成后，点击 **Deploy** 按钮，等待部署完成。

部署成功后，你会获得一个 Worker URL，格式类似：
```
https://config-storage.your-subdomain.workers.dev
```

### 测试部署

使用健康检查接口测试部署是否成功：

```bash
# 首先生成健康检查的 token
# token = SHA256("health-check" + "your-secret-key")

curl "https://config-storage.your-subdomain.workers.dev/?token=<your-health-check-token>"
```

如果返回 `{"status":"ok","service":"config-storage"}`，说明部署成功！

## 接口说明

### 认证机制

所有接口都需要提供有效的 Token。

**Token 生成方式：**
```
token = SHA256(id + secret)
```

其中：
- `id` 是配置的 UUID（健康检查接口使用固定值 `health-check`）
- `secret` 是服务器端的密钥，存储在环境变量 `SECRET` 中

### 1. 健康检查

```
GET /?token={token}
```

或使用 Authorization 头：
```
GET /
Authorization: Bearer {token}
```

**注意：** 健康检查使用固定 ID `health-check` 生成 token：
```
token = SHA256("health-check" + secret)
```

**响应（成功）：**
```json
{
  "status": "ok",
  "service": "config-storage"
}
```

**响应（失败）：**
```json
{
  "success": false,
  "error": "Missing token"
}
```
或
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### 2. 创建或更新配置

```
POST /api/config
Content-Type: application/json

{
  "uuid": "config-id",
  "token": "sha256-token",
  "name": "配置名称",
  "config": { ... }
}
```

**响应（成功）：**
```json
{
  "success": true,
  "message": "Configuration created",
  "data": {
    "id": "config-id",
    "name": "配置名称",
    "config": { ... },
    "createdAt": "2025-10-20T12:00:00.000Z",
    "updatedAt": "2025-10-20T12:00:00.000Z",
    "subscriptions": []
  }
}
```

### 3. 获取配置

```
GET /api/config/{uuid}
```

**响应（成功）：** 直接返回配置对象
```json
{
  // 配置对象内容
}
```

**响应（失败）：**
```json
{
  "success": false,
  "error": "Configuration not found"
}
```

### 4. 删除配置

```
DELETE /api/config/{uuid}?token={token}
```

或使用 Authorization 头：
```
DELETE /api/config/{uuid}
Authorization: Bearer {token}
```

**响应（成功）：**
```json
{
  "success": true,
  "message": "Configuration deleted"
}
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://127.0.0.1:8787` 启动。

### 运行测试

```bash
npm test
```

### 配置环境变量

编辑 `wrangler.jsonc` 文件，设置环境变量 `SECRET`：

```jsonc
{
  "vars": {
    "SECRET": "your-secret-key-here"
  }
}
```

### 创建 KV 命名空间

```bash
npx wrangler kv:namespace create "config-storage"
npx wrangler kv:namespace create "config-storage" --preview
```

### 部署

```bash
npm run deploy
```

