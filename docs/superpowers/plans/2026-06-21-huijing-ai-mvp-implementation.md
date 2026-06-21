# 绘境 AI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并验证一个可在无密钥演示模式运行、配置 Supabase 与火山方舟后可真实生成图片并部署至 Vercel 的绘境 AI MVP。

**Architecture:** Next.js 16 App Router 同时承载页面与服务端编排。真实模式使用 Supabase SSR Auth、私有 Storage、PostgreSQL `private` schema 事务函数；演示模式通过相同应用接口切换到进程内适配器。生成流程先原子预留积分，再构造提示词、调用 Seedream、转存图片，最终成功结算或幂等退款。

**Tech Stack:** Next.js 16.2、React 19.2、TypeScript 6、Tailwind CSS 4、Supabase SSR/Auth/PostgreSQL/Storage、Zod 4、postgres.js、Vitest、Testing Library、Vercel。

---

## 文件结构

```text
app/
  (auth)/
    login/page.tsx
    forgot-password/page.tsx
    update-password/page.tsx
  (dashboard)/
    layout.tsx
    generate/page.tsx
    history/page.tsx
    upgrade/page.tsx
  api/generations/route.ts
  auth/confirm/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  auth/auth-form.tsx
  billing/insufficient-credits-dialog.tsx
  billing/pricing-card.tsx
  generation/generation-form.tsx
  generation/generation-result.tsx
  generation/option-group.tsx
  history/history-grid.tsx
  history/history-lightbox.tsx
  layout/app-header.tsx
  layout/site-header.tsx
  ui/button.tsx
  ui/credit-badge.tsx
  ui/empty-state.tsx
  ui/glass-panel.tsx
  ui/input.tsx
  ui/textarea.tsx
lib/
  auth/actions.ts
  auth/session.ts
  demo/store.ts
  generation/download-image.ts
  generation/errors.ts
  generation/orchestrator.ts
  generation/repository.ts
  generation/storage.ts
  generation/volcengine.ts
  generation/volcengine-sizes.ts
  history/repository.ts
  prompt-builder.ts
  runtime/env.ts
  runtime/mode.ts
  supabase/admin.ts
  supabase/client.ts
  supabase/database.types.ts
  supabase/db.ts
  supabase/proxy.ts
  supabase/server.ts
  validation/generation.ts
  utils.ts
public/examples/
proxy.ts
supabase/
  config.toml
  migrations/*_initial_schema.sql
  tests/database/credits_and_rls.test.sql
tests/
  setup.ts
  auth/next-path.test.ts
  components/generation-form.test.tsx
  generation/orchestrator.test.ts
  generation/volcengine.test.ts
  prompt-builder.test.ts
  validation/generation.test.ts
.env.example
README.md
vitest.config.ts
```

## Task 1：初始化 Next.js、Tailwind 与测试框架

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`

- [ ] **Step 1: 创建依赖清单**

创建 `package.json`：

```json
{
  "name": "huijing-ai",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@supabase/ssr": "0.12.0",
    "@supabase/supabase-js": "2.108.2",
    "clsx": "2.1.1",
    "lucide-react": "1.21.0",
    "next": "16.2.9",
    "postgres": "3.4.9",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "tailwind-merge": "3.6.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@types/node": "26.0.0",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "eslint": "10.5.0",
    "eslint-config-next": "16.2.9",
    "jsdom": "29.1.1",
    "tailwindcss": "4.3.1",
    "typescript": "6.0.3",
    "vitest": "4.1.9"
  }
}
```

- [ ] **Step 2: 安装依赖并生成锁文件**

Run:

```powershell
npm install
```

Expected: `package-lock.json` 和 `node_modules/` 生成，命令退出码为 0。

- [ ] **Step 3: 创建 TypeScript、Next、PostCSS、ESLint 配置**

`tsconfig.json` 使用 `strict: true`、`moduleResolution: "bundler"`、`paths: { "@/*": ["./*"] }`。
`postcss.config.mjs`：

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

`eslint.config.mjs`：

```js
import { defineConfig, globalIgnores } from "eslint/config"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "coverage/**", "next-env.d.ts"]),
])
```

- [ ] **Step 4: 创建测试配置并先运行空测试**

`vitest.config.ts`：

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: { reporter: ["text", "html"] },
  },
})
```

`tests/setup.ts`：

```ts
import "@testing-library/jest-dom/vitest"
```

Run:

```powershell
npm test -- --passWithNoTests
```

Expected: PASS，显示没有测试文件但退出码为 0。

- [ ] **Step 5: 创建最小根布局和首页占位**

`app/layout.tsx` 设置 `lang="zh-CN"`、元数据 `绘境 AI`。
`app/globals.css` 以 `@import "tailwindcss";` 开头。
`app/page.tsx` 只返回 `<main>绘境 AI</main>`，用于验证工具链。

- [ ] **Step 6: 验证并提交**

Run:

```powershell
npm run lint
npm run typecheck
npm run build
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs next-env.d.ts vitest.config.ts tests/setup.ts app
git commit -m "chore: scaffold next app and test harness"
```

Expected: lint、类型检查、构建全部通过；产生一次提交。

## Task 2：实现象牙编辑室设计令牌与基础组件

**Files:**
- Create: `lib/utils.ts`
- Modify: `app/globals.css`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/glass-panel.tsx`
- Create: `components/ui/credit-badge.tsx`
- Create: `components/ui/empty-state.tsx`
- Create: `tests/components/ui-primitives.test.tsx`

- [ ] **Step 1: 编写基础组件失败测试**

`tests/components/ui-primitives.test.tsx`：

```tsx
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import { CreditBadge } from "@/components/ui/credit-badge"

it("renders a disabled loading button", () => {
  render(<Button loading>生成图片</Button>)
  expect(screen.getByRole("button")).toBeDisabled()
  expect(screen.getByText("处理中")).toBeInTheDocument()
})

