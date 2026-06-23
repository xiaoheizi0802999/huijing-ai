# 绘境 AI「暗光剧场」电影式落地页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可本地运行、响应式、可交互并忠实复现「暗光剧场」视觉稿的绘境 AI 电影式营销首页。

**Architecture:** 使用 Next.js App Router 生成静态营销结构，交互组件仅在移动导航、滚动 reveal、轻量视差和升级弹窗中启用客户端逻辑。页面拆分为六个电影章节，文案与图片元数据集中管理，真实生成影像放在 `public/cinematic/`，动画使用 CSS、IntersectionObserver 和 requestAnimationFrame，不引入重量级动画框架。

**Tech Stack:** Next.js 16.2.9、React 19.2.7、TypeScript 6.0.3、Tailwind CSS 4.3.1、Phosphor Icons 2.1.10、Vitest 4.1.9、Testing Library 16.3.2、ImageGen。

---

## 文件结构

```text
app/
  generate/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  cinematic/
    capabilities-section.tsx
    cinematic-button.tsx
    cinematic-header.tsx
    film-grain.tsx
    final-cta-section.tsx
    gallery-section.tsx
    hero-section.tsx
    membership-section.tsx
    process-section.tsx
    reveal.tsx
    upgrade-dialog.tsx
lib/
  landing-content.ts
public/
  cinematic/
    capability-stage.webp
    final-light.webp
    gallery-architecture.webp
    gallery-car.webp
    gallery-fashion.webp
    gallery-fantasy.webp
    gallery-portrait.webp
    gallery-product.webp
    hero-screen.webp
    membership-chair.webp
    noise.png
    process-projector.webp
tests/
  components/
    cinematic-header.test.tsx
    gallery-section.test.tsx
    membership-section.test.tsx
    page-sections.test.tsx
  landing-content.test.ts
  setup.ts
docs/superpowers/specs/assets/
  huijing-ai-dark-light-reference.png
design-qa.md
eslint.config.mjs
next.config.ts
package.json
postcss.config.mjs
tsconfig.json
vitest.config.ts
```

文件职责：

- `lib/landing-content.ts`：页面文案、流程步骤、作品元数据与图片路径的唯一来源；
- `cinematic-header.tsx`：桌面导航、移动菜单和锚点跳转；
- `reveal.tsx`：统一进入动画与减少动态效果策略；
- `hero-section.tsx`：首屏内容与有限视差；
- 其余 section 文件：各自只负责一个电影章节；
- `upgrade-dialog.tsx`：可访问的升级占位弹窗；
- `app/page.tsx`：按顺序组合章节，不承载章节内部细节；
- `app/globals.css`：设计令牌、排版、网格、光效、动画和响应式规则。

## Task 1：建立 Next.js 与测试基线

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: 在隔离工作区执行 Product Design 本地原型预检**

使用 `superpowers:using-git-worktrees` 创建隔离工作区后，在工作区外的临时空目录运行官方 bootstrap，用于验证本机原型工具链：

```powershell
$preflight = Join-Path $env:TEMP ("huijing-cinematic-" + [guid]::NewGuid())
node "C:\Users\i\.codex\plugins\cache\openai-curated-remote\product-design\0.1.46\scripts\bootstrap-prototype.mjs" --dest $preflight
npm install --prefix $preflight
npm run build --prefix $preflight
```

Expected: bootstrap 输出 `"status": "created"`，Vite 基线构建退出码为 0。该临时目录不复制进项目；批准的技术栈仍为 Next.js。

- [ ] **Step 2: 创建依赖清单**

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
    "@phosphor-icons/react": "2.1.10",
    "next": "16.2.9",
    "react": "19.2.7",
    "react-dom": "19.2.7"
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

- [ ] **Step 3: 安装依赖**

Run:

```powershell
npm install
```

Expected: 生成 `package-lock.json` 和 `node_modules/`，退出码为 0。

- [ ] **Step 4: 写入工具链配置**

`postcss.config.mjs`：

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

`next.config.ts`：

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
```

`vitest.config.ts`：

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
})
```

`tests/setup.ts`：

```ts
import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = "0px"
  readonly thresholds = [0]
  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
})

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
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

`tsconfig.json` 使用 Next 生成的默认严格配置，并包含：

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: 先写页面壳的失败测试**

创建 `tests/components/page-sections.test.tsx`：

```tsx
import { render, screen } from "@testing-library/react"
import Home from "@/app/page"

it("renders the cinematic landing page shell", () => {
  render(<Home />)

  expect(
    screen.getByRole("heading", { name: /像导演一样生成你的视觉大片/ }),
  ).toBeInTheDocument()
})
```

- [ ] **Step 6: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
```

Expected: FAIL，因为 `app/page.tsx` 尚未输出目标标题。

- [ ] **Step 7: 写入最小页面壳**

`app/layout.tsx`：

```tsx
import type { Metadata } from "next"
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"
import "./globals.css"

const sans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const serif = Noto_Serif_SC({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "绘境 AI｜像导演一样生成视觉大片",
  description: "让 AI 理解你的创作意图，把自然语言转化为专业视觉语言。",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx`：

```tsx
export default function Home() {
  return (
    <main>
      <h1>像导演一样生成你的视觉大片</h1>
    </main>
  )
}
```

`app/globals.css`：

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  background: #030405;
  color: #f2f3f1;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  background: #030405;
}

