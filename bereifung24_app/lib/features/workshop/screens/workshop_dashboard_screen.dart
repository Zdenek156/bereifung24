import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import '../providers/workshop_provider.dart';

class WorkshopDashboardScreen extends ConsumerStatefulWidget {
  const WorkshopDashboardScreen({super.key});

  @override
  ConsumerState<WorkshopDashboardScreen> createState() =>
      _WorkshopDashboardScreenState();
}

class _WorkshopDashboardScreenState
    extends ConsumerState<WorkshopDashboardScreen> {
  static const _periods = ['1d', '7d', '30d', '365d', 'all'];
  int _periodIndex = 1; // default: 7d

  @override
  Widget build(BuildContext context) {
    final period = _periods[_periodIndex];
    final statsAsync = ref.watch(workshopStatsPeriodProvider(period));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(workshopStatsPeriodProvider(period));
          },
          child: statsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('😕', style: TextStyle(fontSize: 48)),
                  const SizedBox(height: 12),
                  Text(S.of(context)!.loadingError,
                      style: TextStyle(
                          color: isDark ? Colors.white70 : Colors.black54)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () =>
                        ref.invalidate(workshopStatsPeriodProvider(period)),
                    child: Text(S.of(context)!.retry),
                  ),
                ],
              ),
            ),
            data: (stats) => ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
              children: [
                // Header
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            S.of(context)!.workshopDashboard,
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _greeting(context, stats.workshopName),
                            style: TextStyle(
                              color: isDark ? Colors.white60 : Colors.black45,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.screen_rotation_outlined,
                        color: isDark ? Colors.white38 : Colors.black26,
                        size: 22,
                      ),
                      tooltip: S.of(context)!.rotateScreen,
                      onPressed: () {
                        final isPortrait = MediaQuery.of(context).orientation ==
                            Orientation.portrait;
                        if (isPortrait) {
                          SystemChrome.setPreferredOrientations([
                            DeviceOrientation.landscapeLeft,
                            DeviceOrientation.landscapeRight,
                          ]);
                        } else {
                          SystemChrome.setPreferredOrientations([
                            DeviceOrientation.portraitUp,
                          ]);
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // KPI Cards - equal height using IntrinsicHeight
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: _KpiCard(
                          emoji: '📅',
                          label: S.of(context)!.today,
                          value: '${stats.todaysBookings}',
                          color: const Color(0xFF3B82F6),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _KpiCard(
                          emoji: '📊',
                          label: S.of(context)!.workshopNext7Days,
                          value: '${stats.upcomingBookings}',
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _periodIndex =
                                  (_periodIndex + 1) % _periods.length;
                            });
                          },
                          child: _KpiCard(
                            emoji: '💰',
                            label: _revenueLabel(context, period),
                            value: '${stats.revenue7Days.toStringAsFixed(0)} €',
                            subtitle: S.of(context)!.tapToSwitch,
                            color: const Color(0xFFF59E0B),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _KpiCard(
                          emoji: '⭐',
                          label: S.of(context)!.reviews,
                          value: stats.totalReviews > 0
                              ? stats.averageRating.toStringAsFixed(1)
                              : '-',
                          subtitle: S.of(context)!.reviewsCountLabel(stats.totalReviews),
                          color: const Color(0xFFEF4444),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Today's Bookings
                if (stats.todaysBookingsList.isNotEmpty) ...[
                  Text(
                    S.of(context)!.workshopTodayAppointments,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ...stats.todaysBookingsList.map(
                    (booking) => _TodayBookingTile(booking: booking),
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1E293B)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF334155)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Column(
                      children: [
                        const Text('☀️', style: TextStyle(fontSize: 36)),
                        const SizedBox(height: 8),
                        Text(
                          S.of(context)!.workshopNoAppointmentsToday,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Recent Activity
                if (stats.recentActivities.isNotEmpty) ...[
                  Text(
                    S.of(context)!.workshopRecentActivities,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ...stats.recentActivities.map(
                    (activity) => _ActivityTile(activity: activity),
                  ),
                ],

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _greeting(BuildContext context, String workshopName) {
    final hour = DateTime.now().hour;
    final name = workshopName.isNotEmpty ? ', $workshopName' : '';
    final lang = Localizations.localeOf(context).languageCode;
    if (lang == 'de') {
      if (hour < 12) return 'Guten Morgen$name! ☀️';
      if (hour < 18) return 'Guten Tag$name! 👋';
      return 'Guten Abend$name! 🌙';
    }
    if (hour < 12) return 'Good morning$name! ☀️';
    if (hour < 18) return 'Good day$name! 👋';
    return 'Good evening$name! 🌙';
  }

  String _revenueLabel(BuildContext context, String period) {
    final lang = Localizations.localeOf(context).languageCode;
    final revenue = lang == 'de' ? 'Umsatz' : 'Revenue';
    final periodLabel = switch (period) {
      '1d' => lang == 'de' ? '1 Tag' : '1 day',
      '7d' => lang == 'de' ? '7 Tage' : '7 days',
      '30d' => lang == 'de' ? '30 Tage' : '30 days',
      '365d' => lang == 'de' ? '1 Jahr' : '1 year',
      _ => lang == 'de' ? 'Gesamt' : 'All time',
    };
    return '$revenue $periodLabel';
  }
}

class _KpiCard extends StatelessWidget {
  final String emoji;
  final String label;
  final String value;
  final String? subtitle;
  final Color color;

  const _KpiCard({
    required this.emoji,
    required this.label,
    required this.value,
    this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle!,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TodayBookingTile extends StatelessWidget {
  final dynamic booking;
  const _TodayBookingTile({required this.booking});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              booking.time,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF3B82F6),
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.customerName,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_serviceLabel(context, booking.serviceType)} · ${booking.vehicle}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          _statusDot(booking.status),
        ],
      ),
    );
  }

  String _serviceLabel(BuildContext context, String raw) {
    final key = raw.toUpperCase().trim();
    final isDe = Localizations.localeOf(context).languageCode == 'de';
    const deLabels = {
      'WHEEL_CHANGE': 'Räderwechsel',
      'RÄDERWECHSEL': 'Räderwechsel',
      'TIRE_CHANGE': 'Reifenwechsel',
      'REIFENWECHSEL': 'Reifenwechsel',
      'TIRE_REPAIR': 'Reifenreparatur',
      'REIFENREPARATUR': 'Reifenreparatur',
      'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
      'MOTORRAD-REIFENWECHSEL': 'Motorrad-Reifenwechsel',
      'ALIGNMENT_BOTH': 'Achsvermessung',
      'ACHSVERMESSUNG': 'Achsvermessung',
      'CLIMATE_SERVICE': 'Klimaservice',
      'KLIMASERVICE': 'Klimaservice',
    };
    if (isDe) {
      return deLabels[key] ?? raw;
    }
    if (key == 'WHEEL_CHANGE' || key == 'RÄDERWECHSEL') {
      return _normalizeServiceLabel(S.of(context)!.serviceWheelChange);
    }
    if (key == 'TIRE_CHANGE' || key == 'REIFENWECHSEL') {
      return _normalizeServiceLabel(S.of(context)!.serviceTireChange);
    }
    if (key == 'TIRE_REPAIR' || key == 'REIFENREPARATUR') {
      return S.of(context)!.foreignObjectRepair;
    }
    if (key == 'MOTORCYCLE_TIRE' || key == 'MOTORRAD-REIFENWECHSEL') {
      return _normalizeServiceLabel(S.of(context)!.serviceMotorcycleTire);
    }
    if (key == 'ALIGNMENT_BOTH' || key == 'ACHSVERMESSUNG') {
      return _normalizeServiceLabel(S.of(context)!.serviceAlignment);
    }
    if (key == 'CLIMATE_SERVICE' || key == 'KLIMASERVICE') {
      return _normalizeServiceLabel(S.of(context)!.serviceClimate);
    }
    return raw;
  }

  String _normalizeServiceLabel(String value) {
    return value
        .replaceAll('-\n', '')
        .replaceAll('\n', ' ')
        .replaceAll('  ', ' ')
        .trim();
  }

  Widget _statusDot(String status) {
    final color = status == 'COMPLETED'
        ? const Color(0xFF10B981)
        : status == 'CONFIRMED'
            ? const Color(0xFF3B82F6)
            : const Color(0xFFF59E0B);
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final dynamic activity;
  const _ActivityTile({required this.activity});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final emoji = activity.type == 'booking'
        ? '📋'
        : activity.type == 'payment'
            ? '💳'
            : '⭐';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              activity.message,
              style: const TextStyle(fontSize: 13),
            ),
          ),
          Text(
            activity.time,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}
