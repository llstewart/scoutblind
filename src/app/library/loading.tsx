export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar skeleton (desktop) */}
      <div className="hidden md:flex flex-col w-60 h-screen bg-gray-950 border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <div className="h-6 w-28 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-3.5 w-48 bg-gray-50 rounded animate-pulse mt-2" />
        </div>

        {/* Search bar skeleton */}
        <div className="h-10 max-w-sm bg-white border border-gray-200 rounded-lg animate-pulse" />

        {/* Cards skeleton */}
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-28 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-gray-50 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
