import { FilmGrain } from "@/components/cinematic/film-grain"
import { GenerationHistoryPage } from "@/components/cinematic/generation-history-page"

export default function HistoryPage() {
  return (
    <main className="seedream-page">
      <FilmGrain />
      <GenerationHistoryPage />
    </main>
  )
}
