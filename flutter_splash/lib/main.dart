import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const B24App());
}

class B24App extends StatelessWidget {
  const B24App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'B24 Splash',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0082C9)),
        useMaterial3: true,
      ),
      home: SplashScreen(
        duration: const Duration(milliseconds: 3200),
        onComplete: (context) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => const _PlaceholderHome(),
            ),
          );
        },
      ),
    );
  }
}

class _PlaceholderHome extends StatelessWidget {
  const _PlaceholderHome();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Text(
          'B24 App – Startseite',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.grey.shade800,
                fontWeight: FontWeight.bold,
              ),
        ),
      ),
    );
  }
}
