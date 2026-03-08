export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav skeleton */}
      <div className="bg-primary-600 h-16 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="h-10 w-40 bg-white/20 rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="relative bg-primary-800 text-white pt-12 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="h-12 bg-white/10 rounded-lg w-3/4 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-white/10 rounded-lg w-1/2 mx-auto animate-pulse" />
          </div>

          {/* Search card skeleton */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              {/* Service buttons skeleton */}
              <div className="flex flex-wrap gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-12 w-36 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>

              {/* Search row skeleton */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="w-32 h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="w-48 h-12 bg-primary-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Social proof skeleton */}
          <div className="max-w-5xl mx-auto mt-4 flex items-center justify-center gap-4">
            <div className="h-5 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-36 bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
