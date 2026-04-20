import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../auth/providers/auth_provider.dart';
import 'add_vehicle_screen.dart';

// ── Provider ──

final vehiclesProvider = FutureProvider<List<Vehicle>>((ref) async {
  // Wait for auth before fetching - ensures token is available
  final authState = ref.watch(authStateProvider);
  if (!authState.isAuthenticated) return [];

  final response = await ApiClient().getVehicles();
  final data = response.data;
  final list = (data is List ? data : data['vehicles'] ?? []) as List;
  return list.map((e) => Vehicle.fromJson(e)).toList();
});

// ── Screen ──

class VehiclesScreen extends ConsumerWidget {
  const VehiclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(vehiclesProvider);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    S.of(context)!.myVehicles,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  FilledButton.icon(
                    onPressed: () => context.push('/vehicles/add'),
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(S.of(context)!.addVehicleButton),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: vehiclesAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(S.of(context)!.vehiclesLoadError),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: () => ref.invalidate(vehiclesProvider),
                        child: Text(S.of(context)!.retry),
                      ),
                    ],
                  ),
                ),
                data: (vehicles) => vehicles.isEmpty
                    ? _EmptyVehicles()
                    : RefreshIndicator(
                        onRefresh: () async => ref.invalidate(vehiclesProvider),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: vehicles.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) =>
                              _VehicleCard(vehicle: vehicles[index]),
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyVehicles extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.directions_car, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(S.of(context)!.noVehicles,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              S.of(context)!.noVehiclesDesc,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.push('/vehicles/add'),
              icon: const Icon(Icons.add),
              label: Text(S.of(context)!.addVehicle),
            ),
          ],
        ),
      ),
    );
  }
}

class _VehicleCard extends ConsumerWidget {
  final Vehicle vehicle;
  const _VehicleCard({required this.vehicle});

  IconData get _vehicleIcon {
    switch (vehicle.vehicleType) {
      case 'MOTORCYCLE':
        return Icons.two_wheeler;
      case 'TRAILER':
        return Icons.rv_hookup;
      default:
        return Icons.directions_car;
    }
  }

