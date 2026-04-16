import 'dart:math';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// Voice conversation states
enum VoiceState { idle, listening, thinking, speaking }

/// Immersive fullscreen Rollo Voice Mode
class RolloVoiceMode extends StatefulWidget {
  final VoiceState voiceState;
  final String statusText;
  final String? partialSpeech;
  final String? lastAiText;
  final List<dynamic>? recommendedTires;
  final dynamic selectedTire;
  final dynamic selectedFrontTire;
  final dynamic selectedRearTire;
  final bool isMotorcycle;
  final bool hasMixedTires;
  final VoidCallback onClose;
  final VoidCallback onMicTap;
  final VoidCallback onStopTap;
  final void Function(dynamic tire)? onTireSelected;
  final void Function(dynamic tire)? onTireSearch;

  const RolloVoiceMode({
    super.key,
    required this.voiceState,
    required this.statusText,
    this.partialSpeech,
    this.lastAiText,
    this.recommendedTires,
    this.selectedTire,
    this.selectedFrontTire,
    this.selectedRearTire,
    this.isMotorcycle = false,
    this.hasMixedTires = false,
    required this.onClose,
    required this.onMicTap,
    required this.onStopTap,
    this.onTireSelected,
    this.onTireSearch,
  });

  @override
  State<RolloVoiceMode> createState() => _RolloVoiceModeState();
}

