# 绘境 AI

绘境 AI 是一个基于 Next.js 的 AI 图像创作落地页项目。当前版本聚焦首页展示、作品画廊、创作入口和会员升级占位交互，真实 AI 生图、用户系统、积分扣减和支付能力将在后续接入。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest
- Supabase（数据库规划）
- Vercel（部署）

## 本地运行

请使用 Node.js 24。

```bash
npm ci
npm run dev
```

打开本地开发地址后可以访问：

- `/`
- `/generate`

## 验证

发布前建议运行完整验证：

```bash
npm run verify
```

该命令会依次运行代码检查、类型检查、测试和生产构建。

## 环境变量

复制 `.env.example` 为 `.env.local`，并按运行场景填入 Supabase 和火山引擎配置。

```env
# true: 无需外部服务即可本地预览；false: 必须填写全部真实配置
DEMO_MODE=true

# 应用公开地址；生产环境请改成 Vercel 正式域名
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 浏览器可见的 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# 仅服务端使用；不要添加 NEXT_PUBLIC_ 前缀
SUPABASE_SECRET_KEY=

# 使用 Supabase Connect 提供的 transaction pooler 连接串
SUPABASE_DB_URL=

# 仅服务端使用
VOLCENGINE_API_KEY=
VOLCENGINE_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
VOLCENGINE_IMAGE_MODEL=doubao-seedream-4-5-251128
```

注意：

- `DEMO_MODE=true` 适合本地预览；生产环境接入真实 Supabase 和火山引擎时应设置为 `false`。
- `NEXT_PUBLIC_APP_URL` 本地使用 `http://localhost:3000`，上线后改成 Vercel 正式域名。
- `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 可以暴露给浏览器。
- `SUPABASE_SECRET_KEY`、`SUPABASE_DB_URL` 和 `VOLCENGINE_API_KEY` 只能用于服务端、迁移或管理脚本，不要提交到 GitHub。
- 当前页面尚未读取 Supabase；这些变量用于后续数据库能力接入和 Vercel 配置准备。

## 部署

项目包含 `vercel.json`，Vercel 导入 GitHub 仓库后会使用：

- Install Command: `npm ci`
- Build Command: `npm run build`
- Framework: Next.js

部署时请在 Vercel Project Settings 中配置 Supabase 和火山引擎环境变量。真实密钥只放在 Vercel 环境变量中，不提交到仓库。

## 开源协议

本项目使用 MIT License。
