export default function SkeletonEditor({ loaded }: { loaded: boolean }) {
  return (
    <div className={`${loaded ? "hidden" : "block"} w-full px-2`}>
      <div className="space-y-4">
        <div className="w-3/4 h-10 bg-zinc-200 animate-pulse rounded-lg" />
        <div className="space-y-4">
          {Array.from({ length: 12 }, (_, i) =>
            i % 2 === 0 ? (
              <div
                key={i}
                className="w-full h-20 bg-zinc-200 animate-pulse rounded-lg"
              />
            ) : (
              <div
                key={i}
                className="w-full h-8 bg-zinc-200 animate-pulse rounded-lg"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
