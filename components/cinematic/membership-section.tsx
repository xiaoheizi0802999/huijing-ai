"use client"

import { DownloadSimple, ImageSquare, Stack } from "@phosphor-icons/react"
import Image from "next/image"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { cinematicAssets } from "@/lib/landing-content"
import { CinematicButton } from "./cinematic-button"
import { Reveal } from "./reveal"
import { UpgradeDialog } from "./upgrade-dialog"

const membershipBenefits = [
  {
    description: "进入生图页就能提交创意简述，生成过程保持直接轻量。",
    Icon: ImageSquare,
    title: "打开工作台即可生成",
  },
  {
    description: "生成成功后记录会留在当前浏览器，方便回看提示词与参数。",
    Icon: Stack,
    title: "作品自动保存在本地历史",
  },
  {
    description: "成片可以直接下载，历史记录也可以随时从本地删除。",
    Icon: DownloadSimple,
    title: "下载与删除都由你掌控",
  },
] as const

export function MembershipSection() {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const upgradeTriggerRef = useRef<HTMLButtonElement>(null)
  const wasUpgradeOpen = useRef(false)
  const membershipAsset = cinematicAssets.membershipChair

  useEffect(() => {
    if (isUpgradeOpen) {
      wasUpgradeOpen.current = true
      return
    }

    if (!wasUpgradeOpen.current) {
      return
    }

    wasUpgradeOpen.current = false

    if (upgradeTriggerRef.current?.isConnected) {
      upgradeTriggerRef.current.focus()
    }
  }, [isUpgradeOpen])

  function openUpgradeDialog(event: MouseEvent<HTMLButtonElement>) {
    upgradeTriggerRef.current = event.currentTarget
    setIsUpgradeOpen(true)
  }

  function closeUpgradeDialog() {
    setIsUpgradeOpen(false)
  }

  return (
    <section
      aria-labelledby="membership-title"
      className="membership-section"
      id="membership"
    >
      <Image
        alt=""
        className="membership-background"
        fill
        sizes="100vw"
        src={membershipAsset.src}
        style={{ objectPosition: membershipAsset.focalPoint }}
      />

      <Reveal className="section-heading membership-heading">
        <p className="frame-label">FRAME 05 / MEMBERSHIP</p>
        <h2 id="membership-title">
          创作无界，
          <br />
          灵感不设限
        </h2>
      </Reveal>

      <div className="membership-content">
        <Reveal className="membership-access" delay={100}>
          <p className="membership-access__eyebrow">
            PUBLIC STUDIO / LOCAL ARCHIVE
          </p>
          <p>
            创作流程保持直接、轻量、可预期：打开工作台，写下想法，生成作品，再把结果留在当前浏览器里。
          </p>
          <CinematicButton
            onClick={openUpgradeDialog}
            variant="outline"
          >
            查看创作方式
          </CinematicButton>
        </Reveal>

        <div aria-label="公开创作能力" className="membership-benefits">
          {membershipBenefits.map((benefit, index) => {
            const Icon = benefit.Icon

            return (
              <Reveal
                key={benefit.title}
                className="membership-benefit"
                delay={index * 90}
              >
                <article
                  aria-labelledby={`membership-benefit-${index + 1}`}
                  className="membership-benefit__card"
                >
                  <span aria-hidden="true" className="membership-benefit__icon">
                    <Icon size={24} weight="thin" />
                  </span>
                  <h3 id={`membership-benefit-${index + 1}`}>
                    {benefit.title}
                  </h3>
                  <p>{benefit.description}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>

      <UpgradeDialog open={isUpgradeOpen} onClose={closeUpgradeDialog} />
    </section>
  )
}
