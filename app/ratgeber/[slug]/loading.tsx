import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs Skeleton */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            <Card className="overflow-hidden">
              {/* Featured Image Skeleton */}
              <div className="relative h-96 bg-gray-200 animate-pulse" />

              <div className="p-8 space-y-6">
                {/* Title Skeleton */}
                <div className="space-y-3">
                  <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-5/6 animate-pulse" />
                </div>

                {/* Meta Info Skeleton */}
                <div className="flex gap-4 pb-6 border-b">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>

                {/* Content Skeleton */}
                <div className="space-y-4 mt-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  ))}
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>

                {/* Tags Skeleton */}
                <div className="pt-6 border-t">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>

                {/* Share Buttons Skeleton */}
                <div className="pt-6 border-t">
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Related Posts Skeleton */}
            <div className="mt-12">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="flex gap-3">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </article>

          {/* Sidebar Skeleton */}
          <aside className="space-y-6">
            <Card className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
              <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </Card>

            <Card className="p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
