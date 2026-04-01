import 'dart:convert';

class Workshop {
  final String id;
  final String name;
  final String? companyName;
  final String street;
  final String zipCode;
  final String city;
  final String? phone;
  final String? email;
  final String? website;
  final double? latitude;
  final double? longitude;
  final String? profileImage;
  final String? cardImageUrl;
  final String? heroImage;
  final String? description;

  /// Display image: prefers heroImage, then cardImageUrl, then profileImage
  String? get displayImage => heroImage ?? cardImageUrl ?? profileImage;
  final double? averageRating;
  final int reviewCount;
  final double? distance;
  final List<String> services;
  final List<WorkshopServiceDetail> serviceDetails;
  final WorkshopPricing? pricing;
  final List<WorkshopOpeningHour> openingHours;

  // Tire search data (populated from POST /customer/direct-booking/search)
  final bool tireAvailable;
  final double tirePrice;
  final double? tirePricePerTire;
  final int? tireQuantity;
  final String? tireBrand;
  final String? tireModel;
  final double? disposalFeeApplied;
  final double? runFlatSurchargeApplied;
  final double? mountingOnlySurchargeApplied;
  final List<Map<String, dynamic>> tireRecommendationsRaw;
  final double? searchTotalPrice; // totalPrice from tire-search API
  final double? searchBasePrice; // basePrice from tire-search API
  final int? estimatedDuration;

  // Mixed / motorcycle tire data (front + rear separate tires)
  final bool isMixedTires;
  final Map<String, dynamic>? tireFront;
  final Map<String, dynamic>? tireRear;

  // WHEEL_CHANGE price breakdown from search API
  final Map<String, dynamic>? wheelChangeBreakdown;

  Workshop({
    required this.id,
    required this.name,
    this.companyName,
    required this.street,
    required this.zipCode,
    required this.city,
    this.phone,
    this.email,
    this.website,
    this.latitude,
    this.longitude,
    this.profileImage,
    this.cardImageUrl,
    this.heroImage,
    this.description,
    this.averageRating,
    this.reviewCount = 0,
    this.distance,
    this.services = const [],
    this.serviceDetails = const [],
    this.pricing,
    this.openingHours = const [],
    this.tireAvailable = false,
    this.tirePrice = 0,
    this.tirePricePerTire,
    this.tireQuantity,
    this.tireBrand,
    this.tireModel,
    this.disposalFeeApplied,
    this.runFlatSurchargeApplied,
    this.mountingOnlySurchargeApplied,
    this.tireRecommendationsRaw = const [],
    this.searchTotalPrice,
    this.searchBasePrice,
    this.estimatedDuration,
    this.isMixedTires = false,
    this.tireFront,
    this.tireRear,
    this.wheelChangeBreakdown,
  });

  String get fullAddress => '$street, $zipCode $city';

  /// Find detailed service data for a given service type
  WorkshopServiceDetail? getServiceDetail(String serviceType) =>
      serviceDetails.where((s) => s.serviceType == serviceType).firstOrNull;

  String get distanceFormatted {
    if (distance == null) return '';
    if (distance! < 1) return '${(distance! * 1000).round()} m';
    return '${distance!.toStringAsFixed(1)} km';
  }

