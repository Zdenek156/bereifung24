import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/services/location_service.dart';
import '../../../../data/models/models.dart';
import '../../../vehicles/presentation/screens/vehicles_screen.dart';

// ── Providers ──

/// Selected vehicle for price display
final selectedVehicleProvider = StateProvider<Vehicle?>((ref) => null);

final workshopSearchProvider =
    StateNotifierProvider<WorkshopSearchNotifier, WorkshopSearchState>(
        (ref) => WorkshopSearchNotifier());

class WorkshopSearchState {
  final List<Workshop> workshops;
  final bool isLoading;
  final String? error;
  final String query;
  final int radius;
  final String sortBy; // 'distance', 'price', 'rating'
  final bool highRatedOnly;
  // Service options
  final bool withBalancing;
  final bool withStorage;
  final bool withWashing;
  // Tire change specific
  final bool includeTires; // true = Mit Reifen, false = Nur Montage
  final String tireSeason; // 's', 'w', 'g'
  final int tireCount; // 2 or 4
  final bool withDisposal;
  final bool withRunFlat;
  final bool withThreePMSF;
  final String?
      missingTireSeason; // set when season tires not stored on vehicle
  // Service-specific package selection
  final String?
      selectedPackage; // e.g. 'measurement_both', 'foreign_object', 'basic'
  // Axle selection for Mischbereifung with 2 tires
  final String? selectedAxle; // 'front', 'rear', or null (= all/4 tires)
  final bool
      needsAxleSelection; // true when Mischbereifung+2 Reifen but no axle chosen

  // Services that use the POST API with packageTypes
  static const postApiServices = {
    'TIRE_CHANGE',
    'WHEEL_CHANGE',
    'ALIGNMENT_BOTH',
    'TIRE_REPAIR',
    'MOTORCYCLE_TIRE',
    'CLIMATE_SERVICE'
  };

  const WorkshopSearchState({
    this.workshops = const [],
    this.isLoading = false,
    this.error,
    this.query = '',
    this.radius = 50,
    this.sortBy = 'distance',
    this.highRatedOnly = false,
    this.withBalancing = false,
    this.withStorage = false,
    this.withWashing = false,
    this.includeTires = true,
    this.tireSeason = 's',
    this.tireCount = 4,
    this.withDisposal = true,
    this.withRunFlat = false,
    this.withThreePMSF = false,
    this.missingTireSeason,
    this.selectedPackage,
    this.selectedAxle,
    this.needsAxleSelection = false,
  });

  WorkshopSearchState copyWith({
    List<Workshop>? workshops,
    bool? isLoading,
    String? error,
    String? query,
    int? radius,
    String? sortBy,
    bool? highRatedOnly,
    bool? withBalancing,
    bool? withStorage,
    bool? withWashing,
    bool? includeTires,
    String? tireSeason,
    int? tireCount,
    bool? withDisposal,
    bool? withRunFlat,
    bool? withThreePMSF,
    String? missingTireSeason,
    bool clearMissingTireSeason = false,
    String? selectedPackage,
    bool clearSelectedPackage = false,
    String? selectedAxle,
    bool clearSelectedAxle = false,
    bool? needsAxleSelection,
  }) =>
      WorkshopSearchState(
        workshops: workshops ?? this.workshops,
        isLoading: isLoading ?? this.isLoading,
        error: error,
        query: query ?? this.query,
        radius: radius ?? this.radius,
        sortBy: sortBy ?? this.sortBy,
        highRatedOnly: highRatedOnly ?? this.highRatedOnly,
        withBalancing: withBalancing ?? this.withBalancing,
        withStorage: withStorage ?? this.withStorage,
        withWashing: withWashing ?? this.withWashing,
        includeTires: includeTires ?? this.includeTires,
        tireSeason: tireSeason ?? this.tireSeason,
        tireCount: tireCount ?? this.tireCount,
        withDisposal: withDisposal ?? this.withDisposal,
        withRunFlat: withRunFlat ?? this.withRunFlat,
        withThreePMSF: withThreePMSF ?? this.withThreePMSF,
        missingTireSeason: clearMissingTireSeason
            ? null
            : (missingTireSeason ?? this.missingTireSeason),
        selectedPackage: clearSelectedPackage
            ? null
            : (selectedPackage ?? this.selectedPackage),
        selectedAxle:
            clearSelectedAxle ? null : (selectedAxle ?? this.selectedAxle),
        needsAxleSelection: needsAxleSelection ?? this.needsAxleSelection,
      );
}

class WorkshopSearchNotifier extends StateNotifier<WorkshopSearchState> {
  final _api = ApiClient();

  // Store last search params for re-search on filter change
  String? _lastZip;
  String? _lastCity;
  double? _lastLat;
  double? _lastLng;
  String? _lastServiceType;
  Vehicle? _lastVehicle;

  WorkshopSearchNotifier() : super(const WorkshopSearchState());

  void reset() {
    _lastZip = null;
    _lastCity = null;
    _lastLat = null;
    _lastLng = null;
    _lastServiceType = null;
    _lastVehicle = null;
    _tireDimOverride = null;
    state = const WorkshopSearchState();
  }

  void setRadius(int radius) {
    state = state.copyWith(radius: radius);
    _reSearch();
  }

  void setSortBy(String sortBy) {
    state = state.copyWith(sortBy: sortBy);
    _applySorting();
  }

  void toggleHighRated() {
    state = state.copyWith(highRatedOnly: !state.highRatedOnly);
    _applySorting();
  }

  void toggleBalancing() {
    state = state.copyWith(withBalancing: !state.withBalancing);
    _reSearch();
  }

  void toggleStorage() {
    state = state.copyWith(withStorage: !state.withStorage);
    _reSearch();
  }

  void toggleWashing() {
    state = state.copyWith(withWashing: !state.withWashing);
    _reSearch();
  }

  // Tire change specific setters
  void setIncludeTires(bool value) {
    state = state.copyWith(includeTires: value);
    _reSearch();
  }

  void setTireSeason(String season) {
    state = state.copyWith(tireSeason: season);
    _reSearch();
  }

  void setTireCount(int count) {
    state = state.copyWith(tireCount: count, clearSelectedAxle: count != 2);
    _reSearch();
  }

  void toggleDisposal() {
    state = state.copyWith(withDisposal: !state.withDisposal);
    _reSearch();
  }

  void setSelectedAxle(String? axle) {
    state = state.copyWith(
        selectedAxle: axle,
        clearSelectedAxle: axle == null,
        needsAxleSelection: false);
    _reSearch();
  }

  void toggleRunFlat() {
    state = state.copyWith(withRunFlat: !state.withRunFlat);
    _reSearch();
  }

  void toggleThreePMSF() {
    state = state.copyWith(withThreePMSF: !state.withThreePMSF);
    _reSearch();
  }

  void setSelectedPackage(String? pkg) {
    state =
        state.copyWith(selectedPackage: pkg, clearSelectedPackage: pkg == null);
    _reSearch();
  }

  void _applySorting() {
    if (state.workshops.isEmpty) return;
    final sorted = List<Workshop>.from(state.workshops);
    final isTireChange =
        _lastServiceType == 'TIRE_CHANGE' && state.includeTires;
    switch (state.sortBy) {
      case 'price':
        sorted.sort((a, b) {
          final ap = isTireChange
              ? (a.searchTotalPrice ?? double.infinity)
              : (a.pricing?.lowestPrice ?? double.infinity);
          final bp = isTireChange
              ? (b.searchTotalPrice ?? double.infinity)
              : (b.pricing?.lowestPrice ?? double.infinity);
          return ap.compareTo(bp);
        });
      case 'rating':
        sorted.sort((a, b) {
          final ar = b.averageRating ?? 0.0;
          final br = a.averageRating ?? 0.0;
          return ar.compareTo(br);
        });
      default:
        sorted.sort((a, b) {
          final ad = a.distance ?? double.infinity;
          final bd = b.distance ?? double.infinity;
          return ad.compareTo(bd);
        });
    }
    state = state.copyWith(workshops: sorted);
  }

  void _reSearch() {
    if (_lastZip != null || _lastCity != null || _lastLat != null) {
      search(
        zipCode: _lastZip,
        city: _lastCity,
        lat: _lastLat,
        lng: _lastLng,
        serviceType: _lastServiceType,
        vehicle: _lastVehicle,
      );
    }
  }

  Map<String, String>? _tireDimOverride;

  Future<void> search(
      {String? zipCode,
      String? city,
      double? lat,
      double? lng,
      String? serviceType,
      Vehicle? vehicle,
      Map<String, String>? tireDimensionOverride}) async {
    _lastZip = zipCode;
    _lastCity = city;
    _lastLat = lat;
    _lastLng = lng;
    _lastServiceType = serviceType;
    if (vehicle != null) _lastVehicle = vehicle;
    if (tireDimensionOverride != null) _tireDimOverride = tireDimensionOverride;

    state = state.copyWith(
      isLoading: true,
      error: null,
      query: zipCode ?? city ?? state.query,
    );

    try {
      // Auto-switch to MOTORCYCLE_TIRE when vehicle is a motorcycle
      // BUT skip when explicit tire dimensions are given (e.g. from AI advisor recommending car tires)
      var effectiveServiceType = serviceType;
      if (serviceType == 'TIRE_CHANGE' &&
          _lastVehicle?.vehicleType == 'MOTORCYCLE' &&
          _tireDimOverride == null) {
        effectiveServiceType = 'MOTORCYCLE_TIRE';
      }

      // Block: motorcycle vehicle with non-motorcycle service (skip when AI override present)
      if (_lastVehicle?.vehicleType == 'MOTORCYCLE' &&
          effectiveServiceType != 'MOTORCYCLE_TIRE' &&
          _tireDimOverride == null) {
        state = state.copyWith(
          isLoading: false,
          workshops: [],
          error:
              'Dieser Service ist nur für PKW/Anhänger verfügbar. Bitte wähle "Motorrad-Reifen" als Service.',
        );
        return;
      }

      // Block: non-motorcycle vehicle with MOTORCYCLE_TIRE service
      if (effectiveServiceType == 'MOTORCYCLE_TIRE' &&
          _lastVehicle != null &&
          _lastVehicle!.vehicleType != 'MOTORCYCLE') {
        state = state.copyWith(
          isLoading: false,
          workshops: [],
          error:
              'Bitte wähle ein Motorrad als Fahrzeug, um Motorrad-Reifen zu suchen.',
        );
        return;
      }

      // Use POST search for TIRE_CHANGE with tire purchase
      if (effectiveServiceType == 'TIRE_CHANGE' && state.includeTires) {
        await _searchWithTires(
            zipCode: zipCode, city: city, lat: lat, lng: lng);
      } else if (WorkshopSearchState.postApiServices
          .contains(effectiveServiceType)) {
        // Use POST search for services that need package-based pricing
        await _searchWithPackages(
            zipCode: zipCode,
            city: city,
            lat: lat,
            lng: lng,
            serviceType: effectiveServiceType!);
      } else {
        await _searchRegular(
            zipCode: zipCode,
            city: city,
            lat: lat,
            lng: lng,
            serviceType: effectiveServiceType);
      }
    } catch (e, stack) {
      debugPrint('🔴 Search error: $e');
      debugPrint('🔴 Stack: $stack');
      final msg = e.toString();
      state = state.copyWith(
        isLoading: false,
        error: msg.contains('400')
            ? 'Standort konnte nicht ermittelt werden. Bitte gib eine PLZ ein.'
            : 'Suche fehlgeschlagen. Bitte versuche es erneut.',
      );
    }
  }

