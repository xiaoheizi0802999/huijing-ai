export type CinematicAsset = {
  src: string
  alt: string
  width: number
  height: number
  focalPoint: string
}

export type CinematicAssetKey =
  | "hero"
  | "capabilityStage"
  | "processProjector"
  | "portrait"
  | "product"
  | "fantasy"
  | "fashion"
  | "architecture"
  | "car"
  | "membershipChair"
  | "finalLight"

type Capability = {
  index: string
  title: string
  description: string
  label: string
}

type ProcessStep = {
  step: string
  title: string
  asset: CinematicAssetKey
  image: string
}

type GalleryAssetKey =
  | "portrait"
  | "product"
  | "fantasy"
  | "fashion"
  | "architecture"
  | "car"

type GalleryItem = {
  slug: GalleryAssetKey
  asset: GalleryAssetKey
  title: string
  description: string
  src: string
  alt: string
  className: string
}

export const cinematicAssets = {
  hero: {
    src: "/cinematic/hero-screen.webp",
    alt: "黑暗巨幕中人物面对远方城堡的电影场景",
    width: 1536,
    height: 1024,
    focalPoint: "70% 50%",
  },
  capabilityStage: {
    src: "/cinematic/capability-stage.webp",
    alt: "",
    width: 1536,
    height: 1024,
    focalPoint: "50% 50%",
  },
  processProjector: {
    src: "/cinematic/process-projector.webp",
    alt: "",
    width: 1024,
    height: 1536,
    focalPoint: "50% 45%",
  },
  portrait: {
    src: "/cinematic/gallery-portrait.webp",
    alt: "冷光照亮面部的电影感人物肖像",
    width: 1024,
    height: 1536,
    focalPoint: "50% 38%",
  },
  product: {
    src: "/cinematic/gallery-product.webp",
    alt: "黑色岩石上的高级香水产品摄影",
    width: 1536,
    height: 1024,
    focalPoint: "52% 52%",
  },
  fantasy: {
    src: "/cinematic/gallery-fantasy.webp",
    alt: "云层和瀑布上方的暗黑幻想城堡",
    width: 1024,
    height: 1536,
    focalPoint: "50% 42%",
  },
  fashion: {
    src: "/cinematic/gallery-fashion.webp",
    alt: "穿着黑色雕塑感服装的编辑时装人物",
    width: 1024,
    height: 1536,
    focalPoint: "50% 35%",
  },
  architecture: {
    src: "/cinematic/gallery-architecture.webp",
    alt: "水边的深色现代建筑",
    width: 1536,
    height: 1024,
    focalPoint: "50% 50%",
  },
  car: {
    src: "/cinematic/gallery-car.webp",
    alt: "雨夜巷道中的黑色汽车",
    width: 1536,
    height: 1024,
    focalPoint: "55% 55%",
  },
  membershipChair: {
    src: "/cinematic/membership-chair.webp",
    alt: "",
    width: 1536,
    height: 1024,
    focalPoint: "50% 50%",
  },
  finalLight: {
    src: "/cinematic/final-light.webp",
    alt: "",
    width: 1536,
    height: 1024,
    focalPoint: "50% 50%",
  },
} as const satisfies Record<CinematicAssetKey, CinematicAsset>

export const capabilities = [
  {
    index: "01",
    title: "选择图片类型",
    description:
      "从海报、人像、产品、建筑到概念艺术，先确定镜头最终要成为哪一种画面。",
    label: "TYPE & STYLE",
  },
  {
    index: "02",
    title: "输入主体与需求",
    description:
      "用自然语言描述主体、用途、气氛与构图，不需要学习复杂的提示词语法。",
    label: "SUBJECT & REQUEST",
  },
  {
    index: "03",
    title: "自动生成专业提示词",
    description:
      "系统把普通描述扩展为镜头、光影、材质和画面语言，形成可执行的视觉方案。",
    label: "PROMPT ENGINE",
  },
] as const satisfies readonly Capability[]

export const processSteps = [
  {
    step: "STEP 01 / MOOD",
    title: "选择风格",
    asset: "architecture",
    image: cinematicAssets.architecture.src,
  },
  {
    step: "STEP 02 / SUBJECT",
    title: "输入主体",
    asset: "portrait",
    image: cinematicAssets.portrait.src,
  },
  {
    step: "STEP 03 / DETAILS",
    title: "补充细节",
    asset: "fashion",
    image: cinematicAssets.fashion.src,
  },
  {
    step: "STEP 04 / PROMPT ENGINE",
    title: "AI 优化提示词",
    asset: "product",
    image: cinematicAssets.product.src,
  },
  {
    step: "STEP 05 / FINAL FRAME",
    title: "生成高清图片",
    asset: "fantasy",
    image: cinematicAssets.fantasy.src,
  },
] as const satisfies readonly ProcessStep[]

export const galleryItems = [
  {
    slug: "portrait",
    asset: "portrait",
    title: "Cinematic Portrait",
    description: "湿润质感与单侧硬光构成的电影人像。",
    src: cinematicAssets.portrait.src,
    alt: cinematicAssets.portrait.alt,
    className: "gallery-item--portrait",
  },
  {
    slug: "product",
    asset: "product",
    title: "Luxury Product Shot",
    description: "黑曜石与银色高光中的奢华产品画面。",
    src: cinematicAssets.product.src,
    alt: cinematicAssets.product.alt,
    className: "gallery-item--product",
  },
  {
    slug: "fantasy",
    asset: "fantasy",
    title: "Dark Fantasy Scene",
    description: "风暴、城堡与深渊组成的暗黑叙事。",
    src: cinematicAssets.fantasy.src,
    alt: cinematicAssets.fantasy.alt,
    className: "gallery-item--fantasy",
  },
  {
    slug: "fashion",
    asset: "fashion",
    title: "Editorial Fashion",
    description: "黑色织物在硬光中凝固成雕塑。",
    src: cinematicAssets.fashion.src,
    alt: cinematicAssets.fashion.alt,
    className: "gallery-item--fashion",
  },
  {
    slug: "architecture",
    asset: "architecture",
    title: "Architectural Vision",
    description: "蓝调时刻中的克制建筑电影静帧。",
    src: cinematicAssets.architecture.src,
    alt: cinematicAssets.architecture.alt,
    className: "gallery-item--architecture",
  },
  {
    slug: "car",
    asset: "car",
    title: "Cinematic Car Scene",
    description: "雨夜街道与车灯反射塑造速度前的静止。",
    src: cinematicAssets.car.src,
    alt: cinematicAssets.car.alt,
    className: "gallery-item--car",
  },
] as const satisfies readonly GalleryItem[]
