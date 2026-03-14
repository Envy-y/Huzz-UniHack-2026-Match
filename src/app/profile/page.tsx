import { PageShell } from '@/components/PageShell'

export default function ProfilePage() {
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-4">
            Your Profile
          </h1>
          <p className="text-gray-600">
            Edit your profile and view match history here
          </p>
        </div>
      </div>
    </PageShell>
  )
}
