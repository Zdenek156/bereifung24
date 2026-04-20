import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../utils/tire_category_utils.dart';
import '../../../vehicles/presentation/screens/vehicles_screen.dart';
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
final selectedTireFrontProvider =
    StateProvider<TireRecommendation?>((ref) => null);

/// Selected tire for rear axle (Mischbereifung)
final selectedTireRearProvider =
    StateProvider<TireRecommendation?>((ref) => null);

/// Available time slots from Google Calendar
final availableSlotsProvider = FutureProvider.autoDispose
    .family<List<String>, ({String workshopId, String date, int duration})>(
  (ref, params) async {
    final response = await ApiClient().getAvailableSlots(
      workshopId: params.workshopId,
      date: params.date,
      duration: params.duration,
    );
    final data = response.data;
    if (data['calendarError'] == true) {
      throw Exception('CALENDAR_ERROR');
    }
    final slots = (data['availableSlots'] as List?)?.cast<String>() ?? [];
    return slots;
  },
);

// ── Screen ──

class WorkshopDetailScreen extends ConsumerStatefulWidget {
  final String workshopId;
  final String? serviceType;
  final String? preferredTireBrand;
  final String? preferredTireModel;
  final String? preferredArticleId;
  final String? preferredRearTireBrand;
  final String? preferredRearTireModel;
  final String? preferredRearArticleId;
  const WorkshopDetailScreen({
    super.key,
    required this.workshopId,
    this.serviceType,
    this.preferredTireBrand,
    this.preferredTireModel,
    this.preferredArticleId,
    this.preferredRearTireBrand,
    this.preferredRearTireModel,
    this.preferredRearArticleId,
  });

  @override
  ConsumerState<WorkshopDetailScreen> createState() =>
      _WorkshopDetailScreenState();
}

