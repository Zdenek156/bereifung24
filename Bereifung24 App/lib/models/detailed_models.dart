// Detaillierte Datenmodelle basierend auf der Bereifung24 Website Logik

class TireRequest {
  final String id;
  final String customerId;
  final String? vehicleId;
  final String season; // SUMMER, WINTER, ALLSEASON
  final int width;
  final int aspectRatio;
  final int diameter;
  final int? loadIndex;
  final String? speedRating;
  final bool isRunflat;
  final int quantity; // 2 oder 4
  final String? preferredBrands;
  final String? additionalNotes;
  final String status; // PENDING, QUOTED, ACCEPTED, BOOKED, COMPLETED
  final String needByDate;
  final String zipCode;
  final String? city;
  final int radiusKm;
  final double? latitude;
  final double? longitude;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Vehicle? vehicle;
  final List<Offer>? offers;
  final Booking? booking;

  TireRequest({
    required this.id,
    required this.customerId,
    this.vehicleId,
    required this.season,
    required this.width,
    required this.aspectRatio,
    required this.diameter,
    this.loadIndex,
    this.speedRating,
    required this.isRunflat,
    required this.quantity,
    this.preferredBrands,
    this.additionalNotes,
    required this.status,
    required this.needByDate,
    required this.zipCode,
    this.city,
    required this.radiusKm,
    this.latitude,
    this.longitude,
    required this.createdAt,
    required this.updatedAt,
    this.vehicle,
    this.offers,
    this.booking,
  });

  factory TireRequest.fromJson(Map<String, dynamic> json) {
    return TireRequest(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      vehicleId: json['vehicleId'] as String?,
      season: json['season'] as String,
      width: json['width'] as int,
      aspectRatio: json['aspectRatio'] as int,
      diameter: json['diameter'] as int,
      loadIndex: json['loadIndex'] as int?,
      speedRating: json['speedRating'] as String?,
      isRunflat: json['isRunflat'] as bool? ?? false,
      quantity: json['quantity'] as int,
      preferredBrands: json['preferredBrands'] as String?,
      additionalNotes: json['additionalNotes'] as String?,
      status: json['status'] as String,
      needByDate: json['needByDate'] as String,
      zipCode: json['zipCode'] as String,
      city: json['city'] as String?,
      radiusKm: json['radiusKm'] as int,
      latitude: json['latitude'] as double?,
      longitude: json['longitude'] as double?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      vehicle: json['vehicle'] != null ? Vehicle.fromJson(json['vehicle']) : null,
      offers: json['offers'] != null 
          ? (json['offers'] as List).map((e) => Offer.fromJson(e)).toList()
          : null,
      booking: json['booking'] != null ? Booking.fromJson(json['booking']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'vehicleId': vehicleId,
      'season': season,
      'width': width,
      'aspectRatio': aspectRatio,
      'diameter': diameter,
      'loadIndex': loadIndex,
      'speedRating': speedRating,
      'isRunflat': isRunflat,
      'quantity': quantity,
      'preferredBrands': preferredBrands,
      'additionalNotes': additionalNotes,
      'needByDate': needByDate,
      'zipCode': zipCode,
      'radiusKm': radiusKm,
    };
  }

  String get tireSize => '$width/$aspectRatio R$diameter';
  
  String get seasonLabel {
    switch (season) {
      case 'SUMMER':
        return 'Sommerreifen';
      case 'WINTER':
        return 'Winterreifen';
      case 'ALLSEASON':
        return 'Ganzjahresreifen';
      default:
        return season;
    }
  }
}

class Offer {
  final String id;
  final String tireRequestId;
  final String workshopId;
  final String tireBrand;
  final String tireModel;
  final String? description;
  final double pricePerTire;
  final double price; // Total price
  final double installationFee;
  final int? durationMinutes;
  final double? balancingPrice;
  final double? storagePrice;
  final bool? storageAvailable;
  final bool? customerWantsStorage;
  final DateTime validUntil;
  final String status; // PENDING, ACCEPTED, DECLINED
  final DateTime? acceptedAt;
  final DateTime? declinedAt;
  final DateTime createdAt;
  final List<String>? selectedTireOptionIds;
  final List<TireOption>? tireOptions;
  final Workshop? workshop;
  final TireRequest? tireRequest;
  final Booking? booking;

