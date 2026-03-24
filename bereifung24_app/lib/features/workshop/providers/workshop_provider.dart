import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/workshop_stats.dart';
import '../models/workshop_booking.dart';
import '../models/workshop_review.dart';
import '../models/workshop_profile.dart';

// ── Dashboard Stats ──

final workshopStatsProvider =
    FutureProvider.autoDispose<WorkshopStats>((ref) async {
  final response = await ApiClient().dio.get('/workshop/dashboard-stats');
  return WorkshopStats.fromJson(response.data);
});

final workshopStatsPeriodProvider = FutureProvider.autoDispose
    .family<WorkshopStats, String>((ref, period) async {
  final response = await ApiClient().dio.get(
    '/workshop/dashboard-stats',
    queryParameters: {'period': period},
  );
  return WorkshopStats.fromJson(response.data);
});

// ── Bookings (all appointments merged) ──

final workshopBookingsProvider =
    FutureProvider.autoDispose<List<WorkshopBooking>>((ref) async {
  final response = await ApiClient().dio.get('/workshop/appointments');
  final list = response.data as List;
  return list.map((e) => WorkshopBooking.fromJson(e)).toList();
});

// ── Direct Bookings (with optional status filter) ──

final workshopDirectBookingsProvider = FutureProvider.autoDispose
    .family<List<WorkshopBooking>, String?>((ref, status) async {
  final params = <String, String>{};
  if (status != null && status != 'all') params['status'] = status;
  final response =
      await ApiClient().dio.get('/workshop/bookings', queryParameters: params);
  final list = (response.data['bookings'] as List?) ?? [];
  return list.map((e) => WorkshopBooking.fromJson(e)).toList();
});

// ── Reviews ──

class ReviewsState {
  final List<WorkshopReview> reviews;
  final double averageRating;
  final int totalReviews;

  ReviewsState({
    required this.reviews,
    required this.averageRating,
    required this.totalReviews,
  });
}

final workshopReviewsProvider =
    FutureProvider.autoDispose<ReviewsState>((ref) async {
  final response = await ApiClient().dio.get('/workshop/reviews');
  final data = response.data;
  final reviews =
      (data['reviews'] as List).map((e) => WorkshopReview.fromJson(e)).toList();
  return ReviewsState(
    reviews: reviews,
    averageRating: (data['averageRating'] ?? 0).toDouble(),
    totalReviews: data['totalReviews'] ?? 0,
  );
});

// ── Vacations ──

final workshopVacationsProvider =
    FutureProvider.autoDispose<List<WorkshopVacation>>((ref) async {
  final response = await ApiClient().dio.get('/workshop/vacations');
  final list = (response.data['vacations'] as List?) ?? [];
  return list.map((e) => WorkshopVacation.fromJson(e)).toList();
});

// ── Profile ──

final workshopProfileProvider =
    FutureProvider.autoDispose<WorkshopProfile>((ref) async {
  final response = await ApiClient().dio.get('/workshop/profile');
  return WorkshopProfile.fromJson(response.data);
});

// ── Landing Page (for share card) ──

final workshopLandingPageProvider =
    FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final response = await ApiClient().dio.get('/workshop/landing-page');
  final data = response.data;
  if (data is Map<String, dynamic>) {
    final lp = data['landingPage'];
    if (lp is Map<String, dynamic>) return lp;
  }
  return null;
});

// ── Notification Stats ──

class NotificationStats {
  final int newRequests;
  final int acceptedOffers;
  final int upcomingAppointments;
  final int pendingReviews;

  int get total =>
      newRequests + acceptedOffers + upcomingAppointments + pendingReviews;

  NotificationStats({
    required this.newRequests,
    required this.acceptedOffers,
    required this.upcomingAppointments,
    required this.pendingReviews,
  });

  factory NotificationStats.fromJson(Map<String, dynamic> json) =>
      NotificationStats(
        newRequests: json['newRequests'] ?? 0,
        acceptedOffers: json['acceptedOffers'] ?? 0,
        upcomingAppointments: json['upcomingAppointments'] ?? 0,
        pendingReviews: json['pendingReviews'] ?? 0,
      );
}

final workshopNotificationStatsProvider =
    FutureProvider.autoDispose<NotificationStats>((ref) async {
  final response = await ApiClient().dio.get('/workshop/notification-stats');
  return NotificationStats.fromJson(response.data);
});

// ── Actions ──

Future<void> respondToReview(String reviewId, String response) async {
  await ApiClient().dio.post('/workshop/reviews/$reviewId/respond', data: {
    'response': response,
  });
}

Future<void> cancelBooking(
    String bookingId, String reason, String reasonType) async {
  await ApiClient().dio.post('/workshop/appointments/$bookingId/cancel', data: {
    'reason': reason,
    'reasonType': reasonType,
  });
}

Future<WorkshopVacation> createVacation({
  required DateTime startDate,
  required DateTime endDate,
  String? reason,
}) async {
  final response = await ApiClient().dio.post('/workshop/vacations', data: {
    'startDate': startDate.toIso8601String(),
    'endDate': endDate.toIso8601String(),
    'reason': reason,
  });
  return WorkshopVacation.fromJson(response.data['vacation']);
}

Future<void> deleteVacation(String id) async {
  await ApiClient()
      .dio
      .delete('/workshop/vacations', queryParameters: {'id': id});
}
