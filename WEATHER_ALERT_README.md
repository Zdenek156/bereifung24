# Wetter-basierte Reifenwechsel-Erinnerung

## Übersicht

Das System überwacht die Wettervorhersage und erinnert Kunden automatisch per Email an den Reifenwechsel, wenn die Temperatur einen eingestellten Schwellwert erreicht.

## Features

- 🌡️ **Temperatur-Überwachung**: Kunde wählt Schwellwert (z.B. 7°C)
- 📅 **Vorlaufzeit**: 1-7 Tage im Voraus benachrichtigen  
- 📧 **Email-Benachrichtigung**: Automatische Erinnerung
- 🔄 **Saisonale Begrenzung**: Nur einmal pro Saison (Winter/Sommer)
- 📍 **Standort**: Basiert auf Kundenadresse oder eigenem Standort
- 🎛️ **Dashboard-Widget**: Optional sichtbar auf der Startseite

## Setup

### 1. WeatherAPI.com API Key

Registrieren Sie sich auf [WeatherAPI.com](https://www.weatherapi.com/signup.aspx) und erhalten Sie einen kostenlosen API-Key.

**Vorteile von WeatherAPI.com:**
- ✅ 1 Million API-Calls pro Monat kostenlos
- ✅ Deutsche Übersetzungen verfügbar
- ✅ 7-Tage-Vorhersage im Free Tier
- ✅ Einfache API mit allen Daten in einem Call

Fügen Sie den Key zur `.env` hinzu:

```env
WEATHERAPI_KEY=your_api_key_here
```

### 2. Database Migration

Die Migration wurde bereits ausgeführt. Das neue `weather_alerts` Table wurde erstellt.

### 3. Cron Job für automatische Benachrichtigungen

Erstellen Sie einen Cron Job der täglich um 8:00 Uhr läuft:

```bash
# crontab -e
0 8 * * * cd /var/www/bereifung24 && /root/.nvm/versions/node/v20.11.0/bin/node scripts/check-weather-alerts.js >> /var/log/weather-alerts.log 2>&1
```

## Verwendung für Kunden

### Einstellungen

Kunden können die Wetter-Erinnerung unter `/dashboard/customer/weather-alert` konfigurieren:

1. **Aktivieren/Deaktivieren**: Ein/Ausschalten der Benachrichtigungen
2. **Temperatur-Schwelle**: z.B. 7°C (empfohlen)
3. **Vorlaufzeit**: 1-7 Tage im Voraus
4. **Dashboard anzeigen**: Widget auf Startseite ein/ausblenden
5. **Standort**: Standard-Adresse oder eigener Standort

### Dashboard Widget

Wenn aktiviert, sieht der Kunde auf seinem Dashboard:
- Aktuelle Temperatur
- Wettervorhersage für nächste Tage
- Empfehlung zum Reifenwechsel
- Wind & Luftfeuchtigkeit

## Technische Details

### Datenbank Schema

```prisma
model WeatherAlert {
  id String @id @default(cuid())
  customerId String @unique
  
  // Settings
  isEnabled Boolean @default(false)
  temperatureThreshold Int @default(7)
  daysInAdvance Int @default(3)
  showOnDashboard Boolean @default(true)
  
  // Season Tracking
  lastAlertSeason String? // WINTER_2024, SUMMER_2024
  lastAlertDate DateTime?
  
  // Location
  useCustomLocation Boolean @default(false)
  customZipCode String?
  customCity String?
  customLatitude Float?
  customLongitude Float?
}
```

### API Endpoints

- `GET /api/weather-alert/settings` - Einstellungen abrufen
- `POST /api/weather-alert/settings` - Einstellungen speichern
- `GET /api/weather-alert/current` - Aktuelle Wetterdaten für Widget

### Email Template

Die Email-Benachrichtigung wird mit dem bestehenden Email-System versendet und verwendet ein Template mit:
- Aktueller Temperatur
- Wettervorhersage
- Empfehlung zum Reifenwechsel
- Link zur Werkstatt-Suche

## Kosten

- **WeatherAPI.com Free Tier**: Bis 1 Million API-Calls/Monat kostenlos
- **Geschätzte Nutzung**: 
  - 1x täglich pro aktivem Kunden im Cron Job
  - 1-2x beim Dashboard-Load pro Kunde
  - Bei 100 aktiven Kunden: ~300 Calls/Tag = 9.000/Monat
  - Bei 500 aktiven Kunden: ~1.500 Calls/Tag = 45.000/Monat
- **Fazit**: Das Free Tier ist mehr als ausreichend für mehrere tausend Kunden!

## TODO

- [x] Database Schema
- [x] API Routes
- [x] Settings Page
- [x] Dashboard Widget
- [ ] Cron Job Script
- [ ] Email Template
- [ ] Dashboard Integration
- [ ] Testing

## WeatherAPI.comte

1. OpenWeatherMap API Key in `.env` hinzufügen
2. Cron Job einrichten
3. Email Template erstellen
4. Widget im Customer Dashboard integrieren
5. Navigation Link hinzufügen
