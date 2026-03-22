import 'package:flutter/material.dart';

/// B24 Splash-Screen: Reifenspur fährt von links rein, danach erscheint "B24".
/// Nutzt echte Assets aus assets/splash/.
class SplashScreen extends StatefulWidget {
  const SplashScreen({
    super.key,
    this.onComplete,
    this.duration = const Duration(milliseconds: 2200),
  });

  /// Wird nach Ende der Animation aufgerufen. [context] für Navigation nutzen.
  final void Function(BuildContext context)? onComplete;
  final Duration duration;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  /// Hintergrund: Weiß (Logo ist für weißen Hintergrund)
  static const _backgroundColor = Colors.white;

  late AnimationController _controller;
  late Animation<double> _reifenspurSlide;
  late Animation<double> _reifenspurFade;
  late Animation<double> _b24Slide;
  late Animation<double> _b24Scale;
  late Animation<double> _b24Fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);

    // Animation endet bei ~60%, Rest ist Anzeige (länger zusammen anzeigen)
    // Phase 1 (0%–35%): Reifenspur fährt von links zur Mitte
    _reifenspurSlide = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.35, curve: Curves.easeOut),
      ),
    );
    _reifenspurFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
      ),
    );

    // Phase 2 (25%–55%): B24 von rechts zur Mitte + Pop
    _b24Slide = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.25, 0.55, curve: Curves.easeOut),
      ),
    );
    _b24Scale = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.55, curve: Curves.easeOutBack),
      ),
    );
    _b24Fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.28, 0.52, curve: Curves.easeOut),
      ),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        widget.onComplete?.call(context);
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
    return Scaffold(
      backgroundColor: _backgroundColor,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final size = constraints.biggest;
            final centerX = size.width * 0.5;
            final centerY = size.height * 0.5;
            final reifenspurWidth = size.width * 0.48;
            final reifenspurHeight = size.height * 0.34;
            final gapWidth = size.width * 0.02; // 2 % – Mitte der Lücke = Screenmitte
            final b24Width = size.width * 0.32;
            final logoHeight = size.height * 0.28;
            final reifenspurOffsetDown = size.height * 0.025; // war 3,5 %, jetzt 2,5 % (1 % nach oben)

            // Reifenspur endet bei centerX - gapWidth/2, B24 beginnt bei centerX + gapWidth/2
            final reifenspurLeft = centerX - gapWidth / 2 - reifenspurWidth;
            final b24Left = centerX + gapWidth / 2;

            return Stack(
              children: [
                // Reifenspur: rechte Kante bei Mitte der Lücke
                Positioned(
                  left: reifenspurLeft,
                  top: centerY - reifenspurHeight / 2 + reifenspurOffsetDown,
                  width: reifenspurWidth,
                  height: reifenspurHeight,
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final slide = _reifenspurSlide.value;
                      final fade = _reifenspurFade.value;
                      return Transform.translate(
                        offset: Offset(
                          -(centerX - gapWidth / 2) * (1 - slide),
                          0,
                        ),
                        child: Opacity(
                          opacity: fade,
                          child: child,
                        ),
                      );
                    },
                    child: Image.asset(
                      'assets/splash/Logo_Ausschnitt_Reifenspur.png',
                      fit: BoxFit.contain,
                      alignment: Alignment.centerRight,
                      errorBuilder: (_, __, ___) => _placeholder('Reifenspur'),
                    ),
                  ),
                ),
                // B24: linke Kante bei Mitte der Lücke
                Positioned(
                  left: b24Left,
                  top: centerY - logoHeight / 2,
                  width: b24Width,
                  height: logoHeight,
                  child: AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      final slide = _b24Slide.value;
                      return Transform.translate(
                        offset: Offset(
                          (centerX - gapWidth / 2) * (1 - slide),
                          0,
                        ),
                        child: Opacity(
                          opacity: _b24Fade.value,
                          child: Transform.scale(
                            scale: _b24Scale.value,
                            alignment: Alignment.centerLeft,
                            child: child,
                          ),
                        ),
                      );
                    },
                    child: Image.asset(
                      'assets/splash/Logo_Ausschnitt_B24.png',
                      fit: BoxFit.contain,
                      alignment: Alignment.centerLeft,
                      errorBuilder: (_, __, ___) => _placeholder('B24'),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _placeholder(String label) {
    return Container(
      width: 120,
      height: 60,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: TextStyle(color: Colors.grey.shade800)),
    );
  }
}
