import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/stripe_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import '../../../search/presentation/screens/search_screen.dart';
import '../../../search/presentation/screens/workshop_detail_screen.dart';
import '../../../vehicles/presentation/screens/vehicles_screen.dart';
import '../../../bookings/presentation/screens/bookings_screen.dart';

class BookingSummaryScreen extends ConsumerStatefulWidget {
  final String workshopId;
  final String? serviceType;
  final String date;
  final String time;
  final String? vehicleId;
  final bool withBalancing;
  final bool withStorage;
  final bool withWashing;
  // Package-based service data
  final double? searchBasePrice;
  final String? selectedPackage;
  // Nur Montage surcharges
  final double? disposalFeeApplied;
  final double? runFlatSurchargeApplied;
  // Estimated duration from search API (accounts for tire quantity)
  final int? estimatedDuration;
  // Tire purchase data
  final String? tireBrand;
  final String? tireModel;
  final String? tireArticleId;
  final int? tireQuantity;
  final double? tirePricePerUnit;
  final double? tireTotalPrice;
  final String? tireDimensions;
  // Mischbereifung front/rear details
  final String? tireFrontBrand;
  final String? tireFrontModel;
  final String? tireFrontDimensions;
  final int? tireFrontQty;
  final double? tireFrontPrice;
  final double? tireFrontPricePerUnit;
  final String? tireFrontArticleId;
  final String? tireFrontEan;
  final String? tireRearBrand;
  final String? tireRearModel;
  final String? tireRearDimensions;
  final int? tireRearQty;
  final double? tireRearPrice;
  final double? tireRearPricePerUnit;
  final String? tireRearArticleId;
  final String? tireRearEan;

  const BookingSummaryScreen({
    super.key,
    required this.workshopId,
    this.serviceType,
    required this.date,
    required this.time,
    this.vehicleId,
    this.withBalancing = false,
    this.withStorage = false,
    this.withWashing = false,
    this.searchBasePrice,
    this.selectedPackage,
    this.disposalFeeApplied,
    this.runFlatSurchargeApplied,
    this.estimatedDuration,
    this.tireBrand,
    this.tireModel,
    this.tireArticleId,
    this.tireQuantity,
    this.tirePricePerUnit,
    this.tireTotalPrice,
    this.tireDimensions,
    this.tireFrontBrand,
    this.tireFrontModel,
    this.tireFrontDimensions,
    this.tireFrontQty,
    this.tireFrontPrice,
    this.tireFrontPricePerUnit,
    this.tireFrontArticleId,
    this.tireFrontEan,
    this.tireRearBrand,
    this.tireRearModel,
    this.tireRearDimensions,
    this.tireRearQty,
    this.tireRearPrice,
    this.tireRearPricePerUnit,
    this.tireRearArticleId,
    this.tireRearEan,
  });

  @override
  ConsumerState<BookingSummaryScreen> createState() =>
      _BookingSummaryScreenState();
}

class _BookingSummaryScreenState extends ConsumerState<BookingSummaryScreen> {
  bool _isSubmitting = false;
  bool _bookingComplete = false;
  String? _selectedPayment;

