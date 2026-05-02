import { permanentRedirect } from 'next/navigation'

// 308 permanent redirect from /app-download (placeholder) to /app (live landing page)
export default function AppDownloadRedirect() {
  permanentRedirect('/app')
}