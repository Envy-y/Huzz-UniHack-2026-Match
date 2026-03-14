export function LoadingGrid() {
  return (
    <div className="grid gap-4 max-w-2xl mx-auto px-4 py-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-[18px] bg-mint-50/60 animate-pulse border border-[rgba(48,213,200,0.10)]"
        />
      ))}
    </div>
  )
}
