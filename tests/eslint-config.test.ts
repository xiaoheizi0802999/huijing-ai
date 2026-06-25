import { expect, it } from "vitest"

it("ignores generated and worktree directories during lint", async () => {
  const eslintConfig = (await import("../eslint.config.mjs")).default
  const ignoredPatterns = eslintConfig.flatMap((entry) => entry.ignores ?? [])

  expect(ignoredPatterns).toContain(".next/**")
  expect(ignoredPatterns).toContain(".worktrees/**")
  expect(ignoredPatterns).toContain("node_modules/**")
})
