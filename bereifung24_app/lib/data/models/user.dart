class User {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? street;
  final String? zipCode;
  final String? city;
  final String? profileImage;
  final String role;
  final String? workshopId;
  final String? workshopName;
  final bool notifyBookingConfirmation;
  final bool notifyReminder;
  final bool notifySeason;
  final bool notifyBookingUpdate;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.phone,
    this.street,
    this.zipCode,
    this.city,
    this.profileImage,
    this.role = 'CUSTOMER',
    this.workshopId,
    this.workshopName,
    this.notifyBookingConfirmation = true,
    this.notifyReminder = true,
    this.notifySeason = true,
    this.notifyBookingUpdate = true,
    this.createdAt,
  });

  String get fullName =>
      [firstName, lastName].where((e) => e != null).join(' ');

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id']?.toString() ?? '',
        email: json['email'] ?? '',
        firstName: json['firstName'],
        lastName: json['lastName'],
        phone: json['phone'],
        street: json['street'],
        zipCode: json['zipCode'],
        city: json['city'],
        profileImage: json['profileImage'],
        role: json['role'] ?? 'CUSTOMER',
        workshopId: json['workshopId'],
        workshopName: json['workshopName'],
        notifyBookingConfirmation: json['notifyBookingConfirmation'] ?? true,
        notifyReminder: json['notifyReminder'] ?? true,
        notifySeason: json['notifySeason'] ?? true,
        notifyBookingUpdate: json['notifyBookingUpdate'] ?? true,
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'])
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'street': street,
        'zipCode': zipCode,
        'city': city,
        'profileImage': profileImage,
        'role': role,
        'workshopId': workshopId,
        'workshopName': workshopName,
        'notifyBookingConfirmation': notifyBookingConfirmation,
        'notifyReminder': notifyReminder,
        'notifySeason': notifySeason,
        'notifyBookingUpdate': notifyBookingUpdate,
      };

  User copyWith({
    String? firstName,
    String? lastName,
    String? phone,
    String? street,
    String? zipCode,
    String? city,
    String? profileImage,
    String? workshopId,
    String? workshopName,
    bool? notifyBookingConfirmation,
    bool? notifyReminder,
    bool? notifySeason,
    bool? notifyBookingUpdate,
  }) =>
      User(
        id: id,
        email: email,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        phone: phone ?? this.phone,
        street: street ?? this.street,
        zipCode: zipCode ?? this.zipCode,
        city: city ?? this.city,
        profileImage: profileImage ?? this.profileImage,
        role: role,
        workshopId: workshopId ?? this.workshopId,
        workshopName: workshopName ?? this.workshopName,
        notifyBookingConfirmation:
            notifyBookingConfirmation ?? this.notifyBookingConfirmation,
        notifyReminder: notifyReminder ?? this.notifyReminder,
        notifySeason: notifySeason ?? this.notifySeason,
        notifyBookingUpdate: notifyBookingUpdate ?? this.notifyBookingUpdate,
        createdAt: createdAt,
      );
}