class _RolloVoiceModeState extends State<RolloVoiceMode>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _glowController;
  late AnimationController _waveController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();

    // Pulse animation for the avatar ring
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Glow intensity animation
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _glowAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    // Wave animation for listening/speaking
    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();
  }

  @override
  void didUpdateWidget(RolloVoiceMode oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Speed up/slow down based on state
    if (widget.voiceState != oldWidget.voiceState) {
      switch (widget.voiceState) {
        case VoiceState.listening:
          _pulseController.duration = const Duration(milliseconds: 800);
          _pulseController.repeat(reverse: true);
          break;
        case VoiceState.thinking:
          _pulseController.duration = const Duration(milliseconds: 600);
          _pulseController.repeat(reverse: true);
          break;
        case VoiceState.speaking:
          _pulseController.duration = const Duration(milliseconds: 1200);
          _pulseController.repeat(reverse: true);
          break;
        case VoiceState.idle:
          _pulseController.duration = const Duration(milliseconds: 2000);
          _pulseController.repeat(reverse: true);
          break;
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _glowController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  Color _stateColor() {
    switch (widget.voiceState) {
      case VoiceState.listening:
        return Colors.red;
      case VoiceState.thinking:
        return B24Colors.accentOrange;
      case VoiceState.speaking:
        return B24Colors.accentGreen;
      case VoiceState.idle:
        return B24Colors.primaryBlue;
    }
  }

  IconData _stateIcon() {
    switch (widget.voiceState) {
      case VoiceState.listening:
        return Icons.mic;
      case VoiceState.thinking:
        return Icons.auto_awesome;
      case VoiceState.speaking:
        return Icons.volume_up;
      case VoiceState.idle:
        return Icons.mic_none;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;
    final hasTires = widget.recommendedTires != null &&
        widget.recommendedTires!.isNotEmpty;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0E1A)
          : const Color(0xFF0F172A),
      body: Stack(
        children: [
          // Background gradient
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _glowAnimation,
              builder: (context, child) {
                return Container(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: const Alignment(0, -0.2),
                      radius: 1.2,
                      colors: [
                        _stateColor().withValues(
                            alpha: 0.08 * _glowAnimation.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Main content
          SafeArea(
            child: Column(
              children: [
                // Top bar: close + title
                _buildTopBar(),

                // Avatar + glow ring area
                Expanded(
                  flex: hasTires ? 3 : 5,
                  child: Center(
                    child: _buildAnimatedAvatar(size),
                  ),
                ),

                // Status text
                _buildStatusSection(),

                const SizedBox(height: 12),

                // Waveform visualization
                SizedBox(
                  height: 60,
                  child: _buildWaveform(),
                ),

                const SizedBox(height: 16),

                // Tire cards (if recommendations exist)
                if (hasTires) _buildTireOverlay(isDark),

                // Action button
                _buildActionButton(),

                SizedBox(height: 16 + MediaQuery.of(context).padding.bottom),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            onPressed: widget.onClose,
            icon: const Icon(Icons.close, color: Colors.white70, size: 24),
          ),
          const Spacer(),
          const Text(
            'Rollo Voice',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
          const Spacer(),
          // Invisible spacer for centering
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildAnimatedAvatar(Size screenSize) {
    final avatarSize = screenSize.width * 0.45;
    final maxSize = 200.0;
    final actualSize = avatarSize > maxSize ? maxSize : avatarSize;

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        final pulseValue = _pulseAnimation.value;
        final glowValue = _glowAnimation.value;
        final color = _stateColor();

        return Container(
          width: actualSize + 60,
          height: actualSize + 60,
          alignment: Alignment.center,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer glow ring 3
              if (widget.voiceState != VoiceState.idle)
                Container(
                  width: actualSize + 50 + (pulseValue * 10),
                  height: actualSize + 50 + (pulseValue * 10),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: color.withValues(alpha: 0.1 * glowValue),
                      width: 1.5,
                    ),
                  ),
                ),
              // Outer glow ring 2
              if (widget.voiceState != VoiceState.idle)
                Container(
                  width: actualSize + 35 + (pulseValue * 8),
                  height: actualSize + 35 + (pulseValue * 8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: color.withValues(alpha: 0.2 * glowValue),
                      width: 2,
                    ),
                  ),
                ),
              // Inner glow ring
              Container(
                width: actualSize + 16 + (pulseValue * 4),
                height: actualSize + 16 + (pulseValue * 4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(
                          alpha: 0.3 + (0.3 * glowValue)),
                      blurRadius: 20 + (10 * pulseValue),
                      spreadRadius: 2 + (4 * pulseValue),
                    ),
                  ],
                  border: Border.all(
                    color: color.withValues(alpha: 0.5 + (0.3 * glowValue)),
                    width: 3,
                  ),
                ),
              ),
              // Avatar image
              Container(
                width: actualSize,
                height: actualSize,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    image:
                        AssetImage('assets/images/services/ki_berater.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              // State icon badge
              Positioned(
                bottom: 4,
                right: 4,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: 0.5),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Icon(
                    _stateIcon(),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          // Main status
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              widget.statusText,
              key: ValueKey(widget.statusText),
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _stateColor(),
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Partial speech or last AI response snippet
          if (widget.voiceState == VoiceState.listening &&
              widget.partialSpeech != null &&
              widget.partialSpeech!.isNotEmpty)
            Text(
              '"${widget.partialSpeech}"',
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 14,
                fontStyle: FontStyle.italic,
              ),
            ),
          if (widget.voiceState == VoiceState.speaking &&
              widget.lastAiText != null &&
              widget.lastAiText!.isNotEmpty)
            Text(
              _truncate(widget.lastAiText!, 80),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 13,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWaveform() {
    return AnimatedBuilder(
      animation: _waveController,
      builder: (context, _) {
        final isActive = widget.voiceState == VoiceState.listening ||
            widget.voiceState == VoiceState.speaking;
        return CustomPaint(
          size: const Size(double.infinity, 60),
          painter: _WaveformPainter(
            progress: _waveController.value,
            color: _stateColor(),
            isActive: isActive,
            intensity: widget.voiceState == VoiceState.listening ? 1.0 : 0.6,
          ),
        );
      },
    );
  }

  Widget _buildTireOverlay(bool isDark) {
    final hasMixed = widget.hasMixedTires;
    final hasSelection = hasMixed
        ? (widget.selectedFrontTire != null || widget.selectedRearTire != null)
        : widget.selectedTire != null;

    if (hasMixed) {
      return _buildMixedTireOverlay(isDark, hasSelection);
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Icon(Icons.recommend,
                    color: B24Colors.accentGreen, size: 18),
                const SizedBox(width: 8),
                const Text(
                  'Reifen-Empfehlungen',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: hasSelection ? 120 : 130,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              scrollDirection: Axis.horizontal,
              itemCount: widget.recommendedTires!.length,
              itemBuilder: (context, index) {
                final tire = widget.recommendedTires![index];
                return _buildTireCardCompact(tire, isDark);
              },
            ),
          ),
          if (hasSelection)
            Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => widget.onTireSearch?.call(widget.selectedTire),
                    icon: const Icon(Icons.search, size: 16),
                    label: const Text('Werkstatt finden',
                        style: TextStyle(fontSize: 13)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: B24Colors.primaryBlue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ),
          ],
        ),
    );
  }

  Widget _buildMixedTireOverlay(bool isDark, bool hasSelection) {
    final frontTires = widget.recommendedTires!
        .where((t) => t.axle == 'front')
        .toList();
    final rearTires = widget.recommendedTires!
        .where((t) => t.axle == 'rear')
        .toList();
    final frontLabel = widget.isMotorcycle ? 'Vorderrad' : 'Vorderachse';
    final rearLabel = widget.isMotorcycle ? 'Hinterrad' : 'Hinterachse';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                Icon(Icons.recommend,
                    color: B24Colors.accentGreen, size: 18),
                const SizedBox(width: 8),
                const Text(
                  'Reifen-Empfehlungen',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          if (frontTires.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: Text(
                '$frontLabel (${frontTires.first.size})',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(
              height: 120,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                scrollDirection: Axis.horizontal,
                itemCount: frontTires.length,
                itemBuilder: (context, index) =>
                    _buildTireCardCompact(frontTires[index], isDark),
              ),
            ),
          ],
          if (rearTires.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: Text(
                '$rearLabel (${rearTires.first.size})',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(
              height: 120,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                scrollDirection: Axis.horizontal,
                itemCount: rearTires.length,
                itemBuilder: (context, index) =>
                    _buildTireCardCompact(rearTires[index], isDark),
              ),
            ),
          ],
          if (hasSelection)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => widget.onTireSearch?.call(null),
                  icon: const Icon(Icons.search, size: 16),
                  label: const Text('Werkstatt finden',
                      style: TextStyle(fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: B24Colors.primaryBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTireCardCompact(dynamic tire, bool isDark) {
    // Determine selection based on axle
    bool isSelected;
    if (tire.axle == 'front') {
      isSelected = widget.selectedFrontTire != null &&
          widget.selectedFrontTire.brand == tire.brand &&
          widget.selectedFrontTire.model == tire.model;
    } else if (tire.axle == 'rear') {
      isSelected = widget.selectedRearTire != null &&
          widget.selectedRearTire.brand == tire.brand &&
          widget.selectedRearTire.model == tire.model;
    } else {
      isSelected = widget.selectedTire != null &&
          widget.selectedTire.brand == tire.brand &&
          widget.selectedTire.model == tire.model;
    }

    return GestureDetector(
      onTap: () => widget.onTireSelected?.call(tire),
      child: Container(
        width: 170,
        margin: const EdgeInsets.only(right: 10, bottom: 4),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected
              ? B24Colors.primaryBlue.withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? B24Colors.primaryBlue
                : Colors.white.withValues(alpha: 0.15),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${tire.brand}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle,
                      size: 16, color: B24Colors.primaryBlue),
              ],
            ),
            Text(
              '${tire.model}',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 11,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              '${tire.size} · ${tire.season}',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 10,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            // Load index / speed index
            if (tire.loadIndex != '-' || tire.speedIndex != '-')
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  '${tire.loadIndex}${tire.speedIndex != '-' ? '/${tire.speedIndex}' : ''}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 10,
                  ),
                ),
              ),
            const SizedBox(height: 4),
            if (!widget.isMotorcycle &&
                tire.labelFuelEfficiency != '-' &&
                tire.labelWetGrip != '-' &&
                tire.labelNoise > 0)
              Wrap(
                spacing: 4,
                runSpacing: 2,
                children: [
                  _miniLabel('⛽${tire.labelFuelEfficiency}'),
                  _miniLabel('💧${tire.labelWetGrip}'),
                  _miniLabel('🔊${tire.labelNoise}dB'),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _miniLabel(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.7),
          fontSize: 9,
        ),
      ),
    );
  }

  Widget _buildActionButton() {
    final isActive = widget.voiceState == VoiceState.listening ||
        widget.voiceState == VoiceState.speaking;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Main action
          GestureDetector(
            onTap: isActive ? widget.onStopTap : widget.onMicTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: isActive ? 72 : 80,
              height: isActive ? 72 : 80,
              decoration: BoxDecoration(
                color: isActive ? Colors.red : B24Colors.primaryBlue,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: (isActive ? Colors.red : B24Colors.primaryBlue)
                        .withValues(alpha: 0.4),
                    blurRadius: 20,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: Icon(
                isActive ? Icons.stop_rounded : Icons.mic,
                color: Colors.white,
                size: isActive ? 32 : 36,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _truncate(String s, int max) {
    if (s.length <= max) return s;
    return '${s.substring(0, max)}...';
  }
}

// ── Waveform Painter ──

class _WaveformPainter extends CustomPainter {
  final double progress;
  final Color color;
  final bool isActive;
  final double intensity;

  _WaveformPainter({
    required this.progress,
    required this.color,
    required this.isActive,
    required this.intensity,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: isActive ? 0.6 : 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final centerY = size.height / 2;
    final barCount = 40;
    final barWidth = size.width / barCount;

    for (int i = 0; i < barCount; i++) {
      final x = i * barWidth + barWidth / 2;
      final normalizedPos = i / barCount;

      // Create wave pattern
      final wave1 = sin((normalizedPos * 4 * pi) + (progress * 2 * pi));
      final wave2 =
          sin((normalizedPos * 6 * pi) + (progress * 2 * pi * 1.5));
      final combined = (wave1 * 0.6 + wave2 * 0.4);

      // Fade edges
      final edgeFade = sin(normalizedPos * pi);

      final amplitude =
          isActive ? (size.height * 0.35 * intensity) : (size.height * 0.08);
      final barHeight = (combined.abs() * amplitude * edgeFade)
          .clamp(2.0, size.height * 0.5);

      final opacity = isActive ? (0.3 + 0.5 * combined.abs()) : 0.2;
      paint.color = color.withValues(alpha: opacity);

      canvas.drawLine(
        Offset(x, centerY - barHeight),
        Offset(x, centerY + barHeight),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_WaveformPainter oldDelegate) => true;
}
