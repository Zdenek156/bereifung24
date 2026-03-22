import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import '../config/app_config.dart';

class CrashReportingService {
  static final CrashReportingService _instance =
      CrashReportingService._internal();
  factory CrashReportingService() => _instance;
  CrashReportingService._internal();

  /// Initialize Sentry — call BEFORE runApp()
  /// Usage in main():
  /// ```dart
  /// await SentryFlutter.init(
  ///   (options) {
  ///     options.dsn = AppConfig.sentryDsn;
  ///     options.environment = kDebugMode ? 'development' : 'production';
  ///     options.tracesSampleRate = 0.3;
  ///   },
  ///   appRunner: () => runApp(const ProviderScope(child: Bereifung24App())),
  /// );
  /// ```

  /// Report an error
  Future<void> reportError(
    dynamic exception,
    StackTrace? stackTrace, {
    String? context,
  }) async {
    if (kDebugMode) {
      debugPrint('Error [$context]: $exception');
      if (stackTrace != null) debugPrint(stackTrace.toString());
      return;
    }

    await Sentry.captureException(
      exception,
      stackTrace: stackTrace,
      hint: context != null ? Hint.withMap({'context': context}) : null,
    );
  }

  /// Set user context for crash reports
  void setUser(String userId, String email) {
    Sentry.configureScope((scope) {
      scope.setUser(SentryUser(id: userId, email: email));
    });
  }

  /// Clear user on logout
  void clearUser() {
    Sentry.configureScope((scope) {
      scope.setUser(null);
    });
  }

  /// Add breadcrumb for debugging
  void addBreadcrumb(String message, {String? category}) {
    Sentry.addBreadcrumb(Breadcrumb(
      message: message,
      category: category ?? 'app',
      timestamp: DateTime.now(),
    ));
  }
}
