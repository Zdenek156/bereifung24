/// A single tire recommendation from the search API
class TireRecommendation {
  final String label; // "Günstigster", "Testsieger", "Beliebt", "" (non-labeled)
  final String brand;
  final String model;
  final String articleId;
  final String? ean;
  final double pricePerTire;
  final double totalPrice;
  final int quantity;
  final String? loadIndex;
  final String? speedIndex;
  final String? labelFuelEfficiency; // A-G
  final String? labelWetGrip; // A-G
  final int? labelNoise; // dB
  final bool threePMSF;
  final bool runFlat;
  final String? axle; // 'front', 'rear', or null (standard)
  final String? dimensions; // e.g., "205/55 R16 91H"

  const TireRecommendation({
    required this.label,
    required this.brand,
    required this.model,
    required this.articleId,
    this.ean,
    required this.pricePerTire,
    required this.totalPrice,
    required this.quantity,
    this.loadIndex,
    this.speedIndex,
    this.labelFuelEfficiency,
    this.labelWetGrip,
    this.labelNoise,
    this.threePMSF = false,
    this.runFlat = false,
    this.axle,
    this.dimensions,
  });

  factory TireRecommendation.fromJson(Map<String, dynamic> json) {
    return TireRecommendation(
      label: json['label'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      articleId: json['articleId'] ?? '',
      ean: json['ean'],
      pricePerTire: (json['pricePerTire'] as num?)?.toDouble() ?? 0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 4,
      loadIndex: json['loadIndex']?.toString(),
      speedIndex: json['speedIndex']?.toString(),
      labelFuelEfficiency: json['labelFuelEfficiency'],
      labelWetGrip: json['labelWetGrip'],
      labelNoise: (json['labelNoise'] as num?)?.toInt(),
      threePMSF: json['threePMSF'] ?? false,
      runFlat: json['runFlat'] ?? false,
      axle: json['axle'],
      dimensions: _buildDimensions(json),
    );
  }

  static String? _buildDimensions(Map<String, dynamic> json) {
    final w = json['width']?.toString() ?? '';
    final h = json['height']?.toString() ?? '';
    final d = json['diameter']?.toString() ?? '';
    if (w.isEmpty || d.isEmpty) return json['dimensions']?.toString();
    var dim = '$w/${h.isNotEmpty ? h : "-"} R$d';
    final li = json['loadIndex']?.toString() ?? '';
    final si = json['speedIndex']?.toString() ?? '';
    if (li.isNotEmpty || si.isNotEmpty) dim = '$dim $li$si';
    return dim;
  }

  Map<String, dynamic> toJson() => {
    'label': label,
    'brand': brand,
    'model': model,
    'articleId': articleId,
    'ean': ean,
    'pricePerTire': pricePerTire,
    'totalPrice': totalPrice,
    'quantity': quantity,
    'loadIndex': loadIndex,
    'speedIndex': speedIndex,
    'labelFuelEfficiency': labelFuelEfficiency,
    'labelWetGrip': labelWetGrip,
    'labelNoise': labelNoise,
    'threePMSF': threePMSF,
    'runFlat': runFlat,
    'axle': axle,
    'dimensions': dimensions,
  };
}

/// Tire search data attached to a workshop from the search API
class WorkshopTireData {
  final bool tireAvailable;
  final double tirePrice; // cheapest tire total
  final double? tirePricePerTire;
  final int? tireQuantity;
  final String? tireBrand;
  final String? tireModel;
  final double? disposalFeeApplied;
  final double? runFlatSurchargeApplied;
  final List<TireRecommendation> tireRecommendations;

  const WorkshopTireData({
    this.tireAvailable = false,
    this.tirePrice = 0,
    this.tirePricePerTire,
    this.tireQuantity,
    this.tireBrand,
    this.tireModel,
    this.disposalFeeApplied,
    this.runFlatSurchargeApplied,
    this.tireRecommendations = const [],
  });

  factory WorkshopTireData.fromJson(Map<String, dynamic> json) {
    return WorkshopTireData(
      tireAvailable: json['tireAvailable'] ?? false,
      tirePrice: (json['tirePrice'] as num?)?.toDouble() ?? 0,
      tirePricePerTire: (json['tirePricePerTire'] as num?)?.toDouble(),
      tireQuantity: (json['tireQuantity'] as num?)?.toInt(),
      tireBrand: json['tireBrand'],
      tireModel: json['tireModel'],
      disposalFeeApplied: (json['disposalFeeApplied'] as num?)?.toDouble(),
      runFlatSurchargeApplied: (json['runFlatSurchargeApplied'] as num?)?.toDouble(),
      tireRecommendations: (json['tireRecommendations'] as List?)
          ?.map((e) => TireRecommendation.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}
