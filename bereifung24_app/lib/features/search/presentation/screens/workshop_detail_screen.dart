import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import 'search_screen.dart';

// ── Providers ──

final workshopDetailProvider = FutureProvider.family<Workshop, String>(
  (ref, id) async {
    final response = await ApiClient().getWorkshopDetail(id);
    final data = response.data;
    // Detail API wraps in { workshop: {...} }
    final json = data is Map && data.containsKey('workshop')
        ? data['workshop'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return Workshop.fromJson(json);
  },
);

final workshopReviewsProvider = FutureProvider.family<List<Review>, String>(
  (ref, workshopId) async {
    final response = await ApiClient().getWorkshopReviews(workshopId);
    final data = response.data;
    final list = (data is List ? data : data['reviews'] ?? []) as List;
    return list.map((e) => Review.fromJson(e)).toList();
  },
);

/// Selected date for booking
final selectedDateProvider = StateProvider<DateTime?>((ref) => null);

/// Selected tire recommendation for TIRE_CHANGE booking
final selectedTireProvider = StateProvider<TireRecommendation?>((ref) => null);

/// Selected tire for front axle (Mischbereifung)
final selectedTireFrontProvider = StateProvider<TireRecommendation?>((ref) => null);

/// Selected tire for rear axle (Mischbereifung)
final selectedTireRearProvider = StateProvider<TireRecommendation?>((ref) => null);

/// Available time slots from Google Calendar
final availableSlotsProvider =
    FutureProvider.family<List<String>, ({String workshopId, String date, int duration})>(
  (ref, params) async {
    final response = await ApiClient().getAvailableSlots(
      workshopId: params.workshopId,
      date: params.date,
      duration: params.duration,
    );
    final data = response.data;
    final slots = (data['availableSlots'] as List?)?.cast<String>() ?? [];
    return slots;
  },
);

// ── Screen ──

class WorkshopDetailScreen extends ConsumerStatefulWidget {
  final String workshopId;
  final String? serviceType;
  const WorkshopDetailScreen({super.key, required this.workshopId, this.serviceType});

  @override
  ConsumerState<WorkshopDetailScreen> createState() => _WorkshopDetailScreenState();
}

class _WorkshopDetailScreenState extends ConsumerState<WorkshopDetailScreen> {
  String? _selectedSlot;
  String? _selectedServiceType;

  static const _serviceLabels = <String, String>{
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'R\u00e4derwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsendienst',
    'BATTERY_SERVICE': 'Batterieservice',
  };

  static const _serviceIcons = <String, IconData>{
    'TIRE_CHANGE': Icons.tire_repair,
    'WHEEL_CHANGE': Icons.autorenew,
    'TIRE_REPAIR': Icons.build_circle,
    'MOTORCYCLE_TIRE': Icons.two_wheeler,
    'ALIGNMENT_BOTH': Icons.straighten,
    'CLIMATE_SERVICE': Icons.ac_unit,
    'BRAKE_SERVICE': Icons.disc_full,
    'BATTERY_SERVICE': Icons.battery_charging_full,
  };

  static const _serviceImages = <String, String>{
    'TIRE_CHANGE': 'assets/images/services/reifenwechsel.jpg',
    'WHEEL_CHANGE': 'assets/images/services/raederwechsel.jpg',
    'TIRE_REPAIR': 'assets/images/services/reifenreparatur.jpg',
    'MOTORCYCLE_TIRE': 'assets/images/services/motorradreifen.jpg',
    'ALIGNMENT_BOTH': 'assets/images/services/achsvermessung.jpg',
    'CLIMATE_SERVICE': 'assets/images/services/klimaservice.jpg',
  };

  int _calculateDuration(Workshop workshop, bool withBalancing) {
    final pricing = workshop.pricing;
    if (pricing == null) return 60;
    // Use 4-tire duration if available, else single
    int base = pricing.durationMinutes4 ?? pricing.durationMinutes ?? 60;
    if (withBalancing) {
      base += (pricing.balancingMinutes ?? 15) * 4;
    }
    return base;
  }

  Widget _buildServiceFilters(BuildContext context, WidgetRef ref, String serviceType, {Workshop? workshop}) {
    final state = ref.watch(workshopSearchProvider);
    final notifier = ref.read(workshopSearchProvider.notifier);
    final vehicle = ref.read(selectedVehicleProvider);

    switch (serviceType) {
      case 'TIRE_CHANGE':
        return TireChangeFilters(state: state, notifier: notifier, vehicle: vehicle);
      case 'WHEEL_CHANGE':
        return WheelChangeFilters(
          state: state,
          notifier: notifier,
          serviceDetail: workshop?.getServiceDetail('WHEEL_CHANGE'),
        );
      case 'MOTORCYCLE_TIRE':
        return MotorcycleTireFilters(state: state, notifier: notifier);
      case 'TIRE_REPAIR':
        return ServiceToggleFilter(
          state: state,
          notifier: notifier,
          defaultPackage: 'foreign_object',
          options: const [
            ('foreign_object', '🔩', 'Fremdkörper'),
            ('valve_damage', '🔧', 'Ventilschaden'),
          ],
          descriptions: const {
            'foreign_object': 'Professionelle Reparatur von Reifenschäden durch Fremdkörper wie Nägel oder Schrauben',
            'valve_damage': 'Austausch oder Reparatur defekter oder undichter Ventile',
          },
        );
      case 'ALIGNMENT_BOTH':
        return DropdownServiceFilter(
          state: state,
          notifier: notifier,
          title: 'Achsvermessung',
          icon: Icons.straighten,
          defaultPackage: 'measurement_both',
          options: const [
            ('measurement_both', '📐  Vermessung — Beide Achsen'),
            ('measurement_front', '📐  Vermessung — Vorderachse'),
            ('measurement_rear', '📐  Vermessung — Hinterachse'),
            ('adjustment_both', '🔧  Einstellung — Beide Achsen'),
            ('adjustment_front', '🔧  Einstellung — Vorderachse'),
            ('adjustment_rear', '🔧  Einstellung — Hinterachse'),
            ('full_service', '⭐  Komplett mit Inspektion'),
          ],
          descriptions: const {
            'measurement_both': 'Komplette Vermessung von Vorder- und Hinterachse mit Gesamtprotokoll',
            'measurement_front': 'Vermessung der Vorderachse mit detailliertem Prüfprotokoll',
            'measurement_rear': 'Vermessung der Hinterachse mit detailliertem Prüfprotokoll',
            'adjustment_both': 'Komplette Vermessung und Einstellung beider Achsen für perfekte Fahreigenschaften',
            'adjustment_front': 'Vermessung und präzise Einstellung der Vorderachse für optimalen Geradeauslauf',
            'adjustment_rear': 'Vermessung und präzise Einstellung der Hinterachse',
            'full_service': 'Achsvermessung, Einstellung und zusätzliche Fahrwerksinspektion (Stoßdämpfer, Spurstangen, etc.)',
          },
        );
      case 'CLIMATE_SERVICE':
        return DropdownServiceFilter(
          state: state,
          notifier: notifier,
          title: 'Klimaservice',
          icon: Icons.ac_unit,
          defaultPackage: 'basic',
          options: const [
            ('check', '🔍  Basis-Check'),
            ('basic', '❄️  Standard-Service'),
            ('comfort', '🌡️  Komfort-Service'),
            ('premium', '⭐  Premium-Service'),
          ],
          descriptions: const {
            'check': 'Sichtprüfung der Klimaanlage, Funktionstest und Temperaturmessung. Keine Befüllung enthalten.',
            'basic': 'Funktionscheck, Druckprüfung und Nachfüllen von Kältemittel. Bis zu 100ml inklusive.',
            'comfort': 'Standard-Service inkl. Kältemittel (bis 200ml), Wechsel des Pollenfilters und Reinigung der Verdampfer-Lamellen.',
            'premium': 'Kompletter Service: Kältemittel-Befüllung (bis 500ml), Desinfektion mit Ozon/Ultraschall, Premium-Aktivkohlefilter.',
          },
        );
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final workshopAsync = ref.watch(workshopDetailProvider(widget.workshopId));
    final reviewsAsync = ref.watch(workshopReviewsProvider(widget.workshopId));
    final searchState = ref.watch(workshopSearchProvider);
    final selectedVehicle = ref.watch(selectedVehicleProvider);
    final selectedDate = ref.watch(selectedDateProvider);

    // Track workshop view
    ref.listen(workshopDetailProvider(widget.workshopId), (_, next) {
      if (next.hasValue) {
        AnalyticsService().logWorkshopViewed(widget.workshopId);
      }
    });

    return Scaffold(
      body: workshopAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              const Text('Werkstatt konnte nicht geladen werden'),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () => ref.invalidate(workshopDetailProvider(widget.workshopId)),
                child: const Text('Erneut versuchen'),
              ),
            ],
          ),
        ),
        data: (workshop) {
          final effectiveService = widget.serviceType ?? _selectedServiceType;
          final withBalancing = searchState.withBalancing;
          final withStorage = searchState.withStorage;
          final withWashing = searchState.withWashing;
          final duration = _calculateDuration(workshop, withBalancing);

          return CustomScrollView(
            slivers: [
              // ── Hero Image ──
              SliverAppBar(
                expandedHeight: 220,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    workshop.name,
                    style: const TextStyle(fontSize: 16, shadows: [
                      Shadow(blurRadius: 8, color: Colors.black54),
                    ]),
                  ),
                  background: workshop.displayImage != null
                      ? Image.network(
                          workshop.displayImage!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [B24Colors.primaryBlue, B24Colors.primaryLight],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: const Center(
                              child: Icon(Icons.build, size: 64, color: Colors.white54),
                            ),
                          ),
                        )
                      : Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [B24Colors.primaryBlue, B24Colors.primaryLight],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: const Center(
                            child: Icon(Icons.build, size: 64, color: Colors.white54),
                          ),
                        ),
                ),
              ),

              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Rating & Distance ──
                    Row(
                      children: [
                        if (workshop.averageRating != null) ...[
                          _RatingBadge(
                            rating: workshop.averageRating!,
                            count: workshop.reviewCount,
                          ),
                          const SizedBox(width: 12),
                        ],
                        if (workshop.distance != null)
                          Chip(
                            avatar: const Icon(Icons.place, size: 16),
                            label: Text(workshop.distanceFormatted),
                          ),
                      ],
                    ),

                    // ── Über die Werkstatt (Description) ──
                    if (workshop.description != null) ...[
                      const SizedBox(height: 16),
                      _InfoCard(
                        icon: Icons.info_outline,
                        title: 'Über die Werkstatt',
                        child: Text(workshop.description!),
                      ),
                    ],

                    // ── Address ──
                    const SizedBox(height: 12),
                    _InfoCard(
                      icon: Icons.location_on_outlined,
                      title: 'Adresse',
                      child: Text(workshop.fullAddress),
                    ),

                    // ── Service Selection (when no service pre-selected) ──
                    if (widget.serviceType == null && workshop.services.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Service w\u00e4hlen',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 3,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: 0.8,
                        children: workshop.services.map((s) {
                          final isSelected = _selectedServiceType == s;
                          final label = _serviceLabels[s] ?? s;
                          final imagePath = _serviceImages[s];
                          final icon = _serviceIcons[s] ?? Icons.miscellaneous_services;
                          final isDark = Theme.of(context).brightness == Brightness.dark;
                          return GestureDetector(
                            onTap: () {
                              final newService = isSelected ? null : s;
                              final notifier = ref.read(workshopSearchProvider.notifier);

                              if (newService != null) {
                                // Set default package for package-based services
                                const defaultPkgs = {
                                  'TIRE_REPAIR': 'foreign_object',
                                  'ALIGNMENT_BOTH': 'measurement_both',
                                  'CLIMATE_SERVICE': 'basic',
                                };
                                final defaultPkg = defaultPkgs[newService];
                                if (defaultPkg != null) {
                                  notifier.setSelectedPackage(defaultPkg);
                                }

                                // Trigger tire search when TIRE_CHANGE or MOTORCYCLE_TIRE selected
                                if (newService == 'TIRE_CHANGE' || newService == 'MOTORCYCLE_TIRE') {
                                  final vehicle = ref.read(selectedVehicleProvider);
                                  notifier.search(
                                    lat: workshop.latitude,
                                    lng: workshop.longitude,
                                    serviceType: newService,
                                    vehicle: vehicle,
                                  );
                                }
                              } else {
                                notifier.setSelectedPackage(null);
                              }

                              setState(() {
                                _selectedServiceType = newService;
                                _selectedSlot = null;
                              });
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF0284C7)
                                    : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
                                borderRadius: BorderRadius.circular(14),
                                border: isSelected
                                    ? null
                                    : Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  if (imagePath != null)
                                    ClipRRect(
                                      borderRadius: const BorderRadius.only(
                                        topLeft: Radius.circular(14),
                                        topRight: Radius.circular(14),
                                      ),
                                      child: Image.asset(
                                        imagePath,
                                        width: double.infinity,
                                        height: 70,
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  else
                                    Padding(
                                      padding: const EdgeInsets.only(top: 16),
                                      child: Icon(icon, size: 32,
                                          color: isSelected ? Colors.white : (isDark ? const Color(0xFF94A3B8) : Colors.grey[600])),
                                    ),
                                  const SizedBox(height: 8),
                                  Text(
                                    label,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: isSelected ? Colors.white : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      // ── Service-specific filters ──
                      if (_selectedServiceType != null) ...[
                        const SizedBox(height: 12),
                        _buildServiceFilters(context, ref, _selectedServiceType!, workshop: workshop),
                      ],
                    ],

                    // ── Filters for pre-selected service ──
                    if (widget.serviceType != null) ...[
                      const SizedBox(height: 12),
                      _buildServiceFilters(context, ref, widget.serviceType!, workshop: workshop),
                    ],

                    // ── Vehicle Info ──
                    if (selectedVehicle != null) ...[
                      const SizedBox(height: 12),
                      _InfoCard(
                        icon: Icons.directions_car,
                        title: 'Dein Fahrzeug',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              selectedVehicle.displayName,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                            ),
                            if (selectedVehicle.tireSizeWithIndex.isNotEmpty)
                              Text('Reifengröße: ${selectedVehicle.tireSizeWithIndex}',
                                  style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                          ],
                        ),
                      ),
                    ] else ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.amber.shade300),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.amber[700], size: 20),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Text(
                                'Bitte wähle auf der Suche-Seite dein Fahrzeug, um Preise zu sehen.',
                                style: TextStyle(fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // ── Vehicle Type Mismatch Warning ──
                    if (selectedVehicle != null && effectiveService != null) ...[
                      if ((effectiveService == 'MOTORCYCLE_TIRE' && selectedVehicle.vehicleType != 'MOTORCYCLE') ||
                          (effectiveService != 'MOTORCYCLE_TIRE' && selectedVehicle.vehicleType == 'MOTORCYCLE')) ...[                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.red.shade300),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: Colors.red[700], size: 24),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  effectiveService == 'MOTORCYCLE_TIRE'
                                      ? 'Du hast kein Motorrad ausgewählt. Bitte wähle ein Motorrad als Fahrzeug.'
                                      : 'Du hast ein Motorrad ausgewählt. Dieser Service ist nur für PKW/Anhänger verfügbar.',
                                  style: TextStyle(fontSize: 13, color: Colors.red[800]),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],

                    // ── Price Breakdown ──
                    if (effectiveService != null && !(effectiveService == 'TIRE_CHANGE' && searchState.includeTires) && effectiveService != 'MOTORCYCLE_TIRE' && selectedVehicle != null) ...[
                      const SizedBox(height: 12),
                      Builder(builder: (_) {
                        final searchWs = searchState.workshops
                            .where((w) => w.id == widget.workshopId)
                            .firstOrNull;

                        // Resolve pricing: prefer search API price, then service-specific detail
                        double? resolvedPrice = searchWs?.searchBasePrice;
                        const defaultPkgs = {
                          'TIRE_REPAIR': 'foreign_object',
                          'ALIGNMENT_BOTH': 'measurement_both',
                          'CLIMATE_SERVICE': 'basic',
                        };
                        final selectedPkg = searchState.selectedPackage ?? defaultPkgs[effectiveService];
                        final svcDetail = workshop.getServiceDetail(effectiveService);

                        if (resolvedPrice == null && svcDetail != null) {
                          // Try package price first
                          if (selectedPkg != null) {
                            final pkg = svcDetail.packages
                                .where((p) => p.packageType == selectedPkg)
                                .firstOrNull;
                            if (pkg != null) resolvedPrice = pkg.price;
                          }
                          // Fallback to service basePrice
                          resolvedPrice ??= svcDetail.basePrice;
                        }

                        // Build a service-specific pricing override
                        final svcPricing = svcDetail != null
                            ? WorkshopPricing(
                                basePrice: svcDetail.basePrice,
                                basePrice4: svcDetail.basePrice4,
                                balancingPrice: svcDetail.balancingPrice,
                                storagePrice: svcDetail.storagePrice,
                                washingPrice: svcDetail.washingPrice,
                                durationMinutes: svcDetail.durationMinutes,
                                durationMinutes4: svcDetail.durationMinutes4,
                                balancingMinutes: svcDetail.balancingMinutes,
                              )
                            : null;

                        return _PriceBreakdownSection(
                          pricing: svcPricing ?? workshop.pricing,
                          serviceType: effectiveService,
                          withBalancing: withBalancing,
                          withStorage: withStorage,
                          withWashing: withWashing,
                          searchBasePrice: resolvedPrice,
                          selectedPackage: selectedPkg,
                        );
                      }),
                    ],

                    // ── Tire Recommendations for TIRE_CHANGE & MOTORCYCLE_TIRE ──
                    if (effectiveService == 'TIRE_CHANGE' || effectiveService == 'MOTORCYCLE_TIRE') ...[
                      const SizedBox(height: 16),
                      Builder(builder: (context) {
                        final currentSearch = ref.watch(workshopSearchProvider);
                        // Show loading while tire search is in progress
                        if (currentSearch.isLoading) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24),
                            child: Center(child: CircularProgressIndicator()),
                          );
                        }
                        // Show error if search failed
                        if (currentSearch.error != null) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.amber.shade50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.amber.shade300),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.info_outline, color: Colors.amber[700], size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text(currentSearch.error!, style: const TextStyle(fontSize: 13))),
                                ],
                              ),
                            ),
                          );
                        }
                        final ws = currentSearch.workshops
                            .where((w) => w.id == widget.workshopId).firstOrNull;
                        final hasAxleData = ws != null && ws.tireRecommendationsRaw
                            .any((r) => r['axle'] == 'front' || r['axle'] == 'rear');
                        if (hasAxleData) {
                          // Mischbereifung / Motorcycle: separate sections per axle
                          final frontTire = ref.watch(selectedTireFrontProvider);
                          final rearTire = ref.watch(selectedTireRearProvider);
                          final hasBothSelected = frontTire != null && rearTire != null;
                          final hasAnySelected = frontTire != null || rearTire != null;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _TireRecommendationsSection(
                                workshopId: widget.workshopId,
                                axleFilter: 'front',
                                axleLabel: effectiveService == 'MOTORCYCLE_TIRE' ? 'Vorderrad' : 'Vorderachse (VA)',
                              ),
                              const SizedBox(height: 16),
                              _TireRecommendationsSection(
                                workshopId: widget.workshopId,
                                axleFilter: 'rear',
                                axleLabel: effectiveService == 'MOTORCYCLE_TIRE' ? 'Hinterrad' : 'Hinterachse (HA)',
                              ),
                              // Combined Preisübersicht for Mischbereifung
                              if (hasAnySelected && ws!.searchBasePrice != null) ...[
                                const SizedBox(height: 12),
                                _InfoCard(
                                  icon: Icons.euro,
                                  title: 'Preisübersicht',
                                  child: Column(
                                    children: [
                                      if (frontTire != null) ...[
                                        _PriceRow(
                                          'VA: ${frontTire.quantity}× ${frontTire.brand} ${frontTire.model}',
                                          frontTire.totalPrice,
                                        ),
                                        if (frontTire.dimensions != null)
                                          Padding(
                                            padding: const EdgeInsets.only(bottom: 4),
                                            child: Align(
                                              alignment: Alignment.centerLeft,
                                              child: Text(frontTire.dimensions!,
                                                  style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                                            ),
                                          ),
                                      ],
                                      if (rearTire != null) ...[
                                        _PriceRow(
                                          'HA: ${rearTire.quantity}× ${rearTire.brand} ${rearTire.model}',
                                          rearTire.totalPrice,
                                        ),
                                        if (rearTire.dimensions != null)
                                          Padding(
                                            padding: const EdgeInsets.only(bottom: 4),
                                            child: Align(
                                              alignment: Alignment.centerLeft,
                                              child: Text(rearTire.dimensions!,
                                                  style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                                            ),
                                          ),
                                      ],
                                      _PriceRow('Montage', ws.searchBasePrice!),
                                      if (ws.disposalFeeApplied != null && ws.disposalFeeApplied! > 0)
                                        _PriceRow('Entsorgung', ws.disposalFeeApplied!),
                                      if (ws.runFlatSurchargeApplied != null && ws.runFlatSurchargeApplied! > 0)
                                        _PriceRow('RunFlat-Zuschlag', ws.runFlatSurchargeApplied!),
                                      const Divider(height: 16),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Gesamtpreis',
                                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                          Text(
                                            '${((frontTire?.totalPrice ?? 0) + (rearTire?.totalPrice ?? 0) + ws.searchBasePrice! + (ws.disposalFeeApplied ?? 0) + (ws.runFlatSurchargeApplied ?? 0)).toStringAsFixed(2)} €',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                              color: Color(0xFF0284C7),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          );
                        }
                        return _TireRecommendationsSection(
                          workshopId: widget.workshopId,
                        );
                      }),
                    ],

                    // ── Opening hours ──
                    if (workshop.openingHours.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _InfoCard(
                        icon: Icons.access_time,
                        title: 'Öffnungszeiten',
                        child: Column(
                          children: workshop.openingHours.map((h) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(h.dayName,
                                      style: const TextStyle(fontWeight: FontWeight.w500)),
                                  Text(h.isClosed
                                      ? 'Geschlossen'
                                      : '${h.openTime} - ${h.closeTime}'),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],

                    // ── Date Picker (show only when service selected) ──
                    if (effectiveService != null) ...[
                      const SizedBox(height: 24),
                      Text(
                        'Termin wählen',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 12),
                      _DatePickerSection(
                        selectedDate: selectedDate,
                        isTirePurchase: (effectiveService == 'TIRE_CHANGE' || effectiveService == 'MOTORCYCLE_TIRE') && ref.watch(workshopSearchProvider).includeTires,
                        onDateSelected: (date) {
                          ref.read(selectedDateProvider.notifier).state = date;
                          setState(() => _selectedSlot = null);
                        },
                      ),

                      // ── Time Slots ──
                      if (selectedDate != null) ...[
                        const SizedBox(height: 16),
                        _TimeSlotsSection(
                          workshopId: widget.workshopId,
                          date: DateFormat('yyyy-MM-dd').format(selectedDate),
                          duration: duration,
                          selectedSlot: _selectedSlot,
                          onSlotSelected: (slot) => setState(() => _selectedSlot = slot),
                        ),
                      ],
                    ],

                    // ── Reviews ──
                    const SizedBox(height: 24),
                    Text(
                      'Bewertungen',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    reviewsAsync.when(
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (_, __) =>
                          const Text('Bewertungen konnten nicht geladen werden'),
                      data: (reviews) => reviews.isEmpty
                          ? const Text('Noch keine Bewertungen vorhanden.')
                          : Column(
                              children: reviews
                                  .take(5)
                                  .map((r) => _ReviewCard(review: r))
                                  .toList(),
                            ),
                    ),

                    const SizedBox(height: 100), // Space for bottom button
                  ]),
                ),
              ),
            ],
          );
        },
      ),

      // ── Bottom Book Button ──
      bottomNavigationBar: workshopAsync.when(
        loading: () => null,
        error: (_, __) => null,
        data: (workshop) {
          final effectiveService = widget.serviceType ?? _selectedServiceType;
          final isTireChange = effectiveService == 'TIRE_CHANGE';
          final selectedTire = ref.watch(selectedTireProvider);
          final frontTire = ref.watch(selectedTireFrontProvider);
          final rearTire = ref.watch(selectedTireRearProvider);
          final searchState = ref.watch(workshopSearchProvider);
          final ws = searchState.workshops.where((w) => w.id == widget.workshopId).firstOrNull;
          final hasAxleData = ws != null && ws.tireRecommendationsRaw
              .any((r) => r['axle'] == 'front' || r['axle'] == 'rear');
          final isTireWithPurchase = isTireChange && searchState.includeTires;
          final needsTire = isTireWithPurchase && (hasAxleData
              ? (frontTire == null || rearTire == null)
              : selectedTire == null);
          final vehicleTypeMismatch = selectedVehicle != null && effectiveService != null &&
              ((effectiveService == 'MOTORCYCLE_TIRE' && selectedVehicle.vehicleType != 'MOTORCYCLE') ||
               (effectiveService != 'MOTORCYCLE_TIRE' && selectedVehicle.vehicleType == 'MOTORCYCLE'));
          final canBook = effectiveService != null &&
              selectedVehicle != null &&
              selectedDate != null &&
              _selectedSlot != null &&
              !needsTire &&
              !vehicleTypeMismatch;

          String buttonLabel;
          if (effectiveService == null) {
            buttonLabel = 'Bitte Service wählen';
          } else if (isTireWithPurchase && needsTire) {
            buttonLabel = hasAxleData ? 'Bitte VA + HA Reifen wählen' : 'Bitte Reifen wählen';
          } else if (selectedVehicle == null) {
            buttonLabel = 'Bitte Fahrzeug wählen';
          } else if (selectedDate == null) {
            buttonLabel = 'Bitte Datum wählen';
          } else if (_selectedSlot == null) {
            buttonLabel = 'Bitte Uhrzeit wählen';
          } else if (isTireChange) {
            buttonLabel = 'Reifen & Montage buchen – $_selectedSlot Uhr';
          } else {
            buttonLabel = 'Termin buchen – $_selectedSlot Uhr';
          }

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton.icon(
                onPressed: canBook
                    ? () {
                        final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate!);
                        // Get search price and selected package for this workshop
                        final navSearchWs = searchState.workshops
                            .where((w) => w.id == widget.workshopId)
                            .firstOrNull;
                        double? navSearchPrice = navSearchWs?.searchBasePrice;
                        final navSelectedPkg = searchState.selectedPackage;

                        // If no search price, derive from service detail
                        if (navSearchPrice == null) {
                          final svcD = workshop.getServiceDetail(effectiveService!);
                          if (svcD != null) {
                            if (navSelectedPkg != null) {
                              final pkg = svcD.packages
                                  .where((p) => p.packageType == navSelectedPkg)
                                  .firstOrNull;
                              if (pkg != null) navSearchPrice = pkg.price;
                            }
                            navSearchPrice ??= svcD.basePrice;
                          }
                        }

                        final params = <String, String>{
                          'service': effectiveService!,
                          'date': dateStr,
                          'time': _selectedSlot!,
                          if (selectedVehicle != null && selectedVehicle.id != null) 'vehicleId': selectedVehicle.id!,
                          if (searchState.withBalancing) 'balancing': '1',
                          if (searchState.withStorage) 'storage': '1',
                          if (searchState.withWashing) 'washing': '1',
                          if (navSearchPrice != null) 'searchBasePrice': navSearchPrice.toStringAsFixed(2),
                          if (navSelectedPkg != null) 'selectedPackage': navSelectedPkg,
                        };
                        // Add tire data for TIRE_CHANGE
                        if (isTireWithPurchase) {
                          if (hasAxleData && frontTire != null && rearTire != null) {
                            // Mischbereifung — pass both tires separately
                            params['tireBrand'] = frontTire.brand;
                            params['tireModel'] = frontTire.model;
                            params['tireQuantity'] = '${frontTire.quantity + rearTire.quantity}';
                            params['tireTotalPrice'] = (frontTire.totalPrice + rearTire.totalPrice).toStringAsFixed(2);
                            params['tirePricePerUnit'] = frontTire.pricePerTire.toStringAsFixed(2);
                            // Pass front/rear details for booking summary display
                            params['tireFrontBrand'] = frontTire.brand;
                            params['tireFrontModel'] = frontTire.model;
                            params['tireFrontDimensions'] = frontTire.dimensions ?? '';
                            params['tireFrontQty'] = frontTire.quantity.toString();
                            params['tireFrontPrice'] = frontTire.totalPrice.toStringAsFixed(2);
                            params['tireFrontPricePerUnit'] = frontTire.pricePerTire.toStringAsFixed(2);
                            params['tireFrontArticleId'] = frontTire.articleId;
                            if (frontTire.ean != null) params['tireFrontEan'] = frontTire.ean!;
                            params['tireRearBrand'] = rearTire.brand;
                            params['tireRearModel'] = rearTire.model;
                            params['tireRearDimensions'] = rearTire.dimensions ?? '';
                            params['tireRearQty'] = rearTire.quantity.toString();
                            params['tireRearPrice'] = rearTire.totalPrice.toStringAsFixed(2);
                            params['tireRearPricePerUnit'] = rearTire.pricePerTire.toStringAsFixed(2);
                            params['tireRearArticleId'] = rearTire.articleId;
                            if (rearTire.ean != null) params['tireRearEan'] = rearTire.ean!;
                          } else if (selectedTire != null) {
                            params['tireBrand'] = selectedTire.brand;
                            params['tireModel'] = selectedTire.model;
                            final artId = selectedTire.articleId;
                            if (artId != null) {
                              params['tireArticleId'] = artId;
                            }
                            params['tireQuantity'] = selectedTire.quantity.toString();
                            params['tirePricePerUnit'] = selectedTire.pricePerTire.toStringAsFixed(2);
                            params['tireTotalPrice'] = selectedTire.totalPrice.toStringAsFixed(2);
                            if (selectedTire.dimensions != null) {
                              params['tireDimensions'] = selectedTire.dimensions!;
                            }
                          }
                        }
                        final uri = Uri(
                          path: '/booking-summary/${widget.workshopId}',
                          queryParameters: params,
                        );
                        context.push(uri.toString());
                      }
                    : null,
                icon: Icon(isTireChange ? Icons.tire_repair : Icons.calendar_today),
                label: Text(buttonLabel, style: const TextStyle(fontSize: 16)),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Date Picker ──

class _DatePickerSection extends StatelessWidget {
  final DateTime? selectedDate;
  final ValueChanged<DateTime> onDateSelected;
  final bool isTirePurchase;
  const _DatePickerSection({required this.selectedDate, required this.onDateSelected, this.isTirePurchase = false});

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Tire purchase: 7 days ahead (delivery time), other services: tomorrow
    final minDaysAhead = isTirePurchase ? 7 : 1;
    // Generate days for current + next month, skip Sundays
    final lastDay = DateTime(today.year, today.month + 2, 0); // end of next month
    final days = <DateTime>[];
    var d = today.add(Duration(days: minDaysAhead));
    while (!d.isAfter(lastDay)) {
      if (d.weekday != DateTime.sunday) days.add(d);
      d = d.add(const Duration(days: 1));
    }

    final dayNames = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return SizedBox(
      height: 80,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: days.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final date = days[index];
          final isSelected = selectedDate != null &&
              date.year == selectedDate!.year &&
              date.month == selectedDate!.month &&
              date.day == selectedDate!.day;

          return GestureDetector(
            onTap: () => onDateSelected(date),
            child: Container(
              width: 56,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF0284C7) : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
                borderRadius: BorderRadius.circular(12),
                border: isSelected
                    ? null
                    : Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    dayNames[date.weekday],
                    style: TextStyle(
                      fontSize: 12,
                      color: isSelected ? Colors.white70 : (isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${date.day}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : (isDark ? const Color(0xFFF9FAFB) : Colors.black87),
                    ),
                  ),
                  Text(
                    DateFormat('MMM', 'de_DE').format(date),
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected ? Colors.white70 : (isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Time Slots ──

class _TimeSlotsSection extends ConsumerWidget {
  final String workshopId;
  final String date;
  final int duration;
  final String? selectedSlot;
  final ValueChanged<String> onSlotSelected;

  const _TimeSlotsSection({
    required this.workshopId,
    required this.date,
    required this.duration,
    required this.selectedSlot,
    required this.onSlotSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slotsAsync = ref.watch(
      availableSlotsProvider((workshopId: workshopId, date: date, duration: duration)),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Verfügbare Uhrzeiten',
          style: Theme.of(context)
              .textTheme
              .titleSmall
              ?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        slotsAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (err, _) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'Zeiten konnten nicht geladen werden.',
              style: TextStyle(color: Colors.red[700]),
            ),
          ),
          data: (slots) {
            if (slots.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.event_busy, color: Colors.orange),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('Keine freien Termine an diesem Tag.'),
                    ),
                  ],
                ),
              );
            }
            return Wrap(
              spacing: 8,
              runSpacing: 8,
              children: slots.map((slot) {
                final isSelected = slot == selectedSlot;
                return ChoiceChip(
                  label: Text('$slot Uhr'),
                  selected: isSelected,
                  onSelected: (_) => onSlotSelected(slot),
                  selectedColor: const Color(0xFF0284C7),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFFF9FAFB) : Colors.black87),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

// ── Tire Recommendations ──

class _TireRecommendationsSection extends ConsumerStatefulWidget {
  final String workshopId;
  final String? axleFilter; // 'front', 'rear', or null (all)
  final String? axleLabel; // e.g. 'Vorderachse (VA)'
  const _TireRecommendationsSection({required this.workshopId, this.axleFilter, this.axleLabel});

  @override
  ConsumerState<_TireRecommendationsSection> createState() => _TireRecommendationsSectionState();
}

class _TireRecommendationsSectionState extends ConsumerState<_TireRecommendationsSection> {
  static const _initialLimit = 5;
  bool _showAll = false;
  String? _selectedBrand; // null = all brands

  /// Returns the correct provider based on axle filter
  StateProvider<TireRecommendation?> get _tireProvider {
    if (widget.axleFilter == 'front') return selectedTireFrontProvider;
    if (widget.axleFilter == 'rear') return selectedTireRearProvider;
    return selectedTireProvider;
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(workshopSearchProvider);
    final selectedTire = ref.watch(_tireProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final workshop = searchState.workshops.where((w) => w.id == widget.workshopId).firstOrNull;
    if (workshop == null || workshop.tireRecommendationsRaw.isEmpty) {
      return const SizedBox.shrink();
    }

    // Filter by axle if specified
    final rawRecs = widget.axleFilter != null
        ? workshop.tireRecommendationsRaw.where((r) => r['axle'] == widget.axleFilter).toList()
        : workshop.tireRecommendationsRaw;

    final allRecommendations = rawRecs
        .map((r) => TireRecommendation.fromJson(r))
        .toList();

    if (allRecommendations.isEmpty) return const SizedBox.shrink();

    // Collect available brands
    final brands = allRecommendations.map((t) => t.brand).toSet().toList()..sort();

    // Apply brand filter
    final filtered = _selectedBrand != null
        ? allRecommendations.where((t) => t.brand == _selectedBrand).toList()
        : allRecommendations;

    // Apply show more/less limit
    final visible = _showAll ? filtered : filtered.take(_initialLimit).toList();
    final hasMore = filtered.length > _initialLimit;

    final sectionTitle = widget.axleLabel != null
        ? 'Reifenempfehlungen – ${widget.axleLabel}'
        : 'Reifenempfehlungen';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          sectionTitle,
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 4),
        Text(
          '${filtered.length} passende Reifen gefunden',
          style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600], fontSize: 13),
        ),
        const SizedBox(height: 8),

        // Brand filter dropdown
        if (brands.length > 1) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
            ),
            child: DropdownButton<String?>(
              value: _selectedBrand,
              isExpanded: true,
              underline: const SizedBox.shrink(),
              icon: Icon(Icons.filter_list, size: 18, color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
              hint: Text('Alle Hersteller', style: TextStyle(fontSize: 13, color: isDark ? const Color(0xFFF9FAFB) : Colors.grey[800])),
              dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              items: [
                DropdownMenuItem<String?>(
                  value: null,
                  child: Text('Alle Hersteller (${allRecommendations.length})',
                      style: TextStyle(fontSize: 13, color: isDark ? const Color(0xFFF9FAFB) : Colors.grey[800])),
                ),
                ...brands.map((brand) {
                  final count = allRecommendations.where((t) => t.brand == brand).length;
                  return DropdownMenuItem<String?>(
                    value: brand,
                    child: Text('$brand ($count)', style: TextStyle(fontSize: 13, color: isDark ? const Color(0xFFF9FAFB) : Colors.grey[800])),
                  );
                }),
              ],
              onChanged: (value) => setState(() {
                _selectedBrand = value;
                _showAll = false;
              }),
            ),
          ),
          const SizedBox(height: 12),
        ],

        ...visible.map((tire) {
          final isSelected = selectedTire?.articleId == tire.articleId &&
              selectedTire?.brand == tire.brand &&
              selectedTire?.model == tire.model;
          return _TireRecommendationCard(
            tire: tire,
            isSelected: isSelected,
            onTap: () {
              ref.read(_tireProvider.notifier).state = isSelected ? null : tire;
            },
          );
        }),

        // Show more / less button
        if (hasMore) ...[
          const SizedBox(height: 4),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _showAll = !_showAll),
              icon: Icon(_showAll ? Icons.expand_less : Icons.expand_more, size: 18),
              label: Text(_showAll
                  ? 'Weniger anzeigen'
                  : 'Weitere anzeigen (${filtered.length - _initialLimit})'),
            ),
          ),
        ],

        // Tire price summary when selected (only for single-tire, non-axle sections)
        if (widget.axleFilter == null && selectedTire != null && workshop.searchBasePrice != null) ...[
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.euro,
            title: 'Preisübersicht',
            child: Column(
              children: [
                _PriceRow('${selectedTire.quantity}× ${selectedTire.brand} ${selectedTire.model}',
                    selectedTire.totalPrice),
                if (selectedTire.dimensions != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(selectedTire.dimensions!,
                          style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    ),
                  ),
                _PriceRow('Montage', workshop.searchBasePrice!),
                if (workshop.disposalFeeApplied != null && workshop.disposalFeeApplied! > 0)
                  _PriceRow('Entsorgung', workshop.disposalFeeApplied!),
                if (workshop.runFlatSurchargeApplied != null && workshop.runFlatSurchargeApplied! > 0)
                  _PriceRow('RunFlat-Zuschlag', workshop.runFlatSurchargeApplied!),
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Gesamtpreis',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(
                      '${(selectedTire.totalPrice + workshop.searchBasePrice! + (workshop.disposalFeeApplied ?? 0) + (workshop.runFlatSurchargeApplied ?? 0)).toStringAsFixed(2)} €',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _TireRecommendationCard extends StatelessWidget {
  final TireRecommendation tire;
  final bool isSelected;
  final VoidCallback onTap;

  const _TireRecommendationCard({
    required this.tire,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasLabel = tire.label.isNotEmpty;
    Color? labelColor;
    IconData? labelIcon;
    if (hasLabel) {
      switch (tire.label.toLowerCase()) {
        case 'günstigster':
          labelColor = Colors.green;
          labelIcon = Icons.savings;
        case 'testsieger':
          labelColor = Colors.amber[800];
          labelIcon = Icons.emoji_events;
        case 'beliebt':
          labelColor = Colors.blue;
          labelIcon = Icons.trending_up;
        default:
          labelColor = Colors.grey;
          labelIcon = Icons.label;
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: isSelected ? const Color(0xFF0284C7).withValues(alpha: 0.08) : (isDark ? const Color(0xFF1E293B) : Colors.white),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? const Color(0xFF0284C7) : (isDark ? const Color(0xFF334155) : Colors.grey.shade200),
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Label badge + Brand/Model
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (hasLabel) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: labelColor?.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(labelIcon, size: 12, color: labelColor),
                            const SizedBox(width: 4),
                            Text(tire.label,
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: labelColor)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tire.brand,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            tire.model,
                            style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600], fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    // Price
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${tire.totalPrice.toStringAsFixed(2)}€',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: Color(0xFF0284C7),
                          ),
                        ),
                        Text(
                          '${tire.quantity}× ${tire.pricePerTire.toStringAsFixed(2)}€',
                          style: TextStyle(fontSize: 11, color: isDark ? const Color(0xFF94A3B8) : Colors.grey[500]),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // EU Label row
                Row(
                  children: [
                    _euLabelChip('⛽', tire.labelFuelEfficiency ?? '-', _fuelColor(tire.labelFuelEfficiency)),
                    const SizedBox(width: 6),
                    _euLabelChip('💧', tire.labelWetGrip ?? '-', _wetGripColor(tire.labelWetGrip)),
                    const SizedBox(width: 6),
                    _euLabelChip('🔊', '${tire.labelNoise ?? "–"} dB', Colors.grey),
                    if (tire.threePMSF) ...[
                      const SizedBox(width: 6),
                      Builder(builder: (context) {
                        final isDark = Theme.of(context).brightness == Brightness.dark;
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.blue.shade900.withValues(alpha: 0.5) : Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: isDark ? Colors.blue.shade700 : Colors.blue.shade200),
                          ),
                          child: Text('❄️ 3PMSF', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? Colors.blue.shade200 : Colors.blue.shade900)),
                        );
                      }),
                    ],
                    if (tire.runFlat) ...[
                      const SizedBox(width: 6),
                      Builder(builder: (context) {
                        final isDark = Theme.of(context).brightness == Brightness.dark;
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.orange.shade900.withValues(alpha: 0.5) : Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: isDark ? Colors.orange.shade700 : Colors.orange.shade200),
                          ),
                          child: Text('RF', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? Colors.orange.shade200 : Colors.orange.shade900)),
                        );
                      }),
                    ],
                  ],
                ),
                // Selection indicator
                if (isSelected) ...[
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.check_circle, size: 16, color: Color(0xFF0284C7)),
                      SizedBox(width: 6),
                      Text('Ausgewählt',
                          style: TextStyle(fontSize: 12, color: Color(0xFF0284C7), fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _euLabelChip(String emoji, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 10)),
          const SizedBox(width: 3),
          Text(value, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Color _fuelColor(String? grade) {
    switch (grade?.toUpperCase()) {
      case 'A': return Colors.green.shade700;
      case 'B': return Colors.green;
      case 'C': return Colors.lightGreen;
      case 'D': return Colors.amber;
      case 'E': return Colors.orange;
      default: return Colors.grey;
    }
  }

  Color _wetGripColor(String? grade) {
    switch (grade?.toUpperCase()) {
      case 'A': return Colors.blue.shade700;
      case 'B': return Colors.blue;
      case 'C': return Colors.lightBlue;
      case 'D': return Colors.amber;
      case 'E': return Colors.orange;
      default: return Colors.grey;
    }
  }
}

// ── Price Breakdown ──

class _PriceBreakdownSection extends StatelessWidget {
  final WorkshopPricing? pricing;
  final String? serviceType;
  final bool withBalancing;
  final bool withStorage;
  final bool withWashing;
  final double? searchBasePrice;
  final String? selectedPackage;

  const _PriceBreakdownSection({
    required this.pricing,
    required this.serviceType,
    required this.withBalancing,
    required this.withStorage,
    required this.withWashing,
    this.searchBasePrice,
    this.selectedPackage,
  });

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

  static const _defaultPackages = <String, String>{
    'TIRE_REPAIR': 'foreign_object',
    'ALIGNMENT_BOTH': 'measurement_both',
    'CLIMATE_SERVICE': 'basic',
  };

  @override
  Widget build(BuildContext context) {
    double total = 0;
    final rows = <Widget>[];

    // Use searchBasePrice from API (reflects selected package) if available
    double? basePrice;
    String serviceName;

    // Determine the effective package
    final effectivePkg = selectedPackage ?? _defaultPackages[serviceType];
    // Use package-specific label if available, otherwise use generic service name
    final pkgLabel = effectivePkg != null ? _packageLabels[effectivePkg] : null;

    switch (serviceType) {
      case 'WHEEL_CHANGE':
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.basePrice4 ?? pricing?.tireChangePricePKW;
        serviceName = 'Räderwechsel';
        break;
      case 'TIRE_CHANGE':
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.basePrice4 ?? pricing?.tireChangePricePKW;
        serviceName = 'Montage';
        break;
      case 'TIRE_REPAIR':
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.tireChangePricePKW;
        serviceName = pkgLabel ?? 'Reifenreparatur';
        break;
      case 'ALIGNMENT_BOTH':
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.tireChangePricePKW;
        serviceName = pkgLabel ?? 'Achsvermessung';
        break;
      case 'CLIMATE_SERVICE':
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.tireChangePricePKW;
        serviceName = pkgLabel ?? 'Klimaservice';
        break;
      case 'MOTORCYCLE_TIRE':
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.tireChangePriceMotorcycle ?? pricing?.tireChangePricePKW;
        serviceName = 'Motorrad-Reifenwechsel';
        break;
      default:
        basePrice = searchBasePrice ?? pricing?.basePrice ?? pricing?.tireChangePricePKW;
        serviceName = 'Reifenwechsel';
    }

    if (basePrice != null) {
      total += basePrice;
      rows.add(_PriceRow(serviceName, basePrice));
    }

    // Auswuchten ×4
    if (withBalancing && pricing?.balancingPrice != null) {
      final balancingTotal = pricing!.balancingPrice! * 4;
      total += balancingTotal;
      rows.add(_PriceRow('Auswuchten (×4)', balancingTotal));
    }

    // Einlagerung
    if (withStorage && pricing?.storagePrice != null) {
      total += pricing!.storagePrice!;
      rows.add(_PriceRow('Einlagerung', pricing!.storagePrice!));
    }

    // Waschen
    if (withWashing && pricing?.washingPrice != null) {
      total += pricing!.washingPrice!;
      rows.add(_PriceRow('Waschen', pricing!.washingPrice!));
    }

    return _InfoCard(
      icon: Icons.euro,
      title: 'Preisübersicht',
      child: Column(
        children: [
          ...rows,
          if (rows.length > 1) ...[
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Gesamt',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(
                  '${total.toStringAsFixed(2)} €',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Color(0xFF0284C7),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ── Shared Widgets ──

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  const _InfoCard({required this.icon, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: B24Colors.primaryBlue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 4),
                child,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingBadge extends StatelessWidget {
  final double rating;
  final int count;
  const _RatingBadge({required this.rating, required this.count});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.amber.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.amber.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star, size: 18, color: Colors.amber[700]),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          Text(' ($count)',
              style: TextStyle(color: Colors.grey[600], fontSize: 12)),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final double price;
  const _PriceRow(this.label, this.price);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(label),
          ),
          const SizedBox(width: 8),
          Text(
            '${price.toStringAsFixed(2)} €',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Review review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF334155) : Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ...List.generate(
                  5,
                  (i) => Icon(
                    i < review.rating ? Icons.star : Icons.star_border,
                    size: 16,
                    color: Colors.amber[700],
                  ),
                ),
                const Spacer(),
                if (review.createdAt != null)
                  Text(
                    '${review.createdAt!.day}.${review.createdAt!.month}.${review.createdAt!.year}',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
              ],
            ),
            if (review.authorName != null && review.authorName!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(review.authorName!,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            ],
            if (review.comment != null && review.comment!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(review.comment!, style: const TextStyle(fontSize: 13)),
            ],
          ],
        ),
      ),
    );
  }
}
