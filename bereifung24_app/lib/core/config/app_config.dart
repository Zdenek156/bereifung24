class AppConfig {
  static const String appName = 'Bereifung24';
  static const String baseUrl = 'https://bereifung24.de';
  static const String apiBaseUrl = '$baseUrl/api';

  // Stripe
  static const String stripePublishableKey =
      'pk_live_XXXXX'; // TODO: Set real key

  // Deep Link scheme
  static const String deepLinkScheme = 'bereifung24';
  static const String deepLinkHost = 'bereifung24.de';

  // Sentry
  static const String sentryDsn = ''; // TODO: Set Sentry DSN

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Cache
  static const Duration cacheTtl = Duration(minutes: 15);
}