  static const _serviceLabels = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
  };

  static const _packageLabels = <String, String>{
    // TIRE_REPAIR
    'foreign_object': 'Fremdkörper-Reparatur',
    'valve_damage': 'Ventilschaden-Reparatur',
    // ALIGNMENT_BOTH
    'measurement_both': 'Vermessung — Beide Achsen',
    'measurement_front': 'Vermessung — Vorderachse',
    'measurement_rear': 'Vermessung — Hinterachse',
    'adjustment_both': 'Einstellung — Beide Achsen',
    'adjustment_front': 'Einstellung — Vorderachse',
    'adjustment_rear': 'Einstellung — Hinterachse',
    'full_service': 'Komplett mit Inspektion',
    // CLIMATE_SERVICE
    'check': 'Basis-Check',
    'basic': 'Standard-Service',
    'comfort': 'Komfort-Service',
    'premium': 'Premium-Service',
  };

  /// Resolves the display name: package label → fallback to generic service label
  String get _resolvedServiceName {
    final pkg = widget.selectedPackage;
    if (pkg != null && _packageLabels.containsKey(pkg)) {
      return _packageLabels[pkg]!;
    }
    return _serviceLabels[widget.serviceType] ?? 'Reifenwechsel';
  }

  double _calculateTotal(WorkshopPricing? pricing) {
    // Wenn Reifen gekauft werden, wie gehabt
    if (widget.tireTotalPrice != null) {
      double total = widget.tireTotalPrice!;
      total += widget.searchBasePrice ??
          pricing?.basePrice ??
          pricing?.tireChangePricePKW ??
          0;
      return total;
    }
    double total = 0;
    // Nur Montage: searchBasePrice enthält bereits den Zuschlag (in workshop_detail_screen kombiniert)
    if (widget.serviceType == 'TIRE_CHANGE') {
      total += widget.searchBasePrice ??
          pricing?.basePrice ??
          pricing?.tireChangePricePKW ??
          0;
    } else if (widget.serviceType == 'WHEEL_CHANGE') {
      total += widget.searchBasePrice ??
          pricing?.basePrice ??
          pricing?.basePrice4 ??
          pricing?.tireChangePricePKW ??
          0;
    } else {
      total += widget.searchBasePrice ??
          pricing?.basePrice ??
          pricing?.tireChangePricePKW ??
          0;
    }
    if (widget.withBalancing && pricing?.balancingPrice != null) {
      total += pricing!.balancingPrice! * 4;
    }
    if (widget.withStorage && pricing?.storagePrice != null) {
      total += pricing!.storagePrice!;
    }
    if (widget.withWashing && pricing?.washingPrice != null) {
      total += pricing!.washingPrice!;
    }
    // Add disposal and runflat fees
    if (widget.disposalFeeApplied != null) {
      total += widget.disposalFeeApplied!;
    }
    if (widget.runFlatSurchargeApplied != null) {
      total += widget.runFlatSurchargeApplied!;
    }
    return total;
  }

  Future<void> _submitBooking(Workshop workshop, Vehicle? vehicle) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    try {
      final pricing = workshop.pricing;
      final total = _calculateTotal(pricing);
      final basePrice = widget.searchBasePrice ??
          (widget.serviceType == 'WHEEL_CHANGE'
              ? (pricing?.basePrice ??
                  pricing?.basePrice4 ??
                  pricing?.tireChangePricePKW ??
                  0.0)
              : (pricing?.basePrice ?? pricing?.tireChangePricePKW ?? 0.0));

      // Process Stripe payment first
      String? paymentId;
      if (total > 0) {
        try {
          final result = await StripeService().processPayment(
            bookingId: 'pending_${widget.workshopId}_${widget.date}',
            amount: total,
            paymentMethod: _selectedPayment,
          );
          if (result == null) {
            if (mounted) setState(() => _isSubmitting = false);
            return; // User cancelled
          }
          paymentId = result;
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text('Zahlung fehlgeschlagen: $e'),
                  backgroundColor: Colors.red),
            );
            setState(() => _isSubmitting = false);
          }
          return;
        }
      }

      // Create booking via direct-booking/book API
      if (vehicle?.id == null || vehicle!.id!.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Bitte wähle ein Fahrzeug aus'),
                backgroundColor: Colors.red),
          );
          setState(() => _isSubmitting = false);
        }
        return;
      }
      final bookingData = {
        'workshopId': widget.workshopId,
        'serviceType': widget.serviceType ?? 'WHEEL_CHANGE',
        if (widget.selectedPackage != null)
          'serviceSubtype': widget.selectedPackage,
        'serviceDisplayName': _resolvedServiceName,
        'vehicleId': vehicle.id,
        'date': widget.date,
        'time': widget.time,
        'hasBalancing': widget.withBalancing,
        'hasStorage': widget.withStorage,
        'hasWashing': widget.withWashing,
        'hasDisposal':
            widget.disposalFeeApplied != null && widget.disposalFeeApplied! > 0,
        'basePrice': basePrice,
        if (widget.withBalancing && pricing?.balancingPrice != null)
          'balancingPrice': pricing!.balancingPrice! * 4,
        if (widget.withStorage && pricing?.storagePrice != null)
          'storagePrice': pricing!.storagePrice!,
        if (widget.withWashing && pricing?.washingPrice != null)
          'washingPrice': pricing!.washingPrice!,
        if (widget.disposalFeeApplied != null && widget.disposalFeeApplied! > 0)
          'disposalFee': widget.disposalFeeApplied,
        if (widget.runFlatSurchargeApplied != null &&
            widget.runFlatSurchargeApplied! > 0)
          'runFlatSurcharge': widget.runFlatSurchargeApplied,
        'totalPrice': total,
        'durationMinutes': widget.estimatedDuration ??
            (() {
              int base =
                  pricing?.durationMinutes4 ?? pricing?.durationMinutes ?? 60;
              if (widget.withBalancing && pricing?.balancingMinutes != null) {
                base += pricing!.balancingMinutes! * 4;
              }
              return base;
            }()),
        'paymentMethod': 'STRIPE',
        'paymentId': paymentId ?? 'no_payment',
        // Tire purchase data
        if (widget.tireBrand != null) 'tireBrand': widget.tireBrand,
        if (widget.tireModel != null) 'tireModel': widget.tireModel,
        // Only send single tireArticleNumber for non-Mischbereifung
        if (widget.tireArticleId != null && widget.tireFrontBrand == null)
          'tireArticleNumber': widget.tireArticleId,
        if (widget.tireQuantity != null) 'tireQuantity': widget.tireQuantity,
        if (widget.tirePricePerUnit != null)
          'tirePricePerUnit': widget.tirePricePerUnit,
        if (widget.tireTotalPrice != null)
          'tireTotalPrice': widget.tireTotalPrice,
        if (widget.tireDimensions != null) 'tireSize': widget.tireDimensions,
        // Mischbereifung: structured tireData for correct email rendering
        if (widget.tireFrontBrand != null && widget.tireRearBrand != null)
          'tireData': {
            'isMixedTires': true,
            'front': {
              'brand': widget.tireFrontBrand,
              'model': widget.tireFrontModel ?? '',
              'size': widget.tireFrontDimensions ?? '',
              'articleId': widget.tireFrontArticleId ?? '',
              'ean': widget.tireFrontEan ?? '',
              'quantity': widget.tireFrontQty ?? 2,
              'purchasePrice': widget.tireFrontPricePerUnit ?? 0,
              'totalPrice': widget.tireFrontPrice ?? 0,
            },
            'rear': {
              'brand': widget.tireRearBrand,
              'model': widget.tireRearModel ?? '',
              'size': widget.tireRearDimensions ?? '',
              'articleId': widget.tireRearArticleId ?? '',
              'ean': widget.tireRearEan ?? '',
              'quantity': widget.tireRearQty ?? 2,
              'purchasePrice': widget.tireRearPricePerUnit ?? 0,
              'totalPrice': widget.tireRearPrice ?? 0,
            },
          },
      };

      await ApiClient().createDirectBooking(bookingData);

      if (mounted) {
        // Invalidate bookings cache so the new booking shows up
        ref.invalidate(bookingsProvider);
        setState(() {
          _bookingComplete = true;
          _isSubmitting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        String message = 'Buchung fehlgeschlagen. Bitte versuche es erneut.';
        if (e is DioException && e.response?.statusCode == 409) {
          message = e.response?.data?['error'] ??
              'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle einen anderen Zeitslot.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.red),
        );
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final workshopAsync = ref.watch(workshopDetailProvider(widget.workshopId));
    final selectedVehicle = ref.watch(selectedVehicleProvider);

    if (_bookingComplete) {
      return _BookingConfirmation(
        onGoToBookings: () => context.go('/bookings'),
        onGoHome: () => context.go('/home'),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buchungsübersicht'),
      ),
      body: workshopAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Fehler: $err')),
        data: (workshop) {
          final pricing = workshop.pricing;
          final total = _calculateTotal(pricing);
          final parsedDate = DateTime.tryParse(widget.date);
          final dateFormatted = parsedDate != null
              ? DateFormat('EEEE, d. MMMM yyyy', 'de_DE').format(parsedDate)
              : widget.date;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Workshop ──
                _SummaryCard(
                  icon: Icons.build_circle_outlined,
                  title: 'Werkstatt',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(workshop.name,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text(workshop.fullAddress,
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 13)),
                      if (workshop.phone != null)
                        Text(workshop.phone!,
                            style: TextStyle(
                                color: Colors.grey[600], fontSize: 13)),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // ── Service ──
                _SummaryCard(
                  icon: Icons.miscellaneous_services,
                  title: 'Service',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _resolvedServiceName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 15),
                      ),
                      // Tire purchase info — Mischbereifung VA/HA
                      if (widget.tireFrontBrand != null &&
                          widget.tireRearBrand != null) ...[
                        const SizedBox(height: 6),
                        // VA (Front) tire
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF0284C7).withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: const Color(0xFF0284C7)
                                    .withValues(alpha: 0.15)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 5, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text('VA',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white)),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.tire_repair,
                                  size: 18, color: Color(0xFF0284C7)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${widget.tireFrontBrand} ${widget.tireFrontModel ?? ""}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13),
                                    ),
                                    Text(
                                      '${widget.tireFrontQty ?? 2}× à ${widget.tireFrontPrice != null ? (widget.tireFrontPrice! / (widget.tireFrontQty ?? 2)).toStringAsFixed(2) : "-"}€',
                                      style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12),
                                    ),
                                    if (widget.tireFrontDimensions != null &&
                                        widget.tireFrontDimensions!.isNotEmpty)
                                      Text(widget.tireFrontDimensions!,
                                          style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 11)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        // HA (Rear) tire
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF0284C7).withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: const Color(0xFF0284C7)
                                    .withValues(alpha: 0.15)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 5, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text('HA',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white)),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.tire_repair,
                                  size: 18, color: Color(0xFF0284C7)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${widget.tireRearBrand} ${widget.tireRearModel ?? ""}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13),
                                    ),
                                    Text(
                                      '${widget.tireRearQty ?? 2}× à ${widget.tireRearPrice != null ? (widget.tireRearPrice! / (widget.tireRearQty ?? 2)).toStringAsFixed(2) : "-"}€',
                                      style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12),
                                    ),
                                    if (widget.tireRearDimensions != null &&
                                        widget.tireRearDimensions!.isNotEmpty)
                                      Text(widget.tireRearDimensions!,
                                          style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 11)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ] else if (widget.tireBrand != null) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF0284C7).withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: const Color(0xFF0284C7)
                                    .withValues(alpha: 0.15)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.tire_repair,
                                  size: 18, color: Color(0xFF0284C7)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${widget.tireBrand} ${widget.tireModel ?? ""}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13),
                                    ),
                                    Text(
                                      '${widget.tireQuantity ?? 4}× à ${widget.tirePricePerUnit?.toStringAsFixed(2) ?? "-"}€',
                                      style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12),
                                    ),
                                    if (widget.tireDimensions != null &&
                                        widget.tireDimensions!.isNotEmpty)
                                      Text(widget.tireDimensions!,
                                          style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 11)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      if (widget.withBalancing ||
                          widget.withStorage ||
                          widget.withWashing) ...[
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            if (widget.withBalancing) _OptionChip('Auswuchten'),
                            if (widget.withStorage) _OptionChip('Einlagerung'),
                            if (widget.withWashing) _OptionChip('Waschen'),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // ── Vehicle ──
                _SummaryCard(
                  icon: Icons.directions_car,
                  title: 'Fahrzeug',
                  child: selectedVehicle != null
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(selectedVehicle.displayName,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 15)),
                            if (selectedVehicle.tireSizeWithIndex.isNotEmpty)
                              Text(
                                  'Reifengröße: ${selectedVehicle.tireSizeWithIndex}',
                                  style: TextStyle(
                                      color: Colors.grey[600], fontSize: 13)),
                          ],
                        )
                      : const Text('Kein Fahrzeug ausgewählt',
                          style: TextStyle(color: Colors.red)),
                ),

                const SizedBox(height: 12),

                // ── Termin ──
                _SummaryCard(
                  icon: Icons.calendar_today,
                  title: 'Termin',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dateFormatted,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 15)),
                      Text('${widget.time} Uhr',
                          style: const TextStyle(fontSize: 15)),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // ── Preise ──
                if (pricing != null || widget.searchBasePrice != null) ...[
                  _SummaryCard(
                    icon: Icons.euro,
                    title: 'Kosten',
                    child: Column(
                      children: [
                        // Mischbereifung front/rear tire lines
                        if (widget.tireFrontBrand != null &&
                            widget.tireRearBrand != null) ...[
                          _PriceLine(
                            'VA: ${widget.tireFrontQty ?? 2}× ${widget.tireFrontBrand} ${widget.tireFrontModel ?? ""}',
                            widget.tireFrontPrice ?? 0,
                          ),
                          if (widget.tireFrontDimensions != null &&
                              widget.tireFrontDimensions!.isNotEmpty)
                            Padding(
                              padding:
                                  const EdgeInsets.only(bottom: 4, left: 4),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Text(widget.tireFrontDimensions!,
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey[500])),
                              ),
                            ),
                          _PriceLine(
                            'HA: ${widget.tireRearQty ?? 2}× ${widget.tireRearBrand} ${widget.tireRearModel ?? ""}',
                            widget.tireRearPrice ?? 0,
                          ),
                          if (widget.tireRearDimensions != null &&
                              widget.tireRearDimensions!.isNotEmpty)
                            Padding(
                              padding:
                                  const EdgeInsets.only(bottom: 4, left: 4),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Text(widget.tireRearDimensions!,
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey[500])),
                              ),
                            ),
                        ] else if (widget.tireTotalPrice != null &&
                            widget.tireBrand != null) ...[
                          // Single tire line
                          _PriceLine(
                            '${widget.tireQuantity ?? 4}× ${widget.tireBrand} ${widget.tireModel ?? ""}',
                            widget.tireTotalPrice!,
                          ),
                          if (widget.tireDimensions != null &&
                              widget.tireDimensions!.isNotEmpty)
                            Padding(
                              padding:
                                  const EdgeInsets.only(bottom: 4, left: 4),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Text(widget.tireDimensions!,
                                    style: TextStyle(
                                        fontSize: 12, color: Colors.grey[500])),
                              ),
                            ),
                        ],
                        // Nur Montage: searchBasePrice enthält bereits den Zuschlag
                        if (widget.serviceType == 'TIRE_CHANGE' &&
                            widget.tireTotalPrice == null)
                          _PriceLine(
                            'Montage',
                            widget.searchBasePrice ??
                                (pricing?.basePrice ??
                                    pricing?.tireChangePricePKW ??
                                    0),
                          )
                        else
                          _PriceLine(
                            widget.tireTotalPrice != null
                                ? 'Montage'
                                : _resolvedServiceName,
                            widget.searchBasePrice ??
                                (widget.serviceType == 'WHEEL_CHANGE'
                                    ? (pricing?.basePrice ??
                                        pricing?.basePrice4 ??
                                        pricing?.tireChangePricePKW ??
                                        0)
                                    : (pricing?.basePrice ??
                                        pricing?.tireChangePricePKW ??
                                        0)),
                          ),
                        if (widget.withBalancing &&
                            pricing?.balancingPrice != null)
                          _PriceLine(
                              'Auswuchten (×4)', pricing!.balancingPrice! * 4),
                        if (widget.withStorage && pricing?.storagePrice != null)
                          _PriceLine('Einlagerung', pricing!.storagePrice!),
                        if (widget.withWashing && pricing?.washingPrice != null)
                          _PriceLine('Waschen', pricing!.washingPrice!),
                        if (widget.disposalFeeApplied != null &&
                            widget.disposalFeeApplied! > 0)
                          _PriceLine('Entsorgung', widget.disposalFeeApplied!),
                        if (widget.runFlatSurchargeApplied != null &&
                            widget.runFlatSurchargeApplied! > 0)
                          _PriceLine('RunFlat-Zuschlag',
                              widget.runFlatSurchargeApplied!),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Gesamtpreis',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 17)),
                            Text(
                              '${total.toStringAsFixed(2)} €',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 17,
                                color: Color(0xFF0284C7),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // ── Zahlungsmethode ──
                if (total > 0) ...[
                  _SummaryCard(
                    icon: Icons.payment,
                    title: 'Zahlungsmethode wählen',
                    child: Column(
                      children: [
                        _PaymentMethodTile(
                          label: 'Kreditkarte',
                          subtitle: 'Visa, Mastercard, Amex',
                          iconWidget: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _PaymentLogo('visa'),
                              const SizedBox(width: 6),
                              _PaymentLogo('mastercard'),
                              const SizedBox(width: 6),
                              _PaymentLogo('amex'),
                            ],
                          ),
                          selected: _selectedPayment == 'card',
                          onTap: () =>
                              setState(() => _selectedPayment = 'card'),
                        ),
                        const Divider(height: 1),
                        _PaymentMethodTile(
                          label: 'PayPal',
                          subtitle: 'Schnell & sicher via Stripe',
                          iconWidget: _PaymentLogo('paypal'),
                          selected: _selectedPayment == 'paypal',
                          onTap: () =>
                              setState(() => _selectedPayment = 'paypal'),
                        ),
                        const Divider(height: 1),
                        _PaymentMethodTile(
                          label: 'Klarna',
                          subtitle: 'Jetzt kaufen, später bezahlen',
                          iconWidget: _KlarnaLogo(),
                          selected: _selectedPayment == 'klarna',
                          onTap: () =>
                              setState(() => _selectedPayment = 'klarna'),
                        ),
                        const Divider(height: 1),
                        if (Platform.isIOS)
                          _PaymentMethodTile(
                            label: 'Apple Pay',
                            subtitle: 'Schnell bezahlen',
                            iconWidget: const _ApplePayLogo(),
                            selected: _selectedPayment == 'apple_pay',
                            onTap: () =>
                                setState(() => _selectedPayment = 'apple_pay'),
                          )
                        else
                          _PaymentMethodTile(
                            label: 'Google Pay',
                            subtitle: 'Schnell bezahlen',
                            iconWidget: _PaymentLogo('google-pay'),
                            selected: _selectedPayment == 'google_pay',
                            onTap: () =>
                                setState(() => _selectedPayment = 'google_pay'),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock, size: 13, color: Colors.green[700]),
                      const SizedBox(width: 4),
                      Text(
                        'Verschlüsselte & sichere Zahlung über Stripe',
                        style:
                            TextStyle(fontSize: 11, color: Colors.green[700]),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],

                const SizedBox(height: 12),

                // ── AGB Consent ──
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      children: [
                        const TextSpan(
                            text: 'Mit der Buchung stimmst du unseren '),
                        TextSpan(
                          text: 'AGBs',
                          style: const TextStyle(
                            color: Color(0xFF0284C7),
                            decoration: TextDecoration.underline,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => context.push('/profile/agb'),
                        ),
                        const TextSpan(text: ' und der '),
                        TextSpan(
                          text: 'Datenschutzerklärung',
                          style: const TextStyle(
                            color: Color(0xFF0284C7),
                            decoration: TextDecoration.underline,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap =
                                () => context.push('/profile/datenschutz'),
                        ),
                        const TextSpan(text: ' zu.'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // ── Book Button ──
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed:
                        _isSubmitting || (total > 0 && _selectedPayment == null)
                            ? null
                            : () => _submitBooking(workshop, selectedVehicle),
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.check_circle_outline),
                    label: Text(
                      _isSubmitting
                          ? 'Wird gebucht...'
                          : total > 0
                              ? 'Jetzt buchen & bezahlen – ${total.toStringAsFixed(2)} €'
                              : 'Jetzt verbindlich buchen',
                      style: const TextStyle(fontSize: 16),
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: _isSubmitting ||
                              (total > 0 && _selectedPayment == null)
                          ? Colors.grey[400]
                          : const Color(0xFF0284C7),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ── Helper Widgets ──

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  const _SummaryCard(
      {required this.icon, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: B24Colors.primaryBlue),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: Colors.grey,
                  )),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _OptionChip extends StatelessWidget {
  final String label;
  const _OptionChip(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF0284C7).withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Color(0xFF0284C7),
          )),
    );
  }
}

class _PriceLine extends StatelessWidget {
  final String label;
  final double amount;
  const _PriceLine(this.label, this.amount);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(fontSize: 14)),
          ),
          const SizedBox(width: 8),
          Text('${amount.toStringAsFixed(2)} €',
              style:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  final String label;
  final String subtitle;
  final Widget iconWidget;
  final bool selected;
  final VoidCallback onTap;
  const _PaymentMethodTile({
    required this.label,
    required this.subtitle,
    required this.iconWidget,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: selected
            ? BoxDecoration(
                color: const Color(0xFF0284C7).withOpacity(0.06),
                borderRadius: BorderRadius.circular(8),
                border:
                    Border.all(color: const Color(0xFF0284C7).withOpacity(0.3)),
              )
            : null,
        child: Row(
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Radio<bool>(
                value: true,
                groupValue: selected,
                onChanged: (_) => onTap(),
                activeColor: const Color(0xFF0284C7),
              ),
            ),
            const SizedBox(width: 8),
            iconWidget,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 14,
                      )),
                  Text(subtitle,
                      style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentLogo extends StatelessWidget {
  final String name;
  const _PaymentLogo(this.name);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 28,
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? const Color(0xFF1E293B)
            : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF334155)
                : Colors.grey.shade300),
      ),
      padding: const EdgeInsets.all(3),
      child: Image.asset(
        'assets/images/payment/$name.png',
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Center(
          child: Text(name,
              style: const TextStyle(fontSize: 7, fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}

class _ApplePayLogo extends StatelessWidget {
  const _ApplePayLogo();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: 42,
      height: 28,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
      ),
      padding: const EdgeInsets.all(3),
      child: Center(
        child: Text(
          '\uF8FF Pay',
          style: TextStyle(
            fontFamily: '.SF Pro Text',
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
      ),
    );
  }
}

class _KlarnaLogo extends StatelessWidget {
  const _KlarnaLogo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 28,
      decoration: BoxDecoration(
        color: const Color(0xFFFFB3C7),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Center(
        child: Text(
          'Klarna.',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            color: Colors.black,
            letterSpacing: -0.3,
          ),
        ),
      ),
    );
  }
}

class _BookingConfirmation extends StatelessWidget {
  final VoidCallback onGoToBookings;
  final VoidCallback onGoHome;
  const _BookingConfirmation(
      {required this.onGoToBookings, required this.onGoHome});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle,
                  size: 80, color: Color(0xFF0284C7)),
              const SizedBox(height: 24),
              const Text(
                'Buchung erfolgreich!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'Deine Buchung wurde bestätigt. Du erhältst in Kürze eine Bestätigung per E-Mail.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: Colors.grey[600]),
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onGoToBookings,
                  icon: const Icon(Icons.list_alt),
                  label: const Text('Meine Buchungen'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onGoHome,
                  icon: const Icon(Icons.home),
                  label: const Text('Zur Startseite'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