body {
  margin: 0;
  min-height: 100vh;
  overflow-x: hidden;
  background: #030405;
  font-family: var(--font-sans), "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

- [ ] **Step 8: 验证基线**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
npm run typecheck
npm run lint
```

Expected: 全部 PASS。

- [ ] **Step 9: 提交基线**

```powershell
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs next-env.d.ts vitest.config.ts tests app
git commit -m "chore: scaffold cinematic landing page"
```

## Task 2：生成并登记电影影像资产

**Files:**
- Create: `public/cinematic/hero-screen.webp`
- Create: `public/cinematic/capability-stage.webp`
- Create: `public/cinematic/process-projector.webp`
- Create: `public/cinematic/gallery-portrait.webp`
- Create: `public/cinematic/gallery-product.webp`
- Create: `public/cinematic/gallery-fantasy.webp`
- Create: `public/cinematic/gallery-fashion.webp`
- Create: `public/cinematic/gallery-architecture.webp`
- Create: `public/cinematic/gallery-car.webp`
- Create: `public/cinematic/membership-chair.webp`
- Create: `public/cinematic/final-light.webp`
- Create: `lib/landing-content.ts`
- Create: `tests/landing-content.test.ts`

- [ ] **Step 1: 使用 ImageGen 生成 11 个独立资产**

每个资产单独调用 ImageGen，所有提示词共享：

```text
Use case: ads-marketing
Asset type: 绘境 AI「暗光剧场」网站电影影像资产
Style/medium: photorealistic cinematic still, luxury campaign art direction
Color palette: near black, charcoal, silver white, tiny glacial cyan highlights
Lighting/mood: controlled projector light, deep blacks, subtle haze, low saturation
Constraints: no text, no logo, no watermark, no UI, no frame, no neon cyberpunk,
consistent color grading across the complete asset set
```

逐项追加：

```text
hero-screen.webp:
wide 16:10 dark fantasy landscape, distant monumental castle and waterfalls,
one lone figure seen from behind, enormous scale, usable negative space at left

capability-stage.webp:
wide black exhibition hall with three tall translucent illuminated panels,
one small walking human silhouette, strong depth, frontal architectural composition

process-projector.webp:
vertical close crop of a vintage cinema projector in darkness,
one crisp volumetric beam with visible dust, generous black negative space

gallery-portrait.webp:
vertical cinematic portrait of an East Asian woman, wet skin texture,
hard side light, deep shadow, luxury editorial photography

gallery-product.webp:
landscape luxury black perfume bottle on wet obsidian rock,
silver highlights, restrained water droplets, campaign photography

gallery-fantasy.webp:
vertical dark fantasy cliff castle above clouds and waterfalls,
storm light, realistic film still, no game UI

gallery-fashion.webp:
vertical editorial fashion figure in sculptural black fabric,
movement frozen by hard light, premium monochrome campaign

gallery-architecture.webp:
landscape brutalist modern house beside still black water at blue hour,
cinematic architectural photography

gallery-car.webp:
landscape black grand touring car in a rain-soaked alley at night,
headlights reflected on pavement, no visible brand marks

membership-chair.webp:
wide empty director chair in a private black screening room,
single overhead light, image wall barely visible in background

final-light.webp:
wide nearly empty black stage, one overhead cone of soft silver light,
subtle haze and film dust, no objects or people
```

每次生成后用 `view_image` 检查主体、裁切、统一调色和无文字要求。将选定结果复制到上述固定路径，保留 ImageGen 原始文件。

- [ ] **Step 2: 先写内容模型失败测试**

`tests/landing-content.test.ts`：

```ts
import { galleryItems, processSteps } from "@/lib/landing-content"

it("defines five production steps in order", () => {
  expect(processSteps.map((step) => step.step)).toEqual([
    "STEP 01 / MOOD",
    "STEP 02 / SUBJECT",
    "STEP 03 / DETAILS",
    "STEP 04 / PROMPT ENGINE",
    "STEP 05 / FINAL FRAME",
  ])
})

it("defines six distinct gallery works with local images", () => {
  expect(galleryItems).toHaveLength(6)
  expect(new Set(galleryItems.map((item) => item.src)).size).toBe(6)
  expect(galleryItems.every((item) => item.src.startsWith("/cinematic/"))).toBe(true)
})
```

- [ ] **Step 3: 运行测试确认失败**

Run:

```powershell
npm test -- tests/landing-content.test.ts
```

Expected: FAIL，`lib/landing-content.ts` 不存在。

- [ ] **Step 4: 实现集中内容模型**

`lib/landing-content.ts`：

```ts
export const capabilities = [
  {
    index: "01",
    title: "选择图片类型",
    description: "从海报、人像、产品、建筑到概念艺术，先确定镜头最终要成为哪一种画面。",
    label: "TYPE & STYLE",
  },
  {
    index: "02",
    title: "输入主体与需求",
    description: "用自然语言描述主体、用途、气氛与构图，不需要学习复杂的提示词语法。",
    label: "SUBJECT & REQUEST",
  },
  {
    index: "03",
    title: "自动生成专业提示词",
    description: "系统把普通描述扩展为镜头、光影、材质和画面语言，形成可执行的视觉方案。",
    label: "PROMPT ENGINE",
  },
] as const

export const processSteps = [
  { step: "STEP 01 / MOOD", title: "选择风格", image: "/cinematic/gallery-architecture.webp" },
  { step: "STEP 02 / SUBJECT", title: "输入主体", image: "/cinematic/gallery-portrait.webp" },
  { step: "STEP 03 / DETAILS", title: "补充细节", image: "/cinematic/gallery-fashion.webp" },
  { step: "STEP 04 / PROMPT ENGINE", title: "AI 优化提示词", image: "/cinematic/gallery-product.webp" },
  { step: "STEP 05 / FINAL FRAME", title: "生成高清图片", image: "/cinematic/gallery-fantasy.webp" },
] as const

export const galleryItems = [
  {
    slug: "portrait",
    title: "Cinematic Portrait",
    description: "湿润质感与单侧硬光构成的电影人像。",
    src: "/cinematic/gallery-portrait.webp",
    alt: "冷光照亮面部的电影感人物肖像",
    className: "gallery-item--portrait",
  },
  {
    slug: "product",
    title: "Luxury Product Shot",
    description: "黑曜石与银色高光中的奢华产品画面。",
    src: "/cinematic/gallery-product.webp",
    alt: "黑色岩石上的高级香水产品摄影",
    className: "gallery-item--product",
  },
  {
    slug: "fantasy",
    title: "Dark Fantasy Scene",
    description: "风暴、城堡与深渊组成的暗黑叙事。",
    src: "/cinematic/gallery-fantasy.webp",
    alt: "云层和瀑布上方的暗黑幻想城堡",
    className: "gallery-item--fantasy",
  },
  {
    slug: "fashion",
    title: "Editorial Fashion",
    description: "黑色织物在硬光中凝固成雕塑。",
    src: "/cinematic/gallery-fashion.webp",
    alt: "穿着黑色雕塑感服装的编辑时装人物",
    className: "gallery-item--fashion",
  },
  {
    slug: "architecture",
    title: "Architectural Vision",
    description: "蓝调时刻中的克制建筑电影静帧。",
    src: "/cinematic/gallery-architecture.webp",
    alt: "水边的深色现代建筑",
    className: "gallery-item--architecture",
  },
  {
    slug: "car",
    title: "Cinematic Car Scene",
    description: "雨夜街道与车灯反射塑造速度前的静止。",
    src: "/cinematic/gallery-car.webp",
    alt: "雨夜巷道中的黑色汽车",
    className: "gallery-item--car",
  },
] as const
```

- [ ] **Step 5: 验证内容与资产路径**

Run:

```powershell
npm test -- tests/landing-content.test.ts
Get-ChildItem public\cinematic\*.webp | Select-Object Name,Length
```

Expected: 测试 PASS；11 个 WebP 全部存在且文件大小大于 0。

- [ ] **Step 6: 提交资产与内容模型**

```powershell
git add public/cinematic lib/landing-content.ts tests/landing-content.test.ts
git commit -m "feat: add dark light cinematic assets"
```

## Task 3：建立设计令牌、基础按钮、颗粒与 Reveal

**Files:**
- Modify: `app/globals.css`
- Create: `components/cinematic/cinematic-button.tsx`
- Create: `components/cinematic/film-grain.tsx`
- Create: `components/cinematic/reveal.tsx`
- Create: `public/cinematic/noise.png`

- [ ] **Step 1: 实现基础组件**

`components/cinematic/cinematic-button.tsx`：

```tsx
import Link from "next/link"
import type { ReactNode } from "react"

type CinematicButtonProps = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: "solid" | "outline"
  ariaLabel?: string
}

