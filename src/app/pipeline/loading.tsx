export default function PipelineLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar skeleton (desktop) */}
      <div className="hidden md:flex flex-col w-60 h-screen bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 w-28 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* KPI strip skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Filter chips skeleton */}
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Toolbar skeleton */}
        <div className="flex gap-3">
          <div className="h-10 flex-1 max-w-sm bg-white border border-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100">
              <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-100 rounded-md animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-56 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-9 w-9 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-4 w-14 bg-gray-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
