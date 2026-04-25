class WorkshopBooking {
  final String id;
  final String appointmentDate;
  final String? appointmentTime;
  final int estimatedDuration;
  final String status;
  final String? paymentStatus;
  final bool isDirectBooking;
  final String? paymentMethod;
  final double? totalPrice;
  final double? basePrice;
  final String? serviceType;
  final String? serviceSubtype;
  final String customerFirstName;
  final String customerLastName;
  final String? customerEmail;
  final String? customerPhone;
  final String? vehicleMake;
  final String? vehicleModel;
  final int? vehicleYear;
  final String? licensePlate;
  final DateTime createdAt;
  // Tire details
  final String? tireBrand;
  final String? tireModel;
  final String? tireSize;
  final int? tireQuantity;
  final bool tireRunFlat;
  // Mixed tire / motorcycle front+rear
  final Map<String, dynamic>? tireData;
  // Options
  final bool hasBalancing;
  final bool hasStorage;
  final bool hasWashing;
  final bool hasDisposal;
  final double? balancingPrice;
  final double? storagePrice;
  final double? washingPrice;
  final double? disposalFee;
  final double? runFlatSurcharge;

  WorkshopBooking({
    required this.id,
    required this.appointmentDate,
    this.appointmentTime,
    this.estimatedDuration = 60,
    required this.status,
    this.paymentStatus,
    this.isDirectBooking = false,
    this.paymentMethod,
    this.totalPrice,
    this.basePrice,
    this.serviceType,
    this.serviceSubtype,
    required this.customerFirstName,
    required this.customerLastName,
    this.customerEmail,
    this.customerPhone,
    this.vehicleMake,
    this.vehicleModel,
    this.vehicleYear,
    this.licensePlate,
    required this.createdAt,
    this.tireBrand,
    this.tireModel,
    this.tireSize,
    this.tireQuantity,
    this.tireRunFlat = false,
    this.tireData,
    this.hasBalancing = false,
    this.hasStorage = false,
    this.hasWashing = false,
    this.hasDisposal = false,
    this.balancingPrice,
    this.storagePrice,
    this.washingPrice,
    this.disposalFee,
    this.runFlatSurcharge,
  });

  String get customerName => '$customerFirstName $customerLastName';

  String get serviceLabel {
    const labels = {
      'WHEEL_CHANGE': 'R\u00e4derwechsel',
      'TIRE_CHANGE': 'Reifenwechsel',
      'TIRE_REPAIR': 'Reifenreparatur',
      'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
      'ALIGNMENT_BOTH': 'Achsvermessung',
      'CLIMATE_SERVICE': 'Klimaservice',
    };
    return labels[serviceType] ?? serviceType ?? 'Service';
  }

  String? get serviceSubtypeLabel {
    if (serviceSubtype == null) return null;
    const labels = {
      'with_tire_purchase': 'Mit Reifenkauf',
      'tire_installation_only': 'Nur Montage',
      'two_tires': '2 Reifen',
      'four_tires': '4 Reifen',
      'front_two_tires': 'Vorderachse (2 Reifen)',
      'rear_two_tires': 'Hinterachse (2 Reifen)',
      'mixed_four_tires': 'Mischbereifung (4 Reifen)',
      'foreign_object': 'Fremdk\u00f6rper-Reparatur',
      'valve_damage': 'Ventilschaden-Reparatur',
      'measurement_both': 'Vermessung \u2014 Beide Achsen',
      'measurement_front': 'Vermessung \u2014 Vorderachse',
      'measurement_rear': 'Vermessung \u2014 Hinterachse',
      'adjustment_both': 'Einstellung \u2014 Beide Achsen',
      'adjustment_front': 'Einstellung \u2014 Vorderachse',
      'adjustment_rear': 'Einstellung \u2014 Hinterachse',
      'full_service': 'Komplett mit Inspektion',
      'check': 'Klima Basis-Check',
      'basic': 'Klima Standard-Service',
      'comfort': 'Klima Komfort-Service',
      'premium': 'Klima Premium-Service',
      'front': 'Vorne',
      'rear': 'Hinten',
      'both': 'Vorne & Hinten',
      'motorcycle_with_tire_purchase': 'Motorrad mit Reifenkauf',
      'motorcycle_tire_installation_only': 'Motorrad nur Montage',
    };
    return labels[serviceSubtype];
  }

  bool get isMixedTires => tireData?['isMixedTires'] == true;
  Map<String, dynamic>? get frontTire =>
      tireData?['front'] as Map<String, dynamic>?;
  Map<String, dynamic>? get rearTire =>
      tireData?['rear'] as Map<String, dynamic>?;

  String get statusLabel {
    const labels = {
      'CONFIRMED': 'Best\u00e4tigt',
      'COMPLETED': 'Abgeschlossen',
      'CANCELLED': 'Storniert',
      'RESERVED': 'Reserviert',
      'PENDING': 'Ausstehend',
      'NO_SHOW': 'Nicht erschienen',
    };
    return labels[status] ?? status;
  }

  factory WorkshopBooking.fromJson(Map<String, dynamic> json) {
    final customer = (json['customer'] is Map ? json['customer'] : {}) as Map;
    final customerUser =
        (customer['user'] is Map ? customer['user'] : {}) as Map;
    final vehicle = json['vehicle'] is Map ? json['vehicle'] as Map : null;
    final tireRequest =
        json['tireRequest'] is Map ? json['tireRequest'] as Map : null;
    final offer = json['offer'] is Map ? json['offer'] as Map : null;

    double? _readPrice(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value);
      return null;
    }

    return WorkshopBooking(
      id: json['id']?.toString() ?? '',
      appointmentDate:
          (json['appointmentDate'] ?? json['date'] ?? '').toString(),
      appointmentTime:
          json['appointmentTime']?.toString() ?? json['time']?.toString(),
      estimatedDuration:
          (json['estimatedDuration'] ?? json['durationMinutes'] ?? 60) as int,
      status: json['status']?.toString() ?? '',
      paymentStatus: json['paymentStatus']?.toString(),
      isDirectBooking: json['isDirectBooking'] == true,
      paymentMethod: json['paymentMethod']?.toString(),
      totalPrice: _readPrice(json['totalPrice']) ?? _readPrice(offer?['price']),
      basePrice: _readPrice(json['basePrice']) ?? _readPrice(offer?['price']),
      serviceType: json['serviceType']?.toString() ??
          tireRequest?['serviceType']?.toString(),
      serviceSubtype: json['serviceSubtype']?.toString(),
      customerFirstName: (customerUser['firstName'] ?? '').toString(),
      customerLastName: (customerUser['lastName'] ?? '').toString(),
      customerEmail: customerUser['email']?.toString(),
      customerPhone: customerUser['phone']?.toString(),
      vehicleMake: vehicle?['make']?.toString(),
      vehicleModel: vehicle?['model']?.toString(),
      vehicleYear: vehicle?['year'] is int
          ? vehicle!['year'] as int
          : int.tryParse(vehicle?['year']?.toString() ?? ''),
      licensePlate: vehicle?['licensePlate']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      tireBrand: json['tireBrand']?.toString(),
      tireModel: json['tireModel']?.toString(),
      tireSize: json['tireSize']?.toString(),
      tireQuantity: json['tireQuantity'] is int
          ? json['tireQuantity'] as int
          : int.tryParse(json['tireQuantity']?.toString() ?? ''),
      tireRunFlat: json['tireRunFlat'] == true || json['tireRunflat'] == true,
      tireData:
          json['tireData'] is Map<String, dynamic> ? json['tireData'] : null,
      hasBalancing: json['hasBalancing'] == true ||
          json['wantsbalancing'] == true ||
          json['wantsBalancing'] == true,
      hasStorage: json['hasStorage'] == true ||
          json['wantsstorage'] == true ||
          json['wantsStorage'] == true,
      hasWashing: json['hasWashing'] == true,
      hasDisposal: json['hasDisposal'] == true,
      balancingPrice: _readPrice(json['balancingPrice']) ??
          _readPrice(offer?['balancingPrice']) ??
          _readPrice(offer?['balancingprice']),
      storagePrice: _readPrice(json['storagePrice']) ??
          _readPrice(offer?['storagePrice']) ??
          _readPrice(offer?['storageprice']),
      washingPrice: _readPrice(json['washingPrice']),
      disposalFee:
          _readPrice(json['disposalFee']) ?? _readPrice(offer?['disposalFee']),
      runFlatSurcharge: _readPrice(json['runFlatSurcharge']) ??
          _readPrice(offer?['runFlatSurcharge']),
    );
  }
}