export function CinematicButton({
  children,
  href,
  onClick,
  variant = "solid",
  ariaLabel,
}: CinematicButtonProps) {
  const className = `cinematic-button cinematic-button--${variant}`

  if (href) {
    return (
      <Link className={className} href={href} aria-label={ariaLabel}>
        <span>{children}</span>
      </Link>
    )
  }

  return (
    <button className={className} type="button" onClick={onClick} aria-label={ariaLabel}>
      <span>{children}</span>
    </button>
  )
}
```

`components/cinematic/film-grain.tsx`：

```tsx
export function FilmGrain() {
  return <div className="film-grain" aria-hidden="true" />
}
```

`components/cinematic/reveal.tsx`：

```tsx
"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal--visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: 写入完整设计令牌与基础样式**

在 `app/globals.css` 中保留 Tailwind import，并增加：

```css
@theme {
  --color-canvas: #030405;
  --color-stage: #07090b;
  --color-graphite: #111419;
  --color-ink: #f2f3f1;
  --color-muted: #9a9fa7;
  --color-cold: #b9e2f8;
  --color-cold-deep: #7cbbd8;
}

::selection {
  background: rgba(185, 226, 248, 0.22);
  color: #ffffff;
}

a,
button {
  -webkit-tap-highlight-color: transparent;
}

:focus-visible {
  outline: 1px solid #b9e2f8;
  outline-offset: 5px;
}

.cinematic-page {
  position: relative;
  isolation: isolate;
  overflow: clip;
  background: #030405;
  color: #f2f3f1;
}

.film-grain {
  position: fixed;
  inset: -50%;
  z-index: 90;
  pointer-events: none;
  opacity: 0.065;
  background-image: url("/cinematic/noise.png");
  animation: grain-shift 0.24s steps(2) infinite;
}

.reveal {
  opacity: 0;
  transform: translate3d(0, 24px, 0);
  transition:
    opacity 900ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay),
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay);
}

.reveal--visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.cinematic-button {
  position: relative;
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0 28px;
  color: #f2f3f1;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-decoration: none;
  transition: color 350ms ease, border-color 350ms ease, background 350ms ease;
}

.cinematic-button--solid {
  border-color: #f2f3f1;
  background: #f2f3f1;
  color: #030405;
}

.cinematic-button--outline:hover,
.cinematic-button--outline:focus-visible {
  border-color: #b9e2f8;
  background: rgba(185, 226, 248, 0.07);
}

@keyframes grain-shift {
  0% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(2%, -1%, 0); }
  50% { transform: translate3d(-1%, 2%, 0); }
  75% { transform: translate3d(1%, 1%, 0); }
  100% { transform: translate3d(-2%, -1%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .film-grain { animation: none; }
  .reveal {
    opacity: 1;
    transform: none;
    transition-duration: 120ms;
  }
}
```

同时创建 `public/cinematic/noise.png`：使用 ImageGen 生成一张无文字的均匀单色胶片颗粒纹理，或从最终影像中裁取不带主体的颗粒区域；不得使用 CSS 噪声替代可见纹理资产。

- [ ] **Step 3: 验证类型与构建**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: PASS。

- [ ] **Step 4: 提交基础视觉系统**

```powershell
git add app/globals.css components/cinematic public/cinematic/noise.png
git commit -m "feat: add cinematic visual primitives"
```

## Task 4：实现可访问导航与移动菜单

**Files:**
- Create: `components/cinematic/cinematic-header.tsx`
- Create: `tests/components/cinematic-header.test.tsx`

- [ ] **Step 1: 写失败测试**

`tests/components/cinematic-header.test.tsx`：

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { CinematicHeader } from "@/components/cinematic/cinematic-header"

it("opens and closes the mobile navigation", () => {
  render(<CinematicHeader />)

  fireEvent.click(screen.getByRole("button", { name: "打开导航" }))
  expect(screen.getByRole("dialog", { name: "站点导航" })).toBeInTheDocument()

  fireEvent.keyDown(document, { key: "Escape" })
  expect(screen.queryByRole("dialog", { name: "站点导航" })).not.toBeInTheDocument()
})