  /// Default package for each service type
  static String _defaultPackage(String serviceType) {
    switch (serviceType) {
      case 'ALIGNMENT_BOTH':
        return 'measurement_both';
      case 'TIRE_REPAIR':
        return 'foreign_object';
      case 'CLIMATE_SERVICE':
        return 'basic';
      case 'MOTORCYCLE_TIRE':
        return 'both';
      case 'WHEEL_CHANGE':
        return 'basic';
      case 'TIRE_CHANGE':
        return 'four_tires';
      default:
        return '';
    }
  }

  Future<void> _searchWithPackages(
      {String? zipCode,
      String? city,
      double? lat,
      double? lng,
      required String serviceType}) async {
    final pkg = state.selectedPackage ?? _defaultPackage(serviceType);
    final packageTypes = <String>[pkg];

    // Add extra options for specific services
    if (serviceType == 'MOTORCYCLE_TIRE') {
      // Ensure tire count is included (front/rear/both)
      if (!packageTypes.contains('front') &&
          !packageTypes.contains('rear') &&
          !packageTypes.contains('both')) {
        packageTypes.add('both');
      }
      // Add service art
      packageTypes.add(state.includeTires
          ? 'motorcycle_with_tire_purchase'
          : 'motorcycle_tire_installation_only');
      if (state.withDisposal) packageTypes.add('with_disposal');
    }
    if (serviceType == 'TIRE_CHANGE' && !state.includeTires) {
      // Nur Montage — send tire count + disposal/runflat
      packageTypes.clear();
      if (state.tireCount == 4) {
        packageTypes.add('four_tires');
      } else {
        packageTypes.add('two_tires');
      }
      if (state.withDisposal) packageTypes.add('with_disposal');
      if (state.withRunFlat) packageTypes.add('runflat');
    }
    if (serviceType == 'WHEEL_CHANGE') {
      packageTypes.clear();
      packageTypes.add('basic');
      if (state.withBalancing) packageTypes.add('with_balancing');
      if (state.withStorage) packageTypes.add('with_storage');
      if (state.withWashing) packageTypes.add('with_washing');
    }

    final body = <String, dynamic>{
      'serviceType': serviceType,
      'radiusKm': state.radius,
      'packageTypes': packageTypes,
    };

    if (zipCode != null && zipCode.isNotEmpty) body['zipCode'] = zipCode;
    if (city != null && city.isNotEmpty) body['city'] = city;
    if (lat != null) body['customerLat'] = lat;
    if (lng != null) body['customerLon'] = lng;

    // Motorcycle with tire purchase → use dedicated motorcycle API
    if (serviceType == 'MOTORCYCLE_TIRE') {
      body['includeTires'] = state.includeTires;

      // Add tire dimensions from vehicle if available
      if (_lastVehicle != null) {
        final tireSpec = _lastVehicle!.summerTires ??
            _lastVehicle!.winterTires ??
            _lastVehicle!.allSeasonTires;
        if (tireSpec != null && tireSpec.width != null) {
          body['tireDimensionsFront'] = {
            'width': tireSpec.width.toString(),
            'height': tireSpec.aspectRatio?.toString() ?? '',
            'diameter': tireSpec.diameter?.toString() ?? '',
          };
          // Rear dimensions (different sizes or same)
          if (tireSpec.hasDifferentSizes && tireSpec.rearWidth != null) {
            body['tireDimensionsRear'] = {
              'width': tireSpec.rearWidth.toString(),
              'height': tireSpec.rearAspectRatio?.toString() ?? '',
              'diameter': tireSpec.rearDiameter?.toString() ?? '',
            };
          } else {
            body['tireDimensionsRear'] = body['tireDimensionsFront'];
          }
        }
      }

      debugPrint('🏍️ Motorcycle search body: $body');
      final response = await _api.searchMotorcycleTires(body);
      debugPrint('✅ Motorcycle search response: ${response.statusCode}');
      final data = response.data;
      final list = (data is List ? data : data['workshops'] ?? []) as List;
      debugPrint('📦 Found ${list.length} workshops for motorcycle');
      _applyResults(list);
      return;
    }

    debugPrint('🔍 Package search body: $body');
    final response = await _api.searchWorkshopsWithTires(body);
    debugPrint('✅ Package search response: ${response.statusCode}');
    final data = response.data;
    final list = (data is List ? data : data['workshops'] ?? []) as List;
    debugPrint('📦 Found ${list.length} workshops for $serviceType');
    _applyResults(list);
  }

  Future<void> _searchRegular(
      {String? zipCode,
      String? city,
      double? lat,
      double? lng,
      String? serviceType}) async {
    final params = <String, dynamic>{};
    if (zipCode != null && zipCode.isNotEmpty) params['zipCode'] = zipCode;
    if (city != null && city.isNotEmpty) params['city'] = city;
    if (lat != null) params['latitude'] = lat;
    if (lng != null) params['longitude'] = lng;
    if (serviceType != null && serviceType.isNotEmpty)
      params['serviceType'] = serviceType;
    params['radius'] = state.radius;
    if (state.withBalancing) params['withBalancing'] = true;
    if (state.withStorage) params['withStorage'] = true;
    if (state.withWashing) params['withWashing'] = true;

    final response = await _api.searchWorkshops(params);
    final data = response.data;
    final list = (data is List ? data : data['workshops'] ?? []) as List;
    _applyResults(list);
  }

  Future<void> _searchWithTires(
      {String? zipCode, String? city, double? lat, double? lng}) async {
    // If we have an explicit tire dimension override (e.g. from AI advisor), use it directly
    if (_tireDimOverride != null) {
      // Set season from override
      final overrideSeason = _tireDimOverride!['season'] ?? 's';
      if (state.tireSeason != overrideSeason) {
        state = state.copyWith(tireSeason: overrideSeason);
      }
      if (state.missingTireSeason != null) {
        state = state.copyWith(clearMissingTireSeason: true);
      }
      await _searchWithExplicitDimensions(
          zipCode: zipCode,
          city: city,
          lat: lat,
          lng: lng,
          dims: _tireDimOverride!);
      return;
    }

    // Build tire dimensions from vehicle — only use the exact season, NO fallback
    TireSpec? tireSpec;
    if (_lastVehicle != null) {
      switch (state.tireSeason) {
        case 'w':
          tireSpec = _lastVehicle!.winterTires;
        case 'g':
          tireSpec = _lastVehicle!.allSeasonTires;
        default:
          tireSpec = _lastVehicle!.summerTires;
      }
    }

    // If no tire spec for this season, try to auto-switch to available season
    if (_lastVehicle != null && tireSpec == null) {
      // Try other seasons automatically
      if (_lastVehicle!.winterTires != null &&
          !_lastVehicle!.winterTires!.isEmpty) {
        tireSpec = _lastVehicle!.winterTires;
        state = state.copyWith(tireSeason: 'w');
      } else if (_lastVehicle!.summerTires != null &&
          !_lastVehicle!.summerTires!.isEmpty) {
        tireSpec = _lastVehicle!.summerTires;
        state = state.copyWith(tireSeason: 's');
      } else if (_lastVehicle!.allSeasonTires != null &&
          !_lastVehicle!.allSeasonTires!.isEmpty) {
        tireSpec = _lastVehicle!.allSeasonTires;
        state = state.copyWith(tireSeason: 'g');
      }
      // If still no spec, show hint
      if (tireSpec == null) {
        final seasonLabel = state.tireSeason == 'w'
            ? 'w'
            : (state.tireSeason == 'g' ? 'g' : 's');
        state = state.copyWith(
            workshops: [], isLoading: false, missingTireSeason: seasonLabel);
        return;
      }
    }
    // Clear missing tire season when we have a valid spec
    if (state.missingTireSeason != null) {
      state = state.copyWith(clearMissingTireSeason: true);
    }

    // Build package types — handle Mischbereifung
    final packageTypes = <String>[];
    final hasMixed = tireSpec != null &&
        tireSpec.hasDifferentSizes &&
        tireSpec.rearWidth != null;
    if (hasMixed) {
      if (state.tireCount == 4) {
        packageTypes.add('mixed_four_tires');
      } else if (state.selectedAxle == 'rear') {
        packageTypes.add('rear_two_tires');
      } else if (state.selectedAxle == 'front') {
        packageTypes.add('front_two_tires');
      } else {
        // 2 Reifen + Mischbereifung but no axle selected — wait for selection
        state = state.copyWith(
            workshops: [], isLoading: false, needsAxleSelection: true);
        return;
      }
    } else {
      if (state.tireCount == 4) {
        packageTypes.add('four_tires');
      } else {
        packageTypes.add('two_tires');
      }
    }
    if (state.withDisposal) packageTypes.add('with_disposal');
    if (state.withRunFlat) packageTypes.add('runflat');
    if (state.withThreePMSF) packageTypes.add('three_pmsf');

    final body = <String, dynamic>{
      'serviceType': 'TIRE_CHANGE',
      'radiusKm': state.radius,
      'includeTires': true,
      'packageTypes': packageTypes,
      'tireFilters': {
        'seasons': [state.tireSeason],
      },
    };

    if (zipCode != null && zipCode.isNotEmpty) body['zipCode'] = zipCode;
    if (city != null && city.isNotEmpty) body['city'] = city;
    if (lat != null) body['customerLat'] = lat;
    if (lng != null) body['customerLon'] = lng;

    if (tireSpec != null && tireSpec.width != null) {
      if (hasMixed) {
        // Send both front and rear dimensions for Mischbereifung
        body['tireDimensionsFront'] = {
          'width': tireSpec.width.toString(),
          'height': tireSpec.aspectRatio?.toString() ?? '',
          'diameter': tireSpec.diameter?.toString() ?? '',
          if (tireSpec.loadIndex != null)
            'loadIndex': tireSpec.loadIndex.toString(),
          if (tireSpec.speedRating != null) 'speedIndex': tireSpec.speedRating,
        };
        body['tireDimensionsRear'] = {
          'width': tireSpec.rearWidth.toString(),
          'height': tireSpec.rearAspectRatio?.toString() ?? '',
          'diameter': tireSpec.rearDiameter?.toString() ?? '',
          if (tireSpec.rearLoadIndex != null)
            'loadIndex': tireSpec.rearLoadIndex.toString(),
          if (tireSpec.rearSpeedRating != null)
            'speedIndex': tireSpec.rearSpeedRating,
        };
        // Also set tireDimensions for API compatibility
        if (state.tireCount == 2 && state.selectedAxle == 'rear') {
          body['tireDimensions'] = body['tireDimensionsRear'];
        } else {
          body['tireDimensions'] = body['tireDimensionsFront'];
        }
      } else {
        body['tireDimensions'] = {
          'width': tireSpec.width.toString(),
          'height': tireSpec.aspectRatio?.toString() ?? '',
          'diameter': tireSpec.diameter?.toString() ?? '',
          if (tireSpec.loadIndex != null)
            'loadIndex': tireSpec.loadIndex.toString(),
          if (tireSpec.speedRating != null) 'speedIndex': tireSpec.speedRating,
        };
      }
    }

    debugPrint('🔍 Tire search body: $body');
    final response = await _api.searchWorkshopsWithTires(body);
    debugPrint('✅ Tire search response status: ${response.statusCode}');
    final data = response.data;
    final list = (data is List ? data : data['workshops'] ?? []) as List;
    debugPrint('📦 Found ${list.length} workshops with tires');
    _applyResults(list);
  }

