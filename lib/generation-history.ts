export type GenerationHistoryItem = {
  aspectRatio: string
  createdAt: string
  id: string
  imageType: string
  imageUrl: string
  mood: string
  prompt: string
  quality: string
  subject: string
}

export const generationHistoryStorageKey = "huijing.seedream.history.v1"

const maxGenerationHistoryItems = 24
const generationHistoryChangeEvent = "huijing:seedream-history-change"

function isGenerationHistoryItem(
  value: unknown,
): value is GenerationHistoryItem {
  if (!value || typeof value !== "object") {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.imageUrl === "string" &&
    typeof item.prompt === "string" &&
    typeof item.subject === "string" &&
    typeof item.imageType === "string" &&
    typeof item.mood === "string" &&
    typeof item.aspectRatio === "string" &&
    typeof item.quality === "string"
  )
}

export function parseGenerationHistory(storedHistory: string) {
  try {
    if (!storedHistory) {
      return []
    }

    const parsedHistory: unknown = JSON.parse(storedHistory)

    return Array.isArray(parsedHistory)
      ? parsedHistory.filter(isGenerationHistoryItem)
      : []
  } catch {
    return []
  }
}

export function readGenerationHistory() {
  if (typeof window === "undefined") {
    return []
  }

  return parseGenerationHistory(
    window.localStorage.getItem(generationHistoryStorageKey) ?? "",
  )
}

function createGenerationHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function notifyGenerationHistoryChange() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(generationHistoryChangeEvent))
}

function writeGenerationHistory(history: GenerationHistoryItem[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    generationHistoryStorageKey,
    JSON.stringify(history),
  )
  notifyGenerationHistoryChange()
}

export function recordGenerationHistory(
  item: Omit<GenerationHistoryItem, "createdAt" | "id">,
) {
  const nextItem: GenerationHistoryItem = {
    ...item,
    createdAt: new Date().toISOString(),
    id: createGenerationHistoryId(),
  }
  const nextHistory = [nextItem, ...readGenerationHistory()]
    .filter(
      (historyItem, index, history) =>
        history.findIndex((currentItem) => currentItem.id === historyItem.id) ===
        index,
    )
    .slice(0, maxGenerationHistoryItems)

  writeGenerationHistory(nextHistory)
}

export function removeGenerationHistoryItem(id: string) {
  writeGenerationHistory(
    readGenerationHistory().filter((historyItem) => historyItem.id !== id),
  )
}

export function subscribeToGenerationHistory(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  window.addEventListener("storage", onStoreChange)
  window.addEventListener("focus", onStoreChange)
  window.addEventListener(generationHistoryChangeEvent, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener("focus", onStoreChange)
    window.removeEventListener(generationHistoryChangeEvent, onStoreChange)
  }
}

export function getGenerationHistorySnapshot() {
  if (typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(generationHistoryStorageKey) ?? ""
}

export function getServerGenerationHistorySnapshot() {
  return ""
}
