import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../../utils/vehicle_doc_parser.dart';

/// Full-screen camera scanner for German vehicle registration documents
/// (Zulassungsbescheinigung Teil I / Fahrzeugschein).
class VehicleDocScannerScreen extends StatefulWidget {
  const VehicleDocScannerScreen({super.key});

  @override
  State<VehicleDocScannerScreen> createState() =>
      _VehicleDocScannerScreenState();
}

class _VehicleDocScannerScreenState extends State<VehicleDocScannerScreen>
    with SingleTickerProviderStateMixin {
  CameraController? _cameraController;
  final _textRecognizer = TextRecognizer();
  bool _isProcessing = false;
  bool _isScanning = true;
  bool _torchOn = false;
  VehicleDocResult? _result;
  int _fieldsFound = 0;
  Timer? _scanTimer;
  late AnimationController _scanLineController;

  // Best result we've seen during scanning
  VehicleDocResult? _bestResult;

  // Track physical device orientation for camera preview counter-rotation
  DeviceOrientation _physicalOrientation = DeviceOrientation.landscapeRight;

  @override
  void initState() {
    super.initState();
    // Force landscape-right only (notch left = natural iPhone hold, no rotation allowed)
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeRight,
    ]);
    _scanLineController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
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
      imageFormatGroup: Platform.isIOS
          ? ImageFormatGroup.bgra8888
          : ImageFormatGroup.nv21,
    );

    await _cameraController!.initialize();
    if (!mounted) return;

    // Lock camera capture orientation to match device orientation
    try {
      await _cameraController!.lockCaptureOrientation(
        DeviceOrientation.landscapeRight,
      );
    } catch (_) {}

    // Enable torch for better readability
    try {
      await _cameraController!.setFlashMode(FlashMode.torch);
      _torchOn = true;
    } catch (_) {}

    // Listen for physical orientation changes to counter-rotate preview
    _cameraController!.addListener(_onOrientationChanged);

    setState(() {});

    // Start periodic scanning
    _scanTimer = Timer.periodic(const Duration(milliseconds: 800), (_) {
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

      final lines = <String>[];
      for (final block in recognized.blocks) {
        for (final line in block.lines) {
          lines.add(line.text);
        }
      }

      if (lines.isEmpty) {
        _isProcessing = false;
        return;
      }

      final result = parseVehicleDoc(lines);

      // Keep best result (most fields found)
      if (_bestResult == null || result.fieldsFound > _bestResult!.fieldsFound) {
        _bestResult = result;
      }

      setState(() => _fieldsFound = _bestResult!.fieldsFound);

      // Auto-confirm when we have enough fields (at least 4)
      if (_bestResult!.fieldsFound >= 4) {
        setState(() {
          _isScanning = false;
          _result = _bestResult;
        });
        HapticFeedback.mediumImpact();
        _scanTimer?.cancel();
        _scanLineController.stop();
      }
    } catch (_) {
      // Ignore frame processing errors
    } finally {
      _isProcessing = false;
    }
  }

  void _rescan() {
    setState(() {
      _result = null;
      _bestResult = null;
      _fieldsFound = 0;
      _isScanning = true;
    });
    _scanLineController.repeat(reverse: true);
    _scanTimer?.cancel();
    _scanTimer = Timer.periodic(const Duration(milliseconds: 1200), (_) {
      _captureAndProcess();
    });
  }

  void _confirm() {
    final r = _result ?? _bestResult;
    if (r != null && r.fieldsFound > 0) {
      Navigator.of(context).pop(r);
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

  void _onOrientationChanged() {
    final o = _cameraController?.value.deviceOrientation;
    if (o != null && o != _physicalOrientation && mounted) {
      setState(() => _physicalOrientation = o);
    }
  }

  /// Calculate the rotation angle to keep the camera preview locked
  /// to landscapeRight regardless of physical device orientation.
  double _previewRotation() {
    // iOS camera sensor outputs upside-down in landscape → base 180°
    double angle = Platform.isIOS ? math.pi : 0;

    // Counter-rotate only for portrait tilt.
    // Camera texture does NOT auto-rotate between landscape orientations,
    // so no counter-rotation needed for landscapeLeft.
    switch (_physicalOrientation) {
      case DeviceOrientation.landscapeRight:
      case DeviceOrientation.landscapeLeft:
        break;
      case DeviceOrientation.portraitUp:
        angle += math.pi / 2;
      case DeviceOrientation.portraitDown:
        angle -= math.pi / 2;
    }
    return angle;
  }

  @override
  void dispose() {
    // Restore portrait orientation
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    _scanTimer?.cancel();
    _scanLineController.dispose();
    _cameraController?.removeListener(_onOrientationChanged);
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const accentColor = Color(0xFF0284C7);
    const successColor = Color(0xFF10B981);
    final isDone = _result != null;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera preview – counter-rotate to stay locked in landscapeRight
          if (_cameraController != null &&
              _cameraController!.value.isInitialized)
            Builder(builder: (context) {
              final angle = _previewRotation();
              final isPortrait =
                  _physicalOrientation == DeviceOrientation.portraitUp ||
                  _physicalOrientation == DeviceOrientation.portraitDown;
              // Scale up when rotated 90° so preview still fills the container
              final scale = isPortrait
                  ? MediaQuery.of(context).size.width /
                      MediaQuery.of(context).size.height
                  : 1.0;
              return Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..rotateZ(angle)
                  ..scale(scale, scale),
                child: CameraPreview(_cameraController!),
              );
            })
          else
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),

          // Dark overlay with transparent scan area (landscape-optimized)
          CustomPaint(
            painter: _DocScanOverlayPainter(
              frameColor: isDone ? successColor : accentColor,
              screenSize: size,
            ),
          ),

          // Animated scan line (landscape frame)
          if (_isScanning)
            AnimatedBuilder(
              animation: _scanLineController,
              builder: (context, _) {
                final frameHeight = size.height * 0.65;
                final frameTop = (size.height - frameHeight) / 2;
                final lineY =
                    frameTop + 16 + (_scanLineController.value * (frameHeight - 32));
                final frameWidth = size.width * 0.7;
                final frameLeft = (size.width - frameWidth) / 2;
                return Positioned(
                  top: lineY,
                  left: frameLeft + 14,
                  right: size.width - frameLeft - frameWidth + 14,
                  child: Container(
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Colors.transparent,
                          accentColor,
                          Color(0xFF2BAAE2),
                          accentColor,
                          Colors.transparent,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(1),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x662BAAE2),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

          // UI: landscape layout — header top, controls bottom
          SafeArea(
            child: Column(
              children: [
                // Header row
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: Row(
                    children: [
                      _CircleButton(
                        icon: Icons.arrow_back,
                        onTap: () {
                          // Return best result if we have any fields
                          final r = _result ?? _bestResult;
                          if (r != null && r.fieldsFound > 0) {
                            Navigator.of(context).pop(r);
                          } else {
                            Navigator.of(context).pop();
                          }
                        },
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isDone ? 'Fahrzeug erkannt!' : 'Fahrzeugschein scannen',
                        style: TextStyle(
                          color: isDone ? successColor : Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      // Field badges inline
                      if (_fieldsFound > 0 || isDone)
                        ..._buildFieldBadges(),
                      const SizedBox(width: 8),
                      _CircleButton(
                        icon: _torchOn ? Icons.flash_on : Icons.flash_off,
                        onTap: _toggleTorch,
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Bottom bar with progress + buttons
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.7),
                      ],
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Progress bar
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: LinearProgressIndicator(
                                value: _fieldsFound / 7,
                                backgroundColor: Colors.white.withValues(alpha: 0.1),
                                valueColor: AlwaysStoppedAnimation(
                                    isDone ? successColor : accentColor),
                                minHeight: 3,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isDone
                                ? '${_result!.fieldsFound}/7 ✓'
                                : '$_fieldsFound/7',
                            style: TextStyle(
                              color: isDone ? successColor : accentColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),

                      // Result card (compact for landscape)
                      if (isDone)
                        _buildResultCardCompact(),

                      // Buttons
                      if (isDone)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            TextButton.icon(
                              onPressed: _rescan,
                              icon: const Icon(Icons.camera_alt, color: accentColor, size: 16),
                              label: const Text(
                                'Erneut',
                                style: TextStyle(color: accentColor, fontSize: 12),
                              ),
                            ),
                            const SizedBox(width: 16),
                            ElevatedButton.icon(
                              onPressed: _confirm,
                              icon: const Icon(Icons.check, color: Colors.white, size: 16),
                              label: const Text(
                                'Daten übernehmen',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: successColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ],
                        )
                      else
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '💡 Fahrzeugschein flach hinlegen',
                              style: TextStyle(color: Colors.grey[500], fontSize: 11),
                            ),
                            const SizedBox(width: 12),
                            if (_fieldsFound > 0)
                              TextButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _isScanning = false;
                                    _result = _bestResult;
                                  });
                                  _scanTimer?.cancel();
                                  _scanLineController.stop();
                                },
                                icon: const Icon(Icons.check, color: accentColor, size: 14),
                                label: Text(
                                  'Übernehmen ($_fieldsFound/7)',
                                  style: const TextStyle(color: accentColor, fontSize: 12),
                                ),
                              )
                            else
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(),
                                child: Text(
                                  'Manuell eingeben →',
                                  style: TextStyle(
                                    color: Colors.grey[400],
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      const SizedBox(height: 4),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildFieldBadges() {
    final r = _result ?? _bestResult;
    final fields = [
      ('Hersteller', r?.make != null),
      ('Modell', r?.model != null),
      ('Baujahr', r?.year != null),
      ('VIN', r?.vin != null),
      ('Kraftstoff', r?.fuelType != null),
      ('Reifen', r?.tireSize != null),
    ];

    return fields.map((f) {
      final found = f.$2;
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: found
              ? const Color(0xFF10B981).withValues(alpha: 0.15)
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: found
                ? const Color(0xFF10B981).withValues(alpha: 0.3)
                : Colors.transparent,
          ),
        ),
        child: Text(
          '${found ? "✓ " : ""}${f.$1}',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w600,
            color: found ? const Color(0xFF10B981) : Colors.grey[600],
          ),
        ),
      );
    }).toList();
  }

  Widget _buildResultCard() {
    final r = _result!;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: const Color(0xFF10B981).withValues(alpha: 0.5), width: 1.5),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle,
                  color: Color(0xFF10B981), size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${r.make ?? "Fahrzeug"} ${r.model ?? ""}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (r.year != null || r.fuelType != null || r.tireSize != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                [
                  if (r.fuelType != null) _fuelLabel(r.fuelType!),
                  if (r.year != null) '${r.year}',
                  if (r.tireSize != null) r.tireSize.toString(),
                ].join(' · '),
                style: TextStyle(color: Colors.grey[400], fontSize: 11),
              ),
            ),
        ],
      ),
    );
  }

  /// Compact result card optimized for landscape bottom bar
  Widget _buildResultCardCompact() {
    final r = _result!;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: const Color(0xFF10B981).withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
          const SizedBox(width: 8),
          Text(
            '${r.make ?? "Fahrzeug"} ${r.model ?? ""}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (r.year != null) ...[
            const SizedBox(width: 8),
            Text('${r.year}',
              style: TextStyle(color: Colors.grey[400], fontSize: 11)),
          ],
        ],
      ),
    );
  }

  String _fuelLabel(String code) {
    const labels = {
      'PETROL': 'Benzin',
      'DIESEL': 'Diesel',
      'ELECTRIC': 'Elektrisch',
      'HYBRID': 'Hybrid',
      'PLUGIN_HYBRID': 'Plug-in Hybrid',
      'LPG': 'Autogas',
      'CNG': 'Erdgas',
    };
    return labels[code] ?? code;
  }
}