  Future<void> _searchWithExplicitDimensions(
      {String? zipCode,
      String? city,
      double? lat,
      double? lng,
      required Map<String, String> dims}) async {
    final packageTypes = <String>[];
    if (state.tireCount == 4) {
      packageTypes.add('four_tires');
    } else {
      packageTypes.add('two_tires');
    }
    if (state.withDisposal) packageTypes.add('with_disposal');
    if (state.withRunFlat) packageTypes.add('runflat');
    if (state.withThreePMSF) packageTypes.add('three_pmsf');

    // Normalize season: Sommer→s, Winter→w, Ganzjahr→g
    var season = dims['season'] ?? 's';
    if (season.toLowerCase().startsWith('s') && season.length > 1) season = 's';
    if (season.toLowerCase().startsWith('w') && season.length > 1) season = 'w';
    if (season.toLowerCase().startsWith('g') && season.length > 1) season = 'g';
    final body = <String, dynamic>{
      'serviceType': 'TIRE_CHANGE',
      'radiusKm': state.radius,
      'includeTires': true,
      'packageTypes': packageTypes,
      'tireFilters': {
        'seasons': [season],
      },
      'tireDimensions': {
        'width': dims['width'] ?? '',
        'height': dims['height'] ?? '',
        'diameter': dims['diameter'] ?? '',
        if (dims['loadIndex'] != null &&
            dims['loadIndex']!.isNotEmpty &&
            dims['loadIndex'] != '-')
          'loadIndex': dims['loadIndex'],
        if (dims['speedIndex'] != null &&
            dims['speedIndex']!.isNotEmpty &&
            dims['speedIndex'] != '-')
          'speedIndex': dims['speedIndex'],
        if (dims['articleId'] != null && dims['articleId']!.isNotEmpty)
          'articleId': dims['articleId'],
        if (dims['tireBrand'] != null && dims['tireBrand']!.isNotEmpty)
          'tireBrand': dims['tireBrand'],
        if (dims['tireModel'] != null && dims['tireModel']!.isNotEmpty)
          'tireModel': dims['tireModel'],
      },
    };

    if (zipCode != null && zipCode.isNotEmpty) body['zipCode'] = zipCode;
    if (city != null && city.isNotEmpty) body['city'] = city;
    if (lat != null) body['customerLat'] = lat;
    if (lng != null) body['customerLon'] = lng;

    debugPrint('🔍 AI override tire search body: $body');
    final response = await _api.searchWorkshopsWithTires(body);
    debugPrint('✅ AI override search response: ${response.statusCode}');
    final data = response.data;
    final list = (data is List ? data : data['workshops'] ?? []) as List;
    debugPrint('📦 Found ${list.length} workshops (AI tire override)');
    _applyResults(list);
  }

  void _applyResults(List list) {
    var workshops =
        list.map((e) => Workshop.fromJson(e as Map<String, dynamic>)).toList();

    if (state.highRatedOnly) {
      workshops =
          workshops.where((w) => (w.averageRating ?? 0) >= 4.0).toList();
    }

    state = state.copyWith(
      workshops: workshops,
      isLoading: false,
    );
    _applySorting();
  }
}

// ── Screen ──

class SearchScreen extends ConsumerStatefulWidget {
  final String? serviceType;
  final Map<String, String>? tireDimensionOverride;
  const SearchScreen({super.key, this.serviceType, this.tireDimensionOverride});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchCtrl = TextEditingController();

  static const _serviceLabels = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsendienst',
    'BATTERY_SERVICE': 'Batterieservice',
  };

  @override
  void initState() {
    super.initState();
    // Clear stale results from a previous service when entering a new search screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(workshopSearchProvider.notifier).reset();
    });
  }

  @override
  void didUpdateWidget(SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.serviceType != oldWidget.serviceType) {
      // Clear old results immediately when switching service type
      ref.read(workshopSearchProvider.notifier).reset();
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _doSearch() {
    final q = _searchCtrl.text.trim();
    if (q.isEmpty) return;

    AnalyticsService().logSearch(q);
    final isZip = RegExp(r'^\d{5}$').hasMatch(q);
    final vehicle = ref.read(selectedVehicleProvider);
    ref.read(workshopSearchProvider.notifier).search(
          zipCode: isZip ? q : null,
          city: !isZip ? q : null,
          serviceType: widget.serviceType,
          vehicle: vehicle,
          tireDimensionOverride: widget.tireDimensionOverride,
        );
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(workshopSearchProvider);
    final serviceName = _serviceLabels[widget.serviceType];

    return Scaffold(
      body: SafeArea(
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (serviceName != null) ...[
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.arrow_back),
                            onPressed: () => context.go('/home'),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              serviceName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Werkstatt in deiner Nähe finden',
                        style: TextStyle(
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                    ? const Color(0xFF94A3B8)
                                    : Colors.grey[600],
                            fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                    ] else ...[
                      Text(
                        'Werkstatt suchen',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                    ],
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 44,
                            child: TextField(
                              controller: _searchCtrl,
                              decoration: InputDecoration(
                                hintText: 'PLZ oder Stadt...',
                                prefixIcon: const Icon(Icons.search, size: 20),
                                suffixIcon: IconButton(
                                  icon: const Icon(Icons.my_location, size: 20),
                                  tooltip: 'Standort verwenden',
                                  onPressed: _useLocation,
                                ),
                                contentPadding:
                                    const EdgeInsets.symmetric(vertical: 0),
                                isDense: true,
                              ),
                              style: const TextStyle(fontSize: 14),
                              textInputAction: TextInputAction.search,
                              onSubmitted: (_) => _doSearch(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          height: 44,
                          child: FilledButton(
                            onPressed: _doSearch,
                            style: FilledButton.styleFrom(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                            ),
                            child: const Text('Suchen'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Filters ──
            if (searchState.workshops.isNotEmpty ||
                searchState.query.isNotEmpty)
              SliverToBoxAdapter(
                  child: _FilterBar(serviceType: widget.serviceType)),
          ],
          body: searchState.isLoading
              ? const Center(child: CircularProgressIndicator())
              : searchState.error != null
                  ? _ErrorView(message: searchState.error!)
                  : searchState.workshops.isEmpty
                      ? (searchState.missingTireSeason != null
                          ? _MissingTireSeasonView(
                              season: searchState.missingTireSeason!,
                              vehicle: ref.read(selectedVehicleProvider),
                            )
                          : searchState.needsAxleSelection
                              ? _AxleSelectionHintView()
                              : _EmptyView(
                                  hasSearched: searchState.query.isNotEmpty))
                      : _WorkshopList(
                          workshops: searchState.workshops,
                          serviceType: widget.serviceType),
        ),
      ),
    );
  }

  void _useLocation() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Standort wird ermittelt...')),
    );

    try {
      final locService = LocationService();
      final position = await locService.getCurrentPosition();

      if (!mounted) return;

      if (position != null) {
        _searchCtrl.text = 'Mein Standort';
        final vehicle = ref.read(selectedVehicleProvider);
        ref.read(workshopSearchProvider.notifier).search(
              lat: position.latitude,
              lng: position.longitude,
              serviceType: widget.serviceType,
              vehicle: vehicle,
              tireDimensionOverride: widget.tireDimensionOverride,
            );
      } else {
        final errorMsg =
            locService.lastError ?? 'Standort konnte nicht ermittelt werden.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMsg),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Einstellungen',
              onPressed: () => LocationService().openAppSettings(),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Location error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Standortfehler: $e'),
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'Einstellungen',
            onPressed: () => LocationService().openAppSettings(),
          ),
        ),
      );
    }
  }
}

