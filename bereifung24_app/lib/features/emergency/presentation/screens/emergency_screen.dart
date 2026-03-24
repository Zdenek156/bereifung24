import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/network/api_client.dart';
import '../../../../data/models/workshop.dart';

// ══════════════════════════════════════
// 🆘 Pannen-Modus / Emergency Screen
// ══════════════════════════════════════

enum _ScreenPhase { locating, found, results, error }

class EmergencyScreen extends ConsumerStatefulWidget {
  const EmergencyScreen({super.key});

  @override
  ConsumerState<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends ConsumerState<EmergencyScreen>
    with TickerProviderStateMixin {
  _ScreenPhase _phase = _ScreenPhase.locating;
  List<Workshop> _workshops = [];
  String _locationText = '';
  String? _errorMessage;

  late AnimationController _rippleController;
  late AnimationController _checkController;

  @override
  void initState() {
    super.initState();
    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _startLocating();
  }

  @override
  void dispose() {
    _rippleController.dispose();
    _checkController.dispose();
    super.dispose();
  }

  Future<void> _startLocating() async {
    setState(() {
      _phase = _ScreenPhase.locating;
      _errorMessage = null;
    });

    final locService = LocationService();
    final position = await locService.getCurrentPosition();
    if (!mounted) return;

    if (position == null) {
      setState(() {
        _phase = _ScreenPhase.error;
        _errorMessage = locService.lastError ??
            'Standort konnte nicht ermittelt werden.\nBitte aktiviere die Standortfreigabe.';
      });
      return;
    }

    // Show "found" animation briefly
    setState(() {
      _phase = _ScreenPhase.found;
      _locationText =
          '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
    });
    _checkController.forward();

    // Search workshops within 25 km
    try {
      final response = await ApiClient().searchWorkshops({
        'latitude': position.latitude.toString(),
        'longitude': position.longitude.toString(),
        'radius': '25',
      });

      if (!mounted) return;

      final data = response.data;
      final list = (data is List ? data : data['workshops'] ?? []) as List;
      final workshops =
          list.map((e) => Workshop.fromJson(e as Map<String, dynamic>)).toList();
      // Sort by distance (nearest first)
      workshops.sort((a, b) =>
          (a.distance ?? 999).compareTo(b.distance ?? 999));

      await Future.delayed(const Duration(milliseconds: 1200));
      if (!mounted) return;

      setState(() {
        _workshops = workshops;
        _phase = _ScreenPhase.results;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _ScreenPhase.error;
        _errorMessage = 'Werkstätten konnten nicht geladen werden.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? B24Colors.darkBackground : const Color(0xFFFEF2F2),
      appBar: AppBar(
        backgroundColor: B24Colors.accentRed,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('🆘', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text(
              'Pannen-Modus',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: switch (_phase) {
        _ScreenPhase.locating => _buildLocatingView(isDark),
        _ScreenPhase.found => _buildLocatingView(isDark),
        _ScreenPhase.results => _buildResultsView(isDark),
        _ScreenPhase.error => _buildErrorView(isDark),
      },
    );
  }

  // ── Locating Animation ──

  Widget _buildLocatingView(bool isDark) {
    final isFound = _phase == _ScreenPhase.found;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 200,
            height: 200,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Ripple circles
                ...List.generate(3, (i) {
                  return AnimatedBuilder(
                    animation: _rippleController,
                    builder: (context, _) {
                      final progress =
                          ((_rippleController.value + i * 0.33) % 1.0);
                      return Container(
                        width: 80 + progress * 120,
                        height: 80 + progress * 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: B24Colors.accentRed
                                .withValues(alpha: (1 - progress) * 0.4),
                            width: 2,
                          ),
                        ),
                      );
                    },
                  );
                }),
                // Center icon
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 400),
                  child: isFound
                      ? ScaleTransition(
                          scale: CurvedAnimation(
                            parent: _checkController,
                            curve: Curves.elasticOut,
                          ),
                          child: Container(
                            key: const ValueKey('check'),
                            width: 70,
                            height: 70,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: B24Colors.accentGreen,
                            ),
                            child: const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 36,
                            ),
                          ),
                        )
                      : Container(
                          key: const ValueKey('spinner'),
                          width: 70,
                          height: 70,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: B24Colors.accentRed.withValues(alpha: 0.1),
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(18),
                            child: CircularProgressIndicator(
                              color: B24Colors.accentRed,
                              strokeWidth: 3,
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text(
            isFound ? 'Standort gefunden!' : 'Standort wird ermittelt...',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: isFound ? B24Colors.accentGreen : (isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary),
            ),
          ),
          if (isFound && _locationText.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              _locationText,
              style: const TextStyle(
                fontSize: 13,
                color: B24Colors.textSecondary,
              ),
            ),
          ],
          if (!isFound) ...[
            const SizedBox(height: 6),
            Text(
              'Wir suchen Werkstätten in deiner Nähe...',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Error View ──

  Widget _buildErrorView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_off, size: 64, color: B24Colors.accentRed),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Ein Fehler ist aufgetreten.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _startLocating,
              icon: const Icon(Icons.refresh),
              label: const Text('Erneut versuchen'),
              style: FilledButton.styleFrom(
                backgroundColor: B24Colors.accentRed,
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => LocationService().openAppSettings(),
              icon: const Icon(Icons.settings),
              label: const Text('Standort-Einstellungen'),
            ),
          ],
        ),
      ),
    );
  }

  // ── Results View ──

  Widget _buildResultsView(bool isDark) {
    return Column(
      children: [
        // Location info bar
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: isDark ? B24Colors.accentRed.withValues(alpha: 0.15) : B24Colors.accentRed.withValues(alpha: 0.08),
          child: Row(
            children: [
              const Icon(Icons.my_location, size: 16, color: B24Colors.accentRed),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _workshops.isNotEmpty
                      ? '${_workshops.length} Werkstätten in deiner Nähe gefunden'
                      : 'Keine Werkstätten in der Nähe gefunden',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
                  ),
                ),
              ),
              GestureDetector(
                onTap: _startLocating,
                child: const Icon(Icons.refresh, size: 18, color: B24Colors.accentRed),
              ),
            ],
          ),
        ),

        // Workshop list
        Expanded(
          child: _workshops.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: _workshops.length + 1, // +1 for ADAC hint
                  itemBuilder: (context, index) {
                    if (index == 0) return _buildEmergencyHint();
                    return _WorkshopEmergencyCard(
                      workshop: _workshops[index - 1],
                      isNearest: index == 1,
                    );
                  },
                ),
        ),

        // Bottom hint
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          decoration: BoxDecoration(
            color: isDark ? B24Colors.darkSurface : Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                blurRadius: 10,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Text(
            'Rufe die Werkstatt an und vereinbare eine Soforthilfe. '
            'Deinen nächsten Service kannst du danach direkt über B24 buchen.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 56, color: isDark ? B24Colors.darkTextSecondary : B24Colors.textTertiary),
            const SizedBox(height: 16),
            Text(
              'Keine Werkstätten gefunden',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Leider gibt es keine Werkstätten in 25 km Umkreis.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary),
            ),
            const SizedBox(height: 20),
            _buildEmergencyHint(),
          ],
        ),
      ),
    );
  }

  Widget _buildEmergencyHint() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF422006) : const Color(0xFFFEF9C3),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? const Color(0xFF854D0E) : const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('💡', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text(
                'Notfall-Nummern',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _EmergencyPhoneRow(
            label: 'ADAC Pannenhilfe',
            number: '0800 510 0112',
            icon: Icons.car_repair,
          ),
          const SizedBox(height: 6),
          _EmergencyPhoneRow(
            label: 'Polizei / Notruf',
            number: '110',
            icon: Icons.local_police,
          ),
        ],
      ),
    );
  }
}

