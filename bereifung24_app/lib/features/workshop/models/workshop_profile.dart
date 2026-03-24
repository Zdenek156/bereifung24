class WorkshopVacation {
  final String id;
  final DateTime startDate;
  final DateTime endDate;
  final String? reason;

  WorkshopVacation({
    required this.id,
    required this.startDate,
    required this.endDate,
    this.reason,
  });

  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) &&
        now.isBefore(endDate.add(const Duration(days: 1)));
  }

  bool get isUpcoming => startDate.isAfter(DateTime.now());

  factory WorkshopVacation.fromJson(Map<String, dynamic> json) =>
      WorkshopVacation(
        id: json['id'] ?? '',
        startDate: DateTime.parse(json['startDate']),
        endDate: DateTime.parse(json['endDate']),
        reason: json['reason'],
      );
}

class WorkshopProfile {
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? street;
  final String? zipCode;
  final String? city;
  final String companyName;
  final String? website;
  final String? description;
  final String? logoUrl;
  final bool isVerified;
  final Map<String, dynamic>? openingHours;

  WorkshopProfile({
    required this.email,
    this.firstName,
    this.lastName,
    this.phone,
    this.street,
    this.zipCode,
    this.city,
    required this.companyName,
    this.website,
    this.description,
    this.logoUrl,
    this.isVerified = false,
    this.openingHours,
  });

  String get fullAddress => [street, '$zipCode $city']
      .where((s) => s != null && s.trim().isNotEmpty)
      .join(', ');

  factory WorkshopProfile.fromJson(Map<String, dynamic> json) =>
      WorkshopProfile(
        email: json['email'] ?? '',
        firstName: json['firstName'],
        lastName: json['lastName'],
        phone: json['phone'],
        street: json['street'],
        zipCode: json['zipCode'],
        city: json['city'],
        companyName: json['companyName'] ?? '',
        website: json['website'],
        description: json['description'],
        logoUrl: json['logoUrl'],
        isVerified: json['isVerified'] ?? false,
        openingHours: json['openingHours'] is Map
            ? Map<String, dynamic>.from(json['openingHours'])
            : null,
      );
}
