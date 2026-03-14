export function LoadingGrid() {
  return (
    <div className="grid gap-4 max-w-2xl mx-auto px-4 py-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-2xl bg-gray-200 animate-pulse border border-gray-100"
        />
      ))}
    </div>
  )
}