  Future<void> _deleteVehicle(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(S.of(context)!.deleteVehicle),
        content: Text(S.of(context)!.deleteVehicleConfirm(vehicle.brand ?? '', vehicle.model ?? '')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(S.of(context)!.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: Text(S.of(context)!.delete),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      try {
        await ApiClient().deleteVehicle(vehicle.id!);
        ref.invalidate(vehiclesProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(S.of(context)!.vehicleDeleted)),
          );
        }
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(S.of(context)!.deleteFailed)),
          );
        }
      }
    }
  }

  /// TÜV days remaining (null if no date set)
  int? get _tuevDaysLeft {
    if (vehicle.nextInspectionDate == null) return null;
    final parts = vehicle.nextInspectionDate!.split('-');
    if (parts.length < 2) return null;
    final year = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    if (year == null || month == null) return null;
    final tuevDate = DateTime(year, month, 1); // first day of TÜV month
    return tuevDate.difference(DateTime.now()).inDays;
  }

  String? get _tuevDisplay {
    if (vehicle.nextInspectionDate == null) return null;
    final parts = vehicle.nextInspectionDate!.split('-');
    if (parts.length < 2) return null;
    const months = [
      '',
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember'
    ];
    final m = int.tryParse(parts[1]);
    return m != null && m >= 1 && m <= 12 ? '${months[m]} ${parts[0]}' : null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tuevDays = _tuevDaysLeft;
    final tuevStr = _tuevDisplay;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      elevation: 3,
      shadowColor: isDark ? Colors.black54 : Colors.black26,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          await context.push('/vehicles/edit', extra: vehicle);
          ref.invalidate(vehiclesProvider);
        },
        child: Container(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header: icon + name + badges + actions ──
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                            : const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(_vehicleIcon,
                          color: B24Colors.primaryBlue, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${vehicle.brand} ${vehicle.model}',
                            style: TextStyle(
                              color:
                                  isDark ? Colors.white : B24Colors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            [
                              if (vehicle.licensePlate != null &&
                                  vehicle.licensePlate!.isNotEmpty)
                                vehicle.licensePlate!,
                              if (vehicle.year != null) S.of(context)!.buildYear('${vehicle.year}'),
                            ].join(' · '),
                            style: TextStyle(
                              color: isDark
                                  ? Colors.white70
                                  : B24Colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _iconBtn(Icons.edit_outlined, () {
                      context.push('/vehicles/edit', extra: vehicle).then(
                            (_) => ref.invalidate(vehiclesProvider),
                          );
                    }, isDark),
                    const SizedBox(width: 6),
                    _iconBtn(Icons.delete_outline,
                        () => _deleteVehicle(context, ref), isDark),
                  ],
                ),

                // ── Tire sections (compact) ──
                if (vehicle.summerTires != null &&
                    !vehicle.summerTires!.isEmpty)
                  _tireSection('☀️', S.of(context)!.tireSummer, vehicle.summerTires!, isDark),
                if (vehicle.winterTires != null &&
                    !vehicle.winterTires!.isEmpty)
                  _tireSection('❄️', S.of(context)!.tireWinter, vehicle.winterTires!, isDark),
                if (vehicle.allSeasonTires != null &&
                    !vehicle.allSeasonTires!.isEmpty)
                  _tireSection(
                      '🌦️', S.of(context)!.tireAllSeason, vehicle.allSeasonTires!, isDark),

                // ── VIN ──
                if (vehicle.vin != null && vehicle.vin!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    'VIN: ${vehicle.vin}',
                    style: TextStyle(
                      color: isDark ? Colors.white54 : B24Colors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],

                // ── TÜV countdown ──
                if (tuevStr != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.06)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text(
                          '🔧',
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'TÜV: $tuevStr',
                            style: TextStyle(
                              color: isDark
                                  ? Colors.white70
                                  : B24Colors.textPrimary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (tuevDays != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: _tuevColor(tuevDays),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${tuevDays.abs()} ${S.of(context)!.daysCount('')}'.trim(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap, bool isDark) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon,
            color: isDark ? Colors.white70 : B24Colors.textSecondary, size: 18),
      ),
    );
  }

  Widget _tireSection(String emoji, String label, TireSpec spec, bool isDark) {
    final front = _formatSpec(spec);
    final hasRear = spec.hasDifferentSizes && spec.rearWidth != null;
    final rear = hasRear
        ? '${spec.rearWidth}/${spec.rearAspectRatio} R${spec.rearDiameter}'
            '${spec.rearLoadIndex != null ? ' ${spec.rearLoadIndex}' : ''}'
            '${spec.rearSpeedRating ?? ''}'
        : null;

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 13)),
              const SizedBox(width: 6),
              Text(
                '$label:',
                style: TextStyle(
                  color: isDark ? Colors.white54 : B24Colors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hasRear ? 'V: $front' : front,
                  style: TextStyle(
                    color: isDark ? Colors.white : B24Colors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (hasRear && rear != null) ...[
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.only(left: 19),
              child: Row(
                children: [
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'H: $rear',
                      style: TextStyle(
                        color: isDark ? Colors.white : B24Colors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatSpec(TireSpec spec) {
    final buf = StringBuffer();
    if (spec.width != null) buf.write('${spec.width}');
    if (spec.aspectRatio != null) buf.write('/${spec.aspectRatio}');
    if (spec.diameter != null) buf.write('  R${spec.diameter}');
    if (spec.loadIndex != null) buf.write(' ${spec.loadIndex}');
    if (spec.speedRating != null) buf.write(spec.speedRating);
    return buf.toString();
  }

  Color _tuevColor(int days) {
    if (days <= 30) return Colors.red.shade600;
    if (days <= 90) return Colors.orange.shade700;
    return Colors.green.shade600;
  }
}
