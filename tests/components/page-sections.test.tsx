import { render, screen } from "@testing-library/react"
import Home from "@/app/page"

it("renders the cinematic landing page shell", () => {
  render(<Home />)

  expect(
    screen.getByRole("heading", { name: /像导演一样生成你的视觉大片/ }),
  ).toBeInTheDocument()
})