  /// Converts a relative URL (e.g. /uploads/...) to a full URL
  static String? _toFullUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('http')) return url;
    return 'https://www.bereifung24.de$url';
  }

  /// Parse openingHours from either List (GET /workshops) or String (POST /direct-booking/search)
  static List<WorkshopOpeningHour> _parseOpeningHours(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) {
      return raw
          .map((e) => WorkshopOpeningHour.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (raw is String) {
      try {
        final decoded = const JsonDecoder().convert(raw);
        if (decoded is Map) {
          const dayMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 7
          };
          return decoded.entries
              .where((e) => dayMap.containsKey(e.key))
              .map((entry) {
            final val = entry.value as Map<String, dynamic>;
            return WorkshopOpeningHour(
              dayOfWeek: dayMap[entry.key] ?? 1,
              openTime: val['from'] ?? '08:00',
              closeTime: val['to'] ?? '18:00',
              isClosed: val['closed'] ?? false,
            );
          }).toList();
        }
      } catch (_) {}
    }
    return [];
  }

  /// Merge tireRecommendations, tireFrontRecommendations, tireRearRecommendations
  /// into a single flat list for the tire selection carousel
  static List<Map<String, dynamic>> _mergeTireRecommendations(
      Map<String, dynamic> json) {
    // Standard single-dimension recommendations (already flat)
    final standard = json['tireRecommendations'] as List?;
    if (standard != null && standard.isNotEmpty) {
      return standard.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    // Motorcycle / mixed tire recommendations (nested tire object)
    final front = json['tireFrontRecommendations'] as List?;
    final rear = json['tireRearRecommendations'] as List?;
    if (front == null && rear == null) return [];
    final result = <Map<String, dynamic>>[];
    for (final rec in (front ?? [])) {
      final m = Map<String, dynamic>.from(rec as Map);
      // Flatten nested tire object if present
      if (m['tire'] is Map) {
        final tire = Map<String, dynamic>.from(m['tire'] as Map);
        m['brand'] = tire['brand'] ?? m['brand'];
        m['model'] = tire['model'] ?? m['model'];
        m['articleId'] = tire['articleNumber'] ?? m['articleId'];
        m['ean'] = tire['ean'] ?? m['ean'];
        m['loadIndex'] = tire['loadIndex'] ?? m['loadIndex'];
        m['speedIndex'] = tire['speedIndex'] ?? m['speedIndex'];
        m['width'] = tire['width'];
        m['height'] = tire['height'];
        m['diameter'] = tire['diameter'];
        m['labelFuelEfficiency'] = tire['labelFuelEfficiency'];
        m['labelWetGrip'] = tire['labelWetGrip'];
        m['labelNoise'] = tire['labelNoise'];
        m['threePMSF'] = tire['threePMSF'] ?? false;
        m['runFlat'] = tire['runFlat'] ?? false;
        m.remove('tire');
      }
      m['axle'] = 'front';
      result.add(m);
    }
    for (final rec in (rear ?? [])) {
      final m = Map<String, dynamic>.from(rec as Map);
      if (m['tire'] is Map) {
        final tire = Map<String, dynamic>.from(m['tire'] as Map);
        m['brand'] = tire['brand'] ?? m['brand'];
        m['model'] = tire['model'] ?? m['model'];
        m['articleId'] = tire['articleNumber'] ?? m['articleId'];
        m['ean'] = tire['ean'] ?? m['ean'];
        m['loadIndex'] = tire['loadIndex'] ?? m['loadIndex'];
        m['speedIndex'] = tire['speedIndex'] ?? m['speedIndex'];
        m['width'] = tire['width'];
        m['height'] = tire['height'];
        m['diameter'] = tire['diameter'];
        m['labelFuelEfficiency'] = tire['labelFuelEfficiency'];
        m['labelWetGrip'] = tire['labelWetGrip'];
        m['labelNoise'] = tire['labelNoise'];
        m['threePMSF'] = tire['threePMSF'] ?? false;
        m['runFlat'] = tire['runFlat'] ?? false;
        m.remove('tire');
      }
      m['axle'] = 'rear';
      result.add(m);
    }
    return result;
  }

  factory Workshop.fromJson(Map<String, dynamic> json) => Workshop(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? json['companyName'] ?? '',
        companyName: json['companyName'],
        street: json['street'] ?? json['address'] ?? '',
        zipCode: json['zipCode'] ?? json['postalCode'] ?? '',
        city: json['city'] ?? '',
        phone: json['phone'],
        email: json['email'],
        website: json['website'] ?? json['companySettings']?['website'],
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        profileImage: _toFullUrl(json['profileImage'] ?? json['logoUrl']),
        cardImageUrl: _toFullUrl(json['cardImageUrl']),
        heroImage: _toFullUrl(json['heroImage']),
        description:
            json['description'] ?? json['companySettings']?['description'],
        averageRating: (json['averageRating'] as num?)?.toDouble() ??
            (json['rating'] as num?)?.toDouble(),
        reviewCount: json['reviewCount'] ?? json['_count']?['reviews'] ?? 0,
        distance: (json['distance'] as num?)?.toDouble(),
        services: ((json['services'] ?? json['availableServices']) as List?)
                ?.map((e) => e is String
                    ? e
                    : (e is Map
                        ? (e['serviceType']?.toString() ?? '')
                        : e.toString()))
                .where((s) => s.isNotEmpty)
                .toList() ??
            [],
        serviceDetails:
            ((json['services'] ?? json['availableServices']) as List?)
                    ?.where((e) => e is Map)
                    .map((e) => WorkshopServiceDetail.fromJson(
                        Map<String, dynamic>.from(e as Map)))
                    .toList() ??
                [],
        pricing: json['pricing'] != null
            ? WorkshopPricing.fromJson(json['pricing'])
            : null,
        openingHours: _parseOpeningHours(json['openingHours']),
        tireAvailable: json['tireAvailable'] ?? false,
        tirePrice: (json['tirePrice'] as num?)?.toDouble() ?? 0,
        tirePricePerTire: (json['tirePricePerTire'] as num?)?.toDouble(),
        tireQuantity: (json['tireQuantity'] as num?)?.toInt(),
        tireBrand: json['tireBrand']?.toString(),
        tireModel: json['tireModel']?.toString(),
        disposalFeeApplied: (json['disposalFeeApplied'] as num?)?.toDouble(),
        runFlatSurchargeApplied:
            (json['runFlatSurchargeApplied'] as num?)?.toDouble(),
        mountingOnlySurchargeApplied:
            (json['mountingOnlySurchargeApplied'] as num?)?.toDouble(),
        tireRecommendationsRaw: _mergeTireRecommendations(json),
        searchTotalPrice: (json['totalPrice'] as num?)?.toDouble(),
        searchBasePrice: (json['basePrice'] as num?)?.toDouble(),
        estimatedDuration: (json['estimatedDuration'] as num?)?.toInt(),
        isMixedTires: json['isMixedTires'] ?? false,
        tireFront: json['tireFront'] != null
            ? Map<String, dynamic>.from(json['tireFront'] as Map)
            : null,
        tireRear: json['tireRear'] != null
            ? Map<String, dynamic>.from(json['tireRear'] as Map)
            : null,
        wheelChangeBreakdown: json['wheelChangeBreakdown'] != null
            ? Map<String, dynamic>.from(json['wheelChangeBreakdown'] as Map)
            : null,
      );
}