class _FilterBar extends ConsumerWidget {
  final String? serviceType;
  const _FilterBar({this.serviceType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(workshopSearchProvider);
    final notifier = ref.read(workshopSearchProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(
                color:
                    isDark ? const Color(0xFF334155) : Colors.grey.shade200)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Global filter chips ──
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                // Result count
                if (state.workshops.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Text(
                      state.workshops.length == 1
                          ? '1 Werkstatt'
                          : '${state.workshops.length} Werkstätten',
                      style: TextStyle(
                        color:
                            isDark ? const Color(0xFF94A3B8) : Colors.grey[600],
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                // Radius chip
                _buildChip(
                  context,
                  label: '${state.radius} km',
                  icon: Icons.radar,
                  onTap: () =>
                      _showRadiusPicker(context, notifier, state.radius),
                ),
                const SizedBox(width: 8),
                // Sort chip
                _buildChip(
                  context,
                  label: _sortLabel(state.sortBy),
                  icon: Icons.sort,
                  onTap: () => _showSortPicker(context, notifier, state.sortBy),
                ),
              ],
            ),
          ),
          // ── Service-specific options (for tire/wheel related services) ──
          if (serviceType == 'TIRE_CHANGE')
            TireChangeFilters(
                state: state,
                notifier: notifier,
                vehicle: ref.read(selectedVehicleProvider)),
          if (serviceType == 'WHEEL_CHANGE')
            WheelChangeFilters(state: state, notifier: notifier),
          // ── Service package filters for POST-API services ──
          if (serviceType == 'ALIGNMENT_BOTH')
            DropdownServiceFilter(
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
            ),
          if (serviceType == 'TIRE_REPAIR')
            ServiceToggleFilter(
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
            ),
          if (serviceType == 'CLIMATE_SERVICE')
            DropdownServiceFilter(
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
            ),
          if (serviceType == 'MOTORCYCLE_TIRE')
            MotorcycleTireFilters(state: state, notifier: notifier),
        ],
      ),
    );
  }

  String _sortLabel(String sortBy) {
    switch (sortBy) {
      case 'price':
        return 'Preis';
      case 'rating':
        return 'Bewertung';
      default:
        return 'Entfernung';
    }
  }

  Widget _buildChip(BuildContext context,
      {required String label,
      required IconData icon,
      required VoidCallback onTap}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 16,
                  color: isDark ? const Color(0xFF94A3B8) : Colors.grey[700]),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      color:
                          isDark ? const Color(0xFFF9FAFB) : Colors.grey[800])),
              const SizedBox(width: 2),
              Icon(Icons.keyboard_arrow_down,
                  size: 16,
                  color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
            ],
          ),
        ),
      ),
    );
  }

  void _showRadiusPicker(
      BuildContext context, WorkshopSearchNotifier notifier, int current) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Text('Umkreis',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            ),
            ...[5, 10, 25, 50, 100].map((r) => ListTile(
                  leading: Icon(Icons.radar,
                      color:
                          r == current ? const Color(0xFF0284C7) : Colors.grey),
                  title: Text('$r km'),
                  trailing: r == current
                      ? const Icon(Icons.check, color: Color(0xFF0284C7))
                      : null,
                  onTap: () {
                    Navigator.pop(ctx);
                    notifier.setRadius(r);
                  },
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showSortPicker(
      BuildContext context, WorkshopSearchNotifier notifier, String current) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Text('Sortieren nach',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            ),
            ...[
              ('distance', 'Entfernung', Icons.near_me),
              ('price', 'Preis', Icons.euro),
              ('rating', 'Bewertung', Icons.star_border),
            ].map((opt) => ListTile(
                  leading: Icon(opt.$3,
                      color: opt.$1 == current
                          ? const Color(0xFF0284C7)
                          : Colors.grey),
                  title: Text(opt.$2),
                  trailing: opt.$1 == current
                      ? const Icon(Icons.check, color: Color(0xFF0284C7))
                      : null,
                  onTap: () {
                    Navigator.pop(ctx);
                    notifier.setSortBy(opt.$1);
                  },
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Tire Change Filter Section ──

class TireChangeFilters extends StatelessWidget {
  final WorkshopSearchState state;
  final WorkshopSearchNotifier notifier;
  final Vehicle? vehicle;
  const TireChangeFilters(
      {required this.state, required this.notifier, this.vehicle});

  bool get _vehicleHasMixedTires {
    if (vehicle == null) return false;
    // Use the currently selected season's tire spec
    final TireSpec? ts;
    switch (state.tireSeason) {
      case 'w':
        ts = vehicle!.winterTires ??
            vehicle!.summerTires ??
            vehicle!.allSeasonTires;
      case 'g':
        ts = vehicle!.allSeasonTires ??
            vehicle!.summerTires ??
            vehicle!.winterTires;
      default:
        ts = vehicle!.summerTires ??
            vehicle!.winterTires ??
            vehicle!.allSeasonTires;
    }
    return ts != null && ts.hasDifferentSizes && ts.rearWidth != null;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          // Row 1: Mit Reifen / Nur Montage (equal width, centered)
          Row(
            children: [
              Expanded(
                  child: _serviceToggle(
                      context,
                      SvgPicture.asset('assets/images/tire_icon.svg',
                          width: 18, height: 18),
                      'Mit Reifen',
                      true)),
              const SizedBox(width: 8),
              Expanded(
                  child: _serviceToggle(
                      context,
                      const Text('🔧', style: TextStyle(fontSize: 14)),
                      'Nur Montage',
                      false)),
            ],
          ),
          // Row 2: Season selection (only when Mit Reifen)
          if (state.includeTires) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _seasonBadge(context, 's', '☀️', 'Sommer')),
                const SizedBox(width: 6),
                Expanded(child: _seasonBadge(context, 'w', '❄️', 'Winter')),
                const SizedBox(width: 6),
                Expanded(child: _ganzjahrBadge(context)),
              ],
            ),
            // Season mismatch warning
            if (vehicle != null) _buildSeasonWarning(context),
          ],
          const SizedBox(height: 8),
          // Row 3: Badges row
          if (state.includeTires)
            Row(
              children: [
                Expanded(
                    child: _optionBadge(context, '2 Reifen',
                        state.tireCount == 2, () => notifier.setTireCount(2))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, '4 Reifen',
                        state.tireCount == 4, () => notifier.setTireCount(4))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, 'Entsorgung',
                        state.withDisposal, () => notifier.toggleDisposal())),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, 'Runflat', state.withRunFlat,
                        () => notifier.toggleRunFlat())),
                if (state.tireSeason == 'w' || state.tireSeason == 'g') ...[
                  const SizedBox(width: 6),
                  Expanded(
                      child: _optionBadge(context, '3PMSF', state.withThreePMSF,
                          () => notifier.toggleThreePMSF())),
                ],
              ],
            )
          else
            Row(
              children: [
                Expanded(
                    child: _optionBadge(context, '2 Reifen',
                        state.tireCount == 2, () => notifier.setTireCount(2))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, '4 Reifen',
                        state.tireCount == 4, () => notifier.setTireCount(4))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, 'Entsorgung',
                        state.withDisposal, () => notifier.toggleDisposal())),
              ],
            ),
          // Axle selection for Mischbereifung with 2 tires
          if (state.tireCount == 2 && _vehicleHasMixedTires) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                    child: _optionBadge(
                        context,
                        'Vorderachse',
                        state.selectedAxle == 'front',
                        () => notifier.setSelectedAxle(
                            state.selectedAxle == 'front' ? null : 'front'))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(
                        context,
                        'Hinterachse',
                        state.selectedAxle == 'rear',
                        () => notifier.setSelectedAxle(
                            state.selectedAxle == 'rear' ? null : 'rear'))),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSeasonWarning(BuildContext context) {
    if (vehicle == null) return const SizedBox.shrink();
    String? warning;
    switch (state.tireSeason) {
      case 'w':
        if (vehicle!.winterTires == null) {
          warning =
              'Keine Winterreifengröße gespeichert. Bitte hinterlege die Größe in deinem Fahrzeugprofil.';
        }
      case 'g':
        if (vehicle!.allSeasonTires == null) {
          warning =
              'Keine Ganzjahresreifengröße gespeichert. Bitte hinterlege die Größe in deinem Fahrzeugprofil.';
        }
      case 's':
        if (vehicle!.summerTires == null) {
          warning =
              'Keine Sommerreifengröße gespeichert. Bitte hinterlege die Größe in deinem Fahrzeugprofil.';
        }
    }
    if (warning == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.orange.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, size: 14, color: Colors.orange[800]),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                warning,
                style: TextStyle(fontSize: 11, color: Colors.orange[900]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _serviceToggle(
      BuildContext context, Widget icon, String label, bool isIncludeTires) {
    final selected = state.includeTires == isIncludeTires;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => notifier.setIncludeTires(isIncludeTires),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? Colors.white
                      : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                )),
          ],
        ),
      ),
    );
  }

  Widget _seasonBadge(
      BuildContext context, String season, String emoji, String label) {
    final selected = state.tireSeason == season;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => notifier.setTireSeason(season),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? Colors.white
                      : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                )),
          ],
        ),
      ),
    );
  }

  Widget _ganzjahrBadge(BuildContext context) {
    final selected = state.tireSeason == 'g';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => notifier.setTireSeason('g'),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Half sun / half snowflake icon
            SizedBox(
              width: 16,
              height: 16,
              child: Stack(
                children: [
                  ClipRect(
                    clipper: _LeftHalfClipper(),
                    child: Text('☀️',
                        style: TextStyle(
                            fontSize: 13,
                            color: selected ? Colors.white : null)),
                  ),
                  ClipRect(
                    clipper: _RightHalfClipper(),
                    child: Text('❄️',
                        style: TextStyle(
                            fontSize: 13,
                            color: selected ? Colors.white : null)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            Text('Ganzjahr',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? Colors.white
                      : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                )),
          ],
        ),
      ),
    );
  }

  Widget _optionBadge(
      BuildContext context, String label, bool selected, VoidCallback onTap) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: selected
                  ? Colors.white
                  : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[700]),
            )),
      ),
    );
  }
}

// ── Dropdown Service Filter (Achsvermessung, Klimaservice) ──

class DropdownServiceFilter extends StatelessWidget {
  final WorkshopSearchState state;
  final WorkshopSearchNotifier notifier;
  final String title;
  final IconData icon;
  final String defaultPackage;
  final List<(String, String)> options; // (packageId, displayLabel)
  final Map<String, String> descriptions;

