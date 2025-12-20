class VehicleModel {
  final String id;
  final String userId;
  final String brand;
  final String model;
  final String licensePlate;
  final int year;
  final String? vin;

  VehicleModel({
    required this.id,
    required this.userId,
    required this.brand,
    required this.model,
    required this.licensePlate,
    required this.year,
    this.vin,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      licensePlate: json['licensePlate'] ?? '',
      year: json['year'] ?? 0,
      vin: json['vin'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'brand': brand,
      'model': model,
      'licensePlate': licensePlate,
      'year': year,
      'vin': vin,
    };
  }
}