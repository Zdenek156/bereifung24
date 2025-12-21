'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SalesStats {
  summary: {
    totalProspects: number;
    newProspects: number;
    contactedThisWeek: number;
    wonThisMonth: number;
    myProspects: number;
    myTasks: number;
    conversionRate: number;
  };
  pipeline: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    prospect: {
      id: string;
      name: string;
      status: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    subject: string;
    createdAt: string;
    prospect: {
      id: string;
      name: string;
      status: string;
    };
  }>;
}

const statusLabels: Record<string, string> = {
  NEW: 'Neu',
  CONTACTED: 'Kontaktiert',
  QUALIFIED: 'Qualifiziert',
  MEETING_SCHEDULED: 'Termin geplant',
  DEMO_COMPLETED: 'Demo durchgeführt',
  PROPOSAL_SENT: 'Angebot versendet',
  NEGOTIATING: 'Verhandlung',
  VERBAL_AGREEMENT: 'Mündliche Zusage',
  CONTRACT_SENT: 'Vertrag versendet',
  WON: 'Gewonnen',
  LOST: 'Verloren',
  NOT_INTERESTED: 'Kein Interesse',
  NOT_REACHABLE: 'Nicht erreichbar',
  CALLBACK: 'Follow-up geplant',
  ON_HOLD: 'Pausiert'
};

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800'
};

export default function SalesDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sales/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Fehler beim Laden der Statistiken</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-400 hover:text-gray-600"
                title="Zurück zum Dashboard"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Werkstatt-Akquise & Lead-Management
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/sales/search"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Werkstätten suchen
              </Link>
              <Link
                href="/sales/prospects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Alle Prospects
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Prospects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.summary.totalProspects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Neue Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.summary.newProspects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Kontakte (Woche)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.summary.contactedThisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gewonnen (Monat)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.summary.wonThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Meine Prospects</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.summary.myProspects}</p>
            <Link href="/sales/prospects?assignedToMe=true" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
              Alle anzeigen →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Offene Tasks</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.summary.myTasks}</p>
            <p className="text-sm text-gray-500 mt-2">Nächste 7 Tage</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Conversion Rate</h3>
            <p className="text-3xl font-bold text-green-600">{stats.summary.conversionRate}%</p>
            <p className="text-sm text-gray-500 mt-2">Kontaktiert → Gewonnen</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pipeline Overview */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pipeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.pipeline.map((stage) => (
                  <div key={stage.status} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {statusLabels[stage.status] || stage.status}
                        </span>
                        <span className="text-sm text-gray-600">{stage.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(stage.count / stats.summary.totalProspects) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Anstehende Aufgaben</h2>
            </div>
            <div className="p-6">
              {stats.upcomingTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Keine anstehenden Aufgaben</p>
              ) : (
                <div className="space-y-4">
                  {stats.upcomingTasks.map((task) => (
                    <div key={task.id} className="border-l-4 border-primary-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <Link
                            href={`/sales/prospects/${task.prospect.id}`}
                            className="text-sm text-gray-600 hover:text-primary-600"
                          >
                            {task.prospect.name}
                          </Link>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
