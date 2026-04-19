import { permanentRedirect } from 'next/navigation'

interface PageProps {
  params: {
    slug: string
  }
}

// 308 permanent redirect from /lp/[slug] to /[slug] to avoid duplicate content
export default function LpRedirect({ params }: PageProps) {
  permanentRedirect(`/${params.slug}`)
}