// Component for displaying influencer applications list
'use client'

interface Application {
  id: string
  name: string
  email: string
  platform: string
  channelName: string
  channelUrl: string
  followers: string
  message: string | null
  status: string
  createdAt: string
}

interface Props {
  applications: Application[]
  onApprove: (app: Application) => void
}

export default function ApplicationsList({ applications, onApprove }: Props) {
  const pendingApps = applications.filter(app => app.status === 'PENDING')
  const approvedApps = applications.filter(app => app.status === 'APPROVED')
  const rejectedApps = applications.filter(app => app.status === 'REJECTED')

  const getPlatformBadge = (platform: string) => {
    const colors: any = {
      YOUTUBE: 'bg-red-100 text-red-800',
      INSTAGRAM: 'bg-purple-100 text-purple-800',
      TIKTOK: 'bg-pink-100 text-pink-800',
      FACEBOOK: 'bg-blue-100 text-blue-800'
    }
    return colors[platform] || 'bg-gray-100 text-gray-800'
  }

  const renderApplication = (app: Application) => (
    <div key={app.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{app.name}</h3>
          <p className="text-sm text-gray-600">{app.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlatformBadge(app.platform)}`}>
          {app.platform}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm">
          <span className="font-medium">Kanal:</span> {app.channelName}
        </p>
        <p className="text-sm">
          <span className="font-medium">Follower:</span> {app.followers}
        </p>
        <a 
          href={app.channelUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          🔗 Kanal ansehen
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        {app.message && (
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            <span className="font-medium">Nachricht:</span><br />
            {app.message}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
        <span>Eingereicht: {new Date(app.createdAt).toLocaleDateString('de-DE')}</span>
      </div>

      {app.status === 'PENDING' && (
        <button
          onClick={() => onApprove(app)}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          ✅ Freischalten & E-Mail senden
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Pending Applications */}
      {pendingApps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔔 Offene Bewerbungen ({pendingApps.length})
          </h2>
          <div className="grid gap-4">
            {pendingApps.map(renderApplication)}
          </div>
        </div>
      )}

      {pendingApps.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-800 font-medium">📭 Keine offenen Bewerbungen</p>
          <p className="text-blue-600 text-sm mt-2">Neue Bewerbungen erscheinen hier automatisch</p>
        </div>
      )}

      {/* Approved Applications */}
      {approvedApps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ Genehmigte Bewerbungen ({approvedApps.length})
          </h2>
          <div className="grid gap-4">
            {approvedApps.map(renderApplication)}
          </div>
        </div>
      )}
    </div>
  )
}
