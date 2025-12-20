import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/detailed_models.dart';

class ApiService {
  final Dio _dio;
  static const String baseUrl = 'http://localhost:3000/api';

  ApiService() : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token from shared preferences
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        options.headers['Content-Type'] = 'application/json';
        return handler.next(options);
      },
      onError: (error, handler) {
        print('API Error: ${error.message}');
        return handler.next(error);
      },
    ));
  }

  // ==================== TIRE REQUESTS ====================
  
  /// GET /api/tire-requests - Get all tire requests for customer
  Future<TireRequestsResponse> getTireRequests() async {
    try {
      final response = await _dio.get('/tire-requests');
      return TireRequestsResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// GET /api/tire-requests/[id] - Get single tire request with offers
  Future<TireRequest> getTireRequestById(String id) async {
    try {
      final response = await _dio.get('/tire-requests/$id');
      return TireRequest.fromJson(response.data['request']);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/tire-requests - Create new tire request
  Future<TireRequest> createTireRequest({
    String? vehicleId,
    required String season,
    required int width,
    required int aspectRatio,
    required int diameter,
    int? loadIndex,
    String? speedRating,
    required bool isRunflat,
    required int quantity,
    String? preferredBrands,
    String? additionalNotes,
    required String needByDate,
    required String zipCode,
    required int radiusKm,
  }) async {
    try {
      final response = await _dio.post('/tire-requests', data: {
        'vehicleId': vehicleId,
        'season': season,
        'width': width,
        'aspectRatio': aspectRatio,
        'diameter': diameter,
        'loadIndex': loadIndex,
        'speedRating': speedRating,
        'isRunflat': isRunflat,
        'quantity': quantity,
        'preferredBrands': preferredBrands,
        'additionalNotes': additionalNotes,
        'needByDate': needByDate,
        'zipCode': zipCode,
        'radiusKm': radiusKm,
      });
      return TireRequest.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/tire-requests/wheel-change - Create wheel change request
  Future<TireRequest> createWheelChangeRequest({
    String? vehicleId,
    required bool hasWheels,
    required bool needsBalancing,
    required bool needsStorage,
    String? preferredDate,
    required int radiusKm,
    String? additionalNotes,
  }) async {
    try {
      final response = await _dio.post('/tire-requests/wheel-change', data: {
        'vehicleId': vehicleId,
        'hasWheels': hasWheels,
        'needsBalancing': needsBalancing,
        'needsStorage': needsStorage,
        'preferredDate': preferredDate,
        'radiusKm': radiusKm,
        'additionalNotes': additionalNotes,
      });
      return TireRequest.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/tire-requests/brakes - Create brake service request
  Future<TireRequest> createBrakeRequest({
    String? vehicleId,
    required String frontAxle, // none, pads, discs, pads_and_discs
    required String rearAxle, // none, pads, discs, pads_and_discs
    String? needByDate,
    required int radiusKm,
    String? additionalNotes,
  }) async {
    try {
      final response = await _dio.post('/tire-requests/brakes', data: {
        'vehicleId': vehicleId,
        'frontAxle': frontAxle,
        'rearAxle': rearAxle,
        'needByDate': needByDate,
        'radiusKm': radiusKm,
        'additionalNotes': additionalNotes,
      });
      return TireRequest.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/tire-requests/battery - Create battery service request
  Future<TireRequest> createBatteryRequest({
    String? vehicleId,
    required String serviceType, // check, replace
    String? batteryType,
    String? needByDate,
    required int radiusKm,
    String? additionalNotes,
  }) async {
    try {
      final response = await _dio.post('/tire-requests/battery', data: {
        'vehicleId': vehicleId,
        'serviceType': serviceType,
        'batteryType': batteryType,
        'needByDate': needByDate,
        'radiusKm': radiusKm,
        'additionalNotes': additionalNotes,
      });
      return TireRequest.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/tire-requests/repair - Create tire repair request
  Future<TireRequest> createRepairRequest({
    String? vehicleId,
    required String issueType, // puncture, valve, other
    required String issueDescription,
    required String needByDate,
    required int radiusKm,
    String? additionalNotes,
  }) async {
    try {
      final response = await _dio.post('/tire-requests/repair', data: {
        'vehicleId': vehicleId,
        'issueType': issueType,
        'issueDescription': issueDescription,
        'needByDate': needByDate,
        'radiusKm': radiusKm,
        'additionalNotes': additionalNotes,
      });
      return TireRequest.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/tire-requests/motorcycle - Create motorcycle tire request
  Future<TireRequest> createMotorcycleRequest({
    required String motorcycleMake,
    required String motorcycleModel,
    required String season,
    required Map<String, dynamic> frontTire,
    Map<String, dynamic>? rearTire,
    String? preferredBrands,
    required bool mountOnMotorcycle,
    required String needByDate,
    required int radiusKm,
    String? additionalNotes,
  }) async {
    try {
      final response = await _dio.post('/tire-requests/motorcycle', data: {
        'motorcycleMake': motorcycleMake,
        'motorcycleModel': motorcycleModel,
        'season': season,
        'frontTire': frontTire,
        'rearTire': rearTire,
        'preferredBrands': preferredBrands,
        'mountOnMotorcycle': mountOnMotorcycle,
        'needByDate': needByDate,
        'radiusKm': radiusKm,
        'additionalNotes': additionalNotes,
      });
      return TireRequest.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ==================== OFFERS ====================
  
  /// GET /api/offers/[id] - Get offer details
  Future<Offer> getOfferById(String id) async {
    try {
      final response = await _dio.get('/offers/$id');
      return Offer.fromJson(response.data['offer']);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/offers/[id]/accept - Accept an offer
  Future<Map<String, dynamic>> acceptOffer({
    required String offerId,
    bool wantsStorage = false,
    List<String>? selectedTireOptionIds,
    int? selectedQuantity,
  }) async {
    try {
      final response = await _dio.post('/offers/$offerId/accept', data: {
        'wantsStorage': wantsStorage,
        'selectedTireOptionIds': selectedTireOptionIds ?? [],
        'selectedQuantity': selectedQuantity,
      });
      return response.data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ==================== BOOKINGS ====================
  
  /// GET /api/bookings - Get all bookings for customer
  Future<BookingsResponse> getBookings() async {
    try {
      final response = await _dio.get('/bookings');
      return BookingsResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/bookings - Create or update booking with appointment time
  Future<Booking> createBooking({
    required String offerId,
    required String workshopId,
    required String appointmentDate, // ISO String
    String? appointmentEndTime, // ISO String
    String? paymentMethod,
    String? customerMessage,
    String? selectedTireOptionId,
  }) async {
    try {
      final response = await _dio.post('/bookings', data: {
        'offerId': offerId,
        'workshopId': workshopId,
        'appointmentDate': appointmentDate,
        'appointmentEndTime': appointmentEndTime,
        'paymentMethod': paymentMethod ?? 'PAY_ONSITE',
        'customerMessage': customerMessage,
        'selectedTireOptionId': selectedTireOptionId,
      });
      return Booking.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// GET /api/workshops/[id]/slots - Get available time slots
  Future<TimeSlotsResponse> getAvailableSlots({
    required String workshopId,
    required String date, // YYYY-MM-DD
    required int duration, // minutes
  }) async {
    try {
      final response = await _dio.get(
        '/workshops/$workshopId/slots',
        queryParameters: {
          'date': date,
          'duration': duration,
        },
      );
      return TimeSlotsResponse.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ==================== VEHICLES ====================
  
  /// GET /api/vehicles - Get customer vehicles
  Future<List<Vehicle>> getVehicles() async {
    try {
      final response = await _dio.get('/vehicles');
      return (response.data['vehicles'] as List)
          .map((e) => Vehicle.fromJson(e))
          .toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST /api/vehicles - Add new vehicle
  Future<Vehicle> addVehicle({
    required String make,
    required String model,
    required int year,
    String? licensePlate,
    String? vin,
  }) async {
    try {
      final response = await _dio.post('/vehicles', data: {
        'make': make,
        'model': model,
        'year': year,
        'licensePlate': licensePlate,
        'vin': vin,
      });
      return Vehicle.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// DELETE /api/vehicles/[id] - Delete vehicle
  Future<void> deleteVehicle(String id) async {
    try {
      await _dio.delete('/vehicles/$id');
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ==================== ERROR HANDLING ====================
  
  String _handleError(dynamic error) {
    if (error is DioException) {
      if (error.response != null) {
        final data = error.response!.data;
        if (data is Map && data.containsKey('error')) {
          return data['error'] as String;
        }
        return 'Server Fehler: ${error.response!.statusCode}';
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'Verbindungs-Timeout. Bitte prüfen Sie Ihre Internetverbindung.';
      }
      if (error.type == DioExceptionType.connectionError) {
        return 'Keine Verbindung zum Server möglich.';
      }
      return 'Netzwerkfehler: ${error.message}';
    }
    return 'Ein unerwarteter Fehler ist aufgetreten: $error';
  }
}
