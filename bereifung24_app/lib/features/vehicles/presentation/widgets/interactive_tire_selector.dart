import 'dart:math';
import 'package:flutter/material.dart';

/// Interactive tire size selector with visual tire graphic and 5-step flow.
/// Matches the web app at bereifung24.de.
class InteractiveTireSelector extends StatefulWidget {
  final String vehicleType; // 'CAR', 'MOTORCYCLE', 'TRAILER'
  final Function(Map<String, dynamic>?) onChanged;
  final Map<String, dynamic>? initialSpec;

  const InteractiveTireSelector({
    super.key,
    required this.vehicleType,
    required this.onChanged,
    this.initialSpec,
  });

  @override
  State<InteractiveTireSelector> createState() =>
      _InteractiveTireSelectorState();
}

class _InteractiveTireSelectorState extends State<InteractiveTireSelector> {
  int _step = 1; // 1-6 (6 = all selected)
  int? _width;
  int? _aspectRatio;
  int? _diameter;
  int? _loadIndex;
  String? _speedRating;
  bool _selfTriggered = false;

  @override
  void initState() {
    super.initState();
    _applySpec(widget.initialSpec);
  }

  @override
  void didUpdateWidget(InteractiveTireSelector oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Reset when vehicle type changes
    if (widget.vehicleType != oldWidget.vehicleType) {
      setState(() {
        _step = 1;
        _width = null;
        _aspectRatio = null;
        _diameter = null;
        _loadIndex = null;
        _speedRating = null;
      });
      return;
    }

    // Ignore parent rebuild caused by our own _notify()
    if (_selfTriggered) {
      _selfTriggered = false;
      return;
    }

    // Reset when parent clears the spec
    if (widget.initialSpec == null && oldWidget.initialSpec != null) {
      setState(() {
        _step = 1;
        _width = null;
        _aspectRatio = null;
        _diameter = null;
        _loadIndex = null;
        _speedRating = null;
      });
      return;
    }

    // Re-apply spec when parent updates it externally (e.g. scanner)
    if (widget.initialSpec != oldWidget.initialSpec &&
        widget.initialSpec != null &&
        widget.initialSpec!['width'] != null) {
      _applySpec(widget.initialSpec);
    }
  }

  void _applySpec(Map<String, dynamic>? spec) {
    if (spec != null &&
        spec['width'] != null &&
        spec['aspectRatio'] != null &&
        spec['diameter'] != null) {
      setState(() {
        _width = spec['width'] as int;
        _aspectRatio = spec['aspectRatio'] as int;
        _diameter = spec['diameter'] as int;
        _loadIndex = spec['loadIndex'] as int?;
        _speedRating = spec['speedRating'] as String?;
        // Determine correct step based on filled fields
        if (_speedRating != null) {
          _step = 6;
        } else if (_loadIndex != null) {
          _step = 5;
        } else {
          _step = 4;
        }
      });
    }
  }

  // ── Data arrays ──

