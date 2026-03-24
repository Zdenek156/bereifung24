class WorkshopReview {
  final String id;
  final int rating;
  final String? comment;
  final String? workshopResponse;
  final DateTime? respondedAt;
  final String customerFirstName;
  final DateTime createdAt;
  final String? serviceType;
  final DateTime? appointmentDate;

  WorkshopReview({
    required this.id,
    required this.rating,
    this.comment,
    this.workshopResponse,
    this.respondedAt,
    required this.customerFirstName,
    required this.createdAt,
    this.serviceType,
    this.appointmentDate,
  });

  bool get hasResponse =>
      workshopResponse != null && workshopResponse!.isNotEmpty;

  factory WorkshopReview.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] ?? {};
    final customerUser = customer['user'] ?? {};
    final directBooking = json['directBooking'];

    return WorkshopReview(
      id: json['id'] ?? '',
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      workshopResponse: json['workshopResponse'],
      respondedAt: json['respondedAt'] != null
          ? DateTime.tryParse(json['respondedAt'])
          : null,
      customerFirstName: customerUser['firstName'] ?? 'Kunde',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      serviceType: directBooking?['serviceType'],
      appointmentDate: directBooking?['date'] != null
          ? DateTime.tryParse(directBooking['date'])
          : null,
    );
  }
}
