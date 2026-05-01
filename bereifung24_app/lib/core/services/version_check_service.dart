import 'dart:io' show Platform;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';

/// Checks the backend for the minimum / latest required app version
/// and shows an update dialog when needed.
///
/// Call once at app startup (after the splash, when a [BuildContext] is
/// available). Failures are silent — the app must never be blocked because
/// the version-check call failed.
class VersionCheckService {
  static bool _alreadyShown = false;

  static Future<void> check(BuildContext context) async {
    if (_alreadyShown) return;

    try {
      final info = await PackageInfo.fromPlatform();
      final installedVersion = info.version; // e.g. "1.0.12"
      final platform = Platform.isIOS
          ? 'ios'
          : Platform.isAndroid
              ? 'android'
              : null;
      if (platform == null) return; // web/desktop → skip

      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 4),
        receiveTimeout: const Duration(seconds: 4),
      ));
      final res = await dio.get(
        '${AppConfig.apiBaseUrl}/app/version-check',
        queryParameters: {
          'platform': platform,
          'version': installedVersion,
        },
      );

      final data = (res.data is Map) ? res.data as Map : <String, dynamic>{};
      final updateRequired = data['updateRequired'] == true;
      final updateAvailable = data['updateAvailable'] == true;
      final storeUrl = (data['storeUrl'] as String?) ?? '';
      final latest = (data['latestVersion'] as String?) ?? '';
      final message = (data['message'] as String?) ?? '';

      if (!context.mounted) return;
      if (storeUrl.isEmpty) return;

      if (updateRequired) {
        _alreadyShown = true;
        await _showDialog(
          context,
          forced: true,
          installedVersion: installedVersion,
          latestVersion: latest,
          customMessage: message,
          storeUrl: storeUrl,
        );
      } else if (updateAvailable) {
        _alreadyShown = true;
        await _showDialog(
          context,
          forced: false,
          installedVersion: installedVersion,
          latestVersion: latest,
          customMessage: message,
          storeUrl: storeUrl,
        );
      }
    } catch (e) {
      debugPrint('VersionCheckService failed (silently ignored): $e');
    }
  }

  static Future<void> _showDialog(
    BuildContext context, {
    required bool forced,
    required String installedVersion,
    required String latestVersion,
    required String customMessage,
    required String storeUrl,
  }) async {
    final title = forced ? 'Update erforderlich' : 'Update verfügbar';
    final defaultMsg = forced
        ? 'Diese App-Version wird nicht mehr unterstützt. '
            'Bitte aktualisiere auf die neueste Version, um fortzufahren.'
        : 'Eine neue Version ist verfügbar. Wir empfehlen das Update für '
            'die beste Erfahrung.';
    final body = customMessage.isNotEmpty ? customMessage : defaultMsg;

    await showDialog<void>(
      context: context,
      barrierDismissible: !forced,
      builder: (dialogCtx) {
        return PopScope(
          canPop: !forced,
          child: AlertDialog(
            title: Row(
              children: [
                Icon(
                  forced ? Icons.error_outline : Icons.system_update,
                  color: forced ? Colors.red : Colors.blue,
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(title)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(body),
                const SizedBox(height: 12),
                Text(
                  'Installiert: $installedVersion'
                  '${latestVersion.isNotEmpty ? '   ·   Neu: $latestVersion' : ''}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            actions: [
              if (!forced)
                TextButton(
                  onPressed: () => Navigator.of(dialogCtx).pop(),
                  child: const Text('Später'),
                ),
              FilledButton.icon(
                icon: const Icon(Icons.open_in_new),
                label: const Text('Jetzt aktualisieren'),
                onPressed: () async {
                  final uri = Uri.parse(storeUrl);
                  await launchUrl(
                    uri,
                    mode: LaunchMode.externalApplication,
                  );
                  // Forced: keep dialog open so user must update.
                  // Optional: dismiss after launching the store.
                  if (!forced && dialogCtx.mounted) {
                    Navigator.of(dialogCtx).pop();
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