  static const _carWidths = [
    125,
    135,
    145,
    155,
    165,
    175,
    185,
    195,
    205,
    215,
    225,
    235,
    245,
    255,
    265,
    275,
    285,
    295,
    305,
    315,
    325,
    335,
    345,
    355,
    365,
    375,
    385,
    395,
    405,
    415,
    425
  ];
  static const _carAspects = [
    20,
    25,
    30,
    35,
    40,
    45,
    50,
    55,
    60,
    65,
    70,
    75,
    80,
    85,
    90
  ];
  static const _carDiameters = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  static const _motoWidths = [
    70,
    80,
    90,
    100,
    110,
    120,
    130,
    140,
    150,
    160,
    170,
    180,
    190,
    200,
    210,
    220
  ];
  static const _motoAspects = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100];
  static const _motoDiameters = [
    8,
    10,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    23
  ];

  static const _speedRatings = <String, int>{
    'J': 100,
    'K': 110,
    'L': 120,
    'M': 130,
    'N': 140,
    'P': 150,
    'Q': 160,
    'R': 170,
    'S': 180,
    'T': 190,
    'U': 200,
    'H': 210,
    'V': 240,
    'W': 270,
    'Y': 300,
    'ZR': 240,
  };

  static const _loadIndexKg = <int, int>{
    42: 150,
    43: 155,
    44: 160,
    45: 165,
    46: 170,
    47: 175,
    48: 180,
    49: 185,
    50: 190,
    51: 195,
    52: 200,
    53: 206,
    54: 212,
    55: 218,
    56: 224,
    57: 230,
    58: 236,
    59: 243,
    60: 250,
    61: 257,
    62: 265,
    63: 272,
    64: 280,
    65: 290,
    66: 300,
    67: 307,
    68: 315,
    69: 325,
    70: 335,
    71: 345,
    72: 355,
    73: 365,
    74: 375,
    75: 387,
    76: 400,
    77: 412,
    78: 425,
    79: 437,
    80: 450,
    81: 462,
    82: 475,
    83: 487,
    84: 500,
    85: 515,
    86: 530,
    87: 545,
    88: 560,
    89: 580,
    90: 600,
    91: 615,
    92: 630,
    93: 650,
    94: 670,
    95: 690,
    96: 710,
    97: 730,
    98: 750,
    99: 775,
    100: 800,
    101: 825,
    102: 850,
    103: 875,
    104: 900,
    105: 925,
    106: 950,
    107: 975,
    108: 1000,
    109: 1030,
    110: 1060,
    111: 1090,
    112: 1120,
    113: 1150,
    114: 1180,
    115: 1215,
    116: 1250,
    117: 1285,
    118: 1320,
    119: 1360,
    120: 1400,
  };

  // ── Derived getters ──

  bool get _isMoto => widget.vehicleType == 'MOTORCYCLE';
  List<int> get _widths => _isMoto ? _motoWidths : _carWidths;
  List<int> get _aspects => _isMoto ? _motoAspects : _carAspects;
  List<int> get _diameters => _isMoto ? _motoDiameters : _carDiameters;
  List<int> get _loadIndices => _isMoto
      ? List.generate(49, (i) => i + 42)
      : List.generate(46, (i) => i + 75);

  // ── Actions ──

  void _select(dynamic value) {
    setState(() {
      switch (_step) {
        case 1:
          _width = value as int;
        case 2:
          _aspectRatio = value as int;
        case 3:
          _diameter = value as int;
        case 4:
          _loadIndex = value as int;
        case 5:
          _speedRating = value as String;
      }
      _step++;
    });
    _notify();
  }

  void _goBack() {
    if (_step <= 1) return;
    setState(() {
      _step--;
      switch (_step) {
        case 1:
          _width = null;
        case 2:
          _aspectRatio = null;
        case 3:
          _diameter = null;
        case 4:
          _loadIndex = null;
        case 5:
          _speedRating = null;
      }
    });
    _notify();
  }

  void _skip() {
    // Load index and speed rating are required — skip disabled
    return;
  }

  void _reset() {
    setState(() {
      _step = 1;
      _width = null;
      _aspectRatio = null;
      _diameter = null;
      _loadIndex = null;
      _speedRating = null;
    });
    _notify();
  }

  void _notify() {
    _selfTriggered = true;
    if (_width == null || _aspectRatio == null || _diameter == null) {
      widget.onChanged(null);
      return;
    }
    widget.onChanged({
      'width': _width,
      'aspectRatio': _aspectRatio,
      'diameter': _diameter,
      if (_loadIndex != null) 'loadIndex': _loadIndex,
      if (_speedRating != null) 'speedRating': _speedRating,
    });
  }

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tire graphic - real tire image with overlaid specs
        SizedBox(
          width: 280,
          height: 160,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Image.asset(
                'assets/images/tire_template.png',
                width: 280,
                height: 160,
                fit: BoxFit.contain,
              ),
              CustomPaint(
                size: const Size(280, 160),
                painter: _TireSpecOverlayPainter(
                  width: _width,
                  aspectRatio: _aspectRatio,
                  diameter: _diameter,
                  loadIndex: _loadIndex,
                  speedRating: _speedRating,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Step indicator
        _buildStepIndicator(),
        const SizedBox(height: 12),

        if (_step <= 5) ...[
          // Navigation (back + skip)
          _buildNavRow(),
          // Step label
          _buildStepLabel(),
          const SizedBox(height: 8),
          // Grid
          _buildGrid(),
        ] else ...[
          // Completed state
          _buildCompleteState(),
        ],
      ],
    );
  }

  Widget _buildStepIndicator() {
    const colors = [
      Colors.blue,
      Colors.green,
      Colors.amber,
      Colors.purple,
      Colors.pink
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(9, (i) {
        if (i.isOdd) {
          final stepIdx = i ~/ 2;
          final done = _step > stepIdx + 1;
          return Container(
            width: 20,
            height: 2,
            color: done ? Colors.green : Colors.grey.shade300,
          );
        }
        final stepNum = i ~/ 2 + 1;
        final done = _step > stepNum;
        final current = _step == stepNum;
        return Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: done
                ? Colors.green
                : current
                    ? colors[stepNum - 1]
                    : Colors.grey.shade200,
          ),
          child: Center(
            child: done
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : Text(
                    '$stepNum',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: current ? Colors.white : Colors.grey,
                    ),
                  ),
          ),
        );
      }),
    );
  }

  Widget _buildNavRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        if (_step > 1)
          TextButton.icon(
            onPressed: _goBack,
            icon: const Icon(Icons.arrow_back, size: 18),
            label: const Text('Zurück'),
          )
        else
          const SizedBox.shrink(),
        const SizedBox.shrink(),
      ],
    );
  }

  Widget _buildStepLabel() {
    const labels = [
      'Breite wählen (mm):',
      'Querschnitt wählen (%):',
      'Felgengröße wählen (Zoll):',
      'Tragfähigkeit wählen:',
      'Geschwindigkeitsindex wählen:',
    ];
    const colors = [
      Colors.blue,
      Colors.green,
      Colors.amber,
      Colors.purple,
      Colors.pink
    ];

    return Align(
      alignment: Alignment.centerLeft,
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: colors[_step - 1],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            labels[_step - 1],
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: colors[_step - 1],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    late List<dynamic> items;
    switch (_step) {
      case 1:
        items = _widths;
      case 2:
        items = _aspects;
      case 3:
        items = _diameters;
      case 4:
        items = _loadIndices;
      case 5:
        items = _speedRatings.keys.toList();
      default:
        items = [];
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 280),
      child: GridView.builder(
        shrinkWrap: true,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 2.0,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          String label;
          String? subtitle;

          if (_step == 4 && item is int) {
            label = '$item';
          } else if (_step == 5 && item is String) {
            label = item;
          } else {
            label = '$item';
          }

          return _GridButton(
            label: label,
            subtitle: subtitle,
            onTap: () => _select(item),
          );
        },
      ),
    );
  }

  Widget _buildCompleteState() {
    final li = _loadIndex != null ? ' $_loadIndex' : '';
    final sr = _speedRating ?? '';
    final spec = '$_width/$_aspectRatio R$_diameter$li$sr';

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.green.shade200),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Reifengröße ausgewählt',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(spec,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Andere Größe'),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Grid button ──

