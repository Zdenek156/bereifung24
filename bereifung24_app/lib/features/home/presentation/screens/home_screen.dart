import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../bookings/presentation/screens/bookings_screen.dart';
import '../../../search/presentation/screens/search_screen.dart';
import '../../../vehicles/presentation/screens/vehicles_screen.dart';

// ══════════════════════════════════════
// CO2 Stats Provider
// ══════════════════════════════════════

final co2StatsProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  try {
    final response = await ApiClient().getCO2Stats();
    if (response.statusCode == 200 && response.data != null) {
      return response.data as Map<String, dynamic>;
    }
    return null;
  } catch (_) {
    return null;
  }
});

// ══════════════════════════════════════
// Card shadow helper
// ══════════════════════════════════════

BoxShadow _cardShadow({bool isDark = false}) => BoxShadow(
      color: isDark
          ? Colors.black.withValues(alpha: 0.3)
          : const Color(0xFF0F172A).withValues(alpha: 0.08),
      blurRadius: 16,
      offset: const Offset(0, 4),
      spreadRadius: 0,
    );

BoxShadow _cardShadowLight({bool isDark = false}) => BoxShadow(
      color: isDark
          ? Colors.black.withValues(alpha: 0.2)
          : const Color(0xFF0F172A).withValues(alpha: 0.05),
      blurRadius: 10,
      offset: const Offset(0, 2),
      spreadRadius: 0,
    );