it("links to the requested sections and workspace", () => {
  render(<CinematicHeader />)

  expect(screen.getAllByRole("link", { name: "作品" })[0]).toHaveAttribute("href", "#gallery")
  expect(screen.getAllByRole("link", { name: "创作流程" })[0]).toHaveAttribute("href", "#process")
  expect(screen.getAllByRole("link", { name: "开始创作" })[0]).toHaveAttribute("href", "/generate")
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/cinematic-header.test.tsx
```

Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现导航**

`components/cinematic/cinematic-header.tsx`：

```tsx
"use client"

import { List, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const links = [
  { label: "作品", href: "#gallery" },
  { label: "创作流程", href: "#process" },
  { label: "积分与会员", href: "#membership" },
] as const

export function CinematicHeader() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  const closeMenu = () => setOpen(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", closeOnEscape)
    document.body.style.overflow = open ? "hidden" : ""
    if (open) {
      closeRef.current?.focus()
      wasOpen.current = true
    } else if (wasOpen.current) {
      triggerRef.current?.focus()
      wasOpen.current = false
    }

    return () => {
      document.removeEventListener("keydown", closeOnEscape)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <header className="cinematic-header">
      <Link className="cinematic-logo" href="/" aria-label="绘境 AI 首页">
        绘境 AI
      </Link>

      <nav className="cinematic-nav" aria-label="主导航">
        {links.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
        <Link className="header-cta" href="/generate">开始创作</Link>
      </nav>

      <button
        ref={triggerRef}
        className="menu-trigger"
        type="button"
        aria-label="打开导航"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <List size={22} weight="thin" />
      </button>

      {open ? (
        <div className="mobile-menu" role="dialog" aria-label="站点导航" aria-modal="true">
          <button ref={closeRef} type="button" aria-label="关闭导航" onClick={closeMenu}>
            <X size={24} weight="thin" />
          </button>
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <Link href="/generate" onClick={closeMenu}>开始创作</Link>
        </div>
      ) : null}
    </header>
  )
}
```

- [ ] **Step 4: 增加导航样式并验证**

在 `app/globals.css` 增加 `.cinematic-header`、`.cinematic-nav`、`.mobile-menu` 和 `@media (max-width: 767px)` 规则：

```css
.cinematic-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 80;
  display: flex;
  height: 76px;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(22px, 4vw, 72px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(3, 4, 5, 0.58);
  backdrop-filter: blur(16px);
}

.cinematic-logo {
  color: #f2f3f1;
  font-family: var(--font-serif), serif;
  font-size: 19px;
  letter-spacing: 0.08em;
  text-decoration: none;
}

.cinematic-nav {
  display: flex;
  align-items: center;
  gap: 30px;
}

.cinematic-nav a {
  color: #c2c5c9;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-decoration: none;
}

.menu-trigger,
.mobile-menu {
  display: none;
}

@media (max-width: 767px) {
  .cinematic-nav { display: none; }
  .menu-trigger {
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: #f2f3f1;
  }
  .mobile-menu {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 28px;
    padding: 32px;
    background: rgba(3, 4, 5, 0.98);
  }
  .mobile-menu > button {
    position: absolute;
    top: 24px;
    right: 24px;
    border: 0;
    background: transparent;
    color: #f2f3f1;
  }
  .mobile-menu a {
    color: #f2f3f1;
    font-family: var(--font-serif), serif;
    font-size: 34px;
    text-decoration: none;
  }
}
```

Run:

```powershell
npm test -- tests/components/cinematic-header.test.tsx
npm run typecheck
```

Expected: PASS。

- [ ] **Step 5: 提交导航**

```powershell
git add components/cinematic/cinematic-header.tsx tests/components/cinematic-header.test.tsx app/globals.css
git commit -m "feat: add cinematic navigation"
```

## Task 5：实现 Hero 与核心能力章节

**Files:**
- Create: `components/cinematic/hero-section.tsx`
- Create: `components/cinematic/capabilities-section.tsx`
- Modify: `app/globals.css`
- Modify: `tests/components/page-sections.test.tsx`

- [ ] **Step 1: 扩展失败测试**

在 `tests/components/page-sections.test.tsx` 增加：

```tsx
it("renders hero actions and the three capabilities", () => {
  render(<Home />)

  expect(
    screen.getAllByRole("link", { name: "开始创作" })
      .some((link) => link.getAttribute("href") === "/generate"),
  ).toBe(true)
  expect(screen.getByRole("link", { name: "查看示例" })).toHaveAttribute("href", "#gallery")
  expect(screen.getByText("选择图片类型")).toBeInTheDocument()
  expect(screen.getByText("输入主体与需求")).toBeInTheDocument()
  expect(screen.getByText("自动生成专业提示词")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
```

Expected: FAIL，页面尚未包含按钮与能力项。

- [ ] **Step 3: 实现 Hero**

`components/cinematic/hero-section.tsx`：

```tsx
"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import { CinematicButton } from "./cinematic-button"
import { Reveal } from "./reveal"

export function HeroSection() {
  const screenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = screenRef.current
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY * 0.045, window.innerHeight * 0.05)
        node.style.setProperty("--hero-shift", `${offset}px`)
      })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", update)
    }
  }, [])

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div ref={screenRef} className="hero-screen">
        <Image
          src="/cinematic/hero-screen.webp"
          alt="黑暗巨幕中人物面对远方城堡的电影场景"
          fill
          priority
          sizes="(max-width: 767px) 100vw, 64vw"
        />
      </div>

      <div className="hero-copy">
        <Reveal>
          <p className="frame-label">FRAME 01 / VISUAL ENGINE / AI IMAGE STUDIO</p>
        </Reveal>
        <Reveal delay={100}>
          <h1 id="hero-title">像导演一样<br />生成你的视觉大片</h1>
        </Reveal>
        <Reveal delay={210}>
          <p className="hero-description">
            从灵感、风格、主体到画面语言，让 AI 自动理解你的创作意图。
          </p>
        </Reveal>
        <Reveal delay={320} className="hero-actions">
          <CinematicButton href="/generate">开始创作</CinematicButton>
          <CinematicButton href="#gallery" variant="outline">查看示例</CinematicButton>
        </Reveal>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: 实现核心能力**

`components/cinematic/capabilities-section.tsx`：

```tsx
import Image from "next/image"
import { capabilities } from "@/lib/landing-content"
import { Reveal } from "./reveal"

export function CapabilitiesSection() {
  return (
    <section className="capabilities-section" aria-labelledby="capabilities-title">
      <Image
        className="capabilities-background"
        src="/cinematic/capability-stage.webp"
        alt=""
        fill
        sizes="100vw"
      />
      <div className="section-heading">
        <p className="frame-label">FRAME 02 / CAPABILITIES</p>
        <h2 id="capabilities-title">不是输入提示词，<br />而是构建一场视觉叙事</h2>
      </div>
      <div className="capability-panels">
        {capabilities.map((item, index) => (
          <Reveal key={item.index} delay={index * 120} className="capability-panel">
            <span>{item.index}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <small>{item.label}</small>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: 写入章节布局样式**

在 `app/globals.css` 增加：

```css
.hero-section,
.capabilities-section {
  position: relative;
  min-height: 100svh;
}

.hero-section {
  display: flex;
  align-items: flex-end;
  padding: 150px clamp(22px, 5vw, 86px) 9vh;
}

.hero-screen {
  --hero-shift: 0px;
  position: absolute;
  inset: 10vh 4vw 7vh 31vw;
  transform: translate3d(0, var(--hero-shift), 0) perspective(1200px) rotateY(-4deg);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 100px rgba(185, 226, 248, 0.08);
}

.hero-screen::after,
.capabilities-section::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(3, 4, 5, 0.28);
}

.hero-screen img,
.capabilities-background {
  object-fit: cover;
  filter: saturate(0.55) contrast(1.08) brightness(0.78);
}

.hero-copy {
  position: relative;
  z-index: 2;
  width: min(760px, 64vw);
}

.frame-label {
  margin: 0 0 28px;
  color: #aab0b7;
  font-size: 10px;
  letter-spacing: 0.18em;
}

.hero-copy h1,
.section-heading h2 {
  margin: 0;
  font-family: var(--font-serif), serif;
  font-weight: 500;
  letter-spacing: -0.055em;
}

.hero-copy h1 {
  font-size: clamp(64px, 8vw, 132px);
  line-height: 0.98;
}

.hero-description {
  max-width: 490px;
  margin: 34px 0 0;
  color: #b2b6bc;
  font-size: 16px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 36px;
}

.capabilities-section {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  align-items: center;
  gap: 8vw;
  padding: 14vh clamp(22px, 5vw, 86px);
}

.capabilities-background {
  opacity: 0.42;
}

.section-heading,
.capability-panels {
  position: relative;
  z-index: 2;
}

.section-heading h2 {
  font-size: clamp(42px, 5.4vw, 84px);
  line-height: 1.12;
}

.capability-panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  perspective: 1100px;
}

