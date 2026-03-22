import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();
  factory AnalyticsService() => _instance;
  AnalyticsService._internal();

  FirebaseAnalytics? _analytics;

  FirebaseAnalytics? get _instance2 {
    try {
      _analytics ??= FirebaseAnalytics.instance;
    } catch (_) {}
    return _analytics;
  }

  NavigatorObserver get observer {
    final a = _instance2;
    if (a != null) {
      return FirebaseAnalyticsObserver(analytics: a);
    }
    return NavigatorObserver();
  }

  /// Log screen view
  Future<void> logScreenView(String screenName) async {
    try {
      await _instance2?.logScreenView(screenName: screenName);
    } catch (e) {
      debugPrint('Analytics logScreenView error: $e');
    }
  }

  /// Log login event
  Future<void> logLogin(String method) async {
    try {
      await _instance2?.logLogin(loginMethod: method);
    } catch (e) {
      debugPrint('Analytics logLogin error: $e');
    }
  }

  /// Log sign up event
  Future<void> logSignUp(String method) async {
    try {
      await _instance2?.logSignUp(signUpMethod: method);
    } catch (e) {
      debugPrint('Analytics logSignUp error: $e');
    }
  }

  /// Log search event
  Future<void> logSearch(String term) async {
    try {
      await _instance2?.logSearch(searchTerm: term);
    } catch (e) {
      debugPrint('Analytics logSearch error: $e');
    }
  }

  /// Log booking created
  Future<void> logBookingCreated({
    required String workshopId,
    required String serviceType,
  }) async {
    try {
      await _instance2?.logEvent(
        name: 'booking_created',
        parameters: {
          'workshop_id': workshopId,
          'service_type': serviceType,
        },
      );
    } catch (e) {
      debugPrint('Analytics logBookingCreated error: $e');
    }
  }

  /// Log booking cancelled
  Future<void> logBookingCancelled(String bookingId) async {
    try {
      await _instance2?.logEvent(
        name: 'booking_cancelled',
        parameters: {'booking_id': bookingId},
      );
    } catch (e) {
      debugPrint('Analytics logBookingCancelled error: $e');
    }
  }

  /// Log payment completed
  Future<void> logPaymentCompleted(double amount, String currency) async {
    try {
      await _instance2?.logPurchase(
        value: amount,
        currency: currency,
      );
    } catch (e) {
      debugPrint('Analytics logPaymentCompleted error: $e');
    }
  }

  /// Log workshop viewed
  Future<void> logWorkshopViewed(String workshopId) async {
    try {
      await _instance2?.logEvent(
        name: 'workshop_viewed',
        parameters: {'workshop_id': workshopId},
      );
    } catch (e) {
      debugPrint('Analytics logWorkshopViewed error: $e');
    }
  }

  /// Set user properties
  Future<void> setUserId(String userId) async {
    try {
      await _instance2?.setUserId(id: userId);
    } catch (e) {
      debugPrint('Analytics setUserId error: $e');
    }
  }

  /// Custom event
  Future<void> logEvent(String name,
      {Map<String, Object>? parameters}) async {
    try {
      await _instance2?.logEvent(name: name, parameters: parameters);
    } catch (e) {
      debugPrint('Analytics logEvent error: $e');
    }
  }
}
