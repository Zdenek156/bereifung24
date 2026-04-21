import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../models/workshop_stats.dart';
import '../models/workshop_booking.dart';
import '../models/workshop_review.dart';
import '../models/workshop_profile.dart';

List<dynamic> _extractListFromResponse(dynamic data,
    {List<String> keys = const ['bookings', 'appointments', 'data']}) {
  if (data is List) return data;
  if (data is Map<String, dynamic>) {
    for (final key in keys) {
      final value = data[key];
      if (value is List) return value;
    }
  }
  return const [];
}

Map<String, dynamic> _extractMapFromResponse(dynamic data,
    {List<String> keys = const ['stats', 'data']}) {
  if (data is Map<String, dynamic>) {
    for (final key in keys) {
      final value = data[key];
      if (value is Map<String, dynamic>) return value;
    }
    return data;
  }
  return const <String, dynamic>{};
}

bool _isLikelyEmptyDashboard(WorkshopStats stats) {
  return stats.todaysBookings == 0 &&
      stats.upcomingBookings == 0 &&
      stats.revenue7Days == 0 &&
      stats.todaysBookingsList.isEmpty;
}

DateTime? _periodStart(String period, DateTime now) {
  if (period == '1d') {
    return DateTime(now.year, now.month, now.day);
  }
  if (period == '7d') {
    return now.subtract(const Duration(days: 7));
  }
  if (period == '30d') {
    return now.subtract(const Duration(days: 30));
  }
  if (period == '365d') {
    return DateTime(now.year - 1, now.month, now.day, now.hour, now.minute);
  }
  return null;
}

bool _isSameLocalDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}

DateTime _dayOnly(DateTime value) =>
    DateTime(value.year, value.month, value.day);

/// Parse an appointment date string and return a DateTime that represents the
/// calendar day the appointment is on, regardless of timezone offsets.
///
/// The backend stores appointment dates as UTC midnight (e.g.
/// `2026-04-21T00:00:00.000Z`). Calling `.toLocal()` on that in a positive
/// timezone shifts the day backwards by one. To avoid that, we extract the
/// `YYYY-MM-DD` prefix and build a local DateTime from it.
DateTime? _parseAppointmentDate(String value) {
  if (value.isEmpty) return null;
  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(value);
  if (match != null) {
    final year = int.parse(match.group(1)!);
    final month = int.parse(match.group(2)!);
    final day = int.parse(match.group(3)!);
    return DateTime(year, month, day);
  }
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return null;
  // Fallback: snap to the UTC calendar day to avoid timezone drift.
  final utc = parsed.toUtc();
  return DateTime(utc.year, utc.month, utc.day);
}

Future<WorkshopStats?> _buildStatsFromAppointments(String period) async {
  final response = await ApiClient().dio.get('/workshop/appointments');
  final list = _extractListFromResponse(response.data,
      keys: const ['appointments', 'bookings', 'data']);

  // ignore: avoid_print
  print('[DASH] appointments count=${list.length} period=$period');

  final bookings = <WorkshopBooking>[];
  var failures = 0;
  for (final entry in list) {
    if (entry is! Map) continue;
    try {
      bookings.add(
          WorkshopBooking.fromJson(Map<String, dynamic>.from(entry)));
    } catch (e) {
      failures++;
      // ignore: avoid_print
      print('[DASH] booking parse error: $e');
    }
  }

  // ignore: avoid_print
  print('[DASH] parsed bookings=${bookings.length} failures=$failures');

  if (bookings.isEmpty) return null;

  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final sevenDaysFromNow = now.add(const Duration(days: 7));
  final start = _periodStart(period, now);

  final activeToday = bookings.where((b) {
    final date = _parseAppointmentDate(b.appointmentDate);
    if (date == null) return false;
    return _isSameLocalDay(date, today) && b.status != 'CANCELLED';
  }).toList()
    ..sort((a, b) => (a.appointmentTime ?? '').compareTo(b.appointmentTime ?? ''));

  final upcoming = bookings.where((b) {
    final date = _parseAppointmentDate(b.appointmentDate);
    if (date == null) return false;
    if (date.isBefore(today) || !date.isBefore(sevenDaysFromNow)) return false;
    return b.status == 'CONFIRMED' || b.status == 'RESERVED';
  }).length;

  final revenueBookings = bookings.where((b) {
    final date = _parseAppointmentDate(b.appointmentDate) ?? b.createdAt;
    final inPeriod = start == null || !date.isBefore(_dayOnly(start));
    final billable = b.status == 'CONFIRMED' || b.status == 'COMPLETED';
    return inPeriod && billable && (b.totalPrice ?? 0) > 0;
  }).toList();

  final revenueTotal = revenueBookings.fold<double>(
      0, (sum, b) => sum + (b.totalPrice ?? 0));

  final todaysList = activeToday
      .take(10)
      .map((b) => TodayBooking(
            id: b.id,
            time: b.appointmentTime ?? '--:--',
            customerName: b.customerName,
            serviceType: b.serviceType ?? b.serviceLabel,
            vehicle: '${b.vehicleMake ?? ''} ${b.vehicleModel ?? ''}'.trim(),
            status: b.status,
          ))
      .toList();

  return WorkshopStats(
    workshopName: '',
    todaysBookings: activeToday.length,
    upcomingBookings: upcoming,
    revenue7Days: revenueTotal,
    revenue7DaysCount: revenueBookings.length,
    averageRating: 0,
    totalReviews: 0,
    todaysBookingsList: todaysList,
    recentActivities: const [],
  );
}