  Offer({
    required this.id,
    required this.tireRequestId,
    required this.workshopId,
    required this.tireBrand,
    required this.tireModel,
    this.description,
    required this.pricePerTire,
    required this.price,
    required this.installationFee,
    this.durationMinutes,
    this.balancingPrice,
    this.storagePrice,
    this.storageAvailable,
    this.customerWantsStorage,
    required this.validUntil,
    required this.status,
    this.acceptedAt,
    this.declinedAt,
    required this.createdAt,
    this.selectedTireOptionIds,
    this.tireOptions,
    this.workshop,
    this.tireRequest,
    this.booking,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'] as String,
      tireRequestId: json['tireRequestId'] as String,
      workshopId: json['workshopId'] as String,
      tireBrand: json['tireBrand'] as String,
      tireModel: json['tireModel'] as String,
      description: json['description'] as String?,
      pricePerTire: (json['pricePerTire'] as num?)?.toDouble() ?? 0.0,
      price: (json['price'] as num).toDouble(),
      installationFee: (json['installationFee'] as num).toDouble(),
      durationMinutes: json['durationMinutes'] as int?,
      balancingPrice: (json['balancingPrice'] as num?)?.toDouble(),
      storagePrice: (json['storagePrice'] as num?)?.toDouble(),
      storageAvailable: json['storageAvailable'] as bool?,
      customerWantsStorage: json['customerWantsStorage'] as bool?,
      validUntil: DateTime.parse(json['validUntil'] as String),
      status: json['status'] as String,
      acceptedAt: json['acceptedAt'] != null ? DateTime.parse(json['acceptedAt']) : null,
      declinedAt: json['declinedAt'] != null ? DateTime.parse(json['declinedAt']) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      selectedTireOptionIds: json['selectedTireOptionIds'] != null 
          ? List<String>.from(json['selectedTireOptionIds'])
          : null,
      tireOptions: json['tireOptions'] != null
          ? (json['tireOptions'] as List).map((e) => TireOption.fromJson(e)).toList()
          : null,
      workshop: json['workshop'] != null ? Workshop.fromJson(json['workshop']) : null,
      tireRequest: json['tireRequest'] != null ? TireRequest.fromJson(json['tireRequest']) : null,
      booking: json['booking'] != null ? Booking.fromJson(json['booking']) : null,
    );
  }

  bool get isValid => DateTime.now().isBefore(validUntil);
  bool get isAccepted => status == 'ACCEPTED';
  bool get isPending => status == 'PENDING';
  bool get isDeclined => status == 'DECLINED';
  
  // Calculate total price including storage
  double get totalPrice {
    double total = price;
    if (customerWantsStorage == true && storagePrice != null) {
      total += storagePrice!;
    }
    return total;
  }
  
  // Get commission (4.9% of price)
  Commission? get commission {
    final commissionPercentage = 4.9;
    final commissionAmount = price * (commissionPercentage / 100);
    return Commission(
      percentage: commissionPercentage,
      amount: commissionAmount,
    );
  }
}

class TireOption {
  final String id;
  final String offerId;
  final String brand;
  final String model;
  final String? description;
  final double pricePerTire;
  final double? montagePrice;
  final String? motorcycleTireType; // FRONT, REAR, BOTH
  final String? carTireType; // ALL_FOUR, FRONT_TWO, REAR_TWO
  final String speedRating;
  final int loadIndex;
  final bool isRunflat;

  TireOption({
    required this.id,
    required this.offerId,
    required this.brand,
    required this.model,
    this.description,
    required this.pricePerTire,
    this.montagePrice,
    this.motorcycleTireType,
    this.carTireType,
    this.speedRating = 'V',
    this.loadIndex = 91,
    this.isRunflat = false,
  });

