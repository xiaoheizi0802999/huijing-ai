import type { Metadata } from "next"
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"
import "./globals.css"

const sans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const serif = Noto_Serif_SC({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "绘境 AI｜像导演一样生成视觉大片",
  description: "让 AI 理解你的创作意图，把自然语言转化为专业视觉语言。",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
