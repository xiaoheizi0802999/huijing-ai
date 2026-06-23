import { expect, it } from "vitest"
import { galleryItems, processSteps } from "@/lib/landing-content"

it("keeps the five process steps in the intended order", () => {
  expect(processSteps.map(({ step }) => step)).toEqual([
    "STEP 01 / MOOD",
    "STEP 02 / SUBJECT",
    "STEP 03 / DETAILS",
    "STEP 04 / PROMPT ENGINE",
    "STEP 05 / FINAL FRAME",
  ])
})

it("provides six unique cinematic gallery sources", () => {
  const sources = galleryItems.map(({ src }) => src)

  expect(galleryItems).toHaveLength(6)
  expect(new Set(sources).size).toBe(6)
  expect(sources.every((src) => src.startsWith("/cinematic/"))).toBe(true)
})
