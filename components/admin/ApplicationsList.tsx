// Component for displaying influencer applications list
'use client'

import { useState } from 'react'

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
  reviewedAt?: string
  rejectionReason?: string
}

interface Props {
  applications: Application[]
  onApprove: (app: Application) => void
  onReject: (app: Application) => void
}

export default function ApplicationsList({ applications, onApprove, onReject }: Props) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  
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
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(app)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            ✅ Freischalten
          </button>
          <button
            onClick={() => onReject(app)}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            ❌ Ablehnen
          </button>
        </div>
      )}

      {app.status === 'REJECTED' && app.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-red-900">Grund:</p>
          <p className="text-red-800 mt-1">{app.rejectionReason}</p>
        </div>
      )}

      {app.status === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-green-900">✅ Genehmigt</p>
          <p className="text-green-800 text-xs mt-1">
            {new Date(app.reviewedAt || app.createdAt).toLocaleDateString('de-DE')}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔔 Offene Bewerbungen
            {pendingApps.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {pendingApps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === 'approved'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✅ Freigeschaltete
            {approvedApps.length > 0 && (
              <span className="ml-2 bg-green-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {approvedApps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
              activeTab === 'rejected'
                ? 'bg-red-50 text-red-700 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ❌ Abgelehnte
            {rejectedApps.length > 0 && (
              <span className="ml-2 bg-red-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {rejectedApps.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'pending' && (
          <>
            {pendingApps.length > 0 ? (
              <div className="grid gap-4">
                {pendingApps.map(renderApplication)}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <p className="text-blue-800 font-medium">📭 Keine offenen Bewerbungen</p>
                <p className="text-blue-600 text-sm mt-2">Neue Bewerbungen erscheinen hier automatisch</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'approved' && (
          <>
            {approvedApps.length > 0 ? (
              <div className="grid gap-4">
                {approvedApps.map(renderApplication)}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <p className="text-green-800 font-medium">📭 Keine freigeschalteten Bewerbungen</p>
                <p className="text-green-600 text-sm mt-2">Genehmigte Influencer erscheinen hier</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            {rejectedApps.length > 0 ? (
              <div className="grid gap-4">
                {rejectedApps.map(renderApplication)}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <p className="text-red-800 font-medium">📭 Keine abgelehnten Bewerbungen</p>
                <p className="text-red-600 text-sm mt-2">Abgelehnte Bewerbungen erscheinen hier</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
