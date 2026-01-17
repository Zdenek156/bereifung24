'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import BackButton from '@/components/BackButton';

// Dynamically import map component to avoid SSR issues
const TerritoryMap = dynamic(() => import('./TerritoryMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">Karte wird geladen...</div>
});

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  requestsCount: number;
  offersCount: number;
  acceptedOffersCount: number;
}

interface Workshop {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  hasSepaMandateActive: boolean;
  createdAt: string;
  offersCount: number;
  acceptedOffersCount: number;
  totalRevenue: number;
}

interface PostalCodeStat {
  zipCode: string;
  customers: number;
  workshops: number;
  requests: number;
  offers: number;
  acceptedOffers: number;
  coverage: number;
}

interface TerritoriesData {
  customers: Customer[];
  workshops: Workshop[];
  postalCodeStats: PostalCodeStat[];
  overallStats: {
    totalCustomers: number;
    totalWorkshops: number;
    activeWorkshops: number;
    workshopsWithSepa: number;
    totalRequests: number;
    totalOffers: number;
    acceptedOffers: number;
    conversionRate: string;
    averageOffersPerRequest: string;
  };
  serviceTypeDistribution: Record<string, number>;
}

export default function TerritoriesPage() {
  const [data, setData] = useState<TerritoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showWorkshops, setShowWorkshops] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [selectedView, setSelectedView] = useState<'map' | 'stats' | 'postal'>('map');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/territories');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching territories data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Fehler beim Laden der Daten</p>
        </div>
      </div>
    );
  }

  const filteredCustomers = showCustomers ? data.customers : [];
  const filteredWorkshops = showWorkshops ? data.workshops : [];

  // Find postal codes with no workshops (potential expansion areas)
  const expansionAreas = data.postalCodeStats
    .filter(stat => stat.customers > 0 && stat.workshops === 0)
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  // Top performing postal codes
  const topPerformingAreas = data.postalCodeStats
    .filter(stat => stat.workshops > 0 && stat.acceptedOffers > 0)
    .sort((a, b) => b.acceptedOffers - a.acceptedOffers)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gebietsübersicht</h1>
            <p className="text-gray-600 mt-1">Visualisierung und Analyse Ihrer Marktabdeckung</p>
          </div>
          <BackButton />
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kunden gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{data.overallStats.totalCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">{data.overallStats.totalRequests} Anfragen</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Werkstätten</p>
                <p className="text-2xl font-bold text-gray-900">{data.overallStats.totalWorkshops}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overallStats.workshopsWithSepa} mit SEPA
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Angebote</p>
                <p className="text-2xl font-bold text-gray-900">{data.overallStats.totalOffers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Ø {data.overallStats.averageOffersPerRequest} pro Anfrage
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{data.overallStats.conversionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overallStats.acceptedOffers} angenommen
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedView('map')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  selectedView === 'map'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🗺️ Kartenansicht
              </button>
              <button
                onClick={() => setSelectedView('postal')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  selectedView === 'postal'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📮 PLZ-Analyse
              </button>
              <button
                onClick={() => setSelectedView('stats')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  selectedView === 'stats'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Statistiken
              </button>
            </nav>
          </div>

          {/* Map View */}
          {selectedView === 'map' && (
            <div className="p-6">
              {/* Filter Controls */}
              <div className="mb-4 flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCustomers}
                    onChange={(e) => setShowCustomers(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium">
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                    Kunden anzeigen ({data.customers.length})
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showWorkshops}
                    onChange={(e) => setShowWorkshops(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                <span className="text-sm font-medium">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                  Werkstätten anzeigen ({data.workshops.length})
                </span>
              </label>

              <button
                  onClick={fetchData}
                  className="ml-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  🔄 Aktualisieren
                </button>
              </div>

              {/* Map */}
              <TerritoryMap
                customers={filteredCustomers}
                workshops={filteredWorkshops}
                postalCodeStats={data.postalCodeStats}
              />
            </div>
          )}

          {/* Postal Code Analysis */}
          {selectedView === 'postal' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expansion Opportunities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🎯 Expansion-Potenzial (PLZ ohne Werkstätten)
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800">
                      Diese Postleitzahlen haben Kundenanfragen aber keine Werkstätten. 
                      Ideale Gebiete für Neuakquise!
                    </p>
                  </div>
                  <div className="space-y-2">
                    {expansionAreas.length > 0 ? (
                      expansionAreas.map((area) => (
                        <div key={area.zipCode} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">PLZ {area.zipCode}</p>
                              <p className="text-sm text-gray-600">
                                {area.customers} Kunden · {area.requests} Anfragen
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              Keine Werkstatt
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Alle Gebiete mit Kunden haben Werkstätten 🎉</p>
                    )}
                  </div>
                </div>

                {/* Top Performing Areas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🏆 Top-Performance PLZ
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">
                      Diese Postleitzahlen haben die meisten erfolgreichen Abschlüsse.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {topPerformingAreas.map((area) => (
                      <div key={area.zipCode} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">PLZ {area.zipCode}</p>
                            <p className="text-sm text-gray-600">
                              {area.customers} Kunden · {area.workshops} Werkstätten
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {area.acceptedOffers} Abschlüsse
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{area.requests} Anfragen</span>
                          <span>·</span>
                          <span>{area.offers} Angebote</span>
                          <span>·</span>
                          <span className="font-medium text-green-600">
                            {area.offers > 0 ? ((area.acceptedOffers / area.offers) * 100).toFixed(1) : 0}% Conv.
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${area.offers > 0 ? (area.acceptedOffers / area.offers) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Postal Codes Table */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Alle PLZ-Gebiete</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PLZ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunden</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Werkstätten</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anfragen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Angebote</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abschlüsse</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abdeckung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.postalCodeStats.map((stat) => (
                        <tr key={stat.zipCode} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.zipCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{stat.customers}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {stat.workshops > 0 ? (
                              <span className="text-green-600 font-medium">{stat.workshops}</span>
                            ) : (
                              <span className="text-red-600 font-medium">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{stat.requests}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{stat.offers}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{stat.acceptedOffers}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {stat.offers > 0 ? ((stat.acceptedOffers / stat.offers) * 100).toFixed(1) : 0}%
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stat.workshops === 0 
                                ? 'bg-red-100 text-red-800'
                                : stat.coverage < 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {stat.coverage.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Statistics View */}
          {selectedView === 'stats' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Type Distribution */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service-Typen Verteilung</h3>
                  <div className="space-y-3">
                    {Object.entries(data.serviceTypeDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const percentage = (count / data.overallStats.totalRequests) * 100;
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{type}</span>
                              <span className="text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Workshop Performance */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Werkstätten</h3>
                  <div className="space-y-3">
                    {data.workshops
                      .sort((a, b) => b.acceptedOffersCount - a.acceptedOffersCount)
                      .slice(0, 10)
                      .map((workshop, index) => (
                        <div key={workshop.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{workshop.name}</p>
                              <p className="text-xs text-gray-500">{workshop.city} ({workshop.zipCode})</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {workshop.acceptedOffersCount} Abschlüsse
                            </p>
                            <p className="text-xs text-gray-500">
                              {workshop.totalRevenue.toFixed(2)}€ Umsatz
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Neuste Kunden</h3>
                  <div className="space-y-3">
                    {data.customers
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map((customer) => (
                        <div key={customer.id} className="flex items-start justify-between border-b border-gray-100 pb-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                            <p className="text-xs text-gray-500">
                              {customer.city} · {customer.zipCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">
                              {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.requestsCount} Anfragen
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Coverage Analysis */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Abdeckungs-Analyse</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">Gut abgedeckt</p>
                        <p className="text-xs text-green-700">≥1 Werkstatt pro PLZ</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {data.postalCodeStats.filter(s => s.workshops > 0).length}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-900">Keine Abdeckung</p>
                        <p className="text-xs text-red-700">0 Werkstätten</p>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {data.postalCodeStats.filter(s => s.workshops === 0 && s.customers > 0).length}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Durchschn. Werkstätten/PLZ</p>
                        <p className="text-xs text-blue-700">Bei abgedeckten Gebieten</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {(data.postalCodeStats
                          .filter(s => s.workshops > 0)
                          .reduce((sum, s) => sum + s.workshops, 0) / 
                          data.postalCodeStats.filter(s => s.workshops > 0).length
                        ).toFixed(1)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Aktive PLZ-Gebiete</p>
                        <p className="text-xs text-purple-700">Mit Kundenaktivität</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {data.postalCodeStats.filter(s => s.requests > 0).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
