class RequestModel {
  final String id;
  final String userId;
  final String serviceType;
  final String vehicleId;
  final String status;
  final DateTime createdAt;
  final String? offerId;

  RequestModel({
    required this.id,
    required this.userId,
    required this.serviceType,
    required this.vehicleId,
    required this.status,
    required this.createdAt,
    this.offerId,
  });

  factory RequestModel.fromJson(Map<String, dynamic> json) {
    return RequestModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      serviceType: json['serviceType'] ?? '',
      vehicleId: json['vehicleId'] ?? '',
      status: json['status'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      offerId: json['offerId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'serviceType': serviceType,
      'vehicleId': vehicleId,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'offerId': offerId,
    };
  }
}