export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-[#f0f2f5] dark:bg-[#0a0a0a] text-black dark:text-white">
      {/* HEADER skeleton */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#0f0f0f]/80 border-b border-gray-200 dark:border-gray-800/60 px-4 py-3 flex justify-between items-center max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </header>

      {/* FEED skeleton */}
      <main className="flex-1 max-w-xl w-full mx-auto flex flex-col">
        {[0, 1, 2].map((i) => (
          <article
            key={i}
            className="bg-white dark:bg-[#0a0a0a] px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-200 dark:border-gray-900"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="flex flex-col gap-1.5">
                <div className="w-24 h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="w-16 h-2.5 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>
            </div>
            <div className="w-full aspect-video rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="w-2/3 h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
            <div className="flex items-center gap-5 mt-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
