import Image from "next/image"
import { capabilities, cinematicAssets } from "@/lib/landing-content"
import { Reveal } from "./reveal"

export function CapabilitiesSection() {
  const stageAsset = cinematicAssets.capabilityStage

  return (
    <section
      aria-labelledby="capabilities-title"
      className="capabilities-section"
      id="capabilities-section"
    >
      <Image
        alt=""
        className="capabilities-background"
        fill
        sizes="100vw"
        src={stageAsset.src}
        style={{ objectPosition: stageAsset.focalPoint }}
      />

      <Reveal className="section-heading capabilities-heading">
        <p className="frame-label">FRAME 02 / CAPABILITIES</p>
        <h2 id="capabilities-title">
          不是输入提示词，
          <br />
          而是构建一场视觉叙事
        </h2>
      </Reveal>

      <div className="capability-panels">
        {capabilities.map((item, index) => (
          <Reveal
            key={item.index}
            className="capability-panel"
            delay={index * 120}
          >
            <article
              aria-labelledby={`capability-${item.index}`}
              className="capability-card"
            >
              <span className="capability-card__index">{item.index}</span>
              <h3 id={`capability-${item.index}`}>{item.title}</h3>
              <p>{item.description}</p>
              <small>{item.label}</small>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
