import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';

/// Remote debug logger — sends log entries to the server for
/// diagnosing issues on tester devices (especially iOS).
/// Logs are also printed locally via debugPrint.
class RemoteLogger {
  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 5),
  ));

  static String? _device;

  /// Log a debug message to the server.
  /// [tag] groups logs (e.g. 'stripe', 'auth').
  /// [data] is optional structured data.
  static Future<void> log(
    String tag,
    String message, {
    String level = 'info',
    Map<String, dynamic>? data,
  }) async {
    // Always print locally
    debugPrint('[$tag] $message${data != null ? ' $data' : ''}');

    try {
      _device ??= '${Platform.operatingSystem} ${Platform.operatingSystemVersion}';

      // Fire and forget — don't await to avoid blocking the app flow
      _dio.post(
        '${AppConfig.apiBaseUrl}/mobile-debug',
        data: {
          'device': _device,
          'platform': Platform.operatingSystem,
          'appVersion': '1.0.1+2',
          'level': level,
          'tag': tag,
          'message': message,
          'data': data,
        },
      ).catchError((_) {});
    } catch (e) {
      // Silently ignore — logging should never crash the app
      debugPrint('[RemoteLogger] Failed to send: $e');
    }
  }

  /// Shorthand for error-level logs
  static Future<void> error(String tag, String message, {Map<String, dynamic>? data}) {
    return log(tag, message, level: 'error', data: data);
  }
}