  const DropdownServiceFilter({
    required this.state,
    required this.notifier,
    required this.title,
    required this.icon,
    required this.defaultPackage,
    required this.options,
    required this.descriptions,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selected = state.selectedPackage ?? defaultPackage;
    final selectedLabel = options
        .firstWhere((o) => o.$1 == selected, orElse: () => options.first)
        .$2;
    final desc = descriptions[selected];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => _showPicker(context, selected),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF0284C7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: Colors.white),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      selectedLabel,
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white),
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down,
                      size: 20, color: Colors.white70),
                ],
              ),
            ),
          ),
          if (desc != null) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color:
                    isDark ? const Color(0xFF1E293B) : const Color(0xFFF0F7FF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFBFDBFE)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline,
                      size: 14,
                      color: isDark
                          ? const Color(0xFF94A3B8)
                          : const Color(0xFF0284C7)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      desc,
                      style: TextStyle(
                        fontSize: 11,
                        color:
                            isDark ? const Color(0xFF94A3B8) : Colors.grey[700],
                        height: 1.3,
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

  void _showPicker(BuildContext context, String currentSelected) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.85,
        expand: false,
        builder: (_, scrollController) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  children: [
                    Expanded(
                        child: Text(title,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 17))),
                    IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    ...options.map((opt) {
                      final isActive = currentSelected == opt.$1;
                      final optDesc = descriptions[opt.$1];
                      return ListTile(
                        leading: Icon(
                          isActive
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          color:
                              isActive ? const Color(0xFF0284C7) : Colors.grey,
                        ),
                        title: Text(opt.$2),
                        subtitle: optDesc != null
                            ? Text(optDesc,
                                style: const TextStyle(fontSize: 11),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis)
                            : null,
                        onTap: () {
                          Navigator.pop(ctx);
                          notifier.setSelectedPackage(opt.$1);
                        },
                      );
                    }),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Toggle Filter with Description (Reifenreparatur) ──

class ServiceToggleFilter extends StatelessWidget {
  final WorkshopSearchState state;
  final WorkshopSearchNotifier notifier;
  final String defaultPackage;
  final List<(String, String, String)> options; // (packageId, emoji, label)
  final Map<String, String> descriptions;

  const ServiceToggleFilter({
    required this.state,
    required this.notifier,
    required this.defaultPackage,
    required this.options,
    required this.descriptions,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selected = state.selectedPackage ?? defaultPackage;
    final desc = descriptions[selected];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          Row(
            children: [
              for (var i = 0; i < options.length; i++) ...[
                if (i > 0) const SizedBox(width: 6),
                Expanded(
                    child: _badge(context, isDark, options[i],
                        selected == options[i].$1)),
              ],
            ],
          ),
          if (desc != null) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color:
                    isDark ? const Color(0xFF1E293B) : const Color(0xFFF0F7FF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFBFDBFE)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline,
                      size: 14,
                      color: isDark
                          ? const Color(0xFF94A3B8)
                          : const Color(0xFF0284C7)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      desc,
                      style: TextStyle(
                        fontSize: 11,
                        color:
                            isDark ? const Color(0xFF94A3B8) : Colors.grey[700],
                        height: 1.3,
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

  Widget _badge(BuildContext context, bool isDark, (String, String, String) opt,
      bool isSelected) {
    return GestureDetector(
      onTap: () => notifier.setSelectedPackage(opt.$1),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(opt.$2, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 4),
            Text(opt.$3,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                )),
          ],
        ),
      ),
    );
  }
}

// ── Motorcycle Tire Filters (like _TireChangeFilters) ──

class MotorcycleTireFilters extends StatelessWidget {
  final WorkshopSearchState state;
  final WorkshopSearchNotifier notifier;

  const MotorcycleTireFilters({required this.state, required this.notifier});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          // Row 1: Mit Reifenkauf / Nur Montage
          Row(
            children: [
              Expanded(
                  child: _serviceToggle(
                      context,
                      SvgPicture.asset('assets/images/tire_icon.svg',
                          width: 18, height: 18),
                      'Mit Reifenkauf',
                      true)),
              const SizedBox(width: 8),
              Expanded(
                  child: _serviceToggle(
                      context,
                      const Text('🔧', style: TextStyle(fontSize: 14)),
                      'Nur Montage',
                      false)),
            ],
          ),
          const SizedBox(height: 8),
          // Row 2: Vorderreifen / Hinterreifen / Beide Reifen
          Row(
            children: [
              Expanded(child: _tireBadge(context, 'front', 'Vorderreifen')),
              const SizedBox(width: 6),
              Expanded(child: _tireBadge(context, 'rear', 'Hinterreifen')),
              const SizedBox(width: 6),
              Expanded(child: _tireBadge(context, 'both', 'Beide')),
            ],
          ),
          const SizedBox(height: 8),
          // Row 3: Entsorgung
          Row(
            children: [
              Expanded(
                  child: _optionBadge(context, '♻️ Altreifenentsorgung',
                      state.withDisposal, () => notifier.toggleDisposal())),
            ],
          ),
          if (!state.includeTires) ...[
            const SizedBox(height: 6),
            _hintBox(context,
                '💡 Sie bringen Ihre eigenen Motorradreifen mit. Räder müssen ausgebaut zur Werkstatt gebracht werden.'),
          ],
        ],
      ),
    );
  }

  Widget _serviceToggle(
      BuildContext context, Widget icon, String label, bool isIncludeTires) {
    final selected = state.includeTires == isIncludeTires;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => notifier.setIncludeTires(isIncludeTires),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? Colors.white
                      : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                )),
          ],
        ),
      ),
    );
  }

  Widget _tireBadge(BuildContext context, String pkgId, String label) {
    final selected = (state.selectedPackage ?? 'both') == pkgId;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => notifier.setSelectedPackage(pkgId),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected
                  ? Colors.white
                  : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
            )),
      ),
    );
  }

  Widget _optionBadge(
      BuildContext context, String label, bool selected, VoidCallback onTap) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: selected
                  ? Colors.white
                  : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[700]),
            )),
      ),
    );
  }

  Widget _hintBox(BuildContext context, String text) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF0F7FF),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE)),
      ),
      child: Text(
        text,
        style: TextStyle(
            fontSize: 11,
            color: isDark ? const Color(0xFF94A3B8) : Colors.grey[700],
            height: 1.3),
      ),
    );
  }
}

// ── Wheel Change Filters (Räderwechsel) ──

class WheelChangeFilters extends StatelessWidget {
  final WorkshopSearchState state;
  final WorkshopSearchNotifier notifier;
  final WorkshopServiceDetail? serviceDetail;

  const WheelChangeFilters(
      {required this.state, required this.notifier, this.serviceDetail});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final showBalancing =
        serviceDetail == null || serviceDetail!.balancingPrice != null;
    final showStorage =
        serviceDetail == null || serviceDetail!.storageAvailable;
    final showWashing =
        serviceDetail == null || serviceDetail!.washingAvailable;

    final badges = <Widget>[];
    if (showBalancing) {
      badges.add(Expanded(
          child: _badge(context, isDark, '🎯', 'Auswuchten',
              state.withBalancing, () => notifier.toggleBalancing())));
    }
    if (showStorage) {
      if (badges.isNotEmpty) badges.add(const SizedBox(width: 6));
      badges.add(Expanded(
          child: _badge(context, isDark, '📦', 'Einlagerung', state.withStorage,
              () => notifier.toggleStorage())));
    }
    if (showWashing) {
      if (badges.isNotEmpty) badges.add(const SizedBox(width: 6));
      badges.add(Expanded(
          child: _badge(context, isDark, '🧼', 'Waschen', state.withWashing,
              () => notifier.toggleWashing())));
    }

    if (badges.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          Row(children: badges),
        ],
      ),
    );
  }

  Widget _badge(BuildContext context, bool isDark, String emoji, String label,
      bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? Colors.white
                      : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
                )),
          ],
        ),
      ),
    );
  }
}

class _LeftHalfClipper extends CustomClipper<Rect> {
  @override
  Rect getClip(Size size) => Rect.fromLTWH(0, 0, size.width / 2, size.height);
  @override
  bool shouldReclip(covariant CustomClipper<Rect> oldClipper) => false;
}

class _RightHalfClipper extends CustomClipper<Rect> {
  @override
  Rect getClip(Size size) =>
      Rect.fromLTWH(size.width / 2, 0, size.width / 2, size.height);
  @override
  bool shouldReclip(covariant CustomClipper<Rect> oldClipper) => false;
}

class _MissingTireSeasonView extends StatelessWidget {
  final String season;
  final Vehicle? vehicle;
  const _MissingTireSeasonView({required this.season, this.vehicle});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final seasonName = switch (season) {
      'w' => 'Winterreifen',
      'g' => 'Ganzjahresreifen',
      _ => 'Sommerreifen',
    };
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child:
                  Icon(Icons.tire_repair, size: 36, color: Colors.orange[700]),
            ),
            const SizedBox(height: 20),
            Text(
              'Keine $seasonName-Größe gespeichert',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'Um $seasonName zu suchen, hinterlege bitte die passende Reifengröße in deinem Fahrzeugprofil.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600],
                height: 1.4,
              ),
            ),
            if (vehicle != null) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () =>
                      context.push('/vehicles/edit', extra: vehicle),
                  icon: const Icon(Icons.edit, size: 18),
                  label: Text('$seasonName-Größe hinterlegen'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AxleSelectionHintView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.swap_horiz,
              size: 64,
              color: Colors.amber[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Achse wählen',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Dein Fahrzeug hat Mischbereifung. Bitte wähle Vorderachse oder Hinterachse, um Werkstätten zu finden.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF94A3B8)
                      : Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  final bool hasSearched;
  const _EmptyView({required this.hasSearched});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              hasSearched ? Icons.search_off : Icons.search,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              hasSearched
                  ? 'Keine Werkstätten gefunden'
                  : 'Suche nach Werkstätten',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              hasSearched
                  ? 'Versuche einen anderen Suchbegriff oder erweitere den Radius.'
                  : 'Gib eine PLZ oder Stadt ein, um Werkstätten in deiner Nähe zu finden.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF94A3B8)
                      : Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _WorkshopList extends StatelessWidget {
  final List<Workshop> workshops;
  final String? serviceType;
  const _WorkshopList({required this.workshops, this.serviceType});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      itemCount: workshops.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) =>
          _WorkshopCard(workshop: workshops[index], serviceType: serviceType),
    );
  }
}