  factory TireOption.fromJson(Map<String, dynamic> json) {
    return TireOption(
      id: json['id'] as String,
      offerId: json['offerId'] as String,
      brand: json['brand'] as String,
      model: json['model'] as String,
      description: json['description'] as String?,
      pricePerTire: (json['pricePerTire'] as num).toDouble(),
      montagePrice: (json['montagePrice'] as num?)?.toDouble(),
      motorcycleTireType: json['motorcycleTireType'] as String?,
      carTireType: json['carTireType'] as String?,
      speedRating: json['speedRating'] as String? ?? 'V',
      loadIndex: json['loadIndex'] as int? ?? 91,
      isRunflat: json['isRunflat'] as bool? ?? false,
    );
  }

  String get fullName => '$brand $model';
  
  int get quantity {
    if (carTireType == 'ALL_FOUR') return 4;
    if (carTireType == 'FRONT_TWO') return 2;
    if (carTireType == 'REAR_TWO') return 2;
    if (motorcycleTireType == 'BOTH') return 2;
    if (motorcycleTireType == 'FRONT') return 1;
    if (motorcycleTireType == 'REAR') return 1;
    return 4; // Default
  }

  double get totalPrice {
    final tireTotal = pricePerTire * quantity;
    final montageTotal = (montagePrice ?? 0) * quantity;
    return tireTotal + montageTotal;
  }
}

class Booking {
  final String id;
  final String customerId;
  final String workshopId;
  final String offerId;
  final String tireRequestId;
  final DateTime appointmentDate;
  final String appointmentTime;
  final int estimatedDuration;
  final String status; // PENDING, CONFIRMED, COMPLETED, CANCELLED
  final String paymentMethod; // PAY_ONSITE, ONLINE
  final String? paymentStatus;
  final String? customerNotes;
  final String? workshopNotes;
  final DateTime? completedAt;
  final String? selectedTireOptionId;
  final Workshop? workshop;
  final Offer? offer;
  final TireRequest? tireRequest;

  Booking({
    required this.id,
    required this.customerId,
    required this.workshopId,
    required this.offerId,
    required this.tireRequestId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.estimatedDuration,
    required this.status,
    required this.paymentMethod,
    this.paymentStatus,
    this.customerNotes,
    this.workshopNotes,
    this.completedAt,
    this.selectedTireOptionId,
    this.workshop,
    this.offer,
    this.tireRequest,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      workshopId: json['workshopId'] as String,
      offerId: json['offerId'] as String,
      tireRequestId: json['tireRequestId'] as String,
      appointmentDate: DateTime.parse(json['appointmentDate'] as String),
      appointmentTime: json['appointmentTime'] as String,
      estimatedDuration: json['estimatedDuration'] as int,
      status: json['status'] as String,
      paymentMethod: json['paymentMethod'] as String,
      paymentStatus: json['paymentStatus'] as String?,
      customerNotes: json['customerNotes'] as String?,
      workshopNotes: json['workshopNotes'] as String?,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt']) : null,
      selectedTireOptionId: json['selectedTireOptionId'] as String?,
      workshop: json['workshop'] != null ? Workshop.fromJson(json['workshop']) : null,
      offer: json['offer'] != null ? Offer.fromJson(json['offer']) : null,
      tireRequest: json['tireRequest'] != null ? TireRequest.fromJson(json['tireRequest']) : null,
    );
  }

  bool get isConfirmed => status == 'CONFIRMED';
  bool get isPending => status == 'PENDING';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';

  String get formattedDate {
    return '${appointmentDate.day}.${appointmentDate.month}.${appointmentDate.year}';
  }

  String get formattedDateTime {
    return '$formattedDate um $appointmentTime';
  }
}

class Workshop {
  final String id;
  final String companyName;
  final String? street;
  final String? zipCode;
  final String? city;
  final String? phone;
  final String? email;
  final String? website;
  final double? latitude;
  final double? longitude;

