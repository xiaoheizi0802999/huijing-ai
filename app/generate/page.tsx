import Link from "next/link"

export default function GeneratePage() {
  return (
    <main className="generate-preview-page">
      <section
        aria-labelledby="generate-preview-title"
        className="generate-preview-card"
      >
        <p className="frame-label">CREATION STUDIO / PREVIEW</p>
        <h1 id="generate-preview-title">创作工作台将在下一阶段接入</h1>
        <p>
          营销首页已经准备好。真实生图、积分和历史记录将沿用绘境 AI MVP 规格继续实现。
        </p>
        <Link
          className="cinematic-button cinematic-button--outline generate-preview-link"
          href="/"
        >
          返回暗光剧场
        </Link>
      </section>
    </main>
  )
}
