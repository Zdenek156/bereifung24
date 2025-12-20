import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:firebase_core/firebase_core.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'features/onboarding/professional_onboarding_screen.dart';
import 'features/auth/professional_auth_screen.dart';
import 'features/requests/professional_home_screen.dart';
import 'features/requests/request_details_screen.dart';
import 'features/offers/offer_details_screen.dart';
// import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // TODO: Initialize Firebase when configuration files are added
  // await Firebase.initializeApp();
  
  // TODO: Initialize notifications when Firebase is configured
  // final notificationService = NotificationService();
  // await notificationService.initialize();
  
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bereifung24',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/onboarding':
            return MaterialPageRoute(builder: (_) => const ProfessionalOnboardingScreen());
          case '/auth':
            return MaterialPageRoute(builder: (_) => const ProfessionalAuthScreen());
          case '/home':
            return MaterialPageRoute(builder: (_) => const ProfessionalHomeScreen());
          case '/create-request':
            return MaterialPageRoute(builder: (_) => const ProfessionalHomeScreen());
          case '/request-details':
            final requestId = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => RequestDetailsScreen(requestId: requestId),
            );
          case '/offer-details':
            final offerId = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => OfferDetailsScreen(offerId: offerId),
            );
          default:
            return null;
        }
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkFirstLaunch();
  }

  Future<void> _checkFirstLaunch() async {
    await Future.delayed(const Duration(seconds: 2));
    
    final prefs = await SharedPreferences.getInstance();
    
    // DEBUG: Clear all data to force login (uncomment to reset)
    await prefs.clear();
    print('DEBUG: SharedPreferences cleared');
    
    // Check for auth token first - use both possible keys
    String? authToken = prefs.getString('auth_token');
    if (authToken == null || authToken.isEmpty) {
      authToken = prefs.getString(AppConstants.keyAuthToken);
    }

    print('DEBUG: Auth token found: ${authToken != null && authToken.isNotEmpty}');

    if (!mounted) return;

    // If user is logged in, go to home
    if (authToken != null && authToken.isNotEmpty) {
      print('DEBUG: Going to home');
      Navigator.pushReplacementNamed(context, '/home');
      return;
    }

    // Otherwise, check onboarding status
    final onboardingComplete = prefs.getBool(AppConstants.keyOnboardingComplete) ?? false;
    
    print('DEBUG: Onboarding complete: $onboardingComplete');
    
    if (!onboardingComplete) {
      print('DEBUG: Going to onboarding');
      Navigator.pushReplacementNamed(context, '/onboarding');
    } else {
      // Onboarding complete but not logged in - show auth screen
      print('DEBUG: Going to auth');
      Navigator.pushReplacementNamed(context, '/auth');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              height: 120,
              width: 120,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(
                child: Text(
                  'B24',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Bereifung24',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
