class TireSpec {
  final int? width;
  final int? aspectRatio;
  final int? diameter;
  final int? loadIndex;
  final String? speedRating;
  final bool hasDifferentSizes;
  final int? rearWidth;
  final int? rearAspectRatio;
  final int? rearDiameter;
  final int? rearLoadIndex;
  final String? rearSpeedRating;

  TireSpec({
    this.width,
    this.aspectRatio,
    this.diameter,
    this.loadIndex,
    this.speedRating,
    this.hasDifferentSizes = false,
    this.rearWidth,
    this.rearAspectRatio,
    this.rearDiameter,
    this.rearLoadIndex,
    this.rearSpeedRating,
  });

  bool get isEmpty => width == null && aspectRatio == null && diameter == null;

  String get displaySize {
    if (width == null || aspectRatio == null || diameter == null) return '';
    final base = '$width/$aspectRatio R$diameter';
    if (hasDifferentSizes && rearWidth != null) {
      return '$base (VA) / $rearWidth/$rearAspectRatio R$rearDiameter (HA)';
    }
    return base;
  }

  String get displaySizeWithIndex {
    if (width == null || aspectRatio == null || diameter == null) return '';
    final li = loadIndex != null ? ' $loadIndex' : '';
    final sr = speedRating != null ? '${speedRating}' : '';
    final base = '$width/$aspectRatio R$diameter$li$sr';
    if (hasDifferentSizes && rearWidth != null) {
      final rLi = rearLoadIndex != null ? ' $rearLoadIndex' : '';
      final rSr = rearSpeedRating != null ? '${rearSpeedRating}' : '';
      return '$base (VA) / $rearWidth/$rearAspectRatio R$rearDiameter$rLi$rSr (HA)';
    }
    return base;
  }

  factory TireSpec.fromJson(dynamic json) {
    if (json == null) return TireSpec();
    final map = json is String ? {} : json as Map<String, dynamic>;
    return TireSpec(
      width: map['width'] as int?,
      aspectRatio: map['aspectRatio'] as int?,
      diameter: map['diameter'] as int?,
      loadIndex: map['loadIndex'] as int?,
      speedRating: map['speedRating'] as String?,
      hasDifferentSizes: map['hasDifferentSizes'] ?? false,
      rearWidth: map['rearWidth'] as int?,
      rearAspectRatio: map['rearAspectRatio'] as int?,
      rearDiameter: map['rearDiameter'] as int?,
      rearLoadIndex: map['rearLoadIndex'] as int?,
      rearSpeedRating: map['rearSpeedRating'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        if (width != null) 'width': width,
        if (aspectRatio != null) 'aspectRatio': aspectRatio,
        if (diameter != null) 'diameter': diameter,
        if (loadIndex != null) 'loadIndex': loadIndex,
        if (speedRating != null) 'speedRating': speedRating,
        'hasDifferentSizes': hasDifferentSizes,
        if (rearWidth != null) 'rearWidth': rearWidth,
        if (rearAspectRatio != null) 'rearAspectRatio': rearAspectRatio,
        if (rearDiameter != null) 'rearDiameter': rearDiameter,
        if (rearLoadIndex != null) 'rearLoadIndex': rearLoadIndex,
        if (rearSpeedRating != null) 'rearSpeedRating': rearSpeedRating,
      };
}

class Vehicle {
  final String? id;
  final String vehicleType; // CAR, MOTORCYCLE, TRAILER
  final String make;
  final String model;
  final int? year;
  final String? licensePlate;
  final String? vin;
  final String? nextInspectionDate;
  final bool inspectionReminder;
  final int? inspectionReminderDays;
  final String? fuelType;
  final double? fuelConsumption;
  final TireSpec? summerTires;
  final TireSpec? winterTires;
  final TireSpec? allSeasonTires;
  final DateTime? createdAt;

  Vehicle({
    this.id,
    this.vehicleType = 'CAR',
    required this.make,
    required this.model,
    this.year,
    this.licensePlate,
    this.vin,
    this.nextInspectionDate,
    this.inspectionReminder = false,
    this.inspectionReminderDays,
    this.fuelType,
    this.fuelConsumption,
    this.summerTires,
    this.winterTires,
    this.allSeasonTires,
    this.createdAt,
  });

  // Backwards compat alias
  String get brand => make;
  String get tireSize => summerTires?.displaySize ?? winterTires?.displaySize ?? allSeasonTires?.displaySize ?? '';
  String get tireSizeWithIndex => summerTires?.displaySizeWithIndex ?? winterTires?.displaySizeWithIndex ?? allSeasonTires?.displaySizeWithIndex ?? '';

  String get displayName => '$make $model${licensePlate != null ? ' ($licensePlate)' : ''}';

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: json['id']?.toString(),
        vehicleType: json['vehicleType'] ?? 'CAR',
        make: json['make'] ?? json['brand'] ?? '',
        model: json['model'] ?? '',
        year: json['year'],
        licensePlate: json['licensePlate'],
        vin: json['vin'],
        nextInspectionDate: json['nextInspectionDate'],
        inspectionReminder: json['inspectionReminder'] ?? false,
        inspectionReminderDays: json['inspectionReminderDays'] as int?,
        fuelType: json['fuelType'],
        fuelConsumption: json['fuelConsumption'] != null
            ? (json['fuelConsumption'] as num).toDouble()
            : null,
        summerTires: json['summerTires'] != null
            ? TireSpec.fromJson(json['summerTires'])
            : null,
        winterTires: json['winterTires'] != null
            ? TireSpec.fromJson(json['winterTires'])
            : null,
        allSeasonTires: json['allSeasonTires'] != null
            ? TireSpec.fromJson(json['allSeasonTires'])
            : null,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'])
            : null,
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'vehicleType': vehicleType,
        'make': make,
        'model': model,
        if (year != null) 'year': year,
        if (licensePlate != null) 'licensePlate': licensePlate,
        if (vin != null && vin!.isNotEmpty) 'vin': vin,
        if (nextInspectionDate != null) 'nextInspectionDate': nextInspectionDate,
        'inspectionReminder': inspectionReminder,
        if (inspectionReminderDays != null) 'inspectionReminderDays': inspectionReminderDays,
        if (fuelType != null) 'fuelType': fuelType,
        if (fuelConsumption != null) 'fuelConsumption': fuelConsumption,
        if (summerTires != null && !summerTires!.isEmpty) 'summerTires': summerTires!.toJson(),
        if (winterTires != null && !winterTires!.isEmpty) 'winterTires': winterTires!.toJson(),
        if (allSeasonTires != null && !allSeasonTires!.isEmpty) 'allSeasonTires': allSeasonTires!.toJson(),
      };
}
