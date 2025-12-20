# Bereifung24 Mobile App

Die offizielle Flutter-Anwendung für Bereifung24 - Deutschlands erste digitale Reifenservice-Plattform.

## Features

### Authentifizierung
- E-Mail/Passwort Anmeldung
- Google Sign-In Integration (Firebase)
- Sichere Token-Verwaltung mit NextAuth

### Hauptfunktionen
- **Meine Anfragen**: Verwalten Sie Serviceanfragen für Reifen, Bremsen, Batterie und mehr
- **Termine**: Sehen Sie bevorstehende Buchungen und Termine
- **Fahrzeuge**: Verwalten Sie Ihre Fahrzeugprofile (Auto & Motorrad)
- **Einstellungen**: Konto- und Benachrichtigungseinstellungen

### Services
Die App unterstützt alle Bereifung24 Services:
- 🚗 Reifenwechsel (Auto & Motorrad)
- 🔧 Bremsservice
- ⚙️ Achsvermessung
- ❄️ Klimaservice
- 🔋 Batteriewechsel
- ♻️ Altreifenentsorgung

### Onboarding
- 3-Screen Onboarding-Flow
- Einführung in die Bereifung24-Plattform

### Push-Benachrichtigungen
- Benachrichtigungen bei neuen Angeboten
- Erinnerung zur Bewertungsabgabe (1 Tag nach Termin)
- Konfigurierbar in den Einstellungen

## Projektstruktur

```
lib/
├── core/
│   ├── constants/      # App-Konstanten
│   ├── theme/          # Theme und Farben
│   └── router/         # Navigation
├── features/
│   ├── onboarding/     # Onboarding-Screens
│   ├── auth/           # Authentifizierung
│   ├── requests/       # Anfragenverwaltung
│   ├── appointments/   # Terminverwaltung
│   ├── vehicles/       # Fahrzeugverwaltung
│   └── settings/       # Einstellungen
├── models/             # Datenmodelle
├── services/           # API und Services
│   ├── api_service.dart
│   ├── auth_service.dart
│   └── notification_service.dart
└── main.dart
```

## Technologie-Stack

- **Framework**: Flutter 3.35.6
- **State Management**: Riverpod
- **HTTP Client**: Dio
- **Firebase**: Auth, Cloud Messaging
- **Google Sign-In**: google_sign_in
- **Lokale Speicherung**: shared_preferences

## Installation & Setup

### Voraussetzungen
- Flutter SDK 3.35.6 oder höher
- Dart 3.9.2 oder höher
- Android Studio / Xcode für Entwicklung
- Firebase Projekt (für Auth und Push Notifications)

### Schritt 1: Dependencies installieren
```bash
flutter pub get
```

### Schritt 2: Firebase Setup

#### Android
1. Fügen Sie `google-services.json` zu `android/app/` hinzu
2. Konfigurieren Sie `android/build.gradle` für Firebase
3. Aktivieren Sie Firebase Authentication und Cloud Messaging in der Firebase Console

#### iOS
1. Fügen Sie `GoogleService-Info.plist` zu `ios/Runner/` hinzu
2. Konfigurieren Sie `ios/Runner/Info.plist` für Firebase
3. Aktivieren Sie Push Notifications in Xcode

### Schritt 3: API Konfiguration
Die App ist bereits für die Bereifung24 API konfiguriert:
```dart
static const String apiBaseUrl = 'https://bereifung24.de/api';
```

Für lokale Entwicklung können Sie dies in `lib/core/constants/app_constants.dart` auf Ihre lokale API ändern.

### Schritt 4: App Icon konfigurieren
1. Platzieren Sie das B24 App Icon in `assets/icons/icon.png`
2. Führen Sie aus:
```bash
flutter pub run flutter_launcher_icons
```

## App ausführen

### Debug Mode
```bash
flutter run
```

### Build für Produktion

