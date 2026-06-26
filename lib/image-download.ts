function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 34)
}

function formatDownloadStamp(createdAt?: Date | string) {
  const date = createdAt ? new Date(createdAt) : new Date()

  if (Number.isNaN(date.getTime())) {
    return `${Date.now()}`
  }

  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, "")
    .replace(/[:T]/g, "-")
}

function getImageExtension(imageUrl: string) {
  if (imageUrl.startsWith("data:image/")) {
    const mimeType = imageUrl.slice("data:".length).split(";")[0]
    const subtype = mimeType.split("/")[1]?.toLowerCase()

    if (subtype === "jpeg") {
      return "jpg"
    }

    if (subtype === "svg+xml") {
      return "svg"
    }

    return subtype || "png"
  }

  try {
    const pathName =
      typeof window === "undefined"
        ? imageUrl
        : new URL(imageUrl, window.location.href).pathname
    const extensionMatch = pathName.match(/\.([a-z0-9]+)$/i)

    if (extensionMatch?.[1]) {
      return extensionMatch[1].toLowerCase()
    }
  } catch {
    return "png"
  }

  return "png"
}

export function createImageDownloadName(
  subject?: string,
  createdAt?: Date | string,
) {
  const subjectPart = subject ? sanitizeFileNamePart(subject) : ""
  const baseName = `huijing-ai-${formatDownloadStamp(createdAt)}`

  return subjectPart ? `${baseName}-${subjectPart}` : baseName
}

function triggerBrowserDownload(href: string, fileName: string) {
  if (typeof document === "undefined") {
    return
  }

  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = fileName
  anchor.rel = "noopener"
  anchor.style.display = "none"
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export async function downloadImage(
  imageUrl: string,
  subject?: string,
  createdAt?: Date | string,
) {
  const fallbackFileName = `${createImageDownloadName(
    subject,
    createdAt,
  )}.${getImageExtension(imageUrl)}`

  if (imageUrl.startsWith("data:")) {
    triggerBrowserDownload(imageUrl, fallbackFileName)
    return
  }

  try {
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error("Image request failed")
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerBrowserDownload(objectUrl, fallbackFileName)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  } catch {
    triggerBrowserDownload(imageUrl, fallbackFileName)
  }
}
