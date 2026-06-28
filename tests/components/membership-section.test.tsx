import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { MembershipSection } from "@/components/cinematic/membership-section"

afterEach(() => {
  cleanup()
  document.body.style.overflow = ""
})

it("renders public creation benefits in the membership anchor section", () => {
  const { container } = render(<MembershipSection />)
  const section = container.querySelector("#membership")

  expect(section).toBeInTheDocument()
  expect(section).toHaveAttribute("aria-labelledby", "membership-title")
  expect(screen.getByText("FRAME 05 / MEMBERSHIP")).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: /创作无界，\s*灵感不设限/ }),
  ).toBeInTheDocument()
  expect(screen.getByText("打开工作台即可生成")).toBeInTheDocument()
  expect(screen.getByText("作品自动保存在本地历史")).toBeInTheDocument()
  expect(screen.getByText("下载与删除都由你掌控")).toBeInTheDocument()
})

it("opens and dismisses the creation details dialog accessibly", () => {
  document.body.style.overflow = "clip"

  const { container } = render(<MembershipSection />)
  const upgradeButton = screen.getByRole("button", { name: "查看创作方式" })

  fireEvent.click(upgradeButton)

  const dialog = screen.getByRole("dialog", { name: "公开创作方式" })
  const closeButton = screen.getByRole("button", { name: "关闭说明弹窗" })

  expect(dialog).toHaveAttribute("aria-modal", "true")
  expect(screen.getByText("打开页面即可开始")).toBeInTheDocument()
  expect(
    screen.getByText(/当前版本不接入支付或订单系统/),
  ).toBeInTheDocument()
  expect(closeButton).toHaveFocus()
  expect(document.body.style.overflow).toBe("hidden")

  fireEvent.keyDown(document, { key: "Tab" })

  expect(closeButton).toHaveFocus()

  fireEvent.keyDown(document, { key: "Tab", shiftKey: true })

  expect(closeButton).toHaveFocus()

  fireEvent.click(dialog)

  expect(screen.getByRole("dialog", { name: "公开创作方式" })).toBeInTheDocument()

  fireEvent.keyDown(document, { key: "Escape" })

  expect(
    screen.queryByRole("dialog", { name: "公开创作方式" }),
  ).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe("clip")
  expect(upgradeButton).toHaveFocus()

  fireEvent.click(upgradeButton)
  fireEvent.click(screen.getByRole("button", { name: "关闭说明弹窗" }))

  expect(
    screen.queryByRole("dialog", { name: "公开创作方式" }),
  ).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe("clip")
  expect(upgradeButton).toHaveFocus()

  fireEvent.click(upgradeButton)

  const backdrop = container.querySelector(".upgrade-dialog__backdrop")

  if (!backdrop) {
    throw new Error("Upgrade dialog backdrop was not rendered")
  }

  fireEvent.click(backdrop)

  expect(
    screen.queryByRole("dialog", { name: "公开创作方式" }),
  ).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe("clip")
  expect(upgradeButton).toHaveFocus()
})