#### Android
```bash
flutter build apk --release
# oder
flutter build appbundle --release
```

#### iOS
```bash
flutter build ios --release
```

## API Endpunkteder Bereifung24 NextJS API:

### Auth (NextAuth)
- `POST /auth/signin` - E-Mail/Passwort Login
- `POST /auth/signup` - Registrierung
- `POST /auth/google` - Google Sign-In

### Anfragen (Tire Requests)
- `GET /customer/requests` - Alle Anfragen des Kunden
- `POST /tire-requests` - Neue Anfrage erstellen
- `GET /tire-requests/:id` - Anfrage-Details
- `GET /tire-requests/:id/offers` - Angebote für Anfrage

### Termine (Bookings)
- `GET /customer/bookings` - Alle Buchungen
- `GET /bookings/:id` - Buchungs-Details
- `POST /offers/:id/accept` - Angebot annehmen

### Fahrzeuge
- `GET /customer/vehicles` - Alle Fahrzeuge
- `POST /vehicles` - Fahrzeug hinzufügen
- `PUT /vehicles/:id` - Fahrzeug aktualisieren
- `DELETE /vehicles/:id` - Fahrzeug löschen

### Bewertungen (Reviews)
- `POST /review
### Bewertungen
- `POST /ratings` - Beoffiziellen Bereifung24 Markenfarben:
- **Primär**: Dunkelblau (#1E40AF / primary-600)
- **Sekundär**: Orange (#F59E0B / amber-500)
- **Hintergrund**: Hellgrau (#F5F5F5)

**Logo**: B24 in einem blauen Kreis
**Slogan**: "Deutschlands digitale Reifenservice-Plattform"
Die App verwendet die Bereifung24 Markenfarben:
- **Primär**: Blau (#1E88E5)
- **Sekundär**: Orange (#FF9800)
- **Hintergrund**: Hellgrau (#F5F5F5)

## Push-Benachrichtigungen

### Typen
1. **Angebot erhalten**: Wenn eine Werkstatt ein Angebot einreicht
2. **Bewertungserinnerung**: 1 Tag nach Terminabschluss

### Konfiguration
Benutzer können Benachrichtigungen in den Einstellungen aktivieren/deaktivieren.

## Entwicklung

### Code-Stil
- Folgen Sie den Flutter/Dart Style Guidelines
- Verwenden Sie `flutter analyze` vor dem Commit
- Formatieren Sie Code mit `flutter format .`

### Testing (google-services.json & GoogleService-Info.plist)
- [ ] API Session/Cookie Management mit NextAuth testen
- [ ] Request Creation Flow mit allen Service-Typen implementieren
- [ ] Fahrzeug-Management mit Auto & Motorrad Support
- [ ] Offers-Liste und Vergleichs-UI
- [ ] Booking-Details mit Google Calendar Integration
- [ ] Bewertungssystem mit Rating UI
- [ ] Deep-Links für Push-Benachrichtigungen
- [ ] Offline-Support mit lokaler Datenbank (sqflite)
- [ ] Unit und Widget Tests
- [ ] Integration Tests
- [ ] App Store / Play Store Assets (Screenshots, Beschreibung)
- [ ] B24 App Icon Desiglow implementieren
- [ ] Fahrzeug-Management komplett implementieren
- [ ] Bewertungssystem implementieren
- [ ] Deep-Links für Push-Benachrichtigungen
- [ ] Offline-Support mit lokaler Speicherung
**Kontakt:**
- E-Mail: info@bereifung24.de
- Telefon: 0176-45676614
- Website: https://bereifung24.de

**Betreiber:**
Zdenek Kyzlink  
Jahnstraße 2  
71706 Markgröningen
- [ ] Integration Tests
- [ ] App Store / Play Store Metadaten

## Lizenz

© 2025 Bereifung24. Alle Rechte vorbehalten.

## Support

Bei Fragen oder Problemen kontaktieren Sie das Entwicklungsteam.
