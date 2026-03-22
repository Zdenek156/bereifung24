import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import '../network/api_client.dart';

/// Handle background FCM messages (must be a top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('FCM background message: ${message.messageId}');
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final _messaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();
  GoRouter? _router;

  /// Android notification channel
  static const _channel = AndroidNotificationChannel(
    'bereifung24_main',
    'Bereifung24 Benachrichtigungen',
    description: 'Benachrichtigungen für Buchungen und Updates',
    importance: Importance.high,
  );

  /// Initialize FCM — call after Firebase.initializeApp()
  Future<void> init({GoRouter? router}) async {
    _router = router;

    // Set up local notifications
    await _initLocalNotifications();

    // Request permission (iOS)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      await _registerToken();
      _listenToTokenRefresh();
      _listenToForegroundMessages();
    }

    // Set background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Handle notification taps when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a terminated state via notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  Future<void> _initLocalNotifications() async {
    // Create notification channel (Android)
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        // Handle tap on local notification
        final payload = response.payload;
        if (payload != null) {
          _navigateTo(payload);
        }
      },
    );
  }

  Future<void> _registerToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await ApiClient().saveFcmToken(token);
        debugPrint('FCM token registered: ${token.substring(0, 20)}...');
      }
    } catch (e) {
      debugPrint('FCM token registration failed: $e');
    }
  }

  void _listenToTokenRefresh() {
    _messaging.onTokenRefresh.listen((newToken) async {
      try {
        await ApiClient().saveFcmToken(newToken);
      } catch (_) {}
    });
  }

  void _listenToForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('FCM foreground: ${message.notification?.title}');

      final notification = message.notification;
      if (notification == null) return;

      // Build navigation payload from FCM data
      final route = _buildRoute(message.data);

      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            icon: '@mipmap/ic_launcher',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: route,
      );
    });
  }

  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    debugPrint('Notification tapped: $data');
    final route = _buildRoute(data);
    if (route != null) {
      _navigateTo(route);
    }
  }

  /// Build a GoRouter path from notification data
  String? _buildRoute(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    switch (type) {
      case 'booking':
      case 'booking_confirmation':
      case 'booking_reminder':
      case 'booking_update':
        return id != null ? '/bookings/$id' : '/bookings';
      case 'vehicle':
        return '/vehicles';
      case 'season_tip':
        return '/search';
      case 'review_prompt':
        return id != null ? '/review/$id' : '/bookings';
      default:
        return null;
    }
  }

  void _navigateTo(String route) {
    _router?.go(route);
  }

  /// Remove FCM token on logout
  Future<void> removeToken() async {
    try {
      await _messaging.deleteToken();
    } catch (_) {}
  }
}