class _WorkshopCard extends ConsumerWidget {
  final Workshop workshop;
  final String? serviceType;
  const _WorkshopCard({required this.workshop, this.serviceType});

  static const _serviceLabels = <String, String>{
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorradreifenwechsel',
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

  static String _packageLabel(String serviceType, String? pkg) {
    const labels = {
      'measurement_front': 'Messung vorne',
      'measurement_rear': 'Messung hinten',
      'measurement_both': 'Messung beide Achsen',
      'adjustment_front': 'Einstellung vorne',
      'adjustment_rear': 'Einstellung hinten',
      'adjustment_both': 'Einstellung beide Achsen',
      'full_service': 'Komplett-Service',
      'foreign_object': 'Fremdkörper-Reparatur',
      'valve_damage': 'Ventilschaden',
      'check': 'Klima-Check',
      'basic': 'Basis-Service',
      'with_balancing': 'Auswuchten',
      'with_storage': 'Einlagerung',
      'with_washing': 'Waschen',
      'comfort': 'Comfort-Service',
      'premium': 'Premium-Service',
      'front': 'Vorderrad',
      'rear': 'Hinterrad',
      'both': 'Beide Räder',
      'four_tires': 'Montage (4 Reifen)',
      'two_tires': 'Montage (2 Reifen)',
    };
    return labels[pkg] ?? _serviceLabels[serviceType] ?? 'Service';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchState = ref.watch(workshopSearchProvider);
    final selectedVehicle = ref.watch(selectedVehicleProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasService = serviceType != null;
    final hasVehicle = selectedVehicle != null;
    final isTireChange =
        serviceType == 'TIRE_CHANGE' && searchState.includeTires;
    final isMotorcycleTire =
        serviceType == 'MOTORCYCLE_TIRE' && searchState.includeTires;
    final isPostApiService =
        WorkshopSearchState.postApiServices.contains(serviceType);

    // Tire change pricing from search API
    double? totalPrice;
    final breakdown = <String, double>{};

    if (isTireChange && workshop.tireAvailable) {
      // Tire search API already computed prices (includeTires is always true here)
      if (workshop.searchTotalPrice != null) {
        totalPrice = workshop.searchTotalPrice;
        // Mit Reifen: Original Breakdown
        if (workshop.searchBasePrice != null) {
          breakdown['Montage'] = workshop.searchBasePrice!;
        }
        // Check for Mischbereifung (front/rear different tires)
        final hasFrontRear =
            workshop.tireFront != null || workshop.tireRear != null;
        if (hasFrontRear) {
          if (workshop.tireFront != null) {
            final fBrand = workshop.tireFront!['brand'] ?? '';
            final fPrice =
                (workshop.tireFront!['totalPrice'] as num?)?.toDouble() ?? 0;
            final fQty =
                (workshop.tireFront!['quantity'] as num?)?.toInt() ?? 2;
            final fPerTire =
                (workshop.tireFront!['pricePerTire'] as num?)?.toDouble();
            breakdown[
                    'VA: $fQty× $fBrand à ${fPerTire?.toStringAsFixed(2) ?? "-"}€'] =
                fPrice;
          }
          if (workshop.tireRear != null) {
            final rBrand = workshop.tireRear!['brand'] ?? '';
            final rPrice =
                (workshop.tireRear!['totalPrice'] as num?)?.toDouble() ?? 0;
            final rQty = (workshop.tireRear!['quantity'] as num?)?.toInt() ?? 2;
            final rPerTire =
                (workshop.tireRear!['pricePerTire'] as num?)?.toDouble();
            breakdown[
                    'HA: $rQty× $rBrand à ${rPerTire?.toStringAsFixed(2) ?? "-"}€'] =
                rPrice;
          }
        } else if (workshop.tirePrice > 0) {
          final qty = workshop.tireQuantity ?? searchState.tireCount;
          breakdown[
                  '$qty× ${workshop.tireBrand ?? "Reifen"} à ${workshop.tirePricePerTire?.toStringAsFixed(2) ?? "-"}€'] =
              workshop.tirePrice;
        }
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown['Entsorgung'] = workshop.disposalFeeApplied!;
        }
        if (workshop.runFlatSurchargeApplied != null &&
            workshop.runFlatSurchargeApplied! > 0) {
          breakdown['RunFlat-Zuschlag'] = workshop.runFlatSurchargeApplied!;
        }
      }
    } else if (isMotorcycleTire && workshop.tireAvailable) {
      // Motorcycle tire pricing with front/rear
      if (workshop.searchTotalPrice != null) {
        totalPrice = workshop.searchTotalPrice;
        if (workshop.searchBasePrice != null) {
          breakdown['Montage'] = workshop.searchBasePrice!;
        }
        // Front tire
        if (workshop.tireFront != null) {
          final fBrand = workshop.tireFront!['brand'] ?? '';
          final fPrice =
              (workshop.tireFront!['totalPrice'] as num?)?.toDouble() ?? 0;
          final fQty = (workshop.tireFront!['quantity'] as num?)?.toInt() ?? 1;
          final fPerTire =
              (workshop.tireFront!['pricePerTire'] as num?)?.toDouble();
          breakdown[
                  'VR: $fQty× $fBrand à ${fPerTire?.toStringAsFixed(2) ?? "-"}€'] =
              fPrice;
        }
        // Rear tire
        if (workshop.tireRear != null) {
          final rBrand = workshop.tireRear!['brand'] ?? '';
          final rPrice =
              (workshop.tireRear!['totalPrice'] as num?)?.toDouble() ?? 0;
          final rQty = (workshop.tireRear!['quantity'] as num?)?.toInt() ?? 1;
          final rPerTire =
              (workshop.tireRear!['pricePerTire'] as num?)?.toDouble();
          breakdown[
                  'HR: $rQty× $rBrand à ${rPerTire?.toStringAsFixed(2) ?? "-"}€'] =
              rPrice;
        }
        // Flat tire info fallback
        if (workshop.tireFront == null &&
            workshop.tireRear == null &&
            workshop.tirePrice > 0) {
          final qty = workshop.tireQuantity ?? 2;
          breakdown[
                  '$qty× ${workshop.tireBrand ?? "Reifen"} à ${workshop.tirePricePerTire?.toStringAsFixed(2) ?? "-"}€'] =
              workshop.tirePrice;
        }
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown['Entsorgung'] = workshop.disposalFeeApplied!;
        }
      }
    } else if (isPostApiService && workshop.searchBasePrice != null) {
      // POST API returned package-based pricing (ALIGNMENT_BOTH, TIRE_REPAIR, etc.)
      // Server totalPrice already includes all extras (balancing, storage, washing)
      totalPrice = workshop.searchTotalPrice ?? workshop.searchBasePrice;

      if (serviceType == 'WHEEL_CHANGE') {
        // Räderwechsel: break down using wheelChangeBreakdown from API
        final wcb = workshop.wheelChangeBreakdown;
        if (wcb != null) {
          final baseRw = (wcb['basePrice'] as num?)?.toDouble();
          if (baseRw != null && baseRw > 0) {
            breakdown['Räderwechsel'] = baseRw;
          }
          final balSurcharge = (wcb['balancingSurcharge'] as num?)?.toDouble();
          if (searchState.withBalancing &&
              balSurcharge != null &&
              balSurcharge > 0) {
            breakdown['Auswuchten'] = balSurcharge;
          }
          final stoSurcharge = (wcb['storageSurcharge'] as num?)?.toDouble();
          if (searchState.withStorage &&
              stoSurcharge != null &&
              stoSurcharge > 0) {
            breakdown['Einlagerung'] = stoSurcharge;
          }
          final washSurcharge = (wcb['washingSurcharge'] as num?)?.toDouble();
          if (searchState.withWashing &&
              washSurcharge != null &&
              washSurcharge > 0) {
            breakdown['Räder waschen'] = washSurcharge;
          }
        } else {
          // Fallback: try workshop.pricing
          final baseRw =
              workshop.pricing?.basePrice4 ?? workshop.pricing?.basePrice;
          if (baseRw != null && baseRw > 0) {
            breakdown['Räderwechsel'] = baseRw;
          }
          if (searchState.withBalancing &&
              workshop.pricing?.balancingPrice != null) {
            final balancingTotal = workshop.pricing!.balancingPrice! * 4;
            breakdown['Auswuchten (4 Räder)'] = balancingTotal;
          }
          if (searchState.withStorage &&
              workshop.pricing?.storagePrice != null) {
            breakdown['Einlagerung'] = workshop.pricing!.storagePrice!;
          }
          if (searchState.withWashing &&
              workshop.pricing?.washingPrice != null) {
            breakdown['Räder waschen'] = workshop.pricing!.washingPrice!;
          }
        }
        // If nothing could be broken down, show the total as single line
        if (breakdown.isEmpty && totalPrice != null) {
          breakdown['Räderwechsel'] = totalPrice!;
        }
      } else if (serviceType == 'MOTORCYCLE_TIRE') {
        // Motorcycle "Nur Montage": break down into montage + extras
        final motoBase = workshop.pricing?.tireChangePriceMotorcycle ??
            workshop.searchBasePrice!;
        breakdown['Montage'] = motoBase;
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown['Altreifenentsorgung'] = workshop.disposalFeeApplied!;
        }
        // If total is higher, show remaining as additional services
        if (totalPrice != null) {
          final brokenDown = breakdown.values.fold(0.0, (a, b) => a + b);
          if (totalPrice! > brokenDown + 0.01) {
            breakdown['Zusatzleistungen'] = totalPrice! - brokenDown;
          }
        }
      } else if (serviceType == 'TIRE_CHANGE' && !searchState.includeTires) {
        // TIRE_CHANGE "Nur Montage": combine montage + surcharge into one "Montage" line
        double montageTotal = workshop.searchBasePrice!;
        if (workshop.mountingOnlySurchargeApplied != null &&
            workshop.mountingOnlySurchargeApplied! > 0) {
          montageTotal += workshop.mountingOnlySurchargeApplied!;
        }
        breakdown['Montage'] = montageTotal;
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown['Entsorgung'] = workshop.disposalFeeApplied!;
        }
        if (workshop.runFlatSurchargeApplied != null &&
            workshop.runFlatSurchargeApplied! > 0) {
          breakdown['RunFlat-Zuschlag'] = workshop.runFlatSurchargeApplied!;
        }
      } else {
        breakdown[_packageLabel(serviceType!, searchState.selectedPackage)] =
            workshop.searchBasePrice!;
        // Show add-on breakdown (already included in server totalPrice)
        if (searchState.withBalancing &&
            workshop.pricing?.balancingPrice != null) {
          final balancingTotal = workshop.pricing!.balancingPrice! * 4;
          breakdown['Auswuchten (4 Räder)'] = balancingTotal;
        }
        if (searchState.withStorage && workshop.pricing?.storagePrice != null) {
          breakdown['Einlagerung'] = workshop.pricing!.storagePrice!;
        }
        if (searchState.withWashing && workshop.pricing?.washingPrice != null) {
          breakdown['Räder waschen'] = workshop.pricing!.washingPrice!;
        }
      }
    } else {
      // Regular pricing
      final basePrice =
          workshop.pricing?.basePrice ?? workshop.pricing?.lowestPrice;
      if (hasVehicle && basePrice != null) {
        breakdown['Basis'] = basePrice;
        var runningTotal = basePrice;
        if (searchState.withBalancing &&
            workshop.pricing?.balancingPrice != null) {
          final balancingTotal = workshop.pricing!.balancingPrice! * 4;
          breakdown['Auswuchten (4 Räder)'] = balancingTotal;
          runningTotal += balancingTotal;
        }
        if (searchState.withStorage && workshop.pricing?.storagePrice != null) {
          breakdown['Einlagerung'] = workshop.pricing!.storagePrice!;
          runningTotal += workshop.pricing!.storagePrice!;
        }
        if (searchState.withWashing && workshop.pricing?.washingPrice != null) {
          breakdown['Räder waschen'] = workshop.pricing!.washingPrice!;
          runningTotal += workshop.pricing!.washingPrice!;
        }
        totalPrice = runningTotal;
      }
    }

    final hasBreakdown = breakdown.length > 1;
    final hasAnyBreakdown =
        breakdown.isNotEmpty; // for post-API services show even single entry
    final img = workshop.displayImage;
    final hasImage = img != null && img.isNotEmpty;

    return Card(
      elevation: 4,
      shadowColor: isDark ? Colors.black54 : Colors.black26,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          final qp = <String, String>{};
          if (serviceType != null) qp['service'] = serviceType!;
          if (workshop.tireBrand != null) qp['tireBrand'] = workshop.tireBrand!;
          if (workshop.tireModel != null) qp['tireModel'] = workshop.tireModel!;
          final uri = Uri(
            path: '/search/workshop/${workshop.id}',
            queryParameters: qp.isNotEmpty ? qp : null,
          );
          context.push(uri.toString());
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image section ──
            SizedBox(
              height: 160,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (hasImage)
                    Image.network(
                      img,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _fallbackImage(isDark),
                    )
                  else
                    _fallbackImage(isDark),
                  // Distance badge top-right
                  if (workshop.distance != null)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color:
                              isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 4,
                            )
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.place,
                                size: 14, color: Color(0xFF0284C7)),
                            const SizedBox(width: 3),
                            Text(
                              workshop.distanceFormatted,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF0284C7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Price badge bottom-right (only when a service is selected)
                  if (hasService)
                    Positioned(
                      bottom: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: (isTireChange || isMotorcycleTire)
                              ? (workshop.tireAvailable
                                  ? const Color(0xFF0284C7)
                                  : Colors.grey.shade700)
                              : (totalPrice != null
                                  ? const Color(0xFF0284C7)
                                  : Colors.grey.shade700),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          (isTireChange || isMotorcycleTire)
                              ? (workshop.tireAvailable && totalPrice != null
                                  ? 'Gesamt ${totalPrice.toStringAsFixed(2)}€'
                                  : workshop.tireAvailable
                                      ? 'Reifen verfügbar'
                                      : 'Keine Reifen')
                              : totalPrice != null
                                  ? 'Festpreis ${totalPrice.toStringAsFixed(2)}€'
                                  : (isPostApiService
                                      ? 'Nicht verfügbar'
                                      : 'Preis auf Anfrage'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // ── Info section ──
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + City row
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          workshop.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF334155)
                              : Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          workshop.city,
                          style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : Colors.grey[700]),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Rating row
                  if (workshop.averageRating != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          ...List.generate(5, (i) {
                            final rating = workshop.averageRating!;
                            if (i < rating.floor()) {
                              return Icon(Icons.star,
                                  size: 16, color: Colors.amber[700]);
                            } else if (i < rating) {
                              return Icon(Icons.star_half,
                                  size: 16, color: Colors.amber[700]);
                            }
                            return Icon(Icons.star_border,
                                size: 16, color: Colors.amber[700]);
                          }),
                          const SizedBox(width: 6),
                          Text(
                            workshop.averageRating!.toStringAsFixed(1),
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          Text(
                            ' (${workshop.reviewCount} Bewertungen)',
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 12),
                          ),
                        ],
                      ),
                    ),

                  // Tire info for TIRE_CHANGE
                  if (isTireChange &&
                      workshop.tireAvailable &&
                      (workshop.tireBrand != null ||
                          workshop.tireFront != null ||
                          workshop.tireRear != null)) ...[
                    Builder(builder: (context) {
                      // Check if this is a Mischbereifung result with front/rear
                      final hasFrontRear = workshop.tireFront != null ||
                          workshop.tireRear != null;

                      // Build tire dimension string from recommendation data (single-tire case)
                      String? tireDimStr;
                      if (!hasFrontRear &&
                          workshop.tireRecommendationsRaw.isNotEmpty) {
                        final rec = workshop.tireRecommendationsRaw.first;
                        final w = rec['width']?.toString() ?? '';
                        final h = rec['height']?.toString() ?? '';
                        final d = rec['diameter']?.toString() ?? '';
                        final li = rec['loadIndex']?.toString() ?? '';
                        final si = rec['speedIndex']?.toString() ?? '';
                        if (w.isNotEmpty && d.isNotEmpty) {
                          tireDimStr = '$w/${h.isNotEmpty ? h : "-"} R$d';
                          if (li.isNotEmpty || si.isNotEmpty)
                            tireDimStr = '$tireDimStr $li$si';
                        }
                      }

                      if (hasFrontRear) {
                        // Mischbereifung: TWO separate containers for VA and HA
                        return Column(
                          children: [
                            // VA (Front) container
                            if (workshop.tireFront != null) ...[
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7)
                                      .withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: const Color(0xFF0284C7)
                                          .withValues(alpha: 0.15)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0284C7),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: const Text('VA',
                                              style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white)),
                                        ),
                                        const SizedBox(width: 6),
                                        const Icon(Icons.tire_repair,
                                            size: 16, color: Color(0xFF0284C7)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            '${workshop.tireFront!['brand'] ?? ''} ${workshop.tireFront!['model'] ?? ''}',
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (workshop.tireFront!['dimensions'] !=
                                        null)
                                      Padding(
                                        padding: const EdgeInsets.only(
                                            left: 46, top: 2),
                                        child: Text(
                                            workshop.tireFront!['dimensions']
                                                .toString(),
                                            style: TextStyle(
                                                fontSize: 11,
                                                color: isDark
                                                    ? const Color(0xFF94A3B8)
                                                    : Colors.grey[600])),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 6),
                            ],
                            // HA (Rear) container
                            if (workshop.tireRear != null) ...[
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7)
                                      .withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: const Color(0xFF0284C7)
                                          .withValues(alpha: 0.15)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0284C7),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: const Text('HA',
                                              style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white)),
                                        ),
                                        const SizedBox(width: 6),
                                        const Icon(Icons.tire_repair,
                                            size: 16, color: Color(0xFF0284C7)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            '${workshop.tireRear!['brand'] ?? ''} ${workshop.tireRear!['model'] ?? ''}',
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (workshop.tireRear!['dimensions'] !=
                                        null)
                                      Padding(
                                        padding: const EdgeInsets.only(
                                            left: 46, top: 2),
                                        child: Text(
                                            workshop.tireRear!['dimensions']
                                                .toString(),
                                            style: TextStyle(
                                                fontSize: 11,
                                                color: isDark
                                                    ? const Color(0xFF94A3B8)
                                                    : Colors.grey[600])),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 6),
                            ],
                            // Price breakdown below both containers
                            if (breakdown.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7)
                                      .withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: const Color(0xFF0284C7)
                                          .withValues(alpha: 0.15)),
                                ),
                                child: Column(
                                  children: [
                                    ...breakdown.entries.map((e) => Padding(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 1),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Flexible(
                                                  child: Text(e.key,
                                                      style: TextStyle(
                                                          fontSize: 12,
                                                          color: isDark
                                                              ? const Color(
                                                                  0xFF94A3B8)
                                                              : Colors
                                                                  .grey[700]))),
                                              Text(
                                                  '${e.value.toStringAsFixed(2)}€',
                                                  style: const TextStyle(
                                                      fontSize: 12)),
                                            ],
                                          ),
                                        )),
                                    const Divider(height: 8),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text('Gesamtpreis',
                                            style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold)),
                                        Text(
                                            '${totalPrice?.toStringAsFixed(2) ?? "-"}€',
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF0284C7))),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        );
                      }

                      // Standard single tire display
                      return Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color:
                              const Color(0xFF0284C7).withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.15)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.tire_repair,
                                    size: 16, color: Color(0xFF0284C7)),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '${workshop.tireBrand ?? ""} ${workshop.tireModel ?? ""}',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            if (tireDimStr != null)
                              Padding(
                                padding:
                                    const EdgeInsets.only(left: 22, top: 2),
                                child: Text(tireDimStr,
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? const Color(0xFF94A3B8)
                                            : Colors.grey[600])),
                              ),
                            if (breakdown.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              ...breakdown.entries.map((e) => Padding(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 1),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Flexible(
                                            child: Text(e.key,
                                                style: TextStyle(
                                                    fontSize: 12,
                                                    color: isDark
                                                        ? const Color(
                                                            0xFF94A3B8)
                                                        : Colors.grey[700]))),
                                        Text('${e.value.toStringAsFixed(2)}€',
                                            style:
                                                const TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                  )),
                              const Divider(height: 8),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Gesamtpreis',
                                      style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold)),
                                  Text(
                                      '${totalPrice?.toStringAsFixed(2) ?? "-"}€',
                                      style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF0284C7))),
                                ],
                              ),
                            ],
                          ],
                        ),
                      );
                    }),
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Icon(Icons.swap_horiz,
                              size: 13,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : Colors.grey[500]),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              'Weitere Reifen bei dieser Werkstatt verfügbar',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontStyle: FontStyle.italic,
                                  color: isDark
                                      ? const Color(0xFF94A3B8)
                                      : Colors.grey[500]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ] else if (isTireChange && !workshop.tireAvailable) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline,
                              size: 16, color: Colors.orange[800]),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Keine passenden Reifen verfügbar',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.orange[900]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Motorcycle tire info (front/rear) — separate containers
                  if (isMotorcycleTire && workshop.tireAvailable) ...[
                    // VR (Front) container
                    if (workshop.tireFront != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color:
                              const Color(0xFF0284C7).withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.15)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0284C7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text('VR',
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white)),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.tire_repair,
                                    size: 16, color: Color(0xFF0284C7)),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '${workshop.tireFront!['brand'] ?? ''} ${workshop.tireFront!['model'] ?? ''}',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            if (workshop.tireFront!['dimensions'] != null)
                              Padding(
                                padding:
                                    const EdgeInsets.only(left: 46, top: 2),
                                child: Text(
                                    workshop.tireFront!['dimensions']
                                        .toString(),
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? const Color(0xFF94A3B8)
                                            : Colors.grey[600])),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                    ],
                    // HR (Rear) container
                    if (workshop.tireRear != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color:
                              const Color(0xFF0284C7).withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.15)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0284C7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text('HR',
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white)),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.tire_repair,
                                    size: 16, color: Color(0xFF0284C7)),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '${workshop.tireRear!['brand'] ?? ''} ${workshop.tireRear!['model'] ?? ''}',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            if (workshop.tireRear!['dimensions'] != null)
                              Padding(
                                padding:
                                    const EdgeInsets.only(left: 46, top: 2),
                                child: Text(
                                    workshop.tireRear!['dimensions'].toString(),
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? const Color(0xFF94A3B8)
                                            : Colors.grey[600])),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                    ],
                    // Fallback: flat tire info
                    if (workshop.tireFront == null &&
                        workshop.tireRear == null &&
                        workshop.tireBrand != null) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
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
                                size: 16, color: Color(0xFF0284C7)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                '${workshop.tireBrand ?? ""} ${workshop.tireModel ?? ""}',
                                style: const TextStyle(
                                    fontSize: 13, fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                    ],
                    // Price breakdown container
                    if (breakdown.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color:
                              const Color(0xFF0284C7).withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.15)),
                        ),
                        child: Column(
                          children: [
                            ...breakdown.entries.map((e) => Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 1),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Flexible(
                                          child: Text(e.key,
                                              style: TextStyle(
                                                  fontSize: 12,
                                                  color: isDark
                                                      ? const Color(0xFF94A3B8)
                                                      : Colors.grey[700]))),
                                      Text('${e.value.toStringAsFixed(2)}€',
                                          style: const TextStyle(fontSize: 12)),
                                    ],
                                  ),
                                )),
                            const Divider(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Gesamtpreis',
                                    style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold)),
                                Text(
                                    '${totalPrice?.toStringAsFixed(2) ?? "-"}€',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF0284C7))),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Icon(Icons.swap_horiz,
                              size: 13,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : Colors.grey[500]),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              'Weitere Reifen bei dieser Werkstatt verfügbar',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontStyle: FontStyle.italic,
                                  color: isDark
                                      ? const Color(0xFF94A3B8)
                                      : Colors.grey[500]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ] else if (isMotorcycleTire && !workshop.tireAvailable) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline,
                              size: 16, color: Colors.orange[800]),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Keine passenden Motorradreifen verfügbar',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.orange[900]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Price breakdown for regular services
                  if (!isTireChange &&
                      !isMotorcycleTire &&
                      hasService &&
                      totalPrice != null &&
                      (hasBreakdown ||
                          (isPostApiService && hasAnyBreakdown))) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: const Color(0xFF0284C7)
                                .withValues(alpha: 0.15)),
                      ),
                      child: Column(
                        children: [
                          ...breakdown.entries.map((e) => Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 1),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(e.key,
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: isDark
                                                ? const Color(0xFF94A3B8)
                                                : Colors.grey[700])),
                                    Text('${e.value.toStringAsFixed(2)}€',
                                        style: const TextStyle(fontSize: 12)),
                                  ],
                                ),
                              )),
                          const Divider(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Gesamt',
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold)),
                              Text('${totalPrice!.toStringAsFixed(2)}€',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF0284C7))),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // \"Fahrzeug wählen\" hint when no vehicle selected (non-tire change, non-POST-API services)
                  if (!isTireChange &&
                      !isMotorcycleTire &&
                      !isPostApiService &&
                      hasService &&
                      !hasVehicle) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.amber.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline,
                              size: 16, color: Colors.amber[800]),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Wähle oben dein Fahrzeug, um Preise zu sehen',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.amber[900]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Service tags (only show when no specific service selected)
                  if (serviceType == null && workshop.services.isNotEmpty)
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: workshop.services
                          .take(5)
                          .map((s) => _serviceTag(s, isDark))
                          .toList(),
                    ),

                  // Action button
                  if (isTireChange && workshop.tireAvailable) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () {
                          final qp = <String, String>{'service': 'TIRE_CHANGE'};
                          if (workshop.tireBrand != null)
                            qp['tireBrand'] = workshop.tireBrand!;
                          if (workshop.tireModel != null)
                            qp['tireModel'] = workshop.tireModel!;
                          final uri = Uri(
                            path: '/search/workshop/${workshop.id}',
                            queryParameters: qp,
                          );
                          context.push(uri.toString());
                        },
                        icon: const Icon(Icons.tire_repair, size: 16),
                        label: const Text('Reifen & Montage buchen'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                  ] else if (!isTireChange &&
                      hasService &&
                      (hasVehicle || isPostApiService)) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () {
                          final qp = <String, String>{};
                          if (serviceType != null) qp['service'] = serviceType!;
                          if (workshop.tireBrand != null)
                            qp['tireBrand'] = workshop.tireBrand!;
                          if (workshop.tireModel != null)
                            qp['tireModel'] = workshop.tireModel!;
                          final uri = Uri(
                            path: '/search/workshop/${workshop.id}',
                            queryParameters: qp.isNotEmpty ? qp : null,
                          );
                          context.push(uri.toString());
                        },
                        icon: const Icon(Icons.calendar_today, size: 16),
                        label: const Text('Jetzt buchen'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fallbackImage(bool isDark) {
    return Container(
      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF0F4F8),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.car_repair, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 4),
            Text(
              workshop.name,
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _serviceTag(String serviceType, bool isDark) {
    final label = _serviceLabels[serviceType] ?? serviceType;
    final icon = _serviceIcons[serviceType] ?? Icons.miscellaneous_services;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade300,
            width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon,
              size: 13,
              color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 11,
                  color: isDark ? const Color(0xFF94A3B8) : Colors.grey[700])),
        ],
      ),
    );
  }
}

