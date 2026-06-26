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

复制 `.env.example` 为 `.env.local`，并填入 Supabase 项目信息。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_DB_URL=
```

注意：

- `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 可以暴露给浏览器。
- `SUPABASE_SECRET_KEY` 和 `SUPABASE_DB_URL` 只能用于服务端、迁移或管理脚本，不要提交到 GitHub。
- 当前页面尚未读取 Supabase；这些变量用于后续数据库能力接入和 Vercel 配置准备。

## 部署

项目包含 `vercel.json`，Vercel 导入 GitHub 仓库后会使用：

- Install Command: `npm ci`
- Build Command: `npm run build`
- Framework: Next.js

部署时请在 Vercel Project Settings 中配置 Supabase 环境变量。真实密钥只放在 Vercel 环境变量中，不提交到仓库。

## 开源协议

本项目使用 MIT License。
