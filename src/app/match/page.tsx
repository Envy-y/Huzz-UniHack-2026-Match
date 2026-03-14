import { PageShell } from '@/components/PageShell'

export default function MatchPage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-4">
            Find a Match
          </h1>
          <p className="text-gray-600">
            Advanced match search with voice input will be available here
          </p>
        </div>
      </div>
    </PageShell>
  )
}