it("renders the credit balance", () => {
  render(<CreditBadge credits={5} />)
  expect(screen.getByText("5 积分")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/ui-primitives.test.tsx
```

Expected: FAIL，提示组件模块不存在。

- [ ] **Step 3: 实现工具函数与组件**

`lib/utils.ts`：

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`Button` 支持 `variant: "primary" | "secondary" | "ghost"`、`loading`、原生按钮属性；loading 时禁用并显示旋转图标与“处理中”。
`Input`、`Textarea` 统一使用象牙白背景、`border-stone-200`、群青 focus ring。
`GlassPanel` 使用 `bg-white/72 backdrop-blur-md border border-white/80 shadow-[0_18px_60px_rgba(31,41,55,0.07)]`。
`CreditBadge` 输出 `{credits} 积分`。
`EmptyState` 接收标题、说明和 action。

- [ ] **Step 4: 写入 Tailwind 4 设计令牌**

在 `app/globals.css` 中定义：

```css
@import "tailwindcss";

@theme {
  --color-canvas: #faf9f6;
  --color-surface: #ffffff;
  --color-ink: #20242f;
  --color-muted: #6f7480;
  --color-line: #e6e2db;
  --color-brand: #315ed6;
  --color-brand-soft: #eef3ff;
  --color-lilac: #f2efff;
  --radius-panel: 1rem;
  --shadow-panel: 0 18px 60px rgb(31 41 55 / 0.07);
}

:root {
  color-scheme: light;
  background: var(--color-canvas);
}

body {
  min-height: 100vh;
  background:
    radial-gradient(circle at 80% 0%, rgb(238 243 255 / 0.9), transparent 34rem),
    var(--color-canvas);
  color: var(--color-ink);
}
```

- [ ] **Step 5: 运行测试、构建并提交**

Run:

```powershell
npm test -- tests/components/ui-primitives.test.tsx
npm run typecheck
git add app/globals.css lib/utils.ts components/ui tests/components/ui-primitives.test.tsx
git commit -m "feat: add ivory studio design system"
```

Expected: PASS。

## Task 3：建立 Supabase 本地项目、表结构、RLS 与私有事务函数

**Files:**
- Create: `supabase/config.toml`
- Create: CLI 输出的 `supabase/migrations/*_initial_schema.sql`
- Create: `supabase/tests/database/credits_and_rls.test.sql`
- Create: `tests/integration/credits-concurrency.test.ts`

- [ ] **Step 1: 初始化 Supabase 并创建迁移文件**

Run:

```powershell
npx supabase --help
npx supabase init
npx supabase migration new initial_schema
```

Expected: 创建 `supabase/config.toml` 和一个由 CLI 命名的 `*_initial_schema.sql`。

- [ ] **Step 2: 先写数据库失败测试**

`supabase/tests/database/credits_and_rls.test.sql` 使用 pgTAP，至少声明以下断言：

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public', 'users_profile');
select has_table('public', 'generation_history');
select has_table('public', 'credit_logs');
select has_table('public', 'generation_requests');
select has_function('private', 'claim_daily_credits', array['uuid']);
select has_function('private', 'reserve_generation', array['uuid', 'uuid']);
select has_function('private', 'complete_generation');
select has_function('private', 'fail_generation', array['uuid', 'uuid', 'text']);

select * from finish();
rollback;
```

- [ ] **Step 3: 运行数据库测试确认失败**

Run:

```powershell
npx supabase start
npx supabase test db
```

Expected: FAIL，缺少表或函数。若 Docker 不可用，记录该环境限制，但继续完成迁移并在可用环境复跑。

- [ ] **Step 4: 写入完整初始迁移**

迁移必须包含：

```sql
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.users_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  credits integer not null default 0 check (credits >= 0),
  last_daily_credit_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid unique not null,
  original_input jsonb not null,
  optimized_prompt text not null,
  image_url text not null,
  storage_path text not null,
  image_type text not null,
  style text not null,
  aspect_ratio text not null,
  cost_credits integer not null default 1 check (cost_credits > 0),
  created_at timestamptz not null default now()
);

create table public.credit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_amount integer not null,
  reason text not null check (reason in (
    'daily_grant', 'generation_reserve', 'generation_charge', 'generation_refund'
  )),
  related_generation_id uuid references public.generation_history(id) on delete set null,
  request_id uuid,
  created_at timestamptz not null default now()
);

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('processing', 'succeeded', 'failed')),
  reserved_credits integer not null default 0 check (reserved_credits in (0, 1)),
  generation_id uuid references public.generation_history(id) on delete set null,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generation_history_user_created_idx
  on public.generation_history(user_id, created_at desc);
create index credit_logs_user_created_idx
  on public.credit_logs(user_id, created_at desc);
create index generation_requests_user_created_idx
  on public.generation_requests(user_id, created_at desc);
```

启用 RLS 并只授予 authenticated 读取自己的三类数据：

```sql
alter table public.users_profile enable row level security;
alter table public.generation_history enable row level security;
alter table public.credit_logs enable row level security;
alter table public.generation_requests enable row level security;

grant select on public.users_profile, public.generation_history, public.credit_logs to authenticated;
revoke all on public.generation_requests from anon, authenticated;

create policy "users read own profile"
on public.users_profile for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users read own generations"
on public.generation_history for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users read own credit logs"
on public.credit_logs for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
```

创建 `private.handle_new_user()`，在 auth 用户创建后插入 5 积分资料和 `daily_grant` 日志；使用 `security definer set search_path = ''`，日期固定为：

```sql
(now() at time zone 'Asia/Shanghai')::date
```

创建以下私有函数：

```sql
private.claim_daily_credits(p_user_id uuid)
private.reserve_generation(p_user_id uuid, p_request_id uuid)
private.complete_generation(
  p_user_id uuid,
  p_request_id uuid,
  p_generation_id uuid,
  p_original_input jsonb,
  p_optimized_prompt text,
  p_image_url text,
  p_storage_path text,
  p_image_type text,
  p_style text,
  p_aspect_ratio text
)
private.fail_generation(p_user_id uuid, p_request_id uuid, p_error_code text)
```

函数使用以下完整事务逻辑：

```sql
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
begin
  insert into public.users_profile (
    user_id, credits, last_daily_credit_date
  )
  values (new.id, 5, v_today)
  on conflict (user_id) do nothing;

  if found then
    insert into public.credit_logs (
      user_id, change_amount, reason
    )
    values (new.id, 5, 'daily_grant');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.claim_daily_credits(p_user_id uuid)
returns table(credits integer, granted integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
  v_profile public.users_profile%rowtype;
  v_granted integer := 0;
begin
  insert into public.users_profile (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_profile
  from public.users_profile
  where user_id = p_user_id
  for update;

  if v_profile.last_daily_credit_date is null
     or v_profile.last_daily_credit_date < v_today then
    update public.users_profile
    set credits = users_profile.credits + 5,
        last_daily_credit_date = v_today,
        updated_at = now()
    where user_id = p_user_id
    returning * into v_profile;

    insert into public.credit_logs (
      user_id, change_amount, reason
    )
    values (p_user_id, 5, 'daily_grant');

    v_granted := 5;
  end if;

  return query select v_profile.credits, v_granted;
end;
$$;

create or replace function private.reserve_generation(
  p_user_id uuid,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
  v_credits integer;
  v_request_exists boolean := false;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_request_id::text, 0)
  );
  perform private.claim_daily_credits(p_user_id);

  select *
  into v_request
  from public.generation_requests
  where request_id = p_request_id
  for update;
  v_request_exists := found;

  if v_request_exists and v_request.user_id <> p_user_id then
    raise exception 'request owner mismatch';
  end if;

  select credits
  into v_credits
  from public.users_profile
  where user_id = p_user_id
  for update;

  if v_request_exists and v_request.status = 'succeeded' then
    return jsonb_build_object(
      'state', 'succeeded',
      'generationId', v_request.generation_id,
      'credits', v_credits
    );
  end if;

  if v_request_exists and v_request.status = 'processing' then
    return jsonb_build_object(
      'state', 'processing',
      'credits', v_credits
    );
  end if;

  if v_credits < 1 then
    return jsonb_build_object(
      'state', 'insufficient',
      'credits', v_credits
    );
  end if;

  update public.users_profile
  set credits = credits - 1,
      updated_at = now()
  where user_id = p_user_id
  returning credits into v_credits;

  if v_request_exists then
    update public.generation_requests
    set status = 'processing',
        reserved_credits = 1,
        generation_id = null,
        error_code = null,
        updated_at = now()
    where request_id = p_request_id;
  else
    insert into public.generation_requests (
      request_id, user_id, status, reserved_credits
    )
    values (p_request_id, p_user_id, 'processing', 1);
  end if;

  insert into public.credit_logs (
    user_id, change_amount, reason, request_id
  )
  values (p_user_id, -1, 'generation_reserve', p_request_id);

  return jsonb_build_object(
    'state', 'reserved',
    'credits', v_credits
  );
end;
$$;

create or replace function private.complete_generation(
  p_user_id uuid,
  p_request_id uuid,
  p_generation_id uuid,
  p_original_input jsonb,
  p_optimized_prompt text,
  p_image_url text,
  p_storage_path text,
  p_image_type text,
  p_style text,
  p_aspect_ratio text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_request_id::text, 0)
  );

  select *
  into v_request
  from public.generation_requests
  where request_id = p_request_id
  for update;

  if not found or v_request.user_id <> p_user_id then
    raise exception 'generation request not found';
  end if;

  if v_request.status = 'succeeded' then
    return v_request.generation_id;
  end if;

  if v_request.status <> 'processing'
     or v_request.reserved_credits <> 1 then
    raise exception 'generation request is not reserved';
  end if;

  insert into public.generation_history (
    id,
    user_id,
    request_id,
    original_input,
    optimized_prompt,
    image_url,
    storage_path,
    image_type,
    style,
    aspect_ratio,
    cost_credits
  )
  values (
    p_generation_id,
    p_user_id,
    p_request_id,
    p_original_input,
    p_optimized_prompt,
    p_image_url,
    p_storage_path,
    p_image_type,
    p_style,
    p_aspect_ratio,
    1
  );

  update public.credit_logs
  set reason = 'generation_charge',
      related_generation_id = p_generation_id
  where id = (
    select id
    from public.credit_logs
    where request_id = p_request_id
      and reason = 'generation_reserve'
      and related_generation_id is null
    order by created_at desc
    limit 1
  );

  update public.generation_requests
  set status = 'succeeded',
      reserved_credits = 0,
      generation_id = p_generation_id,
      error_code = null,
      updated_at = now()
  where request_id = p_request_id;

  return p_generation_id;
end;
$$;

create or replace function private.fail_generation(
  p_user_id uuid,
  p_request_id uuid,
  p_error_code text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
  v_credits integer;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_request_id::text, 0)
  );

  select *
  into v_request
  from public.generation_requests
  where request_id = p_request_id
  for update;

  if found
     and v_request.user_id = p_user_id
     and v_request.status = 'processing'
     and v_request.reserved_credits = 1 then
    update public.users_profile
    set credits = credits + 1,
        updated_at = now()
    where user_id = p_user_id
    returning credits into v_credits;

    insert into public.credit_logs (
      user_id, change_amount, reason, request_id
    )
    values (
      p_user_id, 1, 'generation_refund', p_request_id
    );

    update public.generation_requests
    set status = 'failed',
        reserved_credits = 0,
        error_code = left(p_error_code, 80),
        updated_at = now()
    where request_id = p_request_id;
  else
    select credits
    into v_credits
    from public.users_profile
    where user_id = p_user_id;
  end if;

  return coalesce(v_credits, 0);
end;
$$;

revoke all on all functions in schema private
from public, anon, authenticated;
```

最后创建私有 Storage bucket：

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generations',
  'generations',
  false,
  15728640,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
```

- [ ] **Step 5: 扩展 pgTAP 测试**

加入新用户 5 积分、同日不重复、跨日补发、余额不足、重复 request_id、失败退款一次、RLS 隔离测试。每个测试使用固定 UUID，最后 rollback。

- [ ] **Step 6: 运行迁移、测试与数据库 lint**

Run:

```powershell
npx supabase db reset
npx supabase test db
npx supabase db lint --level error
```

Expected: pgTAP 全部 PASS，lint 无 error。

- [ ] **Step 7: 添加并发预留集成测试**

`tests/integration/credits-concurrency.test.ts` 在 `RUN_DB_INTEGRATION=true` 时运行：

```ts
import postgres from "postgres"
import { expect, it } from "vitest"

const run = process.env.RUN_DB_INTEGRATION === "true" ? it : it.skip

run("allows only one of two requests to reserve the final credit", async () => {
  const sql = postgres(process.env.SUPABASE_DB_URL!, { prepare: false })
  const userId = crypto.randomUUID()

  await sql`
    insert into auth.users (id, email)
    values (${userId}::uuid, ${`credit-${userId}@test.local`})
  `
  await sql`
    update public.users_profile
    set credits = 1,
        last_daily_credit_date = (now() at time zone 'Asia/Shanghai')::date
    where user_id = ${userId}::uuid
  `

  const results = await Promise.all([
    sql`select private.reserve_generation(
      ${userId}::uuid, ${crypto.randomUUID()}::uuid
    ) as result`,
    sql`select private.reserve_generation(
      ${userId}::uuid, ${crypto.randomUUID()}::uuid
    ) as result`,
  ])

  const states = results.map(([row]) => row.result.state).sort()
  expect(states).toEqual(["insufficient", "reserved"])

  await sql`delete from auth.users where id = ${userId}::uuid`
  await sql.end()
})
```

Run:

```powershell
$env:RUN_DB_INTEGRATION="true"
$env:SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
npm test -- tests/integration/credits-concurrency.test.ts
```

Expected: PASS。

- [ ] **Step 8: 提交**

```powershell
git add supabase tests/integration/credits-concurrency.test.ts
git commit -m "feat: add credits generation schema and rls"
```

## Task 4：实现运行模式、环境校验与 Supabase 客户端

**Files:**
- Create: `.env.example`
- Create: `lib/runtime/env.ts`
- Create: `lib/runtime/mode.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/supabase/db.ts`
- Create: `lib/supabase/proxy.ts`
- Create: `proxy.ts`
- Create: `lib/supabase/database.types.ts`
- Create: `tests/runtime/env.test.ts`

- [ ] **Step 1: 编写环境校验失败测试**

```ts
import { describe, expect, it } from "vitest"
import { parseEnv } from "@/lib/runtime/env"

describe("parseEnv", () => {
  it("allows demo mode without external credentials", () => {
    expect(parseEnv({ DEMO_MODE: "true" }).demoMode).toBe(true)
  })

  it("requires every real-mode credential", () => {
    expect(() => parseEnv({ DEMO_MODE: "false" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    )
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/runtime/env.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现环境 schema**

`.env.example`：

```text
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_DB_URL=
VOLCENGINE_API_KEY=
VOLCENGINE_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
VOLCENGINE_IMAGE_MODEL=doubao-seedream-4-5-251128
```

`parseEnv` 在 demo 模式只要求 `NEXT_PUBLIC_APP_URL` 有默认值；真实模式要求其余字段非空。`isDemoMode()` 只读取已解析结果。

- [ ] **Step 4: 实现 Supabase 与数据库客户端**

- 浏览器：`createBrowserClient(url, publishableKey)`；
- 服务端：`createServerClient` + `await cookies()`；
- 管理端：`createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })`；
- Postgres：`postgres(SUPABASE_DB_URL, { prepare: false, max: 3 })`；
- demo 模式调用真实客户端时抛出清晰错误。

`proxy.ts` 采用 Next.js 16 的 `proxy` 导出；真实模式先 `getClaims()` 刷新会话，demo 模式直接放行静态和页面请求。

- [ ] **Step 5: 生成数据库类型**

本地 Supabase 可用时运行：

```powershell
npx supabase gen types typescript --local | Set-Content -Encoding utf8 lib/supabase/database.types.ts
```

Expected: 文件包含四张 public 表类型。若本地容器不可用，先按迁移手写等价类型，并在可用环境重新生成对比。

- [ ] **Step 6: 验证并提交**

```powershell
npm test -- tests/runtime/env.test.ts
npm run typecheck
git add .env.example lib/runtime lib/supabase proxy.ts tests/runtime
git commit -m "feat: configure runtime modes and supabase clients"
```

## Task 5：实现无密钥演示适配器与统一会话接口

**Files:**
- Create: `lib/demo/store.ts`
- Create: `lib/auth/session.ts`
- Create: `tests/demo/store.test.ts`

- [ ] **Step 1: 编写演示积分与幂等失败测试**

```ts
import { beforeEach, expect, it } from "vitest"
import { demoStore } from "@/lib/demo/store"

beforeEach(() => demoStore.reset())

it("starts the demo user with five credits", () => {
  expect(demoStore.getProfile().credits).toBe(5)
})

it("does not reserve twice for the same request", () => {
  const id = crypto.randomUUID()
  expect(demoStore.reserve(id).state).toBe("reserved")
  expect(demoStore.reserve(id).state).toBe("processing")
  expect(demoStore.getProfile().credits).toBe(4)
})

it("refunds a failed request only once", () => {
  const id = crypto.randomUUID()
  demoStore.reserve(id)
  demoStore.fail(id, "MODEL_ERROR")
  demoStore.fail(id, "MODEL_ERROR")
  expect(demoStore.getProfile().credits).toBe(5)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/demo/store.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现进程内 store**

使用 `globalThis` 保存：

```ts
type DemoRequest = {
  requestId: string
  status: "processing" | "succeeded" | "failed"
  reservedCredits: 0 | 1
  generationId?: string
  errorCode?: string
}

type DemoGeneration = {
  id: string
  requestId: string
  originalInput: Record<string, unknown>
  optimizedPrompt: string
  imageUrl: string
  storagePath: string
  imageType: string
  style: string
  aspectRatio: string
  createdAt: string
}

type DemoState = {
  signedIn: boolean
  profile: { userId: "demo-user"; email: string; credits: number; lastDailyCreditDate: string }
  requests: Map<string, DemoRequest>
  generations: DemoGeneration[]
}
```

提供 `signIn`、`signOut`、`claimDailyCredits`、`reserve`、`complete`、`fail`、`listHistory`、`reset`。日期用 `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" })`。

- [ ] **Step 4: 实现统一会话接口**

`getCurrentUser()`：

- demo 模式读取 `huijing-demo-session` cookie；
- 真实模式使用 Supabase `getClaims()`，返回 `sub` 与 email；
- 无会话返回 null。

`requireUser(nextPath)` 在无用户时调用 `redirect("/login?next=" + encodeURIComponent(nextPath))`。

- [ ] **Step 5: 运行测试并提交**

```powershell
npm test -- tests/demo/store.test.ts
git add lib/demo lib/auth/session.ts tests/demo
git commit -m "feat: add standalone demo runtime"
```

## Task 6：实现邮箱密码鉴权、确认邮件与重置密码

**Files:**
- Create: `lib/auth/actions.ts`
- Create: `components/auth/auth-form.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/forgot-password/page.tsx`
- Create: `app/(auth)/update-password/page.tsx`
- Create: `app/auth/confirm/route.ts`
- Create: `tests/auth/next-path.test.ts`

- [ ] **Step 1: 为安全 next 参数写失败测试**

```ts
import { expect, it } from "vitest"
import { safeNextPath } from "@/lib/auth/actions"

it("accepts local paths", () => {
  expect(safeNextPath("/generate")).toBe("/generate")
})

it("rejects external and protocol-relative redirects", () => {
  expect(safeNextPath("https://evil.example")).toBe("/generate")
  expect(safeNextPath("//evil.example")).toBe("/generate")
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/auth/next-path.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 Server Actions**

`loginAction`、`signupAction`、`logoutAction`、`requestPasswordResetAction`、`updatePasswordAction`：

- 使用 Zod 验证邮箱和至少 8 位密码；
- demo 模式设置或删除 `huijing-demo-session` httpOnly cookie；
- 真实模式分别调用 `signInWithPassword`、`signUp`、`signOut`、`resetPasswordForEmail`、`updateUser`；
- 注册 `emailRedirectTo` 指向 `/auth/confirm?next=/generate`；
- 重置邮件目标为 `/auth/confirm?next=/update-password`；
- 成功登录后 redirect 到安全的 next path；
- 错误返回中文字段消息，不把 Supabase 原始堆栈显示给用户。

- [ ] **Step 4: 实现 token hash 确认路由**

`app/auth/confirm/route.ts` 读取 `token_hash`、`type`、`next`，调用：

```ts
await supabase.auth.verifyOtp({ token_hash, type })
```

成功跳转安全 next path；失败跳转 `/login?error=confirmation_failed`。

- [ ] **Step 5: 实现认证页面**

`AuthForm` 使用 React `useActionState`，提供登录/注册切换、loading、字段错误和忘记密码入口。页面使用象牙编辑室单面板布局，不做社交登录。

- [ ] **Step 6: 运行测试、类型检查并提交**

```powershell
npm test -- tests/auth/next-path.test.ts
npm run typecheck
git add lib/auth components/auth app/(auth) app/auth tests/auth
git commit -m "feat: add email password authentication"
```

## Task 7：实现每日积分读取与受保护 Dashboard 布局

**Files:**
- Create: `lib/credits/repository.ts`
- Create: `components/layout/app-header.tsx`
- Create: `components/layout/site-header.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `tests/credits/repository.test.ts`

- [ ] **Step 1: 编写适配器分流失败测试**

测试 demo 模式调用 demo store，真实模式调用注入的 DB 函数，并统一返回：

```ts
type CreditSummary = {
  credits: number
  grantedToday: number
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/credits/repository.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 credits repository**

真实模式执行：

```ts
const [row] = await sql`
  select *
  from private.claim_daily_credits(${userId}::uuid)
`
```

demo 模式调用 `demoStore.claimDailyCredits()`。

- [ ] **Step 4: 实现布局与导航**

`app/(dashboard)/layout.tsx`：

1. `requireUser()`；
2. 调用 `claimDailyCredits`；
3. 渲染 `AppHeader`，包含创作、历史、升级、积分、退出；
4. `DEMO_MODE=true` 显示“演示模式”标识。

`SiteHeader` 用于首页，登录前显示“登录 / 开始生成”，登录后显示“进入创作”。

- [ ] **Step 5: 验证并提交**

```powershell
npm test -- tests/credits/repository.test.ts
npm run typecheck
git add lib/credits components/layout app/(dashboard)
git commit -m "feat: add daily credits and protected layout"
```

## Task 8：以 TDD 实现表单校验与 promptBuilder

**Files:**
- Create: `lib/validation/generation.ts`
- Create: `lib/prompt-builder.ts`
- Create: `tests/validation/generation.test.ts`
- Create: `tests/prompt-builder.test.ts`

- [ ] **Step 1: 编写输入校验失败测试**

覆盖：

- subject 去空格后至少 2 字；
- imageType、style、aspectRatio 必须来自允许集合；
- qualityRequirements 去重且最多 5 个；
- additionalRequirements 和 negativeRequirements 最长 500；
- requestId 必须是 UUID。

- [ ] **Step 2: 编写 promptBuilder 失败测试**

```ts
it("builds the commercial avatar example in stable order", () => {
  const result = promptBuilder({
    subject: "一只穿西装的橘猫",
    imageType: "头像",
    style: "商业摄影",
    aspectRatio: "1:1",
    qualityRequirements: ["高清", "细节丰富", "背景干净"],
    additionalRequirements: "有高级感",
    negativeRequirements: "不要文字，不要水印",
  })

  expect(result.prompt).toContain("正面半身头像构图")
  expect(result.prompt).toContain("高级商业摄影风格")
  expect(result.prompt).toContain("比例 1:1")
  expect(result.negativePrompt).toContain("低清晰度")
  expect(result.negativePrompt.match(/水印/g)).toHaveLength(1)
  expect(result.combinedPrompt).toContain("负面提示词：")
})
```

- [ ] **Step 3: 运行测试确认失败**

Run:

```powershell
npm test -- tests/validation/generation.test.ts tests/prompt-builder.test.ts
```

Expected: FAIL。

- [ ] **Step 4: 实现 schema、常量与映射**

导出 `IMAGE_TYPES`、`STYLES`、`ASPECT_RATIOS`、`QUALITY_OPTIONS`，由表单和 Zod schema 共用。

同时导出：

```ts
export type GenerationInput = z.infer<typeof generationInputSchema>
export type AspectRatio = GenerationInput["aspectRatio"]
```

映射必须包含：

- 头像 → 正面或轻微侧面半身构图、主体突出；
- 海报 → 留出标题安全区、视觉中心明确；
- 产品图/电商主图 → 商品完整、背景干净、商业棚拍；
- 壁纸 → 宽阔层次与沉浸景深；
- 商业摄影 → 专业品牌视觉、自然材质、棚拍光线；
- 电影感 → 电影级布光、景深、叙事构图；
- 国风 → 东方审美、含蓄色彩与细腻材质。

- [ ] **Step 5: 实现纯函数**

稳定顺序：

```ts
[
  subject,
  typeUsage,
  scene,
  style,
  composition,
  camera,
  lighting,
  color,
  material,
  quality,
  additional,
  `比例 ${aspectRatio}`,
]
```

负面词从默认数组与用户逗号分词结果合并，用 `Set` 去重。

- [ ] **Step 6: 运行测试并提交**

```powershell
npm test -- tests/validation/generation.test.ts tests/prompt-builder.test.ts
git add lib/validation lib/prompt-builder.ts tests/validation tests/prompt-builder.test.ts
git commit -m "feat: add structured prompt builder"
```

## Task 9：实现火山方舟 Provider、图片下载与 Storage 转存

**Files:**
- Create: `lib/generation/volcengine-sizes.ts`
- Create: `lib/generation/volcengine.ts`
- Create: `lib/generation/download-image.ts`
- Create: `lib/generation/storage.ts`
- Create: `lib/generation/errors.ts`
- Create: `tests/generation/volcengine.test.ts`
- Create: `tests/generation/download-image.test.ts`

- [ ] **Step 1: 编写 Provider 失败测试**

验证请求：

```ts
expect(fetch).toHaveBeenCalledWith(
  "https://ark.cn-beijing.volces.com/api/v3/images/generations",
  expect.objectContaining({
    method: "POST",
    headers: expect.objectContaining({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    }),
  }),
)
```

验证 body：

```json
{
  "model": "doubao-seedream-4-5-251128",
  "prompt": "专业提示词",
  "size": "2048x2048",
  "response_format": "url",
  "watermark": false
}
```

响应 `{ "data": [{ "url": "https://images.example/generated.png" }] }` 解析为 URL；非 2xx、空 data、无效 URL 抛出 `ModelGenerationError`。

- [ ] **Step 2: 编写安全下载失败测试**

覆盖：

- 只接受 `image/png`、`image/jpeg`、`image/webp`；
- Content-Length 或实际流超过 15 MiB 时拒绝；
- 10 秒 AbortSignal 超时；
- 返回 `{ bytes, contentType, extension }`。

- [ ] **Step 3: 运行测试确认失败**

Run:

```powershell
npm test -- tests/generation/volcengine.test.ts tests/generation/download-image.test.ts
```

Expected: FAIL。

- [ ] **Step 4: 实现比例尺寸映射**

```ts
export const VOLCENGINE_SIZE_BY_RATIO = {
  "1:1": "2048x2048",
  "3:4": "1728x2304",
  "4:3": "2304x1728",
  "16:9": "2560x1440",
  "9:16": "1440x2560",
} as const
```

实现时用火山方舟当前官方图片 API 文档再次核对尺寸；若模型返回尺寸不支持错误，只修改此映射和对应测试，不改表单接口。

- [ ] **Step 5: 实现 Provider 与下载器**

Provider 使用原生 `fetch` 和 90 秒 AbortSignal。错误对象只保留安全 code 与 HTTP status，不保存 Authorization header 或完整供应商响应。

- [ ] **Step 6: 实现 Storage 上传**

`storeGeneratedImage`：

```ts
const path = `${userId}/${generationId}.${extension}`
await admin.storage.from("generations").upload(path, bytes, {
  contentType,
  cacheControl: "31536000",
  upsert: false,
})
return {
  storagePath: path,
  imageUrl: `storage://generations/${path}`,
}
```

`createSignedGenerationUrl(path, expiresIn = 3600)` 返回一小时签名 URL。

- [ ] **Step 7: 实现 demo provider 与 storage**

`DemoImageProvider` 根据比例从 `/examples/` 选择本地示例图。
`DemoImageStorage.persist` 不发起网络下载，返回：

```ts
{
  storagePath: `demo/${generationId}.webp`,
  imageUrl: sourceUrl,
}
```

`DemoImageStorage.sign` 直接返回保存的本地 URL。`createImageProvider()` 与 `createImageStorage()` 根据运行模式选择实现。

- [ ] **Step 8: 运行测试并提交**

```powershell
npm test -- tests/generation/volcengine.test.ts tests/generation/download-image.test.ts
git add lib/generation tests/generation
git commit -m "feat: add seedream provider and image storage"
```

## Task 10：实现生成 Repository 与幂等编排

**Files:**
- Create: `lib/generation/repository.ts`
- Create: `lib/generation/orchestrator.ts`
- Create: `tests/generation/orchestrator.test.ts`

- [ ] **Step 1: 定义接口并写失败测试**

```ts
import type { AspectRatio, GenerationInput } from "@/lib/validation/generation"

export type ReserveResult =
  | { state: "reserved"; credits: number }
  | { state: "processing"; credits: number }
  | { state: "insufficient"; credits: number }
  | { state: "succeeded"; credits: number; generationId: string }

export type CompleteGenerationInput = {
  generationId: string
  userId: string
  requestId: string
  originalInput: GenerationInput
  optimizedPrompt: string
  imageUrl: string
  storagePath: string
  imageType: GenerationInput["imageType"]
  style: GenerationInput["style"]
  aspectRatio: AspectRatio
}

export type StoredGeneration = {
  id: string
  storagePath: string
  imageUrl: string
  optimizedPrompt: string
  createdAt: string
}

export interface GenerationRepository {
  reserve(userId: string, requestId: string): Promise<ReserveResult>
  complete(input: CompleteGenerationInput): Promise<StoredGeneration>
  fail(userId: string, requestId: string, errorCode: string): Promise<void>
  getCredits(userId: string): Promise<number>
}

export interface ImageProvider {
  generate(input: { prompt: string; aspectRatio: AspectRatio }): Promise<string>
}

export interface ImageStorage {
  persist(input: { userId: string; generationId: string; sourceUrl: string }): Promise<{
    imageUrl: string
    storagePath: string
  }>
  sign(storagePath: string): Promise<string>
}
```

测试场景：

1. insufficient 不调用 provider；
2. succeeded 幂等返回已有记录；
3. provider 失败调用 fail；
4. storage 失败调用 fail；
5. 成功调用 complete 且返回最新 credits；
6. processing 返回 `REQUEST_IN_PROGRESS`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/generation/orchestrator.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现真实与 demo repository**

真实 repository 通过 postgres.js 调用 `private.reserve_generation`、`private.complete_generation`、`private.fail_generation`。
demo repository 调用 `demoStore`。
`createGenerationRepository()` 根据运行模式返回适配器。

- [ ] **Step 4: 实现编排函数**

执行顺序：

```ts
validate -> reserve -> create generationId -> promptBuilder -> provider.generate
-> download/store -> repository.complete -> sign -> response
```

任何 reserve 之后的异常必须在 `catch` 中执行一次 `repository.fail`。已知错误映射为：

```ts
UNAUTHENTICATED
VALIDATION_ERROR
INSUFFICIENT_CREDITS
REQUEST_IN_PROGRESS
MODEL_ERROR
STORAGE_ERROR
INTERNAL_ERROR
```

- [ ] **Step 5: 运行测试并提交**

```powershell
npm test -- tests/generation/orchestrator.test.ts
git add lib/generation/repository.ts lib/generation/orchestrator.ts tests/generation/orchestrator.test.ts
git commit -m "feat: orchestrate idempotent image generation"
```

## Task 11：实现服务端生成 API

**Files:**
- Create: `app/api/generations/route.ts`
- Create: `tests/api/generations-route.test.ts`

- [ ] **Step 1: 编写 Route Handler 失败测试**

通过依赖注入或模块 mock 覆盖：

- 未登录 → 401；
- 无效 JSON → 400；
- 积分不足 → 402；
- 处理中 → 409；
- 成功 → 200，返回 generation 和 credits；
- 供应商错误 → 502。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/api/generations-route.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 Route Handler**

`POST`：

```ts
export const runtime = "nodejs"
export const maxDuration = 120
```

1. 创建安全日志 requestId；
2. `getCurrentUser()`；
3. `generationInputSchema.safeParse(await request.json())`；
4. 调用 `orchestrateGeneration`；
5. 返回：

```ts
NextResponse.json({
  generation: {
    id,
    imageUrl: signedUrl,
    optimizedPrompt,
    createdAt,
  },
  credits,
})
```

错误响应格式统一：

```json
{
  "error": {
    "code": "MODEL_ERROR",
    "message": "图片生成暂时失败，请稍后重试。",
    "requestId": "safe-request-id"
  }
}
```

- [ ] **Step 4: 运行测试并提交**

```powershell
npm test -- tests/api/generations-route.test.ts
npm run typecheck
git add app/api tests/api
git commit -m "feat: expose secure generation api"
```

## Task 12：实现生图表单、结果区与积分不足弹窗

**Files:**
- Create: `components/generation/option-group.tsx`
- Create: `components/generation/generation-form.tsx`
- Create: `components/generation/generation-result.tsx`
- Create: `components/billing/insufficient-credits-dialog.tsx`
- Create: `app/(dashboard)/generate/page.tsx`
- Create: `tests/components/generation-form.test.tsx`

- [ ] **Step 1: 编写交互失败测试**

覆盖：

- 主体为空时不请求；
- 点击选项更新选中状态；
- submit 后按钮显示 loading 且 disabled；
- API 返回 402 时打开“积分不足”弹窗；
- 成功后显示图片与优化提示词；
- 双击 submit 只触发一次 fetch。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/components/generation-form.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 OptionGroup 与表单**

`OptionGroup` 支持单选和多选，使用 `aria-pressed`。
表单包含主体、类型、风格、比例、质量、补充、负面要求。
每次用户主动生成使用 `crypto.randomUUID()`；网络失败重试保持同一个 requestId；点击“再次生成”创建新 requestId。

- [ ] **Step 4: 实现结果状态**

`GenerationResult` 支持：

- 空状态；
- loading 骨架和“正在生成，请稍候…”；
- 成功图片；
- 查看大图；
- 下载；
- 优化提示词展开；
- 再次生成。

- [ ] **Step 5: 实现积分弹窗**

使用原生 `<dialog>` 或受控 fixed overlay；包含：

- “当前积分不足”；
- 当前余额；
- “升级套餐”链接 `/upgrade`；
- “暂时关闭”。

- [ ] **Step 6: 实现双栏页面**

`generate/page.tsx` 服务端读取当前积分，传给 client workspace。
桌面 `lg:grid-cols-[minmax(340px,0.38fr)_minmax(0,0.62fr)]`；移动端单列。

- [ ] **Step 7: 运行测试、构建并提交**

```powershell
npm test -- tests/components/generation-form.test.tsx
npm run typecheck
git add components/generation components/billing/insufficient-credits-dialog.tsx app/(dashboard)/generate tests/components
git commit -m "feat: build image generation workspace"
```

## Task 13：实现历史 Repository、图片网格与大图详情

**Files:**
- Create: `lib/history/repository.ts`
- Create: `components/history/history-grid.tsx`
- Create: `components/history/history-lightbox.tsx`
- Create: `app/(dashboard)/history/page.tsx`
- Create: `tests/history/repository.test.ts`
- Create: `tests/components/history-grid.test.tsx`

- [ ] **Step 1: 编写失败测试**

Repository 测试：

- demo 返回倒序历史；
- real 查询仅当前 user_id；
- 每个 storage_path 转成签名 URL；
- 签名失败跳过损坏项并记录安全错误。

组件测试：

- 空数据显示“还没有生成记录”；
- 卡片显示类型、风格、比例、时间；
- 点击卡片打开原始输入与优化提示词。

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/history/repository.test.ts tests/components/history-grid.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 实现 repository**

真实模式使用用户 Supabase server client 查询 `generation_history`，依赖 RLS：

```ts
.select("id, original_input, optimized_prompt, storage_path, image_type, style, aspect_ratio, created_at")
.order("created_at", { ascending: false })
.limit(60)
```

服务端管理员 Storage client 为每项创建 1 小时签名 URL。

- [ ] **Step 4: 实现网格与 Lightbox**

网格使用 `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`，卡片保持不同宽高比。
Lightbox 展示大图、结构化原始输入、优化提示词、生成时间；Esc 和关闭按钮可退出。

- [ ] **Step 5: 运行测试并提交**

```powershell
npm test -- tests/history/repository.test.ts tests/components/history-grid.test.tsx
git add lib/history components/history app/(dashboard)/history tests/history tests/components/history-grid.test.tsx
git commit -m "feat: add generation history workspace"
```

## Task 14：生成示例图片资产并完成首页

**Files:**
- Create: `public/examples/editorial-portrait.webp`
- Create: `public/examples/product-still-life.webp`
- Create: `public/examples/oriental-illustration.webp`
- Create: `public/examples/future-city.webp`
- Create: `public/examples/minimal-poster.webp`
- Create: `public/examples/wallpaper-landscape.webp`
- Modify: `app/page.tsx`
- Create: `tests/pages/home.test.tsx`

- [ ] **Step 1: 使用 ImageGen 生成六张无品牌示例图**

每张单独生成并保存到上述路径：

- 高级商业人物肖像；
- 极简产品静物；
- 国风插画；
- 未来城市；
- 极简海报构图；
- 电影感风景壁纸。

约束：无文字、无 logo、无水印、无现成 IP；色彩与象牙编辑室协调。

- [ ] **Step 2: 编写首页失败测试**

测试存在：

- 主标题；
- 副标题；
- “开始生成”；
- 三个核心卖点；
- 三步流程；
- 六张示例；
- 底部 CTA。

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -- tests/pages/home.test.tsx`
Expected: FAIL。

- [ ] **Step 4: 实现首页**

Hero 文案：

```text
把想法，变成专业画面
选择类型、风格、比例与质量要求，绘境 AI 会自动整理专业提示词并生成高质量图片。
```

核心卖点：结构化创作、专业提示词、稳定历史。
流程：描述主体 → 选择视觉参数 → 生成并保存。
未登录 CTA 指向 `/login?next=/generate`；已登录 CTA 指向 `/generate`。

- [ ] **Step 5: 运行测试并提交**

```powershell
npm test -- tests/pages/home.test.tsx
git add public/examples app/page.tsx tests/pages/home.test.tsx
git commit -m "feat: build premium marketing homepage"
```

## Task 15：实现升级占位页与套餐组件

**Files:**
- Create: `components/billing/pricing-card.tsx`
- Create: `app/(dashboard)/upgrade/page.tsx`
- Create: `tests/components/pricing-card.test.tsx`

- [ ] **Step 1: 编写失败测试**

验证 Free、Pro、Studio 均出现；Pro 有“推荐”标记；所有付费按钮为 disabled 且显示“即将上线”。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/components/pricing-card.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现套餐**

```ts
const plans = [
  { name: "Free", credits: "每天 5 积分", features: ["单张生成", "生成历史", "标准质量"] },
  { name: "Pro", credits: "更多创作额度", features: ["更高额度", "优先生成", "未来高级模型"], featured: true },
  { name: "Studio", credits: "团队创作空间", features: ["团队额度", "批量工作流", "未来协作能力"] },
]
```

Pro 使用群青细边框和轻微 `-translate-y-1`，不使用夸张阴影。

- [ ] **Step 4: 测试并提交**

```powershell
npm test -- tests/components/pricing-card.test.tsx
git add components/billing/pricing-card.tsx app/(dashboard)/upgrade tests/components/pricing-card.test.tsx
git commit -m "feat: add upgrade placeholder plans"
```

## Task 16：安全加固、错误边界与响应式视觉 QA

**Files:**
- Modify: `next.config.ts`
- Create: `app/error.tsx`
- Create: `app/not-found.tsx`
- Create: `components/ui/image-lightbox.tsx`
- Modify: all page and component files affected by QA

- [ ] **Step 1: 添加基础安全配置**

`next.config.ts`：

- 禁止 `x-powered-by`；
- 配置 `images.remotePatterns` 为 Supabase Storage hostname（真实模式存在时）；
- 添加 `Referrer-Policy: strict-origin-when-cross-origin`；
- 添加 `X-Content-Type-Options: nosniff`；
- 添加 `Permissions-Policy: camera=(), microphone=(), geolocation=()`。

- [ ] **Step 2: 添加错误与 404 页面**

`error.tsx` 提供“页面暂时出现问题”和重试按钮；不显示 stack。
`not-found.tsx` 提供返回首页和进入创作。

- [ ] **Step 3: 启动演示模式并执行浏览器 QA**

Run:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

检查 1440×1024、1024×768、390×844：

- 首页无横向溢出；
- 生图页桌面双栏、移动单列；
- 历史网格合理；
- 模态框可关闭；
- 所有 focus 状态可见；
- 文字对比度清晰；
- 导航、按钮、输入、卡片风格一致；
- 无卡片套卡片和过度毛玻璃。

- [ ] **Step 4: 修复视觉偏差并截图复核**

以 `docs/superpowers/specs/assets/huijing-ai-ivory-editorial-reference.png` 与实现截图并排检查：间距、边框、圆角、字号、阴影、画布比例。一次只修复明确偏差，重新截图复核。

- [ ] **Step 5: 运行全套前端验证并提交**

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git add next.config.ts app components
git commit -m "fix: harden and polish responsive experience"
```

Expected: 全部通过。

## Task 17：编写本地运行、Supabase 配置和 Vercel 部署文档

**Files:**
- Create: `README.md`
- Modify: `.env.example`
- Modify: `docs/superpowers/specs/2026-06-21-huijing-ai-mvp-design.md`

- [ ] **Step 1: 编写本地演示模式说明**

README 必须包含：

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

说明默认 `DEMO_MODE=true`，可使用任意格式正确的邮箱与 8 位密码进入演示；数据在进程重启后可能重置。

- [ ] **Step 2: 编写真实 Supabase 配置**

包含：

```powershell
npx supabase login
$env:SUPABASE_PROJECT_REF="你的 Supabase project ref"
npx supabase link --project-ref $env:SUPABASE_PROJECT_REF
npx supabase db push
```

并说明从 Supabase Connect 获取：

- Project URL；
- publishable key；
- secret key；
- transaction pooler connection string。

Auth 配置：

- Site URL：本地或 Vercel 正式域名；
- Redirect URLs：`http://localhost:3000/auth/confirm` 与正式域名；
- Confirm signup 与 Reset password 模板改为 token hash PKCE 链接；
- 正式上线前配置自有 SMTP。

- [ ] **Step 3: 编写火山方舟配置**

说明创建 API Key，设置：

```text
VOLCENGINE_API_KEY=
VOLCENGINE_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
VOLCENGINE_IMAGE_MODEL=doubao-seedream-4-5-251128
DEMO_MODE=false
```

不得把 key 写入代码或 `NEXT_PUBLIC_*`。

- [ ] **Step 4: 编写 Vercel 部署步骤**

1. 推送 Git 仓库；
2. Vercel Import Project；
3. 配置全部环境变量；
4. 首次以 demo mode 部署验证；
5. Supabase Auth 添加 Vercel 域名；
6. 关闭 demo mode；
7. 真实注册、领取积分、生成、历史、失败退款验收。

- [ ] **Step 5: 文档检查并提交**

```powershell
git diff --check
git add README.md .env.example docs/superpowers/specs/2026-06-21-huijing-ai-mvp-design.md
git commit -m "docs: add local and vercel deployment guide"
```

## Task 18：最终数据库、安全与端到端验证

**Files:**
- Modify only if verification exposes defects

- [ ] **Step 1: 运行完整静态与单元验证**

```powershell
npm run verify
```

Expected: lint、typecheck、Vitest、Next production build 全部 PASS。

- [ ] **Step 2: 运行数据库验证**

```powershell
npx supabase db reset
npx supabase test db
npx supabase db lint --level error
```

Expected: PASS。

- [ ] **Step 3: 运行 Supabase Advisors**

连接真实项目后运行 security 和 performance advisors；修复缺失 RLS、危险函数 search_path、未索引外键或策略问题。再次运行直到无高优先级告警。

- [ ] **Step 4: 演示模式端到端验收**

验证：

1. 首页 → 登录；
2. 进入创作；
3. 显示 5 积分；
4. 生成一次变为 4；
5. 历史出现记录；
6. 重复 requestId 不再扣分；
7. 余额不足打开升级弹窗；
8. 升级页按钮均显示“即将上线”。

- [ ] **Step 5: 真实模式验收**

使用测试 Supabase 用户和火山方舟 key：

1. 注册并确认邮件；
2. 检查当日 5 积分；
3. 生成真实图片；
4. 确认 Storage 私有对象存在；
5. 历史签名 URL 可访问；
6. 模拟 provider 失败后积分回到原值；
7. 数据库不存在跨用户读取。

- [ ] **Step 6: 最终提交**

```powershell
git status --short
git add -A
git commit -m "test: verify huijing ai mvp"
```

若没有修复产生，不创建空提交。

## 规格覆盖检查

- 首页、登录、生图、历史、积分弹窗、升级页：Tasks 6、12–15；
- 象牙编辑室视觉与 Tailwind：Tasks 2、12–16；
- Supabase Auth、初始化、每日积分、RLS：Tasks 3–7；
- promptBuilder：Task 8；
- Seedream 4.5 服务端调用：Tasks 9–11；
- Storage 转存与签名 URL：Tasks 9、13；
- 服务端积分预留、失败退款、幂等：Tasks 3、10、11；
- 无密钥演示：Tasks 4、5；
- 本地运行和 Vercel 部署：Task 17；
- 自动化与人工验收：Tasks 1–18。

## 实施时使用的官方资料

- Next.js 16 Installation: https://nextjs.org/docs/app/getting-started/installation
- Next.js Proxy: https://nextjs.org/docs/app/getting-started/proxy
- Tailwind CSS 4 Theme Variables: https://tailwindcss.com/docs/theme
- Supabase Next.js SSR Auth: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Private Buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Database Testing: https://supabase.com/docs/guides/local-development/testing/overview
- 火山方舟图片生成 API: https://www.volcengine.com/docs/82379/1541523
- Seedream 4.0–5.0 教程: https://www.volcengine.com/docs/82379/1824121