  Workshop({
    required this.id,
    required this.companyName,
    this.street,
    this.zipCode,
    this.city,
    this.phone,
    this.email,
    this.website,
    this.latitude,
    this.longitude,
  });

  factory Workshop.fromJson(Map<String, dynamic> json) {
    // Handle nested user data if present
    final userData = json['user'] as Map<String, dynamic>?;
    
    return Workshop(
      id: json['id'] as String,
      companyName: json['companyName'] as String,
      street: userData?['street'] as String? ?? json['street'] as String?,
      zipCode: userData?['zipCode'] as String? ?? json['zipCode'] as String?,
      city: userData?['city'] as String? ?? json['city'] as String?,
      phone: userData?['phone'] as String? ?? json['phone'] as String?,
      email: userData?['email'] as String? ?? json['email'] as String?,
      website: json['website'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }

  String get fullAddress {
    final parts = <String>[];
    if (street != null) parts.add(street!);
    if (zipCode != null && city != null) {
      parts.add('$zipCode $city');
    } else if (city != null) {
      parts.add(city!);
    }
    return parts.join(', ');
  }
}

class Vehicle {
  final String id;
  final String customerId;
  final String make;
  final String model;
  final int year;
  final String? licensePlate;
  final String? vin;

  Vehicle({
    required this.id,
    required this.customerId,
    required this.make,
    required this.model,
    required this.year,
    this.licensePlate,
    this.vin,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      customerId: json['customerId'] as String,
      make: json['make'] as String,
      model: json['model'] as String,
      year: json['year'] as int,
      licensePlate: json['licensePlate'] as String?,
      vin: json['vin'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'make': make,
      'model': model,
      'year': year,
      'licensePlate': licensePlate,
      'vin': vin,
    };
  }

  String get displayName => '$make $model ($year)';
}

// Time slot model for booking
class TimeSlot {
  final String time;
  final bool isAvailable;

  TimeSlot({
    required this.time,
    required this.isAvailable,
  });

  factory TimeSlot.fromJson(Map<String, dynamic> json) {
    return TimeSlot(
      time: json['time'] as String? ?? json['start'] as String,
      isAvailable: json['available'] as bool? ?? true,
    );
  }
}

// API Response wrappers
class TireRequestsResponse {
  final List<TireRequest> requests;

  TireRequestsResponse({required this.requests});

  factory TireRequestsResponse.fromJson(Map<String, dynamic> json) {
    return TireRequestsResponse(
      requests: (json['requests'] as List)
          .map((e) => TireRequest.fromJson(e))
          .toList(),
    );
  }
}

class OffersResponse {
  final List<Offer> offers;

  OffersResponse({required this.offers});

  factory OffersResponse.fromJson(Map<String, dynamic> json) {
    final offersData = json['offers'] ?? json;
    final offersList = offersData is List ? offersData : [offersData];
    return OffersResponse(
      offers: offersList
          .map((e) => Offer.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class BookingsResponse {
  final List<Booking> bookings;

  BookingsResponse({required this.bookings});

  factory BookingsResponse.fromJson(Map<String, dynamic> json) {
    return BookingsResponse(
      bookings: (json['bookings'] as List)
          .map((e) => Booking.fromJson(e))
          .toList(),
    );
  }
}

class TimeSlotsResponse {
  final List<TimeSlot> slots;
  final String? message;

  TimeSlotsResponse({required this.slots, this.message});

  factory TimeSlotsResponse.fromJson(Map<String, dynamic> json) {
    return TimeSlotsResponse(
      slots: (json['slots'] as List? ?? json['availableSlots'] as List? ?? [])
          .map((e) => TimeSlot.fromJson(e is String ? {'time': e} : e))
          .toList(),
      message: json['message'] as String?,
    );
  }
}

class Commission {
  final double percentage;
  final double amount;

  Commission({
    required this.percentage,
    required this.amount,
  });

  factory Commission.fromJson(Map<String, dynamic> json) {
    return Commission(
      percentage: (json['percentage'] as num).toDouble(),
      amount: (json['amount'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'percentage': percentage,
      'amount': amount,
    };
  }
}