class _WorkshopDetailScreenState extends ConsumerState<WorkshopDetailScreen> {
  String? _selectedSlot;
  String? _selectedServiceType;
  bool _tireAutoSelected = false;
  final _reviewsKey = GlobalKey();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToReviews() {
    final ctx = _reviewsKey.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      // Reviews widget not yet built (off-screen). Scroll to bottom first,
      // then ensureVisible after the widget is laid out.
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final ctx2 = _reviewsKey.currentContext;
        if (ctx2 != null) {
          Scrollable.ensureVisible(
            ctx2,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

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
    'WHEEL_CHANGE': 'assets/images/services/raederwechsel.png',
    'TIRE_REPAIR': 'assets/images/services/reifenreparatur.jpg',
    'MOTORCYCLE_TIRE': 'assets/images/services/motorradreifen.jpg',
    'ALIGNMENT_BOTH': 'assets/images/services/achsvermessung.jpg',
    'CLIMATE_SERVICE': 'assets/images/services/klimaservice.jpg',
  };

  int _calculateDuration(Workshop workshop, bool withBalancing, int tireCount) {
    final pricing = workshop.pricing;
    if (pricing == null) return 60;
    int base;
    if (tireCount <= 2) {
      base = pricing.durationMinutes ?? 30;
    } else {
      base = pricing.durationMinutes4 ?? pricing.durationMinutes ?? 60;
    }
    if (withBalancing) {
      base += (pricing.balancingMinutes ?? 15) * tireCount;
    }
    return base;
  }

  Widget _buildServiceFilters(
      BuildContext context, WidgetRef ref, String serviceType,
      {Workshop? workshop}) {
    final state = ref.watch(workshopSearchProvider);
    final notifier = ref.read(workshopSearchProvider.notifier);
    final vehicle = ref.read(selectedVehicleProvider);

    const _wp = EdgeInsets.fromLTRB(0, 4, 0, 12);

    switch (serviceType) {
      case 'TIRE_CHANGE':
        return TireChangeFilters(
            state: state, notifier: notifier, vehicle: vehicle, padding: _wp);
      case 'WHEEL_CHANGE':
        return WheelChangeFilters(
          state: state,
          notifier: notifier,
          serviceDetail: workshop?.getServiceDetail('WHEEL_CHANGE'),
          padding: _wp,
        );
      case 'MOTORCYCLE_TIRE':
        return MotorcycleTireFilters(
            state: state, notifier: notifier, padding: _wp);
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
            'foreign_object':
                'Professionelle Reparatur von Reifenschäden durch Fremdkörper wie Nägel oder Schrauben',
            'valve_damage':
                'Austausch oder Reparatur defekter oder undichter Ventile',
          },
          padding: _wp,
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
            'measurement_both':
                'Komplette Vermessung von Vorder- und Hinterachse mit Gesamtprotokoll',
            'measurement_front':
                'Vermessung der Vorderachse mit detailliertem Prüfprotokoll',
            'measurement_rear':
                'Vermessung der Hinterachse mit detailliertem Prüfprotokoll',
            'adjustment_both':
                'Komplette Vermessung und Einstellung beider Achsen für perfekte Fahreigenschaften',
            'adjustment_front':
                'Vermessung und präzise Einstellung der Vorderachse für optimalen Geradeauslauf',
            'adjustment_rear':
                'Vermessung und präzise Einstellung der Hinterachse',
            'full_service':
                'Achsvermessung, Einstellung und zusätzliche Fahrwerksinspektion (Stoßdämpfer, Spurstangen, etc.)',
          },
          padding: _wp,
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
            'check':
                'Sichtprüfung der Klimaanlage, Funktionstest und Temperaturmessung. Keine Befüllung enthalten.',
            'basic':
                'Funktionscheck, Druckprüfung und Nachfüllen von Kältemittel. Bis zu 100ml inklusive.',
            'comfort':
                'Standard-Service inkl. Kältemittel (bis 200ml), Wechsel des Pollenfilters und Reinigung der Verdampfer-Lamellen.',
            'premium':
                'Kompletter Service: Kältemittel-Befüllung (bis 500ml), Desinfektion mit Ozon/Ultraschall, Premium-Aktivkohlefilter.',
          },
          padding: _wp,
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

    // Auto-select first vehicle if none selected but vehicles exist
    if (selectedVehicle == null) {
      final vehiclesAsync = ref.watch(vehiclesProvider);
      vehiclesAsync.whenData((vehicles) {
        if (vehicles.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              ref.read(selectedVehicleProvider.notifier).state = vehicles.first;
            }
          });
        }
      });
    }

    // Auto-select preferred tire (from AI advisor / search card)
    // Use widget params first, then fall back to search state AI preferences
    final _aiBrand = widget.preferredTireBrand ?? searchState.aiFrontBrand;
    final _aiModel = widget.preferredTireModel ?? searchState.aiFrontModel;
    final _aiArticle = widget.preferredArticleId ?? searchState.aiArticleId;
    final _aiRearBrand =
        widget.preferredRearTireBrand ?? searchState.aiRearBrand;
    final _aiRearModel =
        widget.preferredRearTireModel ?? searchState.aiRearModel;
    final _aiRearArticle =
        widget.preferredRearArticleId ?? searchState.aiRearArticleId;
    if (!_tireAutoSelected &&
        (_aiArticle != null ||
            (_aiBrand != null && _aiModel != null) ||
            _aiRearArticle != null ||
            (_aiRearBrand != null && _aiRearModel != null))) {
      final ws = searchState.workshops
          .where((w) => w.id == widget.workshopId)
          .firstOrNull;
      if (ws != null && ws.tireRecommendationsRaw.isNotEmpty) {
        _tireAutoSelected = true;
        final recs = ws.tireRecommendationsRaw
            .map((r) => TireRecommendation.fromJson(r))
            .toList();

        // Match front/single tire
        TireRecommendation? match;
        if (_aiArticle != null && _aiArticle.isNotEmpty) {
          match = recs.where((t) => t.articleId == _aiArticle).firstOrNull;
        }
        if (match == null && _aiBrand != null && _aiModel != null) {
          match = recs
              .where((t) =>
                  t.brand.toLowerCase() == _aiBrand.toLowerCase() &&
                  t.model.toLowerCase() == _aiModel.toLowerCase())
              .firstOrNull;
        }
        if (match == null && _aiBrand != null) {
          match = recs
              .where((t) => t.brand.toLowerCase() == _aiBrand.toLowerCase())
              .firstOrNull;
        }

        // Match rear tire (for mixed/motorcycle)
        TireRecommendation? rearMatch;
        if (_aiRearArticle != null && _aiRearArticle.isNotEmpty) {
          rearMatch =
              recs.where((t) => t.articleId == _aiRearArticle).firstOrNull;
        }
        if (rearMatch == null && _aiRearBrand != null && _aiRearModel != null) {
          rearMatch = recs
              .where((t) =>
                  t.brand.toLowerCase() == _aiRearBrand.toLowerCase() &&
                  t.model.toLowerCase() == _aiRearModel.toLowerCase())
              .firstOrNull;
        }
        if (rearMatch == null && _aiRearBrand != null) {
          rearMatch = recs
              .where((t) => t.brand.toLowerCase() == _aiRearBrand.toLowerCase())
              .firstOrNull;
        }

        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            if (match != null) {
              if (match.axle == 'front') {
                ref.read(selectedTireFrontProvider.notifier).state = match;
              } else if (match.axle == 'rear') {
                ref.read(selectedTireRearProvider.notifier).state = match;
              } else {
                ref.read(selectedTireProvider.notifier).state = match;
              }
            }
            if (rearMatch != null) {
              ref.read(selectedTireRearProvider.notifier).state = rearMatch;
            }
          }
        });
      }
    }

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
                onPressed: () =>
                    ref.invalidate(workshopDetailProvider(widget.workshopId)),
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
          // Use estimatedDuration from search API (correctly computed as durationPerTire × tireCount)
          final searchWorkshop = searchState.workshops
              .where((w) => w.id == widget.workshopId)
              .firstOrNull;
          final duration = searchWorkshop?.estimatedDuration ??
              _calculateDuration(
                  workshop, withBalancing, searchState.tireCount);

          return CustomScrollView(
            controller: _scrollController,
            slivers: [
              // ── Hero Image ──
              SliverAppBar(
                expandedHeight: 220,
                pinned: false,
                floating: false,
                snap: false,
                leading: Padding(
                  padding: const EdgeInsets.all(8),
                  child: CircleAvatar(
                    backgroundColor: Colors.black45,
                    radius: 18,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back,
                          color: Colors.white, size: 20),
                      padding: EdgeInsets.zero,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    workshop.name,
                    style: const TextStyle(fontSize: 16, shadows: [
                      Shadow(blurRadius: 8, color: Colors.black54),
                    ]),
                  ),
                  background: workshop.displayImage != null
                      ? Builder(builder: (context) {
                          final isDark =
                              Theme.of(context).brightness == Brightness.dark;
                          return Container(
                            color: isDark
                                ? const Color(0xFF0F172A)
                                : const Color(0xFFF1F5F9),
                            child: Image.network(
                              workshop.displayImage!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      B24Colors.primaryBlue,
                                      B24Colors.primaryLight
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                                child: const Center(
                                  child: Icon(Icons.build,
                                      size: 64, color: Colors.white54),
                                ),
                              ),
                            ),
                          );
                        })
                      : Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                B24Colors.primaryBlue,
                                B24Colors.primaryLight
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: const Center(
                            child: Icon(Icons.build,
                                size: 64, color: Colors.white54),
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
                          GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () => _scrollToReviews(),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ...List.generate(5, (i) {
                                  final rating = workshop.averageRating!;
                                  if (i < rating.floor()) {
                                    return Icon(Icons.star,
                                        size: 18, color: Colors.amber[700]);
                                  } else if (i < rating) {
                                    return Icon(Icons.star_half,
                                        size: 18, color: Colors.amber[700]);
                                  }
                                  return Icon(Icons.star_border,
                                      size: 18, color: Colors.amber[700]);
                                }),
                                const SizedBox(width: 6),
                                Text(
                                  workshop.averageRating!.toStringAsFixed(1),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14),
                                ),
                                Text(
                                  ' (${workshop.reviewCount} ${workshop.reviewCount == 1 ? "Bewertung" : "Bewertungen"})',
                                  style: TextStyle(
                                      color: Colors.grey[600], fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                        ] else ...[
                          GestureDetector(
                            onTap: () => _scrollToReviews(),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0284C7)
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: const Color(0xFF0284C7)
                                        .withValues(alpha: 0.3)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.fiber_new,
                                      size: 18, color: Color(0xFF0284C7)),
                                  SizedBox(width: 4),
                                  Text(
                                    'Neu',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: Color(0xFF0284C7),
                                    ),
                                  ),
                                ],
                              ),
                            ),
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
                      _CollapsibleInfoCard(
                        icon: Icons.info_outline,
                        title: S.of(context)!.aboutWorkshop,
                        child: Text(workshop.description!),
                      ),
                    ],

                    // ── Address ──
                    const SizedBox(height: 12),
                    _InfoCard(
                      icon: Icons.location_on_outlined,
                      title: S.of(context)!.addressLabel,
                      compact: true,
                      child: Row(
                        children: [
                          Expanded(child: Text(workshop.fullAddress)),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () async {
                              final address =
                                  Uri.encodeComponent(workshop.fullAddress);
                              final Uri url;
                              if (Platform.isIOS) {
                                url = Uri.parse(
                                    'https://maps.apple.com/?q=$address');
                              } else {
                                if (workshop.latitude != null &&
                                    workshop.longitude != null) {
                                  url = Uri.parse(
                                      'geo:${workshop.latitude},${workshop.longitude}?q=$address');
                                } else {
                                  url = Uri.parse('geo:0,0?q=$address');
                                }
                              }
                              if (await canLaunchUrl(url)) {
                                await launchUrl(url,
                                    mode: LaunchMode.externalApplication);
                              }
                            },
                            icon: const Icon(Icons.map_outlined),
                            tooltip: Platform.isIOS
                                ? 'In Karten öffnen'
                                : 'In Maps öffnen',
                            style: IconButton.styleFrom(
                              foregroundColor: const Color(0xFF0284C7),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── Service Selection (when no service pre-selected) ──
                    if (widget.serviceType == null &&
                        workshop.services.isNotEmpty) ...[
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
                          final icon =
                              _serviceIcons[s] ?? Icons.miscellaneous_services;
                          final isDark =
                              Theme.of(context).brightness == Brightness.dark;
                          return GestureDetector(
                            onTap: () {
                              final newService = isSelected ? null : s;
                              final notifier =
                                  ref.read(workshopSearchProvider.notifier);

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
                                if (newService == 'TIRE_CHANGE' ||
                                    newService == 'MOTORCYCLE_TIRE') {
                                  final vehicle =
                                      ref.read(selectedVehicleProvider);
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
                                    : (isDark
                                        ? const Color(0xFF1E293B)
                                        : Colors.white),
                                borderRadius: BorderRadius.circular(14),
                                border: isSelected ? null : null,
                                boxShadow: isSelected
                                    ? null
                                    : [
                                        BoxShadow(
                                          color: (isDark
                                                  ? Colors.black
                                                  : Colors.black)
                                              .withValues(
                                                  alpha: isDark ? 0.3 : 0.08),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
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
                                        height: 80,
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  else
                                    Padding(
                                      padding: const EdgeInsets.only(top: 16),
                                      child: Icon(icon,
                                          size: 32,
                                          color: isSelected
                                              ? Colors.white
                                              : (isDark
                                                  ? const Color(0xFF94A3B8)
                                                  : Colors.grey[600])),
                                    ),
                                  const SizedBox(height: 8),
                                  Text(
                                    label,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: isSelected
                                          ? Colors.white
                                          : (isDark
                                              ? const Color(0xFFF9FAFB)
                                              : Colors.grey[800]),
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
                        _buildServiceFilters(
                            context, ref, _selectedServiceType!,
                            workshop: workshop),
                      ],
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
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 15),
                            ),
                            if (selectedVehicle.tireSizeWithIndex.isNotEmpty)
                              Text(
                                  'Reifengröße: ${selectedVehicle.tireSizeWithIndex}',
                                  style: TextStyle(
                                      color: Colors.grey[600], fontSize: 13)),
                          ],
                        ),
                      ),
                    ] else ...[
                      const SizedBox(height: 12),
                      Builder(builder: (context) {
                        final isDark =
                            Theme.of(context).brightness == Brightness.dark;
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark
                                ? Colors.amber.shade900.withValues(alpha: 0.3)
                                : Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: isDark
                                    ? Colors.amber.shade700
                                    : Colors.amber.shade300),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.info_outline,
                                      color: Colors.amber[isDark ? 400 : 700],
                                      size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Bitte pflege zuerst ein Fahrzeug ein, um buchen zu können.',
                                      style: TextStyle(
                                          fontSize: 13,
                                          color: isDark
                                              ? Colors.amber.shade200
                                              : Colors.grey[800]),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () =>
                                      context.push('/vehicles/add'),
                                  icon: const Icon(Icons.add, size: 18),
                                  label: const Text('Fahrzeug hinzufügen'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: isDark
                                        ? Colors.amber.shade300
                                        : Colors.amber[800],
                                    side: BorderSide(
                                        color: isDark
                                            ? Colors.amber.shade600
                                            : Colors.amber.shade400),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],

                    // ── Filters for pre-selected service ──
                    if (widget.serviceType != null) ...[
                      const SizedBox(height: 12),
                      _buildServiceFilters(context, ref, widget.serviceType!,
                          workshop: workshop),
                    ],

                    // ── Vehicle Type Mismatch Warning ──
                    if (selectedVehicle != null &&
                        effectiveService != null) ...[
                      if ((effectiveService == 'MOTORCYCLE_TIRE' &&
                              selectedVehicle.vehicleType != 'MOTORCYCLE') ||
                          (effectiveService != 'MOTORCYCLE_TIRE' &&
                              selectedVehicle.vehicleType == 'MOTORCYCLE')) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.red.shade300),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber_rounded,
                                  color: Colors.red[700], size: 24),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  effectiveService == 'MOTORCYCLE_TIRE'
                                      ? 'Du hast kein Motorrad ausgewählt. Bitte wähle ein Motorrad als Fahrzeug.'
                                      : 'Du hast ein Motorrad ausgewählt. Dieser Service ist nur für PKW/Anhänger verfügbar.',
                                  style: TextStyle(
                                      fontSize: 13, color: Colors.red[800]),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],

                    // ── Price Breakdown ──
                    if (effectiveService != null &&
                        !(effectiveService == 'TIRE_CHANGE' &&
                            searchState.includeTires) &&
                        effectiveService != 'MOTORCYCLE_TIRE' &&
                        selectedVehicle != null) ...[
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
                        final selectedPkg = searchState.selectedPackage ??
                            defaultPkgs[effectiveService];
                        final svcDetail =
                            workshop.getServiceDetail(effectiveService);

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
                          searchTotalPrice: searchWs?.searchTotalPrice,
                          wheelChangeBreakdown: searchWs?.wheelChangeBreakdown,
                          mountingOnlySurchargeApplied:
                              searchWs?.mountingOnlySurchargeApplied,
                          disposalFeeApplied: searchWs?.disposalFeeApplied,
                          runFlatSurchargeApplied:
                              searchWs?.runFlatSurchargeApplied,
                          includeTires: searchState.includeTires,
                          selectedPackage: selectedPkg,
                        );
                      }),
                    ],

                    // ── Tire Recommendations for TIRE_CHANGE & MOTORCYCLE_TIRE ──
                    if (effectiveService == 'TIRE_CHANGE' ||
                        effectiveService == 'MOTORCYCLE_TIRE') ...[
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
                                border:
                                    Border.all(color: Colors.amber.shade300),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.info_outline,
                                      color: Colors.amber[700], size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                      child: Text(currentSearch.error!,
                                          style:
                                              const TextStyle(fontSize: 13))),
                                ],
                              ),
                            ),
                          );
                        }
                        final ws = currentSearch.workshops
                            .where((w) => w.id == widget.workshopId)
                            .firstOrNull;

                        // ── Rollo AI Empfehlung card ──
                        Widget? rolloCard;
                        // Read AI preferences: widget params (from URL) → search state (from Riverpod provider)
                        final prefBrand = widget.preferredTireBrand ??
                            currentSearch.aiFrontBrand;
                        final prefModel = widget.preferredTireModel ??
                            currentSearch.aiFrontModel;
                        final prefArticle = widget.preferredArticleId ??
                            currentSearch.aiArticleId;
                        final prefRearBrand = widget.preferredRearTireBrand ??
                            currentSearch.aiRearBrand;
                        final prefRearModel = widget.preferredRearTireModel ??
                            currentSearch.aiRearModel;
                        final prefRearArticle = widget.preferredRearArticleId ??
                            currentSearch.aiRearArticleId;
                        final bool hasFrontPref =
                            prefBrand != null && prefBrand.isNotEmpty;
                        final bool hasRearPref =
                            prefRearBrand != null && prefRearBrand.isNotEmpty;
                        // Only show Rollo card when AI recommendation is active (from Rollo advisor),
                        // NOT when tire brand comes from normal search navigation
                        final bool hasAiRecommendation =
                            (currentSearch.aiFrontBrand != null && currentSearch.aiFrontBrand!.isNotEmpty) ||
                            (currentSearch.aiRearBrand != null && currentSearch.aiRearBrand!.isNotEmpty) ||
                            (currentSearch.aiArticleId != null && currentSearch.aiArticleId!.isNotEmpty);
                        debugPrint(
                            '🤖 [ROLLO-CARD] hasFrontPref=$hasFrontPref ($prefBrand), hasRearPref=$hasRearPref ($prefRearBrand), hasAiRecommendation=$hasAiRecommendation, ws=${ws != null}');
                        debugPrint(
                            '🤖 [ROLLO-CARD] widget.preferredTireBrand=${widget.preferredTireBrand}, widget.preferredRearTireBrand=${widget.preferredRearTireBrand}');
                        debugPrint(
                            '🤖 [ROLLO-CARD] currentSearch.aiFrontBrand=${currentSearch.aiFrontBrand}, currentSearch.aiRearBrand=${currentSearch.aiRearBrand}, aiArticleId=${currentSearch.aiArticleId}');
                        if (hasAiRecommendation && (hasFrontPref || hasRearPref) && ws != null) {
                          final allRecs = ws.tireRecommendationsRaw
                              .map((r) => TireRecommendation.fromJson(r))
                              .toList();

                          // Match front tire
                          TireRecommendation? rolloFrontMatch;
                          if (hasFrontPref) {
                            if (prefArticle != null && prefArticle.isNotEmpty) {
                              rolloFrontMatch = allRecs
                                  .where((t) => t.articleId == prefArticle)
                                  .firstOrNull;
                            }
                            if (rolloFrontMatch == null && prefModel != null) {
                              rolloFrontMatch = allRecs
                                  .where((t) =>
                                      t.brand.toLowerCase() ==
                                          prefBrand!.toLowerCase() &&
                                      t.model.toLowerCase() ==
                                          prefModel.toLowerCase())
                                  .firstOrNull;
                            }
                          }

                          // Match rear tire
                          TireRecommendation? rolloRearMatch;
                          if (hasRearPref) {
                            if (prefRearArticle != null &&
                                prefRearArticle.isNotEmpty) {
                              rolloRearMatch = allRecs
                                  .where((t) => t.articleId == prefRearArticle)
                                  .firstOrNull;
                            }
                            if (rolloRearMatch == null &&
                                prefRearModel != null) {
                              rolloRearMatch = allRecs
                                  .where((t) =>
                                      t.brand.toLowerCase() ==
                                          prefRearBrand!.toLowerCase() &&
                                      t.model.toLowerCase() ==
                                          prefRearModel.toLowerCase())
                                  .firstOrNull;
                            }
                          }

                          // For single tire (non-mixed): use front match as the only match
                          final isMixed = hasRearPref;
                          final rolloMatch = isMixed ? null : rolloFrontMatch;

                          final isDark =
                              Theme.of(context).brightness == Brightness.dark;

                          Widget buildTireRow(TireRecommendation? match,
                              String? brand, String? model, String? axleLabel) {
                            if (match != null) {
                              return Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.06)
                                      : Colors.white.withValues(alpha: 0.8),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: const Color(0xFF0284C7)
                                        .withValues(alpha: 0.3),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.check_circle,
                                        color: Color(0xFF0284C7), size: 20),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          if (axleLabel != null)
                                            Text(axleLabel,
                                                style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(
                                                        0xFF0284C7))),
                                          Text(
                                            '${match.brand} ${match.model}',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                              color: isDark
                                                  ? Colors.white
                                                  : Colors.black87,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${match.dimensions ?? ''} · ${match.totalPrice.toStringAsFixed(2)} €',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isDark
                                                  ? Colors.white60
                                                  : Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      'Verfügbar ✓',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF16A34A),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            } else {
                              return Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.04)
                                      : Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.info_outline,
                                        color: Colors.orange[600], size: 18),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        '${axleLabel != null ? "$axleLabel: " : ""}${brand ?? ""} ${model ?? ""} nicht verfügbar',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: isDark
                                              ? Colors.white70
                                              : Colors.orange[900],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }
                          }

                          rolloCard = Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [
                                        const Color(0xFF0C2D48),
                                        const Color(0xFF0A1628),
                                      ]
                                    : [
                                        const Color(0xFFE0F2FE),
                                        const Color(0xFFF0F9FF),
                                      ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFF0284C7)
                                    .withValues(alpha: 0.5),
                                width: 1.5,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0284C7)
                                            .withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text('🤖',
                                          style: TextStyle(fontSize: 18)),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Rollo Empfehlung',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 15,
                                              color: isDark
                                                  ? Colors.white
                                                  : const Color(0xFF0C4A6E),
                                            ),
                                          ),
                                          Text(
                                            'KI-basierte Reifenempfehlung',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark
                                                  ? Colors.white70
                                                  : const Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                if (isMixed) ...[
                                  // Mixed tires: show front and rear separately
                                  if (hasFrontPref)
                                    buildTireRow(
                                        rolloFrontMatch,
                                        prefBrand,
                                        prefModel,
                                        effectiveService == 'MOTORCYCLE_TIRE'
                                            ? 'Vorderrad'
                                            : 'Vorderachse'),
                                  if (hasFrontPref && hasRearPref)
                                    const SizedBox(height: 8),
                                  if (hasRearPref)
                                    buildTireRow(
                                        rolloRearMatch,
                                        prefRearBrand,
                                        prefRearModel,
                                        effectiveService == 'MOTORCYCLE_TIRE'
                                            ? 'Hinterrad'
                                            : 'Hinterachse'),
                                ] else ...[
                                  // Single tire
                                  buildTireRow(
                                      rolloMatch, prefBrand, prefModel, null),
                                ],
                              ],
                            ),
                          );
                        }

                        final hasAxleData = ws != null &&
                            ws.tireRecommendationsRaw.any((r) =>
                                r['axle'] == 'front' || r['axle'] == 'rear');
                        if (hasAxleData) {
                          // Mischbereifung / Motorcycle: separate sections per axle
                          final frontTire =
                              ref.watch(selectedTireFrontProvider);
                          final rearTire = ref.watch(selectedTireRearProvider);
                          final hasBothSelected =
                              frontTire != null && rearTire != null;
                          final hasAnySelected =
                              frontTire != null || rearTire != null;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (rolloCard != null) rolloCard,
                              _TireRecommendationsSection(
                                workshopId: widget.workshopId,
                                axleFilter: 'front',
                                axleLabel: effectiveService == 'MOTORCYCLE_TIRE'
                                    ? 'Vorderrad'
                                    : 'Vorderachse (VA)',
                                preselected: _tireAutoSelected,
                                isMotorcycle:
                                    effectiveService == 'MOTORCYCLE_TIRE',
                              ),
                              const SizedBox(height: 16),
                              _TireRecommendationsSection(
                                workshopId: widget.workshopId,
                                axleFilter: 'rear',
                                axleLabel: effectiveService == 'MOTORCYCLE_TIRE'
                                    ? 'Hinterrad'
                                    : 'Hinterachse (HA)',
                                preselected: _tireAutoSelected,
                                isMotorcycle:
                                    effectiveService == 'MOTORCYCLE_TIRE',
                              ),
                              // Combined Preisübersicht for Mischbereifung
                              if (hasAnySelected &&
                                  ws!.searchBasePrice != null) ...[
                                const SizedBox(height: 12),
                                _InfoCard(
                                  icon: Icons.euro,
                                  title: S.of(context)!.priceOverview,
                                  child: Column(
                                    children: [
                                      if (frontTire != null) ...[
                                        _PriceRow(
                                          'VA: ${frontTire.quantity}× ${frontTire.brand} ${frontTire.model}',
                                          frontTire.totalPrice,
                                        ),
                                        if (frontTire.dimensions != null)
                                          Padding(
                                            padding: const EdgeInsets.only(
                                                bottom: 4),
                                            child: Align(
                                              alignment: Alignment.centerLeft,
                                              child: Text(frontTire.dimensions!,
                                                  style: TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.grey[500])),
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
                                            padding: const EdgeInsets.only(
                                                bottom: 4),
                                            child: Align(
                                              alignment: Alignment.centerLeft,
                                              child: Text(rearTire.dimensions!,
                                                  style: TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.grey[500])),
                                            ),
                                          ),
                                      ],
                                      _PriceRow(S.of(context)!.montageLabel, ws.searchBasePrice!),
                                      if (ws.disposalFeeApplied != null &&
                                          ws.disposalFeeApplied! > 0)
                                        _PriceRow(S.of(context)!.disposal,
                                            ws.disposalFeeApplied!),
                                      if (ws.runFlatSurchargeApplied != null &&
                                          ws.runFlatSurchargeApplied! > 0)
                                        _PriceRow(S.of(context)!.runflatSurcharge,
                                            ws.runFlatSurchargeApplied!),
                                      const Divider(height: 16),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(S.of(context)!.totalPrice,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16)),
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
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (rolloCard != null) rolloCard,
                            _TireRecommendationsSection(
                              workshopId: widget.workshopId,
                              preselected: _tireAutoSelected,
                              isMotorcycle:
                                  effectiveService == 'MOTORCYCLE_TIRE',
                            ),
                          ],
                        );
                      }),
                    ],

                    // ── Opening hours ──
                    if (workshop.openingHours.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _InfoCard(
                        icon: Icons.access_time,
                        title: S.of(context)!.openingHours,
                        child: Column(
                          children: workshop.openingHours.map((h) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(h.dayName,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w500)),
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
                        S.of(context)!.selectDate,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 12),
                      _DatePickerSection(
                        selectedDate: selectedDate,
                        isTirePurchase: (effectiveService == 'TIRE_CHANGE' ||
                                effectiveService == 'MOTORCYCLE_TIRE') &&
                            ref.watch(workshopSearchProvider).includeTires,
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
                          onSlotSelected: (slot) =>
                              setState(() => _selectedSlot = slot),
                        ),
                      ],
                    ],

                    // ── Reviews ──
                    const SizedBox(height: 24),
                    Text(
                      key: _reviewsKey,
                      S.of(context)!.reviews,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    reviewsAsync.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (_, __) => Text(
                          S.of(context)!.reviewsLoadError),
                      data: (reviews) => reviews.isEmpty
                          ? Text(S.of(context)!.noReviewsYet)
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
          final ws = searchState.workshops
              .where((w) => w.id == widget.workshopId)
              .firstOrNull;
          final hasAxleData = ws != null &&
              ws.tireRecommendationsRaw
                  .any((r) => r['axle'] == 'front' || r['axle'] == 'rear');
          final isTireWithPurchase = isTireChange && searchState.includeTires;
          final needsTire = isTireWithPurchase &&
              (hasAxleData
                  ? (frontTire == null || rearTire == null)
                  : selectedTire == null);
          final vehicleTypeMismatch = selectedVehicle != null &&
              effectiveService != null &&
              ((effectiveService == 'MOTORCYCLE_TIRE' &&
                      selectedVehicle.vehicleType != 'MOTORCYCLE') ||
                  (effectiveService != 'MOTORCYCLE_TIRE' &&
                      selectedVehicle.vehicleType == 'MOTORCYCLE'));
          final canBook = effectiveService != null &&
              selectedVehicle != null &&
              selectedDate != null &&
              _selectedSlot != null &&
              !needsTire &&
              !vehicleTypeMismatch;

          String buttonLabel;
          if (effectiveService == null) {
            buttonLabel = S.of(context)!.pleaseSelectService;
          } else if (isTireWithPurchase && needsTire) {
            buttonLabel = hasAxleData
                ? S.of(context)!.pleaseSelectBothTires
                : S.of(context)!.pleaseSelectTires;
          } else if (selectedVehicle == null) {
            buttonLabel = S.of(context)!.pleaseAddVehicle;
          } else if (selectedDate == null) {
            buttonLabel = S.of(context)!.pleaseSelectDate;
          } else if (_selectedSlot == null) {
            buttonLabel = S.of(context)!.pleaseSelectTime;
          } else if (isTireChange) {
            buttonLabel = S.of(context)!.bookTireAndMontageAt('$_selectedSlot ${S.of(context)!.clockSuffix}');
          } else {
            buttonLabel = S.of(context)!.bookAppointmentAt('$_selectedSlot ${S.of(context)!.clockSuffix}');
          }

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton.icon(
                onPressed: canBook
                    ? () {
                        final dateStr =
                            DateFormat('yyyy-MM-dd').format(selectedDate!);
                        // Get search price and selected package for this workshop
                        final navSearchWs = searchState.workshops
                            .where((w) => w.id == widget.workshopId)
                            .firstOrNull;
                        double? navSearchPrice = navSearchWs?.searchBasePrice;
                        final navSelectedPkg = searchState.selectedPackage;

                        // If no search price, derive from service detail
                        if (navSearchPrice == null) {
                          final svcD =
                              workshop.getServiceDetail(effectiveService!);
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

                        // For "Nur Montage", combine base + mounting surcharge into searchBasePrice
                        double? effectivePrice = navSearchPrice;
                        if (!searchState.includeTires && navSearchWs != null) {
                          if (navSearchWs.mountingOnlySurchargeApplied !=
                                  null &&
                              navSearchWs.mountingOnlySurchargeApplied! > 0) {
                            effectivePrice = (effectivePrice ?? 0) +
                                navSearchWs.mountingOnlySurchargeApplied!;
                          }
                        }

                        final params = <String, String>{
                          'service': effectiveService!,
                          'date': dateStr,
                          'time': _selectedSlot!,
                          if (selectedVehicle != null &&
                              selectedVehicle.id != null)
                            'vehicleId': selectedVehicle.id!,
                          if (searchState.withBalancing) 'balancing': '1',
                          if (searchState.withStorage) 'storage': '1',
                          if (searchState.withWashing) 'washing': '1',
                          if (effectivePrice != null)
                            'searchBasePrice':
                                effectivePrice.toStringAsFixed(2),
                          if (navSelectedPkg != null)
                            'selectedPackage': navSelectedPkg,
                          if (navSearchWs?.estimatedDuration != null)
                            'estimatedDuration':
                                navSearchWs!.estimatedDuration.toString(),
                        };

                        // Pass disposal/runflat fees for booking summary
                        if (!searchState.includeTires && navSearchWs != null) {
                          if (navSearchWs.disposalFeeApplied != null &&
                              navSearchWs.disposalFeeApplied! > 0) {
                            params['disposalFeeApplied'] = navSearchWs
                                .disposalFeeApplied!
                                .toStringAsFixed(2);
                          }
                          if (navSearchWs.runFlatSurchargeApplied != null &&
                              navSearchWs.runFlatSurchargeApplied! > 0) {
                            params['runFlatSurchargeApplied'] = navSearchWs
                                .runFlatSurchargeApplied!
                                .toStringAsFixed(2);
                          }
                        }
                        // Add tire data for TIRE_CHANGE
                        if (isTireWithPurchase) {
                          if (hasAxleData &&
                              frontTire != null &&
                              rearTire != null) {
                            // Mischbereifung — pass both tires separately
                            params['tireBrand'] = frontTire.brand;
                            params['tireModel'] = frontTire.model;
                            params['tireQuantity'] =
                                '${frontTire.quantity + rearTire.quantity}';
                            params['tireTotalPrice'] =
                                (frontTire.totalPrice + rearTire.totalPrice)
                                    .toStringAsFixed(2);
                            params['tirePricePerUnit'] =
                                frontTire.pricePerTire.toStringAsFixed(2);
                            // Pass front/rear details for booking summary display
                            params['tireFrontBrand'] = frontTire.brand;
                            params['tireFrontModel'] = frontTire.model;
                            params['tireFrontDimensions'] =
                                frontTire.dimensions ?? '';
                            params['tireFrontQty'] =
                                frontTire.quantity.toString();
                            params['tireFrontPrice'] =
                                frontTire.totalPrice.toStringAsFixed(2);
                            params['tireFrontPricePerUnit'] =
                                frontTire.pricePerTire.toStringAsFixed(2);
                            params['tireFrontArticleId'] = frontTire.articleId;
                            if (frontTire.ean != null)
                              params['tireFrontEan'] = frontTire.ean!;
                            params['tireRearBrand'] = rearTire.brand;
                            params['tireRearModel'] = rearTire.model;
                            params['tireRearDimensions'] =
                                rearTire.dimensions ?? '';
                            params['tireRearQty'] =
                                rearTire.quantity.toString();
                            params['tireRearPrice'] =
                                rearTire.totalPrice.toStringAsFixed(2);
                            params['tireRearPricePerUnit'] =
                                rearTire.pricePerTire.toStringAsFixed(2);
                            params['tireRearArticleId'] = rearTire.articleId;
                            if (rearTire.ean != null)
                              params['tireRearEan'] = rearTire.ean!;
                          } else if (selectedTire != null) {
                            params['tireBrand'] = selectedTire.brand;
                            params['tireModel'] = selectedTire.model;
                            final artId = selectedTire.articleId;
                            if (artId != null) {
                              params['tireArticleId'] = artId;
                            }
                            params['tireQuantity'] =
                                selectedTire.quantity.toString();
                            params['tirePricePerUnit'] =
                                selectedTire.pricePerTire.toStringAsFixed(2);
                            params['tireTotalPrice'] =
                                selectedTire.totalPrice.toStringAsFixed(2);
                            if (selectedTire.dimensions != null) {
                              params['tireDimensions'] =
                                  selectedTire.dimensions!;
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
                icon: Icon(
                    isTireChange ? Icons.tire_repair : Icons.calendar_today),
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
  const _DatePickerSection(
      {required this.selectedDate,
      required this.onDateSelected,
      this.isTirePurchase = false});

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Tire purchase: 7 days ahead (delivery time), other services: tomorrow
    final minDaysAhead = isTirePurchase ? 7 : 1;
    // Generate days for current + next month, skip Sundays
    final lastDay =
        DateTime(today.year, today.month + 2, 0); // end of next month
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
                color: isSelected
                    ? const Color(0xFF0284C7)
                    : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
                borderRadius: BorderRadius.circular(12),
                border: isSelected
                    ? null
                    : Border.all(
                        color: isDark
                            ? const Color(0xFF334155)
                            : Colors.grey.shade300),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    dayNames[date.weekday],
                    style: TextStyle(
                      fontSize: 12,
                      color: isSelected
                          ? Colors.white70
                          : (isDark
                              ? const Color(0xFF94A3B8)
                              : Colors.grey[600]),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${date.day}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? Colors.white
                          : (isDark ? const Color(0xFFF9FAFB) : Colors.black87),
                    ),
                  ),
                  Text(
                    DateFormat('MMM', 'de_DE').format(date),
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected
                          ? Colors.white70
                          : (isDark
                              ? const Color(0xFF94A3B8)
                              : Colors.grey[600]),
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
      availableSlotsProvider(
          (workshopId: workshopId, date: date, duration: duration)),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          S.of(context)!.availableTimes,
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
          error: (err, _) {
            final isCalendarError = err.toString().contains('CALENDAR_ERROR');
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(
                      isCalendarError
                          ? Icons.calendar_month
                          : Icons.error_outline,
                      color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isCalendarError
                          ? 'Google Kalender konnte nicht abgefragt werden. Bitte kontaktieren Sie die Werkstatt telefonisch.'
                          : 'Zeiten konnten nicht geladen werden.',
                      style: TextStyle(color: Colors.red[700]),
                    ),
                  ),
                ],
              ),
            );
          },
          data: (slots) {
            if (slots.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.event_busy, color: Colors.orange),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Keine freien Termine an diesem Tag.',
                        style: TextStyle(color: Colors.orange.shade900),
                      ),
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
                  label: Text('$slot ${S.of(context)!.clockSuffix}'),
                  selected: isSelected,
                  onSelected: (_) => onSlotSelected(slot),
                  selectedColor: const Color(0xFF0284C7),
                  labelStyle: TextStyle(
                    color: isSelected
                        ? Colors.white
                        : (Theme.of(context).brightness == Brightness.dark
                            ? const Color(0xFFF9FAFB)
                            : Colors.black87),
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
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
  final bool preselected; // true if tire was auto-selected from AI advisor
  final bool isMotorcycle; // hide label badges for motorcycle tires
  const _TireRecommendationsSection(
      {required this.workshopId,
      this.axleFilter,
      this.axleLabel,
      this.preselected = false,
      this.isMotorcycle = false});

  @override
  ConsumerState<_TireRecommendationsSection> createState() =>
      _TireRecommendationsSectionState();
}

class _TireRecommendationsSectionState
    extends ConsumerState<_TireRecommendationsSection> {
  static const _initialLimit = 5;
  static const _pageSize = 5;
  int _visibleCount = _initialLimit;
  bool _expanded = false; // false = collapsed when preselected
  String? _selectedBrand; // null = all brands
  String? _lastCategory; // track last applied category to avoid infinite loops

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
    final selectedCategory = searchState.selectedTireCategory;

    final workshop = searchState.workshops
        .where((w) => w.id == widget.workshopId)
        .firstOrNull;
    if (workshop == null || workshop.tireRecommendationsRaw.isEmpty) {
      return const SizedBox.shrink();
    }

    // Filter by axle if specified
    final rawRecs = widget.axleFilter != null
        ? workshop.tireRecommendationsRaw
            .where((r) => r['axle'] == widget.axleFilter)
            .toList()
        : workshop.tireRecommendationsRaw;

    final allRecommendations =
        rawRecs.map((r) => TireRecommendation.fromJson(r)).toList();

    // Apply web-style category filter
    final categoryFiltered =
        filterByCategory(allRecommendations, selectedCategory);

    // Auto-select tire matching the selected category when it changes
    if (selectedCategory != _lastCategory && allRecommendations.isNotEmpty) {
      _lastCategory = selectedCategory;
      _selectedBrand = null; // reset brand filter when category changes
      if (selectedCategory != null && categoryFiltered.isNotEmpty) {
        // Category selected: pick first from filtered list (cheapest in that category)
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ref.read(_tireProvider.notifier).state = categoryFiltered.first;
          }
        });
      } else {
        // Category deselected or no matches: reset to first (cheapest) tire
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ref.read(_tireProvider.notifier).state = allRecommendations.first;
          }
        });
      }
    }

    if (allRecommendations.isEmpty) return const SizedBox.shrink();

    final sectionTitle = widget.axleLabel != null
        ? S.of(context)!.tireRecommendationsAxle(widget.axleLabel!)
        : S.of(context)!.tireRecommendations;

    // Collect available brands (from category-filtered list) — needed in both views
    final brands = categoryFiltered.map((t) => t.brand).toSet().toList()
      ..sort();

    // Collapsed view: show only the selected tire when preselected
    if (widget.preselected && !_expanded && selectedTire != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.axleLabel != null
                ? S.of(context)!.selectedTireAxle(widget.axleLabel!)
                : S.of(context)!.selectedTire,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          // Brand filter dropdown (also in collapsed view)
          if (brands.length > 1) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: isDark
                        ? const Color(0xFF334155)
                        : Colors.grey.shade300),
              ),
              child: DropdownButton<String?>(
                value: _selectedBrand,
                isExpanded: true,
                underline: const SizedBox.shrink(),
                icon: Icon(Icons.filter_list,
                    size: 18,
                    color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
                hint: Text(S.of(context)!.allManufacturers,
                    style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? const Color(0xFFF9FAFB)
                            : Colors.grey[800])),
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                items: [
                  DropdownMenuItem<String?>(
                    value: null,
                    child: Text(S.of(context)!.allManufacturersCount(categoryFiltered.length),
                        style: TextStyle(
                            fontSize: 13,
                            color: isDark
                                ? const Color(0xFFF9FAFB)
                                : Colors.grey[800])),
                  ),
                  ...brands.map((brand) {
                    final count =
                        categoryFiltered.where((t) => t.brand == brand).length;
                    return DropdownMenuItem<String?>(
                      value: brand,
                      child: Text('$brand ($count)',
                          style: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? const Color(0xFFF9FAFB)
                                  : Colors.grey[800])),
                    );
                  }),
                ],
                onChanged: (value) => setState(() {
                  _selectedBrand = value;
                }),
              ),
            ),
            const SizedBox(height: 8),
          ],
          _TireRecommendationCard(
            tire: selectedTire,
            isSelected: true,
            onTap: () {},
            categoryOverride: selectedCategory,
            isMotorcycle: widget.isMotorcycle,
          ),
          // Price summary
          if (widget.axleFilter == null &&
              workshop.searchBasePrice != null) ...[
            const SizedBox(height: 12),
            _InfoCard(
              icon: Icons.euro,
              title: S.of(context)!.priceOverview,
              child: Column(
                children: [
                  _PriceRow(
                      '${selectedTire.quantity}× ${selectedTire.brand} ${selectedTire.model}',
                      selectedTire.totalPrice),
                  if (selectedTire.dimensions != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(selectedTire.dimensions!,
                            style: TextStyle(
                                fontSize: 12, color: Colors.grey[500])),
                      ),
                    ),
                  _PriceRow(S.of(context)!.montageLabel, workshop.searchBasePrice!),
                  if (workshop.disposalFeeApplied != null &&
                      workshop.disposalFeeApplied! > 0)
                    _PriceRow(S.of(context)!.disposal, workshop.disposalFeeApplied!),
                  if (workshop.runFlatSurchargeApplied != null &&
                      workshop.runFlatSurchargeApplied! > 0)
                    _PriceRow(
                        S.of(context)!.runflatSurcharge, workshop.runFlatSurchargeApplied!),
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(S.of(context)!.totalPrice,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
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
          const SizedBox(height: 8),
          Center(
            child: OutlinedButton.icon(
              onPressed: () => setState(() => _expanded = true),
              icon: const Icon(Icons.expand_more, size: 18),
              label: Text(
                  'Weitere Reifen anzeigen (${categoryFiltered.length - 1})'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF0284C7),
                side: const BorderSide(color: Color(0xFF0284C7)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      );
    }

    // Apply brand filter on top of category filter
    final filtered = _selectedBrand != null
        ? categoryFiltered.where((t) => t.brand == _selectedBrand).toList()
        : categoryFiltered;

    // Apply show more/less limit
    final visible = filtered.take(_visibleCount).toList();
    final hasMore = filtered.length > _visibleCount;

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
          style: TextStyle(
              color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600],
              fontSize: 13),
        ),
        const SizedBox(height: 8),

        // Brand filter dropdown
        if (brands.length > 1) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                  color:
                      isDark ? const Color(0xFF334155) : Colors.grey.shade300),
            ),
            child: DropdownButton<String?>(
              value: _selectedBrand,
              isExpanded: true,
              underline: const SizedBox.shrink(),
              icon: Icon(Icons.filter_list,
                  size: 18,
                  color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
              hint: Text(S.of(context)!.allManufacturers,
                  style: TextStyle(
                      fontSize: 13,
                      color:
                          isDark ? const Color(0xFFF9FAFB) : Colors.grey[800])),
              dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              items: [
                DropdownMenuItem<String?>(
                  value: null,
                  child: Text(S.of(context)!.allManufacturersCount(categoryFiltered.length),
                      style: TextStyle(
                          fontSize: 13,
                          color: isDark
                              ? const Color(0xFFF9FAFB)
                              : Colors.grey[800])),
                ),
                ...brands.map((brand) {
                  final count =
                      categoryFiltered.where((t) => t.brand == brand).length;
                  return DropdownMenuItem<String?>(
                    value: brand,
                    child: Text('$brand ($count)',
                        style: TextStyle(
                            fontSize: 13,
                            color: isDark
                                ? const Color(0xFFF9FAFB)
                                : Colors.grey[800])),
                  );
                }),
              ],
              onChanged: (value) => setState(() {
                _selectedBrand = value;
                _visibleCount = _initialLimit;
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
            categoryOverride: selectedCategory,
            isMotorcycle: widget.isMotorcycle,
            onTap: () {
              ref.read(_tireProvider.notifier).state = isSelected ? null : tire;
            },
          );
        }),

        // Show more / less buttons
        if (hasMore) ...[
          const SizedBox(height: 4),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _visibleCount += _pageSize),
              icon: const Icon(Icons.expand_more, size: 18),
              label:
                  Text('Weitere anzeigen (${filtered.length - _visibleCount})'),
            ),
          ),
        ],
        if (_visibleCount > _initialLimit) ...[
          const SizedBox(height: 4),
          Center(
            child: TextButton.icon(
              onPressed: () => setState(() => _visibleCount = _initialLimit),
              icon: const Icon(Icons.expand_less, size: 18),
              label: const Text('Weniger anzeigen'),
            ),
          ),
        ],

        // Collapse back to single-tire view
        if (widget.preselected) ...[
          const SizedBox(height: 4),
          Center(
            child: OutlinedButton.icon(
              onPressed: () => setState(() {
                _expanded = false;
                _visibleCount = _initialLimit;
                _selectedBrand = null;
              }),
              icon: const Icon(Icons.expand_less, size: 18),
              label: const Text('Weniger Reifen anzeigen'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF0284C7),
                side: const BorderSide(color: Color(0xFF0284C7)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],

        // Tire price summary when selected (only for single-tire, non-axle sections)
        if (widget.axleFilter == null &&
            selectedTire != null &&
            workshop.searchBasePrice != null) ...[
          const SizedBox(height: 12),
          _InfoCard(
            icon: Icons.euro,
            title: S.of(context)!.priceOverview,
            child: Column(
              children: [
                _PriceRow(
                    '${selectedTire.quantity}× ${selectedTire.brand} ${selectedTire.model}',
                    selectedTire.totalPrice),
                if (selectedTire.dimensions != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(selectedTire.dimensions!,
                          style:
                              TextStyle(fontSize: 12, color: Colors.grey[500])),
                    ),
                  ),
                _PriceRow(S.of(context)!.montageLabel, workshop.searchBasePrice!),
                if (workshop.disposalFeeApplied != null &&
                    workshop.disposalFeeApplied! > 0)
                  _PriceRow(S.of(context)!.disposal, workshop.disposalFeeApplied!),
                if (workshop.runFlatSurchargeApplied != null &&
                    workshop.runFlatSurchargeApplied! > 0)
                  _PriceRow(
                      S.of(context)!.runflatSurcharge, workshop.runFlatSurchargeApplied!),
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(S.of(context)!.totalPrice,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
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
  final String? categoryOverride;
  final bool isMotorcycle;

  const _TireRecommendationCard({
    required this.tire,
    required this.isSelected,
    required this.onTap,
    this.categoryOverride,
    this.isMotorcycle = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Use categoryOverride if provided, else fall back to tire.label
    // For motorcycle: only show badge when category is explicitly selected (no tire.label data)
    final effectiveLabel =
        (categoryOverride != null && categoryOverride!.isNotEmpty)
            ? categoryOverride!
            : (isMotorcycle ? '' : tire.label);
    final hasLabel = effectiveLabel.isNotEmpty;
    Color? labelColor;
    IconData? labelIcon;
    String displayLabel = effectiveLabel;
    if (hasLabel) {
      switch (effectiveLabel.toLowerCase()) {
        case 'günstigster':
          labelColor = Colors.green;
          labelIcon = Icons.savings;
          displayLabel = S.of(context)!.categoryCheapest;
        case 'testsieger':
          labelColor = Colors.amber[800];
          labelIcon = Icons.star;
          displayLabel = S.of(context)!.categoryPremium;
        case 'beliebt':
          labelColor = Colors.blue;
          labelIcon = Icons.thumb_up;
          displayLabel = S.of(context)!.categoryBest;
        default:
          labelColor = Colors.grey;
          labelIcon = Icons.label;
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: isSelected
            ? const Color(0xFF0284C7).withValues(alpha: 0.08)
            : (isDark ? const Color(0xFF1E293B) : Colors.white),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFF0284C7)
                    : (isDark ? const Color(0xFF334155) : Colors.grey.shade200),
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
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: labelColor?.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(labelIcon, size: 12, color: labelColor),
                            const SizedBox(width: 4),
                            Text(displayLabel,
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: labelColor)),
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
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            tire.model,
                            style: TextStyle(
                                color: isDark
                                    ? const Color(0xFF94A3B8)
                                    : Colors.grey[600],
                                fontSize: 13),
                          ),
                          // Tire dimensions (e.g. 120/70 R17 73W)
                          if (tire.dimensions != null &&
                              tire.dimensions!.isNotEmpty)
                            Text(
                              tire.dimensions!,
                              style: TextStyle(
                                  color: isDark
                                      ? const Color(0xFF64748B)
                                      : Colors.grey[500],
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500),
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
                          style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : Colors.grey[500]),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // EU Label row (hide for motorcycle - no label data available)
                if (!isMotorcycle)
                  Row(
                    children: [
                      _euLabelChip('⛽', tire.labelFuelEfficiency ?? '-',
                          _fuelColor(tire.labelFuelEfficiency)),
                      const SizedBox(width: 6),
                      _euLabelChip('💧', tire.labelWetGrip ?? '-',
                          _wetGripColor(tire.labelWetGrip)),
                      const SizedBox(width: 6),
                      _euLabelChip(
                          '🔊', '${tire.labelNoise ?? "–"} dB', Colors.grey),
                      if (tire.threePMSF) ...[
                        const SizedBox(width: 6),
                        Builder(builder: (context) {
                          final isDark =
                              Theme.of(context).brightness == Brightness.dark;
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.blue.shade900.withValues(alpha: 0.5)
                                  : Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                  color: isDark
                                      ? Colors.blue.shade700
                                      : Colors.blue.shade200),
                            ),
                            child: Text('❄️ 3PMSF',
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? Colors.blue.shade200
                                        : Colors.blue.shade900)),
                          );
                        }),
                      ],
                      if (tire.runFlat) ...[
                        const SizedBox(width: 6),
                        Builder(builder: (context) {
                          final isDark =
                              Theme.of(context).brightness == Brightness.dark;
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.orange.shade900
                                      .withValues(alpha: 0.5)
                                  : Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                  color: isDark
                                      ? Colors.orange.shade700
                                      : Colors.orange.shade200),
                            ),
                            child: Text('RF',
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? Colors.orange.shade200
                                        : Colors.orange.shade900)),
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
                      Icon(Icons.check_circle,
                          size: 16, color: Color(0xFF0284C7)),
                      SizedBox(width: 6),
                      Text('Ausgewählt',
                          style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF0284C7),
                              fontWeight: FontWeight.w600)),
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
          Text(value,
              style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Color _fuelColor(String? grade) {
    switch (grade?.toUpperCase()) {
      case 'A':
        return Colors.green.shade700;
      case 'B':
        return Colors.green;
      case 'C':
        return Colors.lightGreen;
      case 'D':
        return Colors.amber;
      case 'E':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Color _wetGripColor(String? grade) {
    switch (grade?.toUpperCase()) {
      case 'A':
        return Colors.blue.shade700;
      case 'B':
        return Colors.blue;
      case 'C':
        return Colors.lightBlue;
      case 'D':
        return Colors.amber;
      case 'E':
        return Colors.orange;
      default:
        return Colors.grey;
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
  final double? searchTotalPrice;
  final Map<String, dynamic>? wheelChangeBreakdown;
  final double? mountingOnlySurchargeApplied;
  final double? disposalFeeApplied;
  final double? runFlatSurchargeApplied;
  final bool includeTires;
  final String? selectedPackage;

  const _PriceBreakdownSection({
    required this.pricing,
    required this.serviceType,
    required this.withBalancing,
    required this.withStorage,
    required this.withWashing,
    this.searchBasePrice,
    this.searchTotalPrice,
    this.wheelChangeBreakdown,
    this.mountingOnlySurchargeApplied,
    this.disposalFeeApplied,
    this.runFlatSurchargeApplied,
    this.includeTires = true,
    this.selectedPackage,
  });

  static Map<String, String> _getPackageLabels(BuildContext context) => {
    'foreign_object': S.of(context)!.pkgForeignObject,
    'valve_damage': S.of(context)!.pkgValveDamage,
    'measurement_both': S.of(context)!.pkgMeasureBoth,
    'measurement_front': S.of(context)!.pkgMeasureFront,
    'measurement_rear': S.of(context)!.pkgMeasureRear,
    'adjustment_both': S.of(context)!.pkgAdjustBoth,
    'adjustment_front': S.of(context)!.pkgAdjustFront,
    'adjustment_rear': S.of(context)!.pkgAdjustRear,
    'full_service': S.of(context)!.pkgFullService,
    'check': S.of(context)!.pkgClimateCheck,
    'basic': S.of(context)!.pkgBasicService,
    'comfort': S.of(context)!.pkgComfortService,
    'premium': S.of(context)!.pkgPremiumService,
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
    final packageLabels = _getPackageLabels(context);
    final pkgLabel = effectivePkg != null ? packageLabels[effectivePkg] : null;

    switch (serviceType) {
      case 'WHEEL_CHANGE':
        // Use wheelChangeBreakdown if available (searchBasePrice includes add-ons)
        if (wheelChangeBreakdown != null && searchBasePrice != null) {
          final wcbBase =
              (wheelChangeBreakdown!['basePrice'] as num?)?.toDouble();
          final balSurcharge =
              (wheelChangeBreakdown!['balancingSurcharge'] as num?)?.toDouble();
          final stoSurcharge =
              (wheelChangeBreakdown!['storageSurcharge'] as num?)?.toDouble();
          final washSurcharge =
              (wheelChangeBreakdown!['washingSurcharge'] as num?)?.toDouble();
          if (wcbBase != null) {
            total += wcbBase;
            rows.add(_PriceRow(S.of(context)!.wheelChange, wcbBase));
          }
          if (withBalancing && balSurcharge != null && balSurcharge > 0) {
            total += balSurcharge;
            rows.add(_PriceRow(S.of(context)!.balancing, balSurcharge));
          }
          if (withStorage && stoSurcharge != null && stoSurcharge > 0) {
            total += stoSurcharge;
            rows.add(_PriceRow(S.of(context)!.storage, stoSurcharge));
          }
          if (withWashing && washSurcharge != null && washSurcharge > 0) {
            total += washSurcharge;
            rows.add(_PriceRow(S.of(context)!.washing, washSurcharge));
          }
          return _InfoCard(
            icon: Icons.euro,
            title: S.of(context)!.priceOverview,
            child: Column(
              children: [
                ...rows,
                if (rows.length > 1) ...[
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(S.of(context)!.total,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
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
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.basePrice4 ??
            pricing?.tireChangePricePKW;
        serviceName = S.of(context)!.wheelChange;
        break;
      case 'TIRE_CHANGE':
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.basePrice4 ??
            pricing?.tireChangePricePKW;
        serviceName = S.of(context)!.montageLabel;
        break;
      case 'TIRE_REPAIR':
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.tireChangePricePKW;
        serviceName = pkgLabel ?? S.of(context)!.tireRepair;
        break;
      case 'ALIGNMENT_BOTH':
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.tireChangePricePKW;
        serviceName = pkgLabel ?? S.of(context)!.axleAlignment;
        break;
      case 'CLIMATE_SERVICE':
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.tireChangePricePKW;
        serviceName = pkgLabel ?? S.of(context)!.climateService;
        break;
      case 'MOTORCYCLE_TIRE':
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.tireChangePriceMotorcycle ??
            pricing?.tireChangePricePKW;
        serviceName = S.of(context)!.motorcycleTireChange;
        break;
      default:
        basePrice = searchBasePrice ??
            pricing?.basePrice ??
            pricing?.tireChangePricePKW;
        serviceName = S.of(context)!.tireChange;
    }

    if (basePrice != null) {
      // For "Nur Montage", combine base price + mounting surcharge into one "Montage" line
      double displayPrice = basePrice;
      if (!includeTires &&
          (serviceType == 'TIRE_CHANGE' || serviceType == 'MOTORCYCLE_TIRE')) {
        if (mountingOnlySurchargeApplied != null &&
            mountingOnlySurchargeApplied! > 0) {
          displayPrice += mountingOnlySurchargeApplied!;
        }
      }
      total += displayPrice;
      rows.add(_PriceRow(serviceName, displayPrice));
    }

    // Nur Montage additional fees (disposal, runflat)
    if (!includeTires &&
        (serviceType == 'TIRE_CHANGE' || serviceType == 'MOTORCYCLE_TIRE')) {
      if (disposalFeeApplied != null && disposalFeeApplied! > 0) {
        total += disposalFeeApplied!;
        rows.add(_PriceRow(S.of(context)!.disposal, disposalFeeApplied!));
      }
      if (runFlatSurchargeApplied != null && runFlatSurchargeApplied! > 0) {
        total += runFlatSurchargeApplied!;
        rows.add(_PriceRow(S.of(context)!.runflatSurcharge, runFlatSurchargeApplied!));
      }
    }

    // Auswuchten ×4
    if (withBalancing && pricing?.balancingPrice != null) {
      final balancingTotal = pricing!.balancingPrice! * 4;
      total += balancingTotal;
      rows.add(_PriceRow(S.of(context)!.balancingX4, balancingTotal));
    }

    // Einlagerung
    if (withStorage && pricing?.storagePrice != null) {
      total += pricing!.storagePrice!;
      rows.add(_PriceRow(S.of(context)!.storage, pricing!.storagePrice!));
    }

    // Waschen
    if (withWashing && pricing?.washingPrice != null) {
      total += pricing!.washingPrice!;
      rows.add(_PriceRow(S.of(context)!.washing, pricing!.washingPrice!));
    }

    return _InfoCard(
      icon: Icons.euro,
      title: S.of(context)!.priceOverview,
      child: Column(
        children: [
          ...rows,
          if (rows.length > 1) ...[
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(S.of(context)!.total,
                    style: const
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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

class _CollapsibleInfoCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final Widget child;
  const _CollapsibleInfoCard(
      {required this.icon, required this.title, required this.child});

  @override
  State<_CollapsibleInfoCard> createState() => _CollapsibleInfoCardState();
}

class _CollapsibleInfoCardState extends State<_CollapsibleInfoCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(widget.icon, size: 20, color: B24Colors.primaryBlue),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(widget.title,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                ),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.keyboard_arrow_down,
                      size: 22,
                      color:
                          isDark ? const Color(0xFF94A3B8) : Colors.grey[500]),
                ),
              ],
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.only(left: 32, top: 8),
                child: widget.child,
              ),
              crossFadeState: _expanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  final bool compact;
  const _InfoCard(
      {required this.icon,
      required this.title,
      required this.child,
      this.compact = false});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: compact
          ? const EdgeInsets.only(left: 14, right: 14, top: 14, bottom: 8)
          : const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
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
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                SizedBox(height: compact ? 2 : 4),
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
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.amber.shade300),
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
        side: BorderSide(
            color: Theme.of(context).brightness == Brightness.dark
                ? const Color(0xFF334155)
                : Colors.grey.shade200),
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
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 13)),
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
