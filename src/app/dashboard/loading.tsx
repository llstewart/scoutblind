export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar skeleton (desktop) */}
      <div className="hidden md:flex flex-col w-60 h-screen bg-gray-950 border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <div className="h-6 w-28 bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto text-center px-4 space-y-6">
            {/* Title skeleton */}
            <div className="h-7 w-48 bg-gray-100 rounded-lg mx-auto animate-pulse" />
            <div className="h-4 w-72 bg-gray-50 rounded-lg mx-auto animate-pulse" />

            {/* Search form skeleton */}
            <div className="space-y-3 mt-8">
              <div className="h-12 bg-white dark:bg-card rounded-xl elevation-1 animate-pulse" />
              <div className="h-12 bg-white dark:bg-card rounded-xl elevation-1 animate-pulse" />
              <div className="h-12 w-32 bg-violet-100 rounded-xl mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
