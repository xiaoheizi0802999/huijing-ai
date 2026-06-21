# 绘境 AI MVP 设计规格

日期：2026-06-21
状态：已确认，待实施计划
目标：从零构建一个可本地运行、可部署到 Vercel 的结构化 AI 图片生成网站。

## 1. 产品定义

绘境 AI 不是纯提示词输入框。用户通过主体文本与结构化选项描述目标，系统使用确定性的 `promptBuilder` 生成专业图片提示词，再由服务端调用火山方舟 `doubao-seedream-4-5-251128`。

MVP 包含：

- 首页；
- 邮箱密码注册、登录和忘记密码；
- 生图工作台；
- 生成历史；
- 每日免费积分；
- 积分不足弹窗；
- Free、Pro、Studio 升级占位页；
- 无外部密钥也可预览流程的演示模式。

MVP 不包含真实支付、收藏、删除、批量生成、多模型切换或异步任务队列，但模块边界需允许以后增加这些能力。

## 2. 已确认决策

- 品牌名称：绘境 AI；
- 前端与服务端：Next.js App Router、React、TypeScript；
- 样式：Tailwind CSS；
- 身份、数据库、图片存储：Supabase Auth、PostgreSQL、Supabase Storage；
- 登录方式：邮箱 + 密码；
- 生成模型：默认 `doubao-seedream-4-5-251128`，由环境变量覆盖；
- 图片：模型返回后由服务端转存到 Supabase 私有 Storage；
- 每日积分日期：固定按 `Asia/Shanghai` 计算；
- 部署：Vercel；
- 视觉方向：象牙编辑室；
- 生成接口：第一版同步执行，不引入任务队列；
- 提示词优化：确定性模板，不额外调用语言模型。

## 3. 整体架构

Next.js 作为单体 Web 应用，同时承载 UI、鉴权中间件和服务端生成编排接口。

```text
浏览器
  ├─ 首页 / 登录 / 创作 / 历史 / 升级
  └─ 公开 Supabase 配置
          │
          ▼
Next.js 服务端（Vercel）
  ├─ 会话验证
  ├─ 每日积分领取
  ├─ 幂等请求与积分预留
  ├─ promptBuilder
  ├─ 火山方舟调用
  ├─ 图片下载与 Storage 上传
  └─ 成功结算或失败退款
       │                 │
       ▼                 ▼
Supabase             火山方舟
Auth/Postgres/       Seedream 4.5
Private Storage
```

真实模式通过 Supabase 的 transaction pooler 连接执行 `private` schema 中的事务函数，避免把 `security definer` 函数暴露到 Data API。

推荐目录：

```text
app/
  (marketing)/page.tsx
  (auth)/login/page.tsx
  (auth)/forgot-password/page.tsx
  (app)/generate/page.tsx
  (app)/history/page.tsx
  (app)/upgrade/page.tsx
  api/generations/route.ts
  auth/callback/route.ts
components/
  layout/
  ui/
  generation/
  history/
  billing/
lib/
  prompt-builder.ts
  generation/
  supabase/
  auth/
  validation/
supabase/
  migrations/
tests/
```

## 4. 页面与交互

### 4.1 首页

- 半透明顶部导航，含首页、创作、历史、升级、登录或用户区；
- 高留白 Hero，清晰主标题、副标题和“开始生成”按钮；
- 未登录用户点击“开始生成”跳转登录，并保留登录后的目标地址；
- 三个核心卖点；
- 三步使用流程；
- 高品质示例图片网格；
- 页面底部再次提供创作 CTA。

### 4.2 登录

- 邮箱密码登录与注册；
- 忘记密码入口；
- 注册成功后建立用户资料并领取北京时间当日 5 积分；
- 登录后访问目标页；
- 已登录用户访问登录页时跳转创作页。

### 4.3 生图工作台

桌面端为 38/62 左右双栏；移动端按表单、结果顺序垂直排列。

表单字段：

- 主体；
- 图片类型：头像、海报、产品图、插画、壁纸、电商主图、社交媒体配图；
- 风格：写实、动漫、3D、赛博朋克、国风、水彩、极简、电影感、商业摄影；
- 比例：1:1、3:4、4:3、16:9、9:16；
- 质量要求：高清、细节丰富、光影自然、构图高级、背景干净；
- 补充要求；
- 负面要求。

