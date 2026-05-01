import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import '../services/crash_reporting_service.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio _dio;
  VoidCallback? onAuthError;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(_AuthInterceptor(this));

    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ));
    }
  }

  Dio get dio => _dio;

  // ── Auth Endpoints (no token needed) ──

  Future<Response> login(String email, String password) {
    return _dio.post('/mobile-auth/login', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String? street,
    String? zipCode,
    String? city,
  }) {
    return _dio.post('/mobile-auth/register', data: {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      if (phone != null) 'phone': phone,
      if (street != null) 'street': street,
      if (zipCode != null) 'zipCode': zipCode,
      if (city != null) 'city': city,
    });
  }

  Future<Response> socialLogin(String provider, String idToken,
      {String? firstName,
      String? lastName,
      String? phone,
      String? street,
      String? zipCode,
      String? city,
      String? email}) {
    return _dio.post('/mobile-auth/social', data: {
      'provider': provider,
      'idToken': idToken,
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (phone != null) 'phone': phone,
      if (street != null) 'street': street,
      if (zipCode != null) 'zipCode': zipCode,
      if (city != null) 'city': city,
      if (email != null) 'email': email,
    });
  }

  Future<Response> refreshToken(String refreshToken) {
    return _dio.post('/mobile-auth/refresh', data: {
      'refreshToken': refreshToken,
    });
  }

  Future<Response> forgotPassword(String email) {
    return _dio.post('/mobile-auth/forgot-password', data: {'email': email});
  }

  Future<Response> changePassword(String currentPassword, String newPassword) {
    return _dio.post('/user/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<Response> logout() {
    return _dio.post('/mobile-auth/logout');
  }

  // ── App Version ──

  Future<Response> checkAppVersion(String platform, String currentVersion) {
    return _dio.get('/mobile-auth/app-version', queryParameters: {
      'platform': platform,
      'currentVersion': currentVersion,
    });
  }

  // ── User Profile ──

  Future<Response> getProfile() => _dio.get('/user/profile');

  Future<Response> updateProfile(Map<String, dynamic> data) {
    return _dio.put('/user/profile', data: data);
  }

  Future<Response> deleteAccount() => _dio.delete('/user/profile');

  // ── FCM & Notifications ──

  Future<Response> saveFcmToken(String fcmToken) {
    return _dio.post('/user/fcm-token', data: {'fcmToken': fcmToken});
  }

  Future<Response> getNotificationSettings() {
    return _dio.get('/user/notification-settings');
  }

  Future<Response> updateNotificationSettings(Map<String, bool> settings) {
    return _dio.put('/user/notification-settings', data: settings);
  }

  Future<Response> getWorkshopNotificationSettings() {
    return _dio.get('/workshop/notification-settings');
  }

  Future<Response> updateWorkshopNotificationSettings(
      Map<String, bool> settings) {
    return _dio.put('/workshop/notification-settings', data: settings);
  }

  // ── Feedback ──

  Future<Response> submitFeedback({
    required int rating,
    String? comment,
  }) {
    return _dio.post('/user/feedback', data: {
      'rating': rating,
      if (comment != null) 'comment': comment,
    });
  }

  // ── Vehicles ──

  Future<Response> getVehicles() => _dio.get('/vehicles');

  Future<Response> createVehicle(Map<String, dynamic> data) {
    return _dio.post('/vehicles', data: data);
  }

  Future<Response> updateVehicle(String id, Map<String, dynamic> data) {
    return _dio.put('/vehicles/$id', data: data);
  }

  Future<Response> deleteVehicle(String id) {
    return _dio.delete('/vehicles/$id');
  }

  Future<Response> getCustomerVehicles() => _dio.get('/customer/vehicles');

  // ── Workshops ──

  Future<Response> searchWorkshops(Map<String, dynamic> params) {
    return _dio.get('/workshops', queryParameters: params);
  }

  Future<Response> getWorkshopDetail(String id) {
    return _dio.get('/workshops/$id');
  }

  Future<Response> searchWorkshopsWithTires(Map<String, dynamic> body) {
    return _dio.post('/customer/direct-booking/search', data: body);
  }

  Future<Response> searchMotorcycleTires(Map<String, dynamic> body) {
    return _dio.post('/customer/direct-booking/motorcycle-search', data: body);
  }

  // ── Available Slots ──

  Future<Response> getAvailableSlots({
    required String workshopId,
    required String date,
    int duration = 60,
  }) {
    return _dio.get('/gcal/available-slots', queryParameters: {
      'workshopId': workshopId,
      'date': date,
      'duration': duration,
    });
  }

  // ── Bookings ──

  Future<Response> getBookings() => _dio.get('/bookings');

  Future<Response> createBooking(Map<String, dynamic> data) {
    return _dio.post('/bookings', data: data);
  }

  Future<Response> createDirectBooking(Map<String, dynamic> data) {
    return _dio.post('/customer/direct-booking/book', data: data);
  }

  Future<Response> cancelBooking(String id) {
    return _dio.patch('/bookings/$id', data: {'status': 'CANCELLED'});
  }

  // ── Payment ──

  Future<Response> createPaymentIntent(Map<String, dynamic> data) {
    return _dio.post('/payment/stripe/create-payment-intent', data: data);
  }

  // ── Reviews ──

  Future<Response> getWorkshopReviews(String workshopId) {
    return _dio.get('/reviews', queryParameters: {'workshopId': workshopId});
  }

  Future<Response> createReview(Map<String, dynamic> data) {
    return _dio.post('/reviews', data: data);
  }

  // ── Dashboard ──

  Future<Response> getDashboardStats() => _dio.get('/dashboard/stats');

  Future<Response> getCO2Stats() => _dio.get('/customer/co2-stats');

  // ── KI-Berater ──

  Future<Response> sendAIChat({
    required String message,
    required List<Map<String, dynamic>> chatHistory,
    String? vehicleId,
    double? latitude,
    double? longitude,
    String? language,
  }) {
    return _dio.post('/ai/chat', data: {
      'message': message,
      'chatHistory': chatHistory,
      'platform': 'app',
      if (vehicleId != null) 'vehicleId': vehicleId,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (language != null) 'language': language,
    });
  }

  // ── TTS Config ──

  Future<Response> getTtsConfig() {
    return _dio.get('/ai/tts-config');
  }
}

