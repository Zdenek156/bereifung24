import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import '../models/workshop_booking.dart';
import '../providers/workshop_provider.dart';

class WorkshopCalendarScreen extends ConsumerStatefulWidget {
  const WorkshopCalendarScreen({super.key});

  @override
  ConsumerState<WorkshopCalendarScreen> createState() =>
      _WorkshopCalendarScreenState();
}

class _WorkshopCalendarScreenState
    extends ConsumerState<WorkshopCalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.month;

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(workshopBookingsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: bookingsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('😕', style: TextStyle(fontSize: 48)),
                const SizedBox(height: 12),
                Text('Fehler: $e',
                    style: TextStyle(
                        color: isDark ? Colors.white60 : Colors.black45)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.invalidate(workshopBookingsProvider),
                  child: const Text('Erneut versuchen'),
                ),
              ],
            ),
          ),
          data: (bookings) {
            final eventMap = _buildEventMap(bookings);
            final dayBookings = _getBookingsForDay(_selectedDay, bookings);

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: Text(
                    'Kalender',
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),

                // Monthly Calendar
                TableCalendar<WorkshopBooking>(
                  firstDay: DateTime.utc(2024, 1, 1),
                  lastDay: DateTime.utc(2030, 12, 31),
                  focusedDay: _focusedDay,
                  selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                  calendarFormat: _calendarFormat,
                  startingDayOfWeek: StartingDayOfWeek.monday,
                  locale: 'de_DE',
                  eventLoader: (day) {
                    final key = _dayKey(day);
                    return eventMap[key] ?? [];
                  },
                  onDaySelected: (selectedDay, focusedDay) {
                    setState(() {
                      _selectedDay = selectedDay;
                      _focusedDay = focusedDay;
                    });
                  },
                  onFormatChanged: (format) {
                    setState(() => _calendarFormat = format);
                  },
                  onPageChanged: (focusedDay) {
                    _focusedDay = focusedDay;
                  },
                  availableCalendarFormats: const {
                    CalendarFormat.month: 'Monat',
                    CalendarFormat.twoWeeks: '2 Wochen',
                    CalendarFormat.week: 'Woche',
                  },
                  headerStyle: HeaderStyle(
                    formatButtonVisible: true,
                    titleCentered: true,
                    formatButtonDecoration: BoxDecoration(
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF334155)
                            : const Color(0xFFE2E8F0),
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    formatButtonTextStyle: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white70 : Colors.black54,
                    ),
                    titleTextStyle: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                    leftChevronIcon: Icon(Icons.chevron_left,
                        color: isDark ? Colors.white70 : Colors.black54),
                    rightChevronIcon: Icon(Icons.chevron_right,
                        color: isDark ? Colors.white70 : Colors.black54),
                  ),
                  daysOfWeekStyle: DaysOfWeekStyle(
                    weekdayStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white54 : const Color(0xFF64748B),
                    ),
                    weekendStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                    ),
                  ),
                  calendarStyle: CalendarStyle(
                    outsideDaysVisible: true,
                    outsideTextStyle: TextStyle(
                      color: isDark ? Colors.white12 : Colors.black12,
                    ),
                    defaultTextStyle: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                    weekendTextStyle: TextStyle(
                      color: isDark ? Colors.white54 : Colors.black45,
                    ),
                    todayDecoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    todayTextStyle: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF0284C7),
                    ),
                    selectedDecoration: const BoxDecoration(
                      color: Color(0xFF0284C7),
                      shape: BoxShape.circle,
                    ),
                    selectedTextStyle: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    markerDecoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                    markersMaxCount: 3,
                    markerSize: 6,
                    markerMargin: const EdgeInsets.symmetric(horizontal: 1),
                    cellMargin: const EdgeInsets.all(4),
                  ),
                  calendarBuilders: CalendarBuilders(
                    defaultBuilder: (context, day, focusedDay) {
                      return _gridCell(
                        isDark: isDark,
                        child: Center(
                          child: Text(
                            '${day.day}',
                            style: TextStyle(
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                        ),
                      );
                    },
                    todayBuilder: (context, day, focusedDay) {
                      return _gridCell(
                        isDark: isDark,
                        child: Center(
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${day.day}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF0284C7),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                    selectedBuilder: (context, day, focusedDay) {
                      return _gridCell(
                        isDark: isDark,
                        child: Center(
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              color: Color(0xFF0284C7),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${day.day}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                    outsideBuilder: (context, day, focusedDay) {
                      return _gridCell(
                        isDark: isDark,
                        child: Center(
                          child: Text(
                            '${day.day}',
                            style: TextStyle(
                              color: isDark ? Colors.white12 : Colors.black12,
                            ),
                          ),
                        ),
                      );
                    },
                    markerBuilder: (context, date, events) {
                      if (events.isEmpty) return null;
                      return Positioned(
                        bottom: 4,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: List.generate(
                            events.length > 3 ? 3 : events.length,
                            (i) => Container(
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: i == 0
                                    ? const Color(0xFF0284C7)
                                    : i == 1
                                        ? const Color(0xFF10B981)
                                        : const Color(0xFFF59E0B),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        DateFormat('EEEE, d. MMMM', 'de_DE')
                            .format(_selectedDay),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color:
                              isDark ? Colors.white70 : const Color(0xFF334155),
                        ),
                      ),
                      const Spacer(),
                      if (dayBookings.isNotEmpty)
                        Text(
                          '${dayBookings.length} Termin${dayBookings.length > 1 ? 'e' : ''}',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? Colors.white38
                                : const Color(0xFF94A3B8),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // Bookings for selected date
                Expanded(
                  child: dayBookings.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('📭', style: TextStyle(fontSize: 36)),
                              const SizedBox(height: 8),
                              Text(
                                'Keine Termine an diesem Tag',
                                style: TextStyle(
                                  color:
                                      isDark ? Colors.white54 : Colors.black45,
                                ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () async {
                            ref.invalidate(workshopBookingsProvider);
                          },
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 4),
                            itemCount: dayBookings.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 8),
                            itemBuilder: (context, index) => _BookingCard(
                              booking: dayBookings[index],
                              onTap: () => _showBookingDetail(
                                  context, dayBookings[index]),
                            ),
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

  Map<String, List<WorkshopBooking>> _buildEventMap(
      List<WorkshopBooking> bookings) {
    final map = <String, List<WorkshopBooking>>{};
    for (final b in bookings) {
      final d = DateTime.tryParse(b.appointmentDate);
      if (d == null) continue;
      final key = _dayKey(d);
      map.putIfAbsent(key, () => []).add(b);
    }
    return map;
  }

  List<WorkshopBooking> _getBookingsForDay(
      DateTime day, List<WorkshopBooking> bookings) {
    return bookings.where((b) {
      final d = DateTime.tryParse(b.appointmentDate);
      if (d == null) return false;
      return isSameDay(d, day);
    }).toList()
      ..sort((a, b) =>
          (a.appointmentTime ?? '').compareTo(b.appointmentTime ?? ''));
  }

  String _dayKey(DateTime d) => '${d.year}-${d.month}-${d.day}';

  Widget _gridCell({required bool isDark, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          width: 0.5,
        ),
      ),
      child: child,
    );
  }

  void _showBookingDetail(BuildContext context, WorkshopBooking b) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = _statusColor(b.status);
    final dateStr = DateFormat('dd.MM.yyyy')
        .format(DateTime.tryParse(b.appointmentDate) ?? DateTime.now());

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

class _BookingCard extends StatelessWidget {
  final WorkshopBooking booking;
  final VoidCallback onTap;
  const _BookingCard({required this.booking, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = _cardStatusColor(booking.status);

    return GestureDetector(
      onTap: onTap,
      child: Container(
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
            // Time column
            Column(
              children: [
                Text(
                  booking.appointmentTime ?? '-',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                Text(
                  '${booking.estimatedDuration} min',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 14),
            Container(width: 3, height: 40, color: statusColor),
            const SizedBox(width: 14),
            // Details
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
                    booking.serviceLabel,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white54 : const Color(0xFF64748B),
                    ),
                  ),
                  if (booking.vehicleMake != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      '${booking.vehicleMake} ${booking.vehicleModel ?? ''}',
                      style: TextStyle(
                        fontSize: 11,
                        color:
                            isDark ? Colors.white38 : const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Price + status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
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
                if (booking.totalPrice != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${booking.totalPrice!.toStringAsFixed(0)} €',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _cardStatusColor(String status) {
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
