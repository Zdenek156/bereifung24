# B24 Splash-Screen (Flutter)

Animierter Startbildschirm mit echten Logo-Assets:
- **Reifenspur** fährt von links ins Bild
- **B24** erscheint mit Pop-Effekt

## Assets

Die drei Bilder liegen in `assets/splash/`:
- `B24_Logo blau.png` – komplettes Logo (optional nutzbar)
- `Logo_Ausschnitt_Reifenspur.png` – Reifenspur für die Animation
- `Logo_Ausschnitt_B24.png` – Text „B24“

## Projekt ausführen

```bash
cd flutter_splash
flutter pub get
flutter run
```

Falls noch keine Plattform-Ordner (android/, ios/) existieren:

```bash
flutter create . --project-name flutter_splash
flutter run
```

## In bestehende App einbinden

1. **Assets kopieren:** Ordner `assets/splash/` in dein Flutter-Projekt übernehmen (oder Pfad anpassen).
2. **pubspec.yaml:** Unter `flutter.assets` eintragen:
   ```yaml
   assets:
     - assets/splash/
   ```
3. **SplashScreen einbauen:** Datei `lib/splash_screen.dart` in dein Projekt kopieren.
4. **Als Startseite nutzen:** In `main.dart` (oder deiner ersten Route):
   ```dart
   home: SplashScreen(
     duration: const Duration(milliseconds: 2200),
     onComplete: (context) {
       Navigator.of(context).pushReplacement(
         MaterialPageRoute(builder: (_) => DeinHomeScreen()),
       );
     },
   ),
   ```

## Anpassungen

- **Dauer:** `duration` in `SplashScreen(duration: ...)` ändern.
- **Position/Größe:** In `splash_screen.dart` die Faktoren bei `size.width * 0.45` bzw. `Offset(size.width * 0.22, 0)` anpassen.