class _GridButton extends StatelessWidget {
  final String label;
  final String? subtitle;
  final VoidCallback onTap;

  const _GridButton({
    required this.label,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: Theme.of(context).dividerColor),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                if (subtitle != null)
                  Text(subtitle!,
                      style: TextStyle(
                          fontSize: 10,
                          color: Theme.of(context).textTheme.bodySmall?.color)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Tire spec overlay painter (draws curved text on the real tire image) ──

class _TireSpecOverlayPainter extends CustomPainter {
  final int? width;
  final int? aspectRatio;
  final int? diameter;
  final int? loadIndex;
  final String? speedRating;

  _TireSpecOverlayPainter({
    this.width,
    this.aspectRatio,
    this.diameter,
    this.loadIndex,
    this.speedRating,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // The tire image has a light (#F8FAFC) background.
    // We draw the spec text BETWEEN the two sidewall lines.
    final w = width != null ? '$width' : '???';
    final a = aspectRatio != null ? '$aspectRatio' : '??';
    final d = diameter != null ? '$diameter' : '??';
    final li = loadIndex != null ? '$loadIndex' : '??';
    final sr = speedRating ?? '?';
    final fullSpec = '$w/$a R$d $li$sr';

    // Arc center at bottom-center, radius places text between the two lines
    final arcCenterX = size.width / 2;
    final arcCenterY = size.height + size.width * 0.40;
    final arcCenter = Offset(arcCenterX, arcCenterY);
    final arcRadius = size.width * 0.72;

    // Narrower sweep to keep text within tire bounds
    _drawTextOnArc(
      canvas,
      arcCenter,
      arcRadius,
      fullSpec,
      const TextStyle(
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.8,
        shadows: [
          Shadow(color: Colors.black87, blurRadius: 4),
          Shadow(color: Colors.black54, blurRadius: 2),
        ],
      ),
      startAngle: -pi / 2 - 0.45,
      sweepAngle: 0.90,
    );
  }

  void _drawTextOnArc(
    Canvas canvas,
    Offset center,
    double radius,
    String text,
    TextStyle style, {
    required double startAngle,
    required double sweepAngle,
  }) {
    final anglePerChar = sweepAngle / max(text.length, 1);
    for (int i = 0; i < text.length; i++) {
      final angle = startAngle + anglePerChar * (i + 0.5);
      final tp = TextPainter(
        text: TextSpan(text: text[i], style: style),
        textDirection: TextDirection.ltr,
      )..layout();

      canvas.save();
      canvas.translate(
        center.dx + cos(angle) * radius,
        center.dy + sin(angle) * radius,
      );
      canvas.rotate(angle + pi / 2);
      tp.paint(canvas, Offset(-tp.width / 2, -tp.height / 2));
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _TireSpecOverlayPainter old) {
    return width != old.width ||
        aspectRatio != old.aspectRatio ||
        diameter != old.diameter ||
        loadIndex != old.loadIndex ||
        speedRating != old.speedRating;
  }
}
