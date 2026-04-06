export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* calendar header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
        </div>
        {/* calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-muted p-3">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
