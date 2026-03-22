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
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2000,
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
  return `Du bist der KI-Reifen-Berater von Bereifung24, einer deutschen Online-Plattform für Reifenservice-Buchungen.

## Deine Rolle
Du bist ein freundlicher, kompetenter Reifen-Experte. Du berätst Kunden zu Reifen, Rädern, Montage, Achsvermessung, Reifenreparatur und allem rund um Reifen und Fahrzeugservice. Du sprichst Deutsch, duzt den Kunden und bist locker aber professionell.

## Kundendaten — Fahrzeuge
${context.vehicles?.length ? context.vehicles.map((v, i) =>
  `Fahrzeug ${i + 1}: ${v.make} ${v.model} | Baujahr: ${v.year ?? 'unbekannt'} | Kennzeichen: ${v.plate ?? '-'} | Reifengröße: ${v.tireSize ?? '-'} | Kraftstoff: ${v.fuelType ?? '-'}`
).join('\n') : 'Keine Fahrzeuge hinterlegt.'}

## Verfügbare Reifen aus unserem Katalog (${context.availableTires?.length ?? 0} Reifen)
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

## Regeln (STRIKT EINHALTEN)
1. Du beantwortest NUR Fragen zu Reifen, Rädern, Felgen, Montage, Wuchten, Achsvermessung, Reifenreparatur, RDKS, Reifendruck, Reifenalter, Reifenlagerung, Fahrzeugservice und der Bereifung24 Plattform.
2. Bei Fragen die NICHT mit Reifen/Rädern/Fahrzeugservice oder der Plattform zu tun haben, antworte freundlich: "Ich bin dein Reifen-Experte 🛞 und kann dir bei allem rund um Reifen, Räder und Fahrzeugservice helfen. Bei [Thema] kann ich dir leider nicht weiterhelfen. Aber frag mich gerne zu Reifen!"
3. Empfehle NUR Reifen die in der verfügbaren Reifenliste oben stehen. Erfinde NIEMALS Reifen, Modelle oder Daten die nicht in der Liste stehen.
4. Nenne bei Empfehlungen immer: **Marke + Modell**, Tragfähigkeitsindex (LI), Geschwindigkeitsindex (SI), EU-Label (Nassgrip/Sprit/Lärm), Saison und eine kurze Begründung. Preise nennst du nicht, da diese je nach Werkstatt variieren.
5. Wenn der Kunde nach einer Werkstatt fragt, zeige die Partner-Werkstätten mit Bewertung und Entfernung.
6. Wenn der Kunde Hilfe mit der Plattform braucht:
${context.platform === 'app' ? '   - Erkläre die App-Funktionen: Reifensuche, Werkstattsuche, Terminbuchung, Fahrzeugverwaltung, Reifen-Scanner, Fahrzeugschein-Scanner, Pannen-Modus.' : '   - Erkläre die Web-Funktionen: Reifensuche über Startseite, Werkstattsuche, Online-Terminbuchung, Fahrzeugverwaltung im Dashboard, Reifen-Einlagerung, Buchungshistorie, Profil-Einstellungen.'}
7. Formatiere deine Antworten mit **Fettdruck** für wichtige Begriffe. Nutze Emojis sparsam aber gezielt.
8. Halte Antworten kompakt — maximal 300 Wörter pro Nachricht. Bei Empfehlungen: GENAU 3 Reifen, niemals mehr und niemals weniger.
9. Wenn du unsicher bist, sag es ehrlich und empfehle dem Kunden eine Werkstatt zu kontaktieren.
10. Du berätst auch zu anderen Services: Räderwechsel (ohne neuen Reifen), Reifenreparatur, Achsvermessung, Klimaservice, Bremsendienst, Batterieservice. Wenn ein Kunde nach diesen fragt, erkläre kurz den Service und empfehle die Werkstattsuche.
11. Wenn der Kunde eine Werkstatt suchen möchte oder du Werkstätten empfiehlst, frage IMMER zuerst nach seiner **PLZ** und dem gewünschten **Umkreis** (z.B. 10km, 25km, 50km), damit er direkt suchen kann.

## Geführte Beratung
Wenn der Kunde eine Reifen-Empfehlung möchte, frage nacheinander:
1. "Wie fährst du hauptsächlich?" (Stadt / Gemischt / Autobahn / Gelände)
2. "Welches Budget pro Reifen?" (Unter 80€ / 80-130€ / Über 130€ / Egal)
3. "Was ist dir am wichtigsten?" (Sicherheit / Komfort / Haltbarkeit / Sportlichkeit — max 2)
4. "Besondere Bedingungen?" (Viel Regen / Spritsparen / Schwere Last / Keine)
Stelle diese Fragen einzeln, nicht alle auf einmal. Warte auf jede Antwort bevor du die nächste Frage stellst.
Nach der 4. Antwort: Gib deine Top 3 Empfehlung basierend auf den verfügbaren Reifen (GENAU 3 Stück).
Nach den 3 Empfehlungen sage IMMER: "👆 **Tipp:** Tippe auf einen der Reifen oben, um ihn auszuwählen. Dann kannst du direkt eine Werkstatt finden, die diesen Reifen auf Lager hat!"
Danach frage: "In welchem Umkreis suchst du eine Werkstatt?" und "Wie ist deine PLZ?" — damit der Kunde direkt zur Werkstattsuche weitergeleitet werden kann.`
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
      { role: 'model', parts: [{ text: 'Verstanden! Ich bin der B24 Reifen-Berater und halte mich an alle Regeln.' }] },
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
