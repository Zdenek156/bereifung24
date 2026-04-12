class Booking {
  final String id;
  final String status;
  final DateTime appointmentDate;
  final String? appointmentTime;
  final int? durationMinutes;
  final String workshopId;
  final String? workshopName;
  final String? workshopAddress;
  final String? workshopPhone;
  final String? workshopEmail;
  final String? vehicleBrand;
  final String? vehicleModel;
  final String? licensePlate;
  final String serviceType;
  final String? serviceSubtype;
  final String? tireSize;
  final String? tireBrand;
  final String? tireModel;
  final int? tireQuantity;
  final bool hasBalancing;
  final bool hasStorage;
  final bool hasWashing;
  final bool hasDisposal;
  final double? basePrice;
  final double? totalPrice;
  final double? discountAmount;
  final double? originalPrice;
  final double? balancingPrice;
  final double? storagePrice;
  final double? washingPrice;
  final double? disposalFee;
  final String? couponCode;
  final String? paymentMethod;
  final String? paymentMethodDetail;
  final String? paymentStatus;
  final String? notes;
  final String? customerNotes;
  final DateTime? createdAt;
  final DateTime? cancelledAt;

  Booking({
    required this.id,
    required this.status,
    required this.appointmentDate,
    this.appointmentTime,
    this.durationMinutes,
    required this.workshopId,
    this.workshopName,
    this.workshopAddress,
    this.workshopPhone,
    this.workshopEmail,
    this.vehicleBrand,
    this.vehicleModel,
    this.licensePlate,
    this.serviceType = 'TIRE_CHANGE',
    this.serviceSubtype,
    this.tireSize,
    this.tireBrand,
    this.tireModel,
    this.tireQuantity,
    this.hasBalancing = false,
    this.hasStorage = false,
    this.hasWashing = false,
    this.hasDisposal = false,
    this.basePrice,
    this.totalPrice,
    this.discountAmount,
    this.originalPrice,
    this.balancingPrice,
    this.storagePrice,
    this.washingPrice,
    this.disposalFee,
    this.couponCode,
    this.paymentMethod,
    this.paymentMethodDetail,
    this.paymentStatus,
    this.notes,
    this.customerNotes,
    this.createdAt,
    this.cancelledAt,
  });

  bool get isCancellable =>
      status == 'PENDING' || status == 'CONFIRMED';

  bool get isUpcoming =>
      isCancellable && appointmentDate.isAfter(DateTime.now());

  bool get isPast => appointmentDate.isBefore(DateTime.now());

  String get vehicleDisplay {
    if (vehicleBrand != null && vehicleModel != null) {
      return '$vehicleBrand $vehicleModel';
    }
    return licensePlate ?? 'Kein Fahrzeug';
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Ausstehend';
      case 'CONFIRMED':
        return 'Bestätigt';
      case 'IN_PROGRESS':
        return 'In Bearbeitung';
      case 'COMPLETED':
        return 'Abgeschlossen';
      case 'CANCELLED':
        return 'Storniert';
      case 'NO_SHOW':
        return 'Nicht erschienen';
      default:
        return status;
    }
  }

  static const _serviceLabels = <String, String>{
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'WHEEL_ALIGNMENT': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsendienst',
    'BATTERY_SERVICE': 'Batterieservice',
  };

  static const _subtypeLabels = <String, String>{
    'foreign_object': 'Fremdkörper-Reparatur',
    'valve_damage': 'Ventilschaden-Reparatur',
    'measurement_both': 'Vermessung — Beide Achsen',
    'measurement_front': 'Vermessung — Vorderachse',
    'measurement_rear': 'Vermessung — Hinterachse',
    'adjustment_both': 'Einstellung — Beide Achsen',
    'adjustment_front': 'Einstellung — Vorderachse',
    'adjustment_rear': 'Einstellung — Hinterachse',
    'full_service': 'Komplett mit Inspektion',
    'check': 'Klima Basis-Check',
    'basic': 'Klima Standard-Service',
    'comfort': 'Klima Komfort-Service',
    'premium': 'Klima Premium-Service',
  };

  String get serviceTypeDisplay {
    final base = _serviceLabels[serviceType] ?? serviceType;
    if (serviceSubtype != null && _subtypeLabels.containsKey(serviceSubtype)) {
      return '$base — ${_subtypeLabels[serviceSubtype]}';
    }
    return base;
  }

  String get paymentStatusDisplay {
    switch (paymentStatus) {
      case 'PAID':
        return 'Bezahlt';
      case 'PENDING':
        return 'Ausstehend';
      case 'FAILED':
        return 'Fehlgeschlagen';
      case 'REFUNDED':
        return 'Erstattet';
      default:
        return paymentStatus ?? '';
    }
  }

  String get paymentMethodDisplay {
    // Use detailed payment method info from Stripe webhook if available
    if (paymentMethodDetail != null && paymentMethodDetail!.isNotEmpty) {
      switch (paymentMethodDetail!) {
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
        default:
          return paymentMethodDetail!;
      }
    }
    switch (paymentMethod) {
      case 'STRIPE':
        return 'Kreditkarte / Online';
      case 'PAYPAL':
        return 'PayPal';
      case 'CASH':
        return 'Bar vor Ort';
      default:
        return paymentMethod ?? '';
    }
  }

  bool get isTireChangeService =>
      serviceType == 'TIRE_CHANGE' || serviceType == 'WHEEL_CHANGE' ||
      serviceType == 'MOTORCYCLE_TIRE';

  /// Additional services as list of strings
  List<String> get additionalServices {
    final list = <String>[];
    if (hasBalancing) list.add('Wuchten');
    if (hasStorage) list.add('Einlagerung');
    if (hasWashing) list.add('Räder waschen');
    if (hasDisposal) list.add('Entsorgung');
    return list;
  }

  factory Booking.fromJson(Map<String, dynamic> json) {
    final workshop = json['workshop'] as Map<String, dynamic>?;
    final tireRequest = json['tireRequest'] as Map<String, dynamic>?;
    // Vehicle can be top-level (new API) or nested in tireRequest
    final vehicle = json['vehicle'] as Map<String, dynamic>?
        ?? tireRequest?['vehicle'] as Map<String, dynamic>?;

    // Workshop address from flat workshop object (API returns street/zipCode/city directly)
    String? address;
    if (workshop != null) {
      final street = workshop['street'] ?? '';
      final zip = workshop['zipCode'] ?? '';
      final city = workshop['city'] ?? '';
      address = '$street, $zip $city'.trim();
      if (address == ',') address = null;
    }
    address ??= json['workshopAddress'];

    // Tire size: top-level tireSize or constructed from tireRequest dimensions
    String? tireSize = json['tireSize'];
    if (tireSize == null && tireRequest != null) {
      final w = tireRequest['width']?.toString() ?? '';
      final ar = tireRequest['aspectRatio']?.toString() ?? '';
      final d = tireRequest['diameter']?.toString() ?? '';
      if (w.isNotEmpty && ar.isNotEmpty && d.isNotEmpty) {
        tireSize = '$w/$ar R$d';
      }
    }

    return Booking(
      id: json['id']?.toString() ?? '',
      status: json['status'] ?? 'PENDING',
      appointmentDate: DateTime.parse(
          json['appointmentDate'] ?? json['date'] ?? DateTime.now().toIso8601String()),
      appointmentTime: json['appointmentTime'] ?? json['time'],
      durationMinutes: json['durationMinutes'] ?? json['estimatedDuration'] as int?,
      workshopId: json['workshopId']?.toString() ?? '',
      workshopName: workshop?['companyName'] ?? workshop?['name'] ?? json['workshopName'],
      workshopAddress: address,
      workshopPhone: workshop?['phone'] ?? json['workshopPhone'],
      workshopEmail: workshop?['email'] ?? json['workshopEmail'],
      vehicleBrand: vehicle?['make'] ?? vehicle?['brand'] ?? json['vehicleBrand'],
      vehicleModel: vehicle?['model'] ?? json['vehicleModel'],
      licensePlate: vehicle?['licensePlate'] ?? json['licensePlate'],
      serviceType: json['serviceType'] ?? 'TIRE_CHANGE',
      serviceSubtype: json['serviceSubtype'],
      tireSize: tireSize,
      tireBrand: json['tireBrand'],
      tireModel: json['tireModel'],
      tireQuantity: json['tireQuantity'] as int? ?? tireRequest?['quantity'] as int?,
      hasBalancing: json['hasBalancing'] ?? false,
      hasStorage: json['hasStorage'] ?? false,
      hasWashing: json['hasWashing'] ?? false,
      hasDisposal: json['hasDisposal'] ?? false,
      basePrice: (json['basePrice'] as num?)?.toDouble(),
      totalPrice: (json['totalPrice'] as num?)?.toDouble(),
      discountAmount: (json['discountAmount'] as num?)?.toDouble(),
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      balancingPrice: (json['balancingPrice'] as num?)?.toDouble(),
      storagePrice: (json['storagePrice'] as num?)?.toDouble(),
      washingPrice: (json['washingPrice'] as num?)?.toDouble(),
      disposalFee: (json['disposalFee'] as num?)?.toDouble(),
      couponCode: json['couponCode'],
      paymentMethod: json['paymentMethod'],
      paymentMethodDetail: json['paymentMethodDetail'],
      paymentStatus: json['paymentStatus'],
      notes: json['notes'] ?? tireRequest?['additionalNotes'],
      customerNotes: json['customerNotes'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      cancelledAt: json['cancelledAt'] != null
          ? DateTime.tryParse(json['cancelledAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'workshopId': workshopId,
        'appointmentDate': appointmentDate.toIso8601String(),
        if (appointmentTime != null) 'appointmentTime': appointmentTime,
        'serviceType': serviceType,
        if (tireSize != null) 'tireSize': tireSize,
        if (licensePlate != null) 'licensePlate': licensePlate,
        if (notes != null) 'notes': notes,
      };
}
