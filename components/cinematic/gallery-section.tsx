import Image from "next/image"
import { cinematicAssets, galleryItems } from "@/lib/landing-content"
import { Reveal } from "./reveal"

const galleryImageSizes =
  "(max-width: 520px) 100vw, (max-width: 767px) 50vw, 34vw"

export function GallerySection() {
  return (
    <section
      aria-labelledby="gallery-title"
      className="gallery-section"
      id="gallery"
    >
      <Reveal className="section-heading gallery-heading">
        <p className="frame-label">FRAME 04 / AI GALLERY</p>
        <h2 id="gallery-title">
          AI 镜头库 /
          <br />
          电影级作品示例
        </h2>
      </Reveal>

      <div className="editorial-gallery">
        {galleryItems.map((item, index) => {
          const asset = cinematicAssets[item.asset]

          return (
            <Reveal
              key={item.slug}
              className={`gallery-frame ${item.className}`}
              delay={index * 85}
            >
              <figure
                aria-label={item.title}
                className="gallery-item"
                role="figure"
                tabIndex={0}
              >
                <Image
                  alt={item.alt}
                  fill
                  sizes={galleryImageSizes}
                  src={item.src}
                  style={{ objectPosition: asset.focalPoint }}
                />

                <figcaption>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </figcaption>
              </figure>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
