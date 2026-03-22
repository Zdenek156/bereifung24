import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Deep link handler for bereifung24://
/// Supports:
///   - bereifung24://workshop/{id} → Workshop detail
///   - bereifung24://booking/{id} → Booking detail
///   - bereifung24://search?q={query} → Search
class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;
  GoRouter? _router;

  /// Initialize deep link listener — call once in main
  void init({required GoRouter router}) {
    _router = router;

    // Handle initial deep link (cold start)
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) _handleUri(uri);
    });

    // Listen for incoming links (warm start)
    _sub = _appLinks.uriLinkStream.listen(_handleUri);
  }

  void _handleUri(Uri uri) {
    // Custom scheme: bereifung24://workshop/123
    if (uri.scheme == 'bereifung24') {
      _handleDeepLink(uri);
    } else if (uri.host.contains('bereifung24.de')) {
      // Universal link: https://www.bereifung24.de/werkstatt/123
      _handleUniversalLink(uri);
    }
  }

  /// Handle a deep link URI and navigate accordingly
  void _handleDeepLink(Uri uri) {
    final segments = uri.pathSegments;

    if (segments.isEmpty) {
      _router?.go('/home');
      return;
    }

    switch (segments.first) {
      case 'workshop':
        if (segments.length > 1) {
          _router?.push('/search/workshop/${segments[1]}');
        }
        break;
      case 'booking':
        if (segments.length > 1) {
          _router?.push('/bookings/${segments[1]}');
        }
        break;
      case 'search':
        _router?.go('/search');
        break;
      default:
        _router?.go('/home');
    }
  }

  /// Parse universal link from web URL
  /// e.g., https://www.bereifung24.de/werkstatt/123 → workshop detail
  void _handleUniversalLink(Uri uri) {
    final segments = uri.pathSegments;

    if (segments.isEmpty) {
      _router?.go('/home');
      return;
    }

    switch (segments.first) {
      case 'werkstatt':
        if (segments.length > 1) {
          _router?.push('/search/workshop/${segments[1]}');
        }
        break;
      case 'buchung':
        if (segments.length > 1) {
          _router?.push('/bookings/${segments[1]}');
        }
        break;
      default:
        _router?.go('/home');
    }
  }

  void dispose() {
    _sub?.cancel();
  }
}
