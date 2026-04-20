import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../l10n/app_localizations.dart';
import '../models/workshop_booking.dart';
import '../providers/workshop_provider.dart';

class WorkshopBookingsScreen extends ConsumerStatefulWidget {
  const WorkshopBookingsScreen({super.key});

  @override
  ConsumerState<WorkshopBookingsScreen> createState() =>
      _WorkshopBookingsScreenState();
}

class _WorkshopBookingsScreenState
    extends ConsumerState<WorkshopBookingsScreen> {
  String _filter = 'all';

  static const _filters = [
    ('all', 'Alle'),
    ('upcoming', 'Bevorstehend'),
    ('COMPLETED', 'Erledigt'),
    ('CANCELLED', 'Storniert'),
  ];

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(workshopDirectBookingsProvider(_filter));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                S.of(context)!.workshopBookings,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),

            // Filter chips
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: _filters.map((f) {
                  final isActive = _filter == f.$1;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(f.$2),
                      selected: isActive,
                      onSelected: (_) => setState(() => _filter = f.$1),
                      selectedColor:
                          const Color(0xFF0284C7).withValues(alpha: 0.15),
                      checkmarkColor: const Color(0xFF0284C7),
                      labelStyle: TextStyle(
                        fontSize: 13,
                        fontWeight:
                            isActive ? FontWeight.w600 : FontWeight.w400,
                        color: isActive
                            ? const Color(0xFF0284C7)
                            : isDark
                                ? Colors.white70
                                : Colors.black54,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 8),

            // Bookings list
            Expanded(
              child: bookingsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Fehler: $e')),
                data: (bookings) {
                  if (bookings.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('📋', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 8),
                          Text(
                            'Keine Buchungen gefunden',
                            style: TextStyle(
                              color: isDark ? Colors.white54 : Colors.black45,
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(workshopDirectBookingsProvider(_filter));
                    },
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: bookings.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) =>
                          _BookingListTile(booking: bookings[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingListTile extends StatelessWidget {
  final WorkshopBooking booking;
  const _BookingListTile({required this.booking});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = _formatDate(booking.appointmentDate);
    final statusColor = _statusColor(booking.status);

    return GestureDetector(
      onTap: () => _showBookingDetail(context, booking),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    booking.customerName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    booking.statusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text('📅 $dateStr',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white54 : const Color(0xFF64748B),
                    )),
                if (booking.appointmentTime != null) ...[
                  Text(' · ⏰ ${booking.appointmentTime}',
                      style: TextStyle(
                        fontSize: 12,
                        color:
                            isDark ? Colors.white54 : const Color(0xFF64748B),
                      )),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text('🔧 ${booking.serviceLabel}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white54 : const Color(0xFF64748B),
                    )),
                const Spacer(),
                if (booking.totalPrice != null)
                  Text(
                    '${booking.totalPrice!.toStringAsFixed(2)} €',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF10B981),
                    ),
                  ),
              ],
            ),
            if (booking.vehicleMake != null) ...[
              const SizedBox(height: 4),
              Text(
                '🚗 ${booking.vehicleMake} ${booking.vehicleModel ?? ''} ${booking.licensePlate != null ? '· ${booking.licensePlate}' : ''}',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showBookingDetail(BuildContext context, WorkshopBooking b) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = _statusColor(b.status);
    final dateStr = _formatDate(b.appointmentDate);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Header
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Buchungsdetails',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    b.statusLabel,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Customer
            _detailSection(isDark, '👤', 'Kunde', [
              b.customerName,
              if (b.customerEmail != null && b.customerEmail!.isNotEmpty)
                b.customerEmail!,
              if (b.customerPhone != null && b.customerPhone!.isNotEmpty)
                b.customerPhone!,
            ]),
            const SizedBox(height: 14),

            // Appointment
            _detailSection(isDark, '📅', 'Termin', [
              'Datum: $dateStr',
              if (b.appointmentTime != null) 'Uhrzeit: ${b.appointmentTime}',
              'Dauer: ${b.estimatedDuration} Min.',
            ]),
            const SizedBox(height: 14),

            // Service
            _detailSection(isDark, '🔧', 'Service', [
              b.serviceLabel,
              if (b.serviceSubtypeLabel != null) b.serviceSubtypeLabel!,
            ]),
            const SizedBox(height: 14),

            // Vehicle
            if (b.vehicleMake != null) ...[
              _detailSection(isDark, '🚗', 'Fahrzeug', [
                '${b.vehicleMake} ${b.vehicleModel ?? ''}',
                if (b.vehicleYear != null) 'Baujahr: ${b.vehicleYear}',
                if (b.licensePlate != null) 'Kennzeichen: ${b.licensePlate}',
              ]),
              const SizedBox(height: 14),
            ],

            // Tires - mixed/motorcycle (front + rear separate)
            if (b.isMixedTires) ...[
              if (b.frontTire != null) ...[
                _detailSection(isDark, '🛞', 'Reifen vorne', [
                  if (b.frontTire!['brand'] != null)
                    'Marke: ${b.frontTire!['brand']}',
                  if (b.frontTire!['model'] != null)
                    'Modell: ${b.frontTire!['model']}',
                  if (b.frontTire!['size'] != null)
                    'Größe: ${b.frontTire!['size']}',
                  'Anzahl: ${b.frontTire!['quantity'] ?? 2}',
                  if (b.frontTire!['runflat'] == true) 'RunFlat: Ja',
                ]),
                const SizedBox(height: 14),
              ],
              if (b.rearTire != null) ...[
                _detailSection(isDark, '🛞', 'Reifen hinten', [
                  if (b.rearTire!['brand'] != null)
                    'Marke: ${b.rearTire!['brand']}',
                  if (b.rearTire!['model'] != null)
                    'Modell: ${b.rearTire!['model']}',
                  if (b.rearTire!['size'] != null)
                    'Größe: ${b.rearTire!['size']}',
                  'Anzahl: ${b.rearTire!['quantity'] ?? 2}',
                  if (b.rearTire!['runflat'] == true) 'RunFlat: Ja',
                ]),
                const SizedBox(height: 14),
              ],
            ]
            // Tires - standard (single set)
            else if (b.tireBrand != null ||
                b.tireModel != null ||
                b.tireSize != null) ...[
              _detailSection(isDark, '🛞', 'Reifen', [
                if (b.tireBrand != null) 'Marke: ${b.tireBrand}',
                if (b.tireModel != null) 'Modell: ${b.tireModel}',
                if (b.tireSize != null) 'Größe: ${b.tireSize}',
                if (b.tireQuantity != null) 'Anzahl: ${b.tireQuantity}',
                if (b.tireRunFlat) 'RunFlat: Ja',
              ]),
              const SizedBox(height: 14),
            ]
            // No tire data but tire-related service
            else if (b.serviceType == 'TIRE_CHANGE' ||
                b.serviceType == 'MOTORCYCLE_TIRE') ...[
              _detailSection(isDark, '🛞', 'Reifen', [
                'Keine Reifeninformationen hinterlegt',
              ]),
              const SizedBox(height: 14),
            ],

            // Pricing (with additional options merged in)
            _detailSection(isDark, '💰', 'Preis', [
              if (b.basePrice != null)
                'Grundpreis: ${b.basePrice!.toStringAsFixed(2)} €',
              if (b.hasBalancing)
                'Auswuchten: ${b.balancingPrice != null ? '${b.balancingPrice!.toStringAsFixed(2)} €' : 'inkl.'}',
              if (b.hasStorage)
                'Einlagerung: ${b.storagePrice != null ? '${b.storagePrice!.toStringAsFixed(2)} €' : 'inkl.'}',
              if (b.hasWashing)
                'Felgenwäsche: ${b.washingPrice != null ? '${b.washingPrice!.toStringAsFixed(2)} €' : 'inkl.'}',
              if (b.hasDisposal)
                'Altreifenentsorgung: ${b.disposalFee != null ? '${b.disposalFee!.toStringAsFixed(2)} €' : 'inkl.'}',
              if (b.tireRunFlat && b.runFlatSurcharge != null)
                'RunFlat-Zuschlag: ${b.runFlatSurcharge!.toStringAsFixed(2)} €',
              if (b.totalPrice != null)
                'Gesamtpreis: ${b.totalPrice!.toStringAsFixed(2)} €',
            ]),
            const SizedBox(height: 14),

            // Meta
            _detailSection(isDark, 'ℹ️', 'Info', [
              'Erstellt: ${DateFormat('dd.MM.yyyy HH:mm').format(b.createdAt)}',
              if (b.isDirectBooking) 'Direktbuchung über Bereifung24',
            ]),
          ],
        ),
      ),
    );
  }

  Widget _detailSection(
      bool isDark, String emoji, String title, List<String> lines) {
    final visibleLines = lines.where((l) => l.isNotEmpty).toList();
    if (visibleLines.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ...visibleLines.map((line) => Padding(
              padding: const EdgeInsets.only(left: 28, bottom: 3),
              child: Text(
                line,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                ),
              ),
            )),
      ],
    );
  }

  String _formatDate(String isoDate) {
    final d = DateTime.tryParse(isoDate);
    if (d == null) return isoDate;
    return DateFormat('dd.MM.yyyy').format(d);
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'CONFIRMED':
        return const Color(0xFF3B82F6);
      case 'COMPLETED':
        return const Color(0xFF10B981);
      case 'CANCELLED':
        return const Color(0xFFEF4444);
      case 'RESERVED':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF64748B);
    }
  }
}
