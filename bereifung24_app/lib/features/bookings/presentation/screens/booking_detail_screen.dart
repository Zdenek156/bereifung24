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
                        booking.statusDisplay,
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
                booking.serviceTypeDisplay,
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                S.of(context)!.bookingNumber(booking.id.length > 10 ? booking.id.substring(0, 10) : booking.id),
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

          // Vehicle
          _DetailCard(
            icon: Icons.directions_car,
            title: S.of(context)!.vehicle,
            children: [
              Text(booking.vehicleDisplay,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              if (booking.licensePlate != null &&
                  booking.licensePlate!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(S.of(context)!.licensePlateLabel(booking.licensePlate!),
                    style: TextStyle(color: Colors.grey[600])),
              ],
            ],
          ),

          // Tire details (only for tire change services)
          if (booking.isTireChangeService && _hasTireInfo) ...[
            const SizedBox(height: 12),
            _DetailCard(
              icon: Icons.tire_repair,
              title: S.of(context)!.tireDetails,
              children: [
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
                  Text(S.of(context)!.tireQuantityLabel(booking.tireQuantity!)),
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
                  _PriceRow(S.of(context)!.paymentType, booking.paymentMethodDisplay),
                  const SizedBox(height: 6),
                ],
                if (booking.paymentStatus != null) ...[
                  _PriceRow(S.of(context)!.paymentStatusLabel, booking.paymentStatusDisplay),
                  const Divider(height: 16),
                ],
                if (booking.basePrice != null)
                  _PriceRow(S.of(context)!.basePrice,
                      '${booking.basePrice!.toStringAsFixed(2)} €'),
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
      booking.tireSize != null;

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
