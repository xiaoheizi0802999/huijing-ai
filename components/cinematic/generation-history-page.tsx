"use client"

import {
  ArrowLeft,
  ClockCounterClockwise,
  DownloadSimple,
  ImageSquare,
  Trash,
} from "@phosphor-icons/react"
import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { downloadImage } from "@/lib/image-download"
import {
  type GenerationHistoryItem,
  generationHistoryStorageKey,
} from "@/lib/generation-history"
import {
  formatSupabaseAuthError,
  isSupabaseEmailRateLimit,
} from "@/lib/supabase/auth-errors"
import { parseSupabaseAuthUrl } from "@/lib/supabase/auth-url"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import styles from "./generation-history-page.module.css"

export { generationHistoryStorageKey }

type SupabaseSession = {
  access_token?: string
  user?: {
    email?: string | null
    id?: string | null
  }
} | null

type CloudHistoryResponse = {
  history?: GenerationHistoryItem[]
  message?: string
}

type HistorySource = "checking" | "cloud" | "locked" | "unavailable" | "error"
const emailLinkCooldownSeconds = 60

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

function readAuthErrorMessage(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : "请稍后再试"
}

export function GenerationHistoryPage() {
  const supabaseClient = useMemo(() => createSupabaseBrowserClient(), [])
  const [cloudHistory, setCloudHistory] = useState<GenerationHistoryItem[]>([])
  const [cloudMessage, setCloudMessage] = useState("")
  const [historySource, setHistorySource] =
    useState<HistorySource>("checking")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginCode, setLoginCode] = useState("")
  const [loginLink, setLoginLink] = useState("")
  const [loginLinkStatus, setLoginLinkStatus] = useState<"idle" | "sending">(
    "idle",
  )
  const [loginLinkCooldown, setLoginLinkCooldown] = useState(0)
  const [authMessage, setAuthMessage] = useState("")
  const [session, setSession] = useState<SupabaseSession>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const history = cloudHistory

  const selectedFrame = useMemo(
    () => history.find((item) => item.id === selectedId) ?? history[0] ?? null,
    [history, selectedId],
  )
  const isLoginLinkSending = loginLinkStatus === "sending"
  const isLoginLinkLocked = isLoginLinkSending || loginLinkCooldown > 0
  const loginLinkButtonLabel = isLoginLinkSending
    ? "发送中"
    : loginLinkCooldown > 0
      ? `${loginLinkCooldown} 秒后重试`
      : "发送登录链接"

  async function readCloudHistoryResponse(response: Response) {
    try {
      return (await response.json()) as CloudHistoryResponse
    } catch {
      return null
    }
  }

  async function loadCloudHistory(nextSession: SupabaseSession) {
    setSession(nextSession)

    if (!nextSession?.access_token) {
      setCloudHistory([])
      setHistorySource("locked")
      setCloudMessage("登录后才可以查看云端历史影像。")
      return
    }

    const response = await fetch("/api/generation-history", {
      headers: {
        authorization: `Bearer ${nextSession.access_token}`,
      },
    })
    const payload = await readCloudHistoryResponse(response)

    if (!response.ok) {
      setCloudHistory([])
      setSelectedId(null)
      setCloudMessage(payload?.message ?? "云端历史暂时不可用，请稍后再试。")
      setHistorySource(response.status === 401 ? "locked" : "error")
      return
    }

    setCloudHistory(payload?.history ?? [])
    setHistorySource("cloud")
    setCloudMessage("CLOUD ARCHIVE")
    setSelectedId(null)
  }

  useEffect(() => {
    if (loginLinkCooldown <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setLoginLinkCooldown((currentCooldown) => Math.max(0, currentCooldown - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [loginLinkCooldown])

  useEffect(() => {
    if (!supabaseClient) {
      let mounted = true

      queueMicrotask(() => {
        if (mounted) {
          setHistorySource("unavailable")
          setCloudMessage("登录功能尚未连接，请检查 Supabase 环境变量。")
        }
      })

      return () => {
        mounted = false
      }
    }

    let mounted = true

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return
      }

      void loadCloudHistory(data.session as SupabaseSession)
    })

    const { data } = supabaseClient.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) {
          return
        }

        void loadCloudHistory(nextSession as SupabaseSession)
      },
    )

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseClient])

  async function handleSendLoginLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabaseClient) {
      setAuthMessage("登录功能尚未连接，请检查 Supabase 环境变量。")
      return
    }

    if (isLoginLinkLocked) {
      return
    }

    const email = loginEmail.trim()

    if (!email.includes("@")) {
      setAuthMessage("请填写可接收登录链接的邮箱。")
      return
    }

    setAuthMessage("正在发送登录链接，请稍候。")
    setLoginLinkStatus("sending")

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/generate/history`,
        },
      })

      if (error && isSupabaseEmailRateLimit(error.message)) {
        setLoginLinkCooldown(emailLinkCooldownSeconds)
      }

      setAuthMessage(
        error
          ? `登录链接发送失败：${formatSupabaseAuthError(error.message)}`
          : "登录链接已发送，请查看邮箱。",
      )
    } catch (caughtError) {
      const errorMessage = readAuthErrorMessage(caughtError)

      if (isSupabaseEmailRateLimit(errorMessage)) {
        setLoginLinkCooldown(emailLinkCooldownSeconds)
      }

      setAuthMessage(
        `登录链接发送失败：${formatSupabaseAuthError(errorMessage)}`,
      )
    } finally {
      setLoginLinkStatus("idle")
    }
  }

  async function handleVerifyLoginCode() {
    if (!supabaseClient) {
      setAuthMessage("登录功能尚未连接，请检查 Supabase 环境变量。")
      return
    }

    const email = loginEmail.trim()
    const token = loginCode.replace(/\s+/g, "")

    if (!email.includes("@")) {
      setAuthMessage("请先填写接收验证码的邮箱。")
      return
    }

    if (token.length < 4) {
      setAuthMessage("请填写邮件中的验证码。")
      return
    }

    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setLoginCode("")
    setAuthMessage("登录成功，正在同步历史影像。")
    await loadCloudHistory(data.session as SupabaseSession)
  }

  async function handleCompleteLoginFromLink() {
    if (!supabaseClient) {
      setAuthMessage("登录功能尚未连接，请检查 Supabase 环境变量。")
      return
    }

    const pastedLink = loginLink.trim()
    const authParams = parseSupabaseAuthUrl(pastedLink)

    if (!authParams) {
      setAuthMessage("请粘贴邮件中的完整登录链接。")
      return
    }

    if (authParams.accessToken && authParams.refreshToken) {
      const { data, error } = await supabaseClient.auth.setSession({
        access_token: authParams.accessToken,
        refresh_token: authParams.refreshToken,
      })

      if (error) {
        setAuthMessage(error.message)
        return
      }

      setLoginLink("")
      setAuthMessage("登录成功，正在同步历史影像。")
      await loadCloudHistory(data.session as SupabaseSession)
      return
    }

    if (authParams.code) {
      const { data, error } =
        await supabaseClient.auth.exchangeCodeForSession(authParams.code)

      if (error) {
        setAuthMessage(error.message)
        return
      }

      setLoginLink("")
      setAuthMessage("登录成功，正在同步历史影像。")
      await loadCloudHistory(data.session as SupabaseSession)
      return
    }

    if (authParams.tokenHash) {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        token_hash: authParams.tokenHash,
        type: authParams.type === "magiclink" ? "magiclink" : "email",
      })

      if (error) {
        setAuthMessage(error.message)
        return
      }

      setLoginLink("")
      setAuthMessage("登录成功，正在同步历史影像。")
      await loadCloudHistory(data.session as SupabaseSession)
      return
    }

    if (/^https?:\/\//i.test(pastedLink)) {
      setAuthMessage("正在用当前浏览器打开登录链接。")
      window.location.assign(pastedLink)
      return
    }

    setAuthMessage("没有识别到可用的登录信息，请重新复制完整链接。")
  }

  async function handleDownloadSelectedFrame() {
    if (!selectedFrame) {
      return
    }

    await downloadImage(
      selectedFrame.imageUrl,
      selectedFrame.subject,
      selectedFrame.createdAt,
    )
  }

  function handleDeleteSelectedFrame() {
    if (!selectedFrame || !session?.access_token) {
      return
    }

    void fetch(`/api/generation-history/${selectedFrame.id}`, {
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
      method: "DELETE",
    }).then(async (response) => {
      if (!response.ok) {
        setCloudMessage("云端记录暂时无法删除，请稍后再试。")
        return
      }

      setCloudHistory((currentHistory) =>
        currentHistory.filter((item) => item.id !== selectedFrame.id),
      )
      setSelectedId(null)
    })
  }

  const frameLabel =
    historySource === "cloud"
      ? "FRAME ARCHIVE / CLOUD HISTORY"
      : historySource === "checking"
        ? "FRAME ARCHIVE / SYNCING ACCOUNT"
        : "FRAME ARCHIVE / LOGIN REQUIRED"
  const heroDescription =
    historySource === "cloud"
      ? "登录后，每一次生成都会进入云端影像档案。这里保持安静，只展示作品、参数与提示词。"
      : "历史影像属于你的账号。登录后，生成记录、下载与删除能力都会以云端档案的方式保留。"

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
        <p className="frame-label">{frameLabel}</p>
        <h1 id="generation-history-title">历史影像档案</h1>
        <p>{heroDescription}</p>
      </header>

      {historySource === "cloud" ? (
        <div className={styles.stage}>
          <aside className={styles.archivePanel} aria-label="历史作品列表">
            <div className={styles.archiveHeader}>
              <span>CLOUD ARCHIVE</span>
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
                <p>{cloudMessage || "生成第一张图片后，云端历史会出现在这里。"}</p>
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
                  <div className={styles.frameActions}>
                    <button
                      className={styles.frameAction}
                      onClick={() => void handleDownloadSelectedFrame()}
                      type="button"
                    >
                      <DownloadSimple
                        aria-hidden="true"
                        size={17}
                        weight="thin"
                      />
                      下载图片
                    </button>
                    <button
                      className={`${styles.frameAction} ${styles.frameActionDanger}`}
                      onClick={handleDeleteSelectedFrame}
                      type="button"
                    >
                      <Trash aria-hidden="true" size={17} weight="thin" />
                      删除记录
                    </button>
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
      ) : (
        <div className={styles.authStage}>
          <div className={styles.authPanel}>
            <div className={styles.archiveHeader}>
              <span>ACCOUNT / ARCHIVE ACCESS</span>
              <strong>
                {historySource === "checking" ? "同步账户中" : "登录后查看"}
              </strong>
            </div>

            {historySource === "checking" ? (
              <div className={styles.authNotice}>正在确认登录状态，请稍候。</div>
            ) : supabaseClient ? (
              <form className={styles.authForm} onSubmit={handleSendLoginLink}>
                <label>
                  <span>登录邮箱</span>
                  <input
                    aria-label="登录邮箱"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="director@example.com"
                  />
                </label>
                <button disabled={isLoginLinkLocked} type="submit">
                  {loginLinkButtonLabel}
                </button>

                <label>
                  <span>邮箱验证码</span>
                  <input
                    aria-label="邮箱验证码"
                    inputMode="numeric"
                    value={loginCode}
                    onChange={(event) => setLoginCode(event.target.value)}
                    placeholder="000000"
                  />
                </label>
                <button onClick={() => void handleVerifyLoginCode()} type="button">
                  验证登录码
                </button>

                <label>
                  <span>登录链接回填</span>
                  <textarea
                    aria-label="登录链接回填"
                    value={loginLink}
                    onChange={(event) => setLoginLink(event.target.value)}
                    placeholder="https://...#access_token=token&refresh_token=token"
                    rows={2}
                  />
                </label>
                <button
                  onClick={() => void handleCompleteLoginFromLink()}
                  type="button"
                >
                  使用登录链接
                </button>

                <span className={styles.authHint}>
                  如果链接在邮件预览页打开，请复制完整链接粘贴到这里。
                </span>
              </form>
            ) : (
              <div className={styles.authNotice}>
                登录功能尚未连接，请先完成 Supabase 配置。
              </div>
            )}

            <p>
              {authMessage || cloudMessage || "登录后才可以查看云端历史影像。"}
            </p>
          </div>

          <article className={styles.previewPanel}>
            <div className={styles.emptyPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                aria-hidden="true"
                src="/cinematic/hero-screen.webp"
              />
              <div>
                <ImageSquare aria-hidden="true" size={34} weight="thin" />
                <p>LOCKED ARCHIVE</p>
                <h2>登录后调取影像底片</h2>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