顶部显示积分。主按钮文字为“生成图片，消耗 1 积分”。提交后按钮禁用并显示 loading，避免前端重复点击。结果区支持查看大图、下载和查看优化提示词。

### 4.4 生成历史

- 响应式高级图片网格，不做普通相册风格；
- 卡片展示图片、类型、风格、比例和时间；
- 点击卡片打开大图详情抽屉或模态框；
- 详情展示原始输入和优化提示词；
- 空状态提供美观说明和“开始创作”入口；
- 数据结构为未来删除与收藏预留扩展空间。

### 4.5 积分不足弹窗

- 明确提示当前积分不足；
- 主按钮“升级套餐”；
- 次按钮“暂时关闭”；
- 使用与全站一致的轻量毛玻璃模态框。

### 4.6 升级占位页

- Free、Pro、Studio 三个套餐；
- Pro 使用细蓝边框、轻微抬升和推荐标识；
- 所有付费按钮显示“即将上线”；
- 不创建订单，不接入支付。

## 5. 视觉系统

视觉基准为“象牙编辑室”：

参考图：`docs/superpowers/specs/assets/huijing-ai-ivory-editorial-reference.png`

- 暖白与象牙色背景；
- 大量留白和编辑式信息层级；
- 炭黑正文；
- 克制的群青蓝强调色，少量淡紫辅助；
- 选择性使用半透明白色表面；
- 1px 暖灰细边框；
- 很低透明度的柔和阴影；
- 仅在导航、模态框和少数悬浮表面使用轻微 `backdrop-blur`；
- 统一的按钮、输入框、选项块和卡片几何；
- 正文以 14–16px 为主；
- 圆角以 10–16px 为主；
- 不使用复杂动画库，仅使用 CSS/Tailwind transition；
- 不使用卡通、霓虹、廉价渐变、过量玻璃效果或层层嵌套卡片。

主要复用组件：

- `SiteHeader`、`AppHeader`；
- `Button`、`Input`、`Textarea`、`OptionChip`、`CreditBadge`；
- `GlassPanel`、`ImageCard`、`EmptyState`；
- `ImageLightbox`、`InsufficientCreditsDialog`；
- `PricingCard`；
- `GenerationForm`、`GenerationResult`、`OptimizedPromptPanel`。

## 6. 数据模型

所有 `public` 表启用 RLS。客户端不得直接修改积分或创建积分日志。

### 6.1 users_profile

```text
id uuid primary key
user_id uuid unique not null references auth.users
credits integer not null default 0 check (credits >= 0)
last_daily_credit_date date
created_at timestamptz
updated_at timestamptz
```

### 6.2 generation_history

```text
id uuid primary key
user_id uuid not null references auth.users
request_id uuid unique not null
original_input jsonb not null
optimized_prompt text not null
image_url text not null
storage_path text
image_type text not null
style text not null
aspect_ratio text not null
cost_credits integer not null default 1
created_at timestamptz
```

`image_url` 保存可供应用解析的稳定标识；实际访问私有图片时生成短时签名 URL。`storage_path` 为未来迁移或重新签名提供明确位置。

### 6.3 credit_logs

```text
id uuid primary key
user_id uuid not null references auth.users
change_amount integer not null
reason text not null
related_generation_id uuid references generation_history
request_id uuid
created_at timestamptz
```

每日赠送、生成预留、生成成功确认和失败退款均可审计。实现时应使用稳定的 `reason` 枚举值。

### 6.4 generation_requests

```text
id uuid primary key
request_id uuid unique not null
user_id uuid not null references auth.users
status text not null
reserved_credits integer not null default 0
generation_id uuid references generation_history
error_code text
created_at timestamptz
updated_at timestamptz
```

状态至少包含 `processing`、`succeeded`、`failed`。`request_id` 与 `user_id` 共同校验，防止其他用户探测或复用请求。

### 6.5 Storage

