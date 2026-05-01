import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'l10n/app_localizations.dart';
import 'firebase_options.dart';
import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/services/stripe_service.dart';
import 'core/services/fcm_service.dart';
import 'core/services/deep_link_service.dart';
import 'core/services/cache_service.dart';
import 'core/services/version_check_service.dart';
import 'features/splash/presentation/screens/splash_screen.dart';
import 'features/auth/providers/auth_provider.dart';

/// Provider for the current locale – persisted via SharedPreferences.
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('de')) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('app_locale');
    if (code != null) {
      state = Locale(code);
    }
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_locale', locale.languageCode);
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Use modern edge-to-edge mode to align with current Android UI guidance.
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Firebase (graceful fallback if not yet configured)
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase init failed (placeholder config?): $e');
  }

  // Initialize Stripe (fetches publishable key from server)
  try {
    await StripeService.init();
  } catch (e) {
    debugPrint('Stripe init failed: $e');
  }

  // Initialize offline cache (Hive)
  try {
    await CacheService.init();
  } catch (e) {
    debugPrint('Cache init failed: $e');
  }

  // Run app — with Sentry if DSN is set, otherwise directly
  if (AppConfig.sentryDsn.isNotEmpty) {
    await SentryFlutter.init(
      (options) {
        options.dsn = AppConfig.sentryDsn;
        options.environment = const String.fromEnvironment(
          'ENVIRONMENT',
          defaultValue: 'development',
        );
        options.tracesSampleRate = 0.3;
      },
      appRunner: () {
        runApp(const ProviderScope(child: Bereifung24App()));
      },
    );
  } else {
    runApp(const ProviderScope(child: Bereifung24App()));
  }
}

class Bereifung24App extends ConsumerStatefulWidget {
  const Bereifung24App({super.key});

  @override
  ConsumerState<Bereifung24App> createState() => _Bereifung24AppState();
}

class _Bereifung24AppState extends ConsumerState<Bereifung24App> {
  bool _showSplash = true;
  bool _authReady = false;

  @override
  void initState() {
    super.initState();
    _waitForAuth();
  }

  Future<void> _waitForAuth() async {
    // Wait until authStateProvider has finished restoring the session
    // (isLoading goes from true to false)
    await Future.doWhile(() async {
      await Future.delayed(const Duration(milliseconds: 50));
      if (!mounted) return false;
      return ref.read(authStateProvider).isLoading;
    });
    if (mounted) setState(() => _authReady = true);
  }

  void _onSplashComplete() {
    if (!mounted) return;
    setState(() => _showSplash = false);
    // Initialize services after splash completes and router is ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initServices();
    });
  }

  void _initServices() {
    final router = ref.read(routerProvider);
    try {
      FcmService().init(router: router);
    } catch (e) {
      debugPrint('FCM init failed: $e');
    }
    try {
      DeepLinkService().init(router: router);
    } catch (e) {
      debugPrint('DeepLink init failed: $e');
    }
    // Check for mandatory / available app updates.
    Future.delayed(const Duration(milliseconds: 800), () {
      final ctx = router.routerDelegate.navigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        VersionCheckService.check(ctx);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_showSplash || !_authReady) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: SplashScreen(onComplete: _onSplashComplete),
      );
    }

    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: 'Bereifung24',
      debugShowCheckedModeBanner: false,
      theme: B24Theme.light(),
      darkTheme: B24Theme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      locale: locale,
      supportedLocales: S.supportedLocales,
      localizationsDelegates: const [
        S.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
