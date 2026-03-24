class WorkshopStats {
  final String workshopName;
  final int todaysBookings;
  final int upcomingBookings;
  final double revenue7Days;
  final int revenue7DaysCount;
  final double averageRating;
  final int totalReviews;
  final List<TodayBooking> todaysBookingsList;
  final List<RecentActivity> recentActivities;

  WorkshopStats({
    required this.workshopName,
    required this.todaysBookings,
    required this.upcomingBookings,
    required this.revenue7Days,
    required this.revenue7DaysCount,
    required this.averageRating,
    required this.totalReviews,
    required this.todaysBookingsList,
    required this.recentActivities,
  });

  factory WorkshopStats.fromJson(Map<String, dynamic> json) => WorkshopStats(
        workshopName: json['workshopName'] ?? '',
        todaysBookings: json['todaysBookings'] ?? 0,
        upcomingBookings: json['upcomingBookings'] ?? 0,
        revenue7Days: (json['revenue7Days'] ?? 0).toDouble(),
        revenue7DaysCount: json['revenue7DaysCount'] ?? 0,
        averageRating: (json['averageRating'] ?? 0).toDouble(),
        totalReviews: json['totalReviews'] ?? 0,
        todaysBookingsList: (json['todaysBookings_list'] as List? ?? [])
            .map((e) => TodayBooking.fromJson(e))
            .toList(),
        recentActivities: (json['recentActivities'] as List? ?? [])
            .map((e) => RecentActivity.fromJson(e))
            .toList(),
      );
}

class TodayBooking {
  final String id;
  final String time;
  final String customerName;
  final String serviceType;
  final String vehicle;
  final String status;

  TodayBooking({
    required this.id,
    required this.time,
    required this.customerName,
    required this.serviceType,
    required this.vehicle,
    required this.status,
  });

  factory TodayBooking.fromJson(Map<String, dynamic> json) => TodayBooking(
        id: json['id'] ?? '',
        time: json['time'] ?? '',
        customerName: json['customerName'] ?? '',
        serviceType: json['serviceType'] ?? '',
        vehicle: json['vehicle'] ?? '',
        status: json['status'] ?? '',
      );
}

class RecentActivity {
  final String id;
  final String type;
  final String message;
  final String time;

  RecentActivity({
    required this.id,
    required this.type,
    required this.message,
    required this.time,
  });

  factory RecentActivity.fromJson(Map<String, dynamic> json) => RecentActivity(
        id: json['id'] ?? '',
        type: json['type'] ?? '',
        message: json['message'] ?? '',
        time: json['time'] ?? '',
      );
}
