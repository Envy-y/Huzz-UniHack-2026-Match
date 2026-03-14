export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent mb-2">
            Welcome to Match
          </h1>
          <p className="text-gray-600">
            Find your perfect badminton match in Melbourne
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-2">Recommended Lobbies</h2>
            <p className="text-gray-600 text-sm">
              Your personalized match recommendations will appear here
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
            <p className="text-gray-600 text-sm">
              Use the navigation to create a lobby or find a match
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
