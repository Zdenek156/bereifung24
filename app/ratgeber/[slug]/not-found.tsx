import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-12 text-center">
        <FileQuestion className="h-24 w-24 mx-auto text-gray-400 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Artikel nicht gefunden</h1>
        <p className="text-xl text-gray-600 mb-8">
          Der von Ihnen gesuchte Artikel existiert nicht oder wurde entfernt.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="default">
            <Link href="/ratgeber">
              Zurück zur Übersicht
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              Zur Startseite
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 pt-8 border-t">
          <h2 className="font-bold text-lg mb-4">Beliebte Themen</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/ratgeber?category=wartung-pflege" className="px-4 py-2 bg-gray-100 hover:bg-cyan-100 rounded-full text-sm transition-colors">
              🔧 Wartung & Pflege
            </Link>
            <Link href="/ratgeber?category=saisonales" className="px-4 py-2 bg-gray-100 hover:bg-cyan-100 rounded-full text-sm transition-colors">
              ❄️ Saisonales
            </Link>
            <Link href="/ratgeber?category=kosten" className="px-4 py-2 bg-gray-100 hover:bg-cyan-100 rounded-full text-sm transition-colors">
              💰 Kosten & Sparen
            </Link>
            <Link href="/ratgeber?category=recht" className="px-4 py-2 bg-gray-100 hover:bg-cyan-100 rounded-full text-sm transition-colors">
              ⚖️ Recht & Sicherheit
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
