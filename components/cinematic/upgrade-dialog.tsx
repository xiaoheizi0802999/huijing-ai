"use client"

import { X } from "@phosphor-icons/react"
import { useEffect, useRef, type MouseEvent } from "react"

type UpgradeDialogProps = {
  onClose: () => void
  open: boolean
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ")

export function UpgradeDialog({ onClose, open }: UpgradeDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow

    function getFocusableElements() {
      const dialog = dialogRef.current

      if (!dialog) {
        return []
      }

      return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current()
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
      const nextIndex = event.shiftKey
        ? (activeElementIndex <= 0
            ? focusableElements.length
            : activeElementIndex) - 1
        : (activeElementIndex + 1) % focusableElements.length

      focusableElements[nextIndex]?.focus()
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) {
    return null
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="upgrade-dialog__backdrop" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        aria-describedby="upgrade-dialog-description"
        aria-labelledby="upgrade-dialog-title"
        aria-modal="true"
        className="upgrade-dialog"
        role="dialog"
      >
        <button
          ref={closeButtonRef}
          aria-label="关闭说明弹窗"
          className="upgrade-dialog__close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={22} weight="thin" />
        </button>

        <p className="upgrade-dialog__eyebrow">PUBLIC CREATION</p>
        <h2 id="upgrade-dialog-title">公开创作方式</h2>
        <p className="upgrade-dialog__lead">打开页面即可开始</p>
        <p id="upgrade-dialog-description">
          当前版本不接入支付或订单系统。生成入口直接开放，历史作品保存在当前浏览器中，你可以随时下载或删除。
        </p>
      </div>
    </div>
  )
}
