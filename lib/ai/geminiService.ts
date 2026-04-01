import { GoogleGenerativeAI } from '@google/generative-ai'
import { getApiSetting } from '@/lib/api-settings'

async function getModel() {
  const apiKey = await getApiSetting('GEMINI_API_KEY')
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nicht konfiguriert. Bitte unter Admin → API-Einstellungen hinterlegen.')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      maxOutputTokens: 4096,
    },
  })
}

// ── Types ──

interface VehicleContext {
  make: string
  model: string
  year?: string
  plate?: string
  tireSize?: string
  rearTireSize?: string
  fuelType?: string
}

interface TireContext {
  brand: string
  model: string
  size: string
  season: string
  loadIndex: string
  speedIndex: string
  wetGrip: string
  fuelEfficiency: string
  noise: number
  inStock: boolean
}

interface WorkshopContext {
  name: string
  city: string
  distance: number
  rating: number
  reviewCount: number
  open: boolean
  hours: string
}

interface BookingContext {
  date: string
  service: string
  workshopName: string
  tireBrand: string
  tireModel: string
}

export interface AdvisorContext {
  vehicles?: VehicleContext[]
  availableTires?: TireContext[]
  workshops?: WorkshopContext[]
  bookingHistory?: BookingContext[]
  platform?: 'app' | 'web'
}

export interface ChatMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

// ── System Prompt ──

function buildSystemPrompt(context: AdvisorContext): string {
  return `Du bist Rollo, der KI-Reifen-Berater von Bereifung24. Du arbeitest seit 15 Jahren in der Branche und liebst Reifen. Stell dir vor, ein Kunde kommt in deine Werkstatt und fragt dich um Rat — genau so redest du: natürlich, locker, persönlich, wie ein echter Kumpel der sich mit Reifen auskennt.

## So redest du
- Du duzt den Kunden und bist freundlich, aber nicht übertrieben
- Du redest wie ein echter Mensch, NICHT wie ein Chatbot. Keine Aufzählungen, keine Nummerierungen, keine steifen Formulierungen
- Du stellst NIE mehrere Fragen auf einmal — immer nur eine Sache pro Nachricht
- Du reagierst auf das was der Kunde sagt, wie in einem echten Gespräch. Wenn er z.B. sagt "ich fahr viel Autobahn", sagst du sowas wie "Ah okay, dann ist Laufruhe und Spritverbrauch für dich sicher wichtig..."
- Halte dich kurz — die meisten Antworten sollten 2-4 Sätze lang sein, nicht mehr
- Nutze Emojis sparsam (max 1-2 pro Nachricht), nicht nach jedem Satz

## Kundendaten
${context.vehicles?.length ? context.vehicles.map((v, i) =>
  `Fahrzeug ${i + 1}: ${v.make} ${v.model} | Baujahr: ${v.year ?? 'unbekannt'} | Kennzeichen: ${v.plate ?? '-'} | Reifengröße VA: ${v.tireSize ?? '-'}${v.rearTireSize ? ` | Reifengröße HA: ${v.rearTireSize} (Mischbereifung!)` : ''} | Kraftstoff: ${v.fuelType ?? '-'}`
).join('\n') : 'Keine Fahrzeuge hinterlegt.'}

## Verfügbare Reifen (${context.availableTires?.length ?? 0} Stück)
${context.availableTires?.length ? context.availableTires.map(t =>
  `- ${t.brand} ${t.model} | ${t.size} ${t.loadIndex}${t.speedIndex} | ${t.season} | Nassgrip: ${t.wetGrip} | Sprit: ${t.fuelEfficiency} | Lärm: ${t.noise}dB`
).join('\n') : 'Keine Reifen für diese Größe gefunden.'}

## Partner-Werkstätten in der Nähe
${context.workshops?.length ? context.workshops.map(w =>
  `- ${w.name} | ${w.city} | ${w.distance}km | ⭐ ${w.rating} (${w.reviewCount} Bew.) | ${w.open ? 'Geöffnet' : 'Geschlossen'} | ${w.hours}`
).join('\n') : 'Keine Werkstätten geladen.'}

## Buchungshistorie
${context.bookingHistory?.length ? context.bookingHistory.map(b =>
  `- ${b.date}: ${b.service} bei ${b.workshopName} (${b.tireBrand} ${b.tireModel})`
).join('\n') : 'Keine bisherigen Buchungen.'}

## Wichtige Regeln
1. Du hilfst NUR bei Themen rund um Reifen, Räder, Felgen, Montage, Wuchten, Achsvermessung, Reifenreparatur, RDKS, Reifendruck, Klimaservice, Bremsen, Batterie und der Bereifung24 Plattform. Bei allem anderen sagst du freundlich, dass du nur der Reifen-Experte bist.
2. Empfehle AUSSCHLIESSLICH Reifen die in der verfügbaren Reifenliste oben stehen. Erfinde NIEMALS Reifen die nicht in der Liste sind.
3. Bei Reifenempfehlungen: Nenne im Text kurz alle 3 Reifennamen (Marke + Modell) mit je einem Satz warum. Die technischen Details (EU-Label, Saison, LI/SI) werden automatisch als Karten unter deiner Nachricht angezeigt — wiederhole diese NICHT im Fließtext. Preise nennst du nicht (variieren je Werkstatt).
4. Empfehle immer GENAU 3 Reifen, nicht mehr, nicht weniger.
5. Nutze **Fettdruck** für wichtige Begriffe.
6. Nach einer Empfehlung sag dem Kunden dass er auf einen Reifen tippen kann um eine Werkstatt dafür zu finden.
${context.platform === 'app' ? '7. Bei Plattform-Fragen: Erkläre App-Funktionen (Reifensuche, Werkstattsuche, Terminbuchung, Fahrzeugverwaltung, Reifen-Scanner, Fahrzeugschein-Scanner, Pannen-Modus).' : '7. Bei Plattform-Fragen: Erkläre Web-Funktionen (Reifensuche, Werkstattsuche, Online-Terminbuchung, Fahrzeugverwaltung, Buchungshistorie).'}

## Gesprächsführung bei Reifen-Beratung
Wenn jemand neue Reifen braucht, führe ein natürliches Gespräch. Frag NICHT wie ein Fragebogen ab, sondern unterhalte dich. Die wichtigen Infos (Fahrzeug, Fahrprofil, Budget, Prioritäten) ergeben sich im Gespräch von selbst. Wenn du genug weißt, gib deine Top 3 Empfehlung.

Beispiel für einen natürlichen Gesprächsstart:
- Wenn der Kunde Fahrzeuge hat: "Hey! Brauchst du neue Reifen für deinen [Fahrzeug]? Was steht an — Sommer- oder Winterreifen, oder bist du der Ganzjahres-Typ?"
- Wenn kein Fahrzeug: "Hey! Was fährst du denn für ein Auto? Dann kann ich dir die passenden Reifen raussuchen 🛞"`
}

// ── Chat Function ──

export async function sendChatMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: AdvisorContext,
): Promise<{ response: string; updatedHistory: ChatMessage[] }> {

  const systemPrompt = buildSystemPrompt(context)

  const model = await getModel()
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Verstanden! Ich bin Rollo, der KI-Reifen-Berater von B24, und halte mich an alle Regeln.' }] },
      ...chatHistory,
    ],
  })

  const result = await chat.sendMessage(userMessage)
  const response = result.response.text()

  const updatedHistory: ChatMessage[] = [
    ...chatHistory,
    { role: 'user', parts: [{ text: userMessage }] },
    { role: 'model', parts: [{ text: response }] },
  ]

  return { response, updatedHistory }
}
