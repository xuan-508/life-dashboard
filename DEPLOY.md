# Life Dashboard 部署指南

> 本指南面向 **Cloudflare Pages** 静态托管，覆盖本地构建、环境变量、KV / R2 绑定、上传部署与常见问题排查。

---

## 1. 项目简介

- **名称**：life-dashboard
- **技术栈**：Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **构建产物**：静态导出目录 `out/`
- **边缘函数**：`functions/api/save.js`、`functions/api/load.js`（Cloudflare Pages Functions）
- **数据存储**：Cloudflare KV（模块数据），可选 Cloudflare R2（外观图片等静态资源）

---

## 2. 命名约定（重要）

| 用途 | 变量 / 绑定名 | 说明 |
|------|--------------|------|
| KV namespace 绑定 | `PORTFOLIO_KV` | Pages Functions 中通过 `env.PORTFOLIO_KV` 读写数据 |
| R2 bucket 绑定（可选） | `PORTFOLIO_R2` | 用于存储外观图片等静态资源 |
| 管理鉴权密码 | `ADMIN_PASSWORD` | 边缘函数运行时通过 `env.ADMIN_PASSWORD` 读取 |
| 前端鉴权密码 | `NEXT_PUBLIC_ADMIN_PASSWORD` | 构建时内联到前端代码，调用 `/api/*` 时使用 |

> 注意：`NEXT_PUBLIC_` 前缀的变量会在构建时被内联到前端 bundle，请确保只用于非敏感或已公开的前端配置。`ADMIN_PASSWORD` 只配置在 Cloudflare Pages 后台，不写入 `.env.local`。

---

## 3. 本地开发构建

### 3.1 安装依赖

```bash
npm install
```

### 3.2 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_ADMIN_PASSWORD=your-secret-key-here
```

### 3.3 构建静态产物

```bash
npm run build
```

构建成功后生成 `out/` 目录，包含 `index.html` 与 `_next/` 等静态资源。

### 3.4 本地预览（可选）

```bash
npx serve out
```

---

## 4. Cloudflare 资源准备

### 4.1 创建 KV Namespace

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入左侧菜单 **Storage & Databases > KV**
3. 点击 **Create a namespace**，命名为 `life-dashboard-data`
4. 复制生成的 **Namespace ID**

### 4.2 更新 `wrangler.toml`

```toml
[[kv_namespaces]]
binding = "PORTFOLIO_KV"
id = "your-kv-namespace-id"
```

> 仓库中的 `id` 是示例值，部署前务必替换为你自己的 Namespace ID。

### 4.3 创建 R2 Bucket（可选）

1. 进入 **Storage & Databases > R2**
2. 点击 **Create bucket**，命名为 `life-dashboard-assets`
3. 若需公开访问，配置自定义域名或公开访问策略
4. 取消注释 `wrangler.toml` 中的 R2 配置：

```toml
[[r2_buckets]]
binding = "PORTFOLIO_R2"
bucket_name = "life-dashboard-assets"
```

---

## 5. Cloudflare Pages 部署

### 方式一：Wrangler CLI（推荐）

#### 5.1 登录 Cloudflare

```bash
npx wrangler login
```

#### 5.2 部署

```bash
npm run build
npx wrangler pages deploy out --project-name life-dashboard
```

首次部署会提示创建 Pages 项目，按提示操作即可。

#### 5.3 配置环境变量

部署后进入 **Pages 项目 > Settings > Environment variables**，为 **Production** 和 **Preview** 分别添加：

| 变量名 | 值 |
|--------|-----|
| `ADMIN_PASSWORD` | 与 `NEXT_PUBLIC_ADMIN_PASSWORD` 保持一致 |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 前端构建时使用的鉴权密码 |

> 每次修改 `NEXT_PUBLIC_*` 变量后，都需要重新触发构建才能生效。

#### 5.4 绑定 KV / R2

进入 **Pages 项目 > Settings > Functions > Bindings**，添加：

- KV namespace：变量名 `PORTFOLIO_KV`，选择已创建的 KV namespace
- R2 bucket（可选）：变量名 `PORTFOLIO_R2`，选择已创建的 bucket

### 方式二：Dashboard 手动上传

1. 在本地执行 `npm run build` 生成 `out/` 目录
2. 进入 [Cloudflare Pages](https://dash.cloudflare.com/pages)
3. 点击 **Create a project > Upload assets**
4. 项目名填写 `life-dashboard`
5. 上传 `out/` 目录下所有文件
6. 完成后在 **Settings > Functions > Bindings** 中绑定 `PORTFOLIO_KV`
7. 在 **Settings > Environment variables** 中配置 `ADMIN_PASSWORD` 与 `NEXT_PUBLIC_ADMIN_PASSWORD`
8. 重新上传或触发部署以应用更改

---

## 6. 部署后验证

### 6.1 访问首页

打开 Cloudflare Pages 分配的域名，确认仪表盘正常显示。

### 6.2 验证云同步

1. 在任意模块添加一条数据
2. 等待自动同步或点击手动同步按钮
3. 刷新页面，确认数据未丢失
4. 打开浏览器开发者工具，检查 `/api/save` 与 `/api/load` 请求返回 `ok: true`

### 6.3 验证鉴权

如果返回 `401 Unauthorized`，请检查：
- 前端 `NEXT_PUBLIC_ADMIN_PASSWORD` 是否与后端 `ADMIN_PASSWORD` 一致
- Cloudflare Pages 后台是否正确设置了环境变量
- 修改环境变量后是否重新部署

---

## 7. 常见故障排查

### 7.1 构建失败：`Error during a trash operation`

这是部分环境在覆盖删除旧 `out/` 目录时的 safe-delete 拦截问题。解决方式：

```bash
# 手动分批清理旧产物
rm -rf out/cache out/types out/server out/static
rm -f out/*.json out/trace
rmdir out

# 重新构建
npm run build
```

### 7.2 `/api/save` 或 `/api/load` 404

- 确认 `wrangler.toml` 存在且配置正确
- 确认 `functions/api/` 目录随 `out/` 一起被部署
- 若使用 Dashboard 手动上传，Functions 需要在项目设置中启用

### 7.3 数据没有持久化

- 确认 `PORTFOLIO_KV` 绑定已正确添加到 Pages 项目
- 确认 KV namespace ID 与 `wrangler.toml` 中的 `id` 一致
- 检查浏览器网络面板，确认请求体中包含正确的 `secret`

### 7.4 图片/外观资源加载失败（使用 R2 时）

- 确认 `PORTFOLIO_R2` 绑定已添加
- 确认 R2 bucket 已配置公开访问或自定义域名
- 确认上传的资源路径与前端代码中的引用一致

---

## 8. 重新部署流程

每次代码更新后：

```bash
npm run build
npx wrangler pages deploy out --project-name life-dashboard
```

若仅修改环境变量或绑定，直接在 Cloudflare Dashboard 中修改后重新部署即可。

---

## 9. 参考链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js 静态导出](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