- 使用私有 bucket，例如 `generations`；
- 路径格式：`{user_id}/{generation_id}.{extension}`；
- 浏览器不直接使用管理员密钥；
- 历史页由服务端创建短时签名 URL；
- 管理员密钥仅存在服务端环境变量中。

## 7. RLS 与服务端权限

- `users_profile`：用户只能读取自己的行；
- `generation_history`：用户只能读取自己的历史；
- `credit_logs`：用户只能读取自己的日志；
- `generation_requests`：默认不从浏览器直接访问；
- 积分变化、请求预留、成功结算和失败退款由受控数据库函数执行；
- 权限判断不使用可由用户编辑的 `user_metadata`；
- Supabase secret key 不得出现在 `NEXT_PUBLIC_*` 环境变量中。

数据库函数优先放在未暴露 schema 中，并撤销不必要的公共执行权限。

## 8. 每日积分

北京时间日期通过数据库统一计算，不依赖 Vercel 服务器本地时区：

```sql
(now() at time zone 'Asia/Shanghai')::date
```

逻辑：

1. 注册触发器创建 `users_profile`；
2. 首次初始化时领取当日 5 积分；
3. 用户登录后或进入受保护页面时，服务端调用一次领取函数；
4. 函数锁定用户资料行；
5. 若 `last_daily_credit_date` 早于北京时间今日，则增加 5 积分并写日志；
6. 同一自然日重复调用不增加积分。

## 9. promptBuilder

`promptBuilder(input)` 为纯函数，输出：

```ts
type PromptBuildResult = {
  prompt: string;
  negativePrompt: string;
  combinedPrompt: string;
};
```

输入包含主体、图片类型、风格、比例、质量要求、补充要求和负面要求。

提示词按稳定顺序组合：

1. 主体描述；
2. 使用场景与图片类型；
3. 场景；
4. 艺术风格；
5. 构图；
6. 镜头语言；
7. 光影；
8. 色彩；
9. 材质与细节；
10. 清晰度与质量；
11. 画面比例；
12. 负面提示词。

系统提供默认负面词：低清晰度、模糊、畸形、多余肢体、文字、水印、logo、过度曝光、构图混乱、低质量。用户负面要求去重后追加。

第一版不调用语言模型优化提示词，以降低延迟、成本和不可控性。

## 10. 生成与积分事务

### 10.1 提交

前端为每次用户主动生成创建 UUID `request_id`。同一次请求重试必须复用该 ID；用户明确点击“再次生成”时创建新 ID。

### 10.2 原子预留

服务端先调用数据库函数：

1. 验证用户；
2. 领取当日免费积分；
3. 检查相同 `request_id`；
4. 若已成功，返回已有生成结果；
5. 若处理中，返回处理中状态；
6. 若为新请求，锁定积分行；
7. 余额不足则返回 `INSUFFICIENT_CREDITS`；
8. 余额充足则预留 1 积分，写请求状态和预留日志。

预留会暂时降低可用积分，避免并发请求超额调用模型。

### 10.3 模型调用与转存

- 使用环境变量中的 endpoint、API key 和模型名；
- 请求体由独立 provider adapter 构造，方便未来换模型；
- 只允许服务端发起请求；
- 对模型超时、非 2xx、空结果和无效 URL 做明确错误映射；
- 下载图片时限制响应类型与最大大小；
- 上传至 Supabase 私有 Storage。

### 10.4 成功结算

数据库函数在一个事务中：

- 创建 `generation_history`；
- 将预留日志关联到生成记录，或写成功确认日志；
- 把 `generation_requests` 标记为 `succeeded`；
- 保持已预留的 1 积分为最终消耗。

### 10.5 失败退款

若模型调用、下载或 Storage 上传失败：

- 调用失败函数；
- 锁定请求行；
- 仅当请求仍为 `processing` 且存在预留时退回 1 积分；
- 写退款日志；
- 标记请求 `failed`；
- 重复执行失败函数不会重复退款。

因此失败后的最终余额不变。

## 11. 演示模式

当 `DEMO_MODE=true` 时：