.capability-panel {
  min-height: 440px;
  padding: 34px 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(10, 13, 16, 0.56);
  backdrop-filter: blur(12px);
}

.capability-panel:nth-child(2) { transform: translateY(-38px); }
.capability-panel h3 { margin: 38px 0 18px; font-size: 22px; font-weight: 500; }
.capability-panel p { color: #a8adb4; font-size: 14px; line-height: 1.8; }
.capability-panel small { position: absolute; bottom: 26px; color: #7f858d; letter-spacing: 0.12em; }

@media (max-width: 767px) {
  .hero-section { align-items: flex-start; padding-top: 132px; }
  .hero-copy { width: 100%; }
  .hero-copy h1 { font-size: clamp(44px, 13vw, 58px); }
  .hero-screen {
    inset: 48vh -16vw 5vh 16vw;
    transform: none;
  }
  .hero-actions { flex-direction: column; align-items: stretch; }
  .capabilities-section { grid-template-columns: 1fr; padding-block: 110px; }
  .capability-panels { grid-template-columns: 1fr; }
  .capability-panel,
  .capability-panel:nth-child(2) { min-height: 310px; transform: none; }
}
```

- [ ] **Step 6: 验证并提交**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
npm run typecheck
```

Expected: PASS。

```powershell
git add components/cinematic/hero-section.tsx components/cinematic/capabilities-section.tsx app/globals.css tests/components/page-sections.test.tsx
git commit -m "feat: build hero and capability scenes"
```

## Task 6：实现五镜头创作流程

**Files:**
- Create: `components/cinematic/process-section.tsx`
- Modify: `app/globals.css`
- Modify: `tests/components/page-sections.test.tsx`

- [ ] **Step 1: 写失败测试**

增加：

```tsx
it("renders the five-step production timeline", () => {
  render(<Home />)

  expect(screen.getByRole("heading", { name: "从想法到大片，只需五个镜头" })).toBeInTheDocument()
  expect(screen.getAllByText(/STEP 0[1-5]/)).toHaveLength(5)
  expect(screen.getByText("生成高清图片")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 实现流程组件**

`components/cinematic/process-section.tsx`：

```tsx
import Image from "next/image"
import { processSteps } from "@/lib/landing-content"
import { Reveal } from "./reveal"

export function ProcessSection() {
  return (
    <section id="process" className="process-section" aria-labelledby="process-title">
      <Image
        className="projector-image"
        src="/cinematic/process-projector.webp"
        alt=""
        width={900}
        height={1400}
        sizes="(max-width: 767px) 50vw, 30vw"
      />
      <div className="section-heading process-heading">
        <p className="frame-label">FRAME 03 / CREATION PROCESS</p>
        <h2 id="process-title">从想法到大片，<br />只需五个镜头</h2>
      </div>
      <div className="process-timeline">
        <div className="timeline-light" aria-hidden="true" />
        {processSteps.map((item, index) => (
          <Reveal key={item.step} delay={index * 100} className="process-step">
            <div className="process-node" aria-hidden="true" />
            <div>
              <p>{item.step}</p>
              <h3>{item.title}</h3>
            </div>
            <Image
              src={item.image}
              alt=""
              width={560}
              height={340}
              sizes="(max-width: 767px) 72vw, 28vw"
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: 写入时间轴样式**

在 `app/globals.css` 增加 `.process-section`、`.process-timeline`、`.timeline-light`、`.process-step` 和移动端规则。关键值：

```css
.process-section {
  position: relative;
  min-height: 130svh;
  padding: 14vh clamp(22px, 5vw, 86px);
}

.projector-image {
  position: absolute;
  left: -5vw;
  bottom: 2vh;
  width: 34vw;
  height: 70%;
  object-fit: cover;
  opacity: 0.48;
}

.process-heading { position: sticky; top: 130px; width: 36vw; }

.process-timeline {
  position: relative;
  width: min(720px, 54vw);
  margin-left: auto;
}

.timeline-light {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: #dff3ff;
  box-shadow: 0 0 18px rgba(185, 226, 248, 0.72);
}

.process-step {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 50px;
  align-items: center;
  min-height: 280px;
}

.process-step:nth-child(odd) > div:not(.process-node) { order: 2; }
.process-step:nth-child(odd) > img { order: 1; }
.process-node {
  position: absolute;
  left: 50%;
  width: 7px;
  height: 7px;
  transform: translateX(-3px);
  border-radius: 999px;
  background: #dff3ff;
  box-shadow: 0 0 14px #b9e2f8;
}

.process-step img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  filter: saturate(0.55) brightness(0.74);
}

@media (max-width: 767px) {
  .process-section { padding-block: 110px; }
  .projector-image { left: -35vw; width: 75vw; opacity: 0.28; }
  .process-heading { position: relative; top: auto; width: 100%; }
  .process-timeline { width: 100%; margin-top: 70px; padding-left: 32px; }
  .timeline-light { left: 6px; }
  .process-step,
  .process-step:nth-child(odd) {
    grid-template-columns: 1fr;
    gap: 20px;
    min-height: 0;
    margin-bottom: 72px;
  }
  .process-step:nth-child(odd) > div:not(.process-node),
  .process-step:nth-child(odd) > img { order: initial; }
  .process-node { left: 6px; transform: translateX(-3px); }
}
```

- [ ] **Step 5: 验证并提交**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
npm run typecheck
```

Expected: PASS。

```powershell
git add components/cinematic/process-section.tsx app/globals.css tests/components/page-sections.test.tsx
git commit -m "feat: add cinematic production timeline"
```

## Task 7：实现不规则作品 Gallery

**Files:**
- Create: `components/cinematic/gallery-section.tsx`
- Create: `tests/components/gallery-section.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: 写失败测试**

`tests/components/gallery-section.test.tsx`：

```tsx
import { render, screen } from "@testing-library/react"
import { GallerySection } from "@/components/cinematic/gallery-section"

it("renders six accessible cinematic works", () => {
  render(<GallerySection />)

  expect(screen.getAllByRole("figure")).toHaveLength(6)
  expect(screen.getByText("Cinematic Portrait")).toBeInTheDocument()
  expect(screen.getByText("Luxury Product Shot")).toBeInTheDocument()
  expect(screen.getByText("Dark Fantasy Scene")).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/gallery-section.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 实现 Gallery**

`components/cinematic/gallery-section.tsx`：

```tsx
import Image from "next/image"
import { galleryItems } from "@/lib/landing-content"
import { Reveal } from "./reveal"

export function GallerySection() {
  return (
    <section id="gallery" className="gallery-section" aria-labelledby="gallery-title">
      <div className="section-heading gallery-heading">
        <p className="frame-label">FRAME 04 / AI GALLERY</p>
        <h2 id="gallery-title">AI 镜头库<br />电影级作品示例</h2>
      </div>
      <div className="editorial-gallery">
        {galleryItems.map((item, index) => (
          <Reveal key={item.slug} delay={(index % 3) * 90} className={item.className}>
            <figure tabIndex={0} role="figure" aria-label={item.title}>
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 767px) 50vw, 36vw"
              />
              <figcaption>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: 实现杂志网格与悬停**

`app/globals.css` 增加：

```css
.gallery-section {
  position: relative;
  min-height: 120svh;
  padding: 14vh clamp(22px, 5vw, 86px);
}

.gallery-heading { max-width: 520px; margin-bottom: 64px; }

.editorial-gallery {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 74px;
  gap: 16px;
}

.editorial-gallery figure {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #080a0c;
}

.editorial-gallery img {
  object-fit: cover;
  filter: saturate(0.58) contrast(1.07) brightness(0.78);
  transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 600ms ease;
}

.editorial-gallery figcaption {
  position: absolute;
  inset: auto 0 0;
  padding: 20px;
  background: rgba(2, 3, 4, 0.82);
  transform: translateY(18px);
  opacity: 0.72;
  transition: opacity 450ms ease, transform 450ms ease;
}

.editorial-gallery figure:hover img,
.editorial-gallery figure:focus-visible img {
  transform: scale(1.03);
  filter: saturate(0.62) contrast(1.09) brightness(0.66);
}

.editorial-gallery figure:hover figcaption,
.editorial-gallery figure:focus-visible figcaption {
  opacity: 1;
  transform: translateY(0);
}

.gallery-item--portrait { grid-column: 1 / span 5; grid-row: span 8; }
.gallery-item--product { grid-column: 6 / span 4; grid-row: span 4; }
.gallery-item--fantasy { grid-column: 10 / span 3; grid-row: span 7; }
.gallery-item--fashion { grid-column: 6 / span 4; grid-row: span 6; }
.gallery-item--architecture { grid-column: 1 / span 5; grid-row: span 4; }
.gallery-item--car { grid-column: 10 / span 3; grid-row: span 5; }

@media (max-width: 767px) {
  .editorial-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 160px;
    gap: 10px;
  }
  .gallery-item--portrait { grid-column: 1 / -1; grid-row: span 3; }
  .gallery-item--product,
  .gallery-item--fantasy,
  .gallery-item--fashion,
  .gallery-item--architecture,
  .gallery-item--car {
    grid-column: auto;
    grid-row: span 2;
  }
  .editorial-gallery figcaption { opacity: 1; transform: none; padding: 50px 14px 14px; }
}
```

- [ ] **Step 5: 验证并提交**

Run:

```powershell
npm test -- tests/components/gallery-section.test.tsx
npm run typecheck
```

Expected: PASS。

```powershell
git add components/cinematic/gallery-section.tsx tests/components/gallery-section.test.tsx app/globals.css
git commit -m "feat: add editorial cinematic gallery"
```

## Task 8：实现会员权益与升级弹窗

**Files:**
- Create: `components/cinematic/membership-section.tsx`
- Create: `components/cinematic/upgrade-dialog.tsx`
- Create: `tests/components/membership-section.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: 写失败测试**

`tests/components/membership-section.test.tsx`：

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { MembershipSection } from "@/components/cinematic/membership-section"

it("shows membership benefits and an upgrade placeholder dialog", () => {
  render(<MembershipSection />)

  expect(screen.getByText("新用户每日赠送 5 个积分")).toBeInTheDocument()
  expect(screen.getByText("每生成 1 张图片消耗 1 个积分")).toBeInTheDocument()

  fireEvent.click(screen.getByRole("button", { name: "升级创作权限" }))
  expect(screen.getByRole("dialog", { name: "升级创作权限" })).toBeInTheDocument()
  expect(screen.getByText(/升级功能即将开放/)).toBeInTheDocument()

  fireEvent.keyDown(document, { key: "Escape" })
  expect(screen.queryByRole("dialog", { name: "升级创作权限" })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/membership-section.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 实现弹窗**

`components/cinematic/upgrade-dialog.tsx`：

```tsx
"use client"

import { X } from "@phosphor-icons/react"
import { useEffect, useRef } from "react"

export function UpgradeDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", closeOnEscape)
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    return () => {
      document.removeEventListener("keydown", closeOnEscape)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="upgrade-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="升级创作权限"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button ref={closeRef} type="button" aria-label="关闭升级弹窗" onClick={onClose}>
          <X size={22} weight="thin" />
        </button>
        <p className="frame-label">PRIVATE ACCESS / COMING SOON</p>
        <h2>升级创作权限</h2>
        <p>升级功能即将开放。当前版本不会创建订单，也不会接入真实支付。</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 实现会员章节**

`components/cinematic/membership-section.tsx`：

```tsx
"use client"

import { Gift, LockKey, Stack } from "@phosphor-icons/react"
import Image from "next/image"
import { useState } from "react"
import { CinematicButton } from "./cinematic-button"
import { UpgradeDialog } from "./upgrade-dialog"

const benefits = [
  { icon: Gift, title: "新用户每日赠送 5 个积分", copy: "每天登录即可领取，持续激发新的视觉灵感。" },
  { icon: Stack, title: "每生成 1 张图片消耗 1 个积分", copy: "透明简单的创作机制，让注意力回到作品本身。" },
  { icon: LockKey, title: "积分不足时可升级解锁更多创作次数", copy: "升级入口已保留，当前版本不接入真实支付。" },
] as const

export function MembershipSection() {
  const [open, setOpen] = useState(false)

  return (
    <section id="membership" className="membership-section" aria-labelledby="membership-title">
      <Image src="/cinematic/membership-chair.webp" alt="" fill sizes="100vw" />
      <div className="membership-content">
        <p className="frame-label">FRAME 05 / MEMBERSHIP</p>
        <h2 id="membership-title">创作无界，<br />灵感不设限</h2>
        <div className="benefit-list">
          {benefits.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <Icon size={32} weight="thin" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <CinematicButton onClick={() => setOpen(true)} variant="outline">
          升级创作权限
        </CinematicButton>
      </div>
      <UpgradeDialog open={open} onClose={() => setOpen(false)} />
    </section>
  )
}
```

- [ ] **Step 5: 增加会员与弹窗样式**

在 `app/globals.css` 增加会员背景遮罩、三列权益、细线分隔、弹窗与移动端单列规则。必须包含：

```css
.membership-section {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  padding: 14vh clamp(22px, 5vw, 86px);
}

.membership-section > img {
  object-fit: cover;
  opacity: 0.34;
  filter: saturate(0.5) brightness(0.58);
}

.membership-section::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(3, 4, 5, 0.68);
}

.membership-content { position: relative; z-index: 2; width: 100%; }
.membership-content > h2 { font: 500 clamp(48px, 6vw, 94px) / 1.08 var(--font-serif), serif; }
.benefit-list { display: grid; grid-template-columns: repeat(3, 1fr); margin: 70px 0 46px; }
.benefit-list article { min-height: 230px; padding: 0 34px; border-left: 1px solid rgba(255, 255, 255, 0.16); }
.benefit-list h3 { max-width: 280px; margin-top: 28px; font-size: 22px; font-weight: 500; }
.benefit-list p { max-width: 300px; color: #9a9fa7; line-height: 1.8; }

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(16px);
}

.upgrade-dialog {
  position: relative;
  width: min(560px, 100%);
  padding: 52px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: #080a0c;
}

.upgrade-dialog > button {
  position: absolute;
  top: 18px;
  right: 18px;
  border: 0;
  background: transparent;
  color: #f2f3f1;
}

@media (max-width: 767px) {
  .benefit-list { grid-template-columns: 1fr; gap: 36px; }
  .benefit-list article { min-height: 0; padding: 0 0 36px; border-left: 0; border-bottom: 1px solid rgba(255,255,255,.14); }
  .upgrade-dialog { padding: 46px 24px 30px; }
}
```

- [ ] **Step 6: 验证并提交**

Run:

```powershell
npm test -- tests/components/membership-section.test.tsx
npm run typecheck
```

Expected: PASS。

```powershell
git add components/cinematic/membership-section.tsx components/cinematic/upgrade-dialog.tsx tests/components/membership-section.test.tsx app/globals.css
git commit -m "feat: add cinematic membership access"
```

## Task 9：组合终幕、首页和创作入口

**Files:**
- Create: `components/cinematic/final-cta-section.tsx`
- Create: `app/generate/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/components/page-sections.test.tsx`

- [ ] **Step 1: 完成页面结构失败测试**

将 `tests/components/page-sections.test.tsx` 收敛为：

```tsx
import { render, screen } from "@testing-library/react"
import Home from "@/app/page"

it("renders all six cinematic chapters in order", () => {
  const { container } = render(<Home />)
  const sections = Array.from(container.querySelectorAll("main > section"))

  expect(sections).toHaveLength(6)
  expect(sections.map((section) => section.id || section.className)).toEqual([
    "hero-section",
    "capabilities-section",
    "process",
    "gallery",
    "membership",
    "final-cta-section",
  ])
})

it("renders the final brand statement and working calls to action", () => {
  render(<Home />)

  expect(screen.getByRole("heading", { name: /每一次生成，都是一帧电影/ })).toBeInTheDocument()
  expect(
    screen
      .getAllByRole("link", { name: /开始创作|开始生成你的第一张作品/ })
      .every((link) => link.getAttribute("href") === "/generate"),
  ).toBe(true)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test -- tests/components/page-sections.test.tsx
```

Expected: FAIL，终幕与组合结构尚未完成。

- [ ] **Step 3: 实现终幕**

`components/cinematic/final-cta-section.tsx`：

```tsx
import Image from "next/image"
import { CinematicButton } from "./cinematic-button"
import { Reveal } from "./reveal"

export function FinalCtaSection() {
  return (
    <section className="final-cta-section" aria-labelledby="final-title">
      <Image src="/cinematic/final-light.webp" alt="" fill sizes="100vw" />
      <Reveal className="final-cta-content">
        <p className="frame-label">FRAME 06 / FINAL CUT</p>
        <h2 id="final-title">每一次生成，<br />都是一帧电影。</h2>
        <CinematicButton href="/generate">开始生成你的第一张作品</CinematicButton>
      </Reveal>
      <footer>
        <span>© 2026 绘境 AI</span>
        <span>AI IMAGE STUDIO / DARK LIGHT EDITION</span>
      </footer>
    </section>
  )
}
```

- [ ] **Step 4: 组合首页**

`app/page.tsx`：

```tsx
import { CapabilitiesSection } from "@/components/cinematic/capabilities-section"
import { CinematicHeader } from "@/components/cinematic/cinematic-header"
import { FilmGrain } from "@/components/cinematic/film-grain"
import { FinalCtaSection } from "@/components/cinematic/final-cta-section"
import { GallerySection } from "@/components/cinematic/gallery-section"
import { HeroSection } from "@/components/cinematic/hero-section"
import { MembershipSection } from "@/components/cinematic/membership-section"
import { ProcessSection } from "@/components/cinematic/process-section"

export default function Home() {
  return (
    <div className="cinematic-page">
      <CinematicHeader />
      <FilmGrain />
      <main>
        <HeroSection />
        <CapabilitiesSection />
        <ProcessSection />
        <GallerySection />
        <MembershipSection />
        <FinalCtaSection />
      </main>
    </div>
  )
}
```

- [ ] **Step 5: 实现 `/generate` 占位入口**

`app/generate/page.tsx`：

```tsx
import Link from "next/link"

export default function GeneratePage() {
  return (
    <main className="generate-placeholder">
      <p className="frame-label">CREATION STUDIO / PREVIEW</p>
      <h1>创作工作台将在下一阶段接入</h1>
      <p>营销首页已经准备好。真实生图、积分和历史记录将沿用绘境 AI MVP 规格继续实现。</p>
      <Link href="/">返回暗光剧场</Link>
    </main>
  )
}
```

- [ ] **Step 6: 增加终幕与入口样式**

在 `app/globals.css` 增加：

```css
.final-cta-section {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 100px 22px 42px;
  text-align: center;
}

.final-cta-section > img {
  object-fit: cover;
  opacity: 0.54;
  filter: saturate(0.35) brightness(0.6);
}

.final-cta-content { position: relative; z-index: 2; }
.final-cta-content h2 {
  margin: 0 0 48px;
  font: 500 clamp(54px, 7vw, 112px) / 1.08 var(--font-serif), serif;
  letter-spacing: -0.055em;
}

.final-cta-section footer {
  position: absolute;
  inset: auto clamp(22px, 5vw, 86px) 26px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  color: #777d84;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.generate-placeholder {
  min-height: 100svh;
  display: grid;
  place-content: center;
  gap: 22px;
  padding: 24px;
  background: #030405;
  text-align: center;
}

.generate-placeholder h1 {
  max-width: 900px;
  margin: 0;
  font: 500 clamp(46px, 7vw, 96px) / 1.1 var(--font-serif), serif;
}

.generate-placeholder p { max-width: 620px; margin: 0 auto; color: #9a9fa7; line-height: 1.9; }
.generate-placeholder a { color: #dff3ff; }
```

- [ ] **Step 7: 运行全量验证并提交**

Run:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: 全部 PASS。

```powershell
git add app components lib tests
git commit -m "feat: assemble dark light landing experience"
```

## Task 10：运行本地页面、视觉 QA 与修正

**Files:**
- Create: `design-qa.md`
- Create: `.design-qa/reference-and-desktop.png`
- Create: `.design-qa/reference-and-mobile.png`
- Modify: any implementation file required by P0/P1/P2 fixes

- [ ] **Step 1: 启动本地页面**

Run:

```powershell
npm run dev
```

Expected: 本地 URL 可访问；保持服务运行。

- [ ] **Step 2: 使用首个可用浏览器捕获实现**

按 Product Design 浏览器顺序：

1. Browser skill；
2. Chrome skill；
3. 如果两者均不可用，先获得用户许可，再使用 Playwright。

捕获：

- `1440 × 1100` 桌面首屏与整页长截图；
- `390 × 844` 移动端首屏与整页长截图；
- Gallery 悬停或键盘聚焦状态；
- 移动菜单打开状态；
- 升级弹窗打开状态。

Expected: 页面无横向溢出、图片均已加载、按钮和弹窗可操作。

- [ ] **Step 3: 建立同画布视觉对比**

将以下源图与实现截图放在同一张比较画布中，而不是分别凭记忆判断：

```text
Source:
docs/superpowers/specs/assets/huijing-ai-dark-light-reference.png

Implementation:
desktop full-page screenshot
mobile full-page screenshot
```

保存为：

```text
.design-qa/reference-and-desktop.png
.design-qa/reference-and-mobile.png
```

- [ ] **Step 4: 执行 Product Design design-qa**

读取 `design-qa` skill 与 QA rubric，检查：

- 字体与标题换行；
- 章节比例、留白和纵向节奏；
- 黑阶、冷光、细线和透明度；
- 图片主题、裁切、锐度和统一调色；
- 六屏内容与 CTA 文案；
- Gallery、移动菜单和弹窗状态；
- 桌面与移动端响应式；
- 减少动态效果偏好。

把报告写入项目根目录 `design-qa.md`，结构必须包含：

```markdown
# Design QA

- source visual truth path: docs/superpowers/specs/assets/huijing-ai-dark-light-reference.png
- implementation screenshot path: ...
- viewport: 1440x1100 and 390x844
- state: default, gallery focus, mobile menu open, upgrade dialog open
- full-view comparison evidence: .design-qa/reference-and-desktop.png
- focused region comparison evidence: ...

**Findings**
...

**Patches made since previous pass**
...

final result: blocked
```

- [ ] **Step 5: 修复全部 P0/P1/P2 并重新捕获**

每轮：

```powershell
npm test
npm run typecheck
npm run build
```

Expected: 全部 PASS。

重新捕获同尺寸截图，更新比较画布和 `design-qa.md`。重复直到没有 P0/P1/P2，最后一行必须是：

```text
final result: passed
```

- [ ] **Step 6: 最终工程验证**

Run:

```powershell
npm run verify
git status --short
```

Expected:

- lint、typecheck、test、build 全部 PASS；
- `design-qa.md` 存在且包含 `final result: passed`；
- 仅有本次工作范围内的预期修改。

- [ ] **Step 7: 提交 QA 修正**

```powershell
git add app components lib public tests design-qa.md .design-qa
git commit -m "fix: align landing page with dark light direction"
```

## Task 11：最终交付前复核

**Files:**
- Verify: all files above

- [ ] **Step 1: 使用 verification-before-completion 复核**

重新执行：

```powershell
npm run verify
Select-String -Path design-qa.md -Pattern "final result: passed"
git status --short
```

Expected: 所有命令成功，工作区干净。

- [ ] **Step 2: 使用 requesting-code-review 做最终审查**

审查范围：

- 页面是否忠实于 `huijing-ai-dark-light-reference.png`；
- 是否存在普通 SaaS 卡片语言、紫蓝霓虹或廉价渐变；
- 是否遗漏可见交互；
- 客户端组件边界是否最小；
- 是否支持键盘、移动端与减少动态效果；
- 是否存在未优化或未引用资产。

修复所有高、中优先级问题并再次运行 `npm run verify`。

- [ ] **Step 3: 保持本地预览运行并交付**

交付内容：

- 可点击本地预览 URL；
- 一句说明已实现的视觉方向与关键交互；
- `design-qa.md` 路径；
- 邀请用户通过批注提出下一轮视觉调整；
- 询问是否需要通过可用的 Product Design 分享目标发布给团队。
