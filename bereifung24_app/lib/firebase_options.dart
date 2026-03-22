import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;

/// Placeholder Firebase configuration.
/// Replace with real values from `flutterfire configure` before release.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('Platform not supported');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBAmsdjiALUt-3lUJ4SfKLFgmRTcSt7Dng',
    appId: '1:609460599361:android:5943bf6e09c7f67d6d64c0',
    messagingSenderId: '609460599361',
    projectId: 'bereifung24-app',
    storageBucket: 'bereifung24-app.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDiQITvt5pqOKEHMY7Og-38pM88F7PRtoY',
    appId: '1:609460599361:ios:f75d2dbfdb5512286d64c0',
    messagingSenderId: '609460599361',
    projectId: 'bereifung24-app',
    storageBucket: 'bereifung24-app.firebasestorage.app',
    iosBundleId: 'de.bereifung24.bereifung24App',
  );
}
