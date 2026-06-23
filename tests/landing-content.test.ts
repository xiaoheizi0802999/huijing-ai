import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { expect, it } from "vitest"
import {
  cinematicAssets,
  galleryItems,
  processSteps,
} from "@/lib/landing-content"

function readWebpDimensions(buffer: Buffer) {
  let offset = 12

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const dataOffset = offset + 8

    if (dataOffset + chunkSize > buffer.length) {
      throw new Error(`Invalid ${chunkType} chunk length`)
    }

    if (chunkType === "VP8 ") {
      if (
        chunkSize < 10 ||
        buffer[dataOffset + 3] !== 0x9d ||
        buffer[dataOffset + 4] !== 0x01 ||
        buffer[dataOffset + 5] !== 0x2a
      ) {
        throw new Error("Invalid VP8 frame header")
      }

      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      }
    }

    if (chunkType === "VP8L") {
      if (chunkSize < 5 || buffer[dataOffset] !== 0x2f) {
        throw new Error("Invalid VP8L frame header")
      }

      const dimensionBits = buffer.readUInt32LE(dataOffset + 1)

      return {
        width: (dimensionBits & 0x3fff) + 1,
        height: ((dimensionBits >>> 14) & 0x3fff) + 1,
      }
    }

    if (chunkType === "VP8X") {
      if (chunkSize < 10) {
        throw new Error("Invalid VP8X frame header")
      }

      return {
        width: buffer.readUIntLE(dataOffset + 4, 3) + 1,
        height: buffer.readUIntLE(dataOffset + 7, 3) + 1,
      }
    }

    offset = dataOffset + chunkSize + (chunkSize % 2)
  }

  throw new Error("WebP image chunk not found")
}

it("registers the exact cinematic asset contract", () => {
  expect(Object.keys(cinematicAssets)).toEqual([
    "hero",
    "capabilityStage",
    "processProjector",
    "portrait",
    "product",
    "fantasy",
    "fashion",
    "architecture",
    "car",
    "membershipChair",
    "finalLight",
  ])

  expect(
    Object.fromEntries(
      Object.entries(cinematicAssets).map(([key, asset]) => [
        key,
        [asset.width, asset.height],
      ]),
    ),
  ).toEqual({
    hero: [1536, 1024],
    capabilityStage: [1536, 1024],
    processProjector: [1024, 1536],
    portrait: [1024, 1536],
    product: [1536, 1024],
    fantasy: [1024, 1536],
    fashion: [1024, 1536],
    architecture: [1536, 1024],
    car: [1536, 1024],
    membershipChair: [1536, 1024],
    finalLight: [1536, 1024],
  })

  const sources = Object.values(cinematicAssets).map(({ src }) => src)

  expect(new Set(sources).size).toBe(11)
  for (const asset of Object.values(cinematicAssets)) {
    expect(Object.keys(asset)).toEqual([
      "src",
      "alt",
      "width",
      "height",
      "focalPoint",
    ])
    expect(asset.src).toMatch(/^\/cinematic\/.+\.webp$/)
    expect(typeof asset.alt).toBe("string")
    expect(asset.width).toBeGreaterThan(0)
    expect(asset.height).toBeGreaterThan(0)
    expect(asset.focalPoint).toMatch(/^\d+% \d+%$/)
  }
})

it("matches every registered asset to a real WebP file and its dimensions", () => {
  for (const asset of Object.values(cinematicAssets)) {
    const filePath = path.join(
      process.cwd(),
      "public",
      asset.src.replace(/^\//, ""),
    )

    expect(existsSync(filePath)).toBe(true)

    const buffer = readFileSync(filePath)

    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.toString("ascii", 0, 4)).toBe("RIFF")
    expect(buffer.toString("ascii", 8, 12)).toBe("WEBP")
    expect(readWebpDimensions(buffer)).toEqual({
      width: asset.width,
      height: asset.height,
    })
  }
})

it("keeps the five process steps and asset mappings in the intended order", () => {
  expect(
    processSteps.map(({ step, title, asset }) => ({ step, title, asset })),
  ).toEqual([
    { step: "STEP 01 / MOOD", title: "选择风格", asset: "architecture" },
    { step: "STEP 02 / SUBJECT", title: "输入主体", asset: "portrait" },
    { step: "STEP 03 / DETAILS", title: "补充细节", asset: "fashion" },
    {
      step: "STEP 04 / PROMPT ENGINE",
      title: "AI 优化提示词",
      asset: "product",
    },
    {
      step: "STEP 05 / FINAL FRAME",
      title: "生成高清图片",
      asset: "fantasy",
    },
  ])

  for (const step of processSteps) {
    expect(step.image).toBe(cinematicAssets[step.asset].src)
  }
})

it("derives each gallery source and alt from its registered asset", () => {
  expect(
    galleryItems.map(({ slug, asset }) => ({ slug, asset })),
  ).toEqual([
    { slug: "portrait", asset: "portrait" },
    { slug: "product", asset: "product" },
    { slug: "fantasy", asset: "fantasy" },
    { slug: "fashion", asset: "fashion" },
    { slug: "architecture", asset: "architecture" },
    { slug: "car", asset: "car" },
  ])

  expect(galleryItems).toHaveLength(6)
  for (const item of galleryItems) {
    expect(item.src).toBe(cinematicAssets[item.asset].src)
    expect(item.alt).toBe(cinematicAssets[item.asset].alt)
  }
})
