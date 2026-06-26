# Doubao Seedream Generate Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/generate` placeholder with a cinematic Doubao-Seedream-4.5 creation studio.

**Architecture:** Keep the homepage untouched. Add a small server API route for Ark image generation, a focused client component for the studio, and scoped CSS classes for the generate page. Tests pin API behavior and page rendering.

**Tech Stack:** Next.js App Router, React client component, native `fetch`, Vitest, Testing Library.

---

### Task 1: Seedream request core

**Files:**
- Create: `lib/seedream.ts`
- Test: `tests/seedream.test.ts`

- [ ] Write tests for prompt building, payload shape, and response parsing.
- [ ] Implement `SEEDREAM_MODEL`, `SEEDREAM_ENDPOINT`, `buildSeedreamPrompt`, `buildSeedreamPayload`, and `extractSeedreamImage`.
- [ ] Run `npm test -- tests/seedream.test.ts`.

### Task 2: API route

**Files:**
- Create: `app/api/generate-image/route.ts`
- Test: `tests/api/generate-image-route.test.ts`

- [ ] Write tests for missing `ARK_API_KEY`, invalid input, and successful provider response.
- [ ] Implement the POST route with sanitized JSON responses.
- [ ] Run `npm test -- tests/api/generate-image-route.test.ts`.

### Task 3: Cinematic generate studio

**Files:**
- Create: `components/cinematic/generate-studio.tsx`
- Modify: `app/generate/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/components/generate-studio.test.tsx`
- Test: `tests/components/page-sections.test.tsx`

- [ ] Write tests that the route renders the Seedream studio, controls, and preview state.
- [ ] Implement the client form and fetch flow.
- [ ] Add generate-page-scoped CSS only.
- [ ] Run the component tests.

### Task 4: Verify and preview

**Files:**
- Modify only if verification reveals a focused issue.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Start local preview for handoff.
