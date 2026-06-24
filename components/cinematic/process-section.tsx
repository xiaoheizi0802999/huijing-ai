import Image from "next/image"
import { cinematicAssets, processSteps } from "@/lib/landing-content"
import { Reveal } from "./reveal"

export function ProcessSection() {
  const projectorAsset = cinematicAssets.processProjector

  return (
    <section
      aria-labelledby="process-title"
      className="process-section"
      id="process"
    >
      <Image
        alt=""
        className="projector-image"
        fill
        sizes="100vw"
        src={projectorAsset.src}
        style={{ objectPosition: projectorAsset.focalPoint }}
      />

      <Reveal className="section-heading process-heading">
        <p className="frame-label">FRAME 03 / CREATION PROCESS</p>
        <h2 id="process-title">
          从想法到大片，
          <br />
          只需五个镜头
        </h2>
      </Reveal>

      <div aria-label="五个镜头创作流程" className="process-timeline">
        <span aria-hidden="true" className="timeline-light" />

        {processSteps.map((item, index) => {
          const asset = cinematicAssets[item.asset]
          const nodeLabel = String(index + 1).padStart(2, "0")

          return (
            <Reveal
              key={item.step}
              className="process-step"
              delay={index * 120}
            >
              <article
                aria-labelledby={`process-step-${nodeLabel}`}
                className="process-step__card"
              >
                <span aria-hidden="true" className="process-node">
                  {nodeLabel}
                </span>

                <div className="process-step__image">
                  <Image
                    alt=""
                    fill
                    sizes="(max-width: 767px) 78vw, 18vw"
                    src={item.image}
                    style={{ objectPosition: asset.focalPoint }}
                  />
                </div>

                <div className="process-step__copy">
                  <span className="process-step__label">{item.step}</span>
                  <h3 id={`process-step-${nodeLabel}`}>{item.title}</h3>
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
