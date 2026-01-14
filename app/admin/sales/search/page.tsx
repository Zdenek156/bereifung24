'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  googlePlaceId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  rating?: number;
  reviewCount: number;
  photoUrls: string[];
  leadScore: number;
  isExisting: boolean;
  existingStatus?: string;
  existingId?: string;
}

export default function SearchProspectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Search params
  const [searchLocation, setSearchLocation] = useState('');
  const [radius, setRadius] = useState(10000);
  const [keyword, setKeyword] = useState('Reifenservice Werkstatt');
  
  // Results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignToMe, setAssignToMe] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setResults([]);
    setSelectedIds(new Set());

    try {
      const response = await fetch('/api/sales/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: searchLocation,
          radius,
          keyword
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Fehler bei der Suche');
    } finally {
      setSearching(false);
    }
  };

  const toggleSelection = (placeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId);
    } else {
      newSelected.add(placeId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === results.filter(r => !r.isExisting).length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(results.filter(r => !r.isExisting).map(r => r.googlePlaceId));
      setSelectedIds(newSelected);
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      alert('Bitte wählen Sie mindestens einen Prospect aus');
      return;
    }

    setImporting(true);

    try {
      const response = await fetch('/api/sales/import-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeIds: Array.from(selectedIds),
          assignToMe,
          autoEnrich
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Import erfolgreich!\n\nImportiert: ${data.summary.imported}\nÜbersprungen: ${data.summary.skipped}\nFehler: ${data.summary.errors}`);
        
        // Clear selection and reload results
        setSelectedIds(new Set());
        handleSearch(new Event('submit') as any);
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Fehler beim Import');
    } finally {
      setImporting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Werkstätten suchen</h1>
              <p className="mt-1 text-sm text-gray-600">
                Finden Sie neue Werkstätten über Google Places
              </p>
            </div>
            <Link
              href="/sales"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ort / PLZ / Adresse
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="z.B. 10115 Berlin oder München"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Umkreis (km)
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="5000">5 km</option>
                  <option value="10000">10 km</option>
                  <option value="25000">25 km</option>
                  <option value="50000">50 km</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suchbegriff (optional)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="z.B. Reifenservice, Autowerkstatt, KFZ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Suche läuft...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Suchen
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {results.length} Werkstätten gefunden
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedIds.size} ausgewählt
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={assignToMe}
                      onChange={(e) => setAssignToMe(e.target.checked)}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    Mir zuweisen
                  </label>
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={autoEnrich}
                      onChange={(e) => setAutoEnrich(e.target.checked)}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    Details automatisch laden
                  </label>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {selectedIds.size === results.filter(r => !r.isExisting).length ? 'Alle abwählen' : 'Alle auswählen'}
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selectedIds.size === 0 || importing}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Importiere...' : `${selectedIds.size} Importieren`}
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {results.map((result) => (
                <div
                  key={result.googlePlaceId}
                  className={`p-6 hover:bg-gray-50 ${result.isExisting ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(result.googlePlaceId)}
                      onChange={() => toggleSelection(result.googlePlaceId)}
                      disabled={result.isExisting}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-30"
                    />

                    {result.photoUrls.length > 0 && (
                      <img
                        src={result.photoUrls[0]}
                        alt={result.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {result.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{result.address}</p>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            {result.rating && (
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm text-gray-700">
                                  {result.rating} ({result.reviewCount})
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-700">Lead Score:</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                result.leadScore >= 75 ? 'bg-green-100 text-green-800' :
                                result.leadScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.leadScore}/100
                              </span>
                            </div>
                          </div>
                        </div>

                        {result.isExisting && (
                          <Link
                            href={`/admin/sales/prospects/${result.existingId}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Bereits vorhanden
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searching && results.length === 0 && searchLocation && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Ergebnisse</h3>
            <p className="mt-1 text-sm text-gray-500">
              Versuchen Sie eine andere Suche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
