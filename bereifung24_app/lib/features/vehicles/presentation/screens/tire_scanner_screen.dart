import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../../utils/tire_size_parser.dart';

/// Full-screen camera scanner that recognizes tire sizes via ML Kit OCR.
class TireScannerScreen extends StatefulWidget {
  const TireScannerScreen({super.key});

  @override
  State<TireScannerScreen> createState() => _TireScannerScreenState();
}

class _TireScannerScreenState extends State<TireScannerScreen> {
  CameraController? _cameraController;
  final _textRecognizer = TextRecognizer();
  bool _isProcessing = false;
  bool _isScanning = true;
  bool _torchOn = false;
  TireSize? _detectedSize;
  String _statusText = 'Reifen hierhin ausrichten';
  Timer? _scanTimer;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Keine Kamera verfügbar')),
        );
        Navigator.of(context).pop();
      }
      return;
    }

    final backCamera = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );

    _cameraController = CameraController(
      backCamera,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.nv21,
    );

    await _cameraController!.initialize();
    if (!mounted) return;

    // Enable torch by default — creates reflections on raised rubber text
    try {
      await _cameraController!.setFlashMode(FlashMode.torch);
      _torchOn = true;
    } catch (_) {}

    // Slightly increase exposure for better contrast on dark rubber
    try {
      final maxExposure = await _cameraController!.getMaxExposureOffset();
      if (maxExposure > 0) {
        await _cameraController!.setExposureOffset((maxExposure * 0.3).clamp(0.0, 1.5));
      }
    } catch (_) {}

    setState(() {});

    // Start periodic scanning (every 500ms)
    _scanTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      _captureAndProcess();
    });
  }

  Future<void> _captureAndProcess() async {
    if (!_isScanning || _isProcessing) return;
    final controller = _cameraController;
    if (controller == null || !controller.value.isInitialized) return;

    _isProcessing = true;

    try {
      final image = await controller.takePicture();
      final inputImage = InputImage.fromFilePath(image.path);
      final recognized = await _textRecognizer.processImage(inputImage);

      if (!mounted || !_isScanning) return;

      // Collect all text lines
      final lines = <String>[];
      for (final block in recognized.blocks) {
        for (final line in block.lines) {
          lines.add(line.text);
        }
      }

      final best = findBestTireSize(lines);
      if (best != null && best.confidence >= 0.75) {
        setState(() {
          _isScanning = false;
          _detectedSize = best;
          _statusText = 'Größe erkannt!';
        });
        HapticFeedback.mediumImpact();
        _scanTimer?.cancel();
      }
    } catch (_) {
      // Ignore frame processing errors
    } finally {
      _isProcessing = false;
    }
  }

  void _rescan() {
    setState(() {
      _detectedSize = null;
      _isScanning = true;
      _statusText = 'Reifen hierhin ausrichten';
    });
    _scanTimer?.cancel();
    _scanTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      _captureAndProcess();
    });
  }

  void _confirm() {
    if (_detectedSize != null) {
      Navigator.of(context).pop(_detectedSize);
    }
  }

  void _toggleTorch() async {
    final controller = _cameraController;
    if (controller == null || !controller.value.isInitialized) return;
    try {
      if (_torchOn) {
        await controller.setFlashMode(FlashMode.off);
      } else {
        await controller.setFlashMode(FlashMode.torch);
      }
      setState(() => _torchOn = !_torchOn);
    } catch (_) {}
  }

  @override
  void dispose() {
    _scanTimer?.cancel();
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accentColor = const Color(0xFF0284C7);
    final successColor = const Color(0xFF10B981);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera preview
          if (_cameraController != null &&
              _cameraController!.value.isInitialized)
            CameraPreview(_cameraController!)
          else
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),

          // Dark overlay with transparent scan area
          _ScanOverlay(
            isDetected: _detectedSize != null,
            accentColor: accentColor,
            successColor: successColor,
          ),

          // UI elements
          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      _CircleButton(
                        icon: Icons.arrow_back,
                        onTap: () => Navigator.of(context).pop(),
                      ),
                      const Expanded(
                        child: Text(
                          'Reifen scannen',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      _CircleButton(
                        icon: _torchOn ? Icons.flash_on : Icons.flash_off,
                        onTap: _toggleTorch,
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Detected size display (overlaps scan frame)
                if (_detectedSize != null) ...[
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 40),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: successColor, width: 2),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.check_circle,
                            color: successColor, size: 36),
                        const SizedBox(height: 8),
                        Text(
                          '${_detectedSize!.width}/${_detectedSize!.aspectRatio} '
                          '${_detectedSize!.construction}${_detectedSize!.diameter}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                        if (_detectedSize!.loadIndex != null ||
                            _detectedSize!.speedRating != null)
                          Text(
                            '${_detectedSize!.loadIndex ?? ''}${_detectedSize!.speedRating ?? ''}',
                            style: TextStyle(
                              color: accentColor,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          'Erkennungsqualität: ${(_detectedSize!.confidence * 100).round()}%',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Status text
                Text(
                  _statusText,
                  style: TextStyle(
                    color:
                        _detectedSize != null ? successColor : accentColor,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),

                // Tip bubble
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    children: [
                      const Text('💡', style: TextStyle(fontSize: 18)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            text: 'Taschenlampe beleuchtet die erhabene Schrift. Größe steht auf der Seitenwand, z.B. ',
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontSize: 11,
                            ),
                            children: [
                              TextSpan(
                                text: '205/55 R16 91V',
                                style: TextStyle(
                                  color: accentColor,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Bottom buttons
                if (_detectedSize != null) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _confirm,
                        icon: const Icon(Icons.check, color: Colors.white),
                        label: const Text(
                          'Größe übernehmen',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: successColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton.icon(
                    onPressed: _rescan,
                    icon: Icon(Icons.camera_alt, color: accentColor, size: 18),
                    label: Text(
                      'Erneut scannen',
                      style: TextStyle(
                        color: accentColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ] else ...[
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text(
                      'Größe manuell eingeben →',
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Scan frame overlay ──

class _ScanOverlay extends StatelessWidget {
  final bool isDetected;
  final Color accentColor;
  final Color successColor;

  const _ScanOverlay({
    required this.isDetected,
    required this.accentColor,
    required this.successColor,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _ScanOverlayPainter(
        frameColor: isDetected ? successColor : accentColor,
      ),
    );
  }
}

class _ScanOverlayPainter extends CustomPainter {
  final Color frameColor;

  _ScanOverlayPainter({required this.frameColor});

  @override
  void paint(Canvas canvas, Size size) {
    // Semi-transparent dark overlay
    final overlayPaint = Paint()..color = Colors.black.withValues(alpha: 0.55);

    // Scan frame dimensions
    const frameWidth = 300.0;
    const frameHeight = 180.0;
    final frameRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height * 0.38),
      width: frameWidth,
      height: frameHeight,
    );

    // Draw overlay with cutout
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(frameRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, overlayPaint);

    // Draw frame border
    final framePaint = Paint()
      ..color = frameColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(frameRect, const Radius.circular(16)),
      framePaint,
    );

    // Corner accents
    const cornerLen = 28.0;
    const cornerWidth = 4.0;
    final cornerPaint = Paint()
      ..color = frameColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = cornerWidth
      ..strokeCap = StrokeCap.round;

    final corners = [
      // Top-left
      [frameRect.topLeft, Offset(frameRect.left + cornerLen, frameRect.top)],
      [frameRect.topLeft, Offset(frameRect.left, frameRect.top + cornerLen)],
      // Top-right
      [frameRect.topRight, Offset(frameRect.right - cornerLen, frameRect.top)],
      [
        frameRect.topRight,
        Offset(frameRect.right, frameRect.top + cornerLen)
      ],
      // Bottom-left
      [
        frameRect.bottomLeft,
        Offset(frameRect.left + cornerLen, frameRect.bottom)
      ],
      [
        frameRect.bottomLeft,
        Offset(frameRect.left, frameRect.bottom - cornerLen)
      ],
      // Bottom-right
      [
        frameRect.bottomRight,
        Offset(frameRect.right - cornerLen, frameRect.bottom)
      ],
      [
        frameRect.bottomRight,
        Offset(frameRect.right, frameRect.bottom - cornerLen)
      ],
    ];
    for (final c in corners) {
      canvas.drawLine(c[0], c[1], cornerPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _ScanOverlayPainter old) =>
      frameColor != old.frameColor;
}

// ── Circle button ──

class _CircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}