Future<WorkshopStats?> _safeBuildStatsFromAppointments(String period) async {
  try {
    final result = await _buildStatsFromAppointments(period);
    // ignore: avoid_print
    print(
        '[DASH] fallback result today=${result?.todaysBookings} upcoming=${result?.upcomingBookings} revenue=${result?.revenue7Days}');
    return result;
  } catch (e, st) {
    // ignore: avoid_print
    print('[DASH] fallback EXCEPTION: $e\n$st');
    return null;
  }
}

WorkshopStats _emptyStats() {
  return WorkshopStats(
    workshopName: '',
    todaysBookings: 0,
    upcomingBookings: 0,
    revenue7Days: 0,
    revenue7DaysCount: 0,
    averageRating: 0,
    totalReviews: 0,
    todaysBookingsList: const [],
    recentActivities: const [],
  );
}

// ── Dashboard Stats ──

WorkshopStats _mergeStats(WorkshopStats backend, WorkshopStats? fallback) {
  if (fallback == null) return backend;
  final mergedTodaysList = <TodayBooking>[
    ...backend.todaysBookingsList,
    ...fallback.todaysBookingsList
        .where((fb) => !backend.todaysBookingsList.any((bb) => bb.id == fb.id)),
  ];
  return WorkshopStats(
    workshopName: backend.workshopName.isNotEmpty
        ? backend.workshopName
        : fallback.workshopName,
    todaysBookings: backend.todaysBookings + fallback.todaysBookings,
    upcomingBookings: backend.upcomingBookings + fallback.upcomingBookings,
    revenue7Days: backend.revenue7Days + fallback.revenue7Days,
    revenue7DaysCount:
        backend.revenue7DaysCount + fallback.revenue7DaysCount,
    averageRating: backend.averageRating,
    totalReviews: backend.totalReviews,
    todaysBookingsList: mergedTodaysList,
    recentActivities: backend.recentActivities,
  );
}

final workshopStatsProvider =
    FutureProvider.autoDispose<WorkshopStats>((ref) async {
  try {
    final response = await ApiClient().dio.get('/workshop/dashboard-stats');
    final stats = WorkshopStats.fromJson(_extractMapFromResponse(response.data));
    final fallback = await _safeBuildStatsFromAppointments('7d');
    return _mergeStats(stats, fallback);
  } catch (_) {
    final fallback = await _safeBuildStatsFromAppointments('7d');
    if (fallback != null) return fallback;
    return _emptyStats();
  }
});

final workshopStatsPeriodProvider = FutureProvider.autoDispose
    .family<WorkshopStats, String>((ref, period) async {
  try {
    final response = await ApiClient().dio.get(
      '/workshop/dashboard-stats',
      queryParameters: {'period': period},
    );
    final stats = WorkshopStats.fromJson(_extractMapFromResponse(response.data));
    // ignore: avoid_print
    print(
        '[DASH] backend stats today=${stats.todaysBookings} upcoming=${stats.upcomingBookings} revenue=${stats.revenue7Days}');
    final fallback = await _safeBuildStatsFromAppointments(period);
    final merged = _mergeStats(stats, fallback);
    // ignore: avoid_print
    print(
        '[DASH] merged today=${merged.todaysBookings} upcoming=${merged.upcomingBookings} revenue=${merged.revenue7Days}');
    return merged;
  } catch (e) {
    // ignore: avoid_print
    print('[DASH] backend stats EXCEPTION: $e');
    final fallback = await _safeBuildStatsFromAppointments(period);
    if (fallback != null) return fallback;
    return _emptyStats();
  }
});

// ── Bookings (all appointments merged) ──

final workshopBookingsProvider =
    FutureProvider.autoDispose<List<WorkshopBooking>>((ref) async {
  try {
    final response = await ApiClient().dio.get('/workshop/appointments');
    final list = _extractListFromResponse(response.data,
        keys: const ['appointments', 'bookings', 'data']);
    return list.map((e) => WorkshopBooking.fromJson(e)).toList();
  } catch (_) {
    // Fallback endpoint used by the workshop bookings page.
    final fallback = await ApiClient().dio.get('/workshop/bookings');
    final list = _extractListFromResponse(fallback.data,
        keys: const ['bookings', 'appointments', 'data']);
    return list.map((e) => WorkshopBooking.fromJson(e)).toList();
  }
});

// ── Direct Bookings (with optional status filter) ──

final workshopDirectBookingsProvider = FutureProvider.autoDispose
    .family<List<WorkshopBooking>, String?>((ref, status) async {
  final params = <String, String>{};
  if (status != null && status != 'all') params['status'] = status;
  final response = await ApiClient()
      .dio
      .get('/workshop/bookings', queryParameters: params);
  final list = _extractListFromResponse(response.data,
      keys: const ['bookings', 'appointments', 'data']);
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