- 应用页面和全部交互可运行；
- 使用预置示例图模拟生成结果；
- 无 Supabase 或火山方舟密钥时，使用进程内演示适配器模拟登录、积分、历史和幂等逻辑；
- UI 明确显示演示标识；
- 不调用火山方舟；
- 演示数据只用于本地预览，开发进程重启后可以重置；
- 正式环境默认要求显式关闭演示模式并提供全部密钥。

演示模式与真实模式共享页面、表单、提示词和编排接口，但不会被描述为真实持久化或真实安全边界。

## 12. API 设计

### POST /api/generations

请求：

```json
{
  "requestId": "uuid",
  "subject": "一只穿西装的橘猫",
  "imageType": "头像",
  "style": "商业摄影",
  "aspectRatio": "1:1",
  "qualityRequirements": ["高清", "细节丰富", "背景干净"],
  "additionalRequirements": "有高级感",
  "negativeRequirements": "不要文字"
}
```

成功返回：

```json
{
  "generation": {
    "id": "uuid",
    "imageUrl": "signed-url",
    "optimizedPrompt": "...",
    "createdAt": "..."
  },
  "credits": 4
}
```

主要错误码：

- `UNAUTHENTICATED`；
- `VALIDATION_ERROR`；
- `INSUFFICIENT_CREDITS`；
- `REQUEST_IN_PROGRESS`；
- `MODEL_ERROR`；
- `STORAGE_ERROR`；
- `INTERNAL_ERROR`。

错误响应包含用户可见消息与安全的请求编号，不返回密钥、供应商原始敏感内容或内部堆栈。

## 13. 环境变量

`.env.example` 至少包含：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_DB_URL=
VOLCENGINE_API_KEY=
VOLCENGINE_IMAGE_API_URL=
VOLCENGINE_IMAGE_MODEL=doubao-seedream-4-5-251128
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

公开配置只允许 Supabase URL 和 publishable key。Supabase secret key、数据库连接串和模型密钥只在服务端读取。

## 14. 错误与恢复

- 未登录：跳转登录并保留 `next`；
- 积分不足：不调用模型，打开升级弹窗；
- 模型失败：自动退款并保留表单；
- 转存失败：自动退款，可安全重试；
- 重复提交：返回原结果或处理中状态；
- 签名 URL 过期：重新生成，不修改历史；
- 未知错误：显示通用提示和请求编号。

## 15. 测试与验收

### 单元测试

- `promptBuilder` 字段顺序、映射、默认负面词、用户负面词去重；
- 比例与风格映射；
- API 输入校验；
- 供应商响应解析。

### 数据库测试

- 新用户获得 5 积分；
- 北京时间同日不重复赠送；
- 跨日只赠送一次；
- 余额不足不能预留；
- 两个并发请求不能超额预留；
- 同一 `request_id` 不重复扣费；
- 失败退款只执行一次；
- 用户无法读取他人数据。

### API 测试

- 未登录；
- 参数错误；
- 积分不足；
- 演示模式成功；
- 模型失败；
- Storage 失败；
- 成功生成、历史入库和积分变化。

### UI 与构建验收

- 类型检查和生产构建通过；
- 首页、登录、生图、历史、升级页可导航；
- 桌面双栏与移动单列无溢出；
- loading 时按钮不可重复点击；
- 积分不足弹窗功能完整；
- 历史大图和提示词可查看；
- 演示模式可完成端到端流程。

## 16. 部署策略

1. 创建 Supabase 项目；
2. 执行数据库迁移与 Storage 配置；
3. 配置 Auth Site URL 和 Vercel 回调 URL；
4. 在 Vercel 配置环境变量；
5. 初次部署可先使用 `DEMO_MODE=true` 验证页面、鉴权和数据库；
6. 配置火山方舟密钥后关闭演示模式；
7. 执行一次注册、每日赠送、真实生成、历史读取和失败退款验收。

## 17. 后续扩展边界

- 支付与套餐：新增 plans、subscriptions、payment_events；
- 收藏：在历史表增加状态或建立 favorites 表；
- 批量生成：一个父请求关联多个生成项；
- 多模型：provider adapter 与模型配置表；
- 异步任务：将当前编排迁移至队列，保留相同 request_id 与结算函数；
- 图片删除：软删除历史并异步清理 Storage；
- 内容审核：在模型调用前后加入独立审核步骤。