String _roleName(String role) => switch (role) {
      'WORKSHOP' => 'Werkstatt',
      'FREELANCER' => 'Freelancer',
      'EMPLOYEE' => 'Mitarbeiter',
      'ADMIN' => 'Administrator',
      _ => role,
    };

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _profileRefreshed = false;

  @override
  void initState() {
    super.initState();
    // Einmalig Profil vom Backend laden (für Adresse nach Web-Änderung)
    Future.microtask(() {
      if (!_profileRefreshed) {
        _profileRefreshed = true;
        ref.read(authStateProvider.notifier).fetchProfile();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.read(authStateProvider.notifier).fetchProfile();
            ref.invalidate(bookingsProvider);
            ref.invalidate(vehiclesProvider);
            ref.invalidate(co2StatsProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header (compact) ──
                _FadeSlideIn(
                  delay: 0,
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hallo${user?.firstName != null ? ', ${user!.firstName}' : ''}!',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: isDark
                                    ? B24Colors.darkTextPrimary
                                    : B24Colors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Was steht heute an?',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: isDark
                                    ? B24Colors.darkTextSecondary
                                    : B24Colors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Image.asset(
                        isDark
                            ? 'assets/images/b24_logo_dark.png'
                            : 'assets/images/b24_logo_light.png',
                        width: 64,
                        height: 64,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // ── Role warning for non-customer users ──
                if (user != null && user.role != 'CUSTOMER') ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.orange.shade300),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline,
                            color: Colors.orange[800], size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Angemeldet als ${_roleName(user.role)}',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.orange[900],
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Diese App ist für Kunden. Für die Werkstattverwaltung nutze bitte das Web-Dashboard.',
                                style: TextStyle(
                                    fontSize: 11, color: Colors.orange[800]),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Adresse unvollständig (Google-Login) ──
                if (user != null &&
                    (user.street == null ||
                        user.street!.isEmpty ||
                        user.zipCode == null ||
                        user.zipCode!.isEmpty ||
                        user.city == null ||
                        user.city!.isEmpty)) ...[
                  Builder(builder: (context) {
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark
                            ? B24Colors.primaryBlue.withValues(alpha: 0.15)
                            : B24Colors.primaryPale,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? B24Colors.primaryBlue.withValues(alpha: 0.4)
                              : B24Colors.primaryBlue.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.location_off,
                                  color: B24Colors.primaryBlue, size: 22),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'Adresse fehlt',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: isDark
                                        ? B24Colors.darkTextPrimary
                                        : B24Colors.textPrimary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Padding(
                            padding: const EdgeInsets.only(left: 32),
                            child: Text(
                              'Bitte hinterlege deine Adresse, um Werkstätten in deiner Nähe zu finden und Termine buchen zu können.',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? B24Colors.darkTextSecondary
                                    : B24Colors.textSecondary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Padding(
                            padding: const EdgeInsets.only(left: 32),
                            child: SizedBox(
                              height: 34,
                              child: FilledButton.icon(
                                onPressed: () => context.push('/profile/edit'),
                                icon: const Icon(Icons.edit, size: 16),
                                label: const Text('Profil vervollständigen',
                                    style: TextStyle(fontSize: 13)),
                                style: FilledButton.styleFrom(
                                  backgroundColor: B24Colors.primaryBlue,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 16),
                ],

                // ── Nächster Termin (above the fold!) ──
                _FadeSlideIn(delay: 1, child: _NextAppointmentCard()),

                const SizedBox(height: 16),

                // ── Schnellbuchung / Fahrzeug-Kontext ──
                _FadeSlideIn(delay: 2, child: _VehicleQuickBookCard()),

                const SizedBox(height: 16),

                // ── Services (kompaktes 3×2 Grid) ──
                _FadeSlideIn(
                  delay: 3,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Serviceangebote',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? B24Colors.darkTextPrimary
                              : B24Colors.textPrimary,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.go('/search'),
                        child: const Text(
                          'Alle →',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: B24Colors.primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                _FadeSlideIn(delay: 4, child: _ServicesGrid()),

                const SizedBox(height: 16),

                // ── KI-Berater + Pannenhilfe ──
                _FadeSlideIn(
                  delay: 5,
                  child: IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(child: _AIAdvisorCard()),
                        const SizedBox(width: 12),
                        Expanded(child: _SOSCard()),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // ── Saisonaler Hinweis ──
                _FadeSlideIn(delay: 6, child: _SeasonTipCard()),

                const SizedBox(height: 16),

                // ── CO2 Bilanz ──
                _FadeSlideIn(delay: 7, child: _CO2BilanzCard()),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════
// KI-Berater Card
// ══════════════════════════════════════

class _AIAdvisorCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => context.push('/ai-advisor'),
      child: Container(
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF0284C7).withValues(alpha: 0.18)
              : const Color(0xFFDBEAFE),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [_cardShadow(isDark: isDark)],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
              child: Image.asset(
                'assets/images/services/ki_berater.jpg',
                width: double.infinity,
                height: 120,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Rollo AI',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color:
                    isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                'Dein KI-Berater!',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? B24Colors.darkTextSecondary
                      : B24Colors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════
// SOS / Pannen-Modus Card (compact)
// ══════════════════════════════════════

class _SOSCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => context.push('/emergency'),
      child: Container(
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF7F1D1D).withValues(alpha: 0.3)
              : const Color(0xFFFEE2E2),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [_cardShadow(isDark: isDark)],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
              child: Image.asset(
                'assets/images/services/sos.jpg',
                width: double.infinity,
                height: 120,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Pannenhilfe',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color:
                    isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                'Werkstatt sofort finden',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? B24Colors.darkTextSecondary
                      : B24Colors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════
// Next Appointment Card (Hero)
// ══════════════════════════════════════

class _NextAppointmentCard extends ConsumerWidget {
  static const _serviceLabels = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifen',
    'ALIGNMENT_BOTH': 'Achsvermessung',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bookingsAsync = ref.watch(bookingsProvider);

    // Prefer cached data to avoid layout jump on tab switch
    final bookings = bookingsAsync.valueOrNull;
    if (bookings == null) return const SizedBox.shrink();

    {
      final now = DateTime.now();
      final upcoming = bookings.where((b) {
        // Build full DateTime including time
        var apptDateTime = b.appointmentDate;
        if (b.appointmentTime != null && b.appointmentTime!.isNotEmpty) {
          final parts = b.appointmentTime!.split(':');
          if (parts.length >= 2) {
            final h = int.tryParse(parts[0]) ?? 0;
            final m = int.tryParse(parts[1]) ?? 0;
            apptDateTime = DateTime(
              apptDateTime.year,
              apptDateTime.month,
              apptDateTime.day,
              h,
              m,
            );
          }
        }
        return apptDateTime.isAfter(now) &&
            b.status != 'CANCELLED' &&
            b.status != 'NO_SHOW';
      }).toList()
        ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));

      if (upcoming.isEmpty) return const SizedBox.shrink();

      final next = upcoming.first;
      final dateStr =
          DateFormat('EEE, d. MMM yyyy', 'de_DE').format(next.appointmentDate);
      final timeStr = next.appointmentTime ?? '';
      final today = DateTime(now.year, now.month, now.day);
      final apptDay = DateTime(next.appointmentDate.year,
          next.appointmentDate.month, next.appointmentDate.day);
      final daysUntil = apptDay.difference(today).inDays;
      final daysLabel = daysUntil == 0
          ? 'Heute'
          : daysUntil == 1
              ? 'Morgen'
              : 'In $daysUntil Tagen';

      return GestureDetector(
        onTap: () => context.go('/bookings'),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                : const Color(0xFFE0F2FE),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [_cardShadowLight(isDark: isDark)],
          ),
          child: Row(
            children: [
              Expanded(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _serviceLabels[next.serviceType] ??
                            next.serviceTypeDisplay,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? B24Colors.darkTextPrimary
                              : B24Colors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$dateStr ($daysLabel)${timeStr.isNotEmpty ? '\n$timeStr Uhr' : ''}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? B24Colors.darkTextSecondary
                              : B24Colors.textSecondary,
                        ),
                      ),
                      if (next.workshopName != null) ...[
                        const SizedBox(height: 1),
                        Text(
                          '📍 ${next.workshopName}',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark
                                ? B24Colors.darkTextSecondary
                                : B24Colors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              ClipRRect(
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
                child: Image.asset(
                  'assets/images/services/termin.jpg',
                  width: 100,
                  height: 100,
                  fit: BoxFit.cover,
                ),
              ),
            ],
          ),
        ),
      );
    }
  }
}

// ══════════════════════════════════════
// Vehicle Quick Book Card
// ══════════════════════════════════════

final homeVehicleIndexProvider = StateProvider<int>((ref) => 0);

/// Load saved vehicle index from SharedPreferences
Future<void> _loadSavedVehicleIndex(WidgetRef ref) async {
  final prefs = await SharedPreferences.getInstance();
  final savedIdx = prefs.getInt('selectedVehicleIndex') ?? 0;
  ref.read(homeVehicleIndexProvider.notifier).state = savedIdx;
}

/// Save vehicle index to SharedPreferences
Future<void> saveHomeVehicleIndex(int index) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt('selectedVehicleIndex', index);
}

class _VehicleQuickBookCard extends ConsumerStatefulWidget {
  @override
  ConsumerState<_VehicleQuickBookCard> createState() =>
      _VehicleQuickBookCardState();
}

class _VehicleQuickBookCardState extends ConsumerState<_VehicleQuickBookCard> {
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadSavedVehicleIndex(ref).then((_) {
      if (mounted) setState(() => _loaded = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final vehiclesAsync = ref.watch(vehiclesProvider);

    // Prefer cached data to avoid skeleton flash on tab switch
    final vehicles = vehiclesAsync.valueOrNull;

    if (vehicles == null) {
      // True first load — no cached data yet
      return _buildLoading(context);
    }

    if (vehicles.isEmpty) {
      // Show skeleton until auth resolves, not the "add vehicle" prompt
      final authState = ref.watch(authStateProvider);
      if (!authState.isAuthenticated) return _buildLoading(context);
      return _buildEmpty(context);
    }

    final idx =
        ref.watch(homeVehicleIndexProvider).clamp(0, vehicles.length - 1);
    final v = vehicles[idx];

    // Always keep search provider in sync with home selection
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(selectedVehicleProvider.notifier).state = v;
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? B24Colors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [_cardShadow(isDark: isDark)],
      ),
      child: Row(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${v.make} ${v.model}',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? B24Colors.darkTextPrimary
                          : B24Colors.textPrimary,
                    ),
                  ),
                  Text(
                    '${v.licensePlate ?? ''}${v.year != null ? ' · ${v.year}' : ''}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? B24Colors.darkTextSecondary
                          : B24Colors.textSecondary,
                    ),
                  ),
                  if (vehicles.length > 1) ...[
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () =>
                          _showVehiclePicker(context, vehicles, idx),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isDark
                            ? const Color(0xFF94A3B8)
                            : const Color(0xFF64748B),
                        side: BorderSide(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.3)
                              : Colors.grey.withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Fahrzeug wechseln',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
            child: Image.asset(
              v.vehicleType == 'MOTORCYCLE'
                  ? 'assets/images/services/fahrzeug_motorrad.jpg'
                  : v.vehicleType == 'TRAILER'
                      ? 'assets/images/services/fahrzeug_anhaenger.jpg'
                      : 'assets/images/services/fahrzeug_car.jpg',
              width: 100,
              height: 100,
              fit: BoxFit.cover,
            ),
          ),
        ],
      ),
    );
  }

  void _showVehiclePicker(
      BuildContext context, List<Vehicle> vehicles, int currentIdx) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.7,
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Fahrzeug wählen',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: B24Colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: vehicles.length,
                    itemBuilder: (ctx, i) {
                      final veh = vehicles[i];
                      final isSelected = i == currentIdx;
                      return GestureDetector(
                        onTap: () {
                          ref.read(homeVehicleIndexProvider.notifier).state = i;
                          ref.read(selectedVehicleProvider.notifier).state =
                              vehicles[i];
                          saveHomeVehicleIndex(i);
                          Navigator.pop(ctx);
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? B24Colors.primaryPale
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? B24Colors.primaryBlue
                                  : B24Colors.border,
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                veh.vehicleType == 'MOTORCYCLE'
                                    ? '🏍️'
                                    : veh.vehicleType == 'TRAILER'
                                        ? '🚛'
                                        : '🚗',
                                style: const TextStyle(fontSize: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${veh.make} ${veh.model}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: B24Colors.textPrimary,
                                      ),
                                    ),
                                    if (veh.licensePlate != null)
                                      Text(
                                        veh.licensePlate!,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: B24Colors.textSecondary,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              if (isSelected)
                                const Icon(Icons.check_circle,
                                    color: B24Colors.primaryBlue, size: 22),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLoading(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: isDark ? B24Colors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [_cardShadow(isDark: isDark)],
      ),
      child: Row(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 140,
                    height: 14,
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.08)
                          : Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 100,
                    height: 12,
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.05)
                          : Colors.grey[100],
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
            child: Container(
              width: 100,
              height: 100,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.05)
                  : Colors.grey[100],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? B24Colors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [_cardShadow(isDark: isDark)],
      ),
      child: Column(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                  : B24Colors.primaryPale,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: const Text('🚗', style: TextStyle(fontSize: 20)),
          ),
          const SizedBox(height: 10),
          Text(
            'Füge ein Fahrzeug hinzu',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'für personalisierte Empfehlungen',
            style: TextStyle(
                fontSize: 12,
                color: isDark
                    ? B24Colors.darkTextSecondary
                    : B24Colors.textSecondary),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.go('/vehicles/add'),
              style: OutlinedButton.styleFrom(
                foregroundColor: B24Colors.primaryBlue,
                side: const BorderSide(color: B24Colors.primaryBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text(
                'Fahrzeug hinzufügen',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════
// Services Grid (compact 3×2)
// ══════════════════════════════════════

class _ServicesGrid extends ConsumerWidget {
  static const _services = [
    _ServiceItem('🔄', 'Reifen-\nwechsel', 'ab 59,90 €', 'TIRE_CHANGE', true,
        'assets/images/services/reifenwechsel.jpg'),
    _ServiceItem('🔧', 'Räder-\nwechsel', 'ab 29,90 €', 'WHEEL_CHANGE', true,
        'assets/images/services/raederwechsel.png', true),
    _ServiceItem('🔨', 'Reifen-\nreparatur', 'ab 24,90 €', 'TIRE_REPAIR', false,
        'assets/images/services/reifenreparatur.jpg'),
    _ServiceItem('📏', 'Achsver-\nmessung', 'ab 49,90 €', 'ALIGNMENT_BOTH',
        false, 'assets/images/services/achsvermessung.jpg'),
    _ServiceItem('🏍️', 'Motorrad-\nReifen', 'ab 39,90 €', 'MOTORCYCLE_TIRE',
        false, 'assets/images/services/motorradreifen.jpg'),
    _ServiceItem('❄️', 'Klima-\nservice', 'ab 69,90 €', 'CLIMATE_SERVICE',
        false, 'assets/images/services/klimaservice.jpg'),
  ];

  /// Services allowed for trailers (Anhänger)
  static const _trailerAllowedServices = {'TIRE_CHANGE', 'WHEEL_CHANGE'};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedVehicle = ref.watch(selectedVehicleProvider);
    final isTrailer = selectedVehicle?.vehicleType == 'TRAILER';

    return LayoutBuilder(builder: (context, constraints) {
      final screenWidth = constraints.maxWidth;
      final isTablet = screenWidth > 500;
      final itemWidth = (screenWidth - 16) / 3; // 2 gaps × 8px
      return Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _services
            .map((s) => SizedBox(
                  width: itemWidth,
                  child: _ServiceTile(
                    isTablet: isTablet,
                    service: s,
                    isDisabled: isTrailer &&
                        !_trailerAllowedServices.contains(s.serviceType),
                    disabledMessage:
                        'Für Anhänger ist nur der Reifenservice verfügbar.',
                  ),
                ))
            .toList(),
      );
    });
  }
}

class _ServiceItem {
  final String icon;
  final String name;
  final String price;
  final String serviceType;
  final bool popular;
  final String? imagePath;
  final bool zoomOut;
  const _ServiceItem(
      this.icon, this.name, this.price, this.serviceType, this.popular,
      [this.imagePath, this.zoomOut = false]);
}

class _ServiceTile extends StatelessWidget {
  final _ServiceItem service;
  final bool isDisabled;
  final bool isTablet;
  final String? disabledMessage;
  const _ServiceTile(
      {required this.service, this.isDisabled = false, this.isTablet = false, this.disabledMessage});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: isDisabled
          ? () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(disabledMessage ?? 'Service nicht verfügbar'),
                  duration: const Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          : () => context.go('/search?service=${service.serviceType}'),
      child: Opacity(
        opacity: isDisabled ? 0.4 : 1.0,
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? B24Colors.darkSurface : Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [_cardShadowLight(isDark: isDark)],
          ),
          child: Stack(
            children: [
              if (service.popular)
                Positioned(
                  top: 6,
                  right: 6,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: B24Colors.primaryBlue,
                    ),
                  ),
                ),
              Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  if (service.imagePath != null)
                    ClipRRect(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(14),
                        topRight: Radius.circular(14),
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        height: isTablet ? 120 : 80,
                        child: service.zoomOut
                            ? Transform.scale(
                                scale: 1.15,
                                child: Image.asset(
                                  service.imagePath!,
                                  width: double.infinity,
                                  height: isTablet ? 120 : 80,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Image.asset(
                                service.imagePath!,
                                width: double.infinity,
                                height: isTablet ? 120 : 80,
                                fit: BoxFit.cover,
                              ),
                      ),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.only(top: 14),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                              : B24Colors.primaryPale,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        alignment: Alignment.center,
                        child: Text(service.icon,
                            style: const TextStyle(fontSize: 18)),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    service.name,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? B24Colors.darkTextPrimary
                          : B24Colors.textPrimary,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const SizedBox(height: 4),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════
// Season Tip Card
// ══════════════════════════════════════

class _SeasonTipCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final month = DateTime.now().month;
    final isWinterSeason = month >= 10 || month <= 3;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark
            ? (isWinterSeason
                ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                : const Color(0xFFF59E0B).withValues(alpha: 0.12))
            : (isWinterSeason
                ? const Color(0xFFE0F2FE)
                : const Color(0xFFFEF3C7)),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [_cardShadowLight(isDark: isDark)],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isWinterSeason
                  ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                  : const Color(0xFFF59E0B).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(
              isWinterSeason ? Icons.ac_unit : Icons.wb_sunny,
              size: 22,
              color: isWinterSeason
                  ? const Color(0xFF0284C7)
                  : const Color(0xFFF59E0B),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isWinterSeason
                      ? 'Winterreifen-Saison'
                      : 'Sommerreifen-Saison',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark
                        ? B24Colors.darkTextPrimary
                        : B24Colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isWinterSeason
                      ? 'Von O bis O: Oktober bis Ostern. Jetzt Winterreifen aufziehen lassen!'
                      : 'Zeit für den Wechsel! Jetzt Termin sichern bevor es voll wird.',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark
                        ? B24Colors.darkTextSecondary
                        : B24Colors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════
// Staggered Fade + Slide-Up Animation
// ══════════════════════════════════════

class _FadeSlideIn extends StatefulWidget {
  static bool _hasPlayedOnce = false;
  final int delay; // stagger index (0, 1, 2, ...)
  final Widget child;
  const _FadeSlideIn({required this.delay, required this.child});

  @override
  State<_FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<_FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _opacity;
  late final Animation<Offset> _offset;

  @override
  void initState() {
    super.initState();
    final isRevisit = _FadeSlideIn._hasPlayedOnce;

    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: isRevisit ? 200 : 500),
    );
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _offset = Tween<Offset>(
      begin: isRevisit ? Offset.zero : const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));

    if (_FadeSlideIn._hasPlayedOnce) {
      // Subsequent visit: quick uniform fade, no stagger, no slide
      _ctrl.forward();
    } else {
      // First visit: stagger slide + fade
      Future.delayed(Duration(milliseconds: 80 * widget.delay), () {
        if (mounted) _ctrl.forward();
      });
      Future.delayed(const Duration(milliseconds: 1000), () {
        _FadeSlideIn._hasPlayedOnce = true;
      });
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _offset,
        child: widget.child,
      ),
    );
  }
}

// ══════════════════════════════════════
// CO2 Bilanz Card
// ══════════════════════════════════════

class _CO2BilanzCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final co2Async = ref.watch(co2StatsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final data = co2Async.valueOrNull;
    final breakdown = data?['breakdown'] as Map<String, dynamic>? ?? {};
    final trips = (data?['numberOfRequests'] as int?) ?? 0;
    final kmSaved = (breakdown['totalKmSaved'] as num?)?.toDouble() ?? 0;
    final co2Kg = (data?['totalCO2SavedKg'] as num?)?.toDouble() ?? 0;
    final fuelSaved = (breakdown['fuelSavedLiters'] as num?)?.toDouble() ?? 0;
    final fuelUnit = breakdown['fuelUnit'] as String? ?? 'L';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF065F46).withValues(alpha: 0.2)
            : const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [_cardShadowLight(isDark: isDark)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child:
                    const Icon(Icons.eco, size: 20, color: Color(0xFF10B981)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Deine CO\u2082-Einsparung durch Online-Buchungen',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark
                            ? B24Colors.darkTextPrimary
                            : B24Colors.textPrimary,
                      ),
                    ),
                    Text(
                      trips > 0
                          ? '$trips Online-Buchungen statt Werkstattbesuche'
                          : 'Basierend auf deinen Fahrzeugdaten',
                      style: TextStyle(
                        fontSize: 10,
                        color: isDark
                            ? B24Colors.darkTextSecondary
                            : B24Colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _CO2Stat(
                value: '$trips',
                label: 'Fahrten\ngespart',
                isDark: isDark,
              ),
              _CO2Stat(
                value: '${kmSaved.round()} km',
                label: 'Fahrtwege\nvermieden',
                isDark: isDark,
              ),
              _CO2Stat(
                value: '${co2Kg.toStringAsFixed(1)} kg',
                label: 'CO\u2082\neingespart',
                isDark: isDark,
              ),
              _CO2Stat(
                value: '${fuelSaved.toStringAsFixed(1)} $fuelUnit',
                label: 'Kraftstoff\ngespart',
                isDark: isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CO2Stat extends StatelessWidget {
  final String value;
  final String label;
  final bool isDark;

  const _CO2Stat({
    required this.value,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w500,
              color: isDark
                  ? B24Colors.darkTextSecondary
                  : B24Colors.textSecondary,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}
