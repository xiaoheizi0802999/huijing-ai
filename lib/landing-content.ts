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
] as const

export const processSteps = [
  {
    step: "STEP 01 / MOOD",
    title: "选择风格",
    image: "/cinematic/gallery-architecture.webp",
  },
  {
    step: "STEP 02 / SUBJECT",
    title: "输入主体",
    image: "/cinematic/gallery-portrait.webp",
  },
  {
    step: "STEP 03 / DETAILS",
    title: "补充细节",
    image: "/cinematic/gallery-fashion.webp",
  },
  {
    step: "STEP 04 / PROMPT ENGINE",
    title: "AI 优化提示词",
    image: "/cinematic/gallery-product.webp",
  },
  {
    step: "STEP 05 / FINAL FRAME",
    title: "生成高清图片",
    image: "/cinematic/gallery-fantasy.webp",
  },
] as const

export const galleryItems = [
  {
    slug: "portrait",
    title: "Cinematic Portrait",
    description: "湿润质感与单侧硬光构成的电影人像。",
    src: "/cinematic/gallery-portrait.webp",
    alt: "冷光照亮面部的电影感人物肖像",
    className: "gallery-item--portrait",
  },
  {
    slug: "product",
    title: "Luxury Product Shot",
    description: "黑曜石与银色高光中的奢华产品画面。",
    src: "/cinematic/gallery-product.webp",
    alt: "黑色岩石上的高级香水产品摄影",
    className: "gallery-item--product",
  },
  {
    slug: "fantasy",
    title: "Dark Fantasy Scene",
    description: "风暴、城堡与深渊组成的暗黑叙事。",
    src: "/cinematic/gallery-fantasy.webp",
    alt: "云层和瀑布上方的暗黑幻想城堡",
    className: "gallery-item--fantasy",
  },
  {
    slug: "fashion",
    title: "Editorial Fashion",
    description: "黑色织物在硬光中凝固成雕塑。",
    src: "/cinematic/gallery-fashion.webp",
    alt: "穿着黑色雕塑感服装的编辑时装人物",
    className: "gallery-item--fashion",
  },
  {
    slug: "architecture",
    title: "Architectural Vision",
    description: "蓝调时刻中的克制建筑电影静帧。",
    src: "/cinematic/gallery-architecture.webp",
    alt: "水边的深色现代建筑",
    className: "gallery-item--architecture",
  },
  {
    slug: "car",
    title: "Cinematic Car Scene",
    description: "雨夜街道与车灯反射塑造速度前的静止。",
    src: "/cinematic/gallery-car.webp",
    alt: "雨夜巷道中的黑色汽车",
    className: "gallery-item--car",
  },
] as const
