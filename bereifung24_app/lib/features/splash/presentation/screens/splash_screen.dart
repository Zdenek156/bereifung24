import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// B24 Splash-Screen
/// - Reifenspur fährt von links, B24 von rechts rein
/// - Beide Teile haben dieselbe Höhe (Aspect-Ratio korrekt)
/// - Hintergrund hellt sich auf (dunkelblau → hellblau)
/// - Fade-Out am Ende
class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  static const _bgDark  = Color(0xFF01395A);
  static const _bgLight = Color(0xFF0EA5E9);

  // Aspect-Ratios der transparenten PNG-Assets
  static const _reifenspurRatio = 3964 / 4969; // 0.798  (portrait)
  static const _b24Ratio        = 6462 / 3122; // 2.070  (landscape)

  late AnimationController _controller;

  // Logo-Animationen
  late Animation<double> _reifenspurSlide;
  late Animation<double> _reifenspurFade;
  late Animation<double> _b24Slide;
  late Animation<double> _b24Scale;
  late Animation<double> _b24Fade;

  // Aufhell-Effekt
  late Animation<Color?> _bgColor;
  late Animation<double> _glowOpacity;
  late Animation<double> _glowScale;

  // Fade-Out
  late Animation<double> _fadeOut;

  @override
  void initState() {
    super.initState();

    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: _bgDark,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: _bgDark,
      systemNavigationBarIconBrightness: Brightness.light,
    ));

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    );

    // ── Phase 1 (0%–35%): Reifenspur slides in from left ─────────────────────
    _reifenspurSlide = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.00, 0.35, curve: Curves.easeOut),
      ),
    );
    _reifenspurFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.00, 0.28, curve: Curves.easeOut),
      ),
    );

    // ── Phase 2 (25%–55%): B24 slides in from right + scale pop ──────────────
    _b24Slide = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.25, 0.55, curve: Curves.easeOut),
      ),
    );
    _b24Scale = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.30, 0.55, curve: Curves.easeOutBack),
      ),
    );
    _b24Fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.28, 0.52, curve: Curves.easeOut),
      ),
    );

    // ── Aufhell-Effekt ────────────────────────────────────────────────────────
    _bgColor = ColorTween(begin: _bgDark, end: _bgLight).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.00, 0.80, curve: Curves.easeInOut),
      ),
    );
    _glowOpacity = Tween<double>(begin: 0.0, end: 0.18).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.72, curve: Curves.easeOut),
      ),
    );
    _glowScale = Tween<double>(begin: 0.4, end: 1.6).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.88, curve: Curves.easeOut),
      ),
    );

    // ── Fade-Out (80%–100%): gesamter Inhalt blendet aus ─────────────────────
    _fadeOut = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.80, 1.00, curve: Curves.easeIn),
      ),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
          statusBarColor: _bgLight,
          statusBarIconBrightness: Brightness.light,
          systemNavigationBarColor: Colors.white,
          systemNavigationBarIconBrightness: Brightness.dark,
        ));
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) widget.onComplete();
        });
      }
    });

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final bg = _bgColor.value ?? _bgDark;
        final contentOpacity = (1.0 - _fadeOut.value).clamp(0.0, 1.0);

        return Scaffold(
          backgroundColor: bg,
          body: SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final size    = constraints.biggest;
                final centerX = size.width  * 0.5;
                final centerY = size.height * 0.5;

                // ── Naht genau in der Screenmitte, kein Gap ─────────────────
                // B24 muss in die rechte Hälfte passen → Höhe daraus ableiten
                // logoHeight × _b24Ratio ≤ centerX  →  logoHeight ≤ centerX / _b24Ratio
                const _marginFactor = 0.96; // 4% Rand rechts
                final logoHeightByB24     = (centerX * _marginFactor) / _b24Ratio;
                final logoHeightByScreen  = size.height * 0.20;
                final logoHeight = logoHeightByB24 < logoHeightByScreen
                    ? logoHeightByB24
                    : logoHeightByScreen;

                final b24W        = logoHeight * _b24Ratio;

                // ── Reifenspur: 30% über B24-Top, 40% unter B24-Bottom ──────
                final b24Top         = centerY - logoHeight / 2;
                final b24Bottom      = centerY + logoHeight / 2;
                final reifenspurTop  = b24Top    - logoHeight * 0.30;
                final reifenspurH    = logoHeight * 1.70; // 30% oben + 40% unten
                final reifenspurWNew = reifenspurH * _reifenspurRatio;

                // Naht (Join-Point) = Screenmitte, kein Gap
                final reifenspurLeft = centerX - reifenspurWNew;
                final b24Left        = centerX;

                return Stack(
                  children: [
                    // ── Glanz-Kreis ──────────────────────────────────────────
                    Positioned.fill(
                      child: Opacity(
                        opacity: _glowOpacity.value * contentOpacity,
                        child: Transform.scale(
                          scale: _glowScale.value,
                          child: Center(
                            child: Container(
                              width:  size.width * 0.55,
                              height: size.width * 0.55,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: RadialGradient(
                                  colors: [Colors.white, Colors.transparent],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // ── Reifenspur ───────────────────────────────────────────
                    Positioned(
                      left:   reifenspurLeft,
                      top:    reifenspurTop,
                      width:  reifenspurWNew,
                      height: reifenspurH,
                      child: Opacity(
                        opacity: _reifenspurFade.value * contentOpacity,
                        child: Transform.translate(
                          offset: Offset(
                            -(size.width) * (1 - _reifenspurSlide.value),
                            0,
                          ),
                          child: Image.asset(
                            'assets/splash/Logo_Ausschnitt_Reifenspur_weiß.png',
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => _placeholder('Reifenspur'),
                          ),
                        ),
                      ),
                    ),

                    // ── B24 ──────────────────────────────────────────────────
                    Positioned(
                      left:   b24Left,
                      top:    centerY - logoHeight / 2,
                      width:  b24W,
                      height: logoHeight,
                      child: Opacity(
                        opacity: _b24Fade.value * contentOpacity,
                        child: Transform.translate(
                          offset: Offset(
                            size.width * (1 - _b24Slide.value),
                            0,
                          ),
                          child: Transform.scale(
                            scale: _b24Scale.value,
                            alignment: Alignment.centerLeft,
                            child: Image.asset(
                              'assets/splash/Logo_Ausschnitt_B24_weiß.png',
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) => _placeholder('B24'),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _placeholder(String label) {
    return Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white24,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: const TextStyle(color: Colors.white70)),
    );
  }
}
