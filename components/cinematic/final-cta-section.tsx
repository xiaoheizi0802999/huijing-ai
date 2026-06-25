import Image from "next/image"
import { cinematicAssets } from "@/lib/landing-content"
import { CinematicButton } from "./cinematic-button"
import { Reveal } from "./reveal"

export function FinalCtaSection() {
  const finalAsset = cinematicAssets.finalLight

  return (
    <section
      aria-labelledby="final-cta-title"
      className="final-cta-section"
      id="final-cta-section"
    >
      <Image
        alt=""
        className="final-cta-background"
        fill
        sizes="100vw"
        src={finalAsset.src}
        style={{ objectPosition: finalAsset.focalPoint }}
      />

      <Reveal className="final-cta-content">
        <p className="frame-label">FRAME 06 / FINAL CUT</p>
        <h2 id="final-cta-title">
          <span>每一次生成，</span>
          <span>都是一帧电影。</span>
        </h2>
        <CinematicButton href="/generate">
          开始生成你的第一张作品
        </CinematicButton>
      </Reveal>
    </section>
  )
}
