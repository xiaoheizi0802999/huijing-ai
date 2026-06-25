"use client"

import { Gift, LockKey, Stack } from "@phosphor-icons/react"
import Image from "next/image"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { cinematicAssets } from "@/lib/landing-content"
import { CinematicButton } from "./cinematic-button"
import { Reveal } from "./reveal"
import { UpgradeDialog } from "./upgrade-dialog"

const membershipBenefits = [
  {
    description: "每天登录即可领取，持续激发新的视觉灵感。",
    Icon: Gift,
    title: "新用户每日赠送 5 个积分",
  },
  {
    description: "透明简单的创作机制，让注意力回到作品本身。",
    Icon: Stack,
    title: "每生成 1 张图片消耗 1 个积分",
  },
  {
    description: "升级入口已保留，当前版本不接入真实支付。",
    Icon: LockKey,
    title: "积分不足时可升级解锁更多创作次数",
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
            DAILY CREDITS / FUTURE ACCESS
          </p>
          <p>
            把积分机制处理成安静的幕后秩序：清晰、克制、可预期，让每一次生成都像进入一间私密放映室。
          </p>
          <CinematicButton
            onClick={openUpgradeDialog}
            variant="outline"
          >
            升级创作权限
          </CinematicButton>
        </Reveal>

        <div aria-label="积分与会员权益" className="membership-benefits">
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