/// Interceptor that adds Bearer token and handles 401 refresh flow
class _AuthInterceptor extends Interceptor {
  final ApiClient _client;
  bool _isRefreshing = false;

  _AuthInterceptor(this._client);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    // Don't add token to auth endpoints
    final noTokenPaths = [
      '/mobile-auth/login',
      '/mobile-auth/register',
      '/mobile-auth/social',
      '/mobile-auth/refresh',
      '/mobile-auth/forgot-password',
      '/mobile-auth/app-version',
    ];

    if (!noTokenPaths.any((p) => options.path.contains(p))) {
      final token = await SecureStorage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    _reportServerError(err);

    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;

      try {
        final refreshTokenStr = await SecureStorage.getRefreshToken();
        if (refreshTokenStr == null) {
          _triggerLogout();
          return handler.reject(err);
        }

        final response = await _client.refreshToken(refreshTokenStr);
        final data = response.data;

        // Save new tokens
        await SecureStorage.setAccessToken(data['accessToken']);
        await SecureStorage.setRefreshToken(data['refreshToken']);

        // Retry original request with new token
        err.requestOptions.headers['Authorization'] =
            'Bearer ${data['accessToken']}';
        final retryResponse = await _client.dio.fetch(err.requestOptions);
        return handler.resolve(retryResponse);
      } catch (_) {
        _triggerLogout();
        return handler.reject(err);
      } finally {
        _isRefreshing = false;
      }
    }

    handler.next(err);
  }

  void _reportServerError(DioException err) {
    final statusCode = err.response?.statusCode ?? 0;
    if (statusCode >= 500) {
      CrashReportingService().reportError(
        err,
        err.stackTrace,
        context:
            'API ${err.requestOptions.method} ${err.requestOptions.path} → $statusCode',
      );
    }
  }

  void _triggerLogout() {
    SecureStorage.clearAll();
    _client.onAuthError?.call();
  }
}