// ── Document scan frame overlay ──

class _DocScanOverlayPainter extends CustomPainter {
  final Color frameColor;
  final Size screenSize;

  _DocScanOverlayPainter({required this.frameColor, required this.screenSize});

  @override
  void paint(Canvas canvas, Size size) {
    final overlayPaint = Paint()..color = Colors.black.withValues(alpha: 0.55);

    // Landscape-optimized document frame (wide, shorter)
    final frameWidth = size.width * 0.7;
    final frameHeight = size.height * 0.65;
    final frameRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height * 0.45),
      width: frameWidth,
      height: frameHeight,
    );

    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(frameRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, overlayPaint);

    final framePaint = Paint()
      ..color = frameColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRRect(
      RRect.fromRectAndRadius(frameRect, const Radius.circular(16)),
      framePaint,
    );

    // Corner accents
    const cornerLen = 32.0;
    const cornerWidth = 4.0;
    final cornerPaint = Paint()
      ..color = frameColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = cornerWidth
      ..strokeCap = StrokeCap.round;

    final corners = [
      [frameRect.topLeft, Offset(frameRect.left + cornerLen, frameRect.top)],
      [frameRect.topLeft, Offset(frameRect.left, frameRect.top + cornerLen)],
      [frameRect.topRight, Offset(frameRect.right - cornerLen, frameRect.top)],
      [frameRect.topRight, Offset(frameRect.right, frameRect.top + cornerLen)],
      [
        frameRect.bottomLeft,
        Offset(frameRect.left + cornerLen, frameRect.bottom)
      ],
      [
        frameRect.bottomLeft,
        Offset(frameRect.left, frameRect.bottom - cornerLen)
      ],
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
  bool shouldRepaint(covariant _DocScanOverlayPainter old) =>
      frameColor != old.frameColor || screenSize != old.screenSize;
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
