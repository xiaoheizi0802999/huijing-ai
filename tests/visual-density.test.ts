import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, it } from "vitest"

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

it("keeps the landing page rhythm compact enough to match the P1 poster reference", () => {
  expect(css).toContain("--poster-section-y: clamp(72px, 9vh, 108px);")
  expect(css).toContain("--poster-section-y-tight: clamp(58px, 7vh, 88px);")
  expect(css).toContain("--poster-rule-inset: clamp(48px, 7vh, 76px);")
  expect(css).toContain("min-height: clamp(640px, 86svh, 780px);")
  expect(css).toContain("font-size: clamp(56px, 6.1vw, 96px);")
  expect(css).toContain("min-height: clamp(560px, 72svh, 680px);")
  expect(css).toContain("min-height: clamp(540px, 68svh, 660px);")
  expect(css).toContain("min-height: clamp(480px, 64svh, 620px);")
})
