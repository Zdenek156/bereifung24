import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import 'bookings_screen.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(S.of(context)!.bookingDetails)),
      body: bookingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) =>
            Center(child: Text(S.of(context)!.detailsCouldNotLoad)),
        data: (bookings) {
          final booking = bookings.where((b) => b.id == bookingId).firstOrNull;
          if (booking == null) {
            return Center(child: Text(S.of(context)!.bookingNotFound));
          }
          return _BookingDetailContent(booking: booking);
        },
      ),
    );
  }
}

class _BookingDetailContent extends StatelessWidget {
  final Booking booking;
  const _BookingDetailContent({required this.booking});

  String _serviceLabel(BuildContext context) {
    final s = S.of(context)!;
    final serviceMap = {
      'TIRE_CHANGE': s.tireChange,
      'WHEEL_CHANGE': s.wheelChange,
      'TIRE_REPAIR': s.tireRepair,
      'MOTORCYCLE_TIRE': s.motorcycleTireChange,
      'ALIGNMENT_BOTH': s.axleAlignment,
      'WHEEL_ALIGNMENT': s.axleAlignment,
      'CLIMATE_SERVICE': s.climateService,
      'BRAKE_SERVICE': s.brakeService,
      'BATTERY_SERVICE': s.batteryService,
    };
    final base = serviceMap[booking.serviceType] ?? booking.serviceType;

    final subtypeMap = {
      'foreign_object': s.pkgForeignObject,
      'valve_damage': s.pkgValveDamage,
      'measurement_both': s.pkgMeasureBoth,
      'measurement_front': s.pkgMeasureFront,
      'measurement_rear': s.pkgMeasureRear,
      'adjustment_both': s.pkgAdjustBoth,
      'adjustment_front': s.pkgAdjustFront,
      'adjustment_rear': s.pkgAdjustRear,
      'full_service': s.pkgFullService,
      'check': s.pkgClimateCheck,
      'basic': s.pkgBasicService,
      'comfort': s.pkgComfortService,
      'premium': s.pkgPremiumService,
    };

    final subtype = booking.serviceSubtype;
    if (subtype != null && subtypeMap.containsKey(subtype)) {
      return '$base - ${subtypeMap[subtype]!}';
    }
    return base;
  }

  String _statusLabel(BuildContext context) {
    final s = S.of(context)!;
    switch (booking.status) {
      case 'CONFIRMED':
        return s.confirmed;
      case 'PENDING':
        return s.waitingConfirmation;
      case 'IN_PROGRESS':
        return s.beingProcessed;
      case 'COMPLETED':
        return s.completedStatus;
      case 'CANCELLED':
        return s.appointmentCancelled;
      default:
        return booking.status;
    }
  }

  String _paymentStatusLabel(BuildContext context) {
    switch ((booking.paymentStatus ?? '').toUpperCase()) {
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Pending';
      case 'FAILED':
        return 'Failed';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return booking.paymentStatus ?? '';
    }
  }

