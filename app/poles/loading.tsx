export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-32 rounded-lg bg-muted animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
