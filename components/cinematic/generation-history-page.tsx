"use client"

import {
  ArrowLeft,
  ClockCounterClockwise,
  ImageSquare,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import styles from "./generation-history-page.module.css"

export const generationHistoryStorageKey = "huijing.seedream.history.v1"

type GenerationHistoryItem = {
  id: string
  createdAt: string
  imageUrl: string
  prompt: string
  subject: string
  imageType: string
  mood: string
  aspectRatio: string
  quality: string
}

function isGenerationHistoryItem(
  value: unknown,
): value is GenerationHistoryItem {
  if (!value || typeof value !== "object") {
    return false
  }

  const item = value as Record<string, unknown>
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.imageUrl === "string" &&
    typeof item.prompt === "string" &&
    typeof item.subject === "string" &&
    typeof item.imageType === "string" &&
    typeof item.mood === "string" &&
    typeof item.aspectRatio === "string" &&
    typeof item.quality === "string"
  )
}

function parseGenerationHistory(storedHistory: string) {
  try {
    if (!storedHistory) {
      return []
    }

    const parsedHistory: unknown = JSON.parse(storedHistory)
    if (!Array.isArray(parsedHistory)) {
      return []
    }

    return parsedHistory.filter(isGenerationHistoryItem)
  } catch {
    return []
  }
}

function subscribeToGenerationHistory(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  window.addEventListener("storage", onStoreChange)
  window.addEventListener("focus", onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener("focus", onStoreChange)
  }
}

function getGenerationHistorySnapshot() {
  if (typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(generationHistoryStorageKey) ?? ""
}

function getServerGenerationHistorySnapshot() {
  return ""
}

function formatFrameDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "未记录时间"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date)
}

export function GenerationHistoryPage() {
  const historySnapshot = useSyncExternalStore(
    subscribeToGenerationHistory,
    getGenerationHistorySnapshot,
    getServerGenerationHistorySnapshot,
  )
  const history = useMemo(
    () => parseGenerationHistory(historySnapshot),
    [historySnapshot],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedFrame = useMemo(
    () => history.find((item) => item.id === selectedId) ?? history[0] ?? null,
    [history, selectedId],
  )

  return (
    <section
      aria-labelledby="generation-history-title"
      className={styles.historyPage}
    >
      <nav className={styles.nav} aria-label="历史页面导航">
        <Link className={styles.brand} href="/">
          绘境 <span>AI</span>
        </Link>
        <div className={styles.links}>
          <Link href="/generate">
            <ArrowLeft aria-hidden="true" size={17} weight="thin" />
            返回生图工作台
          </Link>
          <Link href="/">返回首页</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <p className="frame-label">FRAME ARCHIVE / LOCAL HISTORY</p>
        <h1 id="generation-history-title">历史影像档案</h1>
        <p>
          把每一次生成当作一帧可回看的电影底片。这里不会打断创作台，只负责安静地陈列已经留存的作品、参数与提示词。
        </p>
      </header>

      <div className={styles.stage}>
        <aside className={styles.archivePanel} aria-label="历史作品列表">
          <div className={styles.archiveHeader}>
            <span>FRAME COUNT</span>
            <strong>{history.length > 0 ? `共 ${history.length} 帧` : "暂无帧"}</strong>
          </div>

          {history.length > 0 ? (
            <div className={styles.reel}>
              {history.map((item, index) => (
                <button
                  aria-pressed={item.id === selectedFrame?.id}
                  className={styles.reelItem}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <span className={styles.reelIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={item.imageUrl} />
                  <span className={styles.reelCopy}>
                    <strong>{item.subject}</strong>
                    <small>
                      {item.imageType} / {item.mood}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyPanel}>
              <ClockCounterClockwise
                aria-hidden="true"
                size={30}
                weight="thin"
              />
              <h2>暂无生成记录</h2>
              <p>
                当浏览器里存在生图历史时，它会以胶片档案的方式出现在这里。
              </p>
            </div>
          )}
        </aside>

        <article className={styles.previewPanel}>
          {selectedFrame ? (
            <>
              <div className={styles.previewFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`历史作品：${selectedFrame.subject}`}
                  src={selectedFrame.imageUrl}
                />
              </div>
              <div className={styles.frameDetails}>
                <div>
                  <p>SELECTED FRAME</p>
                  <h2>{selectedFrame.subject}</h2>
                </div>
                <dl>
                  <div>
                    <dt>参数</dt>
                    <dd>
                      {selectedFrame.imageType} / {selectedFrame.mood} /{" "}
                      {selectedFrame.aspectRatio} / {selectedFrame.quality}
                    </dd>
                  </div>
                  <div>
                    <dt>时间</dt>
                    <dd>{formatFrameDate(selectedFrame.createdAt)}</dd>
                  </div>
                </dl>
                <div className={styles.promptCard}>
                  <p>PROMPT / PROFESSIONAL VISUAL LANGUAGE</p>
                  <pre>{selectedFrame.prompt}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                aria-hidden="true"
                src="/cinematic/hero-screen.webp"
              />
              <div>
                <ImageSquare aria-hidden="true" size={34} weight="thin" />
                <p>EMPTY ARCHIVE</p>
                <h2>等待第一帧被记录</h2>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
