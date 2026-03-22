import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  /// Get current position with permission handling
  /// Returns null if location cannot be obtained.
  /// Sets [lastError] with a description of what went wrong.
  String? lastError;

  Future<Position?> getCurrentPosition() async {
    lastError = null;

    // Check if location services enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      lastError = 'GPS/Standortdienste sind deaktiviert';
      debugPrint('Location services disabled');
      return null;
    }

    // Check/request permission
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      debugPrint('Location permission denied, requesting...');
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        lastError = 'Standort-Berechtigung wurde abgelehnt';
        debugPrint('Location permission denied after request');
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      lastError = 'Standort-Berechtigung dauerhaft abgelehnt. Bitte in den Einstellungen aktivieren.';
      debugPrint('Location permission permanently denied');
      return null;
    }

    // Get position with timeout
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 15),
      );
    } catch (e) {
      lastError = 'Standort konnte nicht ermittelt werden: $e';
      debugPrint('Geolocator getCurrentPosition error: $e');
      return null;
    }
  }

  /// Calculate distance between two points in km
  double distanceBetween(
      double lat1, double lon1, double lat2, double lon2) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2) / 1000;
  }

  /// Open device location settings
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }

  /// Open app settings (for when permission is permanently denied)
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }
}