// ── Emergency Phone Row ──

class _EmergencyPhoneRow extends StatelessWidget {
  final String label;
  final String number;
  final IconData icon;

  const _EmergencyPhoneRow({
    required this.label,
    required this.number,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => _callNumber(number),
      child: Row(
        children: [
          Icon(icon, size: 16, color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
              ),
            ),
          ),
          Text(
            number,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: B24Colors.primaryBlue,
            ),
          ),
          const SizedBox(width: 6),
          const Icon(Icons.phone, size: 14, color: B24Colors.primaryBlue),
        ],
      ),
    );
  }
}

// ── Workshop Emergency Card ──

class _WorkshopEmergencyCard extends StatelessWidget {
  final Workshop workshop;
  final bool isNearest;

  const _WorkshopEmergencyCard({
    required this.workshop,
    this.isNearest = false,
  });

  @override
  Widget build(BuildContext context) {
    final isOpen = _isCurrentlyOpen(workshop);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? B24Colors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isNearest
              ? B24Colors.accentGreen.withValues(alpha: 0.5)
              : (isDark ? B24Colors.darkBorder : B24Colors.border),
          width: isNearest ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Name + open/closed badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      workshop.name,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Text(
                          workshop.city,
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary,
                          ),
                        ),
                        if (workshop.distance != null) ...[
                          const Text(' · ',
                              style: TextStyle(color: B24Colors.textTertiary)),
                          Text(
                            workshop.distanceFormatted,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight:
                                  isNearest ? FontWeight.w700 : FontWeight.w500,
                              color: isNearest
                                  ? B24Colors.accentGreen
                                  : B24Colors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isOpen
                      ? B24Colors.accentGreen.withValues(alpha: 0.1)
                      : B24Colors.accentRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isOpen ? 'Geöffnet' : 'Geschlossen',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color:
                        isOpen ? B24Colors.accentGreen : B24Colors.accentRed,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Rating + hours
          Row(
            children: [
              if (workshop.averageRating != null) ...[
                const Icon(Icons.star, size: 14, color: Color(0xFFF59E0B)),
                const SizedBox(width: 3),
                Text(
                  workshop.averageRating!.toStringAsFixed(1),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
                  ),
                ),
                        Text(
                          ' (${workshop.reviewCount})',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Expanded(
                        child: Text(
                          _getHoursText(workshop),
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? B24Colors.darkTextSecondary : B24Colors.textSecondary,
                          ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Call button
          if (workshop.phone != null && workshop.phone!.isNotEmpty)
            SizedBox(
              width: double.infinity,
              child: isOpen
                  ? FilledButton.icon(
                      onPressed: () => _callNumber(workshop.phone!),
                      icon: const Icon(Icons.phone, size: 18),
                      label: const Text('Jetzt anrufen'),
                      style: FilledButton.styleFrom(
                        backgroundColor: B24Colors.accentGreen,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    )
                  : OutlinedButton.icon(
                      onPressed: () => _callNumber(workshop.phone!),
                      icon: const Icon(Icons.phone, size: 18),
                      label: Text(
                        'Trotzdem anrufen · ${workshop.phone}',
                        style: const TextStyle(fontSize: 13),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: B24Colors.textSecondary,
                        side: const BorderSide(color: B24Colors.border),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
            )
          else
              Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? B24Colors.darkBackground : B24Colors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Keine Telefonnummer hinterlegt',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? B24Colors.darkTextSecondary : B24Colors.textTertiary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Helpers ──

bool _isCurrentlyOpen(Workshop workshop) {
  if (workshop.openingHours.isEmpty) return false;
  final now = DateTime.now();
  // DateTime weekday: 1=Mon, 7=Sun — matches our model
  final todayHours = workshop.openingHours
      .where((h) => h.dayOfWeek == now.weekday && !h.isClosed)
      .toList();
  if (todayHours.isEmpty) return false;

  for (final h in todayHours) {
    final openParts = h.openTime.split(':');
    final closeParts = h.closeTime.split(':');
    if (openParts.length < 2 || closeParts.length < 2) continue;

    final openMinutes =
        int.parse(openParts[0]) * 60 + int.parse(openParts[1]);
    final closeMinutes =
        int.parse(closeParts[0]) * 60 + int.parse(closeParts[1]);
    final nowMinutes = now.hour * 60 + now.minute;

    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) return true;
  }
  return false;
}

String _getHoursText(Workshop workshop) {
  if (workshop.openingHours.isEmpty) return '';
  final now = DateTime.now();
  final todayHours = workshop.openingHours
      .where((h) => h.dayOfWeek == now.weekday)
      .toList();

  if (todayHours.isEmpty || todayHours.every((h) => h.isClosed)) {
    // Find next open day
    for (var offset = 1; offset <= 7; offset++) {
      final nextDay = ((now.weekday - 1 + offset) % 7) + 1;
      final nextHours = workshop.openingHours
          .where((h) => h.dayOfWeek == nextDay && !h.isClosed)
          .toList();
      if (nextHours.isNotEmpty) {
        return 'Öffnet ${nextHours.first.dayName} ${nextHours.first.openTime}';
      }
    }
    return 'Geschlossen';
  }

  final open = todayHours.firstWhere((h) => !h.isClosed,
      orElse: () => todayHours.first);
  if (open.isClosed) return 'Heute geschlossen';

  if (_isCurrentlyOpen(workshop)) {
    return 'Schließt um ${open.closeTime} Uhr';
  } else {
    return 'Öffnet um ${open.openTime} Uhr';
  }
}

Future<void> _callNumber(String number) async {
  final cleaned = number.replaceAll(RegExp(r'[^\d+]'), '');
  final uri = Uri.parse('tel:$cleaned');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  }
}
