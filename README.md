# 绘境 AI

绘境 AI 是一个电影式 AI 图像创作网站。当前版本包含黑银高对比营销首页、公开开放的生图工作台、本地历史影像以及下载/删除能力，整体视觉保持电影官网、奢侈品牌广告片和艺术杂志封面的质感。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest
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

复制 `.env.example` 为 `.env.local`，并按运行场景填入火山引擎配置。

```env
# true: 无需外部服务即可本地预览；false: 使用真实火山方舟配置
DEMO_MODE=false

# 应用公开地址；生产环境请改成 Vercel 正式域名
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 仅服务端使用
VOLCENGINE_API_KEY=
# 兼容旧变量名；如果已填写 VOLCENGINE_API_KEY，这里可以留空
ARK_API_KEY=
VOLCENGINE_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
VOLCENGINE_IMAGE_MODEL=doubao-seedream-4-5-251128
```

注意：

- `DEMO_MODE=true` 适合纯视觉预览；生产环境接入真实火山方舟时应设置为 `false`。
- `NEXT_PUBLIC_APP_URL` 本地使用 `http://localhost:3000`，上线后改成 Vercel 正式域名。
- `VOLCENGINE_API_KEY` 只能用于服务端，不要提交到 GitHub。
- 历史影像保存在当前浏览器的本地存储中，不需要数据库。

## 部署

项目包含 `vercel.json`，Vercel 导入 GitHub 仓库后会使用：

- Install Command: `npm ci`
- Build Command: `npm run build`
- Framework: Next.js

部署时请在 Vercel Project Settings 中配置 `.env.example` 中列出的变量。真实密钥只放在 Vercel 环境变量中，不提交到仓库。

生产环境建议：

- `DEMO_MODE=false`
- `NEXT_PUBLIC_APP_URL` 设置为 Vercel 正式域名
- `VOLCENGINE_API_KEY` 设置为可用的火山方舟 API Key

## 开源协议

本项目使用 MIT License。