class WorkshopPricing {
  final double? tireChangePricePKW;
  final double? tireChangePriceSUV;
  final double? tireChangePriceMotorcycle;
  final double? basePrice;
  final double? basePrice4;
  final double? montagePrice;
  final double? balancingPrice;
  final double? storagePrice;
  final double? washingPrice;
  final int? durationMinutes;
  final int? durationMinutes4;
  final int? balancingMinutes;
  final Map<int, double> rimPrices;

  WorkshopPricing({
    this.tireChangePricePKW,
    this.tireChangePriceSUV,
    this.tireChangePriceMotorcycle,
    this.basePrice,
    this.basePrice4,
    this.montagePrice,
    this.balancingPrice,
    this.storagePrice,
    this.washingPrice,
    this.durationMinutes,
    this.durationMinutes4,
    this.balancingMinutes,
    this.rimPrices = const {},
  });

  /// Lowest available price across all categories
  double? get lowestPrice {
    final prices = <double>[
      if (tireChangePricePKW != null) tireChangePricePKW!,
      if (tireChangePriceSUV != null) tireChangePriceSUV!,
      if (tireChangePriceMotorcycle != null) tireChangePriceMotorcycle!,
      if (basePrice != null) basePrice!,
      ...rimPrices.values,
    ];
    if (prices.isEmpty) return null;
    prices.sort();
    return prices.first;
  }

