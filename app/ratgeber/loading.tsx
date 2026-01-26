import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-12 bg-white/20 rounded-lg mb-4 w-3/4 mx-auto animate-pulse" />
            <div className="h-6 bg-white/20 rounded-lg mb-8 w-2/3 mx-auto animate-pulse" />
            <div className="h-14 bg-white/20 rounded-lg max-w-2xl mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Post Skeleton */}
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-200 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Category Filter Skeleton */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>

            {/* Article Grid Skeleton */}
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    <div className="flex gap-3">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