  String _paymentMethodLabel() {
    final detail = (booking.paymentMethodDetail ?? '').toLowerCase();
    switch (detail) {
      case 'card':
        return 'Kreditkarte';
      case 'google_pay':
        return 'Google Pay';
      case 'apple_pay':
        return 'Apple Pay';
      case 'klarna':
        return 'Klarna';
      case 'eps':
        return 'EPS';
      case 'ideal':
        return 'iDEAL';
      case 'amazon_pay':
        return 'Amazon Pay';
      case 'link':
        return 'Link';
    }
    switch ((booking.paymentMethod ?? '').toUpperCase()) {
      case 'STRIPE':
        return 'Kreditkarte';
      case 'PAYPAL':
        return 'PayPal';
      case 'CASH':
        return 'Bar vor Ort';
      default:
        return booking.paymentMethod ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _statusColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(_statusIcon, color: _statusColor, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _statusLabel(context),
                        style: TextStyle(
                          color: _statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        _statusDescription(context),
                        style: TextStyle(color: _statusColor, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Booking ID & Service type
          _DetailCard(
            icon: Icons.confirmation_number,
            title: S.of(context)!.bookingLabel,
            children: [
              Text(
                _serviceLabel(context),
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                S.of(context)!.bookingNumber(booking.id.length > 10
                    ? booking.id.substring(0, 10)
                    : booking.id),
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Date & Time
          _DetailCard(
            icon: Icons.calendar_today,
            title: S.of(context)!.appointment,
            children: [
              Text(
                _formatDate(context, booking.appointmentDate),
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
              if (booking.appointmentTime != null) ...[
                const SizedBox(height: 4),
                Text(S.of(context)!.timeLabel(booking.appointmentTime!)),
              ],
              if (booking.durationMinutes != null) ...[
                const SizedBox(height: 2),
                Text(S.of(context)!.durationLabel(booking.durationMinutes!),
                    style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              ],
            ],
          ),

          const SizedBox(height: 12),

          // Workshop with contact info
          _DetailCard(
            icon: Icons.build,
            title: S.of(context)!.workshop,
            children: [
              if (booking.workshopName != null)
                Text(booking.workshopName!,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              if (booking.workshopAddress != null) ...[
                const SizedBox(height: 4),
                Text(booking.workshopAddress!,
                    style: TextStyle(color: Colors.grey[600])),
              ],
              if (booking.workshopPhone != null &&
                  booking.workshopPhone!.isNotEmpty) ...[
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => _launchUrl('tel:${booking.workshopPhone}'),
                  child: Row(
                    children: [
                      const Icon(Icons.phone,
                          size: 16, color: B24Colors.primaryBlue),
                      const SizedBox(width: 6),
                      Text(
                        booking.workshopPhone!,
                        style: const TextStyle(color: B24Colors.primaryBlue),
                      ),
                    ],
                  ),
                ),
              ],
              if (booking.workshopEmail != null &&
                  booking.workshopEmail!.isNotEmpty) ...[
                const SizedBox(height: 6),
                InkWell(
                  onTap: () => _launchUrl('mailto:${booking.workshopEmail}'),
                  child: Row(
                    children: [
                      const Icon(Icons.email,
                          size: 16, color: B24Colors.primaryBlue),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          booking.workshopEmail!,
                          style: const TextStyle(color: B24Colors.primaryBlue),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),

          const SizedBox(height: 12),

          // Vehicle (only when actually set or deleted)
          if (booking.vehicleBrand != null ||
              booking.vehicleModel != null ||
              (booking.licensePlate != null &&
                  booking.licensePlate!.isNotEmpty) ||
              booking.vehicleDeleted) ...[
            _DetailCard(
              icon: Icons.directions_car,
              title: S.of(context)!.vehicle,
              children: [
                if (booking.vehicleBrand != null ||
                    booking.vehicleModel != null)
                  Text(booking.vehicleDisplay,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                if (booking.licensePlate != null &&
                    booking.licensePlate!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(S.of(context)!.licensePlateLabel(booking.licensePlate!),
                      style: TextStyle(color: Colors.grey[600])),
                ],
                if (booking.vehicleDeleted) ...[
                  const SizedBox(height: 4),
                  Text(
                    (booking.vehicleBrand != null ||
                            booking.vehicleModel != null ||
                            (booking.licensePlate != null &&
                                booking.licensePlate!.isNotEmpty))
                        ? 'Fahrzeug wurde aus Ihrer Fahrzeugverwaltung gelöscht'
                        : 'Fahrzeug nicht mehr vorhanden (gelöscht)',
                    style: TextStyle(
                      color: Colors.orange[700],
                      fontStyle: FontStyle.italic,
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ],

          // Tire details (only for tire change services)
          if (booking.isTireChangeService && _hasTireInfo) ...[
            const SizedBox(height: 12),
            _DetailCard(
              icon: Icons.tire_repair,
              title: S.of(context)!.tireDetails,
              children: booking.isMixedTires
                  ? _buildMixedTireRows(context)
                  : [
                      if (booking.tireBrand != null || booking.tireModel != null)
                        Text(
                          [booking.tireBrand, booking.tireModel]
                              .where((e) => e != null)
                              .join(' '),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      if (booking.tireSize != null) ...[
                        const SizedBox(height: 4),
                        Text(S.of(context)!.tireSizeLabel(booking.tireSize!)),
                      ],
                      if (booking.tireQuantity != null) ...[
                        const SizedBox(height: 2),
                        Text(S
                            .of(context)!
                            .tireQuantityLabel(booking.tireQuantity!)),
                      ],
                    ],
            ),
          ],

          // Additional services
          if (booking.additionalServices.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DetailCard(
              icon: Icons.add_circle_outline,
              title: S.of(context)!.additionalServices,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: booking.additionalServices
                      .map((s) => Chip(
                            label:
                                Text(s, style: const TextStyle(fontSize: 13)),
                            visualDensity: VisualDensity.compact,
                            backgroundColor:
                                B24Colors.primaryBlue.withValues(alpha: 0.1),
                            side: BorderSide.none,
                          ))
                      .toList(),
                ),
              ],
            ),
          ],

          // Pricing breakdown
          if (booking.totalPrice != null) ...[
            const SizedBox(height: 12),
            _DetailCard(
              icon: Icons.euro,
              title: S.of(context)!.paymentDetails,
              children: [
                if (booking.paymentMethod != null) ...[
                  _PriceRow(S.of(context)!.paymentType, _paymentMethodLabel()),
                  const Divider(height: 16),
                ],
                if (booking.basePrice != null)
                  _PriceRow(_serviceLabel(context),
                      '${booking.basePrice!.toStringAsFixed(2)} €'),
                ..._buildTirePriceRows(context),
                if (booking.balancingPrice != null &&
                    booking.balancingPrice! > 0)
                  _PriceRow(S.of(context)!.balancingX4,
                      '${booking.balancingPrice!.toStringAsFixed(2)} €'),
                if (booking.storagePrice != null && booking.storagePrice! > 0)
                  _PriceRow(S.of(context)!.storage,
                      '${booking.storagePrice!.toStringAsFixed(2)} €'),
                if (booking.washingPrice != null && booking.washingPrice! > 0)
                  _PriceRow(S.of(context)!.wheelWashing,
                      '${booking.washingPrice!.toStringAsFixed(2)} €'),
                if (booking.disposalFee != null && booking.disposalFee! > 0)
                  _PriceRow(S.of(context)!.disposal,
                      '${booking.disposalFee!.toStringAsFixed(2)} €'),
                if (booking.discountAmount != null &&
                    booking.discountAmount! > 0) ...[
                  _PriceRow(
                    booking.couponCode != null
                        ? S.of(context)!.couponLabel(booking.couponCode!)
                        : S.of(context)!.discountLabel,
                    '-${booking.discountAmount!.toStringAsFixed(2)} €',
                    valueColor: Colors.green,
                  ),
                ],
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(S.of(context)!.totalPrice,
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(
                      '${booking.totalPrice!.toStringAsFixed(2)} €',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: B24Colors.primaryBlue,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],

          // Notes
          if (booking.notes != null && booking.notes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DetailCard(
              icon: Icons.note,
              title: S.of(context)!.remarks,
              children: [Text(booking.notes!)],
            ),
          ],

          // Customer Notes
          if (booking.customerNotes != null &&
              booking.customerNotes!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DetailCard(
              icon: Icons.message_outlined,
              title: S.of(context)!.yourMessageToWorkshop,
              children: [Text(booking.customerNotes!)],
            ),
          ],

          // Review button for completed bookings
          if (booking.status == 'COMPLETED') ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                onPressed: () => context.push(
                  '/review/${booking.id}?workshop=${Uri.encodeComponent(booking.workshopName ?? '')}',
                ),
                icon: const Icon(Icons.star_rounded),
                label: Text(
                  S.of(context)!.rateWorkshopButton,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.amber[700],
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  bool get _hasTireInfo =>
      booking.tireBrand != null ||
      booking.tireModel != null ||
      booking.tireSize != null ||
      booking.isMixedTires;

  List<Widget> _buildMixedTireRows(BuildContext context) {
    final s = S.of(context)!;
    final isMoto = booking.isMotorcycleService;
    final frontLabel = isMoto ? s.frontAxleMoto : s.frontAxle;
    final rearLabel = isMoto ? s.rearAxleMoto : s.rearAxle;
    final rows = <Widget>[];
    void addAxle(String label, Map<String, dynamic>? t) {
      if (t == null) return;
      if (rows.isNotEmpty) rows.add(const SizedBox(height: 10));
      final brandModel = [t['brand'], t['model']]
          .where((e) => e != null && e.toString().isNotEmpty)
          .join(' ');
      final size = t['size']?.toString();
      final qty = t['quantity'] is int
          ? t['quantity'] as int
          : int.tryParse(t['quantity']?.toString() ?? '');
      rows.add(Text('$label: $brandModel',
          style: const TextStyle(fontWeight: FontWeight.w600)));
      if (size != null && size.isNotEmpty) {
        rows.add(const SizedBox(height: 2));
        rows.add(Text(s.tireSizeLabel(size)));
      }
      if (qty != null) {
        rows.add(const SizedBox(height: 2));
        rows.add(Text(s.tireQuantityLabel(qty)));
      }
    }

    addAxle(frontLabel, booking.frontTire);
    addAxle(rearLabel, booking.rearTire);
    return rows;
  }

  List<Widget> _buildTirePriceRows(BuildContext context) {
    final s = S.of(context)!;
    final isMoto = booking.isMotorcycleService;
    final frontLabel = isMoto ? s.frontAxleMoto : s.frontAxle;
    final rearLabel = isMoto ? s.rearAxleMoto : s.rearAxle;
    final rows = <Widget>[];
    double? readPrice(Map<String, dynamic>? t) {
      if (t == null) return null;
      final v = t['totalPrice'] ?? t['purchasePrice'];
      if (v is num) return v.toDouble();
      if (v is String) return double.tryParse(v);
      return null;
    }

    if (booking.isMixedTires) {
      final fp = readPrice(booking.frontTire);
      final rp = readPrice(booking.rearTire);
      if (fp != null && fp > 0) {
        rows.add(const SizedBox(height: 6));
        rows.add(_PriceRow(
            '$frontLabel: ${booking.frontTire?['brand'] ?? ''}'.trim(),
            '${fp.toStringAsFixed(2)} €'));
      }
      if (rp != null && rp > 0) {
        rows.add(const SizedBox(height: 6));
        rows.add(_PriceRow(
            '$rearLabel: ${booking.rearTire?['brand'] ?? ''}'.trim(),
            '${rp.toStringAsFixed(2)} €'));
      }
    }
    return rows;
  }

  String _formatDate(BuildContext context, DateTime date) {
    final locale = Localizations.localeOf(context).toString();
    return DateFormat.yMMMMEEEEd(locale).format(date);
  }

  void _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

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
        return Icons.check_circle;
      case 'PENDING':
        return Icons.hourglass_empty;
      case 'IN_PROGRESS':
        return Icons.build;
      case 'COMPLETED':
        return Icons.done_all;
      case 'CANCELLED':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  String _statusDescription(BuildContext context) {
    switch (booking.status) {
      case 'CONFIRMED':
        return S.of(context)!.appointmentConfirmed;
      case 'PENDING':
        return S.of(context)!.waitingConfirmation;
      case 'IN_PROGRESS':
        return S.of(context)!.beingProcessed;
      case 'COMPLETED':
        return S.of(context)!.completedStatus;
      case 'CANCELLED':
        return S.of(context)!.appointmentCancelled;
      default:
        return '';
    }
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _PriceRow(this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
          Text(value,
              style: TextStyle(
                  fontSize: 14,
                  color: valueColor,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final List<Widget> children;

  const _DetailCard({
    required this.icon,
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: B24Colors.primaryBlue, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  ...children,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
