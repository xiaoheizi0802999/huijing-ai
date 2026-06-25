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
          aria-label="关闭升级弹窗"
          className="upgrade-dialog__close"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={22} weight="thin" />
        </button>

        <p className="upgrade-dialog__eyebrow">ACCESS PREVIEW</p>
        <h2 id="upgrade-dialog-title">升级创作权限</h2>
        <p className="upgrade-dialog__lead">升级功能即将开放</p>
        <p id="upgrade-dialog-description">
          当前版本不接入真实支付或订单系统。这里仅保留未来会员升级入口，用于提示更多创作次数与高级权限即将上线。
        </p>
      </div>
    </div>
  )
}
