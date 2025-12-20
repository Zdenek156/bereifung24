import 'package:dio/dio.dart';
import '../core/constants/app_constants.dart';

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token if available
          final token = await _getAuthToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Handle errors
          print('API Error: ${error.message}');
          return handler.next(error);
        },
      ),
    );
  }

  Future<String?> _getAuthToken() async {
    // TODO: Implement token retrieval from shared preferences
    return null;
  }

  // Auth endpoints (NextAuth)
  Future<Response> login(String email, String password) {
    return _dio.post('/auth/signin', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> register(String email, String password, String name) {
    return _dio.post('/auth/signup', data: {
      'email': email,
      'password': password,
      'name': name,
    });
  }

  Future<Response> googleSignIn(String idToken) {
    return _dio.post('/auth/google', data: {
      'idToken': idToken,
    });
  }

  // Requests endpoints (Tire Requests)
  Future<Response> getRequests() {
    return _dio.get('/customer/requests');
  }

  Future<Response> createRequest(Map<String, dynamic> data) {
    return _dio.post('/tire-requests', data: data);
  }

  Future<Response> getRequestById(String id) {
    return _dio.get('/tire-requests/$id');
  }

  // Appointments endpoints (Bookings)
  Future<Response> getAppointments() {
    return _dio.get('/customer/bookings');
  }

  Future<Response> getAppointmentById(String id) {
    return _dio.get('/bookings/$id');
  }
  
  Future<Response> acceptOffer(String offerId) {
    return _dio.post('/offers/$offerId/accept');
  }

  // Vehicles endpoints
  Future<Response> getVehicles() {
    return _dio.get('/customer/vehicles');
  }

  Future<Response> addVehicle(Map<String, dynamic> data) {
    return _dio.post('/vehicles', data: data);
  }

  Future<Response> updateVehicle(String id, Map<String, dynamic> data) {
    return _dio.put('/vehicles/$id', data: data);
  }

  Future<Response> deleteVehicle(String id) {
    return _dio.delete('/vehicles/$id');
  }

  // Rating endpoints (Reviews)
  Future<Response> submitRating(String bookingId, int rating, String comment) {
    return _dio.post('/reviews', data: {
      'bookingId': bookingId,
      'rating': rating,
      'comment': comment,
    });
  }
  
  // Offers endpoints
  Future<Response> getOffersForRequest(String requestId) {
    return _dio.get('/tire-requests/$requestId/offers');
  }
}