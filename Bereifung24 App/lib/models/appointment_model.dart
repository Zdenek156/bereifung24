class AppointmentModel {
  final String id;
  final String requestId;
  final String workshopName;
  final DateTime date;
  final String time;
  final String address;
  final String status;

  AppointmentModel({
    required this.id,
    required this.requestId,
    required this.workshopName,
    required this.date,
    required this.time,
    required this.address,
    required this.status,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] ?? '',
      requestId: json['requestId'] ?? '',
      workshopName: json['workshopName'] ?? '',
      date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
      time: json['time'] ?? '',
      address: json['address'] ?? '',
      status: json['status'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'requestId': requestId,
      'workshopName': workshopName,
      'date': date.toIso8601String(),
      'time': time,
      'address': address,
      'status': status,
    };
  }
}