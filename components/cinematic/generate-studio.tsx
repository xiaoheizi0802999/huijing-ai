"use client"

import {
  ArrowLeft,
  ClockCounterClockwise,
  DownloadSimple,
  Sparkle,
} from "@phosphor-icons/react"
import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { CinematicButton } from "@/components/cinematic/cinematic-button"
import { downloadImage } from "@/lib/image-download"
import {
  defaultSeedreamColorPalette,
  type SeedreamColorPalette,
  seedreamColorPalettes,
} from "@/lib/seedream"
import {
  formatSupabaseAuthError,
  isSupabaseEmailRateLimit,
} from "@/lib/supabase/auth-errors"
import { parseSupabaseAuthUrl } from "@/lib/supabase/auth-url"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const imageTypes = ["电影海报", "人像大片", "产品摄影", "建筑场景", "概念艺术"]
const moods = ["黑色电影", "奢侈品牌广告片", "艺术杂志封面", "暗黑幻想", "冷峻未来主义"]
const aspectRatios = ["16:9", "1:1", "9:16", "4:3", "3:4"]
const qualities = ["2K", "4K"]
const emailLinkCooldownSeconds = 60

function isSeedreamColorPalette(value: string): value is SeedreamColorPalette {
  return seedreamColorPalettes.includes(value as SeedreamColorPalette)
}

type GenerateState = "idle" | "loading" | "success" | "error"

type GeneratedImage = {
  imageUrl: string
  prompt: string
}

type GenerateResponsePayload = Partial<GeneratedImage> & {
  credits?: number
  generationId?: string
  message?: string
}

type AccountState = "checking" | "guest" | "signed-in" | "unavailable"

type SupabaseSession = {
  access_token?: string
  user?: {
    email?: string | null
    id?: string | null
  }
} | null

type SessionResponsePayload = {
  credits?: number
  granted?: number
  message?: string
  user?: {
    email?: string | null
    id?: string
  }
}

async function readGenerateResponse(response: Response) {
  try {
    return (await response.json()) as GenerateResponsePayload
  } catch {
    return null
  }
}

function readAuthErrorMessage(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : "请稍后再试"
}

