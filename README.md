# 绘境 AI

绘境 AI 是一个电影式 AI 图像创作网站。当前版本包含黑银高对比营销首页、登录后可用的生图工作台、云端历史影像、每日积分与本地下载/删除能力，整体视觉保持电影官网、奢侈品牌广告片和艺术杂志封面的质感。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest
- Supabase Auth / Postgres / Storage
- 火山方舟 Doubao-Seedream-4.5
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
- `/generate/history`

## 验证

发布前建议运行完整验证：

```bash
npm run verify
```

该命令会依次运行代码检查、类型检查、测试和生产构建。

## 环境变量

复制 `.env.example` 为 `.env.local`，并按运行场景填入 Supabase 和火山引擎配置。

```env
# true: 无需外部服务即可本地预览；false: 使用真实 Supabase 与火山方舟配置
DEMO_MODE=false

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
# 兼容旧变量名；如果已填写 VOLCENGINE_API_KEY，这里可以留空
ARK_API_KEY=
VOLCENGINE_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
VOLCENGINE_IMAGE_MODEL=doubao-seedream-4-5-251128
```

注意：

- `DEMO_MODE=true` 适合纯视觉预览；生产环境接入真实 Supabase 和火山方舟时应设置为 `false`。
- `NEXT_PUBLIC_APP_URL` 本地使用 `http://localhost:3000`，上线后改成 Vercel 正式域名。
- `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 可以暴露给浏览器。
- `SUPABASE_SECRET_KEY`、`SUPABASE_DB_URL` 和 `VOLCENGINE_API_KEY` 只能用于服务端、迁移或管理脚本，不要提交到 GitHub。
- 登录链接需要 Supabase Auth 的 Site URL / Redirect URLs 覆盖本地与生产域名。
- 如果使用 Brevo 等自定义 SMTP，请确认发件人邮箱已在 SMTP 服务商侧验证，并且 Supabase 的 Sender email 与已验证 sender 一致。

## Supabase

数据库迁移位于 `supabase/migrations`。已有迁移会创建：

- 用户积分档案 `users_profile`
- 生图历史 `generation_history`
- 积分流水 `credit_logs`
- 幂等生图请求 `generation_requests`
- 私有 Storage bucket `generations`
- 只允许用户读取自己数据的 RLS 策略

将 `.env.local` 中的 `SUPABASE_DB_URL` 配置为 Supabase transaction pooler 连接串后，可以推送迁移：

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

## 部署

项目包含 `vercel.json`，Vercel 导入 GitHub 仓库后会使用：

- Install Command: `npm ci`
- Build Command: `npm run build`
- Framework: Next.js

部署时请在 Vercel Project Settings 中配置 `.env.example` 中列出的变量。真实密钥只放在 Vercel 环境变量中，不提交到仓库。

生产环境建议：

- `DEMO_MODE=false`
- `NEXT_PUBLIC_APP_URL` 设置为 Vercel 正式域名
- Supabase Auth 的 Site URL 设置为同一个正式域名
- Supabase Redirect URLs 添加 `https://你的域名/generate` 和 `https://你的域名/generate/history`

## 开源协议

本项目使用 MIT License。