  factory WorkshopPricing.fromJson(Map<String, dynamic> json) {
    final rimPrices = <int, double>{};
    json.forEach((key, value) {
      final match = RegExp(r'^tireChangePrice_(\d+)$').firstMatch(key);
      if (match != null && value != null) {
        rimPrices[int.parse(match.group(1)!)] = (value as num).toDouble();
      }
    });

    return WorkshopPricing(
      tireChangePricePKW: (json['tireChangePricePKW'] as num?)?.toDouble(),
      tireChangePriceSUV: (json['tireChangePriceSUV'] as num?)?.toDouble(),
      tireChangePriceMotorcycle:
          (json['tireChangePriceMotorcycle'] as num?)?.toDouble(),
      basePrice: (json['basePrice'] as num?)?.toDouble(),
      basePrice4: (json['basePrice4'] as num?)?.toDouble(),
      montagePrice: (json['montagePrice'] as num?)?.toDouble(),
      balancingPrice: (json['balancingPrice'] as num?)?.toDouble(),
      storagePrice: (json['storagePrice'] as num?)?.toDouble(),
      washingPrice: (json['washingPrice'] as num?)?.toDouble(),
      durationMinutes: (json['durationMinutes'] as num?)?.toInt(),
      durationMinutes4: (json['durationMinutes4'] as num?)?.toInt(),
      balancingMinutes: (json['balancingMinutes'] as num?)?.toInt(),
      rimPrices: rimPrices,
    );
  }
}

class WorkshopOpeningHour {
  final int dayOfWeek;
  final String openTime;
  final String closeTime;
  final bool isClosed;

  WorkshopOpeningHour({
    required this.dayOfWeek,
    required this.openTime,
    required this.closeTime,
    this.isClosed = false,
  });

  String get dayName {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    return (dayOfWeek >= 1 && dayOfWeek <= 7)
        ? days[dayOfWeek - 1]
        : '$dayOfWeek';
  }

  factory WorkshopOpeningHour.fromJson(Map<String, dynamic> json) =>
      WorkshopOpeningHour(
        dayOfWeek: json['dayOfWeek'] ?? 1,
        openTime: json['openTime'] ?? '08:00',
        closeTime: json['closeTime'] ?? '18:00',
        isClosed: json['isClosed'] ?? false,
      );
}

/// Full service detail returned by GET /api/workshops/[id]
class WorkshopServiceDetail {
  final String serviceType;
  final double? basePrice;
  final double? basePrice4;
  final double? balancingPrice;
  final double? storagePrice;
  final double? washingPrice;
  final int? durationMinutes;
  final int? durationMinutes4;
  final int? balancingMinutes;
  final bool storageAvailable;
  final bool washingAvailable;
  final List<ServicePackageDetail> packages;

  WorkshopServiceDetail({
    required this.serviceType,
    this.basePrice,
    this.basePrice4,
    this.balancingPrice,
    this.storagePrice,
    this.washingPrice,
    this.durationMinutes,
    this.durationMinutes4,
    this.balancingMinutes,
    this.storageAvailable = false,
    this.washingAvailable = false,
    this.packages = const [],
  });

  factory WorkshopServiceDetail.fromJson(Map<String, dynamic> json) {
    final packages = (json['servicePackages'] as List?)
            ?.map(
                (e) => ServicePackageDetail.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return WorkshopServiceDetail(
      serviceType: json['serviceType'] ?? '',
      basePrice: (json['basePrice'] as num?)?.toDouble(),
      basePrice4: (json['basePrice4'] as num?)?.toDouble(),
      balancingPrice: (json['balancingPrice'] as num?)?.toDouble(),
      storagePrice: (json['storagePrice'] as num?)?.toDouble(),
      washingPrice: (json['washingPrice'] as num?)?.toDouble(),
      durationMinutes: (json['durationMinutes'] as num?)?.toInt(),
      durationMinutes4: (json['durationMinutes4'] as num?)?.toInt(),
      balancingMinutes: (json['balancingMinutes'] as num?)?.toInt(),
      storageAvailable: json['storageAvailable'] ?? false,
      washingAvailable: json['washingAvailable'] ?? false,
      packages: packages,
    );
  }
}

class ServicePackageDetail {
  final String packageType;
  final String name;
  final double price;
  final int? durationMinutes;
  final String? description;

  ServicePackageDetail({
    required this.packageType,
    required this.name,
    required this.price,
    this.durationMinutes,
    this.description,
  });

  factory ServicePackageDetail.fromJson(Map<String, dynamic> json) {
    return ServicePackageDetail(
      packageType: json['packageType'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      durationMinutes: (json['durationMinutes'] as num?)?.toInt(),
      description: json['description'],
    );
  }
}
