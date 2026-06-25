"use client"

import { ArrowLeft, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react"
import Link from "next/link"
import { type FormEvent, useMemo, useState } from "react"
import { CinematicButton } from "@/components/cinematic/cinematic-button"

const imageTypes = ["电影海报", "人像大片", "产品摄影", "建筑场景", "概念艺术"]
const moods = ["黑色电影", "奢侈品牌广告片", "艺术杂志封面", "暗黑幻想", "冷峻未来主义"]
const aspectRatios = ["16:9", "1:1", "9:16", "4:3", "3:4"]
const qualities = ["2K", "4K"]

type GenerateState = "idle" | "loading" | "success" | "error"

type GeneratedImage = {
  imageUrl: string
  prompt: string
}

export function GenerateStudio() {
  const [subject, setSubject] = useState("一位站在雨夜高楼边缘的未来城市导演")
  const [imageType, setImageType] = useState(imageTypes[0])
  const [mood, setMood] = useState(moods[0])
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0])
  const [quality, setQuality] = useState(qualities[0])
  const [state, setState] = useState<GenerateState>("idle")
  const [error, setError] = useState("")
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null,
  )

  const buttonLabel = state === "loading" ? "正在调度镜头" : "生成图片"
  const promptPreview = useMemo(
    () =>
      [
        subject,
        `${imageType} / ${mood} / ${aspectRatio} / ${quality}`,
        "Cinematic realism, premium editorial composition, silver-white highlights, controlled negative space.",
      ].join("\n"),
    [aspectRatio, imageType, mood, quality, subject],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (subject.trim().length < 6) {
      setState("error")
      setError("主体描述再具体一点，至少写下 6 个字。")
      return
    }

    setState("loading")
    setError("")

    try {
      const response = await fetch("/api/generate-image", {
        body: JSON.stringify({
          aspectRatio,
          imageType,
          mood,
          quality,
          subject,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message ?? "生成失败，请稍后再试。")
      }

      setGeneratedImage({
        imageUrl: payload.imageUrl,
        prompt: payload.prompt,
      })
      setState("success")
    } catch (caughtError) {
      setState("error")
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "生成失败，请稍后再试。",
      )
    }
  }

  return (
    <section
      aria-labelledby="seedream-studio-title"
      className="seedream-studio"
    >
      <div className="seedream-studio__nav">
        <Link className="seedream-studio__brand" href="/">
          绘境 <span>AI</span>
        </Link>
        <div className="seedream-studio__links">
          <Link className="seedream-studio__back" href="/generate/history">
            <ClockCounterClockwise aria-hidden="true" size={18} weight="thin" />
            历史影像
          </Link>
          <Link className="seedream-studio__back" href="/">
            <ArrowLeft aria-hidden="true" size={18} weight="thin" />
            返回首页
          </Link>
        </div>
      </div>

      <div className="seedream-studio__copy">
        <p className="frame-label">FRAME 07 / SEEDREAM GENERATION STUDIO</p>
        <h1 id="seedream-studio-title">像导演一样调度</h1>
        <p>
          选择画面类型、情绪与画幅，把普通想法转译成高对比、银白高光、电影叙事感的视觉大片。
        </p>
      </div>

      <form className="seedream-console" onSubmit={handleSubmit}>
        <div className="seedream-console__panel seedream-console__panel--form">
          <label className="seedream-field">
            <span>图片类型</span>
            <select
              aria-label="图片类型"
              value={imageType}
              onChange={(event) => setImageType(event.target.value)}
            >
              {imageTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="seedream-field">
            <span>风格气质</span>
            <select
              aria-label="风格气质"
              value={mood}
              onChange={(event) => setMood(event.target.value)}
            >
              {moods.map((currentMood) => (
                <option key={currentMood}>{currentMood}</option>
              ))}
            </select>
          </label>

          <div className="seedream-console__inline">
            <label className="seedream-field">
              <span>画幅</span>
              <select
                aria-label="画幅"
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value)}
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio}>{ratio}</option>
                ))}
              </select>
            </label>

            <label className="seedream-field">
              <span>清晰度</span>
              <select
                aria-label="清晰度"
                value={quality}
                onChange={(event) => setQuality(event.target.value)}
              >
                {qualities.map((currentQuality) => (
                  <option key={currentQuality}>{currentQuality}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="seedream-field seedream-field--textarea">
            <span>主体描述</span>
            <textarea
              aria-label="主体描述"
              rows={6}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>

          <div className="seedream-console__actions">
            <CinematicButton disabled={state === "loading"} type="submit">
              <Sparkle aria-hidden="true" size={17} weight="thin" />
              {buttonLabel}
            </CinematicButton>
            <p>新用户每日赠送 5 个积分 / 每生成 1 张图片消耗 1 个积分</p>
          </div>

          {state === "error" ? (
            <p className="seedream-console__error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="seedream-console__panel seedream-console__panel--preview">
          <p className="seedream-preview__label">
            {state === "success"
              ? "FRAME OUTPUT / FINAL IMAGE"
              : "FRAME OUTPUT / WAITING FOR LIGHT"}
          </p>

          <div className="seedream-preview">
            {generatedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Doubao-Seedream-4.5 生成结果"
                src={generatedImage.imageUrl}
              />
            ) : (
              <div className="seedream-preview__empty">
                <span>NO FRAME YET</span>
                <p>让光线先抵达，再按下快门。</p>
              </div>
            )}
          </div>

          <div className="seedream-prompt">
            <p>PROMPT / PROFESSIONAL VISUAL LANGUAGE</p>
            <pre>{generatedImage?.prompt ?? promptPreview}</pre>
          </div>
        </div>
      </form>
    </section>
  )
}
