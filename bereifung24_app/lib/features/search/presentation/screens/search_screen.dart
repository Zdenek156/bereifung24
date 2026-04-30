import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/services/location_service.dart';
import '../../../../data/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../utils/tire_category_utils.dart';
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
  // Tire category filter: 'Günstigster', 'Beliebt', 'Testsieger' or null (= all)
  final String? selectedTireCategory;
  // Construction type for motorcycle: 'radial', 'diagonal', or null (= both)
  final String? tireConstruction;
  // Motorcycle Achs-Set: same brand+model for front+rear (default true when 'both')
  final bool requireSameModel;
  // Brand filter (motorcycle): show only workshops with this brand on Achs-Set
  final String? selectedBrand;
  // Article ID from AI recommendation — forces display of that specific tire
  final String? aiArticleId;
  final String? aiRearArticleId;
  // Brand/model from AI for fallback matching when articleId doesn't match
  final String? aiFrontBrand;
  final String? aiFrontModel;
  final String? aiRearBrand;
  final String? aiRearModel;
  // Effective service type (set by notifier after auto-switch, e.g. TIRE_CHANGE → MOTORCYCLE_TIRE)
  final String? effectiveServiceType;
  // True once a search() call has been issued — keeps the filter bar visible
  // even when the result is empty so the user can clear filters again.
  final bool hasSearched;

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
    this.selectedTireCategory = 'Günstigster',
    this.tireConstruction,
    this.requireSameModel = true,
    this.selectedBrand,
    this.aiArticleId,
    this.aiRearArticleId,
    this.aiFrontBrand,
    this.aiFrontModel,
    this.aiRearBrand,
    this.aiRearModel,
    this.effectiveServiceType,
    this.hasSearched = false,
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
    String? selectedTireCategory,
    bool clearSelectedTireCategory = false,
    String? tireConstruction,
    bool clearTireConstruction = false,
    bool? requireSameModel,
    String? selectedBrand,
    bool clearSelectedBrand = false,
    String? aiArticleId,
    bool clearAiArticleId = false,
    String? aiRearArticleId,
    bool clearAiRearArticleId = false,
    String? aiFrontBrand,
    bool clearAiFrontBrand = false,
    String? aiFrontModel,
    bool clearAiFrontModel = false,
    String? aiRearBrand,
    bool clearAiRearBrand = false,
    String? aiRearModel,
    bool clearAiRearModel = false,
    String? effectiveServiceType,
    bool clearEffectiveServiceType = false,
    bool? hasSearched,
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
        selectedTireCategory: clearSelectedTireCategory
            ? null
            : (selectedTireCategory ?? this.selectedTireCategory),
        tireConstruction: clearTireConstruction
            ? null
            : (tireConstruction ?? this.tireConstruction),
        requireSameModel: requireSameModel ?? this.requireSameModel,
        selectedBrand:
            clearSelectedBrand ? null : (selectedBrand ?? this.selectedBrand),
        aiArticleId:
            clearAiArticleId ? null : (aiArticleId ?? this.aiArticleId),
        aiRearArticleId: clearAiRearArticleId
            ? null
            : (aiRearArticleId ?? this.aiRearArticleId),
        aiFrontBrand:
            clearAiFrontBrand ? null : (aiFrontBrand ?? this.aiFrontBrand),
        aiFrontModel:
            clearAiFrontModel ? null : (aiFrontModel ?? this.aiFrontModel),
        aiRearBrand:
            clearAiRearBrand ? null : (aiRearBrand ?? this.aiRearBrand),
        aiRearModel:
            clearAiRearModel ? null : (aiRearModel ?? this.aiRearModel),
        effectiveServiceType: clearEffectiveServiceType
            ? null
            : (effectiveServiceType ?? this.effectiveServiceType),
        hasSearched: hasSearched ?? this.hasSearched,
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
    debugPrint('🔍 [SEARCH] reset() called');
    _lastZip = null;
    _lastCity = null;
    _lastLat = null;
    _lastLng = null;
    _lastServiceType = null;
    _lastVehicle = null;
    _tireDimOverride = null;
    _rearTireDimOverride = null;
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
    // When the user picks a single axle (front/rear) while Achs-Set is active,
    // auto-deselect Achs-Set so the per-axle view is shown cleanly.
    final disableAchsSet = axle != null && state.requireSameModel;
    // Always reset brand filter when switching between front/rear, because a
    // brand only available on one axle would otherwise return 0 tires on the
    // other axle.
    state = state.copyWith(
        selectedAxle: axle,
        clearSelectedAxle: axle == null,
        needsAxleSelection: false,
        requireSameModel: disableAchsSet ? false : null,
        clearSelectedBrand: true);
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

  void setTireCategory(String? category) {
    state = state.copyWith(
      selectedTireCategory: category,
      clearSelectedTireCategory: category == null,
      // Mutual exclusivity: picking a category resets the brand filter
      clearSelectedBrand: category != null,
    );
  }

  void setTireConstruction(String? construction) {
    state = state.copyWith(
        tireConstruction: construction,
        clearTireConstruction: construction == null);
    _reSearch();
  }

  void setSelectedPackage(String? pkg) {
    // For motorcycle: when the user picks 'front' or 'rear' while Achs-Set
    // (requireSameModel) is active, auto-deselect Achs-Set so the per-axle
    // view is shown cleanly and stale brand-pair selections are cleared.
    final disableAchsSet = pkg != null &&
        pkg != 'both' &&
        (pkg == 'front' || pkg == 'rear') &&
        state.requireSameModel;
    // Always reset brand filter when switching between front/rear/both, because
    // a brand only available on one axle would otherwise yield 0 tires on the
    // other axle.
    final resetBrand = pkg == 'front' || pkg == 'rear' || pkg == 'both';
    state = state.copyWith(
      selectedPackage: pkg,
      clearSelectedPackage: pkg == null,
      requireSameModel: disableAchsSet ? false : null,
      clearSelectedBrand: resetBrand,
    );
    _reSearch();
  }

  void setRequireSameModel(bool value) {
    state = state.copyWith(
        requireSameModel: value,
        // Reset brand filter when toggling Achs-Set
        clearSelectedBrand: true);
    _reSearch();
  }

  void setSelectedBrand(String? brand) {
    state = state.copyWith(
      selectedBrand: brand,
      clearSelectedBrand: brand == null,
      // Mutual exclusivity: picking a brand deselects category badges
      clearSelectedTireCategory: brand != null,
    );
    // No re-search needed: client-side filter only
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
        tireDimensionOverride: _tireDimOverride,
        rearTireDimensionOverride: _rearTireDimOverride,
      );
    }
  }

  Map<String, String>? _tireDimOverride;
  Map<String, String>? _rearTireDimOverride;

  Future<void> search(
      {String? zipCode,
      String? city,
      double? lat,
      double? lng,
      String? serviceType,
      Vehicle? vehicle,
      Map<String, String>? tireDimensionOverride,
      Map<String, String>? rearTireDimensionOverride}) async {
    _lastZip = zipCode;
    _lastCity = city;
    _lastLat = lat;
    _lastLng = lng;
    _lastServiceType = serviceType;
    if (vehicle != null) _lastVehicle = vehicle;
    _tireDimOverride = tireDimensionOverride;
    _rearTireDimOverride = rearTireDimensionOverride;

    // When coming from AI recommendation with specific tire, clear category filter
    // so the AI-matched tire is shown, not just the cheapest
    final hasAiTire = tireDimensionOverride != null &&
        (tireDimensionOverride.containsKey('articleId') ||
            tireDimensionOverride.containsKey('tireBrand'));

    final aiArtId = tireDimensionOverride?['articleId'];
    final aiRearArtId = rearTireDimensionOverride?['articleId'];

    debugPrint(
        '🔍 [SEARCH] setting AI fields: frontBrand=${tireDimensionOverride?['tireBrand']}, rearBrand=${rearTireDimensionOverride?['tireBrand']}, artId=$aiArtId, rearArtId=$aiRearArtId');
    state = state.copyWith(
      isLoading: true,
      error: null,
      hasSearched: true,
      query: zipCode ?? city ?? state.query,
      clearSelectedTireCategory: hasAiTire,
      aiArticleId: aiArtId,
      clearAiArticleId: aiArtId == null,
      aiRearArticleId: aiRearArtId,
      clearAiRearArticleId: aiRearArtId == null,
      aiFrontBrand: tireDimensionOverride?['tireBrand'],
      clearAiFrontBrand: tireDimensionOverride == null,
      aiFrontModel: tireDimensionOverride?['tireModel'],
      clearAiFrontModel: tireDimensionOverride == null,
      aiRearBrand: rearTireDimensionOverride?['tireBrand'],
      clearAiRearBrand: rearTireDimensionOverride == null,
      aiRearModel: rearTireDimensionOverride?['tireModel'],
      clearAiRearModel: rearTireDimensionOverride == null,
      clearEffectiveServiceType: true,
    );
    debugPrint(
        '🔍 [SEARCH] state after copyWith: aiFrontBrand=${state.aiFrontBrand}, aiRearBrand=${state.aiRearBrand}');

    try {
      // Auto-switch to MOTORCYCLE_TIRE when vehicle is a motorcycle
      // (also when no service preselected, so the search tab works directly)
      var effectiveServiceType = serviceType;
      if (_lastVehicle?.vehicleType == 'MOTORCYCLE' &&
          (serviceType == null ||
              serviceType.isEmpty ||
              serviceType == 'TIRE_CHANGE')) {
        effectiveServiceType = 'MOTORCYCLE_TIRE';
      }

      // Block: motorcycle vehicle with non-motorcycle service
      if (_lastVehicle?.vehicleType == 'MOTORCYCLE' &&
          effectiveServiceType != 'MOTORCYCLE_TIRE') {
        state = state.copyWith(
          isLoading: false,
          workshops: [],
          error: 'error_service_car_only',
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
          error: 'error_need_motorcycle',
        );
        return;
      }

      // Block: trailer vehicle with non-tire services
      if (_lastVehicle?.vehicleType == 'TRAILER' &&
          effectiveServiceType != null &&
          effectiveServiceType != 'TIRE_CHANGE' &&
          effectiveServiceType != 'WHEEL_CHANGE') {
        state = state.copyWith(
          isLoading: false,
          workshops: [],
          error: 'error_trailer_tire_only',
        );
        return;
      }

      // Store the effective service type so UI can use it
      state = state.copyWith(effectiveServiceType: effectiveServiceType);

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
            ? 'error_location_failed'
            : 'error_search_failed',
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
      // Note: disposal is sent as body['includeDisposal'] below, NOT in packageTypes
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
    if (serviceType == 'CLIMATE_SERVICE') {
      // Send empty packageTypes to match all workshops with any climate package
      // (Web sends [] — API returns workshops with any active climate tier)
      packageTypes.clear();
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

    // ALWAYS send tireDimensions for TIRE_CHANGE (needed for rim-size pricing even for Nur Montage)
    if (serviceType == 'TIRE_CHANGE' && _lastVehicle != null) {
      final tireSpec = _lastVehicle!.summerTires ??
          _lastVehicle!.winterTires ??
          _lastVehicle!.allSeasonTires;
      if (tireSpec != null && tireSpec.diameter != null) {
        body['tireDimensions'] = {
          'width': tireSpec.width?.toString() ?? '',
          'height': tireSpec.aspectRatio?.toString() ?? '',
          'diameter': tireSpec.diameter?.toString() ?? '',
          if (tireSpec.loadIndex != null)
            'loadIndex': tireSpec.loadIndex.toString(),
          if (tireSpec.speedRating != null) 'speedIndex': tireSpec.speedRating,
        };
      }
    }

    // Motorcycle with tire purchase → use dedicated motorcycle API
    if (serviceType == 'MOTORCYCLE_TIRE') {
      body['includeTires'] = state.includeTires;
      body['includeDisposal'] = state.withDisposal;

      // Add tire dimensions: prefer AI override, then vehicle data
      if (_tireDimOverride != null) {
        body['tireDimensionsFront'] = {
          'width': _tireDimOverride!['width'] ?? '',
          'height': _tireDimOverride!['height'] ?? '',
          'diameter': _tireDimOverride!['diameter'] ?? '',
          if (_tireDimOverride!['loadIndex'] != null &&
              _tireDimOverride!['loadIndex']!.isNotEmpty)
            'loadIndex': _tireDimOverride!['loadIndex'],
          if (_tireDimOverride!['speedIndex'] != null &&
              _tireDimOverride!['speedIndex']!.isNotEmpty)
            'speedIndex': _tireDimOverride!['speedIndex'],
          if (_tireDimOverride!['articleId'] != null &&
              _tireDimOverride!['articleId']!.isNotEmpty)
            'articleId': _tireDimOverride!['articleId'],
          if (_tireDimOverride!['tireBrand'] != null &&
              _tireDimOverride!['tireBrand']!.isNotEmpty)
            'tireBrand': _tireDimOverride!['tireBrand'],
          if (_tireDimOverride!['tireModel'] != null &&
              _tireDimOverride!['tireModel']!.isNotEmpty)
            'tireModel': _tireDimOverride!['tireModel'],
        };
        if (_rearTireDimOverride != null) {
          body['tireDimensionsRear'] = {
            'width': _rearTireDimOverride!['width'] ?? '',
            'height': _rearTireDimOverride!['height'] ?? '',
            'diameter': _rearTireDimOverride!['diameter'] ?? '',
            if (_rearTireDimOverride!['loadIndex'] != null &&
                _rearTireDimOverride!['loadIndex']!.isNotEmpty)
              'loadIndex': _rearTireDimOverride!['loadIndex'],
            if (_rearTireDimOverride!['speedIndex'] != null &&
                _rearTireDimOverride!['speedIndex']!.isNotEmpty)
              'speedIndex': _rearTireDimOverride!['speedIndex'],
            if (_rearTireDimOverride!['articleId'] != null &&
                _rearTireDimOverride!['articleId']!.isNotEmpty)
              'articleId': _rearTireDimOverride!['articleId'],
            if (_rearTireDimOverride!['tireBrand'] != null &&
                _rearTireDimOverride!['tireBrand']!.isNotEmpty)
              'tireBrand': _rearTireDimOverride!['tireBrand'],
            if (_rearTireDimOverride!['tireModel'] != null &&
                _rearTireDimOverride!['tireModel']!.isNotEmpty)
              'tireModel': _rearTireDimOverride!['tireModel'],
          };
        } else {
          body['tireDimensionsRear'] = body['tireDimensionsFront'];
        }
      } else if (_lastVehicle != null) {
        final tireSpec = _lastVehicle!.summerTires ??
            _lastVehicle!.winterTires ??
            _lastVehicle!.allSeasonTires;
        if (tireSpec != null && tireSpec.width != null) {
          body['tireDimensionsFront'] = {
            'width': tireSpec.width.toString(),
            'height': tireSpec.aspectRatio?.toString() ?? '',
            'diameter': tireSpec.diameter?.toString() ?? '',
            if (tireSpec.loadIndex != null)
              'loadIndex': tireSpec.loadIndex.toString(),
            if (tireSpec.speedRating != null)
              'speedIndex': tireSpec.speedRating,
          };
          // Rear dimensions (different sizes or same)
          if (tireSpec.hasDifferentSizes && tireSpec.rearWidth != null) {
            body['tireDimensionsRear'] = {
              'width': tireSpec.rearWidth.toString(),
              'height': tireSpec.rearAspectRatio?.toString() ?? '',
              'diameter': tireSpec.rearDiameter?.toString() ?? '',
              if (tireSpec.rearLoadIndex != null)
                'loadIndex': tireSpec.rearLoadIndex.toString(),
              if (tireSpec.rearSpeedRating != null)
                'speedIndex': tireSpec.rearSpeedRating,
            };
          } else {
            body['tireDimensionsRear'] = body['tireDimensionsFront'];
          }
        }
      }

      // Build tireFilters: always include seasons, optionally construction
      final motorcycleTireFilters = <String, dynamic>{
        'seasons': [state.tireSeason],
      };
      if (state.tireConstruction != null &&
          state.tireConstruction!.isNotEmpty) {
        motorcycleTireFilters['construction'] = state.tireConstruction;
      }
      body['tireFilters'] = motorcycleTireFilters;

      // Achs-Set: only when both tires selected → match same brand+model
      final isBothTires = (state.selectedPackage ?? 'both') == 'both';
      body['sameModel'] =
          isBothTires && state.includeTires && state.requireSameModel;

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

    final body = <String, dynamic>{
      'serviceType': 'TIRE_CHANGE',
      'radiusKm': state.radius,
      'includeTires': true,
      'packageTypes': packageTypes,
      'tireFilters': {
        'seasons': [state.tireSeason],
        if (state.withThreePMSF) 'threePMSF': true,
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

    // Auto-Mischbereifung: require same brand for front and rear when Achs-Set toggle is active
    if (hasMixed && state.tireCount == 4 && state.includeTires) {
      body['sameBrand'] = state.requireSameModel;
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
    final hasMixed = _rearTireDimOverride != null;
    final packageTypes = <String>[];
    if (hasMixed) {
      packageTypes.add('mixed_four_tires');
    } else if (state.tireCount == 4) {
      packageTypes.add('four_tires');
    } else {
      packageTypes.add('two_tires');
    }
    if (state.withDisposal) packageTypes.add('with_disposal');
    if (state.withRunFlat) packageTypes.add('runflat');

    // Normalize season: Sommer→s, Winter→w, Ganzjahr→g
    var season = dims['season'] ?? 's';
    if (season.toLowerCase().startsWith('s') && season.length > 1) season = 's';
    if (season.toLowerCase().startsWith('w') && season.length > 1) season = 'w';
    if (season.toLowerCase().startsWith('g') && season.length > 1) season = 'g';

    final frontDims = <String, dynamic>{
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
    };

    final body = <String, dynamic>{
      'serviceType': 'TIRE_CHANGE',
      'radiusKm': state.radius,
      'includeTires': true,
      'packageTypes': packageTypes,
      'tireFilters': {
        'seasons': [season],
        if (state.withThreePMSF) 'threePMSF': true,
      },
    };

    if (hasMixed) {
      final rear = _rearTireDimOverride!;
      body['tireDimensionsFront'] = frontDims;
      body['tireDimensionsRear'] = {
        'width': rear['width'] ?? '',
        'height': rear['height'] ?? '',
        'diameter': rear['diameter'] ?? '',
        if (rear['loadIndex'] != null &&
            rear['loadIndex']!.isNotEmpty &&
            rear['loadIndex'] != '-')
          'loadIndex': rear['loadIndex'],
        if (rear['speedIndex'] != null &&
            rear['speedIndex']!.isNotEmpty &&
            rear['speedIndex'] != '-')
          'speedIndex': rear['speedIndex'],
        if (rear['articleId'] != null && rear['articleId']!.isNotEmpty)
          'articleId': rear['articleId'],
        if (rear['tireBrand'] != null && rear['tireBrand']!.isNotEmpty)
          'tireBrand': rear['tireBrand'],
        if (rear['tireModel'] != null && rear['tireModel']!.isNotEmpty)
          'tireModel': rear['tireModel'],
      };
      body['tireDimensions'] = frontDims;
    } else {
      body['tireDimensions'] = frontDims;
    }

    if (zipCode != null && zipCode.isNotEmpty) body['zipCode'] = zipCode;
    if (city != null && city.isNotEmpty) body['city'] = city;
    if (lat != null) body['customerLat'] = lat;
    if (lng != null) body['customerLon'] = lng;

    // Auto-Mischbereifung: require same brand for front and rear when Achs-Set toggle is active
    if (hasMixed && state.tireCount == 4 && state.includeTires) {
      body['sameBrand'] = state.requireSameModel;
    }

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
  final Map<String, String>? rearTireDimensionOverride;
  const SearchScreen(
      {super.key,
      this.serviceType,
      this.tireDimensionOverride,
      this.rearTireDimensionOverride});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchCtrl = TextEditingController();

  static Map<String, String> _serviceLabels(BuildContext context) => {
        'TIRE_CHANGE': S.of(context)!.tireChange,
        'WHEEL_CHANGE': S.of(context)!.wheelChange,
        'TIRE_REPAIR': S.of(context)!.tireRepair,
        'MOTORCYCLE_TIRE': S.of(context)!.motorcycleTireChange,
        'ALIGNMENT_BOTH': S.of(context)!.axleAlignment,
        'CLIMATE_SERVICE': S.of(context)!.climateService,
        'BRAKE_SERVICE': S.of(context)!.brakeService,
        'BATTERY_SERVICE': S.of(context)!.batteryService,
      };

  @override
  void initState() {
    super.initState();
    // Clear stale results from a previous service when entering a new search screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(workshopSearchProvider.notifier).reset();
      // Auto-select first vehicle if none selected
      _autoSelectVehicle();
      // Auto-search with GPS when arriving from AI advisor with tire override
      if (widget.tireDimensionOverride != null) {
        _autoSearchWithLocation();
      }
    });
  }

  void _autoSelectVehicle() {
    final current = ref.read(selectedVehicleProvider);
    if (current != null) return;
    final vehiclesAsync = ref.read(vehiclesProvider);
    vehiclesAsync.whenData((vehicles) {
      if (vehicles.isNotEmpty) {
        ref.read(selectedVehicleProvider.notifier).state = vehicles.first;
      }
    });
  }

  Future<void> _autoSearchWithLocation() async {
    try {
      final position = await LocationService().getCurrentPosition();
      if (!mounted) return;
      if (position != null) {
        _searchCtrl.text = S.of(context)!.searchMyLocation;
        final vehicle = ref.read(selectedVehicleProvider);
        ref.read(workshopSearchProvider.notifier).search(
              lat: position.latitude,
              lng: position.longitude,
              serviceType: widget.serviceType,
              vehicle: vehicle,
              tireDimensionOverride: widget.tireDimensionOverride,
              rearTireDimensionOverride: widget.rearTireDimensionOverride,
            );
      }
    } catch (e) {
      debugPrint('Auto-search location error: $e');
    }
  }

  @override
  void didUpdateWidget(SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.serviceType != oldWidget.serviceType) {
      debugPrint(
          '🔍 [SEARCH] didUpdateWidget: serviceType changed ${oldWidget.serviceType} → ${widget.serviceType}, resetting');
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

    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    AnalyticsService().logSearch(q);
    final isZip = RegExp(r'^\d{5}$').hasMatch(q);
    final vehicle = ref.read(selectedVehicleProvider);
    ref.read(workshopSearchProvider.notifier).search(
          zipCode: isZip ? q : null,
          city: !isZip ? q : null,
          serviceType: widget.serviceType,
          vehicle: vehicle,
          tireDimensionOverride: widget.tireDimensionOverride,
          rearTireDimensionOverride: widget.rearTireDimensionOverride,
        );
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(workshopSearchProvider);
    final serviceName = _serviceLabels(context)[widget.serviceType];

    return Scaffold(
      body: SafeArea(
        bottom: false,
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
                        S.of(context)!.searchFindNearby,
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
                        S.of(context)!.searchWorkshop,
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
                                hintText: S.of(context)!.zipOrCity,
                                prefixIcon: const Icon(Icons.search, size: 20),
                                suffixIcon: IconButton(
                                  icon: const Icon(Icons.my_location, size: 20),
                                  tooltip: S.of(context)!.useLocation,
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
                            child: Text(S.of(context)!.search),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Filters ──
            // Show the filter bar whenever the user has either results OR has
            // already issued a search (so filters like Diagonal / Runflat stay
            // visible even when the current selection produced 0 results and
            // the user needs to deselect them again).
            if (searchState.workshops.isNotEmpty ||
                searchState.hasSearched ||
                searchState.query.isNotEmpty)
              SliverToBoxAdapter(
                  child: _FilterBar(
                      serviceType: searchState.effectiveServiceType ??
                          widget.serviceType)),

            // ── Vehicle auto-selected (no dropdown) ──
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
                              ? _AxleSelectionHintView(
                                  onSelectAxle: (axle) {
                                    final notifier = ref
                                        .read(workshopSearchProvider.notifier);
                                    notifier.setSelectedAxle(axle);
                                    notifier._reSearch();
                                  },
                                )
                              : _EmptyView(
                                  hasSearched: searchState.hasSearched ||
                                      searchState.query.isNotEmpty))
                      : _WorkshopList(
                          workshops: searchState.workshops,
                          serviceType: searchState.effectiveServiceType ??
                              widget.serviceType),
        ),
      ),
    );
  }

  void _useLocation() async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(S.of(context)!.locatingPosition)),
    );

    try {
      final locService = LocationService();
      final position = await locService.getCurrentPosition();

      if (!mounted) return;

      if (position != null) {
        _searchCtrl.text = S.of(context)!.searchMyLocation;
        final vehicle = ref.read(selectedVehicleProvider);
        ref.read(workshopSearchProvider.notifier).search(
              lat: position.latitude,
              lng: position.longitude,
              serviceType: widget.serviceType,
              vehicle: vehicle,
              tireDimensionOverride: widget.tireDimensionOverride,
              rearTireDimensionOverride: widget.rearTireDimensionOverride,
            );
      } else {
        final errorMsg =
            locService.lastError ?? S.of(context)!.locationNotDetermined;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMsg),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: S.of(context)!.searchSettings,
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
          content: Text(S.of(context)!.locationError(e.toString())),
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: S.of(context)!.searchSettings,
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
                          ? S.of(context)!.workshopCountOne
                          : S
                              .of(context)!
                              .workshopCountMany(state.workshops.length),
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
                  label: _sortLabel(context, state.sortBy),
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
              title: S.of(context)!.axleAlignment,
              icon: Icons.straighten,
              defaultPackage: 'measurement_both',
              options: [
                ('measurement_both', S.of(context)!.alignMeasureBoth),
                ('measurement_front', S.of(context)!.alignMeasureFront),
                ('measurement_rear', S.of(context)!.alignMeasureRear),
                ('adjustment_both', S.of(context)!.alignAdjustBoth),
                ('adjustment_front', S.of(context)!.alignAdjustFront),
                ('adjustment_rear', S.of(context)!.alignAdjustRear),
                ('full_service', S.of(context)!.alignFullService),
              ],
              descriptions: {
                'measurement_both': S.of(context)!.alignDescMeasureBoth,
                'measurement_front': S.of(context)!.alignDescMeasureFront,
                'measurement_rear': S.of(context)!.alignDescMeasureRear,
                'adjustment_both': S.of(context)!.alignDescAdjustBoth,
                'adjustment_front': S.of(context)!.alignDescAdjustFront,
                'adjustment_rear': S.of(context)!.alignDescAdjustRear,
                'full_service': S.of(context)!.alignDescFullService,
              },
            ),
          if (serviceType == 'TIRE_REPAIR')
            ServiceToggleFilter(
              state: state,
              notifier: notifier,
              defaultPackage: 'foreign_object',
              options: [
                ('foreign_object', '🔩', S.of(context)!.repairForeignObject),
                ('valve_damage', '🔧', S.of(context)!.repairValveDamage),
              ],
              descriptions: {
                'foreign_object': S.of(context)!.repairDescForeignObject,
                'valve_damage': S.of(context)!.repairDescValveDamage,
              },
            ),
          if (serviceType == 'CLIMATE_SERVICE')
            DropdownServiceFilter(
              state: state,
              notifier: notifier,
              title: S.of(context)!.climateService,
              icon: Icons.ac_unit,
              defaultPackage: 'basic',
              options: [
                ('check', S.of(context)!.climateCheck),
                ('basic', S.of(context)!.climateBasic),
                ('comfort', S.of(context)!.climateComfort),
                ('premium', S.of(context)!.climatePremium),
              ],
              descriptions: {
                'check': S.of(context)!.climateDescCheck,
                'basic': S.of(context)!.climateDescBasic,
                'comfort': S.of(context)!.climateDescComfort,
                'premium': S.of(context)!.climateDescPremium,
              },
            ),
          if (serviceType == 'MOTORCYCLE_TIRE')
            MotorcycleTireFilters(state: state, notifier: notifier),
        ],
      ),
    );
  }

  String _sortLabel(BuildContext context, String sortBy) {
    switch (sortBy) {
      case 'price':
        return S.of(context)!.sortPrice;
      case 'rating':
        return S.of(context)!.sortRating;
      default:
        return S.of(context)!.sortDistance;
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
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Text(S.of(context)!.radius,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 17)),
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
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Text(S.of(context)!.sortBy,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 17)),
            ),
            ...[
              ('distance', S.of(context)!.sortDistance, Icons.near_me),
              ('price', S.of(context)!.sortPrice, Icons.euro),
              ('rating', S.of(context)!.sortRating, Icons.star_border),
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
  final EdgeInsetsGeometry? padding;
  final bool hideBrandDropdown;
  const TireChangeFilters(
      {required this.state,
      required this.notifier,
      this.vehicle,
      this.padding,
      this.hideBrandDropdown = false});

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
      padding: padding ?? const EdgeInsets.fromLTRB(16, 4, 16, 12),
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
                      S.of(context)!.withTires,
                      true)),
              const SizedBox(width: 8),
              Expanded(
                  child: _serviceToggle(
                      context,
                      const Text('🔧', style: TextStyle(fontSize: 14)),
                      S.of(context)!.montageOnly,
                      false)),
            ],
          ),
          // Row 2: Season selection (only when Mit Reifen)
          if (state.includeTires) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                    child: _seasonBadge(
                        context, 's', '☀️', S.of(context)!.tireSummer)),
                const SizedBox(width: 6),
                Expanded(
                    child: _seasonBadge(
                        context, 'w', '❄️', S.of(context)!.tireWinter)),
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
                    child: _optionBadge(context, S.of(context)!.tireCount2,
                        state.tireCount == 2, () => notifier.setTireCount(2))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, S.of(context)!.tireCount4,
                        state.tireCount == 4, () => notifier.setTireCount(4))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, S.of(context)!.disposal,
                        state.withDisposal, () => notifier.toggleDisposal())),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, S.of(context)!.runflat,
                        state.withRunFlat, () => notifier.toggleRunFlat())),
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
                    child: _optionBadge(context, S.of(context)!.tireCount2,
                        state.tireCount == 2, () => notifier.setTireCount(2))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, S.of(context)!.tireCount4,
                        state.tireCount == 4, () => notifier.setTireCount(4))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(context, S.of(context)!.disposal,
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
                        S.of(context)!.frontAxleFull,
                        state.selectedAxle == 'front',
                        () => notifier.setSelectedAxle(
                            state.selectedAxle == 'front' ? null : 'front'))),
                const SizedBox(width: 6),
                Expanded(
                    child: _optionBadge(
                        context,
                        S.of(context)!.rearAxleFull,
                        state.selectedAxle == 'rear',
                        () => notifier.setSelectedAxle(
                            state.selectedAxle == 'rear' ? null : 'rear'))),
              ],
            ),
          ],
          // Tire category selection (only when Mit Reifen)
          if (state.includeTires) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                    child: _categoryBadge(context, '💰',
                        S.of(context)!.categoryCheapest, 'Günstigster')),
                const SizedBox(width: 6),
                Expanded(
                    child: _categoryBadge(
                        context, '👍', S.of(context)!.categoryBest, 'Beliebt')),
                const SizedBox(width: 6),
                Expanded(
                    child: _categoryBadge(context, '⭐',
                        S.of(context)!.categoryPremium, 'Testsieger')),
              ],
            ),
          ],
          // Auto-Mischbereifung: Achs-Set toggle (only when vehicle has different sizes + 4 tires + Mit Reifen)
          if (state.includeTires &&
              _vehicleHasMixedTires &&
              state.tireCount == 4) ...[
            const SizedBox(height: 8),
            _achsSetToggleCar(context),
          ],
          // Brand dropdown (collected from search results) - hidden in workshop detail.
          // Show for Mischbereifung whenever Mit Reifen is active (4 tires OR
          // 2 tires/Einzelachse) so the user can also filter when picking only
          // one axle.
          if (!hideBrandDropdown &&
              state.includeTires &&
              _vehicleHasMixedTires) ...[
            Builder(builder: (ctx) {
              final brands = <String>{};
              for (final w in state.workshops) {
                final fb = w.tireFront?['brand']?.toString();
                if (fb != null && fb.isNotEmpty) brands.add(fb);
                final rb = w.tireRear?['brand']?.toString();
                if (rb != null && rb.isNotEmpty) brands.add(rb);
                for (final rec in w.tireRecommendationsRaw) {
                  final b = rec['brand']?.toString();
                  if (b != null && b.isNotEmpty) brands.add(b);
                }
              }
              final sorted = brands.toList()
                ..sort(
                    (a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
              if (sorted.isEmpty) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _brandDropdownCar(ctx, sorted),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _achsSetToggleCar(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final active = state.requireSameModel;
    return GestureDetector(
      onTap: () => notifier.setRequireSameModel(!active),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: active
              ? const Color(0xFFD97706)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
          border: active
              ? null
              : Border.all(
                  color: isDark
                      ? const Color(0xFF334155)
                      : Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(
              active ? Icons.check_circle : Icons.circle_outlined,
              size: 18,
              color: active
                  ? Colors.white
                  : (isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '⭐ Achs-Set: gleicher Hersteller',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: active
                          ? Colors.white
                          : (isDark
                              ? const Color(0xFFF9FAFB)
                              : Colors.grey[800]),
                    ),
                  ),
                  Text(
                    active
                        ? 'Vorder- und Hinterachse vom gleichen Hersteller (2× VA + 2× HA)'
                        : 'Antippen, um nur Sets vom gleichen Hersteller anzuzeigen',
                    style: TextStyle(
                      fontSize: 10,
                      color: active
                          ? Colors.white70
                          : (isDark
                              ? const Color(0xFF94A3B8)
                              : Colors.grey[600]),
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

  Widget _brandDropdownCar(BuildContext context, List<String> brands) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selected = state.selectedBrand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Icon(Icons.filter_list,
              size: 18,
              color: isDark ? const Color(0xFF94A3B8) : Colors.grey[700]),
          const SizedBox(width: 8),
          Text(
            'Hersteller:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFF9FAFB) : Colors.grey[800],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String?>(
                value: selected,
                isExpanded: true,
                isDense: true,
                hint: Text('Alle (${brands.length})',
                    style: TextStyle(
                      fontSize: 12,
                      color:
                          isDark ? const Color(0xFFCBD5E1) : Colors.grey[700],
                    )),
                items: <DropdownMenuItem<String?>>[
                  DropdownMenuItem<String?>(
                    value: null,
                    child: Text('Alle Hersteller (${brands.length})',
                        style: const TextStyle(fontSize: 12)),
                  ),
                  ...brands.map((b) => DropdownMenuItem<String?>(
                        value: b,
                        child: Text(b, style: const TextStyle(fontSize: 12)),
                      )),
                ],
                onChanged: (val) => notifier.setSelectedBrand(val),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _categoryBadge(
      BuildContext context, String emoji, String label, String category) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final current = state.selectedTireCategory;
    final isActive = current == category;
    return GestureDetector(
      onTap: () => notifier.setTireCategory(isActive ? null : category),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: isActive
              ? (category == 'Günstigster'
                  ? const Color(0xFF16A34A)
                  : category == 'Testsieger'
                      ? const Color(0xFFD97706)
                      : const Color(0xFF0284C7))
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(8),
          border: isActive
              ? null
              : Border.all(
                  color:
                      isDark ? const Color(0xFF334155) : Colors.grey.shade300),
        ),
        alignment: Alignment.center,
        child: Text(
          '$emoji $label',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: isActive
                ? Colors.white
                : (isDark ? const Color(0xFFCBD5E1) : Colors.grey[700]),
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildSeasonWarning(BuildContext context) {
    if (vehicle == null) return const SizedBox.shrink();
    String? warning;
    switch (state.tireSeason) {
      case 'w':
        if (vehicle!.winterTires == null) {
          warning = S.of(context)!.noWinterSize;
        }
      case 'g':
        if (vehicle!.allSeasonTires == null) {
          warning = S.of(context)!.noAllSeasonSize;
        }
      case 's':
        if (vehicle!.summerTires == null) {
          warning = S.of(context)!.noSummerSize;
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
            Text(S.of(context)!.allSeason,
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
  final EdgeInsetsGeometry? padding;

  const DropdownServiceFilter({
    required this.state,
    required this.notifier,
    required this.title,
    required this.icon,
    required this.defaultPackage,
    required this.options,
    required this.descriptions,
    this.padding,
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
      padding: padding ?? const EdgeInsets.fromLTRB(16, 4, 16, 12),
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
  final EdgeInsetsGeometry? padding;

  const ServiceToggleFilter({
    required this.state,
    required this.notifier,
    required this.defaultPackage,
    required this.options,
    required this.descriptions,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selected = state.selectedPackage ?? defaultPackage;
    final desc = descriptions[selected];

    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.fromLTRB(16, 4, 16, 12),
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
  final EdgeInsetsGeometry? padding;
  final bool hideBrandDropdown;

  const MotorcycleTireFilters(
      {required this.state,
      required this.notifier,
      this.padding,
      this.hideBrandDropdown = false});

  @override
  Widget build(BuildContext context) {
    final isBothTires = (state.selectedPackage ?? 'both') == 'both';
    final isFront = (state.selectedPackage ?? 'both') == 'front';
    final isRear = (state.selectedPackage ?? 'both') == 'rear';
    // Collect available brands per axle so the dropdown stays useful regardless
    // of front/rear/both selection. Only keep brands that exist on the
    // selected axle, otherwise filtering by them would yield 0 tires.
    final availableBrands = <String>{};
    if (state.includeTires) {
      for (final w in state.workshops) {
        if (isBothTires || isFront) {
          final fb = w.tireFront?['brand']?.toString();
          if (fb != null && fb.isNotEmpty) availableBrands.add(fb);
        }
        if (isBothTires || isRear) {
          final rb = w.tireRear?['brand']?.toString();
          if (rb != null && rb.isNotEmpty) availableBrands.add(rb);
        }
        for (final rec in w.tireRecommendationsRaw) {
          final axle = rec['axle']?.toString();
          if (isBothTires ||
              (isFront && axle == 'front') ||
              (isRear && axle == 'rear') ||
              axle == null ||
              axle.isEmpty) {
            final b = rec['brand']?.toString();
            if (b != null && b.isNotEmpty) availableBrands.add(b);
          }
        }
      }
    }
    final sortedBrands = availableBrands.toList()
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          // Row 1: Mit Reifen / Nur Montage
          Row(
            children: [
              Expanded(
                  child: _serviceToggle(
                      context,
                      SvgPicture.asset('assets/images/tire_icon.svg',
                          width: 18, height: 18),
                      S.of(context)!.withTires,
                      true)),
              const SizedBox(width: 8),
              Expanded(
                  child: _serviceToggle(
                      context,
                      const Text('🔧', style: TextStyle(fontSize: 14)),
                      S.of(context)!.montageOnly,
                      false)),
            ],
          ),
          const SizedBox(height: 8),
          // Row 2: Vorderreifen / Hinterreifen / Beide Reifen
          Row(
            children: [
              Expanded(
                  child:
                      _tireBadge(context, 'front', S.of(context)!.frontTire)),
              const SizedBox(width: 6),
              Expanded(
                  child: _tireBadge(context, 'rear', S.of(context)!.rearTire)),
              const SizedBox(width: 6),
              Expanded(
                  child: _tireBadge(context, 'both', S.of(context)!.bothTires)),
            ],
          ),
          const SizedBox(height: 8),
          // Row 3: Entsorgung
          Row(
            children: [
              Expanded(
                  child: _optionBadge(context, S.of(context)!.oldTireDisposal,
                      state.withDisposal, () => notifier.toggleDisposal())),
            ],
          ),
          if (!state.includeTires) ...[
            const SizedBox(height: 6),
            _hintBox(context, S.of(context)!.motoOwnTiresHint),
          ],
          // Radial / Diagonal construction filter (only when Mit Reifen)
          if (state.includeTires) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                    child: _constructionBadge(context, S.of(context)!.radial,
                        'radial', S.of(context)!.radialDesc)),
                const SizedBox(width: 6),
                Expanded(
                    child: _constructionBadge(context, S.of(context)!.diagonal,
                        'diagonal', S.of(context)!.diagonalDesc)),
              ],
            ),
          ],
          // Tire category selection (Günstigster / Premium) - no Beste Eigensch. for motorcycle (no EU labels)
          if (state.includeTires) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                    child: _categoryBadge(context, '💰',
                        S.of(context)!.categoryCheapest, 'Günstigster')),
                const SizedBox(width: 6),
                Expanded(
                    child: _categoryBadge(context, '⭐',
                        S.of(context)!.categoryPremium, 'Testsieger')),
              ],
            ),
          ],
          // Achs-Set Toggle (only when 'beide Reifen' + Mit Reifen)
          if (state.includeTires && isBothTires) ...[
            const SizedBox(height: 8),
            _achsSetToggle(context),
          ],
          // Hersteller-Dropdown (immer sichtbar bei Mit Reifen, gefiltert nach gewählter Achse)
          if (!hideBrandDropdown &&
              state.includeTires &&
              sortedBrands.isNotEmpty) ...[
            const SizedBox(height: 8),
            _brandDropdown(context, sortedBrands),
          ],
          // Hint: Preise gelten nur für ausgebaute Räder
          const SizedBox(height: 8),
          _hintBox(context,
              '💡 Preise gelten nur für Räder im ausgebauten Zustand.'),
        ],
      ),
    );
  }

  Widget _achsSetToggle(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final active = state.requireSameModel;
    return GestureDetector(
      onTap: () => notifier.setRequireSameModel(!active),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: active
              ? const Color(0xFFD97706)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
          border: active
              ? null
              : Border.all(
                  color: isDark
                      ? const Color(0xFF334155)
                      : Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(
              active ? Icons.check_circle : Icons.circle_outlined,
              size: 18,
              color: active
                  ? Colors.white
                  : (isDark ? const Color(0xFF94A3B8) : Colors.grey[600]),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '⭐ Achs-Set: gleicher Hersteller & Modell',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: active
                          ? Colors.white
                          : (isDark
                              ? const Color(0xFFF9FAFB)
                              : Colors.grey[800]),
                    ),
                  ),
                  Text(
                    active
                        ? 'Vorder- und Hinterreifen werden als Set angezeigt'
                        : 'Antippen, um Vorder- und Hinterreifen zu kombinieren',
                    style: TextStyle(
                      fontSize: 10,
                      color: active
                          ? Colors.white70
                          : (isDark
                              ? const Color(0xFF94A3B8)
                              : Colors.grey[600]),
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

  Widget _brandDropdown(BuildContext context, List<String> brands) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selected = state.selectedBrand;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: isDark ? const Color(0xFF334155) : Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Icon(Icons.filter_list,
              size: 18,
              color: isDark ? const Color(0xFF94A3B8) : Colors.grey[700]),
          const SizedBox(width: 8),
          Text(
            'Hersteller:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFF9FAFB) : Colors.grey[800],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String?>(
                value: selected,
                isExpanded: true,
                isDense: true,
                hint: Text('Alle (${brands.length})',
                    style: TextStyle(
                      fontSize: 12,
                      color:
                          isDark ? const Color(0xFFCBD5E1) : Colors.grey[700],
                    )),
                items: <DropdownMenuItem<String?>>[
                  DropdownMenuItem<String?>(
                    value: null,
                    child: Text('Alle Hersteller (${brands.length})',
                        style: const TextStyle(fontSize: 12)),
                  ),
                  ...brands.map((b) => DropdownMenuItem<String?>(
                        value: b,
                        child:
                            Text(b, style: const TextStyle(fontSize: 12)),
                      )),
                ],
                onChanged: (val) => notifier.setSelectedBrand(val),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _constructionBadge(
      BuildContext context, String label, String value, String subtitle) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isActive = state.tireConstruction == value;
    return GestureDetector(
      onTap: () => notifier.setTireConstruction(isActive ? null : value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(0xFF0284C7)
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
          border: isActive
              ? null
              : Border.all(
                  color:
                      isDark ? const Color(0xFF334155) : Colors.grey.shade300),
        ),
        alignment: Alignment.center,
        child: Column(
          children: [
            Text(
              '🏍️ $label',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive
                    ? Colors.white
                    : (isDark ? const Color(0xFFF9FAFB) : Colors.grey[800]),
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 9,
                color: isActive
                    ? Colors.white70
                    : (isDark ? const Color(0xFF94A3B8) : Colors.grey[500]),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _categoryBadge(
      BuildContext context, String emoji, String label, String category) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final current = state.selectedTireCategory;
    final isActive = current == category;
    return GestureDetector(
      onTap: () => notifier.setTireCategory(isActive ? null : category),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: isActive
              ? (category == 'Günstigster'
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFD97706))
              : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(8),
          border: isActive
              ? null
              : Border.all(
                  color:
                      isDark ? const Color(0xFF334155) : Colors.grey.shade300),
        ),
        alignment: Alignment.center,
        child: Text(
          '$emoji $label',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: isActive
                ? Colors.white
                : (isDark ? const Color(0xFFCBD5E1) : Colors.grey[700]),
          ),
          textAlign: TextAlign.center,
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
  final EdgeInsetsGeometry? padding;

  const WheelChangeFilters(
      {required this.state,
      required this.notifier,
      this.serviceDetail,
      this.padding});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Determine if workshop supports each option (check prices, not boolean flags)
    final supportsBalancing =
        serviceDetail == null || serviceDetail!.balancingPrice != null;
    final supportsStorage =
        serviceDetail == null || serviceDetail!.storagePrice != null;
    final supportsWashing =
        serviceDetail == null || serviceDetail!.washingPrice != null;

    final badges = <Widget>[
      Expanded(
          child: _badge(context, isDark, '⚖️', S.of(context)!.balancing,
              state.withBalancing, supportsBalancing, () {
        if (supportsBalancing) notifier.toggleBalancing();
      })),
      const SizedBox(width: 6),
      Expanded(
          child: _badge(context, isDark, '📦', S.of(context)!.storage,
              state.withStorage, supportsStorage, () {
        if (supportsStorage) notifier.toggleStorage();
      })),
      const SizedBox(width: 6),
      Expanded(
          child: _badge(context, isDark, '🧼', S.of(context)!.washing,
              state.withWashing, supportsWashing, () {
        if (supportsWashing) notifier.toggleWashing();
      })),
    ];

    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              S.of(context)!.additionalOptions,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isDark ? const Color(0xFF94A3B8) : Colors.grey[600],
              ),
            ),
          ),
          Row(children: badges),
        ],
      ),
    );
  }

  Widget _badge(BuildContext context, bool isDark, String emoji, String label,
      bool selected, bool supported, VoidCallback onTap) {
    return GestureDetector(
      onTap: supported
          ? onTap
          : () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(S.of(context)!.serviceNotOffered(label)),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
      child: Opacity(
        opacity: supported ? 1.0 : 0.4,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected && supported
                ? const Color(0xFF0284C7)
                : (isDark ? const Color(0xFF1E293B) : Colors.grey.shade100),
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(emoji, style: const TextStyle(fontSize: 13)),
                  const SizedBox(width: 4),
                  Text(label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected && supported
                            ? Colors.white
                            : (isDark
                                ? const Color(0xFFF9FAFB)
                                : Colors.grey[800]),
                      )),
                ],
              ),
              if (!supported) ...[
                const SizedBox(height: 2),
                Text(S.of(context)!.notAvailable,
                    style: TextStyle(
                      fontSize: 9,
                      color:
                          isDark ? const Color(0xFF94A3B8) : Colors.grey[500],
                    )),
              ],
            ],
          ),
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
      'w' => S.of(context)!.winterTiresLabel,
      'g' => S.of(context)!.allSeasonTiresLabel,
      _ => S.of(context)!.summerTiresLabel,
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
              S.of(context)!.missingTireSizeTitle(seasonName),
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              S.of(context)!.missingTireSizeDesc(seasonName),
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
                  label: Text(S.of(context)!.storeTireSizeButton(seasonName)),
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
  final void Function(String axle) onSelectAxle;
  const _AxleSelectionHintView({required this.onSelectAxle});

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
              S.of(context)!.axleSelect,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              S.of(context)!.axleSelectDesc,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF94A3B8)
                      : Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => onSelectAxle('front'),
                    icon: const Icon(Icons.arrow_back, size: 18),
                    label: Text(S.of(context)!.frontAxleFull),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => onSelectAxle('rear'),
                    icon: const Icon(Icons.arrow_forward, size: 18),
                    label: Text(S.of(context)!.rearAxleFull),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0891B2),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
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
                  ? S.of(context)!.noWorkshopsFound
                  : S.of(context)!.searchForWorkshops,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              hasSearched
                  ? S.of(context)!.tryDifferentSearch
                  : S.of(context)!.searchForWorkshopsDesc,
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

  static String _translateError(BuildContext context, String error) {
    final l = S.of(context)!;
    switch (error) {
      case 'error_service_car_only':
        return l.errorServiceCarOnly;
      case 'error_need_motorcycle':
        return l.errorNeedMotorcycle;
      case 'error_trailer_tire_only':
        return l.errorTrailerTireOnly;
      case 'error_location_failed':
        return l.errorLocationFailed;
      case 'error_search_failed':
        return l.errorSearchFailed;
      default:
        return error;
    }
  }

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
            Text(_translateError(context, message),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _WorkshopList extends ConsumerWidget {
  final List<Workshop> workshops;
  final String? serviceType;
  const _WorkshopList({required this.workshops, this.serviceType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedBrand = ref.watch(workshopSearchProvider).selectedBrand;
    final filtered = (selectedBrand == null || selectedBrand.isEmpty)
        ? workshops
        : workshops.where((w) {
            final needle = selectedBrand.toLowerCase();
            final fb = w.tireFront?['brand']?.toString().toLowerCase();
            if (fb == needle) return true;
            final rb = w.tireRear?['brand']?.toString().toLowerCase();
            if (rb == needle) return true;
            return w.tireRecommendationsRaw.any((r) =>
                r['brand']?.toString().toLowerCase() == needle);
          }).toList();
    return ListView.separated(
      // Extra bottom space so last card is never hidden behind floating tab bar.
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 124),
      itemCount: filtered.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) =>
          _WorkshopCard(workshop: filtered[index], serviceType: serviceType),
    );
  }
}

class _WorkshopCard extends ConsumerWidget {
  final Workshop workshop;
  final String? serviceType;
  const _WorkshopCard({required this.workshop, this.serviceType});

  static Map<String, String> _serviceLabels(BuildContext context) => {
        'TIRE_CHANGE': S.of(context)!.tireChange,
        'WHEEL_CHANGE': S.of(context)!.wheelChange,
        'TIRE_REPAIR': S.of(context)!.tireRepair,
        'MOTORCYCLE_TIRE': S.of(context)!.motorcycleTireChange,
        'ALIGNMENT_BOTH': S.of(context)!.axleAlignment,
        'CLIMATE_SERVICE': S.of(context)!.climateService,
        'BRAKE_SERVICE': S.of(context)!.brakeService,
        'BATTERY_SERVICE': S.of(context)!.batteryService,
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

  static String _packageLabel(
      BuildContext context, String serviceType, String? pkg) {
    final s = S.of(context)!;
    final labels = {
      'measurement_front': s.pkgMeasureFront,
      'measurement_rear': s.pkgMeasureRear,
      'measurement_both': s.pkgMeasureBoth,
      'adjustment_front': s.pkgAdjustFront,
      'adjustment_rear': s.pkgAdjustRear,
      'adjustment_both': s.pkgAdjustBoth,
      'full_service': s.pkgFullService,
      'foreign_object': s.pkgForeignObject,
      'valve_damage': s.pkgValveDamage,
      'check': s.pkgClimateCheck,
      'basic': s.pkgBasicService,
      'with_balancing': s.balancing,
      'with_storage': s.storage,
      'with_washing': s.washing,
      'comfort': s.pkgComfortService,
      'premium': s.pkgPremiumService,
      'front': s.pkgFrontWheel,
      'rear': s.pkgRearWheel,
      'both': s.pkgBothWheels,
      'four_tires': s.pkgMontage4,
      'two_tires': s.pkgMontage2,
    };
    return labels[pkg] ?? _serviceLabels(context)[serviceType] ?? 'Service';
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

    // Resolve selected tire category recommendation using filterByCategory
    Map<String, dynamic>? selectedRec;
    Map<String, dynamic>? selectedFrontRec;
    Map<String, dynamic>? selectedRearRec;
    if ((isTireChange || isMotorcycleTire) &&
        workshop.tireRecommendationsRaw.isNotEmpty) {
      final category = searchState.selectedTireCategory;
      final aiArticleId = searchState.aiArticleId;
      final aiRearArticleId = searchState.aiRearArticleId;
      final hasFrontRear = workshop.tireRecommendationsRaw
          .any((r) => r['axle'] == 'front' || r['axle'] == 'rear');
      if (hasFrontRear) {
        // Mischbereifung / Motorcycle: filter per axle
        var frontRecs = workshop.tireRecommendationsRaw
            .where((r) => r['axle'] == 'front')
            .map((r) => TireRecommendation.fromJson(r))
            .toList();
        var rearRecs = workshop.tireRecommendationsRaw
            .where((r) => r['axle'] == 'rear')
            .map((r) => TireRecommendation.fromJson(r))
            .toList();

        // Apply brand filter (Hersteller-Dropdown) before picking.
        // Applies whenever a brand is selected (motorcycle OR car Mischbereifung,
        // both with and without Achs-Set).
        final brandFilter = searchState.selectedBrand;
        final brandFilterApplies = brandFilter != null &&
            brandFilter.isNotEmpty &&
            (isMotorcycleTire || isTireChange);
        if (brandFilterApplies) {
          final needle = brandFilter.toLowerCase();
          final filteredFront =
              frontRecs.where((t) => t.brand.toLowerCase() == needle).toList();
          final filteredRear =
              rearRecs.where((t) => t.brand.toLowerCase() == needle).toList();
          if (filteredFront.isNotEmpty) frontRecs = filteredFront;
          if (filteredRear.isNotEmpty) rearRecs = filteredRear;
        }

        // Achs-Set: pick coordinated pair so VA+HA share brand (and model for moto).
        // Motorcycle: brand+model match required (sameModel).
        // Car Mischbereifung: brand-only match (sameBrand) — different models per axle allowed.
        final isCarAchsSet = isTireChange && searchState.requireSameModel;
        final isMotoAchsSet = isMotorcycleTire && searchState.requireSameModel;
        if ((isMotoAchsSet || isCarAchsSet) &&
            frontRecs.isNotEmpty &&
            rearRecs.isNotEmpty) {
          final rearByKey = <String, TireRecommendation>{};
          String keyOf(TireRecommendation t) =>
              '${t.brand.toLowerCase()}|${t.model.toLowerCase()}';
          for (final r in rearRecs) {
            final key = keyOf(r);
            final existing = rearByKey[key];
            if (existing == null || r.totalPrice < existing.totalPrice) {
              rearByKey[key] = r;
            }
          }
          final candidateFront = filterByCategory(frontRecs, category);
          final pool = candidateFront.isNotEmpty ? candidateFront : frontRecs;
          TireRecommendation? bestFront;
          TireRecommendation? bestRear;
          double bestSum = double.infinity;
          for (final f in pool) {
            final r = rearByKey[keyOf(f)];
            if (r == null) continue;
            final sum = f.totalPrice + r.totalPrice;
            if (sum < bestSum) {
              bestSum = sum;
              bestFront = f;
              bestRear = r;
            }
          }
          if (bestFront != null && bestRear != null) {
            frontRecs = [bestFront];
            rearRecs = [bestRear];
          }
        }

        // Front: prefer AI-recommended tire
        TireRecommendation? chosenFront;
        if (aiArticleId != null && aiArticleId.isNotEmpty) {
          final match = frontRecs.where((t) => t.articleId == aiArticleId);
          if (match.isNotEmpty) chosenFront = match.first;
        }
        if (chosenFront == null && searchState.aiFrontBrand != null) {
          final match = frontRecs.where((t) =>
              t.brand.toLowerCase() ==
                  searchState.aiFrontBrand!.toLowerCase() &&
              t.model.toLowerCase() ==
                  (searchState.aiFrontModel ?? '').toLowerCase());
          if (match.isNotEmpty) chosenFront = match.first;
        }
        if (chosenFront == null) {
          final filtered = filterByCategory(frontRecs, category);
          if (filtered.isNotEmpty) chosenFront = filtered.first;
        }
        chosenFront ??= frontRecs.isNotEmpty ? frontRecs.first : null;

        // Rear: prefer AI-recommended tire
        TireRecommendation? chosenRear;
        if (aiRearArticleId != null && aiRearArticleId.isNotEmpty) {
          final match = rearRecs.where((t) => t.articleId == aiRearArticleId);
          if (match.isNotEmpty) chosenRear = match.first;
        }
        if (chosenRear == null && searchState.aiRearBrand != null) {
          final match = rearRecs.where((t) =>
              t.brand.toLowerCase() == searchState.aiRearBrand!.toLowerCase() &&
              t.model.toLowerCase() ==
                  (searchState.aiRearModel ?? '').toLowerCase());
          if (match.isNotEmpty) chosenRear = match.first;
        }
        if (chosenRear == null) {
          final filtered = filterByCategory(rearRecs, category);
          if (filtered.isNotEmpty) chosenRear = filtered.first;
        }
        chosenRear ??= rearRecs.isNotEmpty ? rearRecs.first : null;

        final bool hasFrontAi =
            aiArticleId != null && chosenFront?.articleId == aiArticleId;
        final bool hasRearAi =
            aiRearArticleId != null && chosenRear?.articleId == aiRearArticleId;
        final bool hasFrontBrandMatch = searchState.aiFrontBrand != null &&
            chosenFront?.brand.toLowerCase() ==
                searchState.aiFrontBrand?.toLowerCase();
        final bool hasRearBrandMatch = searchState.aiRearBrand != null &&
            chosenRear?.brand.toLowerCase() ==
                searchState.aiRearBrand?.toLowerCase();

        if (chosenFront != null) {
          selectedFrontRec = {
            'brand': chosenFront.brand,
            'model': chosenFront.model,
            'articleId': chosenFront.articleId,
            'pricePerTire': chosenFront.pricePerTire,
            'totalPrice': chosenFront.totalPrice,
            'quantity': chosenFront.quantity,
            'label': (hasFrontAi || hasFrontBrandMatch)
                ? S.of(context)!.aiRecommendation
                : (category ?? chosenFront.label),
            'dimensions': chosenFront.dimensions,
          };
        }
        if (chosenRear != null) {
          selectedRearRec = {
            'brand': chosenRear.brand,
            'model': chosenRear.model,
            'articleId': chosenRear.articleId,
            'pricePerTire': chosenRear.pricePerTire,
            'totalPrice': chosenRear.totalPrice,
            'quantity': chosenRear.quantity,
            'label': (hasRearAi || hasRearBrandMatch)
                ? S.of(context)!.aiRecommendation
                : (category ?? chosenRear.label),
            'dimensions': chosenRear.dimensions,
          };
        }
      } else {
        // Single tire: prefer AI-recommended tire by articleId if available
        final allRecs = workshop.tireRecommendationsRaw
            .map((r) => TireRecommendation.fromJson(r))
            .toList();

        TireRecommendation? chosen;
        // 1) Match by articleId from AI recommendation
        if (aiArticleId != null && aiArticleId.isNotEmpty) {
          final match = allRecs.where((t) => t.articleId == aiArticleId);
          if (match.isNotEmpty) chosen = match.first;
        }
        // 2) Fallback to category filter
        if (chosen == null) {
          final filtered = filterByCategory(allRecs, category);
          if (filtered.isNotEmpty) chosen = filtered.first;
        }
        // 3) Fallback to first available
        chosen ??= allRecs.isNotEmpty ? allRecs.first : null;

        if (chosen != null) {
          final t = chosen;
          selectedRec = {
            'brand': t.brand,
            'model': t.model,
            'pricePerTire': t.pricePerTire,
            'totalPrice': t.totalPrice,
            'quantity': t.quantity,
            'label': aiArticleId != null && t.articleId == aiArticleId
                ? S.of(context)!.aiRecommendation
                : (category ?? t.label),
            'articleId': t.articleId,
            'dimensions': t.dimensions,
            'loadIndex': t.loadIndex,
            'speedIndex': t.speedIndex,
          };
        }
      }
    }

    if (isTireChange && workshop.tireAvailable) {
      // Tire search API already computed prices (includeTires is always true here)
      if (workshop.searchTotalPrice != null) {
        // Check for Mischbereifung (front/rear different tires)
        final hasFrontRear =
            workshop.tireFront != null || workshop.tireRear != null;
        if (hasFrontRear) {
          // Use category-filtered front/rear recs if available
          final fRec = selectedFrontRec ?? workshop.tireFront;
          final rRec = selectedRearRec ?? workshop.tireRear;
          // Recompute total from filtered tires
          double computed = workshop.searchBasePrice ?? 0;
          if (workshop.searchBasePrice != null) {
            breakdown[S.of(context)!.montageLabel] = workshop.searchBasePrice!;
          }
          if (fRec != null) {
            final fBrand = fRec['brand'] ?? '';
            final fPrice = (fRec['totalPrice'] as num?)?.toDouble() ?? 0;
            final fQty = (fRec['quantity'] as num?)?.toInt() ?? 2;
            final fPerTire = (fRec['pricePerTire'] as num?)?.toDouble();
            computed += fPrice;
            breakdown[
                    'VA: $fQty× $fBrand à ${fPerTire?.toStringAsFixed(2) ?? "-"}€'] =
                fPrice;
          }
          if (rRec != null) {
            final rBrand = rRec['brand'] ?? '';
            final rPrice = (rRec['totalPrice'] as num?)?.toDouble() ?? 0;
            final rQty = (rRec['quantity'] as num?)?.toInt() ?? 2;
            final rPerTire = (rRec['pricePerTire'] as num?)?.toDouble();
            computed += rPrice;
            breakdown[
                    'HA: $rQty× $rBrand à ${rPerTire?.toStringAsFixed(2) ?? "-"}€'] =
                rPrice;
          }
          if (workshop.disposalFeeApplied != null &&
              workshop.disposalFeeApplied! > 0)
            computed += workshop.disposalFeeApplied!;
          if (workshop.runFlatSurchargeApplied != null &&
              workshop.runFlatSurchargeApplied! > 0)
            computed += workshop.runFlatSurchargeApplied!;
          totalPrice = computed;
        } else {
          // Single tire: use selected category recommendation
          final recPricePerTire =
              (selectedRec?['pricePerTire'] as num?)?.toDouble();
          final recQty = (selectedRec?['quantity'] as num?)?.toInt() ??
              workshop.tireQuantity ??
              searchState.tireCount;
          final recBrand = selectedRec?['brand']?.toString() ??
              workshop.tireBrand ??
              S.of(context)!.tiresFallback;
          final recTireTotal = recPricePerTire != null
              ? recPricePerTire * recQty
              : workshop.tirePrice;

          double computed = workshop.searchBasePrice ?? 0;
          computed += recTireTotal;
          if (workshop.disposalFeeApplied != null &&
              workshop.disposalFeeApplied! > 0)
            computed += workshop.disposalFeeApplied!;
          if (workshop.runFlatSurchargeApplied != null &&
              workshop.runFlatSurchargeApplied! > 0)
            computed += workshop.runFlatSurchargeApplied!;
          totalPrice = computed;

          if (workshop.searchBasePrice != null) {
            breakdown[S.of(context)!.montageLabel] = workshop.searchBasePrice!;
          }
          if (recTireTotal > 0) {
            breakdown[
                    '$recQty× $recBrand à ${recPricePerTire?.toStringAsFixed(2) ?? "-"}€'] =
                recTireTotal;
          }
        }
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown[S.of(context)!.oldTireDisposalLabel] =
              workshop.disposalFeeApplied!;
        }
        if (workshop.runFlatSurchargeApplied != null &&
            workshop.runFlatSurchargeApplied! > 0) {
          breakdown[S.of(context)!.runflatSurcharge] =
              workshop.runFlatSurchargeApplied!;
        }
      }
    } else if (isMotorcycleTire && workshop.tireAvailable) {
      // Motorcycle tire pricing with front/rear (use category-filtered recs)
      if (workshop.searchTotalPrice != null) {
        final fRec = selectedFrontRec ??
            (workshop.tireFront != null
                ? Map<String, dynamic>.from(workshop.tireFront!)
                : null);
        final rRec = selectedRearRec ??
            (workshop.tireRear != null
                ? Map<String, dynamic>.from(workshop.tireRear!)
                : null);
        double computed = workshop.searchBasePrice ?? 0;
        if (workshop.searchBasePrice != null) {
          breakdown[S.of(context)!.montageLabel] = workshop.searchBasePrice!;
        }
        // Front tire
        if (fRec != null) {
          final fBrand = fRec['brand'] ?? '';
          final fPrice = (fRec['totalPrice'] as num?)?.toDouble() ?? 0;
          final fQty = (fRec['quantity'] as num?)?.toInt() ?? 1;
          final fPerTire = (fRec['pricePerTire'] as num?)?.toDouble();
          computed += fPrice;
          breakdown[
                  'VR: $fQty× $fBrand à ${fPerTire?.toStringAsFixed(2) ?? "-"}€'] =
              fPrice;
        }
        // Rear tire
        if (rRec != null) {
          final rBrand = rRec['brand'] ?? '';
          final rPrice = (rRec['totalPrice'] as num?)?.toDouble() ?? 0;
          final rQty = (rRec['quantity'] as num?)?.toInt() ?? 1;
          final rPerTire = (rRec['pricePerTire'] as num?)?.toDouble();
          computed += rPrice;
          breakdown[
                  'HR: $rQty× $rBrand à ${rPerTire?.toStringAsFixed(2) ?? "-"}€'] =
              rPrice;
        }
        // Flat tire info fallback
        if (fRec == null && rRec == null && workshop.tirePrice > 0) {
          final qty = workshop.tireQuantity ?? 2;
          computed += workshop.tirePrice;
          breakdown[
                  '$qty× ${workshop.tireBrand ?? "Reifen"} à ${workshop.tirePricePerTire?.toStringAsFixed(2) ?? "-"}€'] =
              workshop.tirePrice;
        }
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          computed += workshop.disposalFeeApplied!;
          breakdown[S.of(context)!.oldTireDisposalLabel] =
              workshop.disposalFeeApplied!;
        }
        totalPrice = computed;
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
            breakdown[S.of(context)!.wheelChange] = baseRw;
          }
          final balSurcharge = (wcb['balancingSurcharge'] as num?)?.toDouble();
          if (searchState.withBalancing &&
              balSurcharge != null &&
              balSurcharge > 0) {
            breakdown[S.of(context)!.balancing] = balSurcharge;
          }
          final stoSurcharge = (wcb['storageSurcharge'] as num?)?.toDouble();
          if (searchState.withStorage &&
              stoSurcharge != null &&
              stoSurcharge > 0) {
            breakdown[S.of(context)!.storage] = stoSurcharge;
          }
          final washSurcharge = (wcb['washingSurcharge'] as num?)?.toDouble();
          if (searchState.withWashing &&
              washSurcharge != null &&
              washSurcharge > 0) {
            breakdown[S.of(context)!.wheelWash] = washSurcharge;
          }
        } else {
          // Fallback: try workshop.pricing
          final baseRw =
              workshop.pricing?.basePrice4 ?? workshop.pricing?.basePrice;
          if (baseRw != null && baseRw > 0) {
            breakdown[S.of(context)!.wheelChange] = baseRw;
          }
          if (searchState.withBalancing &&
              workshop.pricing?.balancingPrice != null) {
            final balancingTotal = workshop.pricing!.balancingPrice! * 4;
            breakdown[S.of(context)!.balancing4Wheels] = balancingTotal;
          }
          if (searchState.withStorage &&
              workshop.pricing?.storagePrice != null) {
            breakdown[S.of(context)!.storage] = workshop.pricing!.storagePrice!;
          }
          if (searchState.withWashing &&
              workshop.pricing?.washingPrice != null) {
            breakdown[S.of(context)!.wheelWash] =
                workshop.pricing!.washingPrice!;
          }
        }
        // If nothing could be broken down, show the total as single line
        if (breakdown.isEmpty && totalPrice != null) {
          breakdown[S.of(context)!.wheelChange] = totalPrice!;
        }
      } else if (serviceType == 'MOTORCYCLE_TIRE') {
        // Motorcycle "Nur Montage": break down into montage + extras
        final motoBase = workshop.pricing?.tireChangePriceMotorcycle ??
            workshop.searchBasePrice!;
        breakdown[S.of(context)!.montageLabel] = motoBase;
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown[S.of(context)!.oldTireDisposalLabel] =
              workshop.disposalFeeApplied!;
        }
        // If total is higher, show remaining as additional services
        if (totalPrice != null) {
          final brokenDown = breakdown.values.fold(0.0, (a, b) => a + b);
          if (totalPrice! > brokenDown + 0.01) {
            breakdown[S.of(context)!.extraServices] = totalPrice! - brokenDown;
          }
        }
      } else if (serviceType == 'TIRE_CHANGE' && !searchState.includeTires) {
        // TIRE_CHANGE "Nur Montage": combine montage + surcharge into one "Montage" line
        double montageTotal = workshop.searchBasePrice!;
        if (workshop.mountingOnlySurchargeApplied != null &&
            workshop.mountingOnlySurchargeApplied! > 0) {
          montageTotal += workshop.mountingOnlySurchargeApplied!;
        }
        breakdown[S.of(context)!.montageLabel] = montageTotal;
        if (workshop.disposalFeeApplied != null &&
            workshop.disposalFeeApplied! > 0) {
          breakdown[S.of(context)!.oldTireDisposalLabel] =
              workshop.disposalFeeApplied!;
        }
        if (workshop.runFlatSurchargeApplied != null &&
            workshop.runFlatSurchargeApplied! > 0) {
          breakdown[S.of(context)!.runflatSurcharge] =
              workshop.runFlatSurchargeApplied!;
        }
      } else {
        breakdown[_packageLabel(
                context, serviceType!, searchState.selectedPackage)] =
            workshop.searchBasePrice!;
        // Show add-on breakdown (already included in server totalPrice)
        if (searchState.withBalancing &&
            workshop.pricing?.balancingPrice != null) {
          final balancingTotal = workshop.pricing!.balancingPrice! * 4;
          breakdown[S.of(context)!.balancing4Wheels] = balancingTotal;
        }
        if (searchState.withStorage && workshop.pricing?.storagePrice != null) {
          breakdown[S.of(context)!.storage] = workshop.pricing!.storagePrice!;
        }
        if (searchState.withWashing && workshop.pricing?.washingPrice != null) {
          breakdown[S.of(context)!.wheelWash] = workshop.pricing!.washingPrice!;
        }
      }
    } else {
      // Regular pricing
      final basePrice =
          workshop.pricing?.basePrice ?? workshop.pricing?.lowestPrice;
      if (hasVehicle && basePrice != null) {
        breakdown[S.of(context)!.baseLabel] = basePrice;
        var runningTotal = basePrice;
        if (searchState.withBalancing &&
            workshop.pricing?.balancingPrice != null) {
          final balancingTotal = workshop.pricing!.balancingPrice! * 4;
          breakdown[S.of(context)!.balancing4Wheels] = balancingTotal;
          runningTotal += balancingTotal;
        }
        if (searchState.withStorage && workshop.pricing?.storagePrice != null) {
          breakdown[S.of(context)!.storage] = workshop.pricing!.storagePrice!;
          runningTotal += workshop.pricing!.storagePrice!;
        }
        if (searchState.withWashing && workshop.pricing?.washingPrice != null) {
          breakdown[S.of(context)!.wheelWash] = workshop.pricing!.washingPrice!;
          runningTotal += workshop.pricing!.washingPrice!;
        }
        totalPrice = runningTotal;
      }
    }

    final hasBreakdown = breakdown.length > 1;
    final hasAnyBreakdown =
        breakdown.isNotEmpty; // for post-API services show even single entry
    // Achs-Set detection (motorcycle): both selected, sameModel, brand+model identical
    bool isMotorcycleAchsSet = false;
    if (isMotorcycleTire && workshop.tireAvailable) {
      final dispFront = selectedFrontRec ?? workshop.tireFront;
      final dispRear = selectedRearRec ?? workshop.tireRear;
      final fBrand = dispFront?['brand']?.toString().toLowerCase() ?? '';
      final fModel = dispFront?['model']?.toString().toLowerCase() ?? '';
      final rBrand = dispRear?['brand']?.toString().toLowerCase() ?? '';
      final rModel = dispRear?['model']?.toString().toLowerCase() ?? '';
      isMotorcycleAchsSet = searchState.requireSameModel &&
          (searchState.selectedPackage ?? 'both') == 'both' &&
          dispFront != null &&
          dispRear != null &&
          fBrand.isNotEmpty &&
          fBrand == rBrand &&
          fModel == rModel;
    }
    // For search cards, prefer reliable images (card/logo) over heroImage
    // which may reference deleted files from landing pages
    final img =
        workshop.cardImageUrl ?? workshop.profileImage ?? workshop.heroImage;
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
          // Use selected category recommendation's brand/model/articleId
          if (selectedFrontRec != null || selectedRearRec != null) {
            // Mixed/motorcycle: pass front and rear tire data separately
            if (selectedFrontRec != null) {
              final fb = selectedFrontRec['brand']?.toString();
              final fm = selectedFrontRec['model']?.toString();
              final fa = selectedFrontRec['articleId']?.toString();
              if (fb != null) qp['tireBrand'] = fb;
              if (fm != null) qp['tireModel'] = fm;
              if (fa != null && fa.isNotEmpty) qp['articleId'] = fa;
            }
            if (selectedRearRec != null) {
              final rb = selectedRearRec['brand']?.toString();
              final rm = selectedRearRec['model']?.toString();
              final ra = selectedRearRec['articleId']?.toString();
              if (rb != null) qp['rearTireBrand'] = rb;
              if (rm != null) qp['rearTireModel'] = rm;
              if (ra != null && ra.isNotEmpty) qp['rearArticleId'] = ra;
            }
          } else {
            final recBrand =
                selectedRec?['brand']?.toString() ?? workshop.tireBrand;
            final recModel =
                selectedRec?['model']?.toString() ?? workshop.tireModel;
            final recArticleId = selectedRec?['articleId']?.toString();
            if (recBrand != null) qp['tireBrand'] = recBrand;
            if (recModel != null) qp['tireModel'] = recModel;
            if (recArticleId != null && recArticleId.isNotEmpty)
              qp['articleId'] = recArticleId;
          }
          debugPrint('🔗 [WORKSHOP-NAV] passing qp: $qp');
          final uri = Uri(
            path: '/search/workshop/${workshop.id}',
            queryParameters: qp.isNotEmpty ? qp : null,
          );
          debugPrint('🔗 [WORKSHOP-NAV] uri: ${uri.toString()}');
          context.push(uri.toString(), extra: qp);
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image section ──
            SizedBox(
              height: MediaQuery.of(context).size.width > 500 ? 220 : 160,
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
                                  ? S.of(context)!.totalWithPrice(
                                      totalPrice.toStringAsFixed(2))
                                  : workshop.tireAvailable
                                      ? S.of(context)!.tiresAvailable
                                      : S.of(context)!.noTiresLabel)
                              : totalPrice != null
                                  ? S
                                      .of(context)!
                                      .fixedPrice(totalPrice.toStringAsFixed(2))
                                  : (isPostApiService
                                      ? S.of(context)!.notAvailable
                                      : S.of(context)!.priceOnRequest),
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
                            ' ${S.of(context)!.reviewsCountLabel(workshop.reviewCount ?? 0)}',
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 12),
                          ),
                        ],
                      ),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: const Color(0xFF0284C7)
                                  .withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.fiber_new,
                                size: 16, color: Color(0xFF0284C7)),
                            const SizedBox(width: 4),
                            Text(
                              S.of(context)!.newBadge,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: Color(0xFF0284C7),
                              ),
                            ),
                          ],
                        ),
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
                      if (!hasFrontRear && selectedRec != null) {
                        tireDimStr = selectedRec['dimensions']?.toString();
                      }

                      if (hasFrontRear) {
                        // Mischbereifung: TWO separate containers for VA and HA
                        // Use category-filtered recs if available
                        final displayFront =
                            selectedFrontRec ?? workshop.tireFront;
                        final displayRear =
                            selectedRearRec ?? workshop.tireRear;
                        return Column(
                          children: [
                            // VA (Front) container
                            if (displayFront != null) ...[
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
                                    if (displayFront['label'] != null &&
                                        (displayFront['label'] as String)
                                            .isNotEmpty)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 4),
                                        child: _TireCategoryBadge(
                                            label: displayFront['label']
                                                as String),
                                      ),
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
                                            '${displayFront['brand'] ?? ''} ${displayFront['model'] ?? ''}',
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (displayFront['dimensions'] != null)
                                      Padding(
                                        padding: const EdgeInsets.only(
                                            left: 46, top: 2),
                                        child: Text(
                                            displayFront['dimensions']
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
                            if (displayRear != null) ...[
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
                                    if (displayRear['label'] != null &&
                                        (displayRear['label'] as String)
                                            .isNotEmpty)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 4),
                                        child: _TireCategoryBadge(
                                            label:
                                                displayRear['label'] as String),
                                      ),
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
                                            '${displayRear['brand'] ?? ''} ${displayRear['model'] ?? ''}',
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (displayRear['dimensions'] != null)
                                      Padding(
                                        padding: const EdgeInsets.only(
                                            left: 46, top: 2),
                                        child: Text(
                                            displayRear['dimensions']
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
                                        Text(S.of(context)!.totalPrice,
                                            style: const TextStyle(
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

                      // Build tire category label from recommendation data
                      String? tireLabel;
                      if (!hasFrontRear && selectedRec != null) {
                        tireLabel = selectedRec['label']?.toString();
                        if (tireLabel != null && tireLabel.isEmpty)
                          tireLabel = null;
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
                            if (tireLabel != null)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: tireLabel == 'Günstigster'
                                        ? const Color(0xFF16A34A)
                                        : tireLabel == 'Testsieger'
                                            ? const Color(0xFFD97706)
                                            : const Color(0xFF0284C7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    tireLabel == 'Günstigster'
                                        ? S.of(context)!.categoryCheapestBadge
                                        : tireLabel == 'Testsieger'
                                            ? S
                                                .of(context)!
                                                .categoryPremiumBadge
                                            : tireLabel == 'Beliebt'
                                                ? S
                                                    .of(context)!
                                                    .categoryBestBadge
                                                : tireLabel,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            Row(
                              children: [
                                const Icon(Icons.tire_repair,
                                    size: 16, color: Color(0xFF0284C7)),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '${selectedRec?['brand'] ?? workshop.tireBrand ?? ""} ${selectedRec?['model'] ?? workshop.tireModel ?? ""}',
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
                                  Text(S.of(context)!.totalPrice,
                                      style: const TextStyle(
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
                              S.of(context)!.moreTiresAvailable,
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
                              S.of(context)!.noMatchingTires,
                              style: TextStyle(
                                  fontSize: 12, color: Colors.orange[900]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Motorcycle tire info (front/rear)
                  if (isMotorcycleTire && workshop.tireAvailable) ...[
                    if (isMotorcycleAchsSet)
                      Builder(builder: (context) {
                        final dispFront =
                            selectedFrontRec ?? workshop.tireFront!;
                        final dispRear =
                            selectedRearRec ?? workshop.tireRear!;
                        final fPerTire =
                            (dispFront['pricePerTire'] as num?)?.toDouble();
                        final rPerTire =
                            (dispRear['pricePerTire'] as num?)?.toDouble();
                        final fTotal =
                            (dispFront['totalPrice'] as num?)?.toDouble() ?? 0;
                        final rTotal =
                            (dispRear['totalPrice'] as num?)?.toDouble() ?? 0;
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0284C7)
                                .withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: const Color(0xFF0284C7)
                                    .withValues(alpha: 0.25),
                                width: 1.5),
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
                                      color: const Color(0xFFD97706),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text('⭐ ACHS-SET',
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white)),
                                  ),
                                  const SizedBox(width: 6),
                                  if (dispFront['label'] != null &&
                                      (dispFront['label'] as String)
                                          .isNotEmpty)
                                    _TireCategoryBadge(
                                        label: dispFront['label'] as String),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.tire_repair,
                                      size: 18, color: Color(0xFF0284C7)),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      '${dispFront['brand'] ?? ''} ${dispFront['model'] ?? ''}',
                                      style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
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
                                  Expanded(
                                    child: Text(
                                      dispFront['dimensions']?.toString() ??
                                          '',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: isDark
                                              ? const Color(0xFF94A3B8)
                                              : Colors.grey[600]),
                                    ),
                                  ),
                                  Text(
                                      fPerTire != null
                                          ? '${fPerTire.toStringAsFixed(2)}€'
                                          : '${fTotal.toStringAsFixed(2)}€',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(height: 4),
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
                                  Expanded(
                                    child: Text(
                                      dispRear['dimensions']?.toString() ?? '',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: isDark
                                              ? const Color(0xFF94A3B8)
                                              : Colors.grey[600]),
                                    ),
                                  ),
                                  Text(
                                      rPerTire != null
                                          ? '${rPerTire.toStringAsFixed(2)}€'
                                          : '${rTotal.toStringAsFixed(2)}€',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),
                    if (isMotorcycleAchsSet) const SizedBox(height: 6),
                    // Original separate VR/HR cards (when Achs-Set is OFF)
                    if (!isMotorcycleAchsSet &&
                        (selectedFrontRec ?? workshop.tireFront) != null) ...[
                      Builder(builder: (context) {
                        final displayFront =
                            selectedFrontRec ?? workshop.tireFront!;
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
                              if (displayFront['label'] != null &&
                                  (displayFront['label'] as String).isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: _TireCategoryBadge(
                                      label: displayFront['label'] as String),
                                ),
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
                                      '${displayFront['brand'] ?? ''} ${displayFront['model'] ?? ''}',
                                      style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              if (displayFront['dimensions'] != null)
                                Padding(
                                  padding:
                                      const EdgeInsets.only(left: 46, top: 2),
                                  child: Text(
                                      displayFront['dimensions'].toString(),
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: isDark
                                              ? const Color(0xFF94A3B8)
                                              : Colors.grey[600])),
                                ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 6),
                    ],
                    // HR (Rear) container - use category-filtered rec
                    if (!isMotorcycleAchsSet &&
                        (selectedRearRec ?? workshop.tireRear) != null) ...[
                      Builder(builder: (context) {
                        final displayRear =
                            selectedRearRec ?? workshop.tireRear!;
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
                              if (displayRear['label'] != null &&
                                  (displayRear['label'] as String).isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: _TireCategoryBadge(
                                      label: displayRear['label'] as String),
                                ),
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
                                      '${displayRear['brand'] ?? ''} ${displayRear['model'] ?? ''}',
                                      style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              if (displayRear['dimensions'] != null)
                                Padding(
                                  padding:
                                      const EdgeInsets.only(left: 46, top: 2),
                                  child: Text(
                                      displayRear['dimensions'].toString(),
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: isDark
                                              ? const Color(0xFF94A3B8)
                                              : Colors.grey[600])),
                                ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 6),
                    ],
                    // Fallback: flat tire info
                    if (!isMotorcycleAchsSet &&
                        workshop.tireFront == null &&
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
                                Text(S.of(context)!.totalPrice,
                                    style: const TextStyle(
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
                              S.of(context)!.moreTiresAvailable,
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
                              S.of(context)!.noMatchingMotoTires,
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
                              Text(S.of(context)!.total,
                                  style: const TextStyle(
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
                              S.of(context)!.selectVehicleForPrices,
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
                          .map((s) => _serviceTag(context, s, isDark))
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
                          final recBrand = selectedRec?['brand']?.toString() ??
                              workshop.tireBrand;
                          final recModel = selectedRec?['model']?.toString() ??
                              workshop.tireModel;
                          if (recBrand != null) qp['tireBrand'] = recBrand;
                          if (recModel != null) qp['tireModel'] = recModel;
                          final uri = Uri(
                            path: '/search/workshop/${workshop.id}',
                            queryParameters: qp,
                          );
                          context.push(uri.toString());
                        },
                        icon: const Icon(Icons.tire_repair, size: 16),
                        label: Text(S.of(context)!.bookTireAndMontage),
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
                          final recBrand = selectedRec?['brand']?.toString() ??
                              workshop.tireBrand;
                          final recModel = selectedRec?['model']?.toString() ??
                              workshop.tireModel;
                          if (recBrand != null) qp['tireBrand'] = recBrand;
                          if (recModel != null) qp['tireModel'] = recModel;
                          final uri = Uri(
                            path: '/search/workshop/${workshop.id}',
                            queryParameters: qp.isNotEmpty ? qp : null,
                          );
                          context.push(uri.toString());
                        },
                        icon: const Icon(Icons.calendar_today, size: 16),
                        label: Text(S.of(context)!.bookNow),
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

  Widget _serviceTag(BuildContext context, String serviceType, bool isDark) {
    final label = _serviceLabels(context)[serviceType] ?? serviceType;
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
        error: (_, __) => Text(S.of(context)!.vehicleLoadError),
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
                      S.of(context)!.addVehicleForPrices,
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
                  selectedVehicle?.vehicleType == 'MOTORCYCLE'
                      ? Icons.two_wheeler
                      : selectedVehicle?.vehicleType == 'TRAILER'
                          ? Icons.rv_hookup
                          : Icons.directions_car,
                  size: 20,
                  color: selectedVehicle != null
                      ? const Color(0xFF0284C7)
                      : Colors.amber[800],
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    selectedVehicle?.displayName ??
                        S.of(context)!.selectVehicleForPricesShort,
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
                  Expanded(
                      child: Text(S.of(context)!.selectVehicleTitle,
                          style: const TextStyle(
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
              title: Text(S.of(context)!.addVehicleTitle),
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

// ══════════════════════════════════════
// Tire Category Badge (Günstigster, Testsieger, Beliebt)
// ══════════════════════════════════════

class _TireCategoryBadge extends StatelessWidget {
  final String label;
  const _TireCategoryBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    final Color color;
    final String displayLabel;
    switch (label) {
      case 'Günstigster':
        color = const Color(0xFF16A34A);
        displayLabel = S.of(context)!.categoryCheapestBadge;
        break;
      case 'Testsieger':
        color = const Color(0xFFD97706);
        displayLabel = S.of(context)!.categoryPremiumBadge;
        break;
      case 'Beliebt':
        color = const Color(0xFF0284C7);
        displayLabel = S.of(context)!.categoryBestBadge;
        break;
      default:
        color = const Color(0xFF64748B);
        displayLabel = label;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        displayLabel,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}
