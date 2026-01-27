'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Award, ArrowRight } from 'lucide-react';

export default function TireAdvisorWidget() {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">🎯 Smart Reifen-Berater</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Intelligente Empfehlungen basierend auf 125.000+ EU-zertifizierten Reifen
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">100-Punkte System</div>
                <div className="text-xs text-gray-600">Objektive Bewertung nach EU-Label</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
              <Award className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Personalisiert</div>
                <div className="text-xs text-gray-600">Basierend auf Ihrem Nutzungsprofil</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Top 5 Empfehlungen</div>
                <div className="text-xs text-gray-600">Mit detaillierter Begründung</div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="p-4 bg-white rounded-lg border border-blue-100">
            <p className="text-sm text-gray-700 leading-relaxed">
              Unser neuer intelligenter Reifen-Berater analysiert über <strong>125.000 Reifen</strong> aus der 
              offiziellen EU-EPREL-Datenbank und findet die perfekten Reifen für Ihr Fahrzeug und Ihre Bedürfnisse.
            </p>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                <span>4-Stufen Wizard für präzise Empfehlungen</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                <span>EU-Label Daten: Kraftstoff, Nasshaftung, Geräusch</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                <span>Berücksichtigt Fahrstil, Nutzung und Ihre Prioritäten</span>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <Link
            href="/smart-tire-advisor"
            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <Sparkles className="h-5 w-5" />
            Jetzt passende Reifen finden
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          <p className="text-xs text-center text-gray-500">
            Kostenlos • Keine Registrierung erforderlich • Dauert nur 2 Minuten
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
