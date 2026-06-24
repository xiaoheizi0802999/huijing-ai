"use client"

import { List, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const links = [
  { href: "#gallery", label: "作品" },
  { href: "#process", label: "创作流程" },
  { href: "#membership", label: "积分与会员" },
]

export function CinematicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) {
        triggerRef.current?.focus()
      }

      return
    }

    wasOpen.current = true
    const previousOverflow = document.body.style.overflow

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)
    closeRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function closeMenu() {
    setIsOpen(false)
  }

  return (
    <header className="cinematic-header">
      <div className="cinematic-header__inner">
        <Link
          aria-label="绘境 AI 首页"
          className="cinematic-header__logo"
          href="/"
        >
          绘境 <span>AI</span>
        </Link>

        <div className="cinematic-header__desktop">
          <nav aria-label="主导航" className="cinematic-nav">
            <ul className="cinematic-nav__list">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="cinematic-header__nav-link"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            className="cinematic-header__cta"
            href="/generate"
          >
            开始创作
          </Link>
        </div>

        <button
          ref={triggerRef}
          aria-controls="mobile-site-nav"
          aria-expanded={isOpen}
          aria-label="打开导航"
          className="cinematic-header__menu-trigger"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <List aria-hidden="true" size={28} weight="thin" />
        </button>
      </div>

      {isOpen ? (
        <div
          aria-label="站点导航"
          aria-modal="true"
          className="mobile-menu"
          id="mobile-site-nav"
          role="dialog"
        >
          <div className="cinematic-header__mobile-top">
            <Link
              aria-label="绘境 AI 首页"
              className="cinematic-header__logo"
              href="/"
              onClick={closeMenu}
            >
              绘境 <span>AI</span>
            </Link>

            <button
              ref={closeRef}
              aria-label="关闭导航"
              className="cinematic-header__menu-close"
              onClick={closeMenu}
              type="button"
            >
              <X aria-hidden="true" size={28} weight="thin" />
            </button>
          </div>

          <nav
            aria-label="移动导航"
            className="cinematic-header__mobile-nav"
          >
            <ul className="cinematic-header__mobile-links">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={closeMenu}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              className="cinematic-header__mobile-cta"
              href="/generate"
              onClick={closeMenu}
            >
              开始创作
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
