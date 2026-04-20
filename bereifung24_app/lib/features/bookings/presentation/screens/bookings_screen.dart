import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../auth/providers/auth_provider.dart';

// ── Provider ──

final bookingsProvider = FutureProvider<List<Booking>>((ref) async {
  // Wait for auth before fetching - ensures token is available
  final authState = ref.watch(authStateProvider);
  if (!authState.isAuthenticated) return [];

  final response = await ApiClient().getBookings();
  final data = response.data;
  final list = (data is List ? data : data['bookings'] ?? []) as List;
  return list.map((e) => Booking.fromJson(e)).toList();
});

// ── Sort options ──

enum BookingSortOption {
  upcoming('Kommender Termin', Icons.event),
  price('Preis', Icons.euro),
  bookedDate('Buchungsdatum', Icons.calendar_month);

  final String label;
  final IconData icon;
  const BookingSortOption(this.label, this.icon);
}

// ── Screen ──

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  BookingSortOption _sortBy = BookingSortOption.upcoming;
  bool _ascending = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  List<Booking> _sortBookings(List<Booking> bookings) {
    final sorted = List<Booking>.from(bookings);
    sorted.sort((a, b) {
      int cmp;
      switch (_sortBy) {
        case BookingSortOption.upcoming:
          cmp = a.appointmentDate.compareTo(b.appointmentDate);
          break;
        case BookingSortOption.price:
          cmp = (a.totalPrice ?? 0).compareTo(b.totalPrice ?? 0);
          break;
        case BookingSortOption.bookedDate:
          cmp = (a.createdAt ?? DateTime(2000))
              .compareTo(b.createdAt ?? DateTime(2000));
          break;
      }
      return _ascending ? cmp : -cmp;
    });
    return sorted;
  }

  Widget _buildSortBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      child: Row(
        children: [
          Icon(Icons.sort, size: 16, color: Colors.grey[500]),
          const SizedBox(width: 6),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: BookingSortOption.values.map((option) {
                  final isSelected = _sortBy == option;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: FilterChip(
                      selected: isSelected,
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(option == BookingSortOption.upcoming ? S.of(context)!.sortUpcoming : option == BookingSortOption.price ? S.of(context)!.sortPrice : S.of(context)!.sortBookedDate,
                              style: const TextStyle(fontSize: 11)),
                          if (isSelected) ...[
                            const SizedBox(width: 3),
                            Icon(
                              _ascending
                                  ? Icons.arrow_upward
                                  : Icons.arrow_downward,
                              size: 12,
                            ),
                          ],
                        ],
                      ),
                      onSelected: (_) {
                        setState(() {
                          if (_sortBy == option) {
                            _ascending = !_ascending;
                          } else {
                            _sortBy = option;
                            _ascending = true;
                          }
                        });
                      },
                      selectedColor:
                          const Color(0xFF0284C7).withValues(alpha: 0.12),
                      checkmarkColor: const Color(0xFF0284C7),
                      labelStyle: TextStyle(
                        color: isSelected
                            ? const Color(0xFF0284C7)
                            : Colors.grey[700],
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20)),
                      visualDensity: VisualDensity.compact,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingList(List<Booking> bookings) {
    if (bookings.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.event_busy, size: 48, color: Colors.grey[300]),
              const SizedBox(height: 12),
              Text(S.of(context)!.noBookings,
                  style: TextStyle(color: Colors.grey[500])),
            ],
          ),
        ),
      );
    }
    final sorted = _sortBookings(bookings);
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      itemCount: sorted.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _BookingCard(booking: sorted[i]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Text(
                S.of(context)!.myBookings,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),

            // ── Tabs: Kommende / Vergangene ──
            TabBar(
              controller: _tabCtrl,
              labelColor: const Color(0xFF0284C7),
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: const Color(0xFF0284C7),
              indicatorWeight: 3,
              labelStyle:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.upcoming, size: 18),
                      const SizedBox(width: 6),
                      Text(S.of(context)!.upcoming),
                      bookingsAsync.whenOrNull(
                            data: (b) {
                              final count = b.where((x) => x.isUpcoming).length;
                              if (count == 0) return null;
                              return Padding(
                                padding: const EdgeInsets.only(left: 6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0284C7),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text('$count',
                                      style: const TextStyle(
                                          color: Colors.white, fontSize: 11)),
                                ),
                              );
                            },
                          ) ??
                          const SizedBox.shrink(),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.history, size: 18),
                      const SizedBox(width: 6),
                      Text(S.of(context)!.past),
                    ],
                  ),
                ),
              ],
            ),

            // ── Sort bar ──
            _buildSortBar(),

            Expanded(
              child: bookingsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(S.of(context)!.bookingsLoadError),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: () => ref.invalidate(bookingsProvider),
                        child: Text(S.of(context)!.retry),
                      ),
                    ],
                  ),
                ),
                data: (bookings) {
                  if (bookings.isEmpty) return _EmptyBookings();
                  final now = DateTime.now();
                  final upcoming = bookings
                      .where((b) =>
                          b.appointmentDate.isAfter(now) ||
                          (b.appointmentDate.year == now.year &&
                              b.appointmentDate.month == now.month &&
                              b.appointmentDate.day == now.day))
                      .toList();
                  final past = bookings
                      .where((b) => b.appointmentDate
                          .isBefore(DateTime(now.year, now.month, now.day)))
                      .toList();

                  return RefreshIndicator(
                    onRefresh: () async => ref.invalidate(bookingsProvider),
                    child: TabBarView(
                      controller: _tabCtrl,
                      children: [
                        _buildBookingList(upcoming),
                        _buildBookingList(past),
                      ],
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

class _EmptyBookings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.calendar_today, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(S.of(context)!.noBookings,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              S.of(context)!.noBookingsDesc,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.go('/search'),
              icon: const Icon(Icons.search),
              label: Text(S.of(context)!.searchWorkshop),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  const _BookingCard({required this.booking});

  static const _serviceIcons = <String, IconData>{
    'TIRE_CHANGE': Icons.tire_repair,
    'WHEEL_CHANGE': Icons.autorenew,
    'TIRE_REPAIR': Icons.build_circle,
    'MOTORCYCLE_TIRE': Icons.two_wheeler,
    'ALIGNMENT_BOTH': Icons.straighten,
    'WHEEL_ALIGNMENT': Icons.straighten,
    'CLIMATE_SERVICE': Icons.ac_unit,
    'BRAKE_SERVICE': Icons.disc_full,
    'BATTERY_SERVICE': Icons.battery_charging_full,
  };

  Color get _statusColor {
    switch (booking.status) {
      case 'CONFIRMED':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'IN_PROGRESS':
        return Colors.blue;
      case 'COMPLETED':
        return Colors.grey;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData get _statusIcon {
    switch (booking.status) {
      case 'CONFIRMED':
        return Icons.check_circle_outline;
      case 'PENDING':
        return Icons.schedule;
      case 'IN_PROGRESS':
        return Icons.engineering;
      case 'COMPLETED':
        return Icons.task_alt;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    const months = [
      '',
      'Jan',
      'Feb',
      'Mär',
      'Apr',
      'Mai',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Okt',
      'Nov',
      'Dez'
    ];
    const weekdays = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    final d = booking.appointmentDate;
    final dateStr =
        '${weekdays[d.weekday]}, ${d.day}. ${months[d.month]} ${d.year}';
    final svcIcon =
        _serviceIcons[booking.serviceType] ?? Icons.miscellaneous_services;
    final hasDiscount =
        booking.discountAmount != null && booking.discountAmount! > 0;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      elevation: 2,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/bookings/${booking.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header: service type + status ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: _statusColor.withValues(alpha: 0.06),
              ),
              child: Row(
                children: [
                  Icon(svcIcon, size: 20, color: const Color(0xFF0284C7)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      booking.serviceTypeDisplay,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_statusIcon, size: 14, color: _statusColor),
                        const SizedBox(width: 4),
                        Text(
                          booking.statusDisplay,
                          style: TextStyle(
                            color: _statusColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Date & Time ──
                  Row(
                    children: [
                      Icon(Icons.event, size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 6),
                      Text(
                        dateStr,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      if (booking.appointmentTime != null) ...[
                        const SizedBox(width: 12),
                        Icon(Icons.access_time,
                            size: 16, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          '${booking.appointmentTime} Uhr',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (booking.durationMinutes != null) ...[
                    const SizedBox(height: 2),
                    Padding(
                      padding: const EdgeInsets.only(left: 22),
                      child: Text(
                        '${booking.durationMinutes} Minuten',
                        style: TextStyle(color: Colors.grey[500], fontSize: 12),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),

                  // ── Workshop ──
                  if (booking.workshopName != null)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.storefront,
                            size: 16, color: Colors.grey[600]),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                booking.workshopName!,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              if (booking.workshopAddress != null)
                                Text(
                                  booking.workshopAddress!,
                                  style: TextStyle(
                                      color: Colors.grey[500], fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  if (booking.workshopName != null) const SizedBox(height: 10),

                  // ── Vehicle ──
                  Row(
                    children: [
                      Icon(Icons.directions_car,
                          size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: booking.vehicleDisplay,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w500, fontSize: 13),
                              ),
                              if (booking.licensePlate != null) ...[
                                const TextSpan(text: '  '),
                                TextSpan(
                                  text: booking.licensePlate!,
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // ── Tire info ──
                  if (booking.tireBrand != null ||
                      booking.tireSize != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1E293B)
                            : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: isDark
                                ? const Color(0xFF334155)
                                : Colors.grey.shade200,
                            width: 0.5),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.tire_repair,
                              size: 16, color: Color(0xFF0284C7)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (booking.tireBrand != null ||
                                    booking.tireModel != null)
                                  Text(
                                    '${booking.tireQuantity != null ? '${booking.tireQuantity}× ' : ''}'
                                            '${booking.tireBrand ?? ''} ${booking.tireModel ?? ''}'
                                        .trim(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                if (booking.tireSize != null)
                                  Text(
                                    booking.tireSize!,
                                    style: TextStyle(
                                        color: Colors.grey[600], fontSize: 12),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // ── Additional services ──
                  if (booking.additionalServices.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: booking.additionalServices.map((s) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF0284C7).withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '+ $s',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF0284C7),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 10),

                  // ── Price & Payment bottom row ──
                  Row(
                    children: [
                      // Price section
                      if (booking.totalPrice != null) ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (hasDiscount)
                              Text(
                                '${booking.originalPrice?.toStringAsFixed(2)} €',
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 12,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            Row(
                              children: [
                                Text(
                                  '${booking.totalPrice!.toStringAsFixed(2)} €',
                                  style: const TextStyle(
                                    color: Color(0xFF0284C7),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                  ),
                                ),
                                if (hasDiscount) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade50,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      '-${booking.discountAmount!.toStringAsFixed(2)}€',
                                      style: TextStyle(
                                        color: Colors.green[700],
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ],
                      const Spacer(),

                      // Payment status
                      if (booking.paymentStatus != null &&
                          booking.paymentStatus!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _paymentColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            booking.paymentStatusDisplay,
                            style: TextStyle(
                              color: _paymentColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                          ),
                        ),
                    ],
                  ),

                  // ── Footer: booking ID + date ──
                  if (booking.createdAt != null ||
                      booking.couponCode != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (booking.createdAt != null)
                          Text(
                            'Gebucht am ${booking.createdAt!.day}.${booking.createdAt!.month}.${booking.createdAt!.year}',
                            style: TextStyle(
                                color: Colors.grey[400], fontSize: 11),
                          ),
                        const Spacer(),
                        if (booking.couponCode != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.local_offer,
                                    size: 10, color: Colors.green[700]),
                                const SizedBox(width: 3),
                                Text(
                                  booking.couponCode!,
                                  style: TextStyle(
                                    color: Colors.green[700],
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ],

                  // ── "Details anzeigen" link ──
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      'Details anzeigen →',
                      style: TextStyle(
                        color: const Color(0xFF0284C7),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color get _paymentColor {
    switch (booking.paymentStatus) {
      case 'PAID':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'FAILED':
        return Colors.red;
      case 'REFUNDED':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}