export function GenerateStudio() {
  const supabaseClient = useMemo(() => createSupabaseBrowserClient(), [])
  const [subject, setSubject] = useState("一位站在雨夜高楼边缘的未来城市导演")
  const [imageType, setImageType] = useState(imageTypes[0])
  const [mood, setMood] = useState(moods[0])
  const [colorPalette, setColorPalette] = useState(defaultSeedreamColorPalette)
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0])
  const [quality, setQuality] = useState(qualities[0])
  const [accountState, setAccountState] = useState<AccountState>("checking")
  const [accountEmail, setAccountEmail] = useState("")
  const [authMessage, setAuthMessage] = useState("")
  const [credits, setCredits] = useState<number | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginCode, setLoginCode] = useState("")
  const [loginLink, setLoginLink] = useState("")
  const [loginLinkStatus, setLoginLinkStatus] = useState<"idle" | "sending">(
    "idle",
  )
  const [loginLinkCooldown, setLoginLinkCooldown] = useState(0)
  const [session, setSession] = useState<SupabaseSession>(null)
  const [state, setState] = useState<GenerateState>("idle")
  const [error, setError] = useState("")
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null,
  )

  const buttonLabel = state === "loading" ? "正在调度镜头" : "生成图片"
  const isSignedIn = accountState === "signed-in"
  const isLoginLinkSending = loginLinkStatus === "sending"
  const isLoginLinkLocked = isLoginLinkSending || loginLinkCooldown > 0
  const loginLinkButtonLabel = isLoginLinkSending
    ? "发送中"
    : loginLinkCooldown > 0
      ? `${loginLinkCooldown} 秒后重试`
      : "发送登录链接"
  const promptPreview = useMemo(
    () =>
      [
        subject,
        `${imageType} / ${mood} / ${colorPalette} / ${aspectRatio} / ${quality}`,
        "Cinematic realism, premium editorial composition, strong contrast, refined color discipline, controlled negative space.",
      ].join("\n"),
    [aspectRatio, colorPalette, imageType, mood, quality, subject],
  )

  async function readSessionResponse(response: Response) {
    try {
      return (await response.json()) as SessionResponsePayload
    } catch {
      return null
    }
  }

  async function refreshAccount(nextSession?: SupabaseSession) {
    if (!supabaseClient) {
      setAccountState("unavailable")
      return
    }

    const currentSession =
      nextSession === undefined
        ? ((await supabaseClient.auth.getSession()).data
            .session as SupabaseSession)
        : nextSession

    setSession(currentSession)

    if (!currentSession?.access_token) {
      setAccountEmail("")
      setCredits(null)
      setAccountState("guest")
      return
    }

    const response = await fetch("/api/auth/session", {
      headers: {
        authorization: `Bearer ${currentSession.access_token}`,
      },
    })
    const payload = await readSessionResponse(response)

    if (!response.ok) {
      setAccountEmail(currentSession.user?.email ?? "")
      setCredits(null)
      setAccountState("guest")
      setAuthMessage(payload?.message ?? "登录状态已失效，请重新登录。")
      return
    }

    setAccountEmail(
      payload?.user?.email ?? currentSession.user?.email ?? "已登录账户",
    )
    setCredits(typeof payload?.credits === "number" ? payload.credits : null)
    setAccountState("signed-in")
    setAuthMessage(
      payload?.granted && payload.granted > 0
        ? `今日已补充 ${payload.granted} 个积分。`
        : "",
    )
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
          setAccountState("unavailable")
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

      void refreshAccount(data.session as SupabaseSession)
    })

    const { data } = supabaseClient.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) {
          return
        }

        void refreshAccount(nextSession as SupabaseSession)
      },
    )

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseClient])

  async function getAccessToken() {
    if (!supabaseClient) {
      return null
    }

    const currentSession =
      session ??
      ((await supabaseClient.auth.getSession()).data.session as SupabaseSession)

    return currentSession?.access_token ?? null
  }

  async function handleSendLoginLink() {
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
      const { error: signInError } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/generate`,
        },
      })

      if (signInError && isSupabaseEmailRateLimit(signInError.message)) {
        setLoginLinkCooldown(emailLinkCooldownSeconds)
      }

      setAuthMessage(
        signInError
          ? `登录链接发送失败：${formatSupabaseAuthError(signInError.message)}`
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

    const { data, error: verifyError } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (verifyError) {
      setAuthMessage(verifyError.message)
      return
    }

    setLoginCode("")
    setAuthMessage("登录成功，正在同步创作权限。")
    await refreshAccount(data.session as SupabaseSession)
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
      const { data, error: sessionError } = await supabaseClient.auth.setSession({
        access_token: authParams.accessToken,
        refresh_token: authParams.refreshToken,
      })

      if (sessionError) {
        setAuthMessage(sessionError.message)
        return
      }

      setLoginLink("")
      setAuthMessage("登录成功，正在同步创作权限。")
      await refreshAccount(data.session as SupabaseSession)
      return
    }

    if (authParams.code) {
      const { data, error: codeError } =
        await supabaseClient.auth.exchangeCodeForSession(authParams.code)

      if (codeError) {
        setAuthMessage(codeError.message)
        return
      }

      setLoginLink("")
      setAuthMessage("登录成功，正在同步创作权限。")
      await refreshAccount(data.session as SupabaseSession)
      return
    }

    if (authParams.tokenHash) {
      const { data, error: tokenHashError } = await supabaseClient.auth.verifyOtp({
        token_hash: authParams.tokenHash,
        type: authParams.type === "magiclink" ? "magiclink" : "email",
      })

      if (tokenHashError) {
        setAuthMessage(tokenHashError.message)
        return
      }

      setLoginLink("")
      setAuthMessage("登录成功，正在同步创作权限。")
      await refreshAccount(data.session as SupabaseSession)
      return
    }

    if (/^https?:\/\//i.test(pastedLink)) {
      setAuthMessage("正在用当前浏览器打开登录链接。")
      window.location.assign(pastedLink)
      return
    }

    setAuthMessage("没有识别到可用的登录信息，请重新复制完整链接。")
  }

  async function handleSignOut() {
    if (!supabaseClient) {
      return
    }

    await supabaseClient.auth.signOut()
    setSession(null)
    setAccountEmail("")
    setCredits(null)
    setAccountState("guest")
    setAuthMessage("已退出登录，请重新登录后继续创作。")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isSignedIn) {
      setState("error")
      setError("请先登录后再生成图片。")
      return
    }

    if (subject.trim().length < 6) {
      setState("error")
      setError("主体描述再具体一点，至少写下 6 个字。")
      return
    }

    setState("loading")
    setError("")

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error("请先登录后再生成图片。")
      }

      const headers: Record<string, string> = {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      }

      const response = await fetch("/api/generate-image", {
        body: JSON.stringify({
          aspectRatio,
          colorPalette,
          imageType,
          mood,
          quality,
          subject,
        }),
        headers,
        method: "POST",
      })
      const payload = await readGenerateResponse(response)

      if (!response.ok) {
        throw new Error(
          payload?.message ?? "生成失败，服务暂时没有返回可读信息，请稍后再试。",
        )
      }

      if (!payload?.imageUrl || !payload.prompt) {
        throw new Error("生成失败，服务暂时没有返回图片，请稍后再试。")
      }

      setGeneratedImage({
        imageUrl: payload.imageUrl,
        prompt: payload.prompt,
      })

      if (typeof payload.credits === "number") {
        setCredits(payload.credits)
      }

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

  async function handleDownloadGeneratedImage() {
    if (!generatedImage) {
      return
    }

    await downloadImage(generatedImage.imageUrl, subject.trim())
  }

  function renderAccountCard() {
    const accountLabel =
      accountState === "signed-in" && credits !== null
        ? `剩余 ${credits} 积分`
        : accountState === "checking"
          ? "同步账户中"
          : accountState === "unavailable"
            ? "登录未连接"
            : "等待登录"
    const message =
      authMessage ||
      (isSignedIn
        ? "登录后启用云端积分与历史影像。"
        : "登录后才可以使用生图与云端历史。")

    return (
      <div className="seedream-account">
        <div className="seedream-account__header">
          <span>ACCOUNT / CREATIVE CREDITS</span>
          <strong>{accountLabel}</strong>
        </div>

        {isSignedIn ? (
          <div className="seedream-account__identity">
            <p>{accountEmail}</p>
            <button onClick={() => void handleSignOut()} type="button">
              退出登录
            </button>
          </div>
        ) : accountState === "checking" ? (
          <div className="seedream-account__notice">
            正在确认登录状态，请稍候。
          </div>
        ) : supabaseClient ? (
          <div className="seedream-account__stack">
            <div className="seedream-account__login">
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
              <button
                disabled={isLoginLinkLocked}
                onClick={() => void handleSendLoginLink()}
                type="button"
              >
                {loginLinkButtonLabel}
              </button>
            </div>

            <div className="seedream-account__login seedream-account__login--secondary">
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
            </div>

            <div className="seedream-account__login seedream-account__login--link">
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
            </div>

            <span className="seedream-account__hint">
              如果链接在邮件预览页打开，请复制完整链接粘贴到这里，原页面会接住登录态。
            </span>
          </div>
        ) : (
          <div className="seedream-account__notice">
            登录功能尚未连接，请先完成 Supabase 配置。
          </div>
        )}

        <p>{message}</p>
      </div>
    )
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

      {!isSignedIn ? (
        <div className="seedream-console seedream-console--locked">
          <div className="seedream-console__panel seedream-console__panel--form seedream-console__panel--auth">
            {renderAccountCard()}
            <div className="seedream-auth-note">
              <p>ACCESS CONTROL / CREATIVE WORKSPACE</p>
              <h2>登录后进入影像工作台</h2>
              <span>
                你的积分、生成记录与下载入口都会保存在账号下。未登录状态不会开放生图功能。
              </span>
            </div>
          </div>

          <div className="seedream-console__panel seedream-console__panel--preview">
            <p className="seedream-preview__label">
              FRAME OUTPUT / LOGIN TO ROLL CAMERA
            </p>
            <div className="seedream-preview seedream-preview--locked">
              <div className="seedream-preview__empty">
                <span>LOCKED FRAME</span>
                <p>先完成登录，再让光线抵达画面。</p>
              </div>
            </div>
            <div className="seedream-prompt">
              <p>PROMPT / PROFESSIONAL VISUAL LANGUAGE</p>
              <pre>{promptPreview}</pre>
            </div>
          </div>
        </div>
      ) : null}

      {isSignedIn ? (
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

          {renderAccountCard()}

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

          <label className="seedream-field">
            <span>色彩与光线</span>
            <select
              aria-label="色彩与光线"
              value={colorPalette}
              onChange={(event) => {
                const nextPalette = event.target.value
                if (isSeedreamColorPalette(nextPalette)) {
                  setColorPalette(nextPalette)
                }
              }}
            >
              {seedreamColorPalettes.map((currentPalette) => (
                <option key={currentPalette}>{currentPalette}</option>
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
                alt="AI 生成结果"
                src={generatedImage.imageUrl}
              />
            ) : (
              <div className="seedream-preview__empty">
                <span>NO FRAME YET</span>
                <p>让光线先抵达，再按下快门。</p>
              </div>
            )}
          </div>

          {generatedImage ? (
            <div className="seedream-preview__actions">
              <CinematicButton
                onClick={() => void handleDownloadGeneratedImage()}
                variant="outline"
              >
                <DownloadSimple aria-hidden="true" size={17} weight="thin" />
                下载图片
              </CinematicButton>
            </div>
          ) : null}

          <div className="seedream-prompt">
            <p>PROMPT / PROFESSIONAL VISUAL LANGUAGE</p>
            <pre>{generatedImage?.prompt ?? promptPreview}</pre>
          </div>
        </div>
        </form>
      ) : null}
    </section>
  )
}
