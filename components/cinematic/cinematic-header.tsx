"use client"

import { List, UserCircle, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const links = [
  { href: "/generate", label: "创作" },
  { href: "#gallery", label: "作品" },
  { href: "#membership", label: "定价" },
  { href: "#final-cta-section", label: "帮助" },
]

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ")

export function CinematicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
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

    function getFocusableElements() {
      const menu = menuRef.current

      if (!menu) {
        return []
      }

      const focusableElements = Array.from(
        menu.querySelectorAll<HTMLElement>(focusableSelector),
      )

      if (!closeRef.current) {
        return focusableElements
      }

      return [
        closeRef.current,
        ...focusableElements.filter((element) => element !== closeRef.current),
      ]
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements()

      if (focusableElements.length === 0) {
        return
      }

      event.preventDefault()

      const activeElementIndex = focusableElements.findIndex(
        (element) => element === document.activeElement,
      )
      const currentIndex = activeElementIndex >= 0 ? activeElementIndex : 0
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusableElements.length) %
          focusableElements.length
        : (currentIndex + 1) % focusableElements.length

      focusableElements[nextIndex].focus()
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

          <Link
            aria-label="用户中心"
            className="cinematic-header__user"
            href="/generate/history"
          >
            <UserCircle aria-hidden="true" size={22} weight="thin" />
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
          ref={menuRef}
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

            <Link
              aria-label="用户中心"
              className="cinematic-header__mobile-user"
              href="/generate/history"
              onClick={closeMenu}
            >
              用户中心
              <UserCircle aria-hidden="true" size={26} weight="thin" />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