// ── Vehicle selector dropdown ──

class _VehicleSelector extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(vehiclesProvider);
    final selectedVehicle = ref.watch(selectedVehicleProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: selectedVehicle != null
            ? const Color(0xFF0284C7).withValues(alpha: 0.05)
            : (isDark ? const Color(0xFF1E293B) : Colors.amber.shade50),
        border: Border(
          bottom: BorderSide(
              color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
        ),
      ),
      child: vehiclesAsync.when(
        loading: () => const SizedBox(
          height: 40,
          child: Center(
              child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2))),
        ),
        error: (_, __) => const Text('Fahrzeuge konnten nicht geladen werden'),
        data: (vehicles) {
          if (vehicles.isEmpty) {
            return InkWell(
              onTap: () => context.push('/vehicles/add'),
              child: Row(
                children: [
                  Icon(Icons.add_circle_outline,
                      size: 20, color: Colors.amber[800]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Fahrzeug hinzufügen, um Preise zu sehen',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.amber[900]),
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios,
                      size: 14, color: Colors.amber[800]),
                ],
              ),
            );
          }

          return GestureDetector(
            onTap: () =>
                _showVehiclePicker(context, ref, vehicles, selectedVehicle),
            child: Row(
              children: [
                Icon(
                  Icons.directions_car,
                  size: 20,
                  color: selectedVehicle != null
                      ? const Color(0xFF0284C7)
                      : Colors.amber[800],
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    selectedVehicle?.displayName ??
                        'Fahrzeug wählen für Preise',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: selectedVehicle != null
                          ? (isDark ? const Color(0xFFF9FAFB) : Colors.black87)
                          : Colors.amber[900],
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down, size: 20),
                if (selectedVehicle != null)
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      ref.read(selectedVehicleProvider.notifier).state = null;
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showVehiclePicker(BuildContext context, WidgetRef ref,
      List<Vehicle> vehicles, Vehicle? current) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Row(
                children: [
                  const Expanded(
                      child: Text('Fahrzeug wählen',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 17))),
                  IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            ...vehicles.map((v) {
              final isActive = current?.id == v.id;
              return ListTile(
                leading: Icon(
                  isActive
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: isActive ? const Color(0xFF0284C7) : Colors.grey,
                ),
                title: Text(v.displayName),
                subtitle: v.tireSize.isNotEmpty
                    ? Text(v.tireSize, style: const TextStyle(fontSize: 11))
                    : null,
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(selectedVehicleProvider.notifier).state = v;
                },
              );
            }),
            // Add vehicle option
            ListTile(
              leading: const Icon(Icons.add_circle_outline,
                  color: Color(0xFF0284C7)),
              title: const Text('Fahrzeug hinzufügen'),
              onTap: () {
                Navigator.pop(ctx);
                GoRouter.of(context).push('/vehicles/add');
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
