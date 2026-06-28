"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

export const introSeenStorageKey = "huijing-ai:intro-seen:v1"

const introPlayDurationMs = 3600
const introExitDurationMs = 1150
const introSettleDurationMs = 720
const forceIntroReplay =
  process.env.NEXT_PUBLIC_FORCE_INTRO_REPLAY === "true"
type IntroStatus = "playing" | "exiting" | "settling" | "hidden"

function shouldReplayIntro() {
  if (forceIntroReplay) {
    return true
  }

  if (typeof window === "undefined") {
    return false
  }

  try {
    const searchParams = new URLSearchParams(window.location.search)

    return (
      searchParams.get("intro") === "1" ||
      searchParams.get("replayIntro") === "1"
    )
  } catch {
    return false
  }
}

function hasSeenIntro() {
  if (typeof window === "undefined" || shouldReplayIntro()) {
    return false
  }

  try {
    return window.localStorage.getItem(introSeenStorageKey) === "true"
  } catch {
    return false
  }
}

function rememberIntro() {
  if (typeof window === "undefined" || forceIntroReplay) {
    return
  }

  try {
    window.localStorage.setItem(introSeenStorageKey, "true")
  } catch {
    // If storage is unavailable, the intro simply behaves as a session moment.
  }
}

export function IntroSequence() {
  const [status, setStatus] = useState<IntroStatus>("playing")
  const timeoutRef = useRef<number | null>(null)
  const exitTimeoutRef = useRef<number | null>(null)
  const settleTimeoutRef = useRef<number | null>(null)
  const previousOverflowRef = useRef<string | null>(null)

  const clearIntroTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }

    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current)
      settleTimeoutRef.current = null
    }
  }, [])

  const hideIntro = useCallback(() => {
    clearIntroTimers()
    rememberIntro()
    setStatus("hidden")
  }, [clearIntroTimers])

  const beginIntroExit = useCallback(() => {
    if (exitTimeoutRef.current !== null) {
      return
    }

    rememberIntro()
    setStatus("exiting")
    exitTimeoutRef.current = window.setTimeout(() => {
      setStatus("settling")
      exitTimeoutRef.current = null
      settleTimeoutRef.current = window.setTimeout(() => {
        setStatus("hidden")
        settleTimeoutRef.current = null
      }, introSettleDurationMs)
    }, introExitDurationMs)
  }, [])

  useEffect(() => {
    return () => {
      clearIntroTimers()

      document.body.classList.remove("huijing-intro-active")
      document.body.classList.remove("huijing-intro-exiting")

      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current
        previousOverflowRef.current = null
      }
    }
  }, [clearIntroTimers])

  useEffect(() => {
    if (status === "hidden") {
      document.body.classList.remove("huijing-intro-active")
      document.body.classList.remove("huijing-intro-exiting")

      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current
        previousOverflowRef.current = null
      }

      return
    }

    if (previousOverflowRef.current === null) {
      previousOverflowRef.current = document.body.style.overflow
    }

    document.body.style.overflow = "hidden"
    document.body.classList.add("huijing-intro-active")
    document.body.classList.toggle(
      "huijing-intro-exiting",
      status === "exiting" || status === "settling",
    )
  }, [status])

  useEffect(() => {
    if (status !== "playing" || !hasSeenIntro()) {
      return
    }

    const replayGuard = window.setTimeout(() => {
      setStatus("hidden")
    }, 0)

    return () => window.clearTimeout(replayGuard)
  }, [status])

  useEffect(() => {
    if (status !== "playing") {
      return
    }

    timeoutRef.current = window.setTimeout(
      beginIntroExit,
      introPlayDurationMs,
    )

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [beginIntroExit, status])

  if (status === "hidden") {
    return null
  }

  const isRevealing = status === "exiting" || status === "settling"

  return (
    <motion.div
      aria-label="绘境 AI 电影片头"
      className={`intro-sequence intro-sequence--${status}`}
      initial={{ opacity: 1 }}
      role="presentation"
    >
      <div className="intro-sequence__slider intro-sequence__slider--top">
        <div aria-hidden="true" className="intro-sequence__slider-grain" />
        <div
          aria-hidden="true"
          className="intro-sequence__slider-fog intro-sequence__slider-fog--top"
        />
        <div
          aria-hidden="true"
          className="intro-sequence__slider-spotlight intro-sequence__slider-spotlight--top"
        />
        <motion.div
          className="intro-sequence__brand intro-sequence__brand--top"
          initial={{
            opacity: 0,
            filter: "blur(18px)",
            y: 18,
            letterSpacing: "0.08em",
          }}
          animate={
            isRevealing
              ? {
                  opacity: 0,
                  filter: "blur(10px)",
                  y: -42,
                  letterSpacing: "0.24em",
                }
              : {
                  opacity: [0, 0, 1, 1],
                  filter: [
                    "blur(18px)",
                    "blur(18px)",
                    "blur(0px)",
                    "blur(0px)",
                  ],
                  y: [18, 18, 0, 0],
                  letterSpacing: [
                    "0.08em",
                    "0.08em",
                    "0.16em",
                    "0.18em",
                  ],
                }
          }
          transition={
            isRevealing
              ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              : {
                  duration: 3.45,
                  times: [0, 0.22, 0.55, 1],
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <p>绘境 AI</p>
        </motion.div>
      </div>

      <div className="intro-sequence__slider intro-sequence__slider--bottom">
        <div aria-hidden="true" className="intro-sequence__slider-grain" />
        <div
          aria-hidden="true"
          className="intro-sequence__slider-fog intro-sequence__slider-fog--bottom"
        />
        <div
          aria-hidden="true"
          className="intro-sequence__slider-spotlight intro-sequence__slider-spotlight--bottom"
        />
        <motion.div
          className="intro-sequence__brand intro-sequence__brand--bottom"
          initial={{
            opacity: 0,
            filter: "blur(12px)",
            y: -10,
            letterSpacing: "0.18em",
          }}
          animate={
            isRevealing
              ? {
                  opacity: 0,
                  filter: "blur(8px)",
                  y: 30,
                  letterSpacing: "0.32em",
                }
              : {
                  opacity: [0, 0, 0.78, 0.78],
                  filter: [
                    "blur(12px)",
                    "blur(12px)",
                    "blur(0px)",
                    "blur(0px)",
                  ],
                  y: [-10, -10, 0, 0],
                  letterSpacing: [
                    "0.18em",
                    "0.18em",
                    "0.28em",
                    "0.3em",
                  ],
                }
          }
          transition={
            isRevealing
              ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              : {
                  duration: 3.45,
                  times: [0, 0.26, 0.6, 1],
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <span>VISUAL ENGINE / AI IMAGE STUDIO</span>
        </motion.div>

        {status === "playing" ? (
          <button
            className="intro-sequence__skip"
            onClick={hideIntro}
            type="button"
          >
            SKIP INTRO
          </button>
        ) : null}
      </div>

      <motion.div
        aria-hidden="true"
        className="intro-sequence__seam"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={
          isRevealing
            ? { opacity: 0, scaleX: 0.8 }
            : { opacity: [0, 0, 0.72, 0.42], scaleX: [0, 0, 1, 1.08] }
        }
        transition={
          isRevealing
            ? { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            : {
                duration: 3.6,
                times: [0, 0.52, 0.78, 1],
                ease: [0.22, 1, 0.36, 1],
              }
        }
      />
    </motion.div>
  )
}
